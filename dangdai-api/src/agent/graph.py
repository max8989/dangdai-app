"""LangGraph quiz generation graph.

Define the quiz generation pipeline:
START -> retrieve_content -> query_weakness -> generate_quiz -> validate_quiz -> END
                                                                     | (if invalid)
                                                               generate_quiz (retry, max 2)
"""

from __future__ import annotations

from typing import Literal

from langgraph.graph import START, StateGraph

from src.agent.nodes import (
    MAX_RETRIES,
    generate_quiz,
    query_weakness,
    retrieve_content,
    validate_quiz,
)
from src.agent.state import QuizGenerationState


def _should_retry_or_end(
    state: QuizGenerationState,
) -> Literal["generate_quiz", "__end__"]:
    """Determine whether to retry generation or finish.

    Args:
        state: Current graph state.

    Returns:
        Next node name: "generate_quiz" for retry, END for success/max retries.
    """
    errors = state.get("validation_errors", [])
    retry_count = state.get("retry_count", 0)

    if errors and retry_count <= MAX_RETRIES:
        return "generate_quiz"
    return "__end__"


# Build the graph
builder = StateGraph(QuizGenerationState)

# Add nodes
builder.add_node("retrieve_content", retrieve_content)
builder.add_node("query_weakness", query_weakness)
builder.add_node("generate_quiz", generate_quiz)
builder.add_node("validate_quiz", validate_quiz)

# Define edges
builder.add_edge(START, "retrieve_content")
builder.add_edge("retrieve_content", "query_weakness")
builder.add_edge("query_weakness", "generate_quiz")
builder.add_edge("generate_quiz", "validate_quiz")
builder.add_conditional_edges("validate_quiz", _should_retry_or_end)

# Compile
graph = builder.compile(name="Quiz Generator")
