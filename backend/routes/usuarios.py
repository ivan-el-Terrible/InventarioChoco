


from flask import Blueprint, request, jsonify, session 
from werkzeug.security import generate_password_hash, check_password_hash

from database.database import get_db
from auth import login_requerido, roles_permitidos


usuarios_bp = Blueprint("usuarios", __name__)

# =========================================
# VERIFICAR CONFIGURACION INICIAL
# =========================================

@usuarios_bp.route("/configuracion/estado", methods=["GET"])
def estado_configuracion():

    db = get_db()

    try:
        cantidad = db.execute("""
            SELECT COUNT(*)
            FROM usuarios
        """).fetchone()[0]

        return jsonify({
            "requiere_configuracion": cantidad == 0
        }), 200

    finally:
        db.close()


# =========================================
# CREAR PRIMER ADMINISTRADOR
# =========================================

@usuarios_bp.route("/configuracion/administrador", methods=["POST"])
def crear_administrador_inicial():

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "error": "Datos inválidos"
        }), 400

    nombre = str(datos.get("nombre") or "").strip()
    email = str(datos.get("email") or "").strip().lower()
    password = datos.get("password")

    if not nombre or not email or not isinstance(password, str):
        return jsonify({
            "error": "Todos los campos son obligatorios"
        }), 400

    if "@" not in email:
        return jsonify({
            "error": "Correo electrónico inválido"
        }), 400

    if len(password) < 8:
        return jsonify({
            "error": "La contraseña debe tener al menos 8 caracteres"
        }), 400

    db = get_db()

    try:
        # Impedir dos configuraciones simultáneas
        db.execute("BEGIN IMMEDIATE")

        cantidad = db.execute("""
            SELECT COUNT(*)
            FROM usuarios
        """).fetchone()[0]

        if cantidad > 0:
            db.rollback()

            return jsonify({
                "error": "El administrador inicial ya fue configurado"
            }), 403

        password_hash = generate_password_hash(password)

        cursor = db.execute("""
            INSERT INTO usuarios (
                nombre,
                email,
                password,
                rol,
                activo
            )
            VALUES (?, ?, ?, 'admin', 1)
        """, (
            nombre,
            email,
            password_hash
        ))

        db.commit()

        return jsonify({
            "mensaje": "Administrador creado correctamente",
            "id": cursor.lastrowid
        }), 201

    except Exception:
        db.rollback()

        return jsonify({
            "error": "No se pudo crear el administrador"
        }), 500

    finally:
        db.close()



# =========================================
# LISTAR USUARIOS
# =========================================


@usuarios_bp.route("/usuarios", methods=["GET"])
@roles_permitidos("admin")
def obtener_usuarios():

    db = get_db()

    usuarios = db.execute("""
        SELECT
            id,
            nombre,
            email,
            rol,
            activo,
            fecha_creacion
        FROM usuarios
        ORDER BY id DESC
    """).fetchall()

    db.close()

    resultado = []

    for usuario in usuarios:
        datos = dict(usuario)
        datos["activo"] = bool(datos["activo"])
        resultado.append(datos)

    return jsonify(resultado)


# =========================================
# CREAR USUARIO
# =========================================

@usuarios_bp.route("/usuarios", methods=["POST"])
@roles_permitidos("admin")
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
                rol,
                activo
            )
            VALUES (?, ?, ?, ?, ?)
        """, (
            nombre,
            email,
            password_hash,
            rol,
            1  # activo 
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
    
    if usuario["activo"] == 0:
        return jsonify({
            "error": "Tu cuenta está inactiva. Contacta al administrador."
    }), 403
    
    # Crear sesión del usuario autenticado
    session.clear()
    session["usuario_id"] = usuario["id"]
    session["nombre"] = usuario["nombre"]
    session["rol"] = usuario["rol"]

    return jsonify({
        "mensaje": "Login correcto",
        "usuario": {
            "id": usuario["id"],
            "nombre": usuario["nombre"],
            "email": usuario["email"],
            "rol": usuario["rol"]
        }
    })


# =========================================
# CONSULTAR USUARIO AUTENTICADO
# =========================================

@usuarios_bp.route("/sesion", methods=["GET"])
@login_requerido
def obtener_sesion():

    return jsonify({
        "usuario": {
            "id": session["usuario_id"],
            "nombre": session["nombre"],
            "rol": session["rol"]
        }
    }), 200


# =========================================
# CERRAR SESIÓN
# =========================================

@usuarios_bp.route("/logout", methods=["POST"])
@login_requerido
def logout():

    session.clear()

    return jsonify({
        "mensaje": "Sesión cerrada correctamente"
    }), 200

# =========================================
# ELIMINAR USUARIO
# =========================================

@usuarios_bp.route("/usuarios/<int:id_usuario>", methods=["DELETE"])
@roles_permitidos("admin")
def eliminar_usuario(id_usuario):

    db = get_db()

    try:
        # 1. Evitar que el administrador elimine su propia cuenta
        if session.get("usuario_id") == id_usuario:
            return jsonify({
                "error": "No puedes eliminar tu propia cuenta"
            }), 400

        # 2. Verificar si el usuario existe
        usuario = db.execute("""
            SELECT id, nombre
            FROM usuarios
            WHERE id = ?
        """, (id_usuario,)).fetchone()

        if usuario is None:
            return jsonify({
                "error": "El usuario no existe"
            }), 404

        # 3. Verificar si tiene ventas registradas
        ventas = db.execute("""
            SELECT COUNT(*)
            FROM ventas
            WHERE id_vendedor = ?
        """, (id_usuario,)).fetchone()[0]

        if ventas > 0:
            return jsonify({
                "error": "No puedes eliminar este usuario porque tiene ventas registradas"
            }), 409

        # 4. Eliminar al usuario
        db.execute("""
            DELETE FROM usuarios
            WHERE id = ?
        """, (id_usuario,))

        db.commit()

        return jsonify({
            "mensaje": "Usuario eliminado correctamente"
        }), 200

    except Exception:
        db.rollback()

        return jsonify({
            "error": "Ocurrió un error al eliminar el usuario"
        }), 500

    finally:
        db.close()

# =========================================
# ACTIVAR / DESACTIVAR USUARIO
# =========================================

@usuarios_bp.route("/usuarios/<int:id_usuario>/estado", methods=["PATCH"])
@roles_permitidos("admin")
def cambiar_estado_usuario(id_usuario):

    data = request.get_json(silent=True)

    if not isinstance(data, dict) or type(data.get("activo")) is not bool:
        return jsonify({
            "error": "Debes enviar activo como true o false"
        }), 400

    activo = int(data["activo"])

    if session.get("usuario_id") == id_usuario and activo == 0:
        return jsonify({
            "error": "No puedes desactivar tu propia cuenta"
        }), 400

    db = get_db()

    try:
        usuario = db.execute("""
            SELECT id, nombre
            FROM usuarios
            WHERE id = ?
        """, (id_usuario,)).fetchone()

        if usuario is None:
            return jsonify({
                "error": "El usuario no existe"
            }), 404

        db.execute("""
            UPDATE usuarios
            SET activo = ?
            WHERE id = ?
        """, (activo, id_usuario))

        db.commit()

        return jsonify({
            "mensaje": "Estado actualizado correctamente",
            "activo": bool(activo)
        }), 200

    except Exception:
        db.rollback()

        return jsonify({
            "error": "No se pudo actualizar el estado del usuario"
        }), 500

    finally:
        db.close()