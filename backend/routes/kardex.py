# Rutas de Kardex: acceso exclusivo para administradores.
from flask import Blueprint, jsonify
from auth import roles_permitidos
from database.database import get_db

kardex_bp = Blueprint('kardex', __name__)

CAMPOS = '''
    SELECT k.id, k.id_producto, p.codOrigi, p.codigo,
           p.nombre AS producto, k.fecha, k.tipo_movimiento,
           k.motivo, k.referencia_id, k.cantidad,
           k.stock_anterior, k.stock_nuevo, k.precio_unitario
    FROM kardex k
    INNER JOIN productos p ON k.id_producto = p.id
'''

@kardex_bp.route('/kardex', methods=['GET'])
@roles_permitidos('admin')
def obtener_kardex():
    db = get_db()
    try:
        movimientos = db.execute(CAMPOS + ' ORDER BY k.id DESC').fetchall()
        return jsonify([dict(m) for m in movimientos])
    finally:
        db.close()

@kardex_bp.route('/kardex/producto/<int:id_producto>', methods=['GET'])
@roles_permitidos('admin')
def kardex_producto(id_producto):
    db = get_db()
    try:
        movimientos = db.execute(
            CAMPOS + ' WHERE k.id_producto = ? ORDER BY k.id DESC',
            (id_producto,)
        ).fetchall()
        return jsonify([dict(m) for m in movimientos])
    finally:
        db.close()
