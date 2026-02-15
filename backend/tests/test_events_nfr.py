"""
NFR Validation Tests - Event Publishing Performance (T111).

Tests non-functional requirements for event-driven architecture:
- SC-005: Event publishing < 100ms p95
- FR-013: 1000+ events/minute throughput
- SC-008: Degraded mode when Dapr unavailable
- SC-015: Concurrent event handling
"""

import asyncio
import json
import time
from datetime import datetime
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models import TaskEventData, TaskEvent, ReminderEventData, ReminderEvent
from app.services.event_publisher import EventPublisher, _event_cache, is_degraded_mode


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def mock_task():
    """Mock Task model instance."""
    task = MagicMock()
    task.id = 1
    task.user_id = "user-123"
    task.title = "Test Task"
    task.description = "Test Description"
    task.completed = False
    task.priority = "medium"
    task.due_date = None
    task.reminder_at = None
    task.tags = None
    task.recurrence_rule = None
    task.parent_task_id = None
    task.updated_at = datetime.utcnow()
    return task


@pytest.fixture
def clear_cache():
    """Clear event cache before each test."""
    global _event_cache
    _event_cache.clear()
    yield
    _event_cache.clear()


# =============================================================================
# SC-005: Event Publishing Latency Test
# =============================================================================

@pytest.mark.asyncio
async def test_event_publishing_latency_p95_below_100ms(mock_task, clear_cache):
    """
    NFR Test: Event publishing p95 latency < 100ms (SC-005).

    Measures:
    - Publish 100 task events
    - Calculate p95 (95th percentile) latency
    - Verify p95 < 100ms

    Target: p95 < 100ms per event
    """
    latencies = []

    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        # Mock successful publish
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event = AsyncMock()

        # Publish 100 events
        for i in range(100):
            start = time.perf_counter()

            await EventPublisher.publish_task_event(
                event_type="created",
                task=mock_task,
                user_id=mock_task.user_id,
            )

            end = time.perf_counter()
            latencies.append((end - start) * 1000)  # Convert to ms

    # Calculate p95 (95th percentile)
    sorted_latencies = sorted(latencies)
    p95_index = int(len(sorted_latencies) * 0.95)
    p95_latency = sorted_latencies[p95_index]

    # Assert p95 < 100ms
    assert p95_latency < 100, f"p95 latency {p95_latency:.2f}ms exceeds 100ms target"

    # Also assert average latency is reasonable
    avg_latency = sum(latencies) / len(latencies)
    assert avg_latency < 50, f"Average latency {avg_latency:.2f}ms exceeds 50ms"


@pytest.mark.asyncio
async def test_reminder_event_latency_below_100ms(clear_cache):
    """
    NFR Test: Reminder event publishing latency < 100ms.

    Target: Individual reminder events < 100ms
    """
    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event = AsyncMock()

        start = time.perf_counter()
        await EventPublisher.publish_reminder_event(
            task_id=1,
            user_id="user-123",
            title="Test Task",
            due_date=datetime.utcnow(),
            reminder_at=datetime.utcnow(),
        )
        end = time.perf_counter()

        latency_ms = (end - start) * 1000
        assert latency_ms < 100, f"Reminder event latency {latency_ms:.2f}ms exceeds 100ms"


# =============================================================================
# FR-013: Throughput Test - 1000+ Events/Minute
# =============================================================================

