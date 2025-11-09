from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime

class QuizQuestionBase(BaseModel):
    question_text: str
    question_type: str = "multiple_choice"
    options: Optional[List[str]] = None
    correct_answer: str
    explanation: Optional[str] = None
    points: int = 1
    difficulty: str = "medium"

class QuizQuestionCreate(QuizQuestionBase):
    pass

class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[List[str]]
    points: int
    difficulty: str

    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    difficulty: str = "medium"
    is_adaptive: bool = True

class QuizCreate(QuizBase):
    course_id: int
    questions: List[QuizQuestionCreate]

class QuizResponse(QuizBase):
    id: int
    course_id: int
    created_at: datetime
    questions: List[QuizQuestionResponse] = []

    class Config:
        from_attributes = True

class QuizAnswerSubmit(BaseModel):
    question_id: int
    student_answer: str

class QuizAttemptCreate(BaseModel):
    quiz_id: int
    answers: List[QuizAnswerSubmit]

class QuizAttemptResponse(BaseModel):
    id: int
    quiz_id: int
    score: float
    max_score: float
    percentage: float
    completed_at: Optional[datetime]
    time_taken: Optional[int]

    class Config:
        from_attributes = True

class GenerateQuizRequest(BaseModel):
    course_id: int
    topic: Optional[str] = None
    difficulty: str = "medium"
    num_questions: int = 5
    material_ids: List[int] = []  # Specific materials to generate quiz from
