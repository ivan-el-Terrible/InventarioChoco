# Conexion y configuracion de la base de datos SQLite

import sqlite3
import os


# Carpeta donde se encuentra este archivo
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Ruta de la base de datos
DB_PATH = os.path.join(BASE_DIR, "inventario.db")

# Ruta del schema
SCHEMA_PATH = os.path.join(BASE_DIR, "schema.sql")


# -----------------------------------------
# CONEXION A LA BASE DE DATOS
# -----------------------------------------

def get_db():

    conn = sqlite3.connect(DB_PATH)

    # Permite acceder a las columnas por nombre
    conn.row_factory = sqlite3.Row

    # Activar claves foraneas
    conn.execute("PRAGMA foreign_keys = ON")

    return conn


# -----------------------------------------
# INICIALIZAR BASE DE DATOS
# -----------------------------------------

def init_db():

    conn = sqlite3.connect(DB_PATH)

    conn.execute("PRAGMA foreign_keys = ON")

    # Leer schema.sql
    with open(SCHEMA_PATH, "r", encoding="utf-8") as archivo:
        schema = archivo.read()

    # Ejecutar todas las instrucciones SQL
    conn.executescript(schema)

    conn.commit()
    conn.close()

    print("Base de datos inicializada correctamente.")