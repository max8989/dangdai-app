"""Authentication service.

JWT verification is handled by FastAPI dependencies in
``src.api.dependencies`` (``verify_jwt_token`` and ``get_current_user``).

This module is intentionally empty. The dependency-injection approach is
preferred over a service class for authentication because it integrates
directly with FastAPI's Depends() system.
"""
