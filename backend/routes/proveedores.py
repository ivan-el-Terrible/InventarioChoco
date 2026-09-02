#logica del proveedor
from flask import Blueprint, request, jsonify
from database.database import get_db


proveedores_bp = Blueprint("proveedores", __name__)


# =========================================
# LISTAR PROVEEDORES
# =========================================

@proveedores_bp.route("/proveedores", methods=["GET"])
def obtener_proveedores():

    db = get_db()

    proveedores = db.execute("""
        SELECT *
        FROM proveedores
        ORDER BY id DESC
    """).fetchall()

    db.close()

    return jsonify([dict(p) for p in proveedores])


# =========================================
# OBTENER UN PROVEEDOR
# =========================================

@proveedores_bp.route("/proveedores/<int:id>", methods=["GET"])
def obtener_proveedor(id):

    db = get_db()

    proveedor = db.execute("""
        SELECT *
        FROM proveedores
        WHERE id = ?
    """, (id,)).fetchone()

    db.close()

    if proveedor is None:
        return jsonify({
            "error": "Proveedor no encontrado"
        }), 404

    return jsonify(dict(proveedor))


# =========================================
# CREAR PROVEEDOR
# =========================================

@proveedores_bp.route("/proveedores", methods=["POST"])
def crear_proveedor():

    data = request.get_json()

    nomEmpresa = data.get("nomEmpresa")
    telefono = data.get("telefono")
    email = data.get("email")

    if not nomEmpresa:
        return jsonify({
            "error": "El nombre de la empresa es obligatorio"
        }), 400

    db = get_db()

    try:

        cursor = db.execute("""
            INSERT INTO proveedores (
                nomEmpresa,
                telefono,
                email
            )
            VALUES (?, ?, ?)
        """, (
            nomEmpresa,
            telefono,
            email
        ))

        db.commit()

        return jsonify({
            "mensaje": "Proveedor registrado correctamente",
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
# ACTUALIZAR PROVEEDOR
# =========================================

@proveedores_bp.route("/proveedores/<int:id>", methods=["PUT"])
def actualizar_proveedor(id):

    data = request.get_json()

    nomEmpresa = data.get("nomEmpresa")
    telefono = data.get("telefono")
    email = data.get("email")

    if not nomEmpresa:
        return jsonify({
            "error": "El nombre de la empresa es obligatorio"
        }), 400

    db = get_db()

    try:

        cursor = db.execute("""
            UPDATE proveedores
            SET
                nomEmpresa = ?,
                telefono = ?,
                email = ?
            WHERE id = ?
        """, (
            nomEmpresa,
            telefono,
            email,
            id
        ))


        if cursor.rowcount == 0:
            return jsonify({
                "error": "Proveedor no encontrado"
            }), 404

        db.commit()

        return jsonify({
            "mensaje": "Proveedor actualizado correctamente"
        })

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": str(e)
        }), 400

    finally:
        db.close()


# =========================================
# ELIMINAR PROVEEDOR
# =========================================

@proveedores_bp.route("/proveedores/<int:id>", methods=["DELETE"])
def eliminar_proveedor(id):

    db = get_db()

    try:

        cursor = db.execute("""
            DELETE FROM proveedores
            WHERE id = ?
        """, (id,))


        if cursor.rowcount == 0:
            return jsonify({
                "error": "Proveedor no encontrado"
            }), 404

        db.commit()

        return jsonify({
            "mensaje": "Proveedor eliminado correctamente"
        })

    except Exception as e:

        db.rollback()

        return jsonify({
            "error": "No se puede eliminar el proveedor. "
                      "Puede estar relacionado con productos."
        }), 400

    finally:
        db.close()
