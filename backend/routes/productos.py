#logica para para agregar productos 
from auth import roles_permitidos

from flask import Blueprint, request, jsonify, session
from database.database import get_db


productos_bp = Blueprint("productos", __name__)

@productos_bp.route("/productos", methods=["GET"])
@roles_permitidos("admin", "vendedor")
def obtener_productos():

    db = get_db()

    try:
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
                p.costo_promedio,
                p.precio_venta,
                p.id_proveedor,
                pr.nomEmpresa AS proveedor
            FROM productos p
            LEFT JOIN proveedores pr
                ON p.id_proveedor = pr.id
            ORDER BY p.id DESC
        """).fetchall()

        es_admin = session.get("rol") == "admin"

        resultado = []

        for producto in productos:
            datos = dict(producto)

            if not es_admin:
                datos.pop("precio_compra", None)
                datos.pop("costo_promedio", None)
                datos.pop("proveedor", None)
                datos.pop("id_proveedor", None)

            resultado.append(datos)

        return jsonify(resultado), 200

    finally:
        db.close()




"""ahora agregaremos los productos """
@productos_bp.route("/productos", methods=["POST"])
@roles_permitidos("admin")
def crear_producto():

    data = request.get_json()
    
    try:
        stock_inicial = float(data.get("stock", 0))
    except (TypeError, ValueError):
        return jsonify({
            "error": "El stock inicial debe ser un número válido"
        }), 400

    if not stock_inicial.is_integer() or stock_inicial <= 0:
        return jsonify({
            "error": "El stock inicial debe ser un número entero mayor a 0"
        }), 400
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
                costo_promedio,
                precio_venta,
                id_proveedor
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)
            """, (
            data.get("codOrigi"),
            data.get("codigo"),
            data["nombre"],
            data.get("tipo"),
            data.get("descripcion"),
            data.get("marca"),
            stock_inicial,
            data.get("precio_compra", 0),
            data.get("precio_compra", 0),
            data.get("precio_venta", 0),
            data.get("id_proveedor")
        ))

        producto_id = cursor.lastrowid


        db.execute("""
            INSERT INTO kardex (
                id_producto,
                tipo_movimiento,
                motivo,
                referencia_id,
                cantidad,
                stock_anterior,
                stock_nuevo,
                precio_unitario
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                producto_id,
                "entrada",
                "stock_inicial",
                None,
                stock_inicial,
                0,
                stock_inicial,
                float(data.get("precio_compra", 0))
            ))
        db.commit()

        

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

        # =========================================
# AUMENTAR STOCK DE UN PRODUCTO EXISTENTE
# =========================================

@productos_bp.route("/productos/<int:id_producto>/entrada", methods=["POST"])
@roles_permitidos("admin")
def registrar_entrada(id_producto):

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({"error": "Debes enviar datos JSON válidos"}), 400

    try:
        cantidad = float(data.get("cantidad"))
        costo_unitario = float(data.get("costo_unitario"))

        if not cantidad.is_integer() or cantidad <= 0:
            return jsonify({
                "error": "La cantidad debe ser un entero mayor a cero"
            }), 400

        if not (0 <= costo_unitario < float("inf")):
            return jsonify({
                "error": "El costo unitario debe ser válido y no negativo"
            }), 400

    except (TypeError, ValueError, OverflowError):
        return jsonify({
            "error": "Cantidad o costo unitario inválidos"
        }), 400

    db = get_db()

    try:
        db.execute("BEGIN IMMEDIATE")

        producto = db.execute("""
            SELECT id, nombre, stock, precio_compra, costo_promedio
            FROM productos
            WHERE id = ?
        """, (id_producto,)).fetchone()

        if producto is None:
            db.rollback()
            return jsonify({"error": "Producto no encontrado"}), 404

        stock_anterior = float(producto["stock"])
        stock_nuevo = stock_anterior + cantidad

        costo_promedio_anterior = float(
            producto["costo_promedio"] or 0
        )

        if stock_anterior == 0:
            costo_promedio_nuevo = costo_unitario
        else:
            costo_promedio_nuevo = (
                (stock_anterior * costo_promedio_anterior)
                + (cantidad * costo_unitario)
            ) / stock_nuevo
        # Actualizar las existencias y el último costo de compra
        db.execute("""
             UPDATE productos
            SET stock = ?,
                precio_compra = ?,
                costo_promedio = ?
            WHERE id = ?
        """, (
            stock_nuevo,
            costo_unitario,
            costo_promedio_nuevo,
            id_producto
        ))

        # Registrar movimiento de entrada en Kardex
        cursor = db.execute("""
            INSERT INTO kardex (
                id_producto,
                tipo_movimiento,
                motivo,
                referencia_id,
                cantidad,
                stock_anterior,
                stock_nuevo,
                precio_unitario
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            id_producto,
            "entrada",
            "compra",
            None,
            cantidad,
            stock_anterior,
            stock_nuevo,
            costo_unitario
        ))

        db.commit()

        return jsonify({
            "mensaje": "Entrada registrada correctamente",
            "id_kardex": cursor.lastrowid,
            "id_producto": id_producto,
            "stock_anterior": stock_anterior,
            "cantidad": cantidad,
            "stock_nuevo": stock_nuevo,
            "costo_promedio": round(costo_promedio_nuevo, 4),
            "costo_unitario": costo_unitario
        }), 201

    except Exception:
        db.rollback()
        return jsonify({
            "error": "No se pudo registrar la entrada"
        }), 500

    finally:
        db.close()



# ==========================================
# ACTUALIZAR PRECIO DE VENTA
# ==========================================

@productos_bp.route("/productos/<int:id_producto>/precio-venta", methods=["PATCH"])
@roles_permitidos("admin")
def actualizar_precio_venta(id_producto):

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Debes enviar datos JSON válidos"
        }), 400

    try:
        precio_venta = float(data.get("precio_venta"))

        if not (0 <= precio_venta < float("inf")):
            return jsonify({
                "error": "El precio de venta debe ser válido y no negativo"
            }), 400

    except (TypeError, ValueError, OverflowError):
        return jsonify({
            "error": "Precio de venta inválido"
        }), 400

    db = get_db()

    try:
        producto = db.execute("""
            SELECT id, nombre, precio_venta
            FROM productos
            WHERE id = ?
        """, (id_producto,)).fetchone()

        if producto is None:
            return jsonify({
                "error": "Producto no encontrado"
            }), 404

        precio_anterior = producto["precio_venta"]

        db.execute("""
            UPDATE productos
            SET precio_venta = ?
            WHERE id = ?
        """, (
            precio_venta,
            id_producto
        ))

        db.commit()

        return jsonify({
            "mensaje": "Precio de venta actualizado correctamente",
            "id_producto": id_producto,
            "nombre": producto["nombre"],
            "precio_anterior": precio_anterior,
            "precio_nuevo": precio_venta
        }), 200

    except Exception as e:
        db.rollback()
        print("ERROR AL ACTUALIZAR PRECIO:", repr(e))

        return jsonify({
            "error": "No se pudo actualizar el precio de venta"
        }), 500

    finally:
        db.close()