"""LLM client configuration.

Provide the LLM client for quiz generation via LangChain.
"""

from __future__ import annotations

from functools import lru_cache

from langchain_core.language_models.chat_models import BaseChatModel

from src.utils.config import settings

# Default models per provider
_DEFAULT_OPENAI_MODEL = "gpt-4.1"
_DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"


@lru_cache(maxsize=1)
def get_llm_client() -> BaseChatModel:
    """Get configured LLM client (singleton).

    Selects provider based on LLM_PROVIDER setting (default: "openai").
    Supported providers: "openai", "anthropic".

    Returns:
        Chat model instance configured with API key and model.

    Raises:
        ValueError: If LLM_API_KEY is not set or provider is unsupported.
    """
    if not settings.LLM_API_KEY:
        raise ValueError("LLM_API_KEY environment variable is required")

    provider = settings.LLM_PROVIDER.lower()

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        model = settings.LLM_MODEL or _DEFAULT_OPENAI_MODEL
        return ChatOpenAI(
            model=model,
            api_key=settings.LLM_API_KEY,  # type: ignore[arg-type]
            max_tokens=4096,
            temperature=0.7,
        )

    if provider == "anthropic":
        from langchain_anthropic import ChatAnthropic

        model = settings.LLM_MODEL or _DEFAULT_ANTHROPIC_MODEL
        return ChatAnthropic(  # type: ignore[call-arg]
            model=model,
            api_key=settings.LLM_API_KEY,  # type: ignore[arg-type]
            max_tokens=4096,
            temperature=0.7,
        )

    raise ValueError(
        f"Unsupported LLM_PROVIDER: {provider}. Use 'openai' or 'anthropic'."
    )
