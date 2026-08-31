#logica para generar el kardex
from flask import Blueprint, jsonify
from database.database import get_db


kardex_bp = Blueprint("kardex", __name__)


@kardex_bp.route("/kardex", methods=["GET"])
def obtener_kardex():

    db = get_db()

    movimientos = db.execute("""
        SELECT
            k.id,
            k.id_producto,
            p.nombre AS producto,
            k.fecha,
            k.tipo_movimiento,
            k.motivo,
            k.referencia_id,
            k.cantidad,
            k.stock_anterior,
            k.stock_nuevo,
            k.precio_unitario
        FROM kardex k
        INNER JOIN productos p
            ON k.id_producto = p.id
        ORDER BY k.id DESC
    """).fetchall()

    db.close()

    return jsonify([dict(m) for m in movimientos])


#kardex por producto
@kardex_bp.route("/kardex/producto/<int:id_producto>", methods=["GET"])
def kardex_producto(id_producto):

    db = get_db()

    movimientos = db.execute("""
        SELECT
            k.id,
            p.nombre AS producto,
            k.fecha,
            k.tipo_movimiento,
            k.motivo,
            k.cantidad,
            k.stock_anterior,
            k.stock_nuevo,
            k.precio_unitario
        FROM kardex k
        INNER JOIN productos p
            ON k.id_producto = p.id
        WHERE k.id_producto = ?
        ORDER BY k.id DESC
    """, (id_producto,)).fetchall()

    db.close()

    return jsonify([dict(m) for m in movimientos])
