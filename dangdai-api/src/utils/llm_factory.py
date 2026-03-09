"""LLM provider factory.

Provide configurable LLM client selection via environment variables.
Supports Azure OpenAI, OpenAI, and Anthropic providers.
"""

from __future__ import annotations

import logging
import os

from langchain_core.language_models.chat_models import BaseChatModel

logger = logging.getLogger(__name__)

# Default models per provider
_DEFAULT_AZURE_OPENAI_MODEL = "gpt-4o"
_DEFAULT_OPENAI_MODEL = "gpt-4o"
_DEFAULT_ANTHROPIC_MODEL = "claude-3-5-sonnet-20241022"

# Default parameters
_DEFAULT_TEMPERATURE = 0.7
_DEFAULT_MAX_TOKENS = 2048


def get_llm(
    temperature: float = _DEFAULT_TEMPERATURE,
    max_tokens: int = _DEFAULT_MAX_TOKENS,
    provider: str | None = None,
) -> BaseChatModel:
    """Get configured LLM client based on environment configuration.

    Selects provider based on LLM_PROVIDER env var (default: "azure_openai").
    Supported providers: "azure_openai", "openai", "anthropic".

    Args:
        temperature: Sampling temperature for generation.
        max_tokens: Maximum tokens in generated response.
        provider: Override the LLM_PROVIDER env var. If None, reads from env.

    Returns:
        Chat model instance configured for the selected provider.

    Raises:
        ValueError: If required credentials are missing or provider is unsupported.
    """
    resolved_provider: str = (
        provider if provider else os.getenv("LLM_PROVIDER", "azure_openai")
    )
    llm_provider = resolved_provider.lower()
    model_override = os.getenv("LLM_MODEL", "")

    if llm_provider == "azure_openai":
        return _create_azure_openai(
            temperature=temperature,
            max_tokens=max_tokens,
            model_override=model_override,
        )

    if llm_provider == "openai":
        return _create_openai(
            temperature=temperature,
            max_tokens=max_tokens,
            model_override=model_override,
        )

    if llm_provider == "anthropic":
        return _create_anthropic(
            temperature=temperature,
            max_tokens=max_tokens,
            model_override=model_override,
        )

    raise ValueError(f"Unsupported LLM_PROVIDER: {llm_provider}")


def _create_azure_openai(
    temperature: float,
    max_tokens: int,
    model_override: str,
) -> BaseChatModel:
    """Create Azure OpenAI chat model instance.

    Args:
        temperature: Sampling temperature.
        max_tokens: Maximum tokens.
        model_override: Model name override from LLM_MODEL env var.

    Returns:
        Configured AzureChatOpenAI instance.

    Raises:
        ValueError: If required Azure OpenAI env vars are missing.
    """
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

    missing: list[str] = []
    if not api_key:
        missing.append("AZURE_OPENAI_API_KEY")
    if not endpoint:
        missing.append("AZURE_OPENAI_ENDPOINT")
    if not deployment_name:
        missing.append("AZURE_OPENAI_DEPLOYMENT_NAME")

    if missing:
        raise ValueError(
            f"Missing required Azure OpenAI environment variables: {', '.join(missing)}"
        )

    model = model_override or _DEFAULT_AZURE_OPENAI_MODEL

    from langchain_openai import AzureChatOpenAI

    logger.info(
        "Creating Azure OpenAI client: deployment=%s, model=%s",
        deployment_name,
        model,
    )

    return AzureChatOpenAI(
        azure_deployment=deployment_name,
        api_version=api_version,
        azure_endpoint=endpoint,
        api_key=api_key,  # type: ignore[arg-type]
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,  # type: ignore[call-arg]
    )


def _create_openai(
    temperature: float,
    max_tokens: int,
    model_override: str,
) -> BaseChatModel:
    """Create OpenAI chat model instance.

    Args:
        temperature: Sampling temperature.
        max_tokens: Maximum tokens.
        model_override: Model name override from LLM_MODEL env var.

    Returns:
        Configured ChatOpenAI instance.

    Raises:
        ValueError: If OPENAI_API_KEY is missing.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("Missing required environment variable: OPENAI_API_KEY")

    model = model_override or _DEFAULT_OPENAI_MODEL

    from langchain_openai import ChatOpenAI

    logger.info("Creating OpenAI client: model=%s", model)

    return ChatOpenAI(
        model=model,
        api_key=api_key,  # type: ignore[arg-type]
        temperature=temperature,
        max_tokens=max_tokens,  # type: ignore[call-arg]
    )


def _create_anthropic(
    temperature: float,
    max_tokens: int,
    model_override: str,
) -> BaseChatModel:
    """Create Anthropic chat model instance.

    Args:
        temperature: Sampling temperature.
        max_tokens: Maximum tokens.
        model_override: Model name override from LLM_MODEL env var.

    Returns:
        Configured ChatAnthropic instance.

    Raises:
        ValueError: If ANTHROPIC_API_KEY is missing.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", "") or os.getenv("LLM_API_KEY", "")
    if not api_key:
        raise ValueError("Missing required environment variable: ANTHROPIC_API_KEY")

    model = model_override or _DEFAULT_ANTHROPIC_MODEL

    from langchain_anthropic import ChatAnthropic

    logger.info("Creating Anthropic client: model=%s", model)

    return ChatAnthropic(  # type: ignore[call-arg]
        model=model,
        api_key=api_key,  # type: ignore[arg-type]
        max_tokens=max_tokens,
        temperature=temperature,
    )
