from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    youtube_id = Column(String(32), index=True, nullable=False)
    url = Column(String(512), nullable=False)
    title = Column(String(512), nullable=False)
    channel = Column(String(255), nullable=True)
    duration_seconds = Column(Integer, default=0)
    thumbnail_url = Column(String(512), nullable=True)
    transcript_raw = Column(Text, nullable=True)
    chunk_count = Column(Integer, default=0)
    status = Column(String(32), default="processed")  # pending, processing, processed, failed
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    user = relationship("User", back_populates="videos")
    conversations = relationship(
        "Conversation", back_populates="video", cascade="all, delete-orphan"
    )
    summaries = relationship(
        "Summary", back_populates="video", cascade="all, delete-orphan"
    )
    notes = relationship(
        "StudyNote", back_populates="video", cascade="all, delete-orphan"
    )
    quizzes = relationship(
        "Quiz", back_populates="video", cascade="all, delete-orphan"
    )
