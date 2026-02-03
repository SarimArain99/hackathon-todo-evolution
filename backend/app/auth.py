"""
Session Cookie Authentication module for Hackathon Todo Evolution.

Validates Better Auth session cookies against the PostgreSQL database.
Better Auth stores session tokens in the `session` table with user linkage.

Session cookie format:
- Cookie name: todo_app_session_token (configurable prefix)
- Cookie value: session token (hash stored in database)
"""

import os
from typing import Optional
from datetime import datetime
from functools import lru_cache

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import asyncpg

from app.database import get_session
from app.models import User, UserRead
from app.logging_config import get_logger

logger = get_logger(__name__)

# Security scheme for Bearer tokens (kept for optional fallback)
security = HTTPBearer()

# Better Auth configuration
BETTER_AUTH_COOKIE_PREFIX = os.getenv("BETTER_AUTH_COOKIE_PREFIX", "todo_app")
# Better Auth uses format: {prefix}.{cookie_name}
SESSION_COOKIE_NAME = f"{BETTER_AUTH_COOKIE_PREFIX}.session_token"

# Better Auth database connection (shared with frontend)
BETTER_AUTH_DATABASE_URL = os.getenv(
    "BETTER_AUTH_DATABASE_URL",
    os.getenv("DATABASE_URL", "")
)

# Connection pool for Better Auth database
_better_auth_pool: Optional[asyncpg.Pool] = None


async def get_better_auth_pool() -> Optional[asyncpg.Pool]:
    """
    Get or create the PostgreSQL connection pool for Better Auth database.

    Returns None if DATABASE_URL is not configured.
    """
    global _better_auth_pool

    if not BETTER_AUTH_DATABASE_URL:
        logger.warning("better_auth_db_url_not configured")
        return None

    if _better_auth_pool is None:
        try:
            _better_auth_pool = await asyncpg.create_pool(
                BETTER_AUTH_DATABASE_URL,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )
            logger.info("better_auth_db_pool_created")
        except Exception as e:
            logger.error("better_auth_db_pool_failed", error=str(e))
            return None

    return _better_auth_pool


async def close_better_auth_pool():
    """Close the Better Auth database connection pool."""
    global _better_auth_pool

    if _better_auth_pool:
        await _better_auth_pool.close()
        _better_auth_pool = None
        logger.info("better_auth_db_pool_closed")


async def validate_session_token(token: str) -> Optional[dict]:
    """
    Validate a Better Auth session token against the PostgreSQL database.

    Better Auth cookie format: {session_token}.{signature}
    The cookie value contains the session token, NOT the session ID.
    We need to query by the `token` column first, then fall back to `id` column.

    This function:
    1. Removes the signature part (after the dot) if present
    2. Queries the `session` table by `token` column (primary lookup)
    3. Falls back to `id` column if not found
    4. Checks if the session has not expired
    5. Returns user information if valid

    Args:
        token: The session token from the cookie (format: token.signature)

    Returns:
        dict: User information (id, email, name) if valid, None otherwise
    """
    pool = await get_better_auth_pool()
    if pool is None:
        logger.warning("better_auth_db_unavailable")
        return None

    # Better Auth cookies are in format: {token}.{signature}
    # The cookie value contains the session token, NOT the session ID
    # We need to strip the signature part first
    session_token = token.split(".")[0] if "." in token else token

    try:
        async with pool.acquire() as conn:
            # First try by token column (this is what the cookie contains)
            row = await conn.fetchrow("""
                SELECT
                    s.id as session_id,
                    s.token,
                    s."userId" as user_id,
                    s."expiresAt" as expires_at,
                    u.email,
                    u.name
                FROM session s
                JOIN "user" u ON s."userId" = u.id
                WHERE s.token = $1
                    AND s."expiresAt" > NOW()
                LIMIT 1
            """, session_token)

            if row is None:
                # Fallback: try by id column (some versions might use this)
                row = await conn.fetchrow("""
                    SELECT
                        s.id as session_id,
                        s.token,
                        s."userId" as user_id,
                        s."expiresAt" as expires_at,
                        u.email,
                        u.name
                    FROM session s
                    JOIN "user" u ON s."userId" = u.id
                    WHERE s.id = $1
                        AND s."expiresAt" > NOW()
                    LIMIT 1
                """, session_token)

                if row is None:
                    logger.debug("session_not_found", session_token=session_token[:10] if len(session_token) > 10 else session_token)
                    return None

            logger.debug("session_validated", user_id=row["user_id"], session_id=row["session_id"])

            return {
                "user_id": row["user_id"],
                "email": row["email"],
                "name": row["name"],
                "session_id": row["session_id"],
            }

    except Exception as e:
        logger.error("session_validation_error", error=str(e))
        return None


async def get_session_token_from_request(request: Request) -> Optional[str]:
    """
    Extract the Better Auth session token from the request cookies.

    Args:
        request: The FastAPI Request object

    Returns:
        str: The session token if found, None otherwise
    """
    # Try to get the session cookie
    token = request.cookies.get(SESSION_COOKIE_NAME)

    if token:
        return token

    # Fallback: check for Authorization header (Bearer token)
    # This allows transitioning from JWT to session cookies
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header[7:]  # Remove "Bearer " prefix
        logger.debug("bearer_token_found")
        return token

    return None


async def get_current_user(
    request: Request,
    session = Depends(get_session),
) -> UserRead:
    """
    FastAPI dependency to get the current authenticated user from Better Auth session.

    This validates the session cookie against the Better Auth database.

    Args:
        request: The FastAPI Request object (contains cookies)
        session: Local database session for user records

    Returns:
        UserRead: Current user data

    Raises:
        HTTPException: 401 if session is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract session token from cookies or Authorization header
    token = await get_session_token_from_request(request)

    if not token:
        logger.debug("no_session_token")
        raise credentials_exception

    # Validate session token against Better Auth database
    session_data = await validate_session_token(token)

    if session_data is None:
        logger.debug("session_validation_failed")
        raise credentials_exception

    user_id = session_data.get("user_id")
    email = session_data.get("email")
    name = session_data.get("name", "")

    if not user_id:
        raise credentials_exception

    # Get or create user in our local database
    user = await session.get(User, user_id)

    if user is None:
        # Check if a user with this email already exists
        if email:
            from sqlalchemy import select
            stmt = select(User).where(User.email == email)
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # User exists with same email but different ID
                # Update the name if provided
                if name:
                    existing_user.name = name
                await session.commit()
                await session.refresh(existing_user)
                user = existing_user
            else:
                # Create new user (first login)
                user = User(
                    id=user_id,
                    email=email,
                    name=name,
                    createdAt=datetime.utcnow()
                )
                session.add(user)
                await session.commit()
                await session.refresh(user)
        else:
            # No email - create user with unknown email
            user = User(
                id=user_id,
                email=f"{user_id}@unknown.com",
                name=name,
                createdAt=datetime.utcnow()
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        createdAt=user.createdAt
    )


async def get_current_user_optional(
    request: Request,
    session = Depends(get_session),
) -> Optional[UserRead]:
    """
    Optional version of get_current_user for endpoints that work without auth.

    Returns None if no valid session provided.
    """
    token = await get_session_token_from_request(request)

    if not token:
        return None

    session_data = await validate_session_token(token)

    if session_data is None:
        return None

    user_id = session_data.get("user_id")
    if not user_id:
        return None

    user = await session.get(User, user_id)
    if user is None:
        return None

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        createdAt=user.createdAt
    )


# ============================================================================
# Legacy JWT Support (kept for backward compatibility during transition)
# ============================================================================

async def verify_jwt_with_better_auth(token: str) -> Optional[dict]:
    """
    Legacy: Verify a JWT token by calling Better Auth's session endpoint.

    This is a fallback method for transitioning from JWT to session cookies.
    """
    import httpx

    API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000")

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{API_URL}/api/auth/get-session",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )

            if response.status_code == 200:
                data = response.json()
                user = data.get("user") if isinstance(data, dict) else None
                if user and isinstance(user, dict):
                    return {
                        "user_id": user.get("id"),
                        "email": user.get("email"),
                        "name": user.get("name", ""),
                    }
            return None
    except Exception:
        return None
