
# Conexion y configuracion de SQLite

import os
import sys
import sqlite3
from pathlib import Path


# ==========================================
# RUTAS DEL PROYECTO
# ==========================================

# Carpeta donde esta database.py
BASE_DIR = Path(__file__).resolve().parent

# Detectar si estamos ejecutando un .exe
ES_EJECUTABLE = getattr(sys, "frozen", False)

# Base de datos de desarrollo
DB_DESARROLLO = BASE_DIR / "inventario.db"

# Base de datos del ejecutable
if ES_EJECUTABLE:
    carpeta_datos = Path(
        os.environ.get(
            "LOCALAPPDATA",
            str(Path.home())
        )
    ) / "InventarioChoco"

    carpeta_datos.mkdir(
        parents=True,
        exist_ok=True
    )

    DB_PATH = carpeta_datos / "inventario.db"

else:
    DB_PATH = DB_DESARROLLO  # Base de datos en la carpeta del proyecto


# Ruta del schema.sql
if ES_EJECUTABLE:
    SCHEMA_PATH = Path(sys._MEIPASS) / "database" / "schema.sql"
else:
    SCHEMA_PATH = BASE_DIR / "schema.sql"


# ==========================================
# CONEXION A LA BASE DE DATOS
# ==========================================

def get_db():

    conn = sqlite3.connect(str(DB_PATH))

    # Acceder a columnas por nombre
    conn.row_factory = sqlite3.Row

    # Activar claves foraneas
    conn.execute("PRAGMA foreign_keys = ON")

    return conn


# ==========================================
# INICIALIZAR BASE DE DATOS
# ==========================================

def init_db():

    # Verificar si ya existe la base
    base_nueva = not Path(DB_PATH).exists()

    conn = get_db()

    try:
        # Leer estructura de tablas
        with open(
            SCHEMA_PATH,
            "r",
            encoding="utf-8"
        ) as archivo:
            schema = archivo.read()

        # Crear tablas si no existen
        conn.executescript(schema)

        conn.commit()

        if base_nueva:
            print("Nueva base de datos creada.")
        else:
            print("Base de datos existente cargada.")

        print(f"Ruta de SQLite: {DB_PATH}")

    finally:
        conn.close()

def existe_administrador():
    conn = get_db()

    try:
        resultado = conn.execute(
            """
            SELECT 1
            FROM usuarios
            WHERE rol = 'admin'
            LIMIT 1
            """
        ).fetchone()

        return resultado is not None

    finally:
        conn.close()