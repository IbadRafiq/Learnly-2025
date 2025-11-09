from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user, get_admin_user, get_teacher_user
from app.core.config import settings
from app.models.user import User
from app.models.course import Course, CourseMaterial, CourseEnrollment
from app.models.analytics import CourseAnalytics
from app.schemas.course import (
    CourseCreate,
    CourseUpdate,
    CourseResponse,
    EnrollmentCreate,
    EnrollmentResponse
)
from app.services.rag_service import rag_service

router = APIRouter()

@router.post("/", response_model=CourseResponse)
async def create_course(
    course_data: CourseCreate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Create a new course (Admin only)"""
    # Validate teacher if provided
    if course_data.teacher_id:
        teacher = db.query(User).filter(
            User.id == course_data.teacher_id,
            User.role == "teacher"
        ).first()
        if not teacher:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid teacher ID"
            )
    
    course = Course(
        title=course_data.title,
        description=course_data.description,
        teacher_id=course_data.teacher_id
    )
    
    db.add(course)
    db.commit()
    db.refresh(course)
    
    # Create analytics
    analytics = CourseAnalytics(course_id=course.id)
    db.add(analytics)
    db.commit()
    
    return CourseResponse.from_orm(course)

@router.get("/", response_model=List[CourseResponse])
async def get_courses(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses"""
    if current_user.role == "admin":
        courses = db.query(Course).offset(skip).limit(limit).all()
    elif current_user.role == "teacher":
        courses = db.query(Course).filter(
            Course.teacher_id == current_user.id
        ).offset(skip).limit(limit).all()
    else:  # student
        enrollments = db.query(CourseEnrollment).filter(
            CourseEnrollment.student_id == current_user.id
        ).all()
        course_ids = [e.course_id for e in enrollments]
        courses = db.query(Course).filter(Course.id.in_(course_ids)).all() if course_ids else []
    
    # Build response with teacher names
    result = []
    for course in courses:
        course_dict = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "teacher_id": course.teacher_id,
            "teacher_name": course.teacher.full_name if course.teacher else None,
            "semester": course.semester,
            "degree_types": course.degree_types,
            "is_active": course.is_active,
            "created_at": course.created_at,
            "materials": course.materials
        }
        result.append(CourseResponse(**course_dict))
    
    return result

@router.get("/available/for-student", response_model=List[CourseResponse])
async def get_available_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get courses available for the current student based on their semester and degree"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can access this endpoint"
        )
    
    # Get student's semester and degree type
    student_semester = current_user.semester
    student_degree = current_user.degree_type
    
    if not student_semester or not student_degree:
        # If student doesn't have semester/degree set, return all active courses
        courses = db.query(Course).filter(Course.is_active == True).all()
    else:
        # Filter courses by semester and degree type
        all_courses = db.query(Course).filter(Course.is_active == True).all()
        courses = []
        
        for course in all_courses:
            # Check if course matches student's semester
            if course.semester and course.semester != student_semester:
                continue
                
            # Check if course is for student's degree program
            if course.degree_types:
                degree_list = [d.strip() for d in course.degree_types.split(',')]
                if student_degree not in degree_list:
                    continue
            
            courses.append(course)
    
    # Build response with teacher names
    result = []
    for course in courses:
        course_dict = {
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "teacher_id": course.teacher_id,
            "teacher_name": course.teacher.full_name if course.teacher else None,
            "semester": course.semester,
            "degree_types": course.degree_types,
            "is_active": course.is_active,
            "created_at": course.created_at,
            "materials": course.materials
        }
        result.append(CourseResponse(**course_dict))
    
    return result

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get course by ID"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Check access
    if current_user.role == "student":
        enrollment = db.query(CourseEnrollment).filter(
            CourseEnrollment.course_id == course_id,
            CourseEnrollment.student_id == current_user.id
        ).first()
        if not enrollment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enrolled in this course"
            )
    elif current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this course"
        )
    
    # Create response with teacher name
    course_dict = {
        "id": course.id,
        "title": course.title,
        "description": course.description,
        "teacher_id": course.teacher_id,
        "teacher_name": course.teacher.full_name if course.teacher else None,
        "is_active": course.is_active,
        "created_at": course.created_at,
        "materials": course.materials
    }
    return CourseResponse(**course_dict)

