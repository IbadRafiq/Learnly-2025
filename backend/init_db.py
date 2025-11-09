"""
Database initialization script
Run this to ensure all tables are created properly
"""
from app.core.database import engine, Base
from app.models.user import User
from app.models.course import Course, CourseMaterial, CourseEnrollment
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.analytics import UserAnalytics, CourseAnalytics
from app.models.assignment import Assignment, AssignmentSubmission
from app.models.moderation import ModerationSettings, ModerationLog

def init_db():
    """Initialize database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
