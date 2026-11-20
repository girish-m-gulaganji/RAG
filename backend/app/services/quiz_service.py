import json
from typing import Any, Dict, List
from app.services.llm_service import llm_service

QUIZ_SYSTEM_PROMPT = """You are an expert exam creator and technical interviewer.
Your task is to generate a challenging, high-quality 5-question Multiple Choice Quiz (MCQ) testing student comprehension of the provided YouTube lecture transcript.

Format requirements:
- Exactly 5 multiple-choice questions.
- Each question must have exactly 4 options.
- The options should test true conceptual understanding, not trivial recall.
- Provide the correct_index (0, 1, 2, or 3 corresponding to options[0], options[1], options[2], options[3]).
- Provide a clear, educational explanation for why that answer is correct.

You MUST respond strictly with valid JSON conforming to this schema:
{
  "quiz_title": "Quiz Title based on lecture",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Detailed explanation of why this answer is correct."
    }
  ]
}"""


def generate_video_quiz(title: str, transcript_text: str) -> Dict[str, Any]:
    words = transcript_text.split()
    truncated_text = " ".join(words[:12000]) if len(words) > 12000 else transcript_text

    user_prompt = f"LECTURE TITLE: {title}\n\nLECTURE TRANSCRIPT:\n{truncated_text}"

    response_text = llm_service.chat(
        system_prompt=QUIZ_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        json_mode=True,
    )

    try:
        data = json.loads(response_text)
    except json.JSONDecodeError:
        start_idx = response_text.find("{")
        end_idx = response_text.rfind("}")
        if start_idx != -1 and end_idx != -1:
            data = json.loads(response_text[start_idx : end_idx + 1])
        else:
            raise ValueError("Failed to parse quiz JSON from LLM response.")

    return {
        "quiz_title": data.get("quiz_title", f"Quiz: {title}"),
        "questions": data.get("questions", []),
    }
