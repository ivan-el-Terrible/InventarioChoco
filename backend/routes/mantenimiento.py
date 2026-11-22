# Rutas de mantenimiento: poda de registros antiguos para que la BD no crezca.
#
# REGLA (automatica, sin preguntar):
#   - Pasados los 3 meses se eliminan solos: ventas (con su detalle), gastos,
#     kardex y usuarios sin actividad hace 3 meses (vendedores y admins,
#     excepto el ultimo administrador activo, que siempre se conserva).
#     La revision corre cada vez que un admin abre la app
#     (GET /mantenimiento/estado).
#   - FALTANDO 5 DIAS el banner avisa al admin que saque su copia (Excel)
#     y le permite purgar antes a mano con el boton.
#   - NUNCA se toca inventario, productos ni tiendas.
from flask import Blueprint, jsonify, request

from database.database import get_db
from auth import roles_permitidos

mantenimiento_bp = Blueprint('mantenimiento', __name__)

MESES_PODA = 3
DIAS_AVISO = 5


def _corte(meses=MESES_PODA):
    """Fecha limite: todo lo anterior a este momento se elimina."""
    return f'-{int(meses)} months'


def _fecha(db, *modificadores):
    """datetime('now', ...) con los modificadores dados."""
    marcas = ','.join('?' * len(modificadores))
    return db.execute(
        f"SELECT datetime('now', {marcas})", modificadores
    ).fetchone()[0]


def _referencia(alias):
    """Ultima venta del vendedor (o su alta si nunca vendio)."""
    return f'''COALESCE(
        (SELECT MAX(v.fecha) FROM ventas v WHERE v.id_vendedor = {alias}.id),
        {alias}.fecha_creacion
    )'''


def _condicion_usuario(alias, limite):
    """Condicion de usuario inactivo: sin ventas por mas de `limite`.

    Aplica a vendedores Y administradores sin actividad hace 3 meses.
    Seguridad: nunca se elimina al ultimo administrador activo, para que
    siempre quede alguien con acceso al sistema.
    """
    return f'''
        {alias}.rol IN ('vendedor', 'admin')
        AND {_referencia(alias)} < '{limite}'
        AND NOT EXISTS (
            SELECT 1 FROM ventas v2 WHERE v2.id_vendedor = {alias}.id
        )
        AND (
            {alias}.rol = 'vendedor'
            OR (
                SELECT COUNT(*) FROM usuarios u3
                WHERE u3.rol = 'admin' AND u3.activo = 1
            ) > 1
        )
    '''


def _consultar_previa(db, meses):
    """Cuanto se eliminaria si se ejecuta la poda con el boton ahora.

    Usa el mismo corte que el aviso: lo que YA cumplio los 3 meses mas lo
    que vence dentro de los DIAS_AVISO dias (lo que muestra el banner).
    """
    corte = _fecha(db, _corte(meses), f'+{DIAS_AVISO} days')
    fila = db.execute(f'''
        SELECT
            (SELECT COUNT(*) FROM ventas WHERE fecha < ?) AS ventas,
            (SELECT COUNT(*) FROM detalle_ventas
                WHERE id_venta IN (SELECT id FROM ventas WHERE fecha < ?)
            ) AS detalle,
            (SELECT COUNT(*) FROM gastos WHERE fecha < ?) AS gastos,
            (SELECT COUNT(*) FROM kardex WHERE fecha < ?) AS kardex,
            (SELECT COUNT(*) FROM usuarios u WHERE {_condicion_usuario('u', corte)}
            ) AS usuarios
    ''', (corte, corte, corte, corte)).fetchone()
    return {
        'meses': int(meses),
        'fecha_corte': corte,
        'ventas': fila['ventas'],
        'detalle_ventas': fila['detalle'],
        'gastos': fila['gastos'],
        'kardex': fila['kardex'],
        'usuarios_inactivos': fila['usuarios'],
    }


