"""LLM client configuration (DEPRECATED).

This module is deprecated. Use ``src.utils.llm_factory`` instead.

Kept for backward compatibility only. All new code should import
``get_llm`` from ``src.utils.llm_factory``.
"""

from __future__ import annotations

import warnings

from langchain_core.language_models.chat_models import BaseChatModel

from src.utils.llm_factory import get_llm


def get_llm_client() -> BaseChatModel:
    """Get configured LLM client (DEPRECATED).

    Use ``get_llm()`` from ``src.utils.llm_factory`` instead.

    Returns:
        Chat model instance configured for the selected provider.
    """
    warnings.warn(
        "get_llm_client() is deprecated. Use get_llm() from "
        "src.utils.llm_factory instead.",
        DeprecationWarning,
        stacklevel=2,
    )
    return get_llm()
