from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.note import StudyNote
from app.models.user import User
from app.models.video import Video
from app.schemas.note import NoteResponse
from app.services.note_service import generate_study_notes

router = APIRouter(prefix="/notes", tags=["Study Notes"])


class NoteUpdateRequest(BaseModel):
    content_markdown: str


@router.post("/{video_id}/generate", response_model=NoteResponse)
def generate_notes(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate or retrieve comprehensive Markdown study notes for a video."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found."
        )

    existing = (
        db.query(StudyNote)
        .filter(StudyNote.video_id == video.id, StudyNote.user_id == current_user.id)
        .first()
    )
    if existing:
        return existing

    if not video.transcript_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transcript is not available to generate study notes.",
        )

    try:
        content_markdown = generate_study_notes(
            title=video.title, transcript_text=video.transcript_raw
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate study notes: {str(exc)}",
        )

    note = StudyNote(
        video_id=video.id,
        user_id=current_user.id,
        title=f"Study Notes: {video.title}",
        content_markdown=content_markdown,
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    return note


@router.get("/{video_id}", response_model=NoteResponse)
def get_notes(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the saved study notes for a video."""
    note = (
        db.query(StudyNote)
        .filter(StudyNote.video_id == video_id, StudyNote.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Study notes not generated yet for this video.",
        )
    return note


@router.put("/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    payload: NoteUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update user edits to their study notes."""
    note = (
        db.query(StudyNote)
        .filter(StudyNote.id == note_id, StudyNote.user_id == current_user.id)
        .first()
    )
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Note not found."
        )

    note.content_markdown = payload.content_markdown
    db.commit()
    db.refresh(note)
    return note
