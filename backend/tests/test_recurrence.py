"""
Tests for Task Recurrence functionality.

T057, T058: Unit tests for RRULE parsing and next instance creation.
"""

import os
from datetime import datetime, timezone, timedelta

import pytest
import pytest_asyncio

# Set test environment variable to use SQLite BEFORE importing the app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["TEST_MODE"] = "true"  # Skip scheduler during tests


# =============================================================================
# T053 (partial): RRULE validation tests
# =============================================================================

@pytest.mark.asyncio
async def test_create_task_with_valid_rrule(client):
    """Test creating a task with valid recurrence rule."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    task_data = {
        "title": "Daily recurring task",
        "recurrence_rule": "FREQ=DAILY;INTERVAL=1",
        "due_date": due_date,
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    assert data["recurrence_rule"] == "FREQ=DAILY;INTERVAL=1"


@pytest.mark.asyncio
async def test_create_task_with_invalid_rrule(client):
    """Test that invalid RRULE is rejected."""
    task_data = {
        "title": "Invalid recurring task",
        "recurrence_rule": "INVALID-RRULE-FORMAT",
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_create_task_weekly_rrule_with_byday(client):
    """Test creating a task with weekly RRULE including BYDAY."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    task_data = {
        "title": "Weekly task on specific days",
        "recurrence_rule": "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,WE,FR",
        "due_date": due_date,
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201
    data = response.json()
    assert "BYDAY=MO,WE,FR" in data["recurrence_rule"]


# =============================================================================
# T057: Unit test RRULE parsing
# =============================================================================

@pytest.mark.asyncio
async def test_daily_recurrence(client):
    """Test daily recurrence RRULE."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    task_data = {
        "title": "Daily task",
        "recurrence_rule": "FREQ=DAILY",
        "due_date": due_date,
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_weekly_recurrence(client):
    """Test weekly recurrence RRULE."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    task_data = {
        "title": "Weekly task",
        "recurrence_rule": "FREQ=WEEKLY",
        "due_date": due_date,
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_monthly_recurrence(client):
    """Test monthly recurrence RRULE."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    task_data = {
        "title": "Monthly task",
        "recurrence_rule": "FREQ=MONTHLY",
        "due_date": due_date,
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_yearly_recurrence(client):
    """Test yearly recurrence RRULE."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).strftime("%Y-%m-%d")

    task_data = {
        "title": "Yearly task",
        "recurrence_rule": "FREQ=YEARLY",
        "due_date": due_date,
    }
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_invalid_rrule_rejected(client):
    """Test that various invalid RRULEs are rejected."""
    invalid_rules = [
        "NOT-A-VALID-RRULE",
        "FREQ=INVALID",
        "random text",
    ]

    for invalid_rule in invalid_rules:
        task_data = {
            "title": f"Test {invalid_rule}",
            "recurrence_rule": invalid_rule,
        }
        response = await client.post("/api/tasks", json=task_data)
        assert response.status_code == 422, f"Should reject invalid RRULE: {invalid_rule}"


# =============================================================================
# T058: Unit test next instance creation
# =============================================================================

@pytest.mark.asyncio
async def test_next_instance_created_on_completion(client):
    """Test that completing a recurring task creates the next instance."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=12, minute=0, second=0, microsecond=0
    )

    task_data = {
        "title": "Recurring task",
        "recurrence_rule": "FREQ=DAILY",
        "due_date": due_date.isoformat(),
    }
    create_response = await client.post("/api/tasks", json=task_data)
    original_task_id = create_response.json()["id"]

    # Complete the task
    complete_response = await client.post(f"/api/tasks/{original_task_id}/complete")
    assert complete_response.status_code == 200

    # Check that a new task was created (parent_task_id set)
    list_response = await client.get("/api/tasks")
    tasks = list_response.json()["tasks"]

    # Find tasks with parent_task_id
    child_tasks = [t for t in tasks if t.get("parent_task_id") == original_task_id]
    assert len(child_tasks) > 0, "Next instance should be created"


@pytest.mark.asyncio
async def test_parent_task_id_set_correctly(client):
    """Test that parent_task_id is correctly set on next instance."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=12, minute=0, second=0, microsecond=0
    )

    task_data = {
        "title": "Parent task",
        "recurrence_rule": "FREQ=DAILY;INTERVAL=1",
        "due_date": due_date.isoformat(),
    }
    create_response = await client.post("/api/tasks", json=task_data)
    parent_id = create_response.json()["id"]

    # Complete the task
    await client.post(f"/api/tasks/{parent_id}/complete")

    # Get the child task
    list_response = await client.get("/api/tasks")
    tasks = list_response.json()["tasks"]
    child_task = next((t for t in tasks if t.get("parent_task_id") == parent_id), None)

    assert child_task is not None
    assert child_task["parent_task_id"] == parent_id
    assert child_task["title"] == "Parent task"
    assert child_task["completed"] is False  # New instance should not be completed


@pytest.mark.asyncio
async def test_fields_copied_correctly(client):
    """Test that fields are correctly copied to next instance."""
    due_date = (datetime.now(timezone.utc) + timedelta(days=1)).replace(
        hour=12, minute=0, second=0, microsecond=0
    )

    task_data = {
        "title": "Original Task",
        "description": "Original description",
        "priority": "high",
        "tags": ["work", "recurring"],
        "recurrence_rule": "FREQ=DAILY",
        "due_date": due_date.isoformat(),
    }
    create_response = await client.post("/api/tasks", json=task_data)
    parent_id = create_response.json()["id"]

    # Complete the task
    await client.post(f"/api/tasks/{parent_id}/complete")

    # Get the child task
    list_response = await client.get("/api/tasks")
    tasks = list_response.json()["tasks"]
    child_task = next((t for t in tasks if t.get("parent_task_id") == parent_id), None)

    assert child_task is not None
    assert child_task["title"] == "Original Task"
    assert child_task["description"] == "Original description"
    assert child_task["priority"] == "high"
    assert child_task["tags"] == ["work", "recurring"]
    assert child_task["recurrence_rule"] == "FREQ=DAILY"
    # completed should be False
    assert child_task["completed"] is False


@pytest.mark.asyncio
async def test_non_recurring_task_no_next_instance(client):
    """Test that non-recurring tasks don't create next instance."""
    task_data = {"title": "One-time task"}
    create_response = await client.post("/api/tasks", json=task_data)
    task_id = create_response.json()["id"]

    # Complete the task
    await client.post(f"/api/tasks/{task_id}/complete")

    # Check that no child tasks were created
    list_response = await client.get("/api/tasks")
    tasks = list_response.json()["tasks"]
    child_tasks = [t for t in tasks if t.get("parent_task_id") == task_id]

    assert len(child_tasks) == 0, "Non-recurring task should not create next instance"
