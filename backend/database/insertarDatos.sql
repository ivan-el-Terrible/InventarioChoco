-- Datos de DEMOSTRACION para la base LOCAL (o una nube vacia).
-- Mismo formato que Turso: 8 tablas, proveedor es columna de productos.
-- ATENCION: borra TODO lo que hay en las tablas (incluidos usuarios).
-- Ejecutar solo en una base de prueba, nunca en la nube con datos reales.
--
-- Contraseñas de prueba (hash werkzeug, se validan con check_password_hash):
--   admin@gmail.com   -> admin123
--   maria@gmail.com   -> maria123
--   carlos@gmail.com  -> carlos123

PRAGMA foreign_keys = ON;
BEGIN TRANSACTION;

-- Borrado en orden de dependencias (clave foranea).
DELETE FROM detalle_ventas;
DELETE FROM kardex;
DELETE FROM gastos;
DELETE FROM ventas;
DELETE FROM inventario;
DELETE FROM productos;
DELETE FROM usuarios;
DELETE FROM tiendas;

DELETE FROM sqlite_sequence WHERE name IN (
    'detalle_ventas', 'kardex', 'gastos', 'ventas',
    'inventario', 'productos', 'usuarios', 'tiendas'
);

-- =========================================================
-- TIENDAS
-- =========================================================
INSERT INTO tiendas (id, nombre, direccion, activo) VALUES
(1, 'Tienda Principal', 'Av. Principal 123', 1),
(2, 'Tienda Norte', 'Calle Norte 456', 1);

-- =========================================================
-- USUARIOS (admin sin tienda, vendedores con tienda)
-- =========================================================
INSERT INTO usuarios (id, nombre, email, password, rol, id_tienda, activo) VALUES
(1, 'Iván Estrada', 'admin@gmail.com',
    'scrypt:32768:8:1$h1wWWZDPlpJNkHCl$fe1bf53d65296b097578784606bf0428b6d26d286a77c9309ecc6c7e44403ad026d4302389a9421c318f09e11864e41456dfc646a10b42c02d8b8991f30d5969',
    'admin', NULL, 1),
(2, 'María López', 'maria@gmail.com',
    'scrypt:32768:8:1$WHkUHSntb535wL8V$32cf28a1e51f044bb5b7d1cb164402765630a97f771a0bf6a56981cb59086df814815789db6dfb71426314200b5ad68ce304b1546d4abfeaf5484393164df40c',
    'vendedor', 1, 1),
(3, 'Carlos Rojas', 'carlos@gmail.com',
    'scrypt:32768:8:1$VBeDrcPFy1LjfzVH$9830cabb9b2c5db6778a35c0540aae7c4ac30939829ae2bf8258ad81857e27bd34327f4366287e5d47e0c6b1a203640afd180e408b179c1d2020d51b921f47c6',
    'vendedor', 2, 1);

-- =========================================================
-- PRODUCTOS (el proveedor es una columna, no una tabla)
-- =========================================================
INSERT INTO productos (
    id, cod_origen, codigo, nombre, categoria, descripcion,
    marca, unidad, proveedor, telefono_proveedor, activo
) VALUES
(1, 'OEM-VOL-001', 'REP-001', 'Filtro de aceite Volvo', 'Filtros',
    'Filtro de aceite para motor Volvo', 'Volvo', 'unidad',
    'Volvo Repuestos Bolivia', '70701010', 1),
(2, 'OEM-VOL-002', 'REP-002', 'Filtro de aire Volvo', 'Filtros',
    'Filtro de aire para motor Volvo', 'Volvo', 'unidad',
    'Volvo Repuestos Bolivia', '70701010', 1),
(3, 'OEM-VOL-003', 'REP-003', 'Pastillas de freno delanteras', 'Frenos',
    'Juego de pastillas de freno', 'Volvo', 'juego',
    'Importadora Automotriz CBBA', '76452211', 1),
(4, 'OEM-VOL-004', 'REP-004', 'Correa de accesorios', 'Motor',
    'Correa de accesorios para motor', 'Volvo', 'unidad',
    'Importadora Automotriz CBBA', '76452211', 1),
(5, 'OEM-VOL-005', 'REP-005', 'Sensor de temperatura', 'Sensores',
    'Sensor de temperatura de motor', 'Volvo', 'unidad',
    'Distribuidora de Repuestos del Sur', '69441122', 1),
