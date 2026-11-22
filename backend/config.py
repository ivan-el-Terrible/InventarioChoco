import os
import secrets
from pathlib import Path


def obtener_clave_secreta():
    # 1) Variable de entorno: lo correcto en la nube (Vercel/Render/etc.).
    #    Mantiene las sesiones validas entre arranques.
    clave_entorno = os.environ.get("INVENTARIO_SECRET_KEY")

    if clave_entorno:
        return clave_entorno

    # 2) Modo local / portable: archivo de clave por usuario. Si el
    #    sistema de archivos es de solo lectura (serverless) se ignora
    #    sin romper el arranque.
    try:
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
    except OSError:
        # 3) Sin variable y con disco de solo lectura (Vercel sin la
        #    variable configurada): clave volatil para poder arrancar.
        #    Las sesiones caducan al reiniciar la instancia: configura
        #    INVENTARIO_SECRET_KEY para que duren.
        print(
            "AVISO: define la variable INVENTARIO_SECRET_KEY; "
            "se usa una clave temporal de sesion.",
            flush=True
        )
        return secrets.token_hex(32)
