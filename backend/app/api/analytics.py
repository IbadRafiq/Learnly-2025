from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.security import get_current_user, get_admin_user, get_teacher_user
from app.models.user import User
from app.models.analytics import UserAnalytics, CourseAnalytics
from app.models.quiz import QuizAttempt
from app.models.course import Course, CourseEnrollment
from app.models.moderation import ModerationLog
from app.schemas.analytics import (
    UserAnalyticsResponse,
    CourseAnalyticsResponse,
    SystemAnalyticsResponse
)

router = APIRouter()

@router.get("/user/{user_id}", response_model=UserAnalyticsResponse)
async def get_user_analytics(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user analytics"""
    # Users can view their own analytics, teachers/admins can view any
    if current_user.id != user_id and current_user.role not in ["admin", "teacher"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this user's analytics"
        )
    
    analytics = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()
    if not analytics:
        # Create analytics if not exists
        analytics = UserAnalytics(user_id=user_id)
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
    
    return UserAnalyticsResponse.from_orm(analytics)

@router.get("/course/{course_id}", response_model=CourseAnalyticsResponse)
async def get_course_analytics(
    course_id: int,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Get course analytics (Teacher/Admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check authorization
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this course's analytics"
        )
    
    analytics = db.query(CourseAnalytics).filter(
        CourseAnalytics.course_id == course_id
    ).first()
    
    if not analytics:
        analytics = CourseAnalytics(course_id=course_id)
        db.add(analytics)
        db.commit()
        db.refresh(analytics)
    
    return CourseAnalyticsResponse.from_orm(analytics)

@router.get("/system", response_model=SystemAnalyticsResponse)
async def get_system_analytics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Get system-wide analytics (Admin only)"""
    # Total counts
    total_users = db.query(User).count()
    total_courses = db.query(Course).count()
    total_quizzes = db.query(QuizAttempt).count()
    
    # Average scores
    avg_score = db.query(func.avg(QuizAttempt.percentage)).scalar() or 0.0
    
    # User growth (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    user_growth = {}
    for i in range(30):
        date = thirty_days_ago + timedelta(days=i)
        date_str = date.strftime("%Y-%m-%d")
        count = db.query(User).filter(
            func.date(User.created_at) == date.date()
        ).count()
        user_growth[date_str] = count
    
    # Course activity (enrollments per course)
    course_activity = {}
    courses = db.query(Course).all()
    for course in courses:
        enrollments = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course.id
        ).count()
        course_activity[course.title] = enrollments
    
    # Moderation stats
    total_moderated = db.query(ModerationLog).count()
    total_flagged = db.query(ModerationLog).filter(
        ModerationLog.flagged == True
    ).count()
    
    moderation_stats = {
        "total_checked": total_moderated,
        "total_flagged": total_flagged,
        "pass_rate": (total_moderated - total_flagged) / total_moderated if total_moderated > 0 else 1.0
    }
    
    return SystemAnalyticsResponse(
        total_users=total_users,
        total_courses=total_courses,
        total_quizzes=total_quizzes,
        average_platform_score=float(avg_score),
        user_growth=user_growth,
        course_activity=course_activity,
        moderation_stats=moderation_stats
    )

@router.post("/update/user/{user_id}")
async def update_user_analytics(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user analytics based on current data"""
    if current_user.id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this user's analytics"
        )
    
    analytics = db.query(UserAnalytics).filter(UserAnalytics.user_id == user_id).first()
    if not analytics:
        analytics = UserAnalytics(user_id=user_id)
        db.add(analytics)
    
    # Update quiz stats
    quiz_attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == user_id
    ).all()
    
    analytics.total_quizzes_taken = len(quiz_attempts)
    if quiz_attempts:
        analytics.average_score = sum(a.percentage for a in quiz_attempts) / len(quiz_attempts)
        analytics.total_time_spent = sum(a.time_taken or 0 for a in quiz_attempts) // 60  # minutes
    
    # Update enrollment count
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.student_id == user_id
    ).count()
    analytics.courses_enrolled = enrollments
    
    # Update engagement score (based on activity)
    engagement = min((analytics.total_quizzes_taken * 10) + (enrollments * 20), 100)
    analytics.engagement_score = engagement
    
    analytics.last_activity = datetime.utcnow()
    
    db.commit()
    db.refresh(analytics)
    
    return {"message": "Analytics updated successfully"}

@router.post("/update/course/{course_id}")
async def update_course_analytics(
    course_id: int,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Update course analytics (Teacher/Admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this course's analytics"
        )
    
    analytics = db.query(CourseAnalytics).filter(
        CourseAnalytics.course_id == course_id
    ).first()
    
    if not analytics:
        analytics = CourseAnalytics(course_id=course_id)
        db.add(analytics)
    
    # Update enrollments
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id
    ).all()
    
    analytics.total_enrollments = len(enrollments)
    
    if enrollments:
        analytics.average_progress = sum(e.progress for e in enrollments) / len(enrollments)
        
        # Calculate completion rate (progress >= 80%)
        completed = sum(1 for e in enrollments if e.progress >= 80)
        analytics.completion_rate = (completed / len(enrollments)) * 100
    
    analytics.last_updated = datetime.utcnow()
    
    db.commit()
    db.refresh(analytics)
    
    return {"message": "Course analytics updated successfully"}
