import math
from typing import List
import httpx
from app.config import settings

_HF_API_URL = f"https://router.huggingface.co/hf-inference/models/{settings.EMBEDDING_MODEL}"
_HF_FALLBACK_URL = (
    f"https://api-inference.huggingface.co/pipeline/feature-extraction/{settings.EMBEDDING_MODEL}"
)


def _l2_normalize(vector: List[float]) -> List[float]:
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        return [x / norm for x in vector]
    return vector


class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.dim = settings.EMBEDDING_DIM
        self.token = settings.HF_TOKEN
        self._local_model = None

        # Try to load local model if sentence_transformers is available
        try:
            from sentence_transformers import SentenceTransformer
            self._local_model = SentenceTransformer(self.model_name)
        except Exception:
            self._local_model = None

    def _post_hf(self, payload: dict) -> list:
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        for url in (_HF_API_URL, _HF_FALLBACK_URL):
            try:
                resp = httpx.post(url, headers=headers, json=payload, timeout=25.0)
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                continue
        # Final attempt
        resp = httpx.post(_HF_API_URL, headers=headers, json=payload, timeout=25.0)
        resp.raise_for_status()
        return resp.json()

    def embed_documents(self, texts: List[str], batch_size: int = 16) -> List[List[float]]:
        if not texts:
            return []

        if self._local_model:
            vectors = self._local_model.encode(
                texts, batch_size=batch_size, normalize_embeddings=True, show_progress_bar=False
            )
            return [v.tolist() for v in vectors]

        results = []
        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            data = self._post_hf({"inputs": batch})
            for vec in data:
                results.append(_l2_normalize(vec))
        return results

    def embed_query(self, text: str) -> List[float]:
        text = text.strip()
        if not text:
            return [0.0] * self.dim

        if self._local_model:
            vector = self._local_model.encode(
                text, normalize_embeddings=True, show_progress_bar=False
            )
            return vector.tolist()

        data = self._post_hf({"inputs": text})
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            data = data[0]
        return _l2_normalize(data)


embedding_service = EmbeddingService()
