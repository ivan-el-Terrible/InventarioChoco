-- Esquema de la base de datos: MISMA estructura que la nube (Turso).
-- Copiado desde sqlite_master el dia que se verifico la conexion.
-- Lo usa database.py en la nube (si falta alguna tabla) y tambien en MODO LOCAL
-- para crear backend/database/inventario.db cuando no hay credenciales en la nube.
-- OJO: no usar punto y coma dentro de comentarios (database.py divide por eso).
-- NO existe tabla proveedores: el proveedor es una columna de productos
-- (proveedor, telefono_proveedor).

CREATE TABLE IF NOT EXISTS tiendas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    direccion TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1))
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'vendedor' CHECK (rol IN ('admin','vendedor')),
    id_tienda INTEGER REFERENCES tiendas(id),
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
    fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((rol = 'admin' AND id_tienda IS NULL) OR (rol = 'vendedor' AND id_tienda IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cod_origen TEXT,
    codigo TEXT,
    nombre TEXT NOT NULL,
    categoria TEXT,
    descripcion TEXT,
    marca TEXT,
    unidad TEXT,
    proveedor TEXT,
    telefono_proveedor TEXT,
    activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0,1)),
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indices reales de Turso (unico de codigo y busqueda por cod_origen)
CREATE INDEX IF NOT EXISTS ux_productos_codigo
    ON productos(codigo) WHERE codigo IS NOT NULL AND codigo <> '';

CREATE INDEX IF NOT EXISTS ix_productos_cod_origen
    ON productos(cod_origen);

CREATE TABLE IF NOT EXISTS inventario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tienda INTEGER NOT NULL REFERENCES tiendas(id),
    id_producto INTEGER NOT NULL REFERENCES productos(id),
    stock REAL NOT NULL DEFAULT 0 CHECK (stock >= 0),
    precio_compra NUMERIC NOT NULL DEFAULT 0 CHECK (precio_compra >= 0),
    costo_promedio NUMERIC NOT NULL DEFAULT 0 CHECK (costo_promedio >= 0),
    precio_venta NUMERIC NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
    actualizado_en TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_tienda, id_producto)
);

CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tienda INTEGER NOT NULL REFERENCES tiendas(id),
    id_vendedor INTEGER NOT NULL REFERENCES usuarios(id),
    nombre_cliente TEXT,
    tipo TEXT NOT NULL DEFAULT 'venta' CHECK (tipo IN ('venta','devolucion')),
    id_venta_origen INTEGER REFERENCES ventas(id),
    total NUMERIC NOT NULL DEFAULT 0 CHECK (total >= 0),
    forma_pago TEXT,
    con_factura INTEGER NOT NULL DEFAULT 0 CHECK (con_factura IN (0,1)),
    estado TEXT NOT NULL DEFAULT 'completada' CHECK (estado IN ('completada','anulada')),
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK ((tipo = 'venta' AND id_venta_origen IS NULL)
        OR (tipo = 'devolucion' AND id_venta_origen IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS detalle_ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_venta INTEGER NOT NULL REFERENCES ventas(id),
    id_producto INTEGER NOT NULL REFERENCES productos(id),
    id_detalle_origen INTEGER REFERENCES detalle_ventas(id),
    cantidad REAL NOT NULL CHECK (cantidad > 0),
    precio_venta_real NUMERIC NOT NULL DEFAULT 0 CHECK (precio_venta_real >= 0),
    costo_unitario NUMERIC NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
    sub_total NUMERIC NOT NULL DEFAULT 0 CHECK (sub_total >= 0),
    reingresa_stock INTEGER NOT NULL DEFAULT 1 CHECK (reingresa_stock IN (0,1))
);

CREATE TABLE IF NOT EXISTS kardex (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tienda INTEGER NOT NULL REFERENCES tiendas(id),
    id_producto INTEGER NOT NULL REFERENCES productos(id),
    id_usuario INTEGER REFERENCES usuarios(id),
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tipo_movimiento TEXT NOT NULL CHECK (tipo_movimiento IN (
        'compra','venta','devolucion','ajuste_entrada','ajuste_salida',
        'traspaso_entrada','traspaso_salida','carga_inicial'
    )),
    motivo TEXT,
    referencia_id INTEGER,
    cantidad REAL NOT NULL CHECK (cantidad > 0),
    stock_anterior REAL NOT NULL CHECK (stock_anterior >= 0),
    stock_nuevo REAL NOT NULL CHECK (stock_nuevo >= 0),
    costo_unitario NUMERIC NOT NULL DEFAULT 0 CHECK (costo_unitario >= 0),
    costo_promedio_anterior NUMERIC NOT NULL DEFAULT 0 CHECK (costo_promedio_anterior >= 0),
    costo_promedio_nuevo NUMERIC NOT NULL DEFAULT 0 CHECK (costo_promedio_nuevo >= 0)
);

CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_tienda INTEGER NOT NULL REFERENCES tiendas(id),
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id),
    fecha TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    concepto TEXT NOT NULL,
    descripcion TEXT,
    monto NUMERIC NOT NULL CHECK (monto > 0),
    estado TEXT NOT NULL DEFAULT 'vigente' CHECK (estado IN ('vigente','anulado'))
);
