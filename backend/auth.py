
from functools import wraps
from flask import session, jsonify


def login_requerido(func):
    @wraps(func)
    def decorador(*args, **kwargs):

        if "usuario_id" not in session:
            return jsonify({
                "error": "Debes iniciar sesión"
            }), 401

        return func(*args, **kwargs)

    return decorador


def roles_permitidos(*roles):
    def decorador_rol(func):

        @wraps(func)
        def verificar(*args, **kwargs):

            if "usuario_id" not in session:
                return jsonify({
                    "error": "Debes iniciar sesión"
                }), 401

            if session.get("rol") not in roles:
                return jsonify({
                    "error": "No tienes permisos para esta operación"
                }), 403

            return func(*args, **kwargs)

        return verificar

    return decorador_rol
