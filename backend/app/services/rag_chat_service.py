import re
from typing import Any, Dict, List, Tuple
from app.services.llm_service import llm_service
from app.services.vector_service import vector_service

_CITATION_RE = re.compile(r"\[(\d+)\]")

SYSTEM_PROMPT = """You are an expert AI Learning Assistant and tutor for YouTube educational lectures.
Your task is to answer the user's question using ONLY the provided transcript excerpts from the lecture.

Strict Rules:
1. Base your answer strictly on the transcript excerpts below.
2. If the excerpts do not contain enough information to answer the question, state clearly:
   "This topic is not covered in the lecture transcript."
   Never speculate, guess, or use outside training data to invent answers.
3. Cite your sources inline using [1], [2], etc., corresponding to the numbered excerpts provided.
4. Keep your answer concise, engaging, and clear (3 to 6 sentences).
5. Never invent timestamps or excerpt numbers."""


def _renumber_citations(
    text: str, hits: List[Dict[str, Any]]
) -> Tuple[str, List[Dict[str, Any]]]:
    order: List[int] = []
    for match in _CITATION_RE.finditer(text):
        idx = int(match.group(1))
        if 1 <= idx <= len(hits) and idx not in order:
            order.append(idx)

    if not order:
        return text, []

    remap = {old: new for new, old in enumerate(order, start=1)}
    rewritten = _CITATION_RE.sub(
        lambda m: f"[{remap[int(m.group(1))]}]" if int(m.group(1)) in remap else "",
        text,
    )

    citations = []
    for old_idx in order:
        hit = hits[old_idx - 1]
        citations.append({
            "title": hit.get("video_title", "Lecture Excerpt"),
            "timestamp": hit.get("timestamp", "00:00"),
            "url": hit.get("url", ""),
            "start_sec": hit.get("start_sec", 0),
            "video_id": hit.get("video_id", ""),
            "distance": hit.get("distance", 0.0),
        })

    return rewritten, citations


def answer_question(
    user_id: int,
    video_id: str,
    question: str,
    history: List[Dict[str, str]] = None,
    top_k: int = 5,
) -> Dict[str, Any]:
    question = question.strip()
    if not question:
        return {
            "answer": "Please ask a question about the video lecture.",
            "citations": [],
            "grounded": False,
        }

    # Step 1: Semantic retrieval from Qdrant
    hits = vector_service.search_chunks(
        user_id=user_id, video_id=video_id, query=question, top_k=top_k
    )

    # Guard 1: Nothing relevant found in video
    if not hits:
        return {
            "answer": "This topic is not covered in this video lecture.",
            "citations": [],
            "grounded": False,
        }

    # Step 2: Build context block
    context_blocks = []
    for i, hit in enumerate(hits, start=1):
        context_blocks.append(
            f"[{i}] \"{hit['video_title']}\" @ {hit['timestamp']}\n{hit['text']}"
        )
    context_str = "\n\n".join(context_blocks)

    # Step 3: Format conversation history context
    history_str = ""
    if history:
        history_str = "\nPREVIOUS CONVERSATION CONTEXT:\n"
        for turn in history[-4:]:  # last 2 exchanges
            role = "User" if turn.get("role") == "user" else "Assistant"
            history_str += f"{role}: {turn.get('content')}\n"

    user_prompt = f"{history_str}\nTRANSCRIPT EXCERPTS:\n{context_str}\n\nUSER QUESTION: {question}"

    # Step 4: Call LLM
    raw_answer = llm_service.chat(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.2,
    )

    # Guard 2: Model indicated lack of coverage
    if "not covered in the lecture" in raw_answer.lower():
        return {
            "answer": "This topic is not covered in this video lecture.",
            "citations": [],
            "grounded": False,
        }

    # Step 5: Renumber citations and format
    cleaned_answer, citations = _renumber_citations(raw_answer, hits)

    return {
        "answer": cleaned_answer,
        "citations": citations,
        "grounded": bool(citations),
    }
