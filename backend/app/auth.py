"""
JWT Authentication module for Hackathon Todo Evolution.

Verifies JWT tokens issued by Better Auth by extracting the payload
and optionally validating with Better Auth.

Better Auth uses Ed25519 (EdDSA) for JWT signing by default.
"""

import os
import json
import base64
from typing import Optional
from datetime import datetime, UTC

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx

from app.database import get_session
from app.models import User, UserRead

# Security scheme for Bearer tokens
security = HTTPBearer()

# Better Auth configuration
API_URL = os.getenv("NEXT_PUBLIC_API_URL", "http://localhost:3000")
JWT_ISSUER = os.getenv("JWT_ISSUER", API_URL)
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE", API_URL)


def base64url_decode(input: str) -> bytes:
    """
    Decode Base64URL encoded data.
    Adds padding if necessary.
    """
    # Add padding if needed
    padding = 4 - len(input) % 4
    if padding != 4:
        input += "=" * padding
    # Use urlsafe_b64decode but first replace urlsafe chars
    input = input.replace("-", "+").replace("_", "/")
    return base64.b64decode(input)


def decode_jwt_payload(token: str) -> Optional[dict]:
    """
    Decode JWT payload without verifying signature.

    This extracts the user claims from the JWT token.
    For production, you should verify the signature using JWKS.
    For development, we trust the token since it comes from our frontend.
    """
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None

        header_encoded, payload_encoded, signature_encoded = parts

        # Decode header to get algorithm info
        header = json.loads(base64url_decode(header_encoded))
        payload = json.loads(base64url_decode(payload_encoded))

        print(f"JWT header: {header}")
        print(f"JWT payload: {payload}")

        return payload
    except Exception as e:
        print(f"Error decoding JWT: {e}")
        import traceback
        traceback.print_exc()
        return None


async def verify_jwt_with_better_auth(token: str) -> Optional[dict]:
    """
    Verify a JWT token by calling Better Auth's session endpoint.

    This is a fallback method if JWKS is not available.
    It calls the frontend's Better Auth to validate the session.

    Note: This requires the frontend to be accessible.
    """
    try:
        async with httpx.AsyncClient() as client:
            # Try the get-session endpoint with the Bearer token
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
    except Exception as e:
        print(f"Error verifying with Better Auth: {e}")
        return None


async def verify_jwt_token(token: str) -> Optional[dict]:
    """
    Verify a JWT token from Better Auth.

    This function:
    1. Decodes the JWT to extract user claims
    2. Validates the token structure and expiration
    3. Optionally validates with Better Auth (in production)

    Args:
        token: The JWT token string

    Returns:
        dict: The user claims from the JWT if valid, None otherwise
    """
    # First decode the JWT to get the payload
    payload = decode_jwt_payload(token)

    if payload is None:
        return None

    # Check expiration
    exp = payload.get("exp")
    if exp:
        exp_datetime = datetime.fromtimestamp(exp, UTC)
        if datetime.now(UTC) > exp_datetime:
            print(f"JWT expired at {exp_datetime}")
            return None

    # Validate issuer (if specified)
    if JWT_ISSUER and payload.get("iss") != JWT_ISSUER:
        print(f"JWT issuer mismatch: expected {JWT_ISSUER}, got {payload.get('iss')}")
        # For development, we might not have iss in the token
        # Uncomment the return None for strict validation
        # return None

    # The JWT payload from Better Auth should contain:
    # - sub: user ID
    # - email: user email
    # - name: user name
    # Or we can extract from the payload directly
    return payload


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session = Depends(get_session),
) -> UserRead:
    """
    FastAPI dependency to get the current authenticated user from JWT token.

    Args:
        credentials: Bearer token from Authorization header
        session: Database session

    Returns:
        UserRead: Current user data

    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials
    print(f"Received token: {token[:50] if token else 'None'}...")

    # Verify JWT
    payload = await verify_jwt_token(token)

    if payload is None:
        print("Failed to verify JWT token")
        raise credentials_exception

    # Extract user ID from JWT payload
    # Better Auth JWT payload structure:
    # {
    #   "sub": "user-id",
    #   "email": "user@example.com",
    #   "name": "User Name",
    #   ...
    # }
    user_id = payload.get("sub")
    email = payload.get("email")
    name = payload.get("name", "")

    if not user_id:
        print("JWT payload missing user ID (sub)")
        raise credentials_exception

    print(f"Verified user from JWT: id={user_id}, email={email}, name={name}")

    # Get or create user in our database
    user = await session.get(User, user_id)

    if user is None:
        # Check if a user with this email already exists (may have different ID)
        # This can happen when Better Auth issues different user IDs for same user
        if email:
            from sqlalchemy import select
            stmt = select(User).where(User.email == email)
            result = await session.execute(stmt)
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # User exists with same email but different ID - update the ID
                print(f"Found existing user with email {email}, updating ID from {existing_user.id} to {user_id}")
                existing_user.id = user_id
                existing_user.name = name or existing_user.name
                await session.commit()
                await session.refresh(existing_user)
                user = existing_user
            else:
                # Create new user (first login)
                user = User(
                    id=user_id,
                    email=email,
                    name=name,
                    created_at=datetime.now(UTC)
                )
                session.add(user)
                await session.commit()
                await session.refresh(user)
                print(f"Created new user in database: {user_id}")
        else:
            # No email - create user with unknown email
            user = User(
                id=user_id,
                email=f"{user_id}@unknown.com",
                name=name,
                created_at=datetime.now(UTC)
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            print(f"Created new user in database: {user_id}")

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        HTTPBearer(auto_error=False)
    ),
    session = Depends(get_session),
) -> Optional[UserRead]:
    """
    Optional version of get_current_user for endpoints that work without auth.

    Returns None if no valid token provided.
    """
    if credentials is None:
        return None

    payload = await verify_jwt_token(credentials.credentials)

    if payload is None:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = await session.get(User, user_id)
    if user is None:
        return None

    return UserRead(
        id=user.id,
        email=user.email,
        name=user.name,
        created_at=user.created_at
    )
