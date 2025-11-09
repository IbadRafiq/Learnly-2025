from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base

class UserAnalytics(Base):
    __tablename__ = "user_analytics"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_quizzes_taken = Column(Integer, default=0)
    average_score = Column(Float, default=0.0)
    total_time_spent = Column(Integer, default=0)  # in minutes
    courses_enrolled = Column(Integer, default=0)
    last_activity = Column(DateTime, default=datetime.utcnow)
    skill_mastery = Column(JSON, default={})  # {"topic": mastery_level}
    engagement_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="analytics")

class CourseAnalytics(Base):
    __tablename__ = "course_analytics"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_enrollments = Column(Integer, default=0)
    average_progress = Column(Float, default=0.0)
    average_quiz_score = Column(Float, default=0.0)
    completion_rate = Column(Float, default=0.0)
    ai_interactions = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    course = relationship("Course", back_populates="analytics")
