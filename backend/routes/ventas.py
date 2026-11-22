# Rutas de ventas: acceso por sesión, stock en inventario y Kardex.
from flask import Blueprint, request, jsonify, session
from database.database import get_db, tienda_actual, tienda_param
from auth import roles_permitidos

ventas_bp = Blueprint('ventas', __name__)


@ventas_bp.route('/ventas/productos', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def productos_para_venta():
    db = get_db()
    try:
        id_tienda = tienda_actual(db, session.get('id_tienda'))
        productos = db.execute('''
            SELECT p.id, p.cod_origen AS codOrigi, p.codigo, p.nombre,
                   p.categoria AS tipo, p.marca,
                   COALESCE(i.stock, 0) AS stock,
                   COALESCE(i.precio_venta, 0) AS precio_venta
            FROM productos p
            LEFT JOIN inventario i
                ON i.id_producto = p.id AND i.id_tienda = ?
            WHERE p.activo = 1
            ORDER BY p.nombre
        ''', (id_tienda,)).fetchall()
        return jsonify([dict(p) for p in productos])
    finally:
        db.close()


@ventas_bp.route('/ventas', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def obtener_ventas():
    db = get_db()
    try:
        # El administrador puede elegir la tienda; el vendedor solo la suya.
        id_tienda = tienda_param(
            db,
            session.get('rol'),
            session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )

        consulta = '''
            SELECT
                v.id,
                v.fecha,
                v.tipo,
                v.id_venta_origen,
                v.nombre_cliente,
                v.total,
                v.forma_pago,
                v.id_vendedor,
                v.id_tienda,
                t.nombre AS tienda,
                u.nombre AS vendedor,

                (
                    SELECT GROUP_CONCAT(p.nombre, ', ')
                    FROM detalle_ventas d
                    INNER JOIN productos p
                        ON p.id = d.id_producto
                    WHERE d.id_venta = v.id
                ) AS productos,

                (
                    SELECT GROUP_CONCAT(
                        CAST(d.cantidad AS TEXT), ', '
                    )
                    FROM detalle_ventas d
                    WHERE d.id_venta = v.id
                ) AS cantidades

            FROM ventas v
            LEFT JOIN usuarios u
                ON v.id_vendedor = u.id
            LEFT JOIN tiendas t
                ON v.id_tienda = t.id
            WHERE v.id_tienda = ?
              AND v.estado = 'completada'
              AND (
                    v.tipo = 'venta'
                    OR EXISTS (
                        SELECT 1 FROM ventas o
                        WHERE o.id = v.id_venta_origen
                          AND o.estado = 'completada'
                    )
              )
        '''

        parametros = [id_tienda]

        if session.get('rol') != 'admin':
            consulta += ' AND v.id_vendedor = ?'
            parametros.append(session['usuario_id'])

        consulta += ' ORDER BY v.id DESC'

        ventas = db.execute(consulta, tuple(parametros)).fetchall()

        return jsonify([dict(v) for v in ventas])

    finally:
        db.close()


@ventas_bp.route('/ventas/<int:id_venta>', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def obtener_venta(id_venta):
    db = get_db()
    try:
        id_tienda = tienda_actual(db, session.get('id_tienda'))
        consulta = '''
            SELECT v.id, v.fecha, v.nombre_cliente, v.total,
                   v.forma_pago, v.id_vendedor, u.nombre AS vendedor
            FROM ventas v
            LEFT JOIN usuarios u ON v.id_vendedor = u.id
            WHERE v.id = ? AND v.id_tienda = ?
        '''
        parametros = [id_venta, id_tienda]
        if session.get('rol') != 'admin':
            consulta += ' AND v.id_vendedor = ?'
            parametros.append(session['usuario_id'])
        venta = db.execute(consulta, tuple(parametros)).fetchone()
        if venta is None:
            return jsonify({'error': 'Venta no encontrada'}), 404

        detalles = db.execute('''
            SELECT dv.id, dv.id_producto, p.nombre AS producto,
                   dv.cantidad, dv.precio_venta_real, dv.sub_total
            FROM detalle_ventas dv
            INNER JOIN productos p ON dv.id_producto = p.id
            WHERE dv.id_venta = ?
        ''', (id_venta,)).fetchall()
        return jsonify({'venta': dict(venta), 'detalles': [dict(d) for d in detalles]})
    finally:
        db.close()


@ventas_bp.route('/ventas', methods=['POST'])
@roles_permitidos('admin', 'vendedor')
def registrar_venta():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Envía un objeto JSON válido'}), 400

    nombre_cliente = data.get('nombre_cliente')
    forma_pago = data.get('forma_pago')
    detalles = data.get('detalles')
    con_factura = data.get('con_factura')

    id_vendedor = session['usuario_id']

    if not isinstance(con_factura, bool):
        return jsonify({
            'error': 'Debes indicar si la venta es con factura o sin factura'
        }), 400

    if not isinstance(nombre_cliente, str) or not nombre_cliente.strip():
        return jsonify({'error': 'El nombre del cliente es obligatorio'}), 400
    if not isinstance(forma_pago, str) or not forma_pago.strip():
        return jsonify({'error': 'La forma de pago es obligatoria'}), 400
    if not isinstance(detalles, list) or not detalles:
        return jsonify({'error': 'La venta debe tener al menos un producto'}), 400

    # Consolidar productos repetidos antes de comprobar existencias.
    cantidades = {}
    for item in detalles:
        if not isinstance(item, dict):
            return jsonify({'error': 'Detalle de venta inválido'}), 400
        try:
            id_producto = int(item.get('id_producto'))
            cantidad = int(item.get('cantidad'))
        except (TypeError, ValueError, OverflowError):
            return jsonify({'error': 'Producto y cantidad deben ser enteros'}), 400
        if id_producto <= 0 or cantidad <= 0:
            return jsonify({'error': 'Producto y cantidad deben ser mayores a cero'}), 400
        # Rechazar 1.5 en lugar de truncarlo a 1.
        if str(item.get('cantidad')).strip() not in (str(cantidad),):
            return jsonify({'error': 'La cantidad debe ser un entero positivo'}), 400
        cantidades[id_producto] = cantidades.get(id_producto, 0) + cantidad

    db = get_db()
    try:
        id_tienda = tienda_actual(db, session.get('id_tienda'))
        # Impide que dos ventas simultáneas consuman las mismas existencias.
        db.execute('BEGIN IMMEDIATE')
        productos = []
        total = 0.0
        for id_producto, cantidad in cantidades.items():
            producto = db.execute('''
                SELECT p.id, p.nombre,
                       COALESCE(i.stock, 0) AS stock,
                       COALESCE(i.precio_venta, 0) AS precio_venta,
                       COALESCE(i.costo_promedio, 0) AS costo_promedio
                FROM productos p
                LEFT JOIN inventario i
                    ON i.id_producto = p.id AND i.id_tienda = ?
                WHERE p.id = ?
            ''', (id_tienda, id_producto)).fetchone()
            if producto is None:
                raise ValueError(f'El producto {id_producto} no existe')
            if producto['stock'] < cantidad:
                raise ValueError(
                    f"Stock insuficiente para {producto['nombre']}. "
                    f"Disponible: {producto['stock']}"
                )
            precio = float(producto['precio_venta'])
            costo = float(producto['costo_promedio'] or 0)
            subtotal = round(cantidad * precio, 2)
            total = round(total + subtotal, 2)
            productos.append((producto, cantidad, precio, costo, subtotal))

        subtotal_venta = round(total, 2)

        recargo = round(subtotal_venta * 0.13, 2) if con_factura else 0.0

        total = round(subtotal_venta + recargo, 2)

        cursor = db.execute('''
            INSERT INTO ventas (
                id_tienda,
                id_vendedor,
                nombre_cliente,
                total,
                forma_pago,
                con_factura
            )
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            id_tienda,
            id_vendedor,
            nombre_cliente.strip(),
            total,
            forma_pago.strip(),
            int(con_factura)
        ))

        id_venta = cursor.lastrowid

        for producto, cantidad, precio, costo, subtotal in productos:
            stock_anterior = producto['stock']
            stock_nuevo = stock_anterior - cantidad
            db.execute('''
                INSERT INTO detalle_ventas
                    (id_venta, id_producto, cantidad,
                     precio_venta_real, costo_unitario, sub_total)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (id_venta, producto['id'], cantidad, precio, costo, subtotal))
            db.execute('''
                UPDATE inventario
                SET stock = ?, actualizado_en = CURRENT_TIMESTAMP
                WHERE id_tienda = ? AND id_producto = ?
            ''', (stock_nuevo, id_tienda, producto['id']))
            db.execute('''
                INSERT INTO kardex
                    (id_tienda, id_producto, id_usuario, tipo_movimiento,
                     motivo, referencia_id, cantidad, stock_anterior,
                     stock_nuevo, costo_unitario, costo_promedio_anterior,
                     costo_promedio_nuevo)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (id_tienda, producto['id'], id_vendedor, 'venta', 'venta',
                  id_venta, cantidad, stock_anterior, stock_nuevo, costo,
                  costo, costo))

        db.commit()
        return jsonify({
            'mensaje': 'Venta registrada correctamente',
            'id_venta': id_venta,
            'subtotal': subtotal_venta,
            'recargo': recargo,
            'con_factura': con_factura,
            'total': total
        }), 201
    except ValueError as exc:
        db.rollback()
        return jsonify({'error': str(exc)}), 400
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# =========================================
# DEVOLUCIONES: la venta se anula parcial o totalmente y el stock
# regresa al inventario. Vale para admin y vendedor (su tienda).
# =========================================

@ventas_bp.route('/devoluciones/ventas', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def ventas_para_devolucion():
    """Ventas completadas que se pueden devolver (tienda del usuario)."""
    db = get_db()
    try:
        id_tienda = tienda_param(
            db,
            session.get('rol'),
            session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )
        filas = db.execute('''
            SELECT
                v.id,
                v.fecha,
                v.nombre_cliente,
                v.total,
                v.con_factura,
                u.nombre AS vendedor,
                (
                    SELECT GROUP_CONCAT(p.nombre, ', ')
                    FROM detalle_ventas d
                    INNER JOIN productos p ON p.id = d.id_producto
                    WHERE d.id_venta = v.id
                ) AS productos,
                COALESCE((
                    SELECT SUM(dv2.sub_total)
                    FROM detalle_ventas dv2
                    INNER JOIN ventas v2 ON v2.id = dv2.id_venta
                    WHERE v2.id_venta_origen = v.id
                      AND v2.tipo = 'devolucion'
                      AND v2.estado = 'completada'
                ), 0) AS devuelto
            FROM ventas v
            LEFT JOIN usuarios u ON u.id = v.id_vendedor
            WHERE v.id_tienda = ?
              AND v.tipo = 'venta'
              AND v.estado = 'completada'
            ORDER BY v.id DESC
            LIMIT 200
        ''', (id_tienda,)).fetchall()
        return jsonify([dict(f) for f in filas])
    finally:
        db.close()


@ventas_bp.route('/devoluciones/venta/<int:id_venta>', methods=['GET'])
@roles_permitidos('admin', 'vendedor')
def venta_para_devolucion(id_venta):
    """Detalle de una venta con lo que todavia se puede devolver."""
    db = get_db()
    try:
        id_tienda = tienda_param(
            db,
            session.get('rol'),
            session.get('id_tienda'),
            request.args.get('id_tienda', type=int)
        )
        venta = db.execute('''
            SELECT v.id, v.fecha, v.nombre_cliente, v.total, v.con_factura,
                   v.forma_pago, u.nombre AS vendedor
            FROM ventas v
            LEFT JOIN usuarios u ON u.id = v.id_vendedor
            WHERE v.id = ? AND v.id_tienda = ?
              AND v.tipo = 'venta' AND v.estado = 'completada'
        ''', (id_venta, id_tienda)).fetchone()
        if venta is None:
            return jsonify({'error': 'Venta no encontrada en esta tienda'}), 404

        items = db.execute('''
            SELECT dv.id AS id_detalle, dv.id_producto, p.nombre AS producto,
                   p.codigo, dv.cantidad, dv.precio_venta_real,
                   dv.costo_unitario,
                   COALESCE((
                       SELECT SUM(dv2.cantidad)
                       FROM detalle_ventas dv2
                       INNER JOIN ventas v2 ON v2.id = dv2.id_venta
                       WHERE dv2.id_detalle_origen = dv.id
                         AND v2.tipo = 'devolucion'
                         AND v2.estado = 'completada'
                   ), 0) AS ya_devuelto
            FROM detalle_ventas dv
            INNER JOIN productos p ON p.id = dv.id_producto
            WHERE dv.id_venta = ?
        ''', (id_venta,)).fetchall()

        resultado = []
        for item in items:
            d = dict(item)
            d['disponible'] = float(d['cantidad']) - float(d['ya_devuelto'])
            resultado.append(d)

        return jsonify({'venta': dict(venta), 'items': resultado})
    finally:
        db.close()


@ventas_bp.route('/devoluciones', methods=['POST'])
@roles_permitidos('admin', 'vendedor')
def registrar_devolucion():
    """Registra la devolucion de una venta.

    - Crea una fila en ventas con tipo='devolucion' enlazada a la original.
    - Crea su detalle enlazado al detalle original (id_detalle_origen).
    - El stock devuelto regresa al inventario.
    - Kardex con tipo 'devolucion' (entrada).
    El dashboard descuenta automaticamente lo devuelto (neto).
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({'error': 'Envía un objeto JSON válido'}), 400

    try:
        id_venta_origen = int(data.get('id_venta_origen'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Indica la venta que se devuelve'}), 400

    motivo = str(data.get('motivo') or '').strip() or 'devolucion'
    detalles = data.get('detalles')

    if not isinstance(detalles, list) or not detalles:
        return jsonify({'error': 'Selecciona al menos un producto'}), 400

    # Consolidar detalles repetidos
    cantidades = {}
    for item in detalles:
        try:
            id_detalle = int(item.get('id_detalle_origen'))
            cantidad = int(item.get('cantidad'))
        except (TypeError, ValueError, OverflowError):
            return jsonify({'error': 'Detalle de devolución inválido'}), 400
        if id_detalle <= 0 or cantidad <= 0:
            return jsonify({'error': 'Cantidad a devolver inválida'}), 400
        cantidades[id_detalle] = cantidades.get(id_detalle, 0) + cantidad

    db = get_db()
    try:
        id_tienda = tienda_actual(db, session.get('id_tienda'))
        db.execute('BEGIN IMMEDIATE')

        venta = db.execute('''
            SELECT id, id_tienda, nombre_cliente, forma_pago, con_factura
            FROM ventas
            WHERE id = ? AND tipo = 'venta' AND estado = 'completada'
        ''', (id_venta_origen,)).fetchone()
        if venta is None or int(venta['id_tienda']) != int(id_tienda):
            db.rollback()
            return jsonify({'error': 'Venta no encontrada en esta tienda'}), 404

        items = []
        total_devolucion = 0.0
        for id_detalle, cantidad in cantidades.items():
            original = db.execute('''
                SELECT dv.id, dv.id_producto, dv.cantidad,
                       dv.precio_venta_real, dv.costo_unitario, p.nombre,
                       COALESCE((
                           SELECT SUM(dv2.cantidad)
                           FROM detalle_ventas dv2
                           INNER JOIN ventas v2 ON v2.id = dv2.id_venta
                           WHERE dv2.id_detalle_origen = dv.id
                             AND v2.tipo = 'devolucion'
                             AND v2.estado = 'completada'
                       ), 0) AS ya_devuelto
                FROM detalle_ventas dv
                INNER JOIN productos p ON p.id = dv.id_producto
                WHERE dv.id = ? AND dv.id_venta = ?
            ''', (id_detalle, id_venta_origen)).fetchone()
            if original is None:
                raise ValueError('Un producto no pertenece a esa venta')

            disponible = float(original['cantidad']) - float(original['ya_devuelto'])
            if cantidad > disponible:
                raise ValueError(
                    f"No se puede devolver {cantidad} de {original['nombre']}. "
                    f"Disponible para devolver: {int(disponible)}"
                )

            sub = round(cantidad * float(original['precio_venta_real']), 2)
            total_devolucion = round(total_devolucion + sub, 2)
            items.append((original, cantidad, sub))

        # Si la venta original fue con factura, se devuelve tambien el recargo.
        con_factura = int(float(venta['con_factura']))
        if con_factura == 1:
            total_devolucion = round(total_devolucion * 1.13, 2)

        cursor = db.execute('''
            INSERT INTO ventas (
                id_tienda, id_vendedor, nombre_cliente, tipo,
                id_venta_origen, total, forma_pago, con_factura
            )
            VALUES (?, ?, ?, 'devolucion', ?, ?, ?, ?)
        ''', (
            venta['id_tienda'],
            session['usuario_id'],
            venta['nombre_cliente'],
            id_venta_origen,
            total_devolucion,
            venta['forma_pago'],
            con_factura
        ))
        id_devolucion = cursor.lastrowid

        for original, cantidad, sub in items:
            # Detalle de la devolucion enlazado al original
            db.execute('''
                INSERT INTO detalle_ventas
                    (id_venta, id_producto, id_detalle_origen, cantidad,
                     precio_venta_real, costo_unitario, sub_total, reingresa_stock)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)
            ''', (
                id_devolucion,
                original['id_producto'],
                original['id'],
                cantidad,
                original['precio_venta_real'],
                original['costo_unitario'],
                sub
            ))

            # El stock devuelto regresa al inventario
            fila = db.execute('''
                SELECT COALESCE(stock, 0) AS stock
                FROM inventario
                WHERE id_tienda = ? AND id_producto = ?
            ''', (venta['id_tienda'], original['id_producto'])).fetchone()
            stock_anterior = float(fila['stock']) if fila else 0.0
            stock_nuevo = stock_anterior + cantidad
            if fila is None:
                db.execute('''
                    INSERT INTO inventario (id_tienda, id_producto, stock)
                    VALUES (?, ?, ?)
                ''', (venta['id_tienda'], original['id_producto'], stock_nuevo))
            else:
                db.execute('''
                    UPDATE inventario
                    SET stock = ?, actualizado_en = CURRENT_TIMESTAMP
                    WHERE id_tienda = ? AND id_producto = ?
                ''', (stock_nuevo, venta['id_tienda'], original['id_producto']))

            # Kardex: la devolucion entra al inventario
            db.execute('''
                INSERT INTO kardex (
                    id_tienda, id_producto, id_usuario, tipo_movimiento,
                    motivo, referencia_id, cantidad, stock_anterior,
                    stock_nuevo, costo_unitario, costo_promedio_anterior,
                    costo_promedio_nuevo
                )
                VALUES (?, ?, ?, 'devolucion', ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                venta['id_tienda'],
                original['id_producto'],
                session['usuario_id'],
                motivo,
                id_devolucion,
                cantidad,
                stock_anterior,
                stock_nuevo,
                original['costo_unitario'],
                original['costo_unitario'],
                original['costo_unitario']
            ))

        # Si con esta devolucion se devolvio TODO, la venta original se
        # anula: desaparece de "Ventas por vendedor" (el historial queda
        # en el kardex y el stock ya regreso al inventario).
        restante = db.execute('''
            SELECT COALESCE(SUM(dv.cantidad), 0) - COALESCE((
                SELECT SUM(dv2.cantidad)
                FROM detalle_ventas dv2
                INNER JOIN ventas v2 ON v2.id = dv2.id_venta
                WHERE dv2.id_detalle_origen IN (
                        SELECT id FROM detalle_ventas WHERE id_venta = ?
                      )
                  AND v2.tipo = 'devolucion'
                  AND v2.estado = 'completada'
            ), 0) AS restante
            FROM detalle_ventas dv
            WHERE dv.id_venta = ?
        ''', (id_venta_origen, id_venta_origen)).fetchone()
        venta_anulada = float(restante['restante'] or 0) <= 0
        if venta_anulada:
            db.execute(
                "UPDATE ventas SET estado = 'anulada' WHERE id = ?",
                (id_venta_origen,)
            )

        db.commit()
        return jsonify({
            'mensaje': 'Devolución registrada correctamente',
            'id_devolucion': id_devolucion,
            'id_venta_origen': id_venta_origen,
            'total_devuelto': total_devolucion,
            'venta_anulada': venta_anulada,
            'items_devueltos': [
                {
                    'id_producto': original['id_producto'],
                    'producto': original['nombre'],
                    'cantidad': cantidad
                }
                for original, cantidad, sub in items
            ]
        }), 201
    except ValueError as exc:
        db.rollback()
        return jsonify({'error': str(exc)}), 400
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
