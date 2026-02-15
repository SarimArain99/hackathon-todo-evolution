"""
Database connection module for Hackathon Todo Evolution Backend.

Supports both Neon PostgreSQL (production) and SQLite (development).
"""

import os
from typing import AsyncGenerator
from urllib.parse import urlunparse, urlparse

from dotenv import load_dotenv
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncEngine, AsyncSession

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./todo.db")

# Convert to async URL if using SQLite
if DATABASE_URL.startswith("sqlite:///"):
    ASYNC_DATABASE_URL = DATABASE_URL.replace("sqlite:///", "sqlite+aiosqlite:///")
else:
    # PostgreSQL async connection
    # Remove sslmode parameter from connection string as asyncpg doesn't accept it
    ASYNC_DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    if "sslmode" in ASYNC_DATABASE_URL:
        parsed = urlparse(ASYNC_DATABASE_URL)
        # Remove sslmode from query params
        query_params = parsed.query.split("&")
        query_params = [p for p in query_params if not p.startswith("sslmode=")]
        new_query = "&".join(query_params)
        ASYNC_DATABASE_URL = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        ))

# Build engine arguments based on database type
# SQLite doesn't support connection pooling - only apply pool settings to PostgreSQL
is_postgres = ASYNC_DATABASE_URL.startswith("postgresql")
is_sqlite = ASYNC_DATABASE_URL.startswith("sqlite")

engine_kwargs = {
    "echo": os.getenv("DEBUG") == "true",
    "future": True,
}

# Pool settings only for PostgreSQL
if is_postgres:
    engine_kwargs.update({
        "pool_size": 20,
        "max_overflow": 30,
        "pool_pre_ping": True,  # Verify connections before use
        "pool_recycle": 3600,  # Recycle connections after 1 hour
    })

# SQLite-specific connect args
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}

# Async engine for FastAPI with connection pooling
async_engine: AsyncEngine = create_async_engine(
    ASYNC_DATABASE_URL,
    **engine_kwargs,
)

# Session factory
async_session_maker = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Sync engine for migrations/testing (lazy initialization)
# Note: This requires psycopg to be installed
_sync_engine = None

def get_sync_engine():
    """
    Get or create the sync engine (lazy initialization).

    Raises ImportError if psycopg is not installed.
    Install with: uv add psycopg[binary]
    """
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(
            DATABASE_URL.replace("postgresql://", "postgresql+psycopg://").replace(
                "sqlite+aiosqlite:///", "sqlite:///"
            ),
            echo=True if os.getenv("DEBUG") == "true" else False,
        )
    return _sync_engine

# For backwards compatibility, expose sync_engine as a function call
# Use: engine = get_sync_engine() instead of engine = sync_engine
def sync_engine():
    """Backwards compatibility wrapper."""
    return get_sync_engine()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for async database sessions.

    Usage:
        @app.get("/tasks")
        async def list_tasks(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session_maker() as session:
        yield session


def init_db() -> None:
    """Create database tables. Should be called on startup."""
    SQLModel.metadata.create_all(sync_engine)


async def init_async_db() -> None:
    """Async version of init_db. Use with async startup."""
    # Import models here to ensure they're registered with SQLModel metadata
    from app.models import (
        Task,
        User,
        Conversation,
        Message,
        Notification,
    )  # noqa: F401

    async with async_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db() -> None:
    """Close database connections. Should be called on shutdown."""
    await async_engine.dispose()
