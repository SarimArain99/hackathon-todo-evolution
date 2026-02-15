"""
Event Publisher Service - Dapr event publishing to Kafka.

Publishes CloudEvents-formatted task lifecycle events via Dapr.
Supports degraded mode (in-memory cache) when Dapr is unavailable.

Usage:
    from app.services.event_publisher import EventPublisher
    await EventPublisher.publish_task_event("created", task, user_id)
"""

import json
import logging
from datetime import datetime
from typing import Any, Optional
from uuid import uuid4


class DateTimeEncoder(json.JSONEncoder):
    """JSON encoder that converts datetime objects to ISO format strings."""

    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

from dapr.clients import DaprClient
from pydantic import ValidationError

from app.models import TaskEvent, TaskEventData, ReminderEvent, ReminderEventData, EventEnvelope

logger = logging.getLogger(__name__)


# In-memory cache for degraded mode (when Dapr unavailable)
_event_cache: list[dict] = []
_max_cache_size = 1000


class EventPublisher:
    """
    Service for publishing events via Dapr to Kafka/Redpanda.

    All events follow CloudEvents 1.0 specification:
    https://github.com/cloudevents/spec/blob/v1.0.0/cloudevents/spec.md

    Topics:
    - task-events: Task lifecycle events (created, updated, completed, deleted)
    - reminders: Reminder notifications

    Degraded Mode:
    - When Dapr is unavailable, events are cached in memory
    - Cached events are stored in _event_cache (max 1000)
    - Events can be replayed when Dapr becomes available
    """

    # Dapr configuration
    PUBSUB_NAME = "kafka-pubsub"
    TASK_TOPIC = "task-events"
    REMINDER_TOPIC = "reminders"

    @staticmethod
    async def publish_task_event(
        event_type: str,  # "created", "updated", "completed", "deleted"
        task: Any,
        user_id: str,
    ) -> bool:
        """
        Publish a task lifecycle event to Kafka via Dapr.

        Args:
            event_type: Type of task operation (created, updated, completed, deleted)
            task: Task model instance
            user_id: User ID who owns the task

        Returns:
            True if published successfully, False if cached (degraded mode)

        Raises:
            Does not raise - errors are logged and cached instead
        """
        try:
            # Build event data
            event_data = TaskEventData(
                task_id=task.id,
                user_id=user_id,
                operation=event_type,
                title=task.title,
                description=task.description,
                completed=task.completed,
                priority=task.priority,
                due_date=task.due_date,
                reminder_at=task.reminder_at,
                tags=json.loads(task.tags) if task.tags else [],
                recurrence_rule=task.recurrence_rule,
                parent_task_id=task.parent_task_id,
                updated_at=task.updated_at,
            )

            # Build CloudEvent envelope
            event = TaskEvent(
                specversion="1.0",
                type=f"todo.task.{event_type}",
                source="/todo-backend",
                id=f"evt_{uuid4()}",
                time=datetime.utcnow(),
                datacontenttype="application/json",
                data=event_data,
            )

            return await EventPublisher._publish_event(
                EventPublisher.TASK_TOPIC,
                event.model_dump(),
            )

        except ValidationError as e:
            logger.error(f"Failed to validate event schema: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to publish task event: {e}")
            return EventPublisher._cache_event(
                EventPublisher.TASK_TOPIC,
                f"todo.task.{event_type}",
                {
                    "task_id": task.id,
                    "user_id": user_id,
                    "operation": event_type,
                },
            )

    @staticmethod
    async def publish_reminder_event(
        task_id: int,
        user_id: str,
        title: str,
        due_date: Optional[datetime],
        reminder_at: datetime,
    ) -> bool:
        """
        Publish a reminder event to Kafka via Dapr.

        Args:
            task_id: Task ID for the reminder
            user_id: User ID who owns the task
            title: Task title
            due_date: Task due date (optional)
            reminder_at: When the reminder should fire

        Returns:
            True if published successfully, False if cached (degraded mode)
        """
        try:
            # Calculate time until due
            time_until_due = None
            if due_date:
                delta = due_date - reminder_at
                if delta.days > 0:
                    time_until_due = f"{delta.days} days"
                elif delta.seconds >= 3600:
                    hours = delta.seconds // 3600
                    time_until_due = f"{hours} hour{'s' if hours > 1 else ''}"
                elif delta.seconds >= 60:
                    minutes = delta.seconds // 60
                    time_until_due = f"{minutes} minute{'s' if minutes > 1 else ''}"
                else:
                    time_until_due = "due soon"

            # Build event data
            event_data = ReminderEventData(
                task_id=task_id,
                user_id=user_id,
                title=title,
                due_date=due_date,
                reminder_at=reminder_at,
                time_until_due=time_until_due,
            )

            # Build CloudEvent envelope
            event = ReminderEvent(
                specversion="1.0",
                type="todo.reminder.triggered",
                source="/todo-backend/dapr-jobs",
                id=f"evt_{uuid4()}",
                time=datetime.utcnow(),
                datacontenttype="application/json",
                data=event_data,
            )

            return await EventPublisher._publish_event(
                EventPublisher.REMINDER_TOPIC,
                event.model_dump(),
            )

        except Exception as e:
            logger.error(f"Failed to publish reminder event: {e}")
            return EventPublisher._cache_event(
                EventPublisher.REMINDER_TOPIC,
                "todo.reminder.triggered",
                {
                    "task_id": task_id,
                    "user_id": user_id,
                },
            )

    @staticmethod
    async def _publish_event(topic: str, event: dict) -> bool:
        """
        Publish event to Dapr pub/sub.

        Args:
            topic: Topic name (task-events or reminders)
            event: Event data as dict

        Returns:
            True if published successfully, False if cached
        """
        try:
            async with DaprClient() as client:
                await client.publish_event(
                    pubsub_name=EventPublisher.PUBSUB_NAME,
                    topic_name=topic,
                    data=json.dumps(event, cls=DateTimeEncoder),
                    data_content_type="application/json",
                )
                logger.info(f"Published event to {topic}: {event['type']}")
                return True

        except Exception as e:
            logger.warning(f"Failed to connect to Dapr - entering degraded mode: {e}")
            # Serialize event dict for caching (convert datetime to str)
            serialized_event = json.loads(json.dumps(event, cls=DateTimeEncoder))
            return EventPublisher._cache_event(topic, event.get("type", "unknown"), serialized_event)

    @staticmethod
    def _cache_event(topic: str, event_type: str, data: dict) -> bool:
        """
        Cache event in memory when Dapr is unavailable (degraded mode).

        Args:
            topic: Topic name
            event_type: Event type
            data: Event data

        Returns:
            False (indicates event was cached, not published)
        """
        global _event_cache

        cached_event = {
            "topic": topic,
            "type": event_type,
            "data": data,
            "cached_at": datetime.utcnow().isoformat(),
        }

        # Add to cache (FIFO eviction at max size)
        _event_cache.append(cached_event)
        if len(_event_cache) > _max_cache_size:
            _event_cache.pop(0)

        logger.warning(f"Event cached (degraded mode): {event_type} (cache size: {len(_event_cache)})")
        return False

    @staticmethod
    def get_cache_size() -> int:
        """Get current size of event cache (for monitoring)."""
        return len(_event_cache)

    @staticmethod
    def get_cached_events() -> list[dict]:
        """Get all cached events (for replay when Dapr becomes available)."""
        return list(_event_cache)

    @staticmethod
    def clear_cache() -> None:
        """Clear cached events (after successful replay)."""
        global _event_cache
        _event_cache = []
        logger.info("Event cache cleared")


class DegradedModeError(Exception):
    """Raised when operating in degraded mode (Dapr unavailable)."""
    pass


def is_degraded_mode() -> bool:
    """
    Check if the system is in degraded mode.

    Degraded mode is active when:
    - Last publish attempt failed
    - Event cache has events

    Returns:
        True if degraded mode is active
    """
    return len(_event_cache) > 0
