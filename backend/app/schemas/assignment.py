from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AssignmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    assignment_type: str = "assignment"  # assignment, project, lab
    max_score: float = 100.0

class AssignmentCreate(AssignmentBase):
    course_id: int
    due_date: Optional[datetime] = None
    allow_late_submission: bool = False

class AssignmentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    allow_late_submission: Optional[bool] = None
    is_active: Optional[bool] = None

class AssignmentResponse(AssignmentBase):
    id: int
    course_id: int
    due_date: Optional[datetime] = None
    created_at: datetime
    is_active: bool
    allow_late_submission: bool
    attachment_path: Optional[str] = None
    submission_count: Optional[int] = 0

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assignment_id: int
    submission_text: Optional[str] = None

class SubmissionUpdate(BaseModel):
    score: Optional[float] = None
    feedback: Optional[str] = None

class SubmissionResponse(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    student_name: Optional[str] = None
    submission_text: Optional[str] = None
    file_path: Optional[str] = None
    submitted_at: datetime
    score: Optional[float] = None
    feedback: Optional[str] = None
    graded_at: Optional[datetime] = None
    is_late: bool

    class Config:
        from_attributes = True
