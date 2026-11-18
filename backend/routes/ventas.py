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
