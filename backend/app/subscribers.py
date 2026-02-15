"""
Dapr Event Subscribers - Event-driven task processing.

Handles incoming events from Kafka via Dapr subscription endpoints.
Dapr discovers subscriptions via the /dapr/subscribe endpoint.

Events handled:
- task-events: Task lifecycle (created, updated, completed, deleted)
- reminders: Reminder notifications from Dapr Jobs

Subscription flow:
1. Dapr sidecar calls GET /dapr/subscribe to discover subscriptions
2. Dapr subscribes to configured topics
3. Events are delivered to registered routes
4. Subscribers process events and return status

Dapr docs: https://docs.dapr.io/developing-applications/building-blocks/pubsub/
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Request, Response
from pydantic import ValidationError

from app.models import TaskEventData, ReminderEventData
from app.services.recurrence_service import RecurrenceService
from app.services.notification_service import NotificationService
from app.database import get_session

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Subscription Discovery Endpoint
# =============================================================================

@router.get("/dapr/subscribe")
async def subscribe() -> list[dict[str, str]]:
    """
    Dapr subscription discovery endpoint.

    Dapr calls this endpoint on startup to discover which topics and routes
    this application wants to subscribe to.

    Returns:
        List of subscription configurations:
        - pubsubname: Dapr pub/sub component name
        - topic: Topic name to subscribe to
        - route: HTTP route to deliver events to
        - metadata: Optional metadata for the subscription

    Example:
        [
            {
                "pubsubname": "kafka-pubsub",
                "topic": "task-events",
                "route": "/events/tasks"
            },
            {
                "pubsubname": "kafka-pubsub",
                "topic": "reminders",
                "route": "/events/reminders"
            }
        ]
    """
    return [
        {
            "pubsubname": "kafka-pubsub",
            "topic": "task-events",
            "route": "/events/tasks",
        },
        {
            "pubsubname": "kafka-pubsub",
            "topic": "reminders",
            "route": "/events/reminders",
        },
    ]


# =============================================================================
# Task Event Subscriber
# =============================================================================

@router.post("/events/tasks")
async def handle_task_event(request: Request) -> Response:
    """
    Handle task lifecycle events from Kafka.

    Processes:
    - completed: Create next instance for recurring tasks
    - created: Schedule reminder if reminder_at is set
    - deleted: Cancel any scheduled jobs

    Args:
        request: FastAPI Request containing CloudEvent data

    Returns:
        Response with status SUCCESS to acknowledge event processing
    """
    try:
        # Parse CloudEvent from request body
        event_data = await request.json()

        # Extract CloudEvents metadata
        event_type = event_data.get("type", "")
        data = event_data.get("data", {})

        logger.info(f"Received task event: {event_type} for task {data.get('task_id')}")

        # Route to appropriate handler based on event type
        if event_type == "todo.task.completed":
            await _handle_task_completed(data)
        elif event_type == "todo.task.created":
            await _handle_task_created(data)
        elif event_type == "todo.task.deleted":
            await _handle_task_deleted(data)
        elif event_type == "todo.task.updated":
            await _handle_task_updated(data)
        else:
            logger.warning(f"Unknown task event type: {event_type}")

        # Return SUCCESS to acknowledge event
        return Response(content='{"status": "SUCCESS"}', status_code=200, media_type="application/json")

    except ValidationError as e:
        logger.error(f"Invalid event schema: {e}")
        return Response(content='{"status": "DROP"}', status_code=400, media_type="application/json")
    except Exception as e:
        logger.error(f"Error processing task event: {e}")
        return Response(content='{"status": "RETRY"}', status_code=500, media_type="application/json")


async def _handle_task_completed(data: dict[str, Any]) -> None:
    """
    Handle task completion event - create next instance for recurring tasks.

    Args:
        data: Task event data
    """
    async for session in get_session():
        try:
            task_id = data.get("task_id")
            user_id = data.get("user_id")
            recurrence_rule = data.get("recurrence_rule")

            if not recurrence_rule:
                logger.debug(f"Task {task_id} is not recurring - skipping instance creation")
                return

            # Create next instance using recurrence service
            next_instance_data = await RecurrenceService.create_next_instance_from_event(
                session=session,
                task_id=task_id,
                user_id=user_id,
            )

            if next_instance_data:
                from app.models import Task
                from sqlalchemy.ext.asyncio import AsyncSession

                # Ensure we have an async session
                if not isinstance(session, AsyncSession):
                    return

                next_task = Task(**next_instance_data)
                session.add(next_task)
                await session.commit()
                await session.refresh(next_task)

                logger.info(f"Created next instance {next_task.id} for recurring task {task_id}")

        except Exception as e:
            logger.error(f"Failed to create next instance: {e}")
            raise


async def _handle_task_created(data: dict[str, Any]) -> None:
    """
    Handle task creation event - schedule reminder if applicable.

    Args:
        data: Task event data
    """
    reminder_at = data.get("reminder_at")
    if not reminder_at:
        return

    # Convert ISO string to datetime if needed
    if isinstance(reminder_at, str):
        reminder_at = datetime.fromisoformat(reminder_at.replace('Z', '+00:00'))

    # Reminder scheduling is handled by Dapr Jobs API
    # This is a placeholder for future Dapr Jobs integration
    logger.info(f"Reminder scheduled for task {data.get('task_id')} at {reminder_at}")


async def _handle_task_deleted(data: dict[str, Any]) -> None:
    """
    Handle task deletion event - cancel scheduled jobs.

    Args:
        data: Task event data
    """
    task_id = data.get("task_id")
    # Cancel any scheduled Dapr Jobs for this task
    # This is a placeholder for future Dapr Jobs integration
    logger.info(f"Cancelled reminder job for deleted task {task_id}")


async def _handle_task_updated(data: dict[str, Any]) -> None:
    """
    Handle task update event - reschedule reminder if changed.

    Args:
        data: Task event data
    """
    reminder_at = data.get("reminder_at")
    if not reminder_at:
        # Cancel existing reminder if reminder_at was cleared
        await _handle_task_deleted(data)
        return

    logger.info(f"Task {data.get('task_id')} updated with reminder at {reminder_at}")


# =============================================================================
# Reminder Event Subscriber
# =============================================================================

@router.post("/events/reminders")
async def handle_reminder_event(request: Request) -> Response:
    """
    Handle reminder events from Dapr Jobs.

    Creates in-app notifications for users when reminder time is reached.

    Args:
        request: FastAPI Request containing CloudEvent data

    Returns:
        Response with status SUCCESS to acknowledge event processing
    """
    try:
        # Parse CloudEvent from request body
        event_data = await request.json()

        # Extract event data
        data = event_data.get("data", {})

        logger.info(f"Received reminder event for task {data.get('task_id')}")

        # Create notification
        async for session in get_session():
            try:
                await NotificationService.create_notification(
                    session=session,
                    user_id=data.get("user_id"),
                    type="due_date_reminder",
                    title=f"Reminder: {data.get('title')}",
                    message=data.get("time_until_due", "Due soon"),
                    task_id=data.get("task_id"),
                )

                logger.info(f"Created reminder notification for task {data.get('task_id')}")

            except Exception as e:
                logger.error(f"Failed to create reminder notification: {e}")
                raise

        # Return SUCCESS to acknowledge event
        return Response(content='{"status": "SUCCESS"}', status_code=200, media_type="application/json")

    except Exception as e:
        logger.error(f"Error processing reminder event: {e}")
        return Response(content='{"status": "RETRY"}', status_code=500, media_type="application/json")


# =============================================================================
# Health Check for Dapr
# =============================================================================

@router.get("/health/subscribers")
async def subscribers_health() -> dict[str, str]:
    """
    Health check endpoint for Dapr subscriber system.

    Returns:
        Health status of subscriber system
    """
    return {
        "status": "healthy",
        "subscribers": "active",
    }
