
import sys
from pathlib import Path

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from config import obtener_clave_secreta
from database.database import init_db

from routes.productos import productos_bp
from routes.proveedores import proveedores_bp
from routes.ventas import ventas_bp
from routes.kardex import kardex_bp
from routes.usuarios import usuarios_bp
from routes.dashboard import dashboard_bp


# =========================================
# UBICACION DEL FRONTEND COMPILADO
# =========================================

if getattr(sys, "frozen", False):
    # Ubicacion de los recursos de PyInstaller
    CARPETA_RECURSOS = Path(sys._MEIPASS)
else:
    # Ubicacion del proyecto original
    CARPETA_RECURSOS = Path(__file__).resolve().parent.parent

FRONTEND_DIST = CARPETA_RECURSOS / "frontend" / "dist"


# =========================================
# CONFIGURACION DE FLASK
# =========================================

app = Flask(__name__, static_folder=None)

# Clave secreta persistente para sesiones
app.config["SECRET_KEY"] = obtener_clave_secreta()

# Configuracion de cookies
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False

# Permitir React en modo desarrollo con Vite
CORS(
    app,
    origins=["http://localhost:5173"],
    supports_credentials=True
)


# =========================================
# INICIALIZAR BASE DE DATOS
# =========================================

init_db()


# =========================================
# REGISTRAR RUTAS EXISTENTES
# =========================================

app.register_blueprint(productos_bp)
app.register_blueprint(proveedores_bp)
app.register_blueprint(ventas_bp)
app.register_blueprint(kardex_bp)
app.register_blueprint(usuarios_bp)
app.register_blueprint(dashboard_bp)


# =========================================
# API DE COMPROBACION
# =========================================

@app.route("/api/estado")
def estado_api():
    return jsonify({
        "mensaje": "API Inventario Choco funcionando"
    })


# =========================================
# MOSTRAR REACT DESDE FLASK
# =========================================

@app.route("/")
def inicio():
    return send_from_directory(
        str(FRONTEND_DIST),
        "index.html"
    )


@app.route("/<path:ruta>")
def servir_react(ruta):

    # Buscar el archivo solicitado en dist
    archivo = FRONTEND_DIST / ruta

    if archivo.is_file():
        return send_from_directory(
            str(FRONTEND_DIST),
            ruta
        )

    # Permitir rutas de React Router
    return send_from_directory(
        str(FRONTEND_DIST),
        "index.html"
    )


# =========================================
# INICIAR SERVIDOR
# =========================================

if __name__ == "__main__":
    import os
    import threading
    import time
    import webbrowser

    import pystray
    from PIL import Image, ImageDraw
    from waitress import create_server

    URL = "http://127.0.0.1:5000"

    def crear_icono():
        imagen = Image.new("RGB", (64, 64), "#F97316")
        dibujo = ImageDraw.Draw(imagen)

        dibujo.rounded_rectangle(
            (12, 12, 52, 52),
            radius=10,
            fill="#FFFFFF"
        )
        dibujo.text((23, 20), "IC", fill="#F97316")

        return imagen

    def abrir_navegador(icono=None, item=None):
        webbrowser.open(URL)

    servidor = create_server(
        app,
        host="127.0.0.1",
        port=5000,
        threads=4
    )

    def ejecutar_servidor():
        servidor.run()

    def cerrar_programa(icono, item):
        icono.stop()

        # Detener Waitress y finalizar el proceso.
        os._exit(0)

    hilo_servidor = threading.Thread(
        target=ejecutar_servidor,
        daemon=True
    )
    hilo_servidor.start()

    time.sleep(1)
    abrir_navegador()

    icono = pystray.Icon(
        "InventarioChoco",
        crear_icono(),
        "InventarioChoco",
        menu=pystray.Menu(
            pystray.MenuItem(
                "Abrir InventarioChoco",
                abrir_navegador
            ),
            pystray.MenuItem(
                "Salir de InventarioChoco",
                cerrar_programa
            )
        )
    )

    icono.run()