
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS proveedores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nomEmpresa TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codOrigi TEXT UNIQUE,
    codigo TEXT UNIQUE,
    nombre TEXT NOT NULL,
    tipo TEXT,
    descripcion TEXT,
    marca TEXT,
    stock REAL NOT NULL DEFAULT 0,
    precio_compra REAL NOT NULL DEFAULT 0,
    costo_promedio REAL DEFAULT 0,
    precio_venta REAL NOT NULL DEFAULT 0,
    id_proveedor INTEGER,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proveedor) REFERENCES proveedores(id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'vendedor'
        CHECK (rol IN ('admin', 'vendedor')),
    activo INTEGER NOT NULL DEFAULT 1
        CHECK (activo IN (0, 1)),
    fecha_creacion TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_cliente TEXT,
    total REAL NOT NULL DEFAULT 0,
    forma_pago TEXT,
    id_vendedor INTEGER,
    con_factura INTEGER NOT NULL DEFAULT 0,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vendedor) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL,
    id_producto INTEGER NOT NULL,
    cantidad REAL NOT NULL,
    precio_venta_Real REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (id_venta) REFERENCES ventas(id),
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);

CREATE TABLE IF NOT EXISTS kardex (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_producto INTEGER NOT NULL,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento TEXT NOT NULL,
    motivo TEXT,
    referencia_id INTEGER,
    cantidad REAL NOT NULL,
    stock_anterior REAL NOT NULL,
    stock_nuevo REAL NOT NULL,
    precio_unitario REAL,
    FOREIGN KEY (id_producto) REFERENCES productos(id)
);
