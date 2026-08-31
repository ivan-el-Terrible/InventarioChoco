#logica de ventas

from flask import Blueprint, request, jsonify
from database.database import get_db


ventas_bp = Blueprint("ventas", __name__)


# =========================================
# MOSTRAR PRODUCTOS DISPONIBLES
# =========================================

@ventas_bp.route("/ventas/productos", methods=["GET"])
def productos_para_venta():

    db = get_db()

    productos = db.execute("""
        SELECT
            id,
            codigo,
            nombre,
            tipo,
            marca,
            stock,
            precio_venta
        FROM productos
        ORDER BY nombre
    """).fetchall()

    db.close()

    return jsonify([dict(p) for p in productos])


# =========================================
# MOSTRAR TODAS LAS VENTAS
# =========================================

@ventas_bp.route("/ventas", methods=["GET"])
def obtener_ventas():

    db = get_db()

    ventas = db.execute("""
        SELECT
            v.id,
            v.fecha,
            v.nombre_cliente,
            v.total,
            v.forma_pago,
            v.id_usuario,
            u.nombre AS vendedor
        FROM ventas v
        LEFT JOIN usuarios u
            ON v.id_usuario = u.id
        ORDER BY v.id DESC
    """).fetchall()

    db.close()

    return jsonify([dict(v) for v in ventas])


# =========================================
# MOSTRAR UNA VENTA
# =========================================

@ventas_bp.route("/ventas/<int:id_venta>", methods=["GET"])
def obtener_venta(id_venta):

    db = get_db()

    venta = db.execute("""
        SELECT
            v.id,
            v.fecha,
            v.nombre_cliente,
            v.total,
            v.forma_pago,
            v.id_usuario,
            u.nombre AS vendedor
        FROM ventas v
        LEFT JOIN usuarios u
            ON v.id_usuario = u.id
        WHERE v.id = ?
    """, (id_venta,)).fetchone()

    if venta is None:
        db.close()

        return jsonify({
            "error": "Venta no encontrada"
        }), 404

    detalles = db.execute("""
        SELECT
            dv.id,
            dv.id_producto,
            p.nombre AS producto,
            dv.cantidad,
            dv.precio_venta_Real,
            dv.subtotal
        FROM detalle_ventas dv
        INNER JOIN productos p
            ON dv.id_producto = p.id
        WHERE dv.id_venta = ?
    """, (id_venta,)).fetchall()

    db.close()

    return jsonify({
        "venta": dict(venta),
        "detalles": [dict(d) for d in detalles]
    })


# =========================================
# REGISTRAR VENTA
# =========================================

@ventas_bp.route("/ventas", methods=["POST"])
def registrar_venta():

    data = request.get_json()

    nombre_cliente = data.get("nombre_cliente")
    forma_pago = data.get("forma_pago")
    id_usuario = data.get("id_usuario")
    detalles = data.get("detalles")

    # -----------------------------------------
    # VALIDACIONES
    # -----------------------------------------

    if not nombre_cliente:
        return jsonify({
            "error": "El nombre del cliente es obligatorio"
        }), 400

    if not id_usuario:
        return jsonify({
            "error": "Debe indicar el usuario que realiza la venta"
        }), 400

    if not detalles or len(detalles) == 0:
        return jsonify({
            "error": "La venta debe tener al menos un producto"
        }), 400

    db = get_db()

    try:

        # -----------------------------------------
        # CREAR CABECERA DE VENTA
        # -----------------------------------------

        cursor = db.execute("""
            INSERT INTO ventas (
                nombre_cliente,
                total,
                forma_pago,
                id_usuario
            )
            VALUES (?, ?, ?, ?)
        """, (
            nombre_cliente,
            0,
            forma_pago,
            id_usuario
        ))

        id_venta = cursor.lastrowid

        total = 0

        # -----------------------------------------
        # PROCESAR PRODUCTOS
        # -----------------------------------------

        for item in detalles:

            id_producto = item.get("id_producto")
            cantidad = item.get("cantidad")

            if not id_producto or not cantidad:
                raise Exception(
                    "Producto o cantidad no especificados"
                )

            cantidad = float(cantidad)

            if cantidad <= 0:
                raise Exception(
                    "La cantidad debe ser mayor a cero"
                )

            # -------------------------------------
            # BUSCAR PRODUCTO
            # -------------------------------------

            producto = db.execute("""
                SELECT
                    id,
                    nombre,
                    stock,
                    precio_venta
                FROM productos
                WHERE id = ?
            """, (id_producto,)).fetchone()

            if producto is None:
                raise Exception(
                    f"El producto {id_producto} no existe"
                )

            # -------------------------------------
            # COMPROBAR STOCK
            # -------------------------------------

            if producto["stock"] < cantidad:

                raise Exception(
                    f"Stock insuficiente para "
                    f"{producto['nombre']}. "
                    f"Disponible: {producto['stock']}"
                )

            # -------------------------------------
            # CALCULAR SUBTOTAL
            # -------------------------------------

            precio = producto["precio_venta"]

            subtotal = cantidad * precio

            total += subtotal

            # -------------------------------------
            # STOCK
            # -------------------------------------

            stock_anterior = producto["stock"]

            stock_nuevo = stock_anterior - cantidad

            # -------------------------------------
            # DETALLE DE VENTA
            # -------------------------------------

            db.execute("""
                INSERT INTO detalle_ventas (
                    id_venta,
                    id_producto,
                    cantidad,
                    precio_venta_Real,
                    subtotal
                )
                VALUES (?, ?, ?, ?, ?)
            """, (
                id_venta,
                id_producto,
                cantidad,
                precio,
                subtotal
            ))

            # -------------------------------------
            # DESCONTAR STOCK
            # -------------------------------------

            db.execute("""
                UPDATE productos
                SET stock = ?
                WHERE id = ?
            """, (
                stock_nuevo,
                id_producto
            ))

            # -------------------------------------
            # REGISTRAR KARDEX
            # -------------------------------------

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
                id_producto,
                "salida",
                "venta",
                id_venta,
                cantidad,
                stock_anterior,
                stock_nuevo,
                precio
            ))

        # -----------------------------------------
        # ACTUALIZAR TOTAL
        # -----------------------------------------

        db.execute("""
            UPDATE ventas
            SET total = ?
            WHERE id = ?
        """, (
            total,
            id_venta
        ))

        # -----------------------------------------
        # CONFIRMAR
        # -----------------------------------------

        db.commit()

        return jsonify({
            "mensaje": "Venta registrada correctamente",
            "id_venta": id_venta,
            "total": total
        }), 201

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:

        db.close()