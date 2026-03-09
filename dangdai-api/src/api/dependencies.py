"""FastAPI dependencies.

Provide dependency injection for authentication and other services.
"""

from __future__ import annotations

import logging
from functools import lru_cache
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from src.utils.config import settings

logger = logging.getLogger(__name__)

# HTTPBearer scheme extracts Bearer token from Authorization header
_bearer_scheme = HTTPBearer(auto_error=True)


@lru_cache(maxsize=1)
def _get_jwks_client() -> PyJWKClient | None:
    """Get a cached JWKS client for the Supabase project.

    Returns:
        PyJWKClient if SUPABASE_URL is configured, else None.
    """
    if not settings.SUPABASE_URL:
        return None
    jwks_url = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
    return PyJWKClient(jwks_url, cache_keys=True)


def _decode_with_jwks(token: str) -> dict[str, Any] | None:
    """Attempt to decode a JWT using the Supabase JWKS endpoint (ES256).

    Args:
        token: The raw JWT string.

    Returns:
        Decoded payload if successful, None if JWKS is unavailable or fails.
    """
    jwks_client = _get_jwks_client()
    if jwks_client is None:
        return None

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload: dict[str, Any] = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience="authenticated",
        )
        return payload
    except Exception:
        return None


def _decode_with_hs256(token: str) -> dict[str, Any] | None:
    """Attempt to decode a JWT using the legacy HS256 shared secret.

    Args:
        token: The raw JWT string.

    Returns:
        Decoded payload if successful, None if secret is not set or fails.
    """
    if not settings.SUPABASE_JWT_SECRET:
        return None

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except Exception:
        return None


async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """Verify the Supabase JWT token from the Authorization header.

    Supports both the new ECC (ES256) signing keys via JWKS and the legacy
    HS256 shared secret for backward compatibility.

    Args:
        credentials: Bearer token credentials extracted by HTTPBearer.

    Returns:
        Decoded JWT payload.

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing.
        HTTPException: 500 if no JWT verification method is configured.
    """
    token = credentials.credentials

    if not settings.SUPABASE_URL and not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT verification not configured",
        )

    # Try JWKS (ES256) first, then fall back to legacy HS256
    payload = _decode_with_jwks(token)
    if payload is not None:
        return payload

    payload = _decode_with_hs256(token)
    if payload is not None:
        return payload

    # Both methods failed — determine the specific error for a useful message
    try:
        jwt.decode(token, options={"verify_signature": False})
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        pass

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    payload: dict[str, Any] = Depends(verify_jwt_token),
) -> str:
    """Get the current authenticated user_id from a verified JWT.

    Args:
        payload: Decoded JWT payload from verify_jwt_token.

    Returns:
        The user_id (sub claim) from the JWT.

    Raises:
        HTTPException: 401 if user_id is not present in the token.
    """
    user_id: str | None = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: no user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id
