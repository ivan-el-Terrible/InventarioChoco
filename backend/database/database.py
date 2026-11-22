"""Conexion a la base de datos de InventarioChoco.

MODO NUBE: si backend/.env trae credenciales de Turso, se usa la base remota.
MODO LOCAL: si no hay credenciales en la nube (por ejemplo un portable sin
configurar), se usa backend/database/inventario.db con la MISMA estructura
que la nube, definida en schema.sql.
"""
import os
import sqlite3
import threading
from pathlib import Path

import libsql

BASE_DIR = Path(__file__).resolve().parent     # backend/database
ARCHIVO_ENV = BASE_DIR.parent / '.env'         # backend/.env
SCHEMA_PATH = BASE_DIR / 'schema.sql'
ARCHIVO_LOCAL = BASE_DIR / 'inventario.db'     # modo local (sin nube)


def _cargar_env():
    """Carga backend/.env sin sobrescribir variables ya definidas."""
    if not ARCHIVO_ENV.exists():
        return
    for linea in ARCHIVO_ENV.read_text(encoding='utf-8').splitlines():
        linea = linea.strip()
        if not linea or linea.startswith('#') or '=' not in linea:
            continue
        clave, _, valor = linea.partition('=')
        clave = clave.strip()
        valor = valor.strip().strip('"').strip("'")
        if clave and valor and clave not in os.environ:
            os.environ[clave] = valor


_cargar_env()


class Fila:
    """Compatibilidad basica con sqlite3.Row: fila[0], fila['nombre'], dict(fila)."""
    def __init__(self, nombres, valores):
        self._nombres = tuple(nombres)
        self._valores = tuple(valores)
        self._mapa = dict(zip(self._nombres, self._valores))

    def __getitem__(self, clave):
        return self._valores[clave] if isinstance(clave, (int, slice)) else self._mapa[clave]

    def __iter__(self):
        return iter(self._valores)

    def __len__(self):
        return len(self._valores)

    def keys(self):
        return self._nombres

    def items(self):
        return self._mapa.items()


class CursorCompatible:
    def __init__(self, cursor):
        self._cursor = cursor
        self._nombres = [col[0] for col in (cursor.description or [])]

    def fetchone(self):
        fila = self._cursor.fetchone()
        return None if fila is None else Fila(self._nombres, fila)

    def fetchall(self):
        return [Fila(self._nombres, fila) for fila in self._cursor.fetchall()]

    def fetchmany(self, size=1):
        return [Fila(self._nombres, fila) for fila in self._cursor.fetchmany(size)]

    def __iter__(self):
        for fila in self._cursor:
            yield Fila(self._nombres, fila)

    def execute(self, sql, parametros=()):
        self._cursor.execute(sql, parametros)
        self._nombres = [col[0] for col in (self._cursor.description or [])]
        return self

    def executemany(self, sql, parametros):
        self._cursor.executemany(sql, parametros)
        self._nombres = [col[0] for col in (self._cursor.description or [])]
        return self

    def __getattr__(self, nombre):
        return getattr(self._cursor, nombre)


class ConexionCompatible:
    def __init__(self, conexion):
        self._conexion = conexion

    def execute(self, sql, parametros=()):
        return CursorCompatible(self._conexion.execute(sql, parametros))

    def executemany(self, sql, parametros):
        return CursorCompatible(self._conexion.executemany(sql, parametros))

    def cursor(self):
        return CursorCompatible(self._conexion.cursor())

    def commit(self):
        return self._conexion.commit()

    def rollback(self):
        return self._conexion.rollback()

    def close(self):
        return self._conexion.close()

    def __enter__(self):
        return self

    def __exit__(self, tipo, valor, traza):
        if tipo:
            self.rollback()
        else:
            self.commit()
        self.close()


