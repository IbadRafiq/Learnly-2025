from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import os
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user, get_teacher_user
from app.core.config import settings
from app.models.user import User
from app.models.course import Course
from app.models.assignment import Assignment, AssignmentSubmission
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentUpdate,
    AssignmentResponse,
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse
)

router = APIRouter()

@router.post("/", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreate,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Create a new assignment (Teacher/Admin only)"""
    # Verify course exists and user has access
    course = db.query(Course).filter(Course.id == assignment_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create assignments for this course"
        )
    
    assignment = Assignment(
        course_id=assignment_data.course_id,
        title=assignment_data.title,
        description=assignment_data.description,
        assignment_type=assignment_data.assignment_type,
        max_score=assignment_data.max_score,
        due_date=assignment_data.due_date,
        allow_late_submission=assignment_data.allow_late_submission
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return AssignmentResponse.from_orm(assignment)

@router.get("/course/{course_id}", response_model=List[AssignmentResponse])
async def get_course_assignments(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all assignments for a course"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    assignments = db.query(Assignment).filter(
        Assignment.course_id == course_id,
        Assignment.is_active == True
    ).all()
    
    # Add submission count for each assignment
    result = []
    for assignment in assignments:
        assignment_dict = {
            "id": assignment.id,
            "course_id": assignment.course_id,
            "title": assignment.title,
            "description": assignment.description,
            "assignment_type": assignment.assignment_type,
            "max_score": assignment.max_score,
            "due_date": assignment.due_date,
            "created_at": assignment.created_at,
            "is_active": assignment.is_active,
            "allow_late_submission": assignment.allow_late_submission,
            "attachment_path": assignment.attachment_path,
            "submission_count": len(assignment.submissions)
        }
        result.append(AssignmentResponse(**assignment_dict))
    
    return result

@router.post("/{assignment_id}/upload-attachment")
async def upload_assignment_attachment(
    assignment_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Upload assignment attachment (Teacher only)"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    course = db.query(Course).filter(Course.id == assignment.course_id).first()
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    # Save file
    uploads_dir = Path("uploads") / f"assignments" / f"assignment_{assignment_id}"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    file_path = uploads_dir / file.filename
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    assignment.attachment_path = str(file_path)
    db.commit()
    
    return {"message": "Attachment uploaded successfully", "file_path": str(file_path)}

@router.post("/submit")
async def submit_assignment(
    assignment_id: int = Form(...),
    submission_text: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an assignment (Student)"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can submit assignments"
        )
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    # Check if student is enrolled in the course
    from app.models.course import CourseEnrollment
    enrollment = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == assignment.course_id,
        CourseEnrollment.student_id == current_user.id
    ).first()
    
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enrolled in this course"
        )
    
    # Check for existing submission
    existing = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assignment already submitted. Contact teacher to resubmit."
        )
    
    # Check if late
    is_late = False
    if assignment.due_date and datetime.utcnow() > assignment.due_date:
        if not assignment.allow_late_submission:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment deadline has passed"
            )
        is_late = True
    
    # Save file if provided
    file_path = None
    if file:
        uploads_dir = Path("uploads") / f"submissions" / f"assignment_{assignment_id}"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = uploads_dir / f"student_{current_user.id}_{file.filename}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
    
    submission = AssignmentSubmission(
        assignment_id=assignment_id,
        student_id=current_user.id,
        submission_text=submission_text,
        file_path=str(file_path) if file_path else None,
        is_late=is_late
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return {"message": "Assignment submitted successfully", "submission_id": submission.id}

@router.get("/{assignment_id}/submissions", response_model=List[SubmissionResponse])
async def get_assignment_submissions(
    assignment_id: int,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Get all submissions for an assignment (Teacher only)"""
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assignment not found"
        )
    
    course = db.query(Course).filter(Course.id == assignment.course_id).first()
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    ).all()
    
    result = []
    for sub in submissions:
        sub_dict = {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "student_name": sub.student.full_name if sub.student else None,
            "submission_text": sub.submission_text,
            "file_path": sub.file_path,
            "submitted_at": sub.submitted_at,
            "score": sub.score,
            "feedback": sub.feedback,
            "graded_at": sub.graded_at,
            "is_late": sub.is_late
        }
        result.append(SubmissionResponse(**sub_dict))
    
    return result

@router.patch("/submission/{submission_id}/grade")
async def grade_submission(
    submission_id: int,
    grade_data: SubmissionUpdate,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Grade a submission (Teacher only)"""
    submission = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.id == submission_id
    ).first()
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    assignment = db.query(Assignment).filter(
        Assignment.id == submission.assignment_id
    ).first()
    
    course = db.query(Course).filter(Course.id == assignment.course_id).first()
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )
    
    if grade_data.score is not None:
        submission.score = grade_data.score
    if grade_data.feedback is not None:
        submission.feedback = grade_data.feedback
    
    submission.graded_at = datetime.utcnow()
    
    db.commit()
    
    return {"message": "Submission graded successfully"}

@router.get("/my-submissions", response_model=List[SubmissionResponse])
async def get_my_submissions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all submissions for the current student"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can view their submissions"
        )
    
    submissions = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.student_id == current_user.id
    ).all()
    
    result = []
    for sub in submissions:
        sub_dict = {
            "id": sub.id,
            "assignment_id": sub.assignment_id,
            "student_id": sub.student_id,
            "student_name": current_user.full_name,
            "submission_text": sub.submission_text,
            "file_path": sub.file_path,
            "submitted_at": sub.submitted_at,
            "score": sub.score,
            "feedback": sub.feedback,
            "graded_at": sub.graded_at,
            "is_late": sub.is_late
        }
        result.append(SubmissionResponse(**sub_dict))
    
    return result
