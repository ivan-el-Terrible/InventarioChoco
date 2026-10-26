
from config import obtener_clave_secreta
from routes.dashboard import dashboard_bp

from flask import Flask, jsonify
from flask_cors import CORS

from database.database import init_db

from routes.productos import productos_bp
from routes.proveedores import proveedores_bp
from routes.ventas import ventas_bp
from routes.kardex import kardex_bp
from routes.usuarios import usuarios_bp
#from routes.detalle_ventas import detalle_ventas_bp


app = Flask(__name__)

# Clave utilizada para firmar las sesiones.
# Debe mantenerse privada y ser siempre la misma.
app.config["SECRET_KEY"] = obtener_clave_secreta()

# Configuración de las cookies de sesión.
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = False  # Desarrollo local con HTTP

# Permitir que React envíe las cookies de sesión.
CORS(
    app,
    origins=["http://localhost:5173"],
    supports_credentials=True
)


# Inicializar la base de datos
init_db()


# Registrar rutas
app.register_blueprint(productos_bp)
app.register_blueprint(proveedores_bp)
app.register_blueprint(ventas_bp)
app.register_blueprint(kardex_bp)
app.register_blueprint(usuarios_bp)  # Asegúrate de importar usuarios_bp desde routes.usuarios.py si existe
app.register_blueprint(dashboard_bp)
#app.register_blueprint(detalle_ventas_bp) 

@app.route("/")
def inicio():
    return jsonify({
        "mensaje": "API Inventario Choco funcionando"
    })


if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )
#este es mi ultimo commit   