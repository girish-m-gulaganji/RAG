import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.summary import Summary
from app.models.user import User
from app.models.video import Video
from app.schemas.summary import SummaryResponse
from app.services.summary_service import generate_video_summary

router = APIRouter(prefix="/summaries", tags=["Summaries"])


def _format_summary(summary: Summary) -> SummaryResponse:
    return SummaryResponse(
        id=summary.id,
        video_id=summary.video_id,
        short_summary=summary.short_summary,
        detailed_summary=summary.detailed_summary,
        key_topics=json.loads(summary.key_topics_json),
        key_takeaways=json.loads(summary.key_takeaways_json),
        definitions=json.loads(summary.definitions_json),
        created_at=summary.created_at,
    )


@router.post("/{video_id}/generate", response_model=SummaryResponse)
def generate_summary(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate or retrieve a structured academic summary for a video."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found."
        )

    # Return existing if already generated
    existing = (
        db.query(Summary)
        .filter(Summary.video_id == video.id, Summary.user_id == current_user.id)
        .first()
    )
    if existing:
        return _format_summary(existing)

    if not video.transcript_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is not available for this video to generate summary.",
        )

    try:
        data = generate_video_summary(
            title=video.title, transcript_text=video.transcript_raw
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(exc)}",
        )

    summary = Summary(
        video_id=video.id,
        user_id=current_user.id,
        short_summary=data["short_summary"],
        detailed_summary=data["detailed_summary"],
        key_topics_json=json.dumps(data["key_topics"]),
        key_takeaways_json=json.dumps(data["key_takeaways"]),
        definitions_json=json.dumps(data["definitions"]),
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)

    return _format_summary(summary)


@router.get("/{video_id}", response_model=SummaryResponse)
def get_summary(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the saved summary for a video."""
    summary = (
        db.query(Summary)
        .filter(Summary.video_id == video_id, Summary.user_id == current_user.id)
        .first()
    )
    if not summary:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Summary not generated yet for this video.",
        )
    return _format_summary(summary)
