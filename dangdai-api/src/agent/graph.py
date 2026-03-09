"""LangGraph quiz generation graph with Evaluator-Optimizer pattern.

Define the quiz generation pipeline:
START -> retrieve_content -> query_weakness -> generate_quiz
      -> validate_structure -> evaluate_content -> END
                                    |                  |
                              (structural errors)   (content issues)
                                    |                  |
                                    └──── generate_quiz (retry, max 2) ◄──┘
"""

from __future__ import annotations

from typing import Literal

from langgraph.graph import START, StateGraph

from src.agent.nodes import (
    MAX_RETRIES,
    evaluate_content,
    generate_quiz,
    query_weakness,
    retrieve_content,
    validate_structure,
)
from src.agent.state import QuizGenerationState


def _after_structure_validation(
    state: QuizGenerationState,
) -> Literal["evaluate_content", "generate_quiz", "__end__"]:
    """Route after structural validation.

    If structural errors found, retry generation directly (skip evaluator
    to avoid wasting an LLM call on structurally broken questions).
    If no errors, proceed to content evaluation.

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
    return "evaluate_content"


def _after_content_evaluation(
    state: QuizGenerationState,
) -> Literal["generate_quiz", "__end__"]:
    """Route after content evaluation.

    If content evaluation found issues and retries remain, retry generation
    with evaluator feedback. Otherwise, finish (success or max retries).

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
builder.add_node("validate_structure", validate_structure)
builder.add_node("evaluate_content", evaluate_content)

# Define edges
builder.add_edge(START, "retrieve_content")
builder.add_edge("retrieve_content", "query_weakness")
builder.add_edge("query_weakness", "generate_quiz")
builder.add_edge("generate_quiz", "validate_structure")
builder.add_conditional_edges("validate_structure", _after_structure_validation)
builder.add_conditional_edges("evaluate_content", _after_content_evaluation)

# Compile
graph = builder.compile(name="Quiz Generator")
