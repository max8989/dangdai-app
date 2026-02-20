import os

import pytest

pytestmark = pytest.mark.anyio


@pytest.mark.langsmith
@pytest.mark.skipif(
    not os.getenv("SUPABASE_URL") or not os.getenv("LLM_API_KEY"),
    reason="Integration test requires SUPABASE_URL and LLM_API_KEY env vars",
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
