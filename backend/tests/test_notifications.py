"""
Tests for Notification API endpoints.

T042, T043: Unit tests for notification system.
"""

import os
from datetime import datetime, timezone, timedelta

import pytest
import pytest_asyncio

# Set test environment variable to use SQLite BEFORE importing the app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"


# =============================================================================
# T042: Unit test notification creation
# =============================================================================

@pytest.mark.asyncio
async def test_task_completion_creates_notification(client):
    """Test that completing a task creates a notification."""
    # Create a task
    task_data = {"title": "Test task to complete"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]

    # Complete the task
    complete_response = await client.post(f"/api/tasks/{task_id}/complete")
    assert complete_response.status_code == 200

    # Check that notification was created
    notifications_response = await client.get("/api/notifications")
    assert notifications_response.status_code == 200
    notifications = notifications_response.json()["notifications"]

    assert len(notifications) > 0
    # Find the completion notification
    completion_notif = next((n for n in notifications if n["type"] == "task_completed"), None)
    assert completion_notif is not None
    assert "Test task to complete" in completion_notif["message"]


@pytest.mark.asyncio
async def test_get_unread_count(client):
    """Test getting unread notification count."""
    # Create and complete a task to generate notification
    task_data = {"title": "Count test task"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    await client.post(f"/api/tasks/{task_id}/complete")

    # Get unread count
    response = await client.get("/api/notifications/unread-count")
    assert response.status_code == 200
    data = response.json()
    assert "count" in data
    assert "display_count" in data
    assert data["count"] >= 1


@pytest.mark.asyncio
async def test_mark_notification_as_read(client):
    """Test marking a notification as read."""
    # Create a notification by completing a task
    task_data = {"title": "Mark read test"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    await client.post(f"/api/tasks/{task_id}/complete")

    # Get the notification
    notifications_response = await client.get("/api/notifications")
    notification_id = notifications_response.json()["notifications"][0]["id"]

    # Mark as read - endpoint is /api/notifications/{id} not /api/notifications/{id}/read
    response = await client.patch(f"/api/notifications/{notification_id}", json={"read": True})
    assert response.status_code == 200
    assert response.json()["read"] is True


@pytest.mark.asyncio
async def test_dismiss_notification(client):
    """Test dismissing (deleting) a notification."""
    # Create a notification
    task_data = {"title": "Dismiss test"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    await client.post(f"/api/tasks/{task_id}/complete")

    # Get the notification
    notifications_response = await client.get("/api/notifications")
    notification_id = notifications_response.json()["notifications"][0]["id"]

    # Dismiss (delete) the notification - endpoint returns 204
    response = await client.delete(f"/api/notifications/{notification_id}")
    assert response.status_code == 204

    # Verify it's gone
    notifications_response2 = await client.get("/api/notifications")
    notifications = notifications_response2.json()["notifications"]
    assert not any(n["id"] == notification_id for n in notifications)


# =============================================================================
# T043: Integration test for notification flow
# =============================================================================

@pytest.mark.asyncio
async def test_notification_flow_complete_to_read(client):
    """Test complete flow: complete task → notification created → mark as read."""
    # 1. Create a task
    task_data = {"title": "Flow test task"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]
    assert create_response.status_code == 201

    # 2. Complete the task
    complete_response = await client.post(f"/api/tasks/{task_id}/complete")
    assert complete_response.status_code == 200
    assert complete_response.json()["completed"] is True

    # 3. Verify notification was created
    notifications_response = await client.get("/api/notifications")
    notifications = notifications_response.json()["notifications"]
    assert len(notifications) > 0

    task_notif = next((n for n in notifications if n["task_id"] == task_id), None)
    assert task_notif is not None
    assert task_notif["type"] == "task_completed"
    assert task_notif["read"] is False

    # 4. Mark as read - endpoint is /api/notifications/{id} not /api/notifications/{id}/read
    notification_id = task_notif["id"]
    mark_response = await client.patch(f"/api/notifications/{notification_id}", json={"read": True})
    assert mark_response.status_code == 200
    assert mark_response.json()["read"] is True

    # 5. Verify unread count decreased
    count_response = await client.get("/api/notifications/unread-count")
    assert count_response.json()["count"] == 0


@pytest.mark.asyncio
async def test_unread_only_filter(client):
    """Test filtering notifications to show only unread ones."""
    # Create two notifications by completing two tasks
    for i in range(2):
        task_data = {"title": f"Task {i}"}
        create_response = await client.post("/api/tasks", json=task_data)
        await client.post(f"/api/tasks/{create_response.json()['id']}/complete")

    # Mark one as read - endpoint is /api/notifications/{id}
    all_notifications = await client.get("/api/notifications")
    notification_id = all_notifications.json()["notifications"][0]["id"]
    await client.patch(f"/api/notifications/{notification_id}", json={"read": True})

    # Get unread only
    unread_response = await client.get("/api/notifications?unread_only=true")
    unread_notifications = unread_response.json()["notifications"]

    # Should have 1 unread
    assert len(unread_notifications) == 1
    assert unread_notifications[0]["read"] is False


@pytest.mark.asyncio
async def test_notifications_newest_first(client):
    """Test that notifications are ordered newest first."""
    # Create multiple tasks and complete them
    for i in range(3):
        task_data = {"title": f"Task {i}"}
        create_response = await client.post("/api/tasks", json=task_data)
        await client.post(f"/api/tasks/{create_response.json()['id']}/complete")

    # Get notifications
    response = await client.get("/api/notifications")
    notifications = response.json()["notifications"]

    # Check they're ordered by created_at descending
    assert len(notifications) >= 3
    for i in range(len(notifications) - 1):
        assert notifications[i]["created_at"] >= notifications[i + 1]["created_at"]
