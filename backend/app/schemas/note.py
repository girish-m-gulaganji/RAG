from datetime import datetime
from pydantic import BaseModel, ConfigDict


class NoteGenerateRequest(BaseModel):
    video_id: int


class NoteResponse(BaseModel):
    id: int
    video_id: int
    title: str
    content_markdown: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
