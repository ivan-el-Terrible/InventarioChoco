# Rutas de gastos: cada gasto pertenece a una tienda y a quien lo registró.
# Admin y vendedor pueden registrarlos; cada uno en su tienda.
from flask import Blueprint, request, jsonify, session

from database.database import get_db, tienda_actual, tienda_param
from auth import roles_permitidos

gastos_bp = Blueprint('gastos', __name__)


def _tienda_registro(db, datos):
    """Tienda donde se registra el gasto: la elegida por el admin o la suya."""
    if session.get('rol') == 'admin':
        solicitada = datos.get('id_tienda')
        try:
            solicitada = int(solicitada) if solicitada else None
        except (TypeError, ValueError):
            solicitada = None
        if solicitada:
            return tienda_param(db, 'admin', None, solicitada)
        return tienda_actual(db, session.get('id_tienda'))
    return tienda_actual(db, session.get('id_tienda'))


@gastos_bp.route('/gastos', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def obtener_gastos():
    db = get_db()
    try:
        id_tienda = tienda_param(
            db,
            session.get('rol'),
            session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )
        filas = db.execute('''
            SELECT g.id, g.fecha, g.concepto, g.descripcion, g.monto,
                   g.estado, g.id_tienda, t.nombre AS tienda,
                   g.id_usuario, u.nombre AS registrado_por
            FROM gastos g
            INNER JOIN tiendas t ON t.id = g.id_tienda
            INNER JOIN usuarios u ON u.id = g.id_usuario
            WHERE g.id_tienda = ?
            ORDER BY g.id DESC
        ''', (id_tienda,)).fetchall()
        return jsonify([dict(f) for f in filas])
    finally:
        db.close()


@gastos_bp.route('/gastos', methods=['POST'])
@roles_permitidos('admin', 'vendedor')
def registrar_gasto():
    datos = request.get_json(silent=True) or {}

    concepto = str(datos.get('concepto') or '').strip()
    descripcion = str(datos.get('descripcion') or '').strip() or None

    try:
        monto = float(datos.get('monto'))
    except (TypeError, ValueError):
        monto = None

    if not concepto:
        return jsonify({'error': 'El concepto del gasto es obligatorio'}), 400
    if monto is None or monto <= 0:
        return jsonify({'error': 'El monto debe ser un número mayor a cero'}), 400

    db = get_db()
    try:
        id_tienda = _tienda_registro(db, datos)
        cursor = db.execute('''
            INSERT INTO gastos (id_tienda, id_usuario, concepto, descripcion, monto)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            id_tienda,
            session['usuario_id'],
            concepto,
            descripcion,
            round(monto, 2)
        ))
        db.commit()
        return jsonify({
            'mensaje': 'Gasto registrado correctamente',
            'id': cursor.lastrowid
        }), 201
    except Exception:
        db.rollback()
        return jsonify({'error': 'No se pudo registrar el gasto'}), 500
    finally:
        db.close()


@gastos_bp.route('/gastos/resumen', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def resumen_gastos():
    """Totales de la tienda seleccionada (vigentes y anulados)."""
    db = get_db()
    try:
        id_tienda = tienda_param(
            db,
            session.get('rol'),
            session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )
        fila = db.execute('''
            SELECT COUNT(*) AS cantidad,
                   COALESCE(SUM(CASE WHEN estado = 'vigente' THEN monto END), 0) AS total,
                   COALESCE(SUM(CASE WHEN estado = 'anulado' THEN monto END), 0) AS anulado
            FROM gastos
            WHERE id_tienda = ?
        ''', (id_tienda,)).fetchone()
        return jsonify({
            'id_tienda': id_tienda,
            'cantidad': int(fila['cantidad'] or 0),
            'total': round(float(fila['total'] or 0), 2),
            'anulado': round(float(fila['anulado'] or 0), 2)
        })
    finally:
        db.close()
