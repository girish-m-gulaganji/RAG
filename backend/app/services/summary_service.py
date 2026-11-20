import json
from typing import Any, Dict
from app.services.llm_service import llm_service

SUMMARY_SYSTEM_PROMPT = """You are an expert academic summarizer and educator.
Your task is to analyze the provided YouTube lecture transcript and generate an extensive, structured study summary.

You MUST respond strictly with valid JSON conforming to the following structure:
{
  "short_summary": "A punchy, 2-3 sentence overview of the lecture's core message.",
  "detailed_summary": "A comprehensive 3-5 paragraph deep explanation of all key points taught.",
  "key_topics": ["List of 4-6 major topic headings covered"],
  "key_takeaways": ["List of 5-8 actionable, high-yield takeaways from this lecture"],
  "definitions": [
    {"term": "Term Name", "definition": "Clear concise explanation of what this means according to the lecture"}
  ]
}"""


def generate_video_summary(title: str, transcript_text: str) -> Dict[str, Any]:
    # Truncate transcript if excessively long to fit standard context limits safely
    words = transcript_text.split()
    truncated_text = " ".join(words[:12000]) if len(words) > 12000 else transcript_text

    user_prompt = f"LECTURE TITLE: {title}\n\nLECTURE TRANSCRIPT:\n{truncated_text}"

    response_text = llm_service.chat(
        system_prompt=SUMMARY_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        json_mode=True,
    )

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError:
        # Fallback parsing
        start_idx = response_text.find("{")
        end_idx = response_text.rfind("}")
        if start_idx != -1 and end_idx != -1:
            data = json.loads(response_text[start_idx : end_idx + 1])
        else:
            raise ValueError("Failed to parse summary JSON from LLM response.")

    return {
        "short_summary": data.get("short_summary", "Summary unavailable."),
        "detailed_summary": data.get("detailed_summary", "Detailed summary unavailable."),
        "key_topics": data.get("key_topics", []),
        "key_takeaways": data.get("key_takeaways", []),
        "definitions": data.get("definitions", []),
    }
