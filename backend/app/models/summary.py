from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Summary(Base):
    __tablename__ = "summaries"

    id = Column(Integer, primary_key=True, index=True)
    video_id = Column(
        Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    short_summary = Column(Text, nullable=False)
    detailed_summary = Column(Text, nullable=False)
    key_topics_json = Column(Text, nullable=False)  # JSON serialized list of topics
    key_takeaways_json = Column(Text, nullable=False)  # JSON serialized list of takeaways
    definitions_json = Column(Text, nullable=False)  # JSON serialized list/dict of key terms
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    user = relationship("User", back_populates="summaries")
    video = relationship("Video", back_populates="summaries")
