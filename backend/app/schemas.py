"""
app/schemas.py
───────────────
Pydantic request / response schemas for EcoPulse.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    city: str
    state: str
    lat: float
    lon: float
    role: str = "user"


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    city: str
    state: str
    lat: float
    lon: float
    role: str
    created_at: datetime

    class Config:
        orm_mode = True   # Pydantic v1 — required for SQLAlchemy model serialization


class LoginResponse(BaseModel):
    message: str
    user: dict


# ── Daily Input ───────────────────────────────────────────────────────────────

class DailyInputCreate(BaseModel):
    date: str
    timestamp: str
    ac_fan_hours: float
    water_usage: float
    transport_mode: str
    outdoor_exposure: str
    waste_segregation: bool


class DailyInputResponse(DailyInputCreate):
    id: int
    user_id: str

    class Config:
        orm_mode = True   # Pydantic v1


# ── Eco Score ─────────────────────────────────────────────────────────────────

class EcoScoreModel(BaseModel):
    water_credit: float = 0.0
    energy_credit: float = 0.0
    transport_credit: float = 0.0
    waste_credit: float = 0.0
    total_score: float = 0.0
    debt: float = 0.0

    class Config:
        orm_mode = True   # Pydantic v1


# ── Badge ─────────────────────────────────────────────────────────────────────

class BadgeModel(BaseModel):
    badge_id: str
    earned: bool

    class Config:
        orm_mode = True   # Pydantic v1


# ── Waste Decision ────────────────────────────────────────────────────────────

class WasteDecisionModel(BaseModel):
    item_name: str
    chosen_bin: str
    correct_bin: str
    timestamp: str

    class Config:
        orm_mode = True   # Pydantic v1


# ── Green Index ───────────────────────────────────────────────────────────────

class DailyGreenIndexModel(BaseModel):
    date: str
    score: float
    trend: str = "stable"

    class Config:
        orm_mode = True   # Pydantic v1
