import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.conversation import Conversation, Message
from app.models.user import User
from app.models.video import Video
from app.schemas.chat import (
    ChatMessageRequest,
    ChatMessageResponse,
    Citation,
    ConversationResponse,
)
from app.services.rag_chat_service import answer_question

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.post("/{video_id}/message", response_model=ChatMessageResponse)
def send_chat_message(
    video_id: int,
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ask a question about a video. Retrieves chunks, generates grounded answer, and saves history."""
    video = (
        db.query(Video)
        .filter(Video.id == video_id, Video.user_id == current_user.id)
        .first()
    )
    if not video:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Video not found."
        )

    # Resolve or create conversation
    conv = None
    if payload.conversation_id:
        conv = (
            db.query(Conversation)
            .filter(
                Conversation.id == payload.conversation_id,
                Conversation.user_id == current_user.id,
            )
            .first()
        )
    if not conv:
        # Title from first 50 chars of question
        title = payload.question[:45] + ("..." if len(payload.question) > 45 else "")
        conv = Conversation(
            user_id=current_user.id,
            video_id=video.id,
            title=title,
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)

    # Save user message
    user_msg = Message(
        conversation_id=conv.id,
        role="user",
        content=payload.question,
    )
    db.add(user_msg)
    db.commit()

    # Load recent conversation history for context
    past_messages = (
        db.query(Message)
        .filter(Message.conversation_id == conv.id)
        .order_by(Message.id.desc())
        .limit(6)
        .all()
    )
    history = [
        {"role": m.role, "content": m.content} for m in reversed(past_messages[:-1])
    ]

    # Generate grounded RAG answer
    try:
        rag_result = answer_question(
            user_id=current_user.id,
            video_id=video.youtube_id,
            question=payload.question,
            history=history,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI answering service failed: {str(exc)}",
        )

    # Save assistant message
    citations_data = rag_result.get("citations", [])
    assistant_msg = Message(
        conversation_id=conv.id,
        role="assistant",
        content=rag_result["answer"],
        citations_json=json.dumps(citations_data),
        grounded=rag_result.get("grounded", True),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    parsed_citations = [Citation(**c) for c in citations_data]

    return {
        "id": assistant_msg.id,
        "conversation_id": conv.id,
        "role": assistant_msg.role,
        "content": assistant_msg.content,
        "citations": parsed_citations,
        "grounded": assistant_msg.grounded,
        "created_at": assistant_msg.created_at,
    }


@router.get("/{video_id}/conversations", response_model=List[ConversationResponse])
def get_video_conversations(
    video_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all conversation threads for a specific video."""
    conversations = (
        db.query(Conversation)
        .filter(Conversation.video_id == video_id, Conversation.user_id == current_user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )
    return conversations


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation_history(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all messages and citations for a conversation thread."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found."
        )

    response_messages = []
    for msg in conv.messages:
        citations = []
        if msg.citations_json:
            try:
                citations = [Citation(**c) for c in json.loads(msg.citations_json)]
            except Exception:
                citations = []
        response_messages.append(
            ChatMessageResponse(
                id=msg.id,
                conversation_id=conv.id,
                role=msg.role,
                content=msg.content,
                citations=citations,
                grounded=msg.grounded,
                created_at=msg.created_at,
            )
        )

    return {
        "id": conv.id,
        "video_id": conv.video_id,
        "title": conv.title,
        "created_at": conv.created_at,
        "updated_at": conv.updated_at,
        "messages": response_messages,
    }


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a conversation thread and all its messages."""
    conv = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.user_id == current_user.id)
        .first()
    )
    if not conv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found."
        )
    db.delete(conv)
    db.commit()
    return None
