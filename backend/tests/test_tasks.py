"""
Tests for Task API endpoints.

Uses pytest-asyncio and httpx for testing FastAPI endpoints.
"""

import json
import os
from datetime import datetime, timezone

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Set test environment variable to use SQLite BEFORE importing the app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"

from app.main import app
# Better Auth uses Ed25519 (EdDSA) - no SECRET_KEY/ALGORITHM in auth.py
# Tests create mock JWT tokens directly
from app.database import async_engine
from app.models import User, Task
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession


@pytest_asyncio.fixture(scope="function")
async def setup_database():
    """Create test database tables and add a test user."""
    # Create tables
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Add a test user
    async with AsyncSession(async_engine) as session:
        user = User(
            id="test-user-id",
            email="test@example.com",
            name="Test User",
            password_hash="dummy_hash"
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    yield

    # Clean up - drop all tables
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def client(setup_database):
    """Create an async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def auth_headers():
    """Create mock JWT headers for testing."""
    # For testing, create a mock JWT payload without signature verification
    # The backend's decode_jwt_payload function will extract the user info
    import base64
    payload = {
        "sub": "test-user-id",
        "email": "test@example.com",
        "name": "Test User",
        "exp": datetime.now(timezone.utc).timestamp() + 3600,  # 1 hour from now
    }
    # Create a mock JWT (header.payload.signature)
    header_json = json.dumps({"alg": "HS256", "typ": "JWT"})
    payload_json = json.dumps(payload)

    # Base64URL encode
    def base64url_encode(data):
        return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')

    header_encoded = base64url_encode(header_json.encode())
    payload_encoded = base64url_encode(payload_json.encode())
    # Mock signature
    signature_encoded = base64url_encode(b'mock_signature')

    token = f"{header_encoded}.{payload_encoded}.{signature_encoded}"
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_health_check(client):
    """Test the health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_root_endpoint(client):
    """Test the root endpoint."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


@pytest.mark.asyncio
async def test_list_tasks_empty(client, auth_headers):
    """Test listing tasks when none exist."""
    response = await client.get("/api/tasks", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["tasks"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_create_task(client, auth_headers):
    """Test creating a new task."""
    task_data = {
        "title": "Test task",
        "description": "Test description",
        "priority": "high",
        "tags": ["test", "example"]
    }
    response = await client.post("/api/tasks", json=task_data, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Test task"
    assert data["priority"] == "high"
    assert data["tags"] == ["test", "example"]
    assert "id" in data


@pytest.mark.asyncio
async def test_create_task_requires_auth(client):
    """Test that creating a task requires authentication."""
    task_data = {"title": "Test task"}
    response = await client.post("/api/tasks", json=task_data)
    assert response.status_code == 401  # Unauthorized


@pytest.mark.asyncio
async def test_get_task_not_found(client, auth_headers):
    """Test getting a non-existent task."""
    response = await client.get("/api/tasks/999", headers=auth_headers)
    assert response.status_code == 404
