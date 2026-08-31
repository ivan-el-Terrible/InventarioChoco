from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

from database.database import get_db


usuarios_bp = Blueprint("usuarios", __name__)


# =========================================
# LISTAR USUARIOS
# =========================================

@usuarios_bp.route("/usuarios", methods=["GET"])
def obtener_usuarios():

    db = get_db()

    usuarios = db.execute("""
        SELECT
            id,
            nombre,
            email,
            rol,
            fecha_creacion
        FROM usuarios
        ORDER BY id DESC
    """).fetchall()

    db.close()

    return jsonify([dict(u) for u in usuarios])


# =========================================
# CREAR USUARIO
# =========================================

@usuarios_bp.route("/usuarios", methods=["POST"])
def crear_usuario():

    data = request.get_json()

    nombre = data.get("nombre")
    email = data.get("email")
    password = data.get("password")
    rol = data.get("rol", "vendedor")

    if not nombre or not email or not password:
        return jsonify({
            "error": "Nombre, email y contraseña son obligatorios"
        }), 400

    if rol not in ["admin", "vendedor"]:
        return jsonify({
            "error": "El rol debe ser admin o vendedor"
        }), 400

    password_hash = generate_password_hash(password)

    db = get_db()

    try:

        cursor = db.execute("""
            INSERT INTO usuarios (
                nombre,
                email,
                password,
                rol
            )
            VALUES (?, ?, ?, ?)
        """, (
            nombre,
            email,
            password_hash,
            rol
        ))

        db.commit()

        return jsonify({
            "mensaje": "Usuario creado correctamente",
            "id": cursor.lastrowid
        }), 201

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        db.close()


# =========================================
# LOGIN
# =========================================

@usuarios_bp.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({
            "error": "Email y contraseña son obligatorios"
        }), 400

    db = get_db()

    usuario = db.execute("""
        SELECT *
        FROM usuarios
        WHERE email = ?
    """, (email,)).fetchone()

    db.close()

    if usuario is None:
        return jsonify({
            "error": "Email o contraseña incorrectos"
        }), 401

    if not check_password_hash(usuario["password"], password):
        return jsonify({
            "error": "Email o contraseña incorrectos"
        }), 401

    return jsonify({
        "mensaje": "Login correcto",
        "usuario": {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "email": usuario["email"],
            "rol": usuario["rol"]
        }
    })