# Tablas y columnas reales de la base en la nube (ver schema.sql).
TABLAS_REQUERIDAS = {
    'tiendas': ('id', 'nombre', 'direccion', 'activo'),
    'usuarios': ('id', 'nombre', 'email', 'password', 'rol', 'id_tienda',
                 'activo', 'fecha_creacion'),
    'productos': ('id', 'cod_origen', 'codigo', 'nombre', 'categoria',
                  'descripcion', 'marca', 'unidad', 'proveedor',
                  'telefono_proveedor', 'activo', 'fecha'),
    'inventario': ('id', 'id_tienda', 'id_producto', 'stock', 'precio_compra',
                   'costo_promedio', 'precio_venta'),
    'ventas': ('id', 'id_tienda', 'id_vendedor', 'nombre_cliente', 'tipo',
               'total', 'forma_pago', 'con_factura', 'estado', 'fecha'),
    'detalle_ventas': ('id', 'id_venta', 'id_producto', 'cantidad',
                       'precio_venta_real', 'costo_unitario', 'sub_total'),
    'kardex': ('id', 'id_tienda', 'id_producto', 'id_usuario', 'fecha',
               'tipo_movimiento', 'motivo', 'referencia_id', 'cantidad',
               'stock_anterior', 'stock_nuevo', 'costo_unitario',
               'costo_promedio_anterior', 'costo_promedio_nuevo'),
    'gastos': ('id', 'id_tienda', 'id_usuario', 'concepto', 'monto', 'estado'),
}

# Ultimo resultado de init_db: lo muestra /api/estado y probar_conexion.py.
ULTIMO_ESTADO = {
    'estado': 'sin_conectar',
    'base': None,
    'tablas': [],
    'mensaje': 'Todavia no se ha conectado a Turso.',
}


def url_turso():
    return os.environ.get('TURSO_DATABASE_URL', '').strip()


def credenciales_nube():
    """(url, token) de Turso si estan completas; None si no hay nube configurada."""
    url = url_turso()
    token = os.environ.get('TURSO_AUTH_TOKEN', '').strip()
    if not url or not token or 'PEGA_AQUI' in (url + token).upper():
        return None
    if not url.startswith(('libsql://', 'https://')):
        raise RuntimeError('TURSO_DATABASE_URL debe comenzar con libsql:// o https://')
    return url, token


def en_nube():
    """True si hay credenciales de Turso; False = modo local (SQLite)."""
    return credenciales_nube() is not None


class ConexionNube:
    """Conexion a Turso reutilizable entre peticiones del MISMO hilo.

    Cada `libsql.connect` a la nube cuesta ~0.5 s (DNS + TLS + sesion) y cada
    consulta ~0.2 s de ida y vuelta. Guardar la conexion por hilo evita
    reconectarse en cada peticion. Si la sesion caduca, se reconecta una vez
    y se reintenta la consulta.
    """

    def __init__(self, url, token):
        self._url = url
        self._token = token

    def _conexion(self):
        conn = getattr(_hilos, 'conexion_nube', None)
        if conn is None:
            conn = libsql.connect(database=self._url, auth_token=self._token)
            try:
                # Solo al conectar: es un round trip mas a Turso.
                conn.execute('PRAGMA foreign_keys = ON')
            except Exception:
                pass  # Turso puede rechazar el PRAGMA; no bloquea.
            _hilos.conexion_nube = conn
        return conn

    def _reconectar(self):
        vieja = getattr(_hilos, 'conexion_nube', None)
        if vieja is not None:
            try:
                vieja.close()
            except Exception:
                pass
        _hilos.conexion_nube = None
        return self._conexion()

    def _llamar(self, metodo, *args):
        try:
            return getattr(self._conexion(), metodo)(*args)
        except Exception as error:
            if not _es_error_deconexion(error):
                raise
            # La sesion pudo caducar: se reconecta y se reintenta una vez.
            return getattr(self._reconectar(), metodo)(*args)

    def execute(self, sql, parametros=()):
        return CursorCompatible(self._llamar('execute', sql, parametros))

    def executemany(self, sql, filas):
        return CursorCompatible(self._llamar('executemany', sql, filas))

    def cursor(self):
        return CursorCompatible(self._conexion().cursor())

    def commit(self):
        self._llamar('commit')

    def rollback(self):
        self._llamar('rollback')

    def close(self):
        """No cierra: la conexion se reutiliza en la siguiente peticion."""
        pass

    def __enter__(self):
        return self

    def __exit__(self, tipo, valor, traza):
        if tipo:
            self.rollback()
        else:
            self.commit()
        self.close()


_hilos = threading.local()


def _es_error_deconexion(error):
    """True si el error parece de red/sesion (no un error de SQL)."""
    texto = str(error).lower()
    if 'sqlite' in texto or 'constraint' in texto or 'input error' in texto:
        return False
    marcas = (
        'dns error', 'http error', 'timeout', 'timed out', 'connection',
        'connect', 'broken pipe', 'socket', 'unreachable', 'reset by peer',
        'stream error',
    )
    return any(marca in texto for marca in marcas)


