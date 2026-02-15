"""FastAPI dependencies.

This module provides dependency injection for authentication and other services.
"""


async def get_current_user():
    """Get the current authenticated user from JWT.

    Returns:
        User information from the JWT token.
    """
    pass


async def verify_jwt_token():
    """Verify the JWT token from the Authorization header.

    Returns:
        Decoded token payload.
    """
    pass
