"""
Test configuration for FastAPI tests.

Sets up test environment before any imports happen.
"""

import os
import sys
from datetime import datetime

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

# Set test database URL BEFORE importing anything from the app
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["TEST_MODE"] = "true"  # Skip scheduler during tests

# Also need to make sure we don't load the parent .env file
# by changing the current directory to backend
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, os.path.dirname(backend_dir))

from app.main import app
from app.database import async_engine, get_session
from app.models import User, UserRead
from app import auth
from sqlmodel import SQLModel


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
            createdAt=datetime.utcnow()
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

    yield

    # Clean up - drop all tables
    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


# Dispose engine at end of test session to prevent hanging
@pytest.fixture(scope="session", autouse=True)
def dispose_engine_on_session_end():
    """Dispose the database engine after all tests to prevent hanging."""
    yield
    import asyncio
    asyncio.run(async_engine.dispose())


@pytest_asyncio.fixture
async def client(setup_database):
    """Create an async test client with mocked auth."""
    async def mock_get_session():
        async with AsyncSession(async_engine) as session:
            yield session

    async def mock_get_current_user():
        return UserRead(
            id="test-user-id",
            email="test@example.com",
            name="Test User",
            createdAt=datetime.utcnow()
        )

    app.dependency_overrides[get_session] = mock_get_session
    app.dependency_overrides[auth.get_current_user] = mock_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def different_user_client(setup_database):
    """Create a client for a different user."""
    async def mock_get_session():
        async with AsyncSession(async_engine) as session:
            yield session

    async def mock_get_current_user():
        return UserRead(
            id="different-user-id",
            email="different@example.com",
            name="Different User",
            createdAt=datetime.utcnow()
        )

    app.dependency_overrides[get_session] = mock_get_session
    app.dependency_overrides[auth.get_current_user] = mock_get_current_user

    async with AsyncClient(
        transport=ASGITransport(app=app, raise_app_exceptions=False),
        base_url="http://test"
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
