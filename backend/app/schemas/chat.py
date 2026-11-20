from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class Citation(BaseModel):
    title: str
    timestamp: str
    url: str
    start_sec: int
    video_id: Optional[str] = None
    distance: float = 0.0


class ChatMessageRequest(BaseModel):
    question: str
    conversation_id: Optional[int] = None


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    citations: List[Citation] = []
    grounded: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: int
    video_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
