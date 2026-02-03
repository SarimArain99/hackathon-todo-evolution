"""
Notification routes - REST API endpoints for notification management.

All endpoints require JWT authentication via Better Auth.
Users can only access their own notifications (data isolation).
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlmodel import select

from app.auth import get_current_user, UserRead
from app.database import get_session
from app.models import (
    Notification,
    NotificationCreate,
    NotificationList,
    NotificationRead,
    NotificationUpdate,
    UnreadCountResponse,
)
from app.services.notification_service import NotificationService


router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=NotificationList)
async def list_notifications(
    unread_only: bool = Query(False, description="Filter by unread status"),
    limit: int = Query(50, description="Maximum number of notifications to return", ge=1, le=100),
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> NotificationList:
    """
    List all notifications for the current user.

    Returns notifications ordered by created_at descending (newest first).
    Supports filtering by unread status and limiting results.
    """
    notifications = await NotificationService.list_notifications(
        session=session,
        user_id=current_user.id,
        unread_only=unread_only,
        limit=limit,
    )
    return NotificationList(
        notifications=[NotificationRead.model_validate(n) for n in notifications],
        total=len(notifications),
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
async def unread_count(
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> UnreadCountResponse:
    """
    Get the count of unread notifications for the current user.

    Returns both the actual count and a display_count string.
    The display_count shows "99+" when count exceeds 99.
    """
    count = await NotificationService.get_unread_count(session, current_user.id)
    display_count = "99+" if count > 99 else str(count)
    return UnreadCountResponse(count=count, display_count=display_count)


@router.patch("/{notification_id}", response_model=NotificationRead)
async def mark_read(
    notification_id: int,
    notification_data: NotificationUpdate,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> NotificationRead:
    """
    Mark a notification as read or unread.

    Only the notification owner can update their notifications.
    """
    notification = await NotificationService.update_notification(
        session, notification_id, notification_data, current_user.id
    )
    return NotificationRead.model_validate(notification)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def dismiss_notification(
    notification_id: int,
    session: AsyncSession = Depends(get_session),
    current_user: UserRead = Depends(get_current_user),
) -> None:
    """
    Delete/dismiss a notification.

    Only the notification owner can delete their notifications.
    """
    await NotificationService.delete_notification(session, notification_id, current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
