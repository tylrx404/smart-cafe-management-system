from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime

from database import get_db
from auth import get_current_user
from models import User, DailyInput, EcoScore, Badge, WasteDecision, DailyGreenIndex
from schemas import (
    DailyInputCreate, DailyInputResponse, EcoScoreModel, 
    BadgeModel, WasteDecisionModel, DailyGreenIndexModel
)

router = APIRouter(prefix="/data", tags=["data"])

@router.get("/daily-inputs", response_model=list[DailyInputResponse])
def get_all_daily_inputs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(DailyInput).filter(DailyInput.user_id == current_user.id).all()

@router.post("/daily-inputs", response_model=DailyInputResponse)
def create_daily_input(input_data: DailyInputCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_input = DailyInput(**input_data.dict(), user_id=current_user.id)
    db.add(new_input)
    db.commit()
    db.refresh(new_input)
    return new_input

@router.get("/today-input", response_model=DailyInputResponse)
def get_today_input(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    today = datetime.now().strftime("%Y-%m-%d")
    inp = db.query(DailyInput).filter(DailyInput.user_id == current_user.id, DailyInput.date == today).first()
    # Return 404 or None (None is cleaner for frontend translation)
    return inp

@router.get("/eco-score", response_model=EcoScoreModel)
def get_eco_score(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    score = db.query(EcoScore).filter(EcoScore.user_id == current_user.id).first()
    if not score:
        score = EcoScore(user_id=current_user.id)
        db.add(score)
        db.commit()
        db.refresh(score)
    return score

@router.post("/eco-score", response_model=EcoScoreModel)
def update_eco_score(score_data: EcoScoreModel, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    score = db.query(EcoScore).filter(EcoScore.user_id == current_user.id).first()
    if not score:
        score = EcoScore(user_id=current_user.id)
        db.add(score)
    
    for key, value in score_data.dict().items():
        setattr(score, key, value)
        
    db.commit()
    db.refresh(score)
    return score

@router.get("/badges", response_model=list[BadgeModel])
def list_badges(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Badge).filter(Badge.user_id == current_user.id).all()

@router.post("/badges", response_model=list[BadgeModel])
def save_badges(badges: list[BadgeModel], current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Clear old
    db.query(Badge).filter(Badge.user_id == current_user.id).delete()
    # Add new
    new_badges = [Badge(**b.dict(), user_id=current_user.id) for b in badges]
    db.add_all(new_badges)
    db.commit()
    return badges

@router.get("/waste-decisions", response_model=list[WasteDecisionModel])
def get_waste_decisions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(WasteDecision).filter(WasteDecision.user_id == current_user.id).all()

@router.post("/waste-decisions", response_model=WasteDecisionModel)
def track_waste_decision(decision: WasteDecisionModel, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_decision = WasteDecision(**decision.dict(), user_id=current_user.id)
    db.add(new_decision)
    db.commit()
    db.refresh(new_decision)
    return new_decision

@router.get("/green-index", response_model=list[DailyGreenIndexModel])
def get_green_index(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from sqlalchemy import desc
    return db.query(DailyGreenIndex).filter(DailyGreenIndex.user_id == current_user.id).order_by(desc(DailyGreenIndex.date)).all()

@router.post("/green-index", response_model=DailyGreenIndexModel)
def save_green_index(index: DailyGreenIndexModel, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(DailyGreenIndex).filter(
        DailyGreenIndex.user_id == current_user.id, 
        DailyGreenIndex.date == index.date
    ).first()
    
    if existing:
        return existing
        
    new_idx = DailyGreenIndex(**index.dict(), user_id=current_user.id)
    db.add(new_idx)
    db.commit()
    db.refresh(new_idx)
    return new_idx

from civic_models import CivicReport
from sqlalchemy import func, case

@router.get("/leaderboard")
def get_leaderboard(db: Session = Depends(get_db)):
    # 1. Fetch Users
    users = db.query(User).all()
    
    # 2. Fetch EcoScores
    eco_scores = {es.user_id: es.total_score for es in db.query(EcoScore).all()}
    
    # 3. Fetch Civic Reports Stats
    civic_stats = db.query(
        CivicReport.user_id,
        func.count(CivicReport.id).label("total_reports"),
        func.sum(case((CivicReport.status == "Resolved", 1), else_=0)).label("resolved_reports")
    ).group_by(CivicReport.user_id).all()
    
    civic_dict = {
        row.user_id: {"total": row.total_reports, "resolved": row.resolved_reports or 0} 
        for row in civic_stats
    }
    
    user_data = []
    
    for u in users:
        # Eco Score
        eco_score = eco_scores.get(u.id, 0)
        
        # Civic Score
        c_stats = civic_dict.get(u.id, {"total": 0, "resolved": 0})
        civic_score = (c_stats["total"] * 10) + (c_stats["resolved"] * 20)
        
        # Impact Score
        impact_score = (eco_score * 0.5) + (civic_score * 0.5)
        
        user_data.append({
            "id": u.id,
            "name": u.email.split("@")[0],
            "eco_score": round(eco_score, 1),
            "civic_score": round(civic_score, 1),
            "impact_score": round(impact_score, 1),
        })
        
    # Sort for Eco
    eco_leaders = sorted(user_data, key=lambda x: x["eco_score"], reverse=True)[:10]
    for i, lead in enumerate(eco_leaders):
        lead["rank"] = i + 1
        lead["badge"] = "🌱 Green Master"
        lead["score"] = lead["eco_score"]
        
    # Sort for Civic
    civic_leaders = sorted(user_data, key=lambda x: x["civic_score"], reverse=True)[:10]
    for i, lead in enumerate(civic_leaders):
        lead["rank"] = i + 1
        lead["badge"] = "🛠️ City Helper"
        lead["score"] = lead["civic_score"]

    # Sort for Impact
    impact_leaders = sorted(user_data, key=lambda x: x["impact_score"], reverse=True)[:10]
    for i, lead in enumerate(impact_leaders):
        lead["rank"] = i + 1
        lead["badge"] = "🌍 Change Maker"
        lead["score"] = lead["impact_score"]
        
    return {
        "eco_leaders": eco_leaders,
        "civic_leaders": civic_leaders,
        "impact_leaders": impact_leaders
    }

