"""Supabase client configuration.

Provide a singleton Supabase client for database operations.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from supabase import create_client

from src.utils.config import settings


@lru_cache(maxsize=1)
def get_supabase_client() -> Any:
    """Get configured Supabase client (singleton).

    Returns:
        Supabase Client instance configured with service key.

    Raises:
        ValueError: If SUPABASE_URL or SUPABASE_SERVICE_KEY is not set.
    """
    if not settings.SUPABASE_URL:
        raise ValueError("SUPABASE_URL environment variable is required")
    if not settings.SUPABASE_SERVICE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY environment variable is required")

    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)
