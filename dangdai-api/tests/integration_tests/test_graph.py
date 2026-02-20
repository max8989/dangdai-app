import os

import pytest

pytestmark = pytest.mark.anyio


def _has_real_env_var(key: str) -> bool:
    """Check if an env var is set to a real (non-placeholder) value."""
    val = os.getenv(key, "")
    return bool(val) and "your-" not in val and val != ""


@pytest.mark.langsmith
@pytest.mark.skipif(
    not _has_real_env_var("SUPABASE_URL") or not _has_real_env_var("LLM_API_KEY"),
    reason="Integration test requires real SUPABASE_URL and LLM_API_KEY env vars (not placeholders)",
)
async def test_quiz_generation_graph() -> None:
    """Integration test: invoke the full quiz generation graph."""
    from src.agent.graph import graph

    inputs = {
        "chapter_id": 101,
        "book_id": 1,
        "exercise_type": "vocabulary",
        "user_id": "test-user-id",
    }
    res = await graph.ainvoke(inputs)
    assert res is not None
    assert "quiz_payload" in res
