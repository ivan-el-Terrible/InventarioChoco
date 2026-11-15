import os
import secrets
from pathlib import Path


def obtener_clave_secreta():
    # Permite configurar una clave externa si se desea
    clave_entorno = os.environ.get("INVENTARIO_SECRET_KEY")

    if clave_entorno:
        return clave_entorno

    # Carpeta privada de configuración por usuario
    carpeta_base = Path(
        os.environ.get(
            "LOCALAPPDATA",
            str(Path.home() / ".inventariochoco")
        )
    )

    carpeta_config = carpeta_base / "InventarioChoco"
    carpeta_config.mkdir(parents=True, exist_ok=True)

    archivo_clave = carpeta_config / "secret.key"

    if archivo_clave.exists():
        return archivo_clave.read_text(encoding="utf-8").strip()

    clave = secrets.token_hex(32)

    # Crear el archivo sin sobrescribir una clave existente
    try:
        with archivo_clave.open("x", encoding="utf-8") as archivo:
            archivo.write(clave)
    except FileExistsError:
        return archivo_clave.read_text(encoding="utf-8").strip()

    return clave