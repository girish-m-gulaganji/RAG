import json
import logging
from typing import Optional
from groq import Groq
from app.config import settings

logger = logging.getLogger(__name__)


class LLMService:
    def __init__(self):
        self._groq_client: Optional[Groq] = None

    def get_groq_client(self) -> Groq:
        if self._groq_client is None:
            if not settings.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY is not configured in settings or environment.")
            self._groq_client = Groq(api_key=settings.GROQ_API_KEY)
        return self._groq_client

    def chat(
        self,
        system_prompt: str,
        user_prompt: str,
        temperature: float = 0.2,
        json_mode: bool = False,
    ) -> str:
        """Execute chat completion with primary model and automatic fallback."""
        models_to_try = [settings.GROQ_MODEL, settings.FALLBACK_GROQ_MODEL]

        last_error = None
        for model in models_to_try:
            try:
                client = self.get_groq_client()
                kwargs = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt},
                    ],
                    "temperature": temperature,
                }
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = client.chat.completions.create(**kwargs)
                return (response.choices[0].message.content or "").strip()
            except Exception as exc:
                last_error = exc
                logger.warning(f"Model {model} failed: {exc}. Trying fallback...")
                continue

        # Try Google Gemini if configured
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                config_kwargs = {
                    "system_instruction": system_prompt,
                    "temperature": temperature,
                }
                if json_mode:
                    config_kwargs["response_mime_type"] = "application/json"

                resp = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=user_prompt,
                    config=types.GenerateContentConfig(**config_kwargs),
                )
                return (resp.text or "").strip()
            except Exception as g_exc:
                last_error = g_exc

        raise RuntimeError(f"All LLM providers failed: {last_error}")


llm_service = LLMService()
