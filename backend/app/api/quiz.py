from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.core.security import get_current_user, get_teacher_user
from app.models.user import User
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.course import Course, CourseMaterial
from app.schemas.quiz import (
    QuizCreate,
    QuizResponse,
    QuizAttemptCreate,
    QuizAttemptResponse,
    GenerateQuizRequest
)
from app.services.quiz_service import quiz_service

router = APIRouter()

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(
    request: GenerateQuizRequest,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Generate AI-powered quiz and save to database (Teacher/Admin only)"""
    # Check course access
    course = db.query(Course).filter(Course.id == request.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create quiz for this course"
        )
    
    # Validate material_ids if provided
    if request.material_ids:
        materials = db.query(CourseMaterial).filter(
            CourseMaterial.id.in_(request.material_ids),
            CourseMaterial.course_id == request.course_id
        ).all()
        
        print(f"Requested material_ids: {request.material_ids}")
        print(f"Found {len(materials)} materials")
        for mat in materials:
            print(f"  Material {mat.id}: {mat.title}, vector_store_id: {mat.vector_store_id}")
        
        if len(materials) != len(request.material_ids):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="One or more material IDs are invalid"
            )
        
        # Check if materials have vector stores
        materials_without_vectors = [m for m in materials if not m.vector_store_id]
        if materials_without_vectors:
            missing_titles = [m.title for m in materials_without_vectors]
            print(f"Materials without vector stores: {missing_titles}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Some materials are not indexed yet: {', '.join(missing_titles)}. Please wait for indexing to complete or re-upload them."
            )
    
    # Generate quiz with AI
    quiz_data = await quiz_service.generate_quiz(
        course_id=request.course_id,
        topic=request.topic,
        difficulty=request.difficulty,
        num_questions=request.num_questions,
        material_ids=request.material_ids
    )
    
    if "error" in quiz_data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=quiz_data["error"]
        )
    
    # Generate quiz title
    if request.topic:
        quiz_title = f"{request.topic} - {request.difficulty.capitalize()} Quiz"
    else:
        quiz_title = f"{course.title} - {request.difficulty.capitalize()} Quiz"
    
    # Save quiz to database
    quiz = Quiz(
        course_id=request.course_id,
        title=quiz_title,
        description=f"AI-generated quiz with {request.num_questions} questions",
        difficulty=request.difficulty,
        is_adaptive=False
    )
    
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    # Save questions
    for q_data in quiz_data.get("questions", []):
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.get("question_text", ""),
            question_type=q_data.get("question_type", "multiple_choice"),
            options=q_data.get("options", []),
            correct_answer=q_data.get("correct_answer", ""),
            explanation=q_data.get("explanation", ""),
            points=q_data.get("points", 1)
        )
        db.add(question)
    
    db.commit()
    db.refresh(quiz)
    
    return QuizResponse.from_orm(quiz)

@router.post("/", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreate,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Create a quiz (Teacher/Admin only)"""
    # Check course access
    course = db.query(Course).filter(Course.id == quiz_data.course_id).first()
    if not course:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Course not found"
        )
    
    if current_user.role == "teacher" and course.teacher_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to create quiz for this course"
        )
    
    # Create quiz
    quiz = Quiz(
        course_id=quiz_data.course_id,
        title=quiz_data.title,
        description=quiz_data.description,
        difficulty=quiz_data.difficulty,
        is_adaptive=quiz_data.is_adaptive
    )
    
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    
    # Create questions
    for q_data in quiz_data.questions:
        question = QuizQuestion(
            quiz_id=quiz.id,
            question_text=q_data.question_text,
            question_type=q_data.question_type,
            options=q_data.options,
            correct_answer=q_data.correct_answer,
            explanation=q_data.explanation,
            points=q_data.points,
            difficulty=q_data.difficulty
        )
        db.add(question)
    
    db.commit()
    db.refresh(quiz)
    
    return QuizResponse.from_orm(quiz)

