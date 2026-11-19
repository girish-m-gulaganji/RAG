"""Pluggable embedder.

One backend today (sentence-transformers), but everything downstream talks to
the Protocol, so swapping the model is a config change plus `ytrag reindex`.
"""

import contextlib
import io
import os
import re
import sys
from typing import Protocol

from ytrag.config import EMBED_BATCH, EMBED_MODEL, EMBED_QUERY_PREFIX

# Noise the model loader prints from a compiled extension, which no env var
# turns off. Filtered rather than suppressed wholesale: anything that is not
# one of these still reaches stderr, so real failures are never hidden.
_BENIGN = re.compile(
    r"unauthenticated requests to the HF Hub|Loading weights:|^\s*$"
)


@contextlib.contextmanager
def _quiet_load():
    """Swallow the known-benign loader chatter, re-emit everything else."""
    captured = io.StringIO()
    try:
        with contextlib.redirect_stderr(captured):
            yield
    finally:
        for line in captured.getvalue().splitlines():
            if not _BENIGN.search(line):
                print(line, file=sys.stderr)


class Embedder(Protocol):
    name: str
    dim: int

    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...

    def embed_query(self, text: str) -> list[float]: ...


class SentenceTransformerEmbedder:
    """Local embeddings. Default is bge-m3 (1024-dim, multilingual).

    bge-m3 needs no instruction prefix. Some other models do, and only on the
    query side — bge-*-en-v1.5 wants "Represent this sentence for searching
    relevant passages: ". That is what EMBED_QUERY_PREFIX is for. Getting this
    wrong degrades results silently: no error, just worse answers.
    """

    def __init__(self, model_name: str = EMBED_MODEL, batch_size: int = EMBED_BATCH):
        from sentence_transformers import SentenceTransformer

        self.name = model_name
        self.batch_size = batch_size
        with _quiet_load():
            self.model = SentenceTransformer(model_name)
        # Renamed in sentence-transformers 6; keep working on older pins too.
        get_dim = getattr(self.model, "get_embedding_dimension", None) or (
            self.model.get_sentence_embedding_dimension
        )
        self.dim = int(get_dim())

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        vectors = self.model.encode(
            texts,
            batch_size=self.batch_size,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return [v.tolist() for v in vectors]

    def embed_query(self, text: str) -> list[float]:
        vector = self.model.encode(
            EMBED_QUERY_PREFIX + text,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vector.tolist()


class HuggingFaceInferenceEmbedder:
    """Lightweight remote embedder for serverless runtimes (Vercel, AWS Lambda).

    Uses Hugging Face Serverless Inference API so no local PyTorch or
    sentence-transformers installation is required (keeping deployment < 35MB).
    """

    def __init__(self, model_name: str = EMBED_MODEL):
        self.name = model_name
        self.dim = 384 if "minilm" in model_name.lower() else 1024
        hf_repo = model_name if "/" in model_name else f"sentence-transformers/{model_name}"
        self.api_url = f"https://router.huggingface.co/hf-inference/models/{hf_repo}"
        self.fallback_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{hf_repo}"
        self.token = os.getenv("HF_TOKEN") or os.getenv("HUGGINGFACE_API_KEY", "")

    def _normalize(self, v: list[float]) -> list[float]:
        norm = sum(x * x for x in v) ** 0.5
        return [x / norm for x in v] if norm > 0 else v

    def _post(self, payload: dict) -> list:
        import httpx

        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        for url in (self.api_url, self.fallback_url):
            try:
                resp = httpx.post(url, headers=headers, json=payload, timeout=25.0)
                if resp.status_code == 200:
                    return resp.json()
            except Exception:
                continue
        # If both fail or return non-200, try once more raising on final attempt
        resp = httpx.post(self.api_url, headers=headers, json=payload, timeout=25.0)
        resp.raise_for_status()
        return resp.json()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        data = self._post({"inputs": texts})
        return [self._normalize(v) for v in data]

    def embed_query(self, text: str) -> list[float]:
        prompt = EMBED_QUERY_PREFIX + text
        data = self._post({"inputs": prompt})
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
            data = data[0]
        return self._normalize(data)


_EMBEDDER: Embedder | None = None


def get_embedder() -> Embedder:
    """Load the embedder once per process.

    Defaults to SentenceTransformerEmbedder when local PyTorch is available,
    and seamlessly falls back to HuggingFaceInferenceEmbedder on Vercel / serverless.
    """
    global _EMBEDDER
    if _EMBEDDER is None:
        backend = os.getenv("YTRAG_EMBED_BACKEND", "").lower()
        if backend == "hf" or os.getenv("VERCEL"):
            _EMBEDDER = HuggingFaceInferenceEmbedder()
        else:
            try:
                _EMBEDDER = SentenceTransformerEmbedder()
            except (ImportError, ModuleNotFoundError):
                _EMBEDDER = HuggingFaceInferenceEmbedder()
    return _EMBEDDER
