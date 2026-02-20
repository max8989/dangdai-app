"""FastAPI dependencies.

Provide dependency injection for authentication and other services.
"""

from __future__ import annotations

from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.utils.config import settings

# HTTPBearer scheme extracts Bearer token from Authorization header
_bearer_scheme = HTTPBearer(auto_error=True)


async def verify_jwt_token(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict[str, Any]:
    """Verify the Supabase JWT token from the Authorization header.

    Args:
        credentials: Bearer token credentials extracted by HTTPBearer.

    Returns:
        Decoded JWT payload.

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing.
    """
    token = credentials.credentials

    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT verification not configured",
        )

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
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