@router.get("/course/{course_id}", response_model=List[QuizResponse])
async def get_course_quizzes(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all quizzes for a course"""
    quizzes = db.query(Quiz).filter(Quiz.course_id == course_id).all()
    return [QuizResponse.from_orm(quiz) for quiz in quizzes]

@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get quiz by ID"""
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    return QuizResponse.from_orm(quiz)

@router.post("/attempt", response_model=QuizAttemptResponse)
async def submit_quiz_attempt(
    attempt_data: QuizAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a quiz attempt"""
    # Get quiz with questions
    quiz = db.query(Quiz).filter(Quiz.id == attempt_data.quiz_id).first()
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Get questions
    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz.id).all()
    if not questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quiz has no questions"
        )
    
    # Calculate max score
    max_score = sum(q.points for q in questions)
    
    # Create attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        student_id=current_user.id,
        max_score=max_score,
        started_at=datetime.utcnow()
    )
    
    db.add(attempt)
    db.commit()
    db.refresh(attempt)
    
    # Grade answers
    questions_dict = {q.id: q for q in questions}
    grading_result = quiz_service.grade_quiz(
        questions=[{
            "id": q.id,
            "correct_answer": q.correct_answer,
            "question_type": q.question_type,
            "points": q.points,
            "explanation": q.explanation
        } for q in questions],
        answers=[{
            "question_id": ans.question_id,
            "student_answer": ans.student_answer
        } for ans in attempt_data.answers]
    )
    
    # Save answers
    for result in grading_result["results"]:
        answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=result["question_id"],
            student_answer=result["student_answer"],
            is_correct=result["is_correct"],
            points_earned=result["points_earned"]
        )
        db.add(answer)
    
    # Update attempt
    attempt.score = grading_result["earned_points"]
    attempt.percentage = grading_result["percentage"]
    attempt.completed_at = datetime.utcnow()
    attempt.time_taken = int((attempt.completed_at - attempt.started_at).total_seconds())
    
    # Update student competency score based on performance
    if current_user.role == "student":
        old_competency = current_user.competency_score
        print(f"Updating competency for student {current_user.id}")
        print(f"  Current competency: {old_competency}")
        print(f"  Quiz score: {grading_result['percentage']}%")
        
        # Get student's recent quiz performance
        recent_attempts = db.query(QuizAttempt).filter(
            QuizAttempt.student_id == current_user.id,
            QuizAttempt.completed_at.isnot(None)
        ).order_by(QuizAttempt.completed_at.desc()).limit(5).all()
        
        print(f"  Recent attempts: {len(recent_attempts)}")
        
        # Calculate new competency score (weighted average of recent attempts)
        if recent_attempts:
            total_weight = 0
            weighted_sum = 0
            for idx, att in enumerate(recent_attempts):
                weight = 1.0 / (idx + 1)  # More recent attempts have higher weight
                weighted_sum += att.percentage * weight
                total_weight += weight
                print(f"    Attempt {idx+1}: {att.percentage}% (weight: {weight:.2f})")
            
            avg_performance = weighted_sum / total_weight if total_weight > 0 else 50
            print(f"  Weighted average: {avg_performance:.2f}%")
            
            # Update competency: 60% old competency + 40% recent performance
            new_competency = int(
                0.6 * current_user.competency_score + 0.4 * avg_performance
            )
            # Ensure competency stays within bounds
            current_user.competency_score = max(0, min(100, new_competency))
            
            print(f"  New competency: {current_user.competency_score}")
    
    db.commit()
    db.refresh(attempt)
    
    # Refresh user to ensure competency update is saved
    if current_user.role == "student":
        db.refresh(current_user)
        print(f"Competency updated successfully: {old_competency} -> {current_user.competency_score}")
    
    return QuizAttemptResponse.from_orm(attempt)

@router.get("/attempts/my", response_model=List[QuizAttemptResponse])
async def get_my_quiz_attempts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's quiz attempts"""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == current_user.id
    ).order_by(QuizAttempt.completed_at.desc()).all()
    
    return [QuizAttemptResponse.from_orm(attempt) for attempt in attempts]

@router.post("/generate-adaptive/{quiz_id}", response_model=QuizResponse)
async def generate_adaptive_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate an adaptive version of a quiz based on student's competency"""
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only students can generate adaptive quizzes"
        )
    
    # Get original quiz
    original_quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not original_quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not found"
        )
    
    # Get student's competency score
    competency = current_user.competency_score
    
    # Determine difficulty based on competency
    if competency < 40:
        difficulty = "easy"
    elif competency < 70:
        difficulty = "medium"
    else:
        difficulty = "hard"
    
    # Get original questions as reference
    original_questions = db.query(QuizQuestion).filter(
        QuizQuestion.quiz_id == quiz_id
    ).all()
    
    # Filter or adjust questions based on difficulty
    # For now, we'll just adjust the question pool
    # In a full implementation, you might want to use AI to generate new questions
    adapted_questions = []
    for q in original_questions:
        # Include questions matching student's level or slightly higher
        if difficulty == "easy" and q.difficulty in ["easy", "medium"]:
            adapted_questions.append(q)
        elif difficulty == "medium":
            adapted_questions.append(q)
        elif difficulty == "hard" and q.difficulty in ["medium", "hard"]:
            adapted_questions.append(q)
    
    if not adapted_questions:
        adapted_questions = original_questions  # Fallback to all questions
    
    # Create response with adapted quiz
    return QuizResponse(
        id=original_quiz.id,
        course_id=original_quiz.course_id,
        title=f"{original_quiz.title} (Adapted - {difficulty.capitalize()})",
        description=f"Adaptive quiz tailored to your competency level ({competency}/100)",
        difficulty=difficulty,
        is_adaptive=True,
        created_at=original_quiz.created_at,
        questions=adapted_questions[:min(len(adapted_questions), 10)]  # Limit to 10 questions
    )

@router.get("/attempts/student/{student_id}", response_model=List[QuizAttemptResponse])
async def get_student_quiz_attempts(
    student_id: int,
    current_user: User = Depends(get_teacher_user),
    db: Session = Depends(get_db)
):
    """Get student's quiz attempts (Teacher/Admin only)"""
    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.student_id == student_id
    ).order_by(QuizAttempt.completed_at.desc()).all()
    
    return [QuizAttemptResponse.from_orm(attempt) for attempt in attempts]
