"""Muestra si el proyecto esta conectado a la base de datos de la nube.

Ejecutar desde la carpeta backend:  py probar_conexion.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from database.database import get_db, TABLAS_REQUERIDAS, url_turso  # noqa: E402


def main():
    print('-' * 62)
    print('VERIFICANDO CONEXION CON LA BASE DE DATOS EN LA NUBE')
    print('-' * 62)
    print(f'URL: {url_turso()}')

    db = get_db()
    try:
        tablas = sorted(
            fila['name'] for fila in db.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        )
        print('Conexion: OK (respuesta recibida desde Turso)')
        print(f'Tablas encontradas: {len(tablas)}')
        for nombre in tablas:
            total = db.execute(f'SELECT COUNT(*) FROM "{nombre}"').fetchone()[0]
            marca = 'ok' if nombre in TABLAS_REQUERIDAS else '--'
            print(f'  [{marca}] {nombre}: {total} fila(s)')

        faltantes = set(TABLAS_REQUERIDAS) - set(tablas)
        if faltantes:
            print('FALTAN TABLAS:', ', '.join(sorted(faltantes)))
            return 1
        print('-' * 62)
        print('ESTADO: CONECTADO A LA NUBE. Todo listo para usar el backend.')
        print('-' * 62)
        return 0
    finally:
        db.close()


if __name__ == '__main__':
    sys.exit(main())
