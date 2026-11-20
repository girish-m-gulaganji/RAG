import re
from typing import Any, Dict, List, Optional, Tuple
import httpx
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

# Robust YouTube Video ID regex matching watch?v=, youtu.be/, shorts/, embed/
_YOUTUBE_ID_RE = re.compile(
    r"(?:v=|\/|vi=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})"
)


def extract_video_id(url: str) -> Optional[str]:
    """Extract 11-character YouTube video ID from various URL formats."""
    url = url.strip()
    if len(url) == 11 and re.match(r"^[a-zA-Z0-9_-]{11}$", url):
        return url
    match = _YOUTUBE_ID_RE.search(url)
    return match.group(1) if match else None


def get_video_metadata(video_id: str) -> Dict[str, Any]:
    """Fetch video metadata using YouTube's public oEmbed API.
    Fast, reliable, and requires zero API keys.
    """
    oembed_url = (
        f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
    )
    title = f"YouTube Video ({video_id})"
    channel = "YouTube Creator"
    thumbnail_url = f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"

    try:
        with httpx.Client(timeout=10.0) as client:
            resp = client.get(oembed_url)
            if resp.status_code == 200:
                data = resp.json()
                title = data.get("title", title)
                channel = data.get("author_name", channel)
                thumbnail_url = data.get("thumbnail_url", thumbnail_url)
    except Exception:
        pass

    return {
        "video_id": video_id,
        "url": f"https://www.youtube.com/watch?v={video_id}",
        "title": title,
        "channel": channel,
        "thumbnail_url": thumbnail_url,
    }


def fetch_transcript_segments(video_id: str) -> Tuple[List[Dict[str, Any]], str]:
    """Fetch available transcripts via YouTubeTranscriptApi in seconds.
    Tries English, Hindi, Hinglish, and auto-generated subtitles.
    Supports both modern and legacy youtube_transcript_api interfaces.
    Returns (segments, full_cleaned_text).
    """
    raw_items = []
    languages = ["en", "en-US", "en-GB", "hi", "hi-Latn"]

    try:
        # Create an instance if supported
        api = YouTubeTranscriptApi() if callable(YouTubeTranscriptApi) else YouTubeTranscriptApi

        if hasattr(api, "fetch"):
            try:
                raw_items = api.fetch(video_id, languages=languages)
            except Exception:
                raw_items = api.fetch(video_id)
        elif hasattr(YouTubeTranscriptApi, "get_transcript"):
            try:
                raw_items = YouTubeTranscriptApi.get_transcript(video_id, languages=languages)
            except Exception:
                raw_items = YouTubeTranscriptApi.get_transcript(video_id)
        elif hasattr(api, "list"):
            t_list = api.list(video_id)
            try:
                t = t_list.find_transcript(languages)
            except Exception:
                t = t_list.find_generated_transcript(languages)
            raw_items = t.fetch()
        elif hasattr(YouTubeTranscriptApi, "list_transcripts"):
            t_list = YouTubeTranscriptApi.list_transcripts(video_id)
            try:
                t = t_list.find_transcript(languages)
            except Exception:
                t = t_list.find_generated_transcript(languages)
            raw_items = t.fetch()
        else:
            raise ValueError("No compatible transcript fetch method found on YouTubeTranscriptApi.")

    except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable) as exc:
        raise ValueError(
            f"Captions/transcripts are not available for video ID {video_id}. "
            "Please ensure the YouTube video has closed captions (CC) enabled."
        ) from exc
    except Exception as exc:
        raise ValueError(f"Failed to fetch transcript: {str(exc)}") from exc

    segments: List[Dict[str, Any]] = []
    full_text_parts: List[str] = []

    for item in raw_items:
        # Handle both dataclass/object and dict formats
        if isinstance(item, dict):
            text = str(item.get("text", "")).replace("\n", " ").strip()
            start = float(item.get("start", 0.0))
            duration = float(item.get("duration", 0.0))
        else:
            text = str(getattr(item, "text", "")).replace("\n", " ").strip()
            start = float(getattr(item, "start", 0.0))
            duration = float(getattr(item, "duration", 0.0))

        if not text:
            continue

        end = start + duration
        segments.append({
            "start": round(start, 2),
            "end": round(end, 2),
            "text": text,
        })
        full_text_parts.append(text)

    return segments, " ".join(full_text_parts)
