from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.video import Video
from app.schemas.video import VideoListResponse, VideoProcessRequest, VideoResponse
from app.services.chunking_service import create_chunks_from_segments
from app.services.vector_service import vector_service
from app.services.youtube_service import (
    extract_video_id,
    fetch_transcript_segments,
    get_video_metadata,
)

router = APIRouter(prefix="/videos", tags=["Videos"])


@router.post("/process", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def process_video(
    req: VideoProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Process a YouTube video URL: extract metadata & transcripts, chunk, and index."""
    video_id = extract_video_id(req.url)
    if not video_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid YouTube URL. Please provide a valid watch, youtu.be, or shorts link.",
        )

    # Check if already processed for this user to avoid redundant processing
    existing = (
        db.query(Video)
        .filter(Video.user_id == current_user.id, Video.youtube_id == video_id)
        .first()
    )
    if existing and existing.status == "processed" and existing.chunk_count > 0:
        return existing

    # Step 1: Get metadata
    meta = get_video_metadata(video_id)

    # Step 2: Fetch transcripts
    try:
        segments, full_text = fetch_transcript_segments(video_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Step 3: Create time-window chunks
    chunks = create_chunks_from_segments(
        video_id=video_id,
        title=meta["title"],
        segments=segments,
    )

    if not chunks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not generate meaningful text chunks from this video's transcript.",
        )

    # Step 4: Index chunks in Qdrant with user isolation
    try:
        vector_service.upsert_video_chunks(
            user_id=current_user.id,
            video_id=video_id,
            title=meta["title"],
            chunks=chunks,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Vector storage indexing failed: {str(exc)}",
        )

    # Step 5: Save or update video record in database
    duration = int(segments[-1]["end"]) if segments else 0

    if existing:
        existing.title = meta["title"]
        existing.channel = meta["channel"]
        existing.thumbnail_url = meta["thumbnail_url"]
        existing.duration_seconds = duration
        existing.transcript_raw = full_text
        existing.chunk_count = len(chunks)
        existing.status = "processed"
        video_record = existing
    else:
        video_record = Video(
            user_id=current_user.id,
            youtube_id=video_id,
            url=meta["url"],
            title=meta["title"],
            channel=meta["channel"],
            duration_seconds=duration,
            thumbnail_url=meta["thumbnail_url"],
            transcript_raw=full_text,
            chunk_count=len(chunks),
            status="processed",
        )
        db.add(video_record)

    db.commit()
    db.refresh(video_record)
    return video_record


@router.get("", response_model=VideoListResponse)
def list_user_videos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all processed videos for the authenticated user."""
    videos = (
        db.query(Video)
        .filter(Video.user_id == current_user.id)
        .order_by(Video.created_at.desc())
        .all()
    )
    return {"videos": videos, "total": len(videos)}


@router.get("/{video_id}", response_model=VideoResponse)
def get_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a specific processed video."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
        )
    return video


@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a video and all associated chats, notes, and quizzes."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found"
        )
    db.delete(video)
    db.commit()
    return None
