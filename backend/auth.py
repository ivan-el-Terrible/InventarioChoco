
from functools import wraps
from flask import session, jsonify

from database.database import get_db


# =========================================
# VERIFICAR USUARIO ACTUAL
# =========================================

def verificar_usuario_actual():

    usuario_id = session.get("usuario_id")

    if usuario_id is None:
        return None, (
            jsonify({
                "error": "Debes iniciar sesión"
            }),
            401
        )

    db = get_db()

    try:
        usuario = db.execute("""
            SELECT id, nombre, rol, activo
            FROM usuarios
            WHERE id = ?
        """, (usuario_id,)).fetchone()

    finally:
        db.close()

    if usuario is None or usuario["activo"] == 0:
        session.clear()

        return None, (
            jsonify({
                "error": "Tu cuenta está inactiva o ya no existe"
            }),
            401
        )

    # Mantener la información de sesión actualizada
    session["nombre"] = usuario["nombre"]
    session["rol"] = usuario["rol"]

    return usuario, None


# =========================================
# LOGIN REQUERIDO
# =========================================

def login_requerido(func):

    @wraps(func)
    def decorador(*args, **kwargs):

        usuario, error = verificar_usuario_actual()

        if error is not None:
            return error

        return func(*args, **kwargs)

    return decorador


# =========================================
# VERIFICAR ROLES PERMITIDOS
# =========================================

def roles_permitidos(*roles):

    def decorador_rol(func):

        @wraps(func)
        def verificar(*args, **kwargs):

            usuario, error = verificar_usuario_actual()

            if error is not None:
                return error

            if usuario["rol"] not in roles:
                return jsonify({
                    "error": "No tienes permisos para esta operación"
                }), 403

            return func(*args, **kwargs)

        return verificar

    return decorador_rol
