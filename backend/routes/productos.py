# Logica de productos: en la nube el stock y los precios viven en inventario.
from auth import roles_permitidos

from flask import Blueprint, request, jsonify, session
from database.database import get_db, tienda_actual, tienda_param


productos_bp = Blueprint("productos", __name__)


def _tienda_del_admin(data):
    """Tienda elegida por el admin en el JSON (None = la por defecto)."""
    if session.get("rol") != "admin":
        return None
    valor = (data or {}).get("id_tienda")
    try:
        return int(valor) if valor else None
    except (TypeError, ValueError):
        return None

# Columnas de productos + stock/precios de la tienda actual.
# Se mantienen los nombres antiguos (codOrigi, tipo, ...) para no romper el frontend.
CONSULTA_PRODUCTOS = """
    SELECT
        p.id,
        p.cod_origen AS codOrigi,
        p.cod_origen,
        p.codigo,
        p.nombre,
        p.categoria AS tipo,
        p.categoria,
        p.descripcion,
        p.marca,
        p.unidad,
        p.proveedor,
        p.telefono_proveedor,
        p.activo,
        COALESCE(i.stock, 0) AS stock,
        COALESCE(i.precio_compra, 0) AS precio_compra,
        COALESCE(i.costo_promedio, 0) AS costo_promedio,
        COALESCE(i.precio_venta, 0) AS precio_venta,
        NULL AS id_proveedor
    FROM productos p
    LEFT JOIN inventario i
        ON i.id_producto = p.id AND i.id_tienda = ?
"""


@productos_bp.route("/tiendas", methods=["GET"])
@roles_permitidos("admin")
def obtener_tiendas():
    """Lista las tiendas para los selectores (la principal va primero)."""
    db = get_db()
    try:
        filas = db.execute("""
            SELECT id, nombre, direccion, activo
            FROM tiendas
            WHERE activo = 1
            ORDER BY id
        """).fetchall()
        return jsonify([dict(f) for f in filas])
    finally:
        db.close()


@productos_bp.route("/tiendas", methods=["POST"])
@roles_permitidos("admin")
def crear_tienda():
    """Crea una tienda para poder ver su inventario con el selector."""
    data = request.get_json(silent=True) or {}
    nombre = str(data.get("nombre") or "").strip()
    direccion = str(data.get("direccion") or "").strip() or None
    if not nombre:
        return jsonify({"error": "El nombre de la tienda es obligatorio"}), 400

    db = get_db()
    try:
        db.execute(
            "INSERT INTO tiendas (nombre, direccion) VALUES (?, ?)",
            (nombre, direccion)
        )
        db.commit()
        return jsonify({"mensaje": "Tienda creada correctamente"}), 201
    except Exception:
        db.rollback()
        return jsonify({"error": "Ya existe una tienda con ese nombre"}), 400
    finally:
        db.close()


@productos_bp.route("/tiendas/<int:id_tienda>", methods=["PATCH"])
@roles_permitidos("admin")
def actualizar_tienda(id_tienda):
    """Edita nombre/dirección de una tienda existente."""
    data = request.get_json(silent=True) or {}
    nombre = str(data.get("nombre") or "").strip()
    direccion = str(data.get("direccion") or "").strip() or None

    if not nombre:
        return jsonify({"error": "El nombre de la tienda es obligatorio"}), 400

    db = get_db()
    try:
        existe = db.execute(
            "SELECT id FROM tiendas WHERE id = ?", (id_tienda,)
        ).fetchone()
        if existe is None:
            return jsonify({"error": "La tienda no existe"}), 404

        db.execute(
            "UPDATE tiendas SET nombre = ?, direccion = ? WHERE id = ?",
            (nombre, direccion, id_tienda)
        )
        db.commit()
        return jsonify({"mensaje": "Tienda actualizada correctamente"})
    except Exception:
        db.rollback()
        return jsonify({"error": "Ya existe una tienda con ese nombre"}), 400
    finally:
        db.close()


