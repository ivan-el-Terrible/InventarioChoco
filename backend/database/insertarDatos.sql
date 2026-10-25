
PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- ========================================
-- 1. ELIMINAR DATOS ANTERIORES
-- ========================================

DELETE FROM kardex;
DELETE FROM detalle_ventas;
DELETE FROM ventas;
DELETE FROM productos;
DELETE FROM usuarios;
DELETE FROM proveedores;

DELETE FROM sqlite_sequence
WHERE name IN (
    'kardex',
    'detalle_ventas',
    'ventas',
    'productos',
    'usuarios',
    'proveedores'
);

-- ========================================
-- 2. PROVEEDORES
-- ========================================

INSERT INTO proveedores (id, nomEmpresa, telefono, email)
VALUES
(1, 'Volvo Repuestos Bolivia', '70701010', 'ventas@volvobolivia.com'),
(2, 'Importadora Automotriz CBBA', '76452211', 'contacto@automotrizcbba.com'),
(3, 'Distribuidora de Repuestos del Sur', '69441122', 'pedidos@repuestossur.com');

-- ========================================
-- 3. USUARIOS
-- ========================================

-- Contraseñas de demostración.
-- Estas contraseñas no están cifradas.
-- No utilizarlas en producción.

INSERT INTO usuarios (id, nombre, email, password, rol)
VALUES
(1, 'Iván Estrada', 'admin@choco.com', '123456', 'admin'),
(2, 'María López', 'maria@choco.com', '123456', 'vendedor'),
(3, 'Carlos Rojas', 'carlos@choco.com', '123456', 'vendedor');

-- ========================================
-- 4. PRODUCTOS VOLVO
-- ========================================

-- Se agrega costo_promedio.
-- Al iniciar, el costo promedio es igual
-- al primer precio de compra.

INSERT INTO productos (
    id,
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
VALUES
(1, 'OEM-VOL-001', 'REP-001', 'Filtro de aceite Volvo',
 'Filtros', 'Filtro de aceite para motor Volvo',
 'Volvo', 18, 65.00, 65.00, 110.00, 1),

(2, 'OEM-VOL-002', 'REP-002', 'Filtro de aire Volvo',
 'Filtros', 'Filtro de aire para motor Volvo',
 'Volvo', 12, 90.00, 90.00, 150.00, 1),

(3, 'OEM-VOL-003', 'REP-003', 'Pastillas de freno delanteras',
 'Frenos', 'Juego de pastillas de freno',
 'Volvo', 8, 220.00, 220.00, 350.00, 2),

(4, 'OEM-VOL-004', 'REP-004', 'Correa de accesorios',
 'Motor', 'Correa de accesorios para motor',
 'Volvo', 15, 120.00, 120.00, 200.00, 2),

(5, 'OEM-VOL-005', 'REP-005', 'Sensor de temperatura',
 'Sensores', 'Sensor de temperatura de motor',
 'Volvo', 6, 180.00, 180.00, 290.00, 3),

(6, 'OEM-VOL-006', 'REP-006', 'Bomba de agua',
 'Refrigeración', 'Bomba de agua para sistema de refrigeración',
 'Volvo', 10, 380.00, 380.00, 550.00, 3);

-- ========================================
-- 5. VENTAS
-- ========================================

INSERT INTO ventas (
    id, nombre_cliente, total, forma_pago, id_vendedor
)
VALUES
(1, 'Juan Pérez', 110.00, 'efectivo', 2),
(2, 'Ana Fernández', 300.00, 'qr', 3),
(3, 'Roberto Sánchez', 350.00, 'tarjeta', 2);

-- ========================================
-- 6. DETALLES DE VENTA
-- ========================================

INSERT INTO detalle_ventas (
    id_venta,
    id_producto,
    cantidad,
    precio_venta_Real,
    subtotal
)
VALUES
(1, 1, 1, 110.00, 110.00),
(2, 2, 2, 150.00, 300.00),
(3, 3, 1, 350.00, 350.00);

-- ========================================
-- 7. KARDEX - ENTRADAS INICIALES
-- ========================================

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
VALUES
(1, 'entrada', 'compra', NULL, 19, 0, 19, 65.00),
(2, 'entrada', 'compra', NULL, 14, 0, 14, 90.00),
(3, 'entrada', 'compra', NULL, 9, 0, 9, 220.00),
(4, 'entrada', 'compra', NULL, 15, 0, 15, 120.00),
(5, 'entrada', 'compra', NULL, 6, 0, 6, 180.00),
(6, 'entrada', 'compra', NULL, 10, 0, 10, 380.00);

-- ========================================
-- 8. KARDEX - SALIDAS POR VENTA
-- ========================================

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
VALUES
(1, 'salida', 'venta', 1, 1, 19, 18, 110.00),
(2, 'salida', 'venta', 2, 2, 14, 12, 150.00),
(3, 'salida', 'venta', 3, 1, 9, 8, 350.00);

COMMIT;
