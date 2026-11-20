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
    Returns (segments, full_cleaned_text).
    """
    try:
        # Check transcript listing to prefer manual over generated, or fall back to any available
        transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)
        
        # Priority order: manual en, generated en, manual hi, generated hi, then any translation to en
        transcript = None
        languages = ["en", "en-US", "en-GB", "hi", "hi-Latn"]
        
        try:
            transcript = transcript_list.find_transcript(languages)
        except Exception:
            try:
                transcript = transcript_list.find_generated_transcript(languages)
            except Exception:
                # Get the first available and translate to en if possible
                for t in transcript_list:
                    transcript = t
                    break

        if transcript is None:
            raise NoTranscriptFound(video_id, languages, None)

        raw_items = transcript.fetch()

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
        text = item.get("text", "").replace("\n", " ").strip()
        if not text:
            continue
        start = float(item.get("start", 0.0))
        duration = float(item.get("duration", 0.0))
        end = start + duration
        segments.append({
            "start": round(start, 2),
            "end": round(end, 2),
            "text": text,
        })
        full_text_parts.append(text)

    return segments, " ".join(full_text_parts)
