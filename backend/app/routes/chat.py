"""
Chat API routes for AI Todo Chatbot.

Provides endpoints for natural language task management through AI agent.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from slowapi import Limiter

from app.auth import get_current_user
from app.database import get_session
from app.models import (
    CreateMessageRequest,
    ChatResponse,
    ConversationRead,
    ConversationWithMessages,
    MessageRead,
    UserRead,
)
from app.services.agent_service import AgentService
from app.services.conversation_service import ConversationService


router = APIRouter(prefix="/api/chat", tags=["chat"])

# Rate limiter for chat endpoints - uses IP address for limiting
def _get_rate_limit_key(request: Request) -> str:
    """Get rate limit key from request IP address."""
    return getattr(getattr(request, "client", None), "host", "anon")

limiter = Limiter(key_func=_get_rate_limit_key)


@router.post("", response_model=ChatResponse)
@limiter.limit("20/minute")  # 20 messages per minute per IP
async def chat_message(
    request: Request,  # Starlette Request for rate limiter
    body: CreateMessageRequest,  # Request body
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
) -> ChatResponse:
    """
    Process a chat message through the AI agent.

    Supports stateless operation - provide conversation_id to continue
    an existing conversation, or omit to start a new one.

    The AI agent can:
    - Create new tasks
    - List and filter tasks
    - Complete tasks
    - Update task details
    - Delete tasks
    """
    try:
        agent_service = AgentService()
        return await agent_service.process_message(
            body,
            session,
            current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}",
        )


@router.get("/conversations", response_model=list[ConversationRead])
async def list_conversations(
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
    limit: int = 50,
) -> list[ConversationRead]:
    """List all conversations for the current user."""
    return await ConversationService.list_by_user(
        session,
        current_user.id,
        limit=limit,
    )


@router.get("/conversations/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
) -> ConversationWithMessages:
    """Get a conversation with all its messages."""
    from app.models import Conversation
    from sqlalchemy import select

    # Get conversation
    stmt = (
        select(Conversation)
        .where(
            Conversation.id == conversation_id,
            Conversation.user_id == current_user.id,
        )
    )
    result = await session.execute(stmt)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Get messages
    messages = await ConversationService.get_messages(
        session,
        conversation_id,
        current_user.id,
    )

    return ConversationWithMessages(
        conversation=ConversationRead(
            id=conversation.id,
            user_id=conversation.user_id,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
        ),
        messages=messages,
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[UserRead, Depends(get_current_user)],
) -> None:
    """Delete a conversation and all its messages."""
    deleted = await ConversationService.delete_conversation(
        session,
        conversation_id,
        current_user.id,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )
