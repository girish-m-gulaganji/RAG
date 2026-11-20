from datetime import datetime
from typing import List, Dict, Any
from pydantic import BaseModel, ConfigDict


class SummaryGenerateRequest(BaseModel):
    video_id: int


class SummaryResponse(BaseModel):
    id: int
    video_id: int
    short_summary: str
    detailed_summary: str
    key_topics: List[str]
    key_takeaways: List[str]
    definitions: List[Dict[str, str]]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