def get_db():
    """Conexion a Turso (nube) o a backend/database/inventario.db (modo local)."""
    cred = credenciales_nube()
    if cred is None:
        # Modo local: el portable o un equipo sin .env usan SQLite con la
        # MISMA estructura que la nube (schema.sql).
        conn = sqlite3.connect(str(ARCHIVO_LOCAL))
        conn.execute('PRAGMA foreign_keys = ON')
        return ConexionCompatible(conn)

    url, token = cred
    return ConexionNube(url, token)


def tienda_actual(db, id_tienda_usuario=None):
    """Id de tienda a usar: la del usuario o la primera tienda activa."""
    if id_tienda_usuario:
        return int(id_tienda_usuario)
    fila = db.execute(
        "SELECT id FROM tiendas WHERE activo = 1 ORDER BY id LIMIT 1"
    ).fetchone()
    if fila is None:
        raise RuntimeError(
            'No hay tiendas registradas en Turso. Configura el sistema inicial '
            'para crear la primera tienda.'
        )
    return int(fila['id'])


def tienda_param(db, rol, id_tienda_usuario=None, id_tienda_param=None):
    """Tienda elegida en la query string (solo admin) o la del usuario.

    Si el parámetro no existe o no está activo se usa el valor por defecto.
    """
    if rol == 'admin' and id_tienda_param:
        fila = db.execute(
            "SELECT id FROM tiendas WHERE id = ? AND activo = 1",
            (id_tienda_param,)
        ).fetchone()
        if fila:
            return int(fila['id'])
    return tienda_actual(db, id_tienda_usuario)


def _tablas(conn):
    return {fila['name'] for fila in conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()}


def _columnas(conn, tabla):
    cursor = conn.execute(f'SELECT * FROM "{tabla}" LIMIT 0')
    return {col[0] for col in (cursor.description or ())}


def _crear_esquema(conn):
    """Ejecuta schema.sql sentencia por sentencia (CREATE TABLE IF NOT EXISTS)."""
    for sentencia in SCHEMA_PATH.read_text(encoding='utf-8').split(';'):
        sentencia = sentencia.strip()
        if sentencia:
            conn.execute(sentencia)


def init_db():
    """Verifica el esquema y crea con schema.sql las tablas que falten.

    Funciona igual en nube (Turso) y en modo local (SQLite).
    """
    conn = get_db()
    try:
        faltantes = set(TABLAS_REQUERIDAS) - _tablas(conn)
        if faltantes:
            _crear_esquema(conn)
            faltantes = set(TABLAS_REQUERIDAS) - _tablas(conn)
            if faltantes:
                raise RuntimeError(
                    'No se pudieron crear las tablas: ' + ', '.join(sorted(faltantes))
                )

        incompletas = []
        for tabla, requeridas in TABLAS_REQUERIDAS.items():
            sin_col = set(requeridas) - _columnas(conn, tabla)
            if sin_col:
                incompletas.append(
                    f'{tabla} (faltan: {", ".join(sorted(sin_col))})'
                )
        if incompletas:
            raise RuntimeError(
                'La base de datos usa un esquema distinto al del proyecto. '
                'Revisa backend/database/schema.sql. Tablas afectadas: '
                + '; '.join(incompletas)
            )

        nombres = sorted(set(TABLAS_REQUERIDAS) & _tablas(conn))
        if en_nube():
            base = url_turso()
            mensaje = (
                f'Conectado a Turso: {base} '
                f'({len(nombres)} tablas verificadas)'
            )
        else:
            base = str(ARCHIVO_LOCAL)
            mensaje = (
                f'MODO LOCAL (sin credenciales en la nube): {base} '
                f'({len(nombres)} tablas verificadas)'
            )
        ULTIMO_ESTADO.update({
            'estado': 'conectada',
            'base': base,
            'tablas': nombres,
            'mensaje': mensaje,
        })
        print('=' * 62, flush=True)
        print(f'  BASE DE DATOS: {base}', flush=True)
        print(f'  Tablas verificadas ({len(nombres)}): ' + ', '.join(nombres),
              flush=True)
        print('=' * 62, flush=True)
    finally:
        conn.close()


def existe_administrador():
    conn = get_db()
    try:
        return conn.execute("SELECT 1 FROM usuarios WHERE rol='admin' LIMIT 1").fetchone() is not None
    finally:
        conn.close()
