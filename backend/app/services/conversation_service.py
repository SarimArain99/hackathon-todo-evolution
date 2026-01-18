"""
Conversation service for AI chatbot.

Manages conversation and message persistence with user isolation.
Hybrid storage: metadata in Neon PostgreSQL, vectors in Qdrant.
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Conversation, Message, ConversationRead, MessageRead


class ConversationService:
    """
    Service for managing conversations and messages.

    Uses hybrid storage:
    - Neon PostgreSQL for structured data and metadata
    - Qdrant vector database for semantic search embeddings
    """

    @staticmethod
    async def get_or_create(
        session: AsyncSession,
        user_id: str,
        conversation_id: Optional[int] = None,
    ) -> Conversation:
        """
        Get existing conversation or create a new one.

        Args:
            session: Database session
            user_id: User ID for ownership
            conversation_id: Existing conversation ID (None for new)

        Returns:
            Conversation entity

        Raises:
            ValueError: If conversation_id provided but not found or not owned by user
        """
        if conversation_id:
            # Get existing conversation
            stmt = select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id,
            )
            result = await session.execute(stmt)
            conversation = result.scalar_one_or_none()

            if not conversation:
                raise ValueError(
                    f"Conversation {conversation_id} not found or access denied"
                )

            # Update updated_at timestamp
            conversation.updated_at = datetime.utcnow()
            await session.commit()
            await session.refresh(conversation)
            return conversation

        # Create new conversation
        conversation = Conversation(user_id=user_id)
        session.add(conversation)
        await session.commit()
        await session.refresh(conversation)
        return conversation

    @staticmethod
    async def list_by_user(
        session: AsyncSession,
        user_id: str,
        limit: int = 50,
    ) -> list[ConversationRead]:
        """
        List all conversations for a user.

        Args:
            session: Database session
            user_id: User ID for filtering
            limit: Maximum number of conversations to return

        Returns:
            List of ConversationRead schemas
        """
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.updated_at.desc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        conversations = result.scalars().all()

        return [
            ConversationRead(
                id=c.id,
                user_id=c.user_id,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in conversations
        ]

    @staticmethod
    async def get_messages(
        session: AsyncSession,
        conversation_id: int,
        user_id: str,
        limit: int = 100,
    ) -> list[MessageRead]:
        """
        Get all messages for a conversation.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for ownership check
            limit: Maximum number of messages to return

        Returns:
            List of MessageRead schemas

        Raises:
            ValueError: If conversation not found or not owned by user
        """
        # Verify ownership
        conv_stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        conv_result = await session.execute(conv_stmt)
        if not conv_result.scalar_one_or_none():
            raise ValueError(
                f"Conversation {conversation_id} not found or access denied"
            )

        # Get messages
        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await session.execute(stmt)
        messages = result.scalars().all()

        return [
            MessageRead(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
            )
            for m in messages
        ]

    @staticmethod
    async def add_message(
        session: AsyncSession,
        conversation_id: int,
        role: str,
        content: Optional[str],
        tool_calls: Optional[list[dict]] = None,
        user_id: Optional[str] = None,
    ) -> Message:
        """
        Add a message to a conversation.

        Stores metadata in Neon PostgreSQL and embeddings in Qdrant.

        Args:
            session: Database session
            conversation_id: Conversation ID
            role: Message role ("user" or "assistant")
            content: Message content (text)
            tool_calls: Optional list of tool call dicts
            user_id: User ID for Qdrant storage (optional but recommended)

        Returns:
            Created Message entity
        """
        import json

        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            tool_calls=json.dumps(tool_calls) if tool_calls else None,
        )
        session.add(message)

        # Update conversation timestamp
        conversation = await session.get(Conversation, conversation_id)
        if conversation:
            conversation.updated_at = datetime.utcnow()
            # Get user_id from conversation if not provided
            if user_id is None:
                user_id = conversation.user_id

        await session.commit()
        await session.refresh(message)

        # Store embedding in Qdrant for semantic search
        if content and user_id:
            try:
                from app.services.qdrant_service import get_qdrant_service
                qdrant = get_qdrant_service()
                await qdrant.store_message(
                    message_id=message.id,
                    conversation_id=conversation_id,
                    user_id=user_id,
                    role=role,
                    content=content,
                )
            except Exception:
                # Qdrant is optional - fail silently
                pass

        return message

    @staticmethod
    async def delete_conversation(
        session: AsyncSession,
        conversation_id: int,
        user_id: str,
    ) -> bool:
        """
        Delete a conversation and its messages.

        Deletes from both Neon PostgreSQL and Qdrant vector database.

        Args:
            session: Database session
            conversation_id: Conversation ID
            user_id: User ID for ownership check

        Returns:
            True if deleted, False if not found

        Raises:
            ValueError: If conversation not owned by user
        """
        # Verify ownership
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        result = await session.execute(stmt)
        conversation = result.scalar_one_or_none()

        if not conversation:
            return False

        # Delete messages first (foreign key constraint)
        msg_stmt = select(Message).where(
            Message.conversation_id == conversation_id
        )
        msg_result = await session.execute(msg_stmt)
        messages = msg_result.scalars().all()
        for msg in messages:
            await session.delete(msg)

        # Delete conversation
        await session.delete(conversation)
        await session.commit()

        # Delete from Qdrant vector database
        try:
            from app.services.qdrant_service import get_qdrant_service
            qdrant = get_qdrant_service()
            await qdrant.delete_conversation_messages(conversation_id)
        except Exception:
            # Qdrant deletion is optional - fail silently
            pass

        return True
