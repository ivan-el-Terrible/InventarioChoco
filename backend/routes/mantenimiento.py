# Rutas de mantenimiento: poda de registros antiguos para que la BD no crezca.
# Elimina ventas (y su detalle), gastos y kardex pasados los 3 meses.
# NUNCA toca inventario, usuarios, productos ni tiendas.
from flask import Blueprint, jsonify, request

from database.database import get_db
from auth import roles_permitidos

mantenimiento_bp = Blueprint('mantenimiento', __name__)

MESES_PODA = 3


def _corte(meses=MESES_PODA):
    """Fecha límite: todo lo anterior a este momento se elimina."""
    return f'-{int(meses)} months'


def _consultar_previa(db, meses):
    """Cuántos registros se eliminarían si se ejecuta la poda ahora."""
    corte = db.execute(
        "SELECT datetime('now', ?)", (_corte(meses),)
    ).fetchone()[0]
    fila = db.execute('''
        SELECT
            (SELECT COUNT(*) FROM ventas WHERE fecha < ?) AS ventas,
            (SELECT COUNT(*) FROM detalle_ventas
                WHERE id_venta IN (SELECT id FROM ventas WHERE fecha < ?)
            ) AS detalle,
            (SELECT COUNT(*) FROM gastos WHERE fecha < ?) AS gastos,
            (SELECT COUNT(*) FROM kardex WHERE fecha < ?) AS kardex
    ''', (corte, corte, corte, corte)).fetchone()
    return {
        'meses': int(meses),
        'fecha_corte': corte,
        'ventas': fila['ventas'],
        'detalle_ventas': fila['detalle'],
        'gastos': fila['gastos'],
        'kardex': fila['kardex'],
    }


@mantenimiento_bp.route('/mantenimiento/reglas', methods=['GET'])
@roles_permitidos('admin')
def ver_reglas():
    """Previsualización: qué y cuánto se borraría con la poda de 3 meses."""
    db = get_db()
    try:
        return jsonify(_consultar_previa(db, MESES_PODA))
    finally:
        db.close()


@mantenimiento_bp.route('/mantenimiento/purgar', methods=['POST'])
@roles_permitidos('admin')
def purgar():
    """Elimina ventas, gastos y kardex con más de 3 meses de antigüedad.

    Orden de borrado respetando las claves foráneas:
    1. detalle_ventas de las ventas viejas (primero las devoluciones)
    2. ventas viejas (primero las devoluciones, luego las ventas)
    3. gastos viejos
    4. kardex viejo
    Inventario y usuarios no se tocan.
    """
    data = request.get_json(silent=True) or {}
    try:
        meses = int(data.get('meses') or MESES_PODA)
    except (TypeError, ValueError):
        meses = MESES_PODA
    meses = max(1, meses)

    db = get_db()
    try:
        previa = _consultar_previa(db, meses)
        corte = previa['fecha_corte']

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

        # 2) Ventas: se conservan las referenciadas por una devolución viva.
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

        # 4) Kardex viejo (historial, sin claves foráneas hacia ventas).
        kar = db.execute(
            'DELETE FROM kardex WHERE fecha < ?', (corte,)
        ).rowcount

        db.commit()

        return jsonify({
            'mensaje': (
                f'Purga de más de {meses} meses completada. '
                'Inventario y usuarios no se modificaron.'
            ),
            'fecha_corte': corte,
            'eliminado': {
                'ventas': ven_dev + ven_ven,
                'detalle_ventas': det_dev + det_ven,
                'gastos': gas,
                'kardex': kar,
            },
            'conservado': {
                'inventario': 'siempre',
                'usuarios': 'siempre',
                'productos': 'siempre',
            },
        })
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