@router.patch("/{course_id}", response_model=CourseResponse)
async def update_course(
    course_id: int,
    course_data: CourseUpdate,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Update course (Admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    update_data = course_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(course, field, value)
    
    db.commit()
    db.refresh(course)
    
    return CourseResponse.from_orm(course)

@router.delete("/{course_id}")
async def delete_course(
    course_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """Delete course (Admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    try:
        db.delete(course)
        db.commit()
        return {"message": "Course deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete course: {str(e)}"
        )

@router.post("/{course_id}/materials")
async def upload_course_material(
    course_id: int,
    title: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Upload course material (Teacher/Admin only)"""
    try:
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
                detail="Not authorized to upload materials to this course"
            )
        
        # Validate file type
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in settings.ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file_ext} not allowed. Allowed: {', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        
        # Save file
        uploads_dir = Path("uploads") / f"course_{course_id}"
        uploads_dir.mkdir(parents=True, exist_ok=True)
        
        file_path = uploads_dir / f"{title.replace(' ', '_')}{file_ext}"
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Create vector store (optional - don't fail upload if this fails)
        vector_store_id = None
        try:
            vector_store_id = await rag_service.create_vector_store(
                course_id=course_id,
                file_path=str(file_path),
                material_title=title
            )
        except Exception as e:
            print(f"Warning: Failed to create vector store: {str(e)}")
            # Continue anyway - material can be uploaded without vector store
        
        # Save material record
        material = CourseMaterial(
            course_id=course_id,
            title=title,
            file_path=str(file_path),
            file_type=file_ext[1:],  # Remove the dot
            vector_store_id=vector_store_id
        )
        
        db.add(material)
        db.commit()
        db.refresh(material)
        
        return {
            "message": "Material uploaded successfully",
            "material_id": material.id,
            "vector_store_id": vector_store_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload material: {str(e)}"
        )

@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_in_course(
    enrollment_data: EnrollmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Enroll student in course"""
    # Admin can enroll any student, students can only enroll themselves
    if current_user.role != "admin" and enrollment_data.student_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to enroll this student"
        )
    
    # Check if course exists
    course = db.query(Course).filter(Course.id == enrollment_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    # Get the student being enrolled
    student = db.query(User).filter(User.id == enrollment_data.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Student not found"
        )
    
    # Validate semester and degree match (only for students, admins can override)
    if current_user.role != "admin":
        # Check semester match
        if course.semester and student.semester and course.semester != student.semester:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This course is for semester {course.semester}. You are in semester {student.semester}."
            )
        
        # Check degree program match
        if course.degree_types and student.degree_type:
            degree_list = [d.strip() for d in course.degree_types.split(',')]
            if student.degree_type not in degree_list:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"This course is not available for {student.degree_type}. Available for: {course.degree_types}"
                )
    
    # Check if already enrolled
    existing = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == enrollment_data.course_id,
        CourseEnrollment.student_id == enrollment_data.student_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this course"
        )
    
    enrollment = CourseEnrollment(
        course_id=enrollment_data.course_id,
        student_id=enrollment_data.student_id
    )
    
    db.add(enrollment)
    
    # Update analytics
    analytics = db.query(CourseAnalytics).filter(
        CourseAnalytics.course_id == enrollment_data.course_id
    ).first()
    if analytics:
        analytics.total_enrollments += 1
    
    db.commit()
    db.refresh(enrollment)
    
    return EnrollmentResponse.from_orm(enrollment)

@router.get("/{course_id}/students", response_model=List[EnrollmentResponse])
async def get_course_students(
    course_id: int,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Get all students enrolled in a course (Teacher/Admin only)"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view students of this course"
        )
    
    enrollments = db.query(CourseEnrollment).filter(
        CourseEnrollment.course_id == course_id
    ).all()
    
    # Build response with student info
    result = []
    for enrollment in enrollments:
        enrollment_dict = {
            "id": enrollment.id,
            "course_id": enrollment.course_id,
            "student_id": enrollment.student_id,
            "full_name": enrollment.student.full_name if enrollment.student else None,
            "email": enrollment.student.email if enrollment.student else None,
            "enrolled_at": enrollment.enrolled_at,
            "progress": enrollment.progress
        }
        result.append(EnrollmentResponse(**enrollment_dict))
    
    return result

@router.get("/available/for-enrollment", response_model=List[CourseResponse])
async def get_available_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all courses available for enrollment (not yet enrolled)"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This endpoint is only for students"
        )
    
    # Get all course IDs the student is enrolled in
    enrolled_course_ids = db.query(CourseEnrollment.course_id).filter(
        CourseEnrollment.student_id == current_user.id
    ).all()
    enrolled_ids = [course_id for (course_id,) in enrolled_course_ids]
    
    # Get all courses except enrolled ones
    if enrolled_ids:
        available_courses = db.query(Course).filter(
            ~Course.id.in_(enrolled_ids)
        ).all()
    else:
        available_courses = db.query(Course).all()
    
    return [CourseResponse.from_orm(course) for course in available_courses]
