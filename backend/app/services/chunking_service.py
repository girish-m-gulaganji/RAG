import re
from collections import Counter
from typing import Any, Dict, List

_SENTENCE_SPLIT = re.compile(r"[.!?\n]+")


def format_timestamp(seconds: int) -> str:
    """Format seconds into HH:MM:SS or MM:SS."""
    seconds = max(0, int(seconds))
    hours, rem = divmod(seconds, 3600)
    minutes, secs = divmod(rem, 60)
    if hours:
        return f"{hours}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def is_repetitive(text: str, threshold: float = 0.6) -> bool:
    """Filter out subtitle loop repetition or music filler."""
    sentences = [s.strip().lower() for s in _SENTENCE_SPLIT.split(text) if s.strip()]
    if len(sentences) < 3:
        return False
    most_common = Counter(sentences).most_common(1)[0][1]
    return (most_common / len(sentences)) >= threshold


def create_chunks_from_segments(
    video_id: str,
    title: str,
    segments: List[Dict[str, Any]],
    window_seconds: int = 75,
    overlap_seconds: int = 15,
    min_words: int = 12,
) -> List[Dict[str, Any]]:
    """Greedy time-window chunking aligning on segment boundaries.
    Preserves exact start and end timestamps for video seeking.
    """
    valid_segments = [s for s in segments if s.get("text", "").strip()]
    if not valid_segments:
        return []

    chunks: List[Dict[str, Any]] = []
    i = 0
    total = len(valid_segments)

    while i < total:
        window_start = valid_segments[i]["start"]
        j = i
        while j < total and (valid_segments[j]["end"] - window_start) < window_seconds:
            j += 1
        
        last = min(j, total - 1)
        body_segments = valid_segments[i : last + 1]

        body = " ".join(s["text"].strip() for s in body_segments).strip()
        start_sec = int(body_segments[0]["start"])
        end_sec = int(body_segments[-1]["end"])
        link_sec = max(0, start_sec - 5)

        enough_words = len(body.split()) >= min_words
        if enough_words and not is_repetitive(body):
            chunks.append({
                "chunk_id": f"{video_id}:{start_sec}",
                "video_id": video_id,
                "video_title": title,
                "start_sec": start_sec,
                "end_sec": end_sec,
                "link_sec": link_sec,
                "timestamp": format_timestamp(link_sec),
                "text": f"{title}\n\n{body}",
                "body": body,
            })

        if last >= total - 1:
            break

        overlap_start = valid_segments[last]["end"] - overlap_seconds
        next_i = last + 1
        for k in range(i, last + 1):
            if valid_segments[k]["start"] >= overlap_start:
                next_i = k
                break
        i = max(next_i, i + 1)

    return chunks