@pytest.mark.asyncio
async def test_throughput_1000_events_per_minute(mock_task, clear_cache):
    """
    NFR Test: System can handle 1000+ events/minute (FR-013).

    Test:
    - Publish 1000 events concurrently (batch of 100 at a time)
    - Measure total time
    - Verify throughput >= 1000 events/minute

    Target: >= 1000 events/minute (16.67 events/second)
    """
    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event = AsyncMock()

        event_count = 1000
        start = time.perf_counter()

        # Publish in batches of 100 to avoid overwhelming the test runner
        batch_size = 100
        for _ in range(event_count // batch_size):
            tasks_batch = [
                EventPublisher.publish_task_event(
                    event_type="created",
                    task=mock_task,
                    user_id=mock_task.user_id,
                )
                for _ in range(batch_size)
            ]
            await asyncio.gather(*tasks_batch)

        end = time.perf_counter()
        total_time = end - start

        # Calculate events per minute
        events_per_minute = (event_count / total_time) * 60

        assert events_per_minute >= 1000, (
            f"Throughput {events_per_minute:.0f} events/minute "
            f"below 1000 target (took {total_time:.2f}s for {event_count} events)"
        )


@pytest.mark.asyncio
async def test_concurrent_operations_100_simultaneous(mock_task, clear_cache):
    """
    NFR Test: Handle 100 concurrent events (SC-015).

    Test:
    - Publish 100 events simultaneously
    - Verify all succeed without errors

    Target: 100 simultaneous events handled correctly
    """
    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event = AsyncMock()

        # Create 100 concurrent tasks
        tasks_list = [
            EventPublisher.publish_task_event(
                event_type="created",
                task=mock_task,
                user_id=mock_task.user_id,
            )
            for _ in range(100)
        ]

        # Execute all concurrently
        results = await asyncio.gather(*tasks_list)

        # All should return True (successful publish)
        assert all(results), "Some events failed to publish"

        # Verify Dapr client was called 100 times
        assert mock_client.publish_event.call_count == 100


# =============================================================================
# SC-008: Degraded Mode Tests
# =============================================================================

@pytest.mark.asyncio
async def test_degraded_mode_on_dapr_unavailable(mock_task, clear_cache):
    """
    NFR Test: Degraded mode when Dapr unavailable (SC-008).

    Test:
    - Simulate Dapr connection failure
    - Events are cached instead of failing
    - is_degraded_mode() returns True
    """
    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        # Mock Dapr to raise exception (simulate unavailable)
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event.side_effect = Exception("Dapr unavailable")

        # Publish should cache instead of fail
        result = await EventPublisher.publish_task_event(
            event_type="created",
            task=mock_task,
            user_id=mock_task.user_id,
        )

        # Should return False (cached, not published)
        assert result is False

        # Should be in degraded mode
        assert is_degraded_mode()

        # Event should be in cache (full CloudEvent serialized)
        assert len(_event_cache) == 1
        assert _event_cache[0]["type"] == "todo.task.created"
        # The cached data contains the full serialized event
        assert _event_cache[0]["data"]["data"]["task_id"] == 1


@pytest.mark.asyncio
async def test_cache_size_limit_1000(mock_task, clear_cache):
    """
    NFR Test: Cache limited to 1000 events (FIFO eviction).

    Test:
    - Cache 1001 events
    - Verify oldest event is evicted (FIFO)
    - Cache size stays at 1000
    """
    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event.side_effect = Exception("Dapr unavailable")

        # Publish 1001 events (cache size is 1000)
        for i in range(1001):
            mock_task.id = i
            await EventPublisher.publish_task_event(
                event_type="created",
                task=mock_task,
                user_id="user-123",
            )

        # Cache should be at max size
        assert len(_event_cache) == 1000

        # Oldest event (task_id=0) should have been evicted
        # data["data"]["task_id"] is the path with full CloudEvent serialization
        task_ids_in_cache = [e["data"]["data"]["task_id"] for e in _event_cache]
        assert 0 not in task_ids_in_cache
        assert 1 in task_ids_in_cache  # Second event should still be there
        assert 1000 in task_ids_in_cache  # Last event should be there


@pytest.mark.asyncio
async def test_cache_monitoring_methods(mock_task, clear_cache):
    """
    Test cache monitoring methods for observability.
    """
    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client
        mock_client.publish_event.side_effect = Exception("Dapr unavailable")

        # Publish 5 events (will be cached)
        for _ in range(5):
            await EventPublisher.publish_task_event(
                event_type="created",
                task=mock_task,
                user_id="user-123",
            )

        # get_cache_size should return 5
        assert EventPublisher.get_cache_size() == 5

        # get_cached_events should return list
        cached = EventPublisher.get_cached_events()
        assert len(cached) == 5
        assert "cached_at" in cached[0]

        # clear_cache should empty cache
        EventPublisher.clear_cache()
        assert EventPublisher.get_cache_size() == 0
        assert not is_degraded_mode()


# =============================================================================
# CloudEvents Format Validation
# =============================================================================

@pytest.mark.asyncio
async def test_task_event_cloudevents_format(mock_task, clear_cache):
    """
    Validate published events follow CloudEvents 1.0 specification.

    Required fields:
    - specversion: "1.0"
    - type: Event type (e.g., "todo.task.created")
    - source: Event source (e.g., "/todo-backend")
    - id: Unique event ID
    - time: ISO 8601 timestamp
    - datacontenttype: "application/json"
    - data: Event payload
    """
    published_events = []

    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client

        # Define capture function that will replace the mock method
        original_publish = mock_client.publish_event

        async def capture_publish(pubsub_name, topic_name, data, *args, **kwargs):
            # Capture the published event data
            published_events.append(json.loads(data))

        mock_client.publish_event = capture_publish

        await EventPublisher.publish_task_event(
            event_type="created",
            task=mock_task,
            user_id=mock_task.user_id,
        )

        # Validate CloudEvents format
        assert len(published_events) == 1
        event = published_events[0]

        # Required CloudEvents fields
        assert event["specversion"] == "1.0"
        assert event["type"] == "todo.task.created"
        assert event["source"] == "/todo-backend"
        assert "id" in event
        assert event["id"].startswith("evt_")
        assert "time" in event
        assert event["datacontenttype"] == "application/json"
        assert "data" in event

        # Validate event data payload
        data = event["data"]
        assert data["task_id"] == 1
        assert data["user_id"] == "user-123"
        assert data["operation"] == "created"
        assert data["title"] == "Test Task"


@pytest.mark.asyncio
async def test_reminder_event_cloudevents_format(clear_cache):
    """
    Validate reminder events follow CloudEvents 1.0 specification.
    """
    published_events = []

    with patch('app.services.event_publisher.DaprClient') as mock_dapr:
        mock_client = AsyncMock()
        mock_dapr.return_value.__aenter__.return_value = mock_client

        # Define capture function that will replace the mock method
        async def capture_publish(pubsub_name, topic_name, data, *args, **kwargs):
            published_events.append(json.loads(data))

        mock_client.publish_event = capture_publish

        await EventPublisher.publish_reminder_event(
            task_id=1,
            user_id="user-123",
            title="Test Task",
            due_date=datetime.utcnow(),
            reminder_at=datetime.utcnow(),
        )

        assert len(published_events) == 1
        event = published_events[0]

        # CloudEvents validation
        assert event["specversion"] == "1.0"
        assert event["type"] == "todo.reminder.triggered"
        assert event["source"] == "/todo-backend/dapr-jobs"
        assert "id" in event
        assert "data" in event

        # Reminder-specific validation
        data = event["data"]
        assert data["task_id"] == 1
        assert data["user_id"] == "user-123"
        assert "reminder_at" in data
