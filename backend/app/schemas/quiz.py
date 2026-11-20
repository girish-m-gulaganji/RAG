from datetime import datetime
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, ConfigDict


class QuizQuestionResponse(BaseModel):
    id: int
    question_text: str
    options: List[str]
    correct_index: Optional[int] = None  # Hidden during taking quiz, visible in results
    explanation: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class QuizResponse(BaseModel):
    id: int
    video_id: int
    title: str
    total_questions: int
    created_at: datetime
    questions: List[QuizQuestionResponse]

    model_config = ConfigDict(from_attributes=True)


class QuizSubmitRequest(BaseModel):
    answers: Dict[int, int]  # {question_id: chosen_index}


class QuizResultResponse(BaseModel):
    attempt_id: int
    quiz_id: int
    score: int
    total_questions: int
    percentage: float
    review: List[Dict[str, Any]]  # question, selected, correct, is_correct, explanation
    completed_at: datetime
