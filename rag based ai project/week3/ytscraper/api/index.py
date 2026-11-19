import os
import sys
from pathlib import Path

# Ensure the project root is in sys.path so 'ytrag' is importable
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from api.main import app

# Vercel Serverless Function entrypoint
