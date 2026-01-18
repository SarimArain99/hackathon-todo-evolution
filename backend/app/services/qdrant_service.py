"""
Qdrant service for storing and searching conversation history embeddings.

This service provides:
- Vector embeddings for semantic search of chat messages
- Hybrid storage: metadata in Neon PostgreSQL, vectors in Qdrant
- Context retrieval for AI agent based on semantic similarity
"""

import os
from typing import Optional
from typing import List

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams, Filter, FieldCondition, MatchValue


class QdrantService:
    """
    Service for Qdrant vector database operations.

    Stores message embeddings for semantic search and context retrieval.
    """

    # Collection name for chat history (from environment or default)
    COLLECTION_NAME = os.getenv("QDRANT_COLLECTION_NAME", "chat_messages")

    # Embedding dimension (sentence-transformers all-MiniLM-L6-v2)
    EMBEDDING_DIM = 384

    def __init__(self):
        """Initialize Qdrant client."""
        qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        qdrant_api_key = os.getenv("QDRANT_API_KEY")

        if qdrant_api_key:
            self.client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        else:
            self.client = QdrantClient(url=qdrant_url)

        self._ensure_collection()

    def _ensure_collection(self):
        """Create collection if it doesn't exist."""
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]

        if self.COLLECTION_NAME not in collection_names:
            self.client.create_collection(
                collection_name=self.COLLECTION_NAME,
                vectors_config=VectorParams(
                    size=self.EMBEDDING_DIM,
                    distance=Distance.COSINE,
                ),
            )

    async def store_message(
        self,
        message_id: int,
        conversation_id: int,
        user_id: str,
        role: str,
        content: str,
        embedding: Optional[List[float]] = None,
    ) -> bool:
        """
        Store a message embedding in Qdrant.

        Args:
            message_id: Database message ID (used as point ID)
            conversation_id: Conversation ID for filtering
            user_id: User ID for access control
            role: Message role ("user" or "assistant")
            content: Message text content
            embedding: Pre-computed embedding (optional)

        Returns:
            True if stored successfully
        """
        try:
            if embedding is None:
                # Import here to avoid slow startup
                from sentence_transformers import SentenceTransformer
                model = SentenceTransformer('all-MiniLM-L6-v2')
                embedding = model.encode(content).tolist()

            point = PointStruct(
                id=message_id,
                vector=embedding,
                payload={
                    "conversation_id": conversation_id,
                    "user_id": user_id,
                    "role": role,
                    "content": content,
                },
            )

            self.client.upsert(
                collection_name=self.COLLECTION_NAME,
                points=[point],
            )
            return True
        except Exception:
            # Silently fail for production - Qdrant is optional enhancement
            return False

    async def search_context(
        self,
        query: str,
        user_id: str,
        conversation_id: Optional[int] = None,
        limit: int = 10,
    ) -> List[dict]:
        """
        Search for semantically similar messages.

        Args:
            query: Search query text
            user_id: User ID for access control
            conversation_id: Optional conversation ID to scope search
            limit: Maximum results to return

        Returns:
            List of matching messages with metadata
        """
        try:
            # Import here to avoid slow startup
            from sentence_transformers import SentenceTransformer
            model = SentenceTransformer('all-MiniLM-L6-v2')
            query_embedding = model.encode(query).tolist()

            # Build filter
            must_conditions = [
                FieldCondition(
                    key="user_id",
                    match=MatchValue(value=user_id),
                )
            ]

            if conversation_id:
                must_conditions.append(
                    FieldCondition(
                        key="conversation_id",
                        match=MatchValue(value=conversation_id),
                    )
                )

            results = self.client.search(
                collection_name=self.COLLECTION_NAME,
                query_vector=query_embedding,
                query_filter=Filter(must=must_conditions),
                limit=limit,
                with_payload=True,
            )

            return [
                {
                    "message_id": hit.id,
                    "conversation_id": hit.payload.get("conversation_id"),
                    "role": hit.payload.get("role"),
                    "content": hit.payload.get("content"),
                    "score": hit.score,
                }
                for hit in results
            ]
        except Exception:
            # Return empty list on error
            return []

    async def delete_conversation_messages(self, conversation_id: int) -> bool:
        """
        Delete all messages for a conversation from Qdrant.

        Args:
            conversation_id: Conversation ID to delete

        Returns:
            True if deleted successfully
        """
        try:
            self.client.delete(
                collection_name=self.COLLECTION_NAME,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="conversation_id",
                            match=MatchValue(value=conversation_id),
                        )
                    ]
                ),
            )
            return True
        except Exception:
            return False

    async def get_conversation_embeddings(
        self,
        conversation_id: int,
        user_id: str,
    ) -> List[dict]:
        """
        Get all message embeddings for a conversation (chronological order).

        Args:
            conversation_id: Conversation ID
            user_id: User ID for access control

        Returns:
            List of messages with embeddings and metadata
        """
        try:
            results = self.client.scroll(
                collection_name=self.COLLECTION_NAME,
                scroll_filter=Filter(
                    must=[
                        FieldCondition(
                            key="conversation_id",
                            match=MatchValue(value=conversation_id),
                        ),
                        FieldCondition(
                            key="user_id",
                            match=MatchValue(value=user_id),
                        ),
                    ]
                ),
                limit=1000,
                with_payload=True,
                with_vectors=False,
            )

            # Sort by message ID (chronological order)
            messages = results[0]
            messages.sort(key=lambda m: m.id)

            return [
                {
                    "message_id": m.id,
                    "role": m.payload.get("role"),
                    "content": m.payload.get("content"),
                }
                for m in messages
            ]
        except Exception:
            return []


# Global singleton instance
_qdrant_service: Optional[QdrantService] = None


def get_qdrant_service() -> QdrantService:
    """Get or create the Qdrant service singleton."""
    global _qdrant_service
    if _qdrant_service is None:
        _qdrant_service = QdrantService()
    return _qdrant_service
