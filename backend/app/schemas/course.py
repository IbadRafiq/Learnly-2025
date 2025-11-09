from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CourseMaterialResponse(BaseModel):
    id: int
    title: str
    file_type: str
    file_path: str
    uploaded_at: datetime

    class Config:
        from_attributes = True

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None

class CourseCreate(CourseBase):
    teacher_id: Optional[int] = None
    semester: Optional[int] = None
    degree_types: Optional[str] = None

class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    teacher_id: Optional[int] = None
    semester: Optional[int] = None
    degree_types: Optional[str] = None
    is_active: Optional[bool] = None

class CourseResponse(CourseBase):
    id: int
    teacher_id: Optional[int]
    teacher_name: Optional[str] = None
    semester: Optional[int] = None
    degree_types: Optional[str] = None
    is_active: bool
    created_at: datetime
    materials: List[CourseMaterialResponse] = []

    class Config:
        from_attributes = True

class EnrollmentCreate(BaseModel):
    student_id: int
    course_id: int

class EnrollmentResponse(BaseModel):
    id: int
    course_id: int
    student_id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    enrolled_at: datetime
    progress: int

    class Config:
        from_attributes = True
