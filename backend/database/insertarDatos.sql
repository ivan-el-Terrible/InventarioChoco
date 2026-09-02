PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- =========================================
-- 1. PROVEEDORES
-- =========================================

INSERT INTO proveedores (
    nomEmpresa,
    telefono,
    email
)
VALUES (
    'Importadora Tech Bolivia',
    '70701010',
    'ventas@techbolivia.com'
);

INSERT INTO proveedores (
    nomEmpresa,
    telefono,
    email
)
VALUES (
    'Distribuidora Digital Cochabamba',
    '76452211',
    'contacto@digitalcbba.com'
);

INSERT INTO proveedores (
    nomEmpresa,
    telefono,
    email
)
VALUES (
    'Accesorios del Sur',
    '69441122',
    'pedidos@accesoriossur.com'
);


-- =========================================
-- 2. USUARIOS
-- =========================================

INSERT INTO usuarios (
    nombre,
    email,
    password,
    rol
)
VALUES (
    'Iván Estrada',
    'admin@choco.com',
    '123456',
    'admin'
);

INSERT INTO usuarios (
    nombre,
    email,
    password,
    rol
)
VALUES (
    'María López',
    'maria@choco.com',
    '123456',
    'vendedor'
);

INSERT INTO usuarios (
    nombre,
    email,
    password,
    rol
)
VALUES (
    'Carlos Rojas',
    'carlos@choco.com',
    '123456',
    'vendedor'
);


-- =========================================
-- 3. PRODUCTOS
-- =========================================

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
VALUES (
    'RED-K552',
    'PROD-001',
    'Teclado Mecánico RGB',
    'Periférico',
    'Teclado mecánico con iluminación RGB y conexión USB',
    'Redragon',
    12,
    250.00,
    390.00,
    (
        SELECT id
        FROM proveedores
        WHERE email = 'ventas@techbolivia.com'
        ORDER BY id DESC
        LIMIT 1
    )
);

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
VALUES (
    'LOG-M185',
    'PROD-002',
    'Mouse Inalámbrico',
    'Periférico',
    'Mouse inalámbrico ergonómico con receptor USB',
    'Logitech',
    20,
    85.00,
    145.00,
    (
        SELECT id
        FROM proveedores
        WHERE email = 'contacto@digitalcbba.com'
        ORDER BY id DESC
        LIMIT 1
    )
);

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
VALUES (
    'SAM-T350',
    'PROD-003',
    'Monitor 24 pulgadas Full HD',
    'Pantalla',
    'Monitor Full HD con entrada HDMI y resolución 1920x1080',
    'Samsung',
    8,
    850.00,
    1250.00,
    (
        SELECT id
        FROM proveedores
        WHERE email = 'pedidos@accesoriossur.com'
        ORDER BY id DESC
        LIMIT 1
    )
);


-- =========================================
-- 4. VENTAS
-- =========================================

INSERT INTO ventas (
    nombre_cliente,
    total,
    forma_pago,
    id_vendedor
)
VALUES (
    'Juan Pérez',
    390.00,
    'efectivo',
    (
        SELECT id
        FROM usuarios
        WHERE email = 'maria@choco.com'
        LIMIT 1
    )
);

INSERT INTO ventas (
    nombre_cliente,
    total,
    forma_pago,
    id_vendedor
)
VALUES (
    'Ana Fernández',
    290.00,
    'qr',
    (
        SELECT id
        FROM usuarios
        WHERE email = 'carlos@choco.com'
        LIMIT 1
    )
);

INSERT INTO ventas (
    nombre_cliente,
    total,
    forma_pago,
    id_vendedor
)
VALUES (
    'Roberto Sánchez',
    1250.00,
    'tarjeta',
    (
        SELECT id
        FROM usuarios
        WHERE email = 'maria@choco.com'
        LIMIT 1
    )
);


-- =========================================
-- 5. DETALLES DE VENTA
-- =========================================

-- Venta de un teclado
INSERT INTO detalle_ventas (
    id_venta,
    id_producto,
    cantidad,
    precio_venta_Real,
    subtotal
)
VALUES (
    (
        SELECT id
        FROM ventas
        WHERE nombre_cliente = 'Juan Pérez'
        ORDER BY id DESC
        LIMIT 1
    ),
    (
        SELECT id
        FROM productos
        WHERE codigo = 'PROD-001'
        LIMIT 1
    ),
    1,
    390.00,
    390.00
);

-- Venta de dos mouse
INSERT INTO detalle_ventas (
    id_venta,
    id_producto,
    cantidad,
    precio_venta_Real,
    subtotal
)
VALUES (
    (
        SELECT id
        FROM ventas
        WHERE nombre_cliente = 'Ana Fernández'
        ORDER BY id DESC
        LIMIT 1
    ),
    (
        SELECT id
        FROM productos
        WHERE codigo = 'PROD-002'
        LIMIT 1
    ),
    2,
    145.00,
    290.00
);

-- Venta de un monitor
INSERT INTO detalle_ventas (
    id_venta,
    id_producto,
    cantidad,
    precio_venta_Real,
    subtotal
)
VALUES (
    (
        SELECT id
        FROM ventas
        WHERE nombre_cliente = 'Roberto Sánchez'
        ORDER BY id DESC
        LIMIT 1
    ),
    (
        SELECT id
        FROM productos
        WHERE codigo = 'PROD-003'
        LIMIT 1
    ),
    1,
    1250.00,
    1250.00
);


-- =========================================
-- 6. KARDEX
-- =========================================

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
VALUES (
    (
        SELECT id
        FROM productos
        WHERE codigo = 'PROD-001'
        LIMIT 1
    ),
    'entrada',
    'compra',
    NULL,
    13,
    0,
    13,
    250.00
);

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
VALUES (
    (
        SELECT id
        FROM productos
        WHERE codigo = 'PROD-001'
        LIMIT 1
    ),
    'salida',
    'venta',
    (
        SELECT id
        FROM ventas
        WHERE nombre_cliente = 'Juan Pérez'
        ORDER BY id DESC
        LIMIT 1
    ),
    1,
    13,
    12,
    390.00
);

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
VALUES (
    (
        SELECT id
        FROM productos
        WHERE codigo = 'PROD-002'
        LIMIT 1
    ),
    'salida',
    'venta',
    (
        SELECT id
        FROM ventas
        WHERE nombre_cliente = 'Ana Fernández'
        ORDER BY id DESC
        LIMIT 1
    ),
    2,
    22,
    20,
    145.00
);

COMMIT;