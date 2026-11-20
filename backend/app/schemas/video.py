from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, HttpUrl


class VideoProcessRequest(BaseModel):
    url: str


class VideoResponse(BaseModel):
    id: int
    youtube_id: str
    url: str
    title: str
    channel: Optional[str] = None
    duration_seconds: int = 0
    thumbnail_url: Optional[str] = None
    chunk_count: int = 0
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class VideoListResponse(BaseModel):
    videos: list[VideoResponse]
    total: int