@productos_bp.route("/productos/<int:id_producto>/proveedor", methods=["PATCH"])
@roles_permitidos("admin")
def actualizar_proveedor(id_producto):
    """Edita proveedor/teléfono del producto (tabla productos)."""
    data = request.get_json(silent=True) or {}
    proveedor = str(data.get("proveedor") or "").strip() or None
    telefono = str(data.get("telefono_proveedor") or "").strip() or None

    db = get_db()
    try:
        existe = db.execute(
            "SELECT id FROM productos WHERE id = ?", (id_producto,)
        ).fetchone()
        if existe is None:
            return jsonify({"error": "El producto no existe"}), 404

        db.execute(
            """
            UPDATE productos
            SET proveedor = ?, telefono_proveedor = ?
            WHERE id = ?
            """,
            (proveedor, telefono, id_producto)
        )
        db.commit()
        return jsonify({"mensaje": "Proveedor actualizado correctamente"})
    except Exception:
        db.rollback()
        return jsonify({"error": "No se pudo actualizar el proveedor"}), 500
    finally:
        db.close()


@productos_bp.route("/productos", methods=["GET"])
@roles_permitidos("admin", "vendedor")
def obtener_productos():

    db = get_db()

    try:
        id_tienda = tienda_actual(db, session.get("id_tienda"))

        # El administrador puede elegir de qué tienda ver los productos.
        if session.get("rol") == "admin":
            solicitada = request.args.get("id_tienda", type=int)
            if solicitada:
                id_tienda = solicitada

        productos = db.execute(
            CONSULTA_PRODUCTOS + " ORDER BY p.id DESC", (id_tienda,)
        ).fetchall()

        es_admin = session.get("rol") == "admin"

        resultado = []

        for producto in productos:
            datos = dict(producto)

            if not es_admin:
                datos.pop("precio_compra", None)
                datos.pop("costo_promedio", None)
                datos.pop("proveedor", None)
                datos.pop("telefono_proveedor", None)

            resultado.append(datos)

        return jsonify(resultado), 200

    finally:
        db.close()


@productos_bp.route("/productos/exportar", methods=["GET"])
@roles_permitidos("admin")
def exportar_productos():
    """Lista completa de productos con el stock de TODAS las tiendas.

    El boton de Excel del frontend hace UN solo pedido (antes hacia uno por
    tienda); cada ida y vuelta a Turso cuesta ~200 ms.
    Los precios salen de la tienda elegida (?id_tienda=, por defecto la
    principal) y el stock viene por tienda en `stock_por_tienda`.
    """
    db = get_db()
    try:
        id_tienda_precios = tienda_param(
            db,
            session.get("rol"),
            session.get("id_tienda"),
            request.args.get("id_tienda", type=int)
        )

        tiendas = db.execute("""
            SELECT id, nombre
            FROM tiendas
            WHERE activo = 1
            ORDER BY id
        """).fetchall()

        filas = db.execute("""
            SELECT
                p.id,
                p.cod_origen,
                p.codigo,
                p.nombre,
                p.categoria,
                p.descripcion,
                p.marca,
                p.unidad,
                p.proveedor,
                p.telefono_proveedor,
                i.id_tienda AS id_tienda_stock,
                i.stock,
                ip.precio_compra,
                ip.costo_promedio,
                ip.precio_venta
            FROM productos p
            LEFT JOIN inventario i
                ON i.id_producto = p.id
            LEFT JOIN inventario ip
                ON ip.id_producto = p.id AND ip.id_tienda = ?
            ORDER BY p.id
        """, (id_tienda_precios,)).fetchall()

        productos = []
        por_id = {}
        for fila in filas:
            datos = por_id.get(fila["id"])
            if datos is None:
                datos = {
                    "id": fila["id"],
                    "cod_origen": fila["cod_origen"],
                    "codigo": fila["codigo"],
                    "nombre": fila["nombre"],
                    "categoria": fila["categoria"],
                    "descripcion": fila["descripcion"],
                    "marca": fila["marca"],
                    "unidad": fila["unidad"],
                    "proveedor": fila["proveedor"],
                    "telefono_proveedor": fila["telefono_proveedor"],
                    "precio_compra": 0.0,
                    "costo_promedio": 0.0,
                    "precio_venta": 0.0,
                    "stock_por_tienda": {}
                }
                por_id[fila["id"]] = datos
                productos.append(datos)

            if fila["id_tienda_stock"] is not None:
                datos["stock_por_tienda"][str(fila["id_tienda_stock"])] = int(
                    fila["stock"] or 0
                )
            if fila["precio_venta"] is not None:
                datos["precio_compra"] = float(fila["precio_compra"] or 0)
                datos["costo_promedio"] = float(fila["costo_promedio"] or 0)
                datos["precio_venta"] = float(fila["precio_venta"] or 0)

        return jsonify({
            "tiendas": [dict(t) for t in tiendas],
            "id_tienda_precios": id_tienda_precios,
            "productos": productos
        }), 200

    finally:
        db.close()




