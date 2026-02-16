"""
Redis-based rate limiting for FastAPI backend.

Implements token bucket rate limiting using Redis for both
IP-based and user-based limits.

Reference: https://slowapi.comstarlette/_/_/rate_limiter.html
"""

import os
import time
import logging
from typing import Optional
from fastapi import HTTPException, Request, Response
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.config import Config
from starlette.datastructures import State
from redis import asyncio
from redis.exceptions import RedisError, ConnectionError as RedisError

logger = logging.getLogger(__name__)

# =============================================================================
# Configuration
# =============================================================================

# Redis Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost")
MAX_REQUESTS = 1000  # Maximum requests per time window
TIME_WINDOW = 60 0  # 1 minute in seconds

# =============================================================================
# Rate Limiting Strategy
# =============================================================================

# Use both IP-based and user-based limits
# IP-based: Prevent abuse from single IP addresses
# User-based: Prevent legitimate users from making too many requests
# Separate windows: IP limits (per IP) and user limits (per user ID)

# =============================================================================
# Models
# =============================================================================

class RateLimitInfo(BaseModel):
    """Rate limit information for responses."""
    ip: str
    user_id: Optional[str]  # None if IP-based limit
    reset_time: float  # Unix timestamp when limit resets
    remaining: int  # Remaining requests in window
    window: int  # Window size in seconds

class RateLimitResponse(BaseModel):
    """Rate limit response sent to clients."""
    success: bool
    limit: int  # Requests allowed in window
    remaining: int  # Remaining requests in window
    reset_time: float  # Unix timestamp when limit resets
    window: int  # Window size in seconds
    retry_after: float  # Seconds until client can retry

# =============================================================================
# Redis Client
# =============================================================================

