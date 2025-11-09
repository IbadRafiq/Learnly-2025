from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Float, JSON
from datetime import datetime

from app.core.database import Base

class ModerationSettings(Base):
    __tablename__ = "moderation_settings"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String, unique=True, nullable=False)  # hate, violence, weapons, religion, safety, health
    threshold = Column(Float, default=0.7)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ModerationLog(Base):
    __tablename__ = "moderation_logs"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    flagged = Column(Boolean, default=False)
    action_taken = Column(String, nullable=True)  # blocked, warned, allowed
    meta_data = Column(JSON, default={})
    created_at = Column(DateTime, default=datetime.utcnow)