"""ahora agregaremos los productos """
@productos_bp.route("/productos", methods=["POST"])
@roles_permitidos("admin")
def crear_producto():

    data = request.get_json(silent=True) or {}

    if not isinstance(data, dict):
        return jsonify({"error": "Envía un objeto JSON válido"}), 400

    nombre = str(data.get("nombre") or "").strip()
    if not nombre:
        return jsonify({"error": "El nombre del producto es obligatorio"}), 400

    try:
        stock_inicial = float(data.get("stock", 0))
        precio_compra = float(data.get("precio_compra", 0) or 0)
        precio_venta = float(data.get("precio_venta", 0) or 0)
    except (TypeError, ValueError):
        return jsonify({
            "error": "El stock y los precios deben ser números válidos"
        }), 400

    if not stock_inicial.is_integer() or stock_inicial <= 0:
        return jsonify({
            "error": "El stock inicial debe ser un número entero mayor a 0"
        }), 400

    if not (0 <= precio_compra < float("inf")) or not (0 <= precio_venta < float("inf")):
        return jsonify({"error": "Los precios deben ser válidos y no negativos"}), 400

    db = get_db()

    try:
        # El admin puede elegir la tienda donde crear el producto.
        id_tienda = tienda_param(
            db,
            session.get("rol"),
            session.get("id_tienda"),
            _tienda_del_admin(data)
        )

        # Acepta los nombres nuevos (cod_origen, categoria) y los antiguos.
        cod_origen = data.get("cod_origen", data.get("codOrigi"))
        categoria = data.get("categoria", data.get("tipo"))

        cursor = db.execute("""
            INSERT INTO productos (
                cod_origen,
                codigo,
                nombre,
                categoria,
                descripcion,
                marca,
                unidad,
                proveedor,
                telefono_proveedor
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
            _texto(cod_origen),
            _texto(data.get("codigo")),
            nombre,
            _texto(categoria),
            _texto(data.get("descripcion")),
            _texto(data.get("marca")),
            _texto(data.get("unidad")),
            _texto(data.get("proveedor")),
            _texto(data.get("telefono_proveedor"))
        ))

        producto_id = cursor.lastrowid

        # Si el precio de venta vino en 0, se hereda el precio de venta de la
        # tienda principal de un producto existente con el mismo código.
        if precio_venta <= 0:
            precio_venta = _precio_venta_producto_existente(
                db, cod_origen, data.get("codigo"), id_excluir=producto_id
            )

        # Stock y precios iniciales de la tienda actual.
        db.execute("""
            INSERT INTO inventario
                (id_tienda, id_producto, stock, precio_compra,
                 costo_promedio, precio_venta)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (id_tienda, producto_id, stock_inicial, precio_compra,
              precio_compra, precio_venta))

        db.execute("""
            INSERT INTO kardex (
                id_tienda,
                id_producto,
                id_usuario,
                tipo_movimiento,
                motivo,
                referencia_id,
                cantidad,
                stock_anterior,
                stock_nuevo,
                costo_unitario,
                costo_promedio_anterior,
                costo_promedio_nuevo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                id_tienda,
                producto_id,
                session.get("usuario_id"),
                "compra",
                "stock_inicial",
                None,
                stock_inicial,
                0,
                stock_inicial,
                precio_compra,
                0,
                precio_compra
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
        # La entrada se registra en la tienda elegida por el admin.
        id_tienda = tienda_param(
            db,
            session.get("rol"),
            session.get("id_tienda"),
            _tienda_del_admin(data)
        )
        db.execute("BEGIN IMMEDIATE")

        producto = db.execute("""
            SELECT id, nombre
            FROM productos
            WHERE id = ?
        """, (id_producto,)).fetchone()

        if producto is None:
            db.rollback()
            return jsonify({"error": "Producto no encontrado"}), 404

        inventario = db.execute("""
            SELECT stock, precio_compra, costo_promedio
            FROM inventario
            WHERE id_tienda = ? AND id_producto = ?
        """, (id_tienda, id_producto)).fetchone()

        if inventario is None:
            # Primera entrada de este producto en esta tienda.
            stock_anterior = 0.0
            costo_promedio_anterior = 0.0
        else:
            stock_anterior = float(inventario["stock"])
            costo_promedio_anterior = float(inventario["costo_promedio"] or 0)

        stock_nuevo = stock_anterior + cantidad

        if stock_anterior == 0:
            costo_promedio_nuevo = costo_unitario
        else:
            costo_promedio_nuevo = (
                (stock_anterior * costo_promedio_anterior)
                + (cantidad * costo_unitario)
            ) / stock_nuevo

        # El precio de venta se hereda de la tienda principal (o de otra
        # tienda que ya lo tenga) en vez de quedar en 0.
        precio_venta = _precio_venta_referencia(db, id_producto, id_tienda)

        if inventario is None:
            db.execute("""
                INSERT INTO inventario
                    (id_tienda, id_producto, stock, precio_compra,
                     costo_promedio, precio_venta)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (id_tienda, id_producto, stock_nuevo, costo_unitario,
                  costo_promedio_nuevo, precio_venta))
        else:
            # Actualizar las existencias y el último costo de compra.
            # Si el precio de venta sigue en 0, se completa con el de la
            # tienda principal para que nunca aparezca en 0.
            precio_actual = float(inventario["precio_venta"] or 0)
            if precio_actual <= 0 and precio_venta > 0:
                db.execute("""
                    UPDATE inventario
                    SET stock = ?,
                        precio_compra = ?,
                        costo_promedio = ?,
                        precio_venta = ?,
                        actualizado_en = CURRENT_TIMESTAMP
                    WHERE id_tienda = ? AND id_producto = ?
                """, (
                    stock_nuevo,
                    costo_unitario,
                    costo_promedio_nuevo,
                    precio_venta,
                    id_tienda,
                    id_producto
                ))
            else:
                db.execute("""
                    UPDATE inventario
                    SET stock = ?,
                        precio_compra = ?,
                        costo_promedio = ?,
                        actualizado_en = CURRENT_TIMESTAMP
                    WHERE id_tienda = ? AND id_producto = ?
                """, (
                    stock_nuevo,
                    costo_unitario,
                    costo_promedio_nuevo,
                    id_tienda,
                    id_producto
                ))

        # Registrar movimiento de entrada en Kardex
        cursor = db.execute("""
            INSERT INTO kardex (
                id_tienda,
                id_producto,
                id_usuario,
                tipo_movimiento,
                motivo,
                referencia_id,
                cantidad,
                stock_anterior,
                stock_nuevo,
                costo_unitario,
                costo_promedio_anterior,
                costo_promedio_nuevo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            id_tienda,
            id_producto,
            session.get("usuario_id"),
            "compra",
            str(data.get("motivo") or "compra").strip() or "compra",
            None,
            cantidad,
            stock_anterior,
            stock_nuevo,
            costo_unitario,
            costo_promedio_anterior,
            costo_promedio_nuevo
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
        return jsonify({"error": "Precio de venta inválido"}), 400

    db = get_db()

    try:
        # El precio se cambia en la tienda elegida por el admin.
        id_tienda = tienda_param(
            db,
            session.get("rol"),
            session.get("id_tienda"),
            _tienda_del_admin(data)
        )

        producto = db.execute("""
            SELECT id, nombre
            FROM productos
            WHERE id = ?
        """, (id_producto,)).fetchone()

        if producto is None:
            return jsonify({"error": "Producto no encontrado"}), 404

        inventario = db.execute("""
            SELECT precio_venta
            FROM inventario
            WHERE id_tienda = ? AND id_producto = ?
        """, (id_tienda, id_producto)).fetchone()

        precio_anterior = 0 if inventario is None else inventario["precio_venta"]

        if inventario is None:
            db.execute("""
                INSERT INTO inventario
                    (id_tienda, id_producto, stock, precio_compra,
                     costo_promedio, precio_venta)
                VALUES (?, ?, 0, 0, 0, ?)
            """, (id_tienda, id_producto, precio_venta))
        else:
            db.execute("""
                UPDATE inventario
                SET precio_venta = ?,
                    actualizado_en = CURRENT_TIMESTAMP
                WHERE id_tienda = ? AND id_producto = ?
            """, (
                precio_venta,
                id_tienda,
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


def _precio_venta_referencia(db, id_producto, id_tienda):
    """Precio de venta de la tienda principal (o de otra tienda que ya lo tenga).

    Se usa cuando el producto entra por primera vez a una tienda: en vez de
    guardar 0 se hereda el precio que ya está usando la tienda principal.
    """
    principal = db.execute(
        "SELECT id FROM tiendas WHERE activo = 1 ORDER BY id LIMIT 1"
    ).fetchone()

    candidatos = []
    if principal is not None:
        candidatos.append(int(principal["id"]))
    candidatos += [
        int(f["id_tienda"]) for f in db.execute(
            """
            SELECT DISTINCT id_tienda
            FROM inventario
            WHERE id_producto = ? AND COALESCE(precio_venta, 0) > 0
            ORDER BY id_tienda
            """,
            (id_producto,)
        ).fetchall()
    ]

    for id_ref in candidatos:
        if id_ref == id_tienda:
            continue
        fila = db.execute(
            "SELECT precio_venta FROM inventario "
            "WHERE id_producto = ? AND id_tienda = ?",
            (id_producto, id_ref)
        ).fetchone()
        if fila is not None and float(fila["precio_venta"] or 0) > 0:
            return float(fila["precio_venta"])
    return 0.0


def _precio_venta_producto_existente(db, cod_origen, codigo, id_excluir=None):
    """Precio de venta de la tienda principal para un producto ya existente.

    Busca por código original o código SKU (distinto de `id_excluir`) y
    devuelve su precio de venta en la primera tienda activa.
    """
    condiciones = []
    parametros = []
    if cod_origen:
        condiciones.append("p.cod_origen = ?")
        parametros.append(cod_origen)
    if codigo:
        condiciones.append("p.codigo = ?")
        parametros.append(codigo)
    if not condiciones:
        return 0.0

    # La coincidencia va entre parentesis; excluir el producto recien creado
    # se hace con AND (nunca con OR, o coincidiria con todos).
    coincidencia = f"({' OR '.join(condiciones)})"
    if id_excluir is not None:
        coincidencia += " AND p.id <> ?"
        parametros.append(id_excluir)

    fila = db.execute(f"""
        SELECT i.precio_venta
        FROM inventario i
        JOIN productos p ON p.id = i.id_producto
        JOIN tiendas t ON t.id = i.id_tienda AND t.activo = 1
        WHERE {coincidencia}
          AND COALESCE(i.precio_venta, 0) > 0
        ORDER BY t.id
        LIMIT 1
    """, parametros).fetchone()
    return float(fila["precio_venta"]) if fila else 0.0


def _texto(valor):
    """Convierte un valor del formulario en texto o None."""
    if valor is None:
        return None
    texto = str(valor).strip()
    return texto or None