class RedisClient:
    """Async Redis client with connection pooling."""

    def __init__(self):
        """Initialize Redis client with connection pooling."""
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost")
        self.max_connections = 10  # Maximum concurrent connections
        self.connection_timeout = 5  # Seconds
        self.pool = None

    async def connect(self):
        """Establish Redis connection and create connection pool."""
        if self.pool is None:
            from redis import asyncio
            from redis.asyncio.connection import ConnectionPool
            from redis.exceptions import RedisError

            self.pool = ConnectionPool(
                connection_string=self.redis_url,
                max_connections=self.max_connections,
                socket_keepalive=True,
                socket_connect_timeout=self.connection_timeout,
                decode_responses=False
            )

            await self.pool.initialize()
            logger.info(f"Connected to Redis at {self.redis_url}")
            return self.pool

    async def close(self):
        """Close Redis connection pool."""
        if self.pool:
            await self.pool.close()
            await self.pool.wait_closed()
            logger.info("Closed Redis connection pool")
            self.pool = None

    async def get_rate_limit_info(
        self,
        key: str,
        user_id: Optional[str],
        ip: Optional[str] = None
    ) -> RateLimitInfo:
        """Get rate limit info for a key (IP or user)."""
        current_time = time.time()

        # Check IP-based limit first
        if user_id is None:
            pipe_key = f"rate_limit:ip:{ip}"
        else:
            pipe_key = f"rate_limit:user:{user_id}"

        try:
            limit_info = await self.pool.get(pipe_key)
            if limit_info:
                # Parse as: "limit:remaining:window"
                remaining, window = limit_info.split(b":")
                remaining = int(remaining)
                window = int(window)
                reset_time = float(limit_info.get(b"reset_time", time.time()))
                return RateLimitInfo(
                    ip=ip,
                    user_id=user_id,
                    reset_time=reset_time,
                    remaining=remaining,
                    window=window
                )
        except Exception as e:
            logger.error(f"Redis error getting rate limit: {e}")
            # Return defaults on error
            return RateLimitInfo(
                ip=ip,
                user_id=user_id,
                remaining=MAX_REQUESTS,
                window=TIME_WINDOW,
                reset_time=0.0
                )

    async def increment_rate_limit(
        self,
        key: str,
        user_id: Optional[str] = None,
        ip: Optional[str] = None
    ) -> bool:
        """Increment rate limit counter for a key (IP or user)."""
        current_time = time.time()

        # Check IP-based limit first
        if user_id is None:
            pipe_key = f"rate_limit:ip:{ip}"
        else:
            pipe_key = f"rate_limit:user:{user_id}"

        try:
            new_limit = await self.pool.incrbyfloat(pipe_key, 1.0)
            window = int(await self.pool.get(pipe_key + b":window") or TIME_WINDOW
            logger.info(f"Rate limit incremented: {key} -> {window} requests")
            return True
        except Exception as e:
            logger.error(f"Redis error incrementing rate limit: {e}")
            return False

    async def reset_rate_limit(
        self,
        key: str,
        user_id: Optional[str] = None,
        ip: Optional[str] = None
    ) -> bool:
        """Reset rate limit counter for a key (IP or user)."""
        current_time = time.time()

        # Check IP-based limit first
        if user_id is None:
            pipe_key = f"rate_limit:ip:{ip}"
        else:
            pipe_key = f"rate_limit:user:{user_id}"

        try:
            await self.pool.set(pipe_key, int(time.time()))
            logger.info(f"Rate limit reset: {key} at {current_time}")
            return True
        except Exception as e:
            logger.error(f"Redis error resetting rate limit: {e}")
            return False

    async def check_rate_limit(
        self,
        key: str,
        user_id: Optional[str] = None,
        ip: Optional[str] = None
    ) -> RateLimitInfo:
        """Check if request should be allowed based on rate limit info."""
        info = await self.get_rate_limit_info(key, user_id, ip)
        return RateLimitInfo(
            success=info.remaining > 0,
            limit=info.remaining,
            window=info.window,
            reset_time=info.reset_time,
        )

    async def cleanup_expired_limits(self):
        """Remove expired rate limit entries from Redis."""
        current_time = time.time()
        pattern = "rate_limit:*"  # Match both IP and user limits
        cursor = 0

        async with self.pool.client() as client:
            while cursor > 0:
                keys = await client.scan_iter(match=pattern, count=100)
                for key in keys:
                    # Check if expired (no activity in TIME_WINDOW)
                    last_activity = float(await client.get(f"{key}:activity"))
                    if current_time - last_activity > TIME_WINDOW:
                        await client.delete(key)
                        cursor += 1
                        logger.debug(f"Cleaned expired rate limit: {key}")

        logger.info(f"Cleaned {cursor} expired rate limit entries")


# =============================================================================
# Rate Limiter Middleware Factory
# =============================================================================

def get_rate_limiter(user_id: Optional[str] = None) -> Limiter:
        """
    Create a rate limiter instance for incoming requests.

        Uses slowapi with Redis backend for distributed rate limiting.
        """
        redis_url = os.getenv("REDIS_URL", "redis://localhost")

        def key_func(request: Request) -> str:
            """Generate rate limit key based on user_id or IP address."""
            if user_id:
                return f"rate_limit:user:{user_id}"
            return f"rate_limit:ip:{get_remote_address(request)}"

        return Limiter(
            key_func=key_func,
            storage_uri=redis_url,
            prefix="rate_limit:",
            default_limits=[f"{MAX_REQUESTS}/{TIME_WINDOW}"],
        )


def _rate_limit_exceeded_handler(request: Request, exception: Exception):
    """Handle rate limit exceeded exceptions."""
    logger.warning(f"Rate limit exceeded for {request.client.host} by {request.url} from {get_remote_address(request)}")
    raise RateLimitExceeded(
        detail="Rate limit exceeded. Please try again later.",
        )


async def init_rate_limits():
    """Initialize rate limits for development environment."""
    if os.getenv("TESTING") == "true":
        logger.info("Running in testing mode - rate limiting disabled")
        return

    redis_url = os.getenv("REDIS_URL", "redis://localhost")

    try:
        from redis import asyncio as aioredis
        redis_client = aioredis.from_url(redis_url)
        await redis_client.ping()
        logger.info(f"Connected to Redis at {redis_url}")
        logger.info(f"Rate limiting configured: {MAX_REQUESTS} requests per {TIME_WINDOW} seconds")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")

    logger.info("Rate limiting ready!")
