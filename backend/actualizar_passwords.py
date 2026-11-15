from database.database import get_db
from werkzeug.security import generate_password_hash

usuarios = [
    ("admin@gmail.com", "admin2026"),
    ("maria@gmail.com", "maria2026"),
    ("carlos@gmail.com", "carlos2026")
]

db = get_db()

try:
    for email, password in usuarios:
        cursor = db.execute("""
            UPDATE usuarios
            SET password = ?
            WHERE email = ?
        """, (
            generate_password_hash(password),
            email
        ))

        if cursor.rowcount == 1:
            print(f"Contraseña actualizada: {email}")
        else:
            print(f"Usuario no encontrado: {email}")

    db.commit()
    print("Proceso terminado correctamente.")

except Exception as e:
    db.rollback()
    print("Error:", e)

finally:
    db.close()