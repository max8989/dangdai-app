"""Integration tests for LLM provider switching.

These tests require real API credentials and are skipped in CI.
They verify that quiz generation works with both Azure OpenAI and OpenAI
providers, and that switching providers via env vars works without code changes.
"""

import os

import pytest

pytestmark = pytest.mark.anyio


def _has_azure_openai_credentials() -> bool:
    """Check if Azure OpenAI credentials are available."""
    required = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_DEPLOYMENT_NAME",
    ]
    return all(
        bool(os.getenv(key, "")) and "your-" not in os.getenv(key, "")
        for key in required
    )


def _has_openai_credentials() -> bool:
    """Check if OpenAI credentials are available."""
    key = os.getenv("OPENAI_API_KEY", "")
    return bool(key) and key != "sk-..."


@pytest.mark.skipif(
    not _has_azure_openai_credentials(),
    reason="Requires real Azure OpenAI credentials",
)
async def test_azure_openai_provider_creates_llm() -> None:
    """Test Azure OpenAI provider creates a functional LLM instance."""
    from langchain_openai import AzureChatOpenAI

    from src.utils.llm_factory import get_llm

    llm = get_llm(provider="azure_openai")
    assert isinstance(llm, AzureChatOpenAI)

    # Verify the LLM can process a simple request
    from langchain_core.messages import HumanMessage

    response = await llm.ainvoke([HumanMessage(content="Say 'hello' in one word.")])
    assert response.content is not None
    assert len(str(response.content)) > 0


@pytest.mark.skipif(
    not _has_openai_credentials(),
    reason="Requires real OpenAI API key",
)
async def test_openai_provider_creates_llm() -> None:
    """Test OpenAI provider creates a functional LLM instance."""
    from langchain_openai import ChatOpenAI

    from src.utils.llm_factory import get_llm

    llm = get_llm(provider="openai")
    assert isinstance(llm, ChatOpenAI)

    # Verify the LLM can process a simple request
    from langchain_core.messages import HumanMessage

    response = await llm.ainvoke([HumanMessage(content="Say 'hello' in one word.")])
    assert response.content is not None
    assert len(str(response.content)) > 0


@pytest.mark.skipif(
    not (_has_azure_openai_credentials() and _has_openai_credentials()),
    reason="Requires both Azure OpenAI and OpenAI credentials",
)
async def test_provider_switching_without_code_changes() -> None:
    """Test switching providers via parameter without code changes."""
    from langchain_core.messages import HumanMessage
    from langchain_openai import AzureChatOpenAI, ChatOpenAI

    from src.utils.llm_factory import get_llm

    # Generate with Azure OpenAI
    azure_llm = get_llm(provider="azure_openai")
    assert isinstance(azure_llm, AzureChatOpenAI)
    azure_response = await azure_llm.ainvoke(
        [HumanMessage(content="Say 'azure' in one word.")]
    )
    assert azure_response.content is not None

    # Switch to OpenAI (no code reload, just provider change)
    openai_llm = get_llm(provider="openai")
    assert isinstance(openai_llm, ChatOpenAI)
    openai_response = await openai_llm.ainvoke(
        [HumanMessage(content="Say 'openai' in one word.")]
    )
    assert openai_response.content is not None

    # Both succeeded
    assert len(str(azure_response.content)) > 0
    assert len(str(openai_response.content)) > 0
