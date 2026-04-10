"""
app/routers/civic.py
─────────────────────
Civic Intelligence System routes:
  POST  /api/report
  GET   /api/my-reports
  GET   /api/reports              (admin)
  PUT   /api/report/{id}/status  (admin)
  POST  /api/report/{id}/admin-response  (admin)
  GET   /api/notifications
  POST  /api/notifications/{id}/read
  POST  /api/notifications/read-all
  GET   /api/civic-stats
"""

import re
import uuid
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.civic_models import CivicReport, CivicNotification
from app.utils.token import get_current_user

# ── Upload directory ──────────────────────────────────────────────────────────
# Resolved relative to backend/ (two levels up from this file)
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

router = APIRouter(prefix="/api", tags=["civic"])


# ── Issue detection helpers ───────────────────────────────────────────────────

def detect_issue_from_description(description: str):
    """Rule-based issue & department detection from report description text."""
    clean = (description or "").lower().strip()

    if not clean or clean.replace("-", "").strip() == "":
        return "Garbage", "Waste Management"

    def has_word(words: list) -> bool:
        pattern = r"\b(?:" + "|".join(re.escape(w) for w in words) + r")\b"
        return bool(re.search(pattern, clean))

    if has_word(["light", "streetlight", "lamp", "electricity", "dark", "pole"]):
        return "Streetlight Issue", "Electricity Department"
    if has_word(["water", "leak", "pipe", "drain", "sewage", "gutter", "flood"]):
        return "Water & Drainage", "Water Department"
    if has_word(["pothole", "pathol", "road", "crack", "damage", "broken", "pit"]):
        return "Pothole", "Road Department"
    if has_word(["e-waste", "ewaste", "electronic", "battery", "phone", "laptop"]):
        return "E-Waste", "Waste Management"
    if has_word(["wet", "food", "kitchen", "organic"]):
        return "Wet Waste", "Waste Management"
    if has_word(["dry", "paper", "cardboard", "box", "packaging"]):
        return "Dry Waste", "Waste Management"
    if has_word(["hazard", "chemical", "medical", "paint"]):
        return "Hazardous Waste", "Waste Management"
    if has_word(["garbage", "trash", "waste", "litter", "plastic", "bottle", "dump", "bin", "dirt"]):
        return "Garbage", "Waste Management"

    return "Garbage", "Waste Management"


def get_severity(issue_type: str) -> str:
    return {"Pothole": "High", "Garbage": "Medium", "Streetlight Issue": "Medium"}.get(
        issue_type, "Medium"
    )


# ── Pydantic response models ──────────────────────────────────────────────────

class ReportOut(BaseModel):
    id: int
    user_id: str
    image_path: Optional[str]
    issue_type: str
    department: str
    latitude: Optional[float]
    longitude: Optional[float]
    location_name: Optional[str]
    description: Optional[str]
    status: str
    severity: str
    admin_message: Optional[str]
    resolution_days: Optional[int]
    created_at: Optional[str]

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str


class AdminResponse(BaseModel):
    message: str
    resolution_days: Optional[int] = None
    status: Optional[str] = None


class NotificationOut(BaseModel):
    id: int
    user_id: str
    message: str
    is_read: bool
    report_id: Optional[int]
    timestamp: Optional[str]

    class Config:
        from_attributes = True


# ── Serialisation helpers ─────────────────────────────────────────────────────

def report_to_dict(r: CivicReport) -> dict:
    return {
        "id":             r.id,
        "user_id":        r.user_id,
        "image_path":     r.image_path,
        "issue_type":     r.issue_type,
        "department":     r.department,
        "latitude":       r.latitude,
        "longitude":      r.longitude,
        "location_name":  r.location_name,
        "description":    r.description,
        "status":         r.status,
        "severity":       r.severity,
        "admin_message":  r.admin_message,
        "resolution_days":r.resolution_days,
        "created_at":     r.created_at.isoformat() if r.created_at else None,
    }


def notif_to_dict(n: CivicNotification) -> dict:
    return {
        "id":        n.id,
        "user_id":   n.user_id,
        "message":   n.message,
        "is_read":   n.is_read,
        "report_id": n.report_id,
        "timestamp": n.timestamp.isoformat() if n.timestamp else None,
    }


