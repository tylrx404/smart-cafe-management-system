"""
app/db.py
──────────
SQLAlchemy engine, session factory, declarative base, and the
``get_db`` FastAPI dependency.

The DATABASE_URL is sourced exclusively from app.core.config
(which reads os.getenv) — nothing is hardcoded here.
"""

import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.core.config import DATABASE_URL

logger = logging.getLogger(__name__)

# ── Engine ────────────────────────────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,   # auto-reconnect if the connection drops
    pool_size=5,
    max_overflow=10,
)
logger.info("✅ Database engine created (driver: %s)", DATABASE_URL.split("://")[0])

# ── Session factory & Base ────────────────────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency — yields a DB session and guarantees it is closed."""
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
