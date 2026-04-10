"""
app/core/config.py
──────────────────
Single source of truth for all environment-driven configuration.
All values are read via os.getenv — nothing is hardcoded.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env that lives next to the backend/ folder
load_dotenv()

# ── Paths ─────────────────────────────────────────────────────────────────────
# backend/app/core/config.py  →  .parent x3  →  backend/
BACKEND_DIR: Path = Path(__file__).resolve().parent.parent.parent
# project root (monorepo root, one level above backend/)
BASE_DIR: Path = BACKEND_DIR.parent
ML_DIR: Path = BASE_DIR / "ml-model"

# ── Database ──────────────────────────────────────────────────────────────────
_raw_db_url: str = os.getenv("DATABASE_URL", "")
if not _raw_db_url:
    raise RuntimeError(
        "❌ DATABASE_URL environment variable is not set. "
        "Add it in your deployment platform → Variables, or in backend/.env for local dev."
    )
# SQLAlchemy 1.4+ requires 'postgresql://', not legacy 'postgres://'
DATABASE_URL: str = _raw_db_url.replace("postgres://", "postgresql://", 1)

# ── Auth / JWT ────────────────────────────────────────────────────────────────
JWT_SECRET: str = os.getenv(
    "JWT_SECRET", "super_secret_ecopulse_key_do_not_use_in_prod"
)
ALGORITHM: str = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

# ── Gemini AI ─────────────────────────────────────────────────────────────────
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
