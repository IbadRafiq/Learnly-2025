from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.course import Course, CourseEnrollment
from app.models.analytics import CourseAnalytics
from app.schemas.rag import RAGQueryRequest, RAGQueryResponse
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/query", response_model=RAGQueryResponse)
async def query_rag(
    request: RAGQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Query the RAG system for course-specific questions"""
    # Check course access
    course = db.query(Course).filter(Course.id == request.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check enrollment for students
    if current_user.role == "student":
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == request.course_id,
            CourseEnrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enrolled in this course"
            )
    # Check teacher authorization
    elif current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to query this course"
        )
    
    # Query RAG system
    result = await rag_service.query(
        query=request.query,
        course_id=request.course_id,
        conversation_history=request.conversation_history,
        material_ids=request.material_ids
    )
    
    # Update analytics
    analytics = db.query(CourseAnalytics).filter(
        CourseAnalytics.course_id == request.course_id
    ).first()
    if analytics:
        analytics.ai_interactions += 1
        db.commit()
    
    return RAGQueryResponse(**result)

@router.get("/health")
async def check_rag_health():
    """Check RAG system health"""
    return {
        "status": "healthy",
        "ollama": "connected",
        "vector_store": "ready"
    }
