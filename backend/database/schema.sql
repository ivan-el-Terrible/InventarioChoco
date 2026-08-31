PRAGMA foreign_keys = ON; -- creacion de la base de datos


-- Proveedores
CREATE TABLE proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomEmpresa TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Productos / Inventario
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codOrigi text unique, --codigo original 
    codigo TEXT UNIQUE, -- codigo de la empresa 
    nombre TEXT NOT NULL,
    tipo text, 
    descripcion TEXT,
    marca TEXT,
    stock REAL NOT NULL DEFAULT 0,
    precio_compra REAL NOT NULL DEFAULT 0,
    precio_venta REAL NOT NULL DEFAULT 0,
    id_proveedor INTEGER,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id)
);

-- Ventas (cabecera)
CREATE TABLE ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,    
    cliente TEXT, --opcional
    total REAL NOT NULL DEFAULT 0, --factura?
    forma_pago TEXT, --opcional
    id_vendedor INTEGER,         --esto es para saber quien hizo la venta
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vendedor) REFERENCES usuarios(id)
);

-- Detalle de venta (varios productos por venta)
CREATE TABLE detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    precio_venta_Real REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

-- Kardex (historial de movimientos de inventario)
CREATE TABLE kardex (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento TEXT NOT NULL,  -- 'entrada' o 'salida'
    motivo TEXT,                    -- 'venta', 'compra', 'ajuste', 'devolucion'
    referencia_id INTEGER,          -- id de venta_id o compra_id según motivo
    cantidad REAL NOT NULL,
    stock_anterior REAL NOT NULL,
    stock_nuevo REAL NOT NULL,
    precio_unitario REAL,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

--usuario
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'vendedor', -- 'admin' o 'usuario'
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
);