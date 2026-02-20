"""Authentication service.

Handle Supabase JWT verification logic.
"""

from __future__ import annotations

from typing import Any

import jwt

from src.utils.config import settings


class AuthService:
    """Service for authentication and JWT verification."""

    @staticmethod
    def verify_token(token: str) -> dict[str, Any]:
        """Verify a Supabase JWT token.

        Args:
            token: The JWT token string.

        Returns:
            Decoded JWT payload.

        Raises:
            jwt.ExpiredSignatureError: If token has expired.
            jwt.InvalidTokenError: If token is invalid.
            ValueError: If JWT secret is not configured.
        """
        if not settings.SUPABASE_JWT_SECRET:
            raise ValueError("SUPABASE_JWT_SECRET is not configured")

        payload: dict[str, Any] = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )
        return payload

    @staticmethod
    def extract_user_id(payload: dict[str, Any]) -> str:
        """Extract user_id from JWT payload.

        Args:
            payload: Decoded JWT payload.

        Returns:
            The user_id (sub claim).

        Raises:
            ValueError: If user_id is not present.
        """
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise ValueError("Token does not contain a user identifier")
        return user_id