def create_notification(db: Session, user_id: str, message: str, report_id: int):
    db.add(CivicNotification(user_id=user_id, message=message, report_id=report_id))
    db.commit()


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/report")
async def submit_report(
    description: str = Form(""),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a new civic issue report with optional image upload."""
    image_path  = None
    yolo_issue  = "Unknown"
    yolo_conf   = 0.0

    if image is not None:
        ext = Path(image.filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid image type")
        filename = f"{uuid.uuid4()}{ext}"
        dest     = UPLOAD_DIR / filename
        with open(dest, "wb") as f:
            shutil.copyfileobj(image.file, f)
        image_path = f"/uploads/{filename}"

        try:
            from app.cv_inference import process_civic_image
            yolo_issue, yolo_conf = process_civic_image(str(dest.absolute()))
            print(f"🤖 YOLOv8 detected: {yolo_issue} (conf: {yolo_conf:.2f})")
        except Exception as exc:
            print(f"⚠️ YOLO inference failed: {exc}")

    issue_type, department = detect_issue_from_description(description)

    # Smart fusion: override generic text result with confident YOLO detection
    if issue_type in {"Unknown", "Garbage", "Waste Management"} and yolo_issue not in {"Unknown", "Garbage"}:
        issue_type = yolo_issue
        if issue_type == "Pothole":
            department = "Road Department"
        elif issue_type == "Streetlight Issue":
            department = "Electricity Department"

    severity = get_severity(issue_type)

    report = CivicReport(
        user_id       = current_user.id,
        image_path    = image_path,
        issue_type    = issue_type,
        department    = department,
        latitude      = latitude,
        longitude     = longitude,
        location_name = location_name,
        description   = description,
        status        = "Pending",
        severity      = severity,
    )
    db.add(report)
    db.flush()  # populate report.id before commit

    create_notification(
        db, current_user.id,
        f"✅ Report #{report.id} submitted! You earned +10 points for reporting a {issue_type} issue.",
        report.id,
    )
    db.commit()

    return {
        "id":          report.id,
        "issue_type":  issue_type,
        "department":  department,
        "latitude":    latitude,
        "longitude":   longitude,
        "status":      "Pending",
        "severity":    severity,
        "message":     "Report submitted successfully! +10 points earned.",
    }


@router.get("/my-reports")
def get_my_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reports = (
        db.query(CivicReport)
        .filter(CivicReport.user_id == current_user.id)
        .order_by(CivicReport.id.desc())
        .all()
    )
    return [report_to_dict(r) for r in reports]


@router.get("/reports")
def get_all_reports(
    status: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: Get all civic reports with optional filters."""
    q = db.query(CivicReport)
    if status:
        q = q.filter(CivicReport.status == status)
    if issue_type:
        q = q.filter(CivicReport.issue_type == issue_type)
    if department:
        q = q.filter(CivicReport.department == department)
    return [report_to_dict(r) for r in q.order_by(CivicReport.id.desc()).all()]


@router.put("/report/{report_id}/status")
def update_report_status(
    report_id: int,
    body: StatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: Update the status of a report."""
    report = db.query(CivicReport).filter(CivicReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    allowed = {"Pending", "In Progress", "Resolved"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    old_status    = report.status
    report.status = body.status

    if body.status == "Resolved" and not report.reward_given:
        report.reward_given = True
        create_notification(
            db, report.user_id,
            f"🎉 Your report #{report_id} ({report.issue_type}) has been Resolved! +20 bonus points.",
            report_id,
        )
    else:
        create_notification(
            db, report.user_id,
            f"📢 Report #{report_id} ({report.issue_type}) status changed '{old_status}' → '{body.status}'.",
            report_id,
        )

    db.commit()
    return {"message": f"Status updated to {body.status}", "report_id": report_id}


@router.post("/report/{report_id}/admin-response")
def admin_respond(
    report_id: int,
    body: AdminResponse,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Admin: Send a response message and optional resolution timeline."""
    report = db.query(CivicReport).filter(CivicReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.admin_message = body.message
    if body.resolution_days is not None:
        report.resolution_days = body.resolution_days
    if body.status:
        report.status = body.status

    notif_msg = f"📋 Admin response on report #{report_id}: {body.message}"
    if body.resolution_days:
        notif_msg += f" — Expected resolution in {body.resolution_days} day(s)."

    create_notification(db, report.user_id, notif_msg, report_id)
    db.commit()
    return {"message": "Admin response sent", "report_id": report_id}


@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(CivicNotification)
        .filter(CivicNotification.user_id == current_user.id)
        .order_by(CivicNotification.id.desc())
        .limit(50)
        .all()
    )
    return {
        "notifications": [notif_to_dict(n) for n in notifs],
        "unread_count":  sum(1 for n in notifs if not n.is_read),
    }


@router.post("/notifications/{notif_id}/read")
def mark_notification_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = (
        db.query(CivicNotification)
        .filter(
            CivicNotification.id == notif_id,
            CivicNotification.user_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.post("/notifications/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(CivicNotification).filter(
        CivicNotification.user_id == current_user.id,
        CivicNotification.is_read == False,  # noqa: E712
    ).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}


@router.get("/civic-stats")
def get_civic_stats(db: Session = Depends(get_db)):
    """Public dashboard stats."""
    total       = db.query(CivicReport).count()
    resolved    = db.query(CivicReport).filter(CivicReport.status == "Resolved").count()
    pending     = db.query(CivicReport).filter(CivicReport.status == "Pending").count()
    in_progress = db.query(CivicReport).filter(CivicReport.status == "In Progress").count()
    return {
        "total":           total,
        "resolved":        resolved,
        "pending":         pending,
        "in_progress":     in_progress,
        "resolution_rate": round(resolved / total * 100, 1) if total > 0 else 0,
    }