def _ejecutar_poda(db, corte):
    """Borra todo lo anterior al corte. Devuelve los conteos.

    Orden respetando las claves foraneas:
    1. detalle_ventas de las ventas viejas (primero el de devoluciones)
    2. ventas viejas (se conservan las que una devolucion viva referencia)
    3. gastos viejos
    4. kardex viejo
    5. vendedores sin ventas ya cumplidos los 3 meses
    """
    # 1) Detalle: primero el de las devoluciones viejas, luego el resto.
    det_dev = db.execute('''
        DELETE FROM detalle_ventas
        WHERE id_venta IN (
                SELECT id FROM ventas
                WHERE fecha < ? AND tipo = 'devolucion'
              )
          AND id NOT IN (
                SELECT id_detalle_origen FROM detalle_ventas
                WHERE id_detalle_origen IS NOT NULL
              )
    ''', (corte,)).rowcount

    det_ven = db.execute('''
        DELETE FROM detalle_ventas
        WHERE id_venta IN (SELECT id FROM ventas WHERE fecha < ?)
          AND id NOT IN (
                SELECT id_detalle_origen FROM detalle_ventas
                WHERE id_detalle_origen IS NOT NULL
              )
    ''', (corte,)).rowcount

    # 2) Ventas: se conservan las referenciadas por una devolucion viva.
    ven_dev = db.execute('''
        DELETE FROM ventas
        WHERE fecha < ? AND tipo = 'devolucion'
          AND id NOT IN (
                SELECT id_venta_origen FROM ventas
                WHERE id_venta_origen IS NOT NULL
              )
    ''', (corte,)).rowcount

    ven_ven = db.execute('''
        DELETE FROM ventas
        WHERE fecha < ?
          AND id NOT IN (
                SELECT id_venta_origen FROM ventas
                WHERE id_venta_origen IS NOT NULL
              )
    ''', (corte,)).rowcount

    # 3) Gastos viejos (nadie los referencia).
    gas = db.execute(
        'DELETE FROM gastos WHERE fecha < ?', (corte,)
    ).rowcount

    # 4) Kardex viejo (historial).
    kar = db.execute(
        'DELETE FROM kardex WHERE fecha < ?', (corte,)
    ).rowcount

    # 5) Usuarios (vendedores y administradores) que ya no tienen ventas
    #    hace 3 meses (y sin ventas vivas despues de la poda). El ultimo
    #    administrador activo nunca se toca.
    usu = db.execute(
        f'DELETE FROM usuarios WHERE {_condicion_usuario("usuarios", corte)}'
    ).rowcount

    return {
        'ventas': ven_dev + ven_ven,
        'detalle_ventas': det_dev + det_ven,
        'gastos': gas,
        'kardex': kar,
        'usuarios': usu,
    }


@mantenimiento_bp.route('/mantenimiento/reglas', methods=['GET'])
@roles_permitidos('admin')
def ver_reglas():
    """Previsualizacion manual: que y cuanto se borraria ahora."""
    db = get_db()
    try:
        return jsonify(_consultar_previa(db, MESES_PODA))
    finally:
        db.close()


