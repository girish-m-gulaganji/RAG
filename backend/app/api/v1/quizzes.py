import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.quiz import Quiz, QuizAttempt, QuizQuestion
from app.models.user import User
from app.models.video import Video
from app.schemas.quiz import (
    QuizQuestionResponse,
    QuizResponse,
    QuizResultResponse,
    QuizSubmitRequest,
)
from app.services.quiz_service import generate_video_quiz

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


def _format_quiz(quiz: Quiz, hide_answers: bool = True) -> QuizResponse:
    q_responses = []
    for q in quiz.questions:
        options = json.loads(q.options_json)
        q_responses.append(
            QuizQuestionResponse(
                id=q.id,
                question_text=q.question_text,
                options=options,
                correct_index=None if hide_answers else q.correct_index,
                explanation=None if hide_answers else q.explanation,
            )
        )
    return QuizResponse(
        id=quiz.id,
        video_id=quiz.video_id,
        title=quiz.title,
        total_questions=len(q_responses),
        created_at=quiz.created_at,
        questions=q_responses,
    )


@router.post("/{video_id}/generate", response_model=QuizResponse)
def generate_quiz(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a 5-question multiple choice quiz testing lecture understanding."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found."
        )

    # Return existing if already created
    existing = (
        db.query(Quiz)
        .filter(Quiz.video_id == video.id, Quiz.user_id == current_user.id)
        .first()
    )
    if existing:
        return _format_quiz(existing, hide_answers=True)

    if not video.transcript_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is not available to generate a quiz.",
        )

    try:
        quiz_data = generate_video_quiz(
            title=video.title, transcript_text=video.transcript_raw
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate quiz: {str(exc)}",
        )

    questions_list = quiz_data.get("questions", [])
    quiz = Quiz(
        video_id=video.id,
        user_id=current_user.id,
        title=quiz_data.get("quiz_title", f"Quiz: {video.title}"),
        total_questions=len(questions_list),
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    for item in questions_list:
        q_record = QuizQuestion(
            quiz_id=quiz.id,
            question_text=item.get("question", ""),
            options_json=json.dumps(item.get("options", [])),
            correct_index=int(item.get("correct_index", 0)),
            explanation=item.get("explanation", ""),
        )
        db.add(q_record)

    db.commit()
    db.refresh(quiz)
    return _format_quiz(quiz, hide_answers=True)


@router.get("/{video_id}", response_model=QuizResponse)
def get_quiz(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the active quiz for a video."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.video_id == video_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quiz not generated yet for this video.",
        )
    return _format_quiz(quiz, hide_answers=True)


@router.post("/{quiz_id}/submit", response_model=QuizResultResponse)
def submit_quiz_answers(
    quiz_id: int,
    submission: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit student answers, grade the quiz, and return comprehensive score & review."""
    quiz = (
        db.query(Quiz)
        .filter(Quiz.id == quiz_id, Quiz.user_id == current_user.id)
        .first()
    )
    if not quiz:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Quiz not found."
        )

    score = 0
    total = len(quiz.questions)
    review = []

    for q in quiz.questions:
        options = json.loads(q.options_json)
        selected_index = submission.answers.get(q.id)
        is_correct = selected_index == q.correct_index
        if is_correct:
            score += 1

        selected_text = (
            options[selected_index]
            if (selected_index is not None and 0 <= selected_index < len(options))
            else "Not Answered"
        )
        correct_text = (
            options[q.correct_index]
            if (0 <= q.correct_index < len(options))
            else "N/A"
        )

        review.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "options": options,
            "selected_index": selected_index,
            "selected_text": selected_text,
            "correct_index": q.correct_index,
            "correct_text": correct_text,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    percentage = round((score / total) * 100, 1) if total > 0 else 0.0

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=current_user.id,
        score=score,
        total_questions=total,
        selected_answers_json=json.dumps(
            {str(k): v for k, v in submission.answers.items()}
        ),
        completed_at=datetime.now(timezone.utc),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "attempt_id": attempt.id,
        "quiz_id": quiz.id,
        "score": score,
        "total_questions": total,
        "percentage": percentage,
        "review": review,
        "completed_at": attempt.completed_at,
    }
