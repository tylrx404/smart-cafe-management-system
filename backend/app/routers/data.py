"""
app/routers/data.py
────────────────────
User data endpoints:
  GET/POST  /data/daily-inputs
  GET       /data/today-input
  GET/POST  /data/eco-score
  GET/POST  /data/badges
  GET/POST  /data/waste-decisions
  GET/POST  /data/green-index
  GET       /data/leaderboard
"""

from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, case
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User, DailyInput, EcoScore, Badge, WasteDecision, DailyGreenIndex
from app.civic_models import CivicReport
from app.schemas import (
    DailyInputCreate,
    DailyInputResponse,
    EcoScoreModel,
    BadgeModel,
    WasteDecisionModel,
    DailyGreenIndexModel,
)
from app.utils.token import get_current_user

router = APIRouter(prefix="/data", tags=["data"])


# ── Daily Inputs ───────────────────────────────────────────────────────────────

@router.get("/daily-inputs", response_model=List[DailyInputResponse])
def get_all_daily_inputs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(DailyInput).filter(DailyInput.user_id == current_user.id).all()


@router.post("/daily-inputs", response_model=DailyInputResponse)
def create_daily_input(
    input_data: DailyInputCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_input = DailyInput(**input_data.dict(), user_id=current_user.id)
    db.add(new_input)
    db.commit()
    db.refresh(new_input)
    return new_input


@router.get("/today-input", response_model=DailyInputResponse)
def get_today_input(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = datetime.now().strftime("%Y-%m-%d")
    return (
        db.query(DailyInput)
        .filter(DailyInput.user_id == current_user.id, DailyInput.date == today)
        .first()
    )


# ── Eco Score ─────────────────────────────────────────────────────────────────

@router.get("/eco-score", response_model=EcoScoreModel)
def get_eco_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    score = db.query(EcoScore).filter(EcoScore.user_id == current_user.id).first()
    if not score:
        score = EcoScore(user_id=current_user.id)
        db.add(score)
        db.commit()
        db.refresh(score)
    return score


@router.post("/eco-score", response_model=EcoScoreModel)
def update_eco_score(
    score_data: EcoScoreModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    score = db.query(EcoScore).filter(EcoScore.user_id == current_user.id).first()
    if not score:
        score = EcoScore(user_id=current_user.id)
        db.add(score)

    for key, value in score_data.dict().items():
        setattr(score, key, value)

    db.commit()
    db.refresh(score)
    return score


# ── Badges ────────────────────────────────────────────────────────────────────

@router.get("/badges", response_model=List[BadgeModel])
def list_badges(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Badge).filter(Badge.user_id == current_user.id).all()


@router.post("/badges", response_model=List[BadgeModel])
def save_badges(
    badges: List[BadgeModel],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Badge).filter(Badge.user_id == current_user.id).delete()
    db.add_all([Badge(**b.dict(), user_id=current_user.id) for b in badges])
    db.commit()
    return badges


# ── Waste Decisions ───────────────────────────────────────────────────────────

@router.get("/waste-decisions", response_model=List[WasteDecisionModel])
def get_waste_decisions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(WasteDecision).filter(WasteDecision.user_id == current_user.id).all()


@router.post("/waste-decisions", response_model=WasteDecisionModel)
def track_waste_decision(
    decision: WasteDecisionModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_decision = WasteDecision(**decision.dict(), user_id=current_user.id)
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision


# ── Green Index ───────────────────────────────────────────────────────────────

@router.get("/green-index", response_model=List[DailyGreenIndexModel])
def get_green_index(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(DailyGreenIndex)
        .filter(DailyGreenIndex.user_id == current_user.id)
        .order_by(desc(DailyGreenIndex.date))
        .all()
    )


@router.post("/green-index", response_model=DailyGreenIndexModel)
def save_green_index(
    index: DailyGreenIndexModel,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(DailyGreenIndex)
        .filter(
            DailyGreenIndex.user_id == current_user.id,
            DailyGreenIndex.date == index.date,
        )
        .first()
    )
    if existing:
        return existing

    new_idx = DailyGreenIndex(**index.dict(), user_id=current_user.id)
    db.add(new_idx)
    db.commit()
    db.refresh(new_idx)
    return new_idx


# ── Leaderboard ───────────────────────────────────────────────────────────────

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    users      = db.query(User).all()
    eco_scores = {es.user_id: es.total_score for es in db.query(EcoScore).all()}

    civic_stats = db.query(
        CivicReport.user_id,
        func.count(CivicReport.id).label("total_reports"),
        func.sum(case((CivicReport.status == "Resolved", 1), else_=0)).label("resolved_reports"),
    ).group_by(CivicReport.user_id).all()

    civic_dict = {
        row.user_id: {"total": row.total_reports, "resolved": row.resolved_reports or 0}
        for row in civic_stats
    }

    user_data = []
    for u in users:
        eco_score   = eco_scores.get(u.id, 0)
        c           = civic_dict.get(u.id, {"total": 0, "resolved": 0})
        civic_score = (c["total"] * 10) + (c["resolved"] * 20)
        impact      = (eco_score * 0.5) + (civic_score * 0.5)
        user_data.append({
            "id":           u.id,
            "name":         u.email.split("@")[0],
            "eco_score":    round(eco_score, 1),
            "civic_score":  round(civic_score, 1),
            "impact_score": round(impact, 1),
        })

    def ranked(data, key, badge):
        leaders = sorted(data, key=lambda x: x[key], reverse=True)[:10]
        for i, lead in enumerate(leaders):
            lead["rank"]  = i + 1
            lead["badge"] = badge
            lead["score"] = lead[key]
        return leaders

    return {
        "eco_leaders":    ranked(user_data, "eco_score",    "🌱 Green Master"),
        "civic_leaders":  ranked(user_data, "civic_score",  "🛠️ City Helper"),
        "impact_leaders": ranked(user_data, "impact_score", "🌍 Change Maker"),
    }