@mantenimiento_bp.route('/mantenimiento/estado', methods=['GET'])
@roles_permitidos('admin')
def estado_purga():
    """Purga AUTOMATICA + aviso con 5 dias de anticipacion.

    El banner del admin llama a esta ruta al abrir la app (y cada minuto):
    primero se elimina sin preguntar lo que ya cumplio los 3 meses, luego
    se informa cuanto hay en la ventana de aviso (se eliminara solo dentro
    de los proximos DIAS_AVISO dias) para que el admin saque su copia.
    """
    db = get_db()
    try:
        corte = _fecha(db, _corte())
        auto_eliminado = _ejecutar_poda(db, corte)
        db.commit()

        ventana = _fecha(db, _corte(), f'+{DIAS_AVISO} days')
        fila = db.execute(f'''
            SELECT
                (SELECT COUNT(*) FROM ventas
                    WHERE fecha >= ? AND fecha < ?) AS ventas,
                (SELECT COUNT(*) FROM gastos
                    WHERE fecha >= ? AND fecha < ?) AS gastos,
                (SELECT COUNT(*) FROM kardex
                    WHERE fecha >= ? AND fecha < ?) AS kardex,
                (SELECT COUNT(*) FROM usuarios u
                    WHERE {_condicion_usuario('u', ventana)}
                ) AS usuarios
        ''', (corte, ventana, corte, ventana, corte, ventana)).fetchone()

        return jsonify({
            'meses': MESES_PODA,
            'dias_aviso': DIAS_AVISO,
            'fecha_corte': corte,
            'fecha_limite': ventana,
            'auto_eliminado': auto_eliminado,
            'por_vencer': {
                'ventas': fila['ventas'],
                'gastos': fila['gastos'],
                'kardex': fila['kardex'],
                'usuarios': fila['usuarios'],
            },
        })
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@mantenimiento_bp.route('/mantenimiento/copia', methods=['GET'])
@roles_permitidos('admin')
def copia_seguridad():
    """Datos proximos a purgarse, para la copia Excel del administrador.

    Incluye lo ya cumplido (por si no paso nadie por /estado) y lo que
    vence dentro de la ventana de aviso.
    """
    db = get_db()
    try:
        corte = _fecha(db, _corte())
        ventana = _fecha(db, _corte(), f'+{DIAS_AVISO} days')

        ventas = db.execute('''
            SELECT v.id, v.fecha, v.tipo, v.nombre_cliente, v.total,
                   v.forma_pago, v.estado,
                   u.nombre AS vendedor, t.nombre AS tienda
            FROM ventas v
            LEFT JOIN usuarios u ON u.id = v.id_vendedor
            LEFT JOIN tiendas t ON t.id = v.id_tienda
            WHERE v.fecha < ?
            ORDER BY v.fecha
        ''', (ventana,)).fetchall()

        detalle = db.execute('''
            SELECT d.id_venta, d.id_producto, p.nombre AS producto, p.codigo,
                   d.cantidad, d.precio_venta_real, d.costo_unitario, d.sub_total
            FROM detalle_ventas d
            INNER JOIN ventas v ON v.id = d.id_venta
            LEFT JOIN productos p ON p.id = d.id_producto
            WHERE v.fecha < ?
            ORDER BY v.fecha
        ''', (ventana,)).fetchall()

        gastos = db.execute('''
            SELECT g.fecha, g.concepto, g.descripcion, g.monto, g.estado,
                   t.nombre AS tienda, u.nombre AS registrado_por
            FROM gastos g
            LEFT JOIN tiendas t ON t.id = g.id_tienda
            LEFT JOIN usuarios u ON u.id = g.id_usuario
            WHERE g.fecha < ?
            ORDER BY g.fecha
        ''', (ventana,)).fetchall()

        kardex = db.execute('''
            SELECT k.id_producto, k.fecha, p.nombre AS producto, p.codigo,
                   k.tipo_movimiento, k.motivo, k.cantidad,
                   k.stock_anterior, k.stock_nuevo, k.costo_unitario
            FROM kardex k
            LEFT JOIN productos p ON p.id = k.id_producto
            WHERE k.fecha < ?
            ORDER BY k.fecha
        ''', (ventana,)).fetchall()

        usuarios = db.execute(f'''
            SELECT u.id, u.nombre, u.email, u.fecha_creacion,
                   (SELECT MAX(v.fecha) FROM ventas v WHERE v.id_vendedor = u.id)
                       AS ultima_venta
            FROM usuarios u
            WHERE {_condicion_usuario('u', ventana)}
            ORDER BY u.nombre
        ''').fetchall()

        return jsonify({
            'fecha_corte': corte,
            'fecha_limite': ventana,
            'ventas': [dict(f) for f in ventas],
            'detalle_ventas': [dict(f) for f in detalle],
            'gastos': [dict(f) for f in gastos],
            'kardex': [dict(f) for f in kardex],
            'usuarios': [dict(f) for f in usuarios],
        })
    finally:
        db.close()


@mantenimiento_bp.route('/mantenimiento/purgar', methods=['POST'])
@roles_permitidos('admin')
def purgar():
    """Purga manual (boton "Eliminar ahora"): lo mismo que la automatica.

    Si el admin lo presiona, no espera a que se cumplan los 3 meses.
    """
    data = request.get_json(silent=True) or {}
    try:
        meses = int(data.get('meses') or MESES_PODA)
    except (TypeError, ValueError):
        meses = MESES_PODA
    meses = max(1, meses)

    db = get_db()
    try:
        # El boton no espera: borra lo ya cumplido y lo que vence en los
        # proximos DIAS_AVISO dias (exactamente lo que anuncia el aviso).
        corte = _fecha(db, _corte(meses), f'+{DIAS_AVISO} days')
        eliminado = _ejecutar_poda(db, corte)
        db.commit()

        return jsonify({
            'mensaje': (
                'Purga manual completada: lo que ya cumplio los 3 meses y '
                'lo que vencia en los proximos dias. Inventario, productos '
                'y tiendas no se modificaron.'
            ),
            'fecha_corte': corte,
            'eliminado': eliminado,
            'conservado': {
                'inventario': 'siempre',
                'productos': 'siempre',
                'tiendas': 'siempre',
                'nota_usuarios': (
                    'Se eliminan vendedores y administradores sin ventas '
                    'de hace 3 meses, pero siempre queda al menos un '
                    'administrador activo.'
                ),
            },
        })
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