(6, 'OEM-VOL-006', 'REP-006', 'Bomba de agua', 'Refrigeración',
    'Bomba de agua para sistema de refrigeración', 'Volvo', 'unidad',
    'Distribuidora de Repuestos del Sur', '69441122', 1);

-- =========================================================
-- INVENTARIO (stock DESPUES de las ventas de prueba)
-- Los productos 1 y 2 estan en la tienda 1, el 3 en la tienda 2.
-- =========================================================
INSERT INTO inventario (
    id, id_tienda, id_producto, stock, precio_compra, costo_promedio, precio_venta
) VALUES
(1, 1, 1, 18, 65.00, 65.00, 110.00),
(2, 1, 2, 12, 90.00, 90.00, 150.00),
(3, 2, 3, 8, 220.00, 220.00, 350.00),
(4, 1, 4, 15, 120.00, 120.00, 200.00),
(5, 1, 5, 6, 180.00, 180.00, 290.00),
(6, 1, 6, 10, 380.00, 380.00, 550.00);

-- =========================================================
-- VENTAS
-- Venta 1: sin factura, Bs 110.00
-- Venta 2: con factura, 2 x 150 = 300, recargo 13% = 39, total = 339
-- Venta 3: sin factura, Bs 350.00
-- =========================================================
INSERT INTO ventas (
    id, id_tienda, id_vendedor, nombre_cliente, tipo,
    total, forma_pago, con_factura, estado
) VALUES
(1, 1, 2, 'Juan Pérez', 'venta', 110.00, 'efectivo', 0, 'completada'),
(2, 1, 3, 'Ana Fernández', 'venta', 339.00, 'qr', 1, 'completada'),
(3, 2, 2, 'Roberto Sánchez', 'venta', 350.00, 'tarjeta', 0, 'completada');

-- Subtotal de detalle = cantidad * precio de venta, SIN recargo de factura.
INSERT INTO detalle_ventas (
    id, id_venta, id_producto, cantidad,
    precio_venta_real, costo_unitario, sub_total, reingresa_stock
) VALUES
(1, 1, 1, 1, 110.00, 65.00, 110.00, 1),
(2, 2, 2, 2, 150.00, 90.00, 300.00, 1),
(3, 3, 3, 1, 350.00, 220.00, 350.00, 1);

-- =========================================================
-- KARDEX
-- 1) Cargas iniciales: stock 19, 14 y 9 (antes de las ventas).
-- 2) Salidas por venta: quedan 18, 12 y 8 (los de inventario).
-- =========================================================
INSERT INTO kardex (
    id, id_tienda, id_producto, id_usuario, tipo_movimiento,
    motivo, referencia_id, cantidad, stock_anterior, stock_nuevo,
    costo_unitario, costo_promedio_anterior, costo_promedio_nuevo
) VALUES
(1, 1, 1, 1, 'carga_inicial', 'Stock inicial', NULL,
    19, 0, 19, 65.00, 0, 65.00),
(2, 1, 2, 1, 'carga_inicial', 'Stock inicial', NULL,
    14, 0, 14, 90.00, 0, 90.00),
(3, 2, 3, 1, 'carga_inicial', 'Stock inicial', NULL,
    9, 0, 9, 220.00, 0, 220.00),
(4, 1, 1, 2, 'venta', 'Venta 1', 1,
    1, 19, 18, 65.00, 65.00, 65.00),
(5, 1, 2, 3, 'venta', 'Venta 2', 2,
    2, 14, 12, 90.00, 90.00, 90.00),
(6, 2, 3, 2, 'venta', 'Venta 3', 3,
    1, 9, 8, 220.00, 220.00, 220.00);

-- =========================================================
-- GASTOS
-- =========================================================
INSERT INTO gastos (id, id_tienda, id_usuario, concepto, descripcion, monto, estado) VALUES
(1, 1, 1, 'Transporte de mercadería', 'Flete mensual', 150.00, 'vigente'),
(2, 1, 2, 'Material de empaque', 'Bolsas y cajas', 75.50, 'vigente'),
(3, 2, 1, 'Servicio de limpieza', 'Limpieza semanal', 90.00, 'vigente');

COMMIT;
