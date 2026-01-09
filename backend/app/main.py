"""
FastAPI main application for Hackathon Todo Evolution.

Features:
- Health check endpoint
- CORS middleware for frontend
- JWT authentication (Better Auth tokens)
- Task CRUD endpoints
"""

import os
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import get_current_user, UserRead
from app.database import async_engine, init_async_db, close_db
from app.routes import tasks


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handle database connections."""
    # Startup
    await init_async_db()
    yield
    # Shutdown
    await close_db()


# Create FastAPI app
app = FastAPI(
    title="Hackathon Todo Evolution API",
    description="Backend API for the Todo application with JWT authentication",
    version="0.1.0",
    lifespan=lifespan,
)


# =============================================================================
# CORS Configuration
# =============================================================================

# Get allowed origins from environment or default to localhost
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Health Check Endpoint
# =============================================================================

@app.get("/health", tags=["health"])
async def health_check() -> dict[str, str]:
    """
    Health check endpoint for monitoring and load balancers.

    Returns 200 if the service is healthy.
    """
    return {
        "status": "healthy",
        "timestamp": "2025-01-08T00:00:00Z",
    }


@app.get("/health/with-db", tags=["health"])
async def health_check_with_db() -> dict[str, str]:
    """
    Health check with database connection verification.
    """
    try:
        from sqlalchemy import text

        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
        }


# =============================================================================
# Auth Endpoints (placeholder - Better Auth handles actual auth)
# =============================================================================

@app.get("/api/auth/me", response_model=UserRead, tags=["auth"])
async def get_me(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    """Get the currently authenticated user's profile."""
    return current_user


# =============================================================================
# Register Routers
# =============================================================================

app.include_router(tasks.router)


# =============================================================================
# Root Endpoint
# =============================================================================

@app.get("/", tags=["root"])
async def root() -> dict[str, str]:
    """Root endpoint with API information."""
    return {
        "message": "Hackathon Todo Evolution API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
