"""LangGraph quiz generation graph with 3-Tier Hybrid generation.

New pipeline (Story 4.15):

    START → route_by_tier
             │
             ├── Tier 1 (vocabulary, matching, fill_in_blank)
             │    └── algorithmic_generate → END
             │         LLM calls: 0.  Cost: $0.  Latency: <200ms.
             │
             └── Tier 2 (grammar, sentence_construction,
                          dialogue_completion, reading_comprehension)
                  └── retrieve_structured_content → query_weakness
                        → generate_quiz → validate_structure → END
                                              ↑         |
                                              └─(retry, max 2)─┘
                  LLM calls: 1.  Cost: ~$0.012.  Latency: 2-4s.

The evaluate_content node is deprecated and removed from graph edges
(kept in nodes.py for reference only — AC #9).
"""

from __future__ import annotations

from typing import Literal

from langgraph.graph import START, StateGraph

from src.agent.nodes import (
    MAX_RETRIES,
    algorithmic_generate,
    generate_quiz,
    query_weakness,
    retrieve_structured_content,
    validate_structure,
)
from src.agent.state import QuizGenerationState

# ---------------------------------------------------------------------------
# Tier 1 exercise types (algorithmic, zero LLM calls)
# ---------------------------------------------------------------------------

TIER_1_TYPES: frozenset[str] = frozenset({"vocabulary", "matching", "fill_in_blank"})

# ---------------------------------------------------------------------------
# Tier 2 exercise types (single LLM call, no evaluator)
# ---------------------------------------------------------------------------

TIER_2_TYPES: frozenset[str] = frozenset(
    {"grammar", "sentence_construction", "dialogue_completion", "reading_comprehension"}
)


# ---------------------------------------------------------------------------
# Graph routing functions
# ---------------------------------------------------------------------------


def _route_by_tier(
    state: QuizGenerationState,
) -> Literal["algorithmic_generate", "retrieve_structured_content"]:
    """Route to Tier 1 (algorithmic) or Tier 2 (LLM) based on exercise_type.

    Mixed type falls through to Tier 2 (retrieve_structured_content) since
    the LLM path also incorporates structured content and the mixed generation
    is handled within the generate_quiz node.

    Args:
        state: Current graph state (must have exercise_type set).

    Returns:
        Next node name.
    """
    exercise_type = state.get("exercise_type", "")
    if exercise_type in TIER_1_TYPES:
        return "algorithmic_generate"
    # Tier 2 and mixed both go through the LLM pipeline
    return "retrieve_structured_content"


def _after_structure_validation(
    state: QuizGenerationState,
) -> Literal["generate_quiz", "__end__"]:
    """Route after structural + content validation.

    If validation errors found and retries remain, retry generation.
    Otherwise, finish (success or max retries exceeded).

    The evaluate_content node is no longer in the routing path (AC #9).

    Args:
        state: Current graph state.

    Returns:
        Next node name.
    """
    errors = state.get("validation_errors", [])
    retry_count = state.get("retry_count", 0)

    if errors:
        if retry_count <= MAX_RETRIES:
            return "generate_quiz"
        return "__end__"
    return "__end__"


# ---------------------------------------------------------------------------
# Build the graph
# ---------------------------------------------------------------------------

builder = StateGraph(QuizGenerationState)

# Nodes
builder.add_node("algorithmic_generate", algorithmic_generate)
builder.add_node("retrieve_structured_content", retrieve_structured_content)
builder.add_node("query_weakness", query_weakness)
builder.add_node("generate_quiz", generate_quiz)
builder.add_node("validate_structure", validate_structure)

# Edges — tier routing as first conditional
builder.add_conditional_edges(START, _route_by_tier)

# Tier 1 path: algorithmic_generate → END (quiz_payload set directly)
builder.add_edge("algorithmic_generate", "__end__")

# Tier 2 path: retrieve → weakness → generate → validate → (retry or end)
builder.add_edge("retrieve_structured_content", "query_weakness")
builder.add_edge("query_weakness", "generate_quiz")
builder.add_edge("generate_quiz", "validate_structure")
builder.add_conditional_edges("validate_structure", _after_structure_validation)

# Compile
graph = builder.compile(name="Quiz Generator")
