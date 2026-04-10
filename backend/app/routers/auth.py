"""
app/routers/auth.py
────────────────────
Authentication routes:
  POST  /auth/signup
  POST  /auth/login
  POST  /auth/logout
  GET   /auth/me
"""

import logging
import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from app.db import get_db
from app.models import EcoScore as DBEcoScore, User as DBUser
from app.schemas import LoginResponse, UserCreate, UserLogin, UserResponse
from app.utils.hashing import get_password_hash, verify_password
from app.utils.token import create_access_token, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=UserResponse)
def signup(user: UserCreate, response: Response, db: Session = Depends(get_db)):
    # ── Step 1: Duplicate email check ─────────────────────────────────────
    logger.info("🔍 Checking if email exists: %s", user.email)
    try:
        existing = db.query(DBUser).filter(DBUser.email == user.email).first()
    except Exception as exc:
        logger.error("❌ DB error during email check for %s: %s", user.email, exc)
        raise HTTPException(status_code=500, detail="Database error during registration")

    if existing:
        logger.warning("⚠️  Email already registered: %s", user.email)
        raise HTTPException(status_code=400, detail="Email already registered")

    # ── Step 2: Create user ───────────────────────────────────────────────
    try:
        hashed_pw  = get_password_hash(user.password)
        user_id    = str(uuid.uuid4())
        # Only grant admin role when the email address contains "admin"
        assigned_role = "admin" if (user.role == "admin" and "admin" in user.email.lower()) else "user"

        new_user = DBUser(
            id              = user_id,
            email           = user.email,
            hashed_password = hashed_pw,
            city            = user.city,
            state           = user.state,
            lat             = user.lat,
            lon             = user.lon,
            role            = assigned_role,
        )
        db.add(new_user)

        # Initialise empty eco-score record for the new user
        db.add(DBEcoScore(user_id=user_id))

        db.commit()
        db.refresh(new_user)
        logger.info("✅ User created: %s", user.email)

    except IntegrityError as exc:
        db.rollback()
        logger.error("❌ IntegrityError for %s: %s", user.email, exc)
        raise HTTPException(status_code=400, detail="Email already registered")

    except Exception as exc:
        db.rollback()
        logger.error("❌ Signup error for %s: %s", user.email, exc)
        raise HTTPException(status_code=500, detail=str(exc))

    # ── Step 3: Auto-login via HttpOnly cookie ────────────────────────────
    access_token = create_access_token(
        data={"sub": new_user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,  # set True in production behind HTTPS
    )
    return new_user


@router.post("/login", response_model=LoginResponse)
def login(
    user_credentials: UserLogin,
    response: Response,
    db: Session = Depends(get_db),
):
    logger.info("🔍 Login attempt for: %s", user_credentials.email)
    try:
        user = db.query(DBUser).filter(DBUser.email == user_credentials.email).first()
    except Exception as exc:
        logger.error("❌ DB error during login for %s: %s", user_credentials.email, exc)
        raise HTTPException(status_code=500, detail="Database error during login")

    if not user or not verify_password(user_credentials.password, user.hashed_password):
        logger.warning("⚠️  Invalid credentials for: %s", user_credentials.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    access_token = create_access_token(
        data={"sub": user.id},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False,
    )
    logger.info("✅ Login successful: %s", user_credentials.email)
    return {
        "message": "Logged in successfully",
        "user": {
            "id":    user.id,
            "email": user.email,
            "city":  user.city,
            "role":  getattr(user, "role", "user"),
        },
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: DBUser = Depends(get_current_user)):
    return current_user
