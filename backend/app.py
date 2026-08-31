#servidor principal todo backend en este proyecto para python
from flask import Flask, jsonify
from flask_cors import CORS

from routes.productos import productos_bp
from routes.ventas import ventas_bp
from routes.kardex import kardex_bp


app = Flask(__name__)

# Permitir conexiones desde el frontend
CORS(app)


# Registrar las rutas
app.register_blueprint(productos_bp)
app.register_blueprint(ventas_bp)
app.register_blueprint(kardex_bp)


# Ruta principal
@app.route("/")
def inicio():
    return jsonify({
        "mensaje": "API Inventario Choco funcionando"
    })


# Ejecutar servidor
if __name__ == "__main__":
    app.run(
        debug=True,
        host="0.0.0.0",
        port=5000
    )