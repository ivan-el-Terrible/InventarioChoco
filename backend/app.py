import os
import sys
from pathlib import Path
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from config import obtener_clave_secreta
from database.database import init_db, ULTIMO_ESTADO
from routes.productos import productos_bp
from routes.proveedores import proveedores_bp
from routes.ventas import ventas_bp
from routes.kardex import kardex_bp
from routes.usuarios import usuarios_bp
from routes.dashboard import dashboard_bp
from routes.gastos import gastos_bp
from routes.mantenimiento import mantenimiento_bp

if getattr(sys, 'frozen', False):
    CARPETA_RECURSOS = Path(sys._MEIPASS)
else:
    CARPETA_RECURSOS = Path(__file__).resolve().parent.parent
FRONTEND_DIST = CARPETA_RECURSOS / 'frontend' / 'dist'

app = Flask(__name__, static_folder=None)
app.config['SECRET_KEY'] = obtener_clave_secreta()
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('APP_HTTPS', '0') == '1'

CORS(app, origins=['http://localhost:5173'], supports_credentials=True)

init_db()

app.register_blueprint(productos_bp)
app.register_blueprint(proveedores_bp)
app.register_blueprint(ventas_bp)
app.register_blueprint(kardex_bp)
app.register_blueprint(usuarios_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(gastos_bp)
app.register_blueprint(mantenimiento_bp)

@app.route('/api/estado')
def estado_api():
    """Estado de la conexion con la base de datos en la nube."""
    return jsonify({
        'mensaje': 'API InventarioChoco conectada a Turso',
        'base_datos': ULTIMO_ESTADO['base'],
        'estado': ULTIMO_ESTADO['estado'],
        'tablas': ULTIMO_ESTADO['tablas'],
        'detalle': ULTIMO_ESTADO['mensaje'],
    })

@app.before_request
def servir_app_en_navegacion():
    """Evita que al recargar se muestre JSON en lugar de la página.

    Varias rutas de la API coinciden con rutas de React (por ejemplo
    GET /ventas). Cuando el navegador pide HTML (recargar o escribir la
    URL) devolvemos index.html; cuando lo pide un fetch de JavaScript
    (Accept: */*) seguimos devolviendo el JSON.
    """
    if request.method != 'GET' or request.path.startswith('/api/'):
        return None
    if 'text/html' not in request.headers.get('Accept', ''):
        return None
    if request.path == '/' or not FRONTEND_DIST.is_dir():
        return None
    if '..' in request.path:
        return None
    archivo = (FRONTEND_DIST / request.path.lstrip('/')).resolve()
    if str(archivo).startswith(str(FRONTEND_DIST.resolve())) and archivo.is_file():
        return None  # Es un archivo real del dist (js, css, imagen).
    return send_from_directory(str(FRONTEND_DIST), 'index.html')


@app.route('/')
def inicio():
    return send_from_directory(str(FRONTEND_DIST), 'index.html')

@app.route('/<path:ruta>')
def servir_react(ruta):
    archivo = FRONTEND_DIST / ruta
    if archivo.is_file():
        return send_from_directory(str(FRONTEND_DIST), ruta)
    return send_from_directory(str(FRONTEND_DIST), 'index.html')

if __name__ == '__main__':
    # Modo desarrollo: Ctrl+C detiene el servidor, sin icono de bandeja.
    # La version portable con pystray se reincorporara al empaquetar.
    from waitress import serve
    print('InventarioChoco: http://127.0.0.1:5000')
    serve(app, host='127.0.0.1', port=5000, threads=4)
