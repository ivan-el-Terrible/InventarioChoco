# Punto de entrada para Vercel (funcion Python serverless).
# Importa la app Flask tal cual esta en backend/app.py.
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent / 'backend'
sys.path.insert(0, str(BACKEND))

from app import app  # noqa: E402,F401  (Vercel detecta la instancia Flask)
