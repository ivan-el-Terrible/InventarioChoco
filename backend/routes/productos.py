#logica para para agregar productos 


from flask import Blueprint, request, jsonify
from database.database import get_db


productos_bp = Blueprint("productos", __name__)


@productos_bp.route("/productos", methods=["GET"])
def obtener_productos():

    db = get_db()

    productos = db.execute("""
        SELECT
            p.id,
            p.codOrigi,
            p.codigo,
            p.nombre,
            p.tipo,
            p.descripcion,
            p.marca,
            p.stock,
            p.precio_compra,
            p.precio_venta,
            p.id_proveedor,
            pr.nomEmpresa AS proveedor      
        FROM productos p
        LEFT JOIN proveedores pr
            ON p.id_proveedor = pr.id    
        ORDER BY p.id DESC
    """).fetchall()

    db.close()

    return jsonify([dict(p) for p in productos])

"""ahora agregaremos los productos """
@productos_bp.route("/productos", methods=["POST"])
def crear_producto():

    data = request.get_json()

    db = get_db()

    try:

        cursor = db.execute("""
            INSERT INTO productos (
                codOrigi,
                codigo,
                nombre,
                tipo,
                descripcion,
                marca,
                stock,
                precio_compra,
                precio_venta,
                id_proveedor
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.get("codOrigi"),
            data.get("codigo"),
            data["nombre"],
            data.get("tipo"),
            data.get("descripcion"),
            data.get("marca"),
            data.get("stock", 0),
            data.get("precio_compra", 0),
            data.get("precio_venta", 0),
            data.get("id_proveedor")
        ))

        db.commit()

        producto_id = cursor.lastrowid

        return jsonify({
            "mensaje": "Producto creado correctamente",
            "id": producto_id
        }), 201

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        db.close()