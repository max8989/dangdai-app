"""Live smoke test for /api/quizzes/generate-custom — in-process.

Runs the real QuizService against real Supabase + real OpenAI, no HTTP.
Calls generate_custom_quiz twice on the same input and reports overlap.
"""

import asyncio
import os
import time

from dotenv import load_dotenv

load_dotenv()

from src.api.schemas import ExerciseType, QuizGenerateCustomRequest  # noqa: E402
from src.services.quiz_service import QuizService  # noqa: E402

USER_ID = os.getenv("SMOKE_USER_ID", "09ea5eb5-80a5-45e4-ae66-a50145b74e8d")


async def one_call(label: str, request: QuizGenerateCustomRequest) -> list[str]:
    print(f"\n=== {label} ===")
    t0 = time.perf_counter()
    resp = await QuizService().generate_custom_quiz(request, user_id=USER_ID)
    elapsed = time.perf_counter() - t0
    print(f"seed={resp.seed} questions={resp.question_count} elapsed={elapsed:.1f}s")
    texts: list[str] = []
    for i, q in enumerate(resp.questions[:6]):
        text = (q.question_text or "").strip()
        ans = (q.correct_answer or "").strip()
        print(f"  Q{i+1} [{q.exercise_type}] {text[:90]}  →  {ans[:40]}")
        texts.append(text)
    return [q.question_text or "" for q in resp.questions]


async def main() -> None:
    req = QuizGenerateCustomRequest(
        chapter_ids=[101, 103],
        question_count=6,
        exercise_types=[ExerciseType.VOCABULARY, ExerciseType.GRAMMAR],
    )

    a = await one_call("Run A (fresh seed)", req)
    b = await one_call("Run B (fresh seed)", req)

    set_a, set_b = set(a), set(b)
    common = set_a & set_b
    print(
        f"\nOverlap: {len(common)} / {len(set_a)} A questions appear in B "
        f"({100 * len(common) / max(1, len(set_a)):.0f}%)"
    )
    if common:
        for t in list(common)[:3]:
            print(f"  duplicate: {t[:90]}")

    # Third call passing avoid_question_texts from A — should see ZERO of A's
    # texts in C.
    req_with_avoid = req.model_copy(update={"avoid_question_texts": a[:25]})
    c = await one_call("Run C (avoid_question_texts=A)", req_with_avoid)
    set_c = set(c)
    leak = set_a & set_c
    print(
        f"\nAvoid-list leak: {len(leak)} of A's texts reappear in C "
        f"(want 0)"
    )
    for t in list(leak)[:3]:
        print(f"  leaked: {t[:90]}")


if __name__ == "__main__":
    asyncio.run(main())
