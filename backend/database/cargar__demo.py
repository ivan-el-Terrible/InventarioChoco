"""Carga demostracion para las ocho tablas. Ejecutar UNA sola vez.

Requiere TURSO_DATABASE_URL, TURSO_AUTH_TOKEN,
DEMO_ADMIN_PASSWORD y DEMO_VENDEDOR_PASSWORD.
"""
import os
from decimal import Decimal
from werkzeug.security import generate_password_hash
from database.database import get_db, init_db


def insertar(conn, sql, params):
    return conn.execute(sql, params).lastrowid


def cargar():
    clave_admin = os.environ.get('DEMO_ADMIN_PASSWORD', '')
    clave_vendedor = os.environ.get('DEMO_VENDEDOR_PASSWORD', '')
    if len(clave_admin) < 12 or len(clave_vendedor) < 12 or clave_admin == clave_vendedor:
        raise RuntimeError('Configura dos contrasenas de prueba distintas de al menos 12 caracteres.')
    init_db()
    db = get_db()
    try:
        # Evitar repetir la carga si ya hay datos reales o de demostracion.
        for tabla in ('tiendas','usuarios','productos','inventario','ventas',
                      'detalle_ventas','kardex','gastos'):
            if db.execute(f'SELECT 1 FROM {tabla} LIMIT 1').fetchone():
                raise RuntimeError(f'La tabla {tabla} no esta vacia. No se insertaron datos.')

        t1 = insertar(db, 'INSERT INTO tiendas(nombre,direccion) VALUES(?,?)', ('Tienda Centro DEMO', 'Direccion de prueba 1'))
        t2 = insertar(db, 'INSERT INTO tiendas(nombre,direccion) VALUES(?,?)', ('Tienda Norte DEMO', 'Direccion de prueba 2'))
        admin = insertar(db, 'INSERT INTO usuarios(nombre,email,password,rol,id_tienda) VALUES(?,?,?,?,?)',
                        ('Administrador Demo','admin.demo@example.invalid',generate_password_hash(clave_admin),'admin',None))
        vendedor = insertar(db, 'INSERT INTO usuarios(nombre,email,password,rol,id_tienda) VALUES(?,?,?,?,?)',
                           ('Vendedor Demo','vendedor.demo@example.invalid',generate_password_hash(clave_vendedor),'vendedor',t1))

        productos = [
            ('DEMO-001','Filtro de aceite','Volvo','unidad','Proveedor Demo A','70000001'),
            ('DEMO-002','Bomba de agua','Mercedes','unidad','Proveedor Demo B','70000002'),
            ('DEMO-003','Correa','Scania','unidad','Proveedor Demo C','70000003'),
        ]
        pids=[]
        for codigo,nombre,marca,unidad,proveedor,telefono in productos:
            pids.append(insertar(db, '''INSERT INTO productos(codigo,nombre,marca,unidad,proveedor,telefono_proveedor,categoria)
                VALUES(?,?,?,?,?,?,?)''', (codigo,nombre,marca,unidad,proveedor,telefono,'Repuestos DEMO')))

        # Stock actual: refleja las 3 salidas de venta de mas abajo.
        # stock inicial: 11, 6 y 9; ventas: 1, 1 y 2 unidades.
        datos = [(t1,pids[0],10,'80.00','80.00','120.50'),
                 (t1,pids[1],5,'250.00','250.00','350.00'),
                 (t2,pids[2],7,'30.00','30.00','45.00')]
        for tienda,producto,stock,compra,promedio,venta in datos:
            insertar(db, '''INSERT INTO inventario(id_tienda,id_producto,stock,precio_compra,costo_promedio,precio_venta)
                VALUES(?,?,?,?,?,?)''', (tienda,producto,stock,compra,promedio,venta))

        # Una venta por producto; dos ventas del vendedor y una del admin.
        operaciones = [
            (t1,vendedor,pids[0],1,'120.50','80.00',11,10),
            (t1,vendedor,pids[1],1,'350.00','250.00',6,5),
            (t2,admin,pids[2],2,'45.00','30.00',9,7),
        ]
        for tienda,usuario,producto,cantidad,precio,costo,antes,despues in operaciones:
            subtotal = str(Decimal(precio) * cantidad)
            venta_id = insertar(db, '''INSERT INTO ventas(id_tienda,id_vendedor,nombre_cliente,tipo,total,forma_pago,con_factura,estado)
                VALUES(?,?,?,'venta',?,? ,0,'completada')''',
                (tienda,usuario,'Cliente DEMO',subtotal,'efectivo'))
            insertar(db, '''INSERT INTO detalle_ventas(id_venta,id_producto,cantidad,precio_venta_real,costo_unitario,sub_total)
                VALUES(?,?,?,?,?,?)''', (venta_id,producto,cantidad,precio,costo,subtotal))
            insertar(db, '''INSERT INTO kardex(id_tienda,id_producto,id_usuario,tipo_movimiento,motivo,referencia_id,
                cantidad,stock_anterior,stock_nuevo,costo_unitario,costo_promedio_anterior,costo_promedio_nuevo)
                VALUES(?,?,?,'venta','Venta DEMO',?,?,?,?,?,?,?)''',
                (tienda,producto,usuario,venta_id,cantidad,antes,despues,costo,costo,costo))

        for tienda,usuario,concepto,monto in [
            (t1,admin,'Transporte DEMO','12.50'),
            (t1,vendedor,'Material de embalaje DEMO','8.75'),
            (t2,admin,'Limpieza DEMO','20.00')]:
            insertar(db, '''INSERT INTO gastos(id_tienda,id_usuario,concepto,descripcion,monto)
                VALUES(?,?,?,?,?)''', (tienda,usuario,concepto,'Registro de prueba',monto))
        db.commit()
        print('Carga DEMO completada: 2 tiendas, 2 usuarios, 3 productos, 3 inventarios, 3 ventas,')
        print('3 detalles, 3 movimientos Kardex y 3 gastos.')
        print('Usuarios: admin.demo@example.invalid y vendedor.demo@example.invalid')
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == '__main__':
    cargar()
