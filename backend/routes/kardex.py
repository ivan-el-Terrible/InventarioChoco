# Rutas de Kardex: acceso exclusivo para administradores.
from flask import Blueprint, jsonify, request, session
from auth import roles_permitidos
from database.database import get_db, tienda_param

kardex_bp = Blueprint('kardex', __name__)

# Se mantienen los nombres antiguos del frontend (codOrigi, precio_unitario).
CAMPOS = '''
    SELECT k.id, k.id_producto, p.cod_origen AS codOrigi, p.cod_origen,
           p.codigo, p.nombre AS producto, k.fecha, k.tipo_movimiento,
           k.motivo, k.referencia_id, k.cantidad,
           k.stock_anterior, k.stock_nuevo,
           k.costo_unitario AS precio_unitario, k.costo_unitario
    FROM kardex k
    INNER JOIN productos p ON k.id_producto = p.id
    WHERE k.id_tienda = ?
'''

@kardex_bp.route('/kardex', methods=['GET'])
@roles_permitidos('admin')
def obtener_kardex():
    db = get_db()
    try:
        # El administrador puede elegir la tienda cuyo kardex quiere ver.
        id_tienda = tienda_param(
            db, 'admin', session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )
        movimientos = db.execute(
            CAMPOS + ' ORDER BY k.id DESC', (id_tienda,)
        ).fetchall()
        return jsonify([dict(m) for m in movimientos])
    finally:
        db.close()

@kardex_bp.route('/kardex/producto/<int:id_producto>', methods=['GET'])
@roles_permitidos('admin')
def kardex_producto(id_producto):
    db = get_db()
    try:
        id_tienda = tienda_param(
            db, 'admin', session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )
        movimientos = db.execute(
            CAMPOS + ' AND k.id_producto = ? ORDER BY k.id DESC',
            (id_tienda, id_producto)
        ).fetchall()
        return jsonify([dict(m) for m in movimientos])
    finally:
        db.close()
