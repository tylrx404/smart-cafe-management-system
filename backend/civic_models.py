"""
Civic Intelligence System — SQLAlchemy Models
"""

from sqlalchemy import Boolean, Column, Float, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class CivicReport(Base):
    __tablename__ = "civic_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    image_path = Column(String, nullable=True)
    issue_type = Column(String, nullable=False)          # Garbage / Pothole / Streetlight Issue / Unknown
    department = Column(String, nullable=False)           # which dept handles it
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, default="Pending")            # Pending | In Progress | Resolved
    severity = Column(String, default="Medium")           # High / Medium / Low
    admin_message = Column(Text, nullable=True)
    resolution_days = Column(Integer, nullable=True)
    reward_given = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # relationships
    user = relationship("User", backref="civic_reports")


class CivicNotification(Base):
    __tablename__ = "civic_notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    report_id = Column(Integer, ForeignKey("civic_reports.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="civic_notifications")
