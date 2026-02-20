"""LLM client configuration.

Provide the LLM client for quiz generation via LangChain.
"""

from __future__ import annotations

from functools import lru_cache

from langchain_anthropic import ChatAnthropic
from langchain_core.language_models.chat_models import BaseChatModel

from src.utils.config import settings


@lru_cache(maxsize=1)
def get_llm_client() -> BaseChatModel:
    """Get configured LLM client (singleton).

    Returns:
        ChatAnthropic instance configured with API key and model.

    Raises:
        ValueError: If LLM_API_KEY is not set.
    """
    if not settings.LLM_API_KEY:
        raise ValueError("LLM_API_KEY environment variable is required")

    return ChatAnthropic(
        model=settings.LLM_MODEL,
        api_key=settings.LLM_API_KEY,  # type: ignore[arg-type]
        max_tokens=4096,
        temperature=0.7,
    )
