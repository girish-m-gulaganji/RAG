import uuid
from typing import Any, Dict, List, Optional
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    FieldCondition,
    Filter,
    MatchValue,
    PayloadSchemaType,
    PointStruct,
    VectorParams,
)

from app.config import settings
from app.services.embedding_service import embedding_service

_NAMESPACE = uuid.UUID("6f9619ff-8b86-d011-b42d-00c04fc964ff")


class VectorService:
    def __init__(self):
        self._client: Optional[QdrantClient] = None
        self.collection_name = settings.QDRANT_COLLECTION

    def get_client(self) -> QdrantClient:
        if self._client is None:
            if settings.QDRANT_URL:
                self._client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY or None,
                    timeout=30.0,
                )
            else:
                self._client = QdrantClient(path="./qdrant_storage")
        return self._client

    def ensure_collection(self) -> str:
        client = self.get_client()
        if not client.collection_exists(self.collection_name):
            client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIM,
                    distance=Distance.COSINE,
                ),
            )
            if settings.QDRANT_URL:
                client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="video_id",
                    field_schema=PayloadSchemaType.KEYWORD,
                )
                client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="user_id",
                    field_schema=PayloadSchemaType.INTEGER,
                )
        return self.collection_name

    def upsert_video_chunks(
        self, user_id: int, video_id: str, title: str, chunks: List[Dict[str, Any]]
    ) -> int:
        if not chunks:
            return 0

        self.ensure_collection()
        client = self.get_client()

        texts = [c["text"] for c in chunks]
        vectors = embedding_service.embed_documents(texts)

        points = []
        for chunk, vector in zip(chunks, vectors):
            point_key = f"{user_id}:{video_id}:{chunk['start_sec']}"
            point_id = str(uuid.uuid5(_NAMESPACE, point_key))

            payload = {
                "user_id": user_id,
                "video_id": video_id,
                "video_title": title,
                "start_sec": chunk["start_sec"],
                "end_sec": chunk["end_sec"],
                "link_sec": chunk["link_sec"],
                "timestamp": chunk["timestamp"],
                "text": chunk["text"],
                "body": chunk["body"],
            }

            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector,
                    payload=payload,
                )
            )

        # Batch upsert
        batch_size = 64
        total = 0
        for i in range(0, len(points), batch_size):
            batch = points[i : i + batch_size]
            client.upsert(collection_name=self.collection_name, points=batch, wait=True)
            total += len(batch)

        return total

    def search_chunks(
        self,
        user_id: int,
        video_id: str,
        query: str,
        top_k: int = 5,
        max_distance: float = 0.65,
    ) -> List[Dict[str, Any]]:
        self.ensure_collection()
        client = self.get_client()

        query_vector = embedding_service.embed_query(query)

        # Filter strictly by both user_id and video_id for multi-tenant security
        user_filter = Filter(
            must=[
                FieldCondition(key="user_id", match=MatchValue(value=user_id)),
                FieldCondition(key="video_id", match=MatchValue(value=video_id)),
            ]
        )

        response = client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=user_filter,
            limit=top_k,
            with_payload=True,
        )

        results = []
        for hit in response.points:
            score = float(hit.score)  # cosine similarity: 1 is identical
            distance = round(1.0 - score, 4)
            if distance <= max_distance:
                payload = hit.payload or {}
                results.append({
                    "text": payload.get("text", ""),
                    "body": payload.get("body", ""),
                    "video_id": payload.get("video_id", video_id),
                    "video_title": payload.get("video_title", ""),
                    "timestamp": payload.get("timestamp", "00:00"),
                    "start_sec": payload.get("start_sec", 0),
                    "link_sec": payload.get("link_sec", 0),
                    "url": f"https://www.youtube.com/watch?v={video_id}&t={payload.get('link_sec', 0)}s",
                    "distance": distance,
                    "score": score,
                })

        return results


vector_service = VectorService()
