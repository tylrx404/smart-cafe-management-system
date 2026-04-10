"""
app/utils/hashing.py
─────────────────────
bcrypt-based password hashing helpers.
"""

import bcrypt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if *plain_password* matches the bcrypt *hashed_password*."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    """Return a bcrypt hash of *password* (truncated to 72 bytes as per bcrypt spec)."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")
