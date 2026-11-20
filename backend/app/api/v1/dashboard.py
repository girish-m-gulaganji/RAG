from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.conversation import Conversation, Message
from app.models.note import StudyNote
from app.models.quiz import QuizAttempt
from app.models.summary import Summary
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve overview metrics and learning activity for the student dashboard."""
    # Count metrics
    total_videos = db.query(Video).filter(Video.user_id == current_user.id).count()
    total_notes = db.query(StudyNote).filter(StudyNote.user_id == current_user.id).count()
    total_summaries = db.query(Summary).filter(Summary.user_id == current_user.id).count()
    total_conversations = (
        db.query(Conversation).filter(Conversation.user_id == current_user.id).count()
    )

    # Quiz stats
    attempts = (
        db.query(QuizAttempt).filter(QuizAttempt.user_id == current_user.id).all()
    )
    total_attempts = len(attempts)
    avg_score = 0.0
    if total_attempts > 0:
        total_pct = sum(
            (a.score / a.total_questions * 100)
            for a in attempts
            if a.total_questions > 0
        )
        avg_score = round(total_pct / total_attempts, 1)

    # Recent videos
    recent_videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .limit(5)
        .all()
    )

    # Recent conversations
    recent_convs = (
        db.query(Conversation)
        .filter(Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .limit(5)
        .all()
    )

    conv_items = []
    for c in recent_convs:
        last_msg = (
            db.query(Message)
            .filter(Message.conversation_id == c.id)
            .order_by(Message.id.desc())
            .first()
        )
        conv_items.append({
            "id": c.id,
            "video_id": c.video_id,
            "title": c.title,
            "video_title": c.video.title if c.video else "Video",
            "last_message": last_msg.content[:80] if last_msg else "",
            "updated_at": c.updated_at,
        })

    return {
        "metrics": {
            "total_videos": total_videos,
            "total_notes": total_notes,
            "total_summaries": total_summaries,
            "total_conversations": total_conversations,
            "total_quiz_attempts": total_attempts,
            "average_quiz_score": avg_score,
        },
        "recent_videos": [VideoResponse.from_orm(v) for v in recent_videos],
        "recent_conversations": conv_items,
    }
