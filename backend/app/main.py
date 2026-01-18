"""
FastAPI main application for Hackathon Todo Evolution.

Features:
- Health check endpoint
- CORS middleware for frontend
- JWT authentication (Better Auth tokens)
- Task CRUD endpoints
- Rate limiting for API protection
- Structured logging
- CSP headers for XSS protection
- API versioning
"""

import os
import uuid
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.base import ASGIApp

from app.auth import get_current_user, UserRead
from app.database import async_engine, init_async_db, close_db
from app.logging_config import get_logger
from app.routes import tasks, chat


# =============================================================================
# Structured Logging
# =============================================================================

logger = get_logger(__name__)


# =============================================================================
# Rate Limiter
# =============================================================================

limiter = Limiter(key_func=get_remote_address)
app_state = {"rate_limit_error": "Rate limit exceeded. Please try again later."}


# =============================================================================
# Middleware: API Versioning + CSP Headers + Request ID
# =============================================================================

class SecurityHeadersMiddleware:
    """Middleware to add security headers including CSP."""

    def __init__(self, app: ASGIApp):
        self.app = app

    async def __call__(self, scope: dict, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Create request ID
        request_id = str(uuid.uuid4())

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                # Build security headers
                headers = dict(message.get("headers", []))

                # API Version header
                headers[b"api-version"] = b"0.1.0"

                # Content Security Policy for XSS protection
                # Default to same-origin for scripts, allow inline styles for development
                csp_directives = [
                    "default-src 'self'",
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  # unsafe-inline needed for Vite HMR in dev
                    "style-src 'self' 'unsafe-inline'",
                    "img-src 'self' data: https:",
                    "font-src 'self' data:",
                    "connect-src 'self' http://localhost:* http://127.0.0.1:* https:",
                    "frame-ancestors 'none'",
                    "form-action 'self'",
                ]
                headers[b"content-security-policy"] = "; ".join(csp_directives).encode()

                # Other security headers
                headers[b"x-content-type-options"] = b"nosniff"
                headers[b"x-frame-options"] = b"DENY"
                headers[b"x-xss-protection"] = b"1; mode=block"
                headers[b"referrer-policy"] = b"strict-origin-when-cross-origin"
                headers[b"permissions-policy"] = b"geolocation=(), microphone=(), camera=()"

                # Request ID header
                headers[b"x-request-id"] = request_id.encode()

                message = {**message, "headers": [(k, v) for k, v in headers.items()]}

            await send(message)

        await self.app(scope, receive, send_wrapper)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handle database connections."""
    logger.info("application_startup")
    # Startup
    await init_async_db()
    yield
    # Shutdown
    await close_db()
    logger.info("application_shutdown")


# Create FastAPI app
app = FastAPI(
    title="Hackathon Todo Evolution API",
    description="Backend API for the Todo application with JWT authentication",
    version="0.1.0",
    lifespan=lifespan,
    state=app_state,
)

# Add custom middleware for security headers and API versioning
app.add_middleware(SecurityHeadersMiddleware)

# Register rate limit exception handler
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# =============================================================================
# CORS Configuration
# =============================================================================

# Get allowed origins from environment or default to localhost
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Hugging Face Spaces proxy URL (for development/testing)
hf_proxy_url = os.getenv("HF_PROXY_URL", "")

# List of allowed origins including Vercel deployment and local development
allowed_origins = [
    frontend_url,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add your Vercel frontend URL here
    # "https://your-app.vercel.app",
]

# Add Hugging Face proxy URL if configured
if hf_proxy_url:
    allowed_origins.append(hf_proxy_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Request-ID",
        "Accept",
        "Origin",
        "Access-Control-Request-Method",
        "Access-Control-Request-Headers",
    ],
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
    from datetime import datetime
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "0.1.0",
    }


@app.get("/health/with-db", tags=["health"])
async def health_check_with_db() -> dict[str, str | int]:
    """
    Health check with database connection verification.
    """
    import time
    from sqlalchemy import text

    try:
        start_time = time.time()
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_time = (time.time() - start_time) * 1000
        return {
            "status": "healthy",
            "database": "connected",
            "database_response_time_ms": round(db_time, 2),
            "version": "0.1.0",
        }
    except Exception as e:
        logger.error("health_check_database_failed", error=str(e))
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e),
            "version": "0.1.0",
        }


# =============================================================================
# Auth Endpoints (placeholder - Better Auth handles actual auth)
# =============================================================================

@app.get("/api/auth/me", response_model=UserRead, tags=["auth"])
async def get_me(current_user: UserRead = Depends(get_current_user)) -> UserRead:
    """Get the currently authenticated user's profile."""
    logger.info("get_user_profile", user_id=current_user.id)
    return current_user


# =============================================================================
# Register Routers
# =============================================================================

app.include_router(tasks.router)
app.include_router(chat.router)


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

    # Use PORT from environment (Hugging Face Spaces uses 7860)
    port = int(os.getenv("PORT", 8000))

    logger.info("starting_server", port=port, environment=os.getenv("ENVIRONMENT", "development"))

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=port,
        reload=False,  # Disable reload in production (Docker)
    )
