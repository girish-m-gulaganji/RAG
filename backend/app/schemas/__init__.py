from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse
from app.schemas.video import VideoProcessRequest, VideoResponse, VideoListResponse
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    ConversationResponse,
    Citation,
)
from app.schemas.summary import SummaryGenerateRequest, SummaryResponse
from app.schemas.note import NoteGenerateRequest, NoteResponse
from app.schemas.quiz import (
    QuizResponse,
    QuizQuestionResponse,
    QuizSubmitRequest,
    QuizResultResponse,
)

__all__ = [
    "UserRegister",
    "UserLogin",
    "Token",
    "UserResponse",
    "VideoProcessRequest",
    "VideoResponse",
    "VideoListResponse",
    "ChatMessageRequest",
    "ChatMessageResponse",
    "ConversationResponse",
    "Citation",
    "SummaryGenerateRequest",
    "SummaryResponse",
    "NoteGenerateRequest",
    "NoteResponse",
    "QuizResponse",
    "QuizQuestionResponse",
    "QuizSubmitRequest",
    "QuizResultResponse",
]
