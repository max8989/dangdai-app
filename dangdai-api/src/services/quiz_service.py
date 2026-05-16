"""Quiz business logic service.

Orchestrate quiz generation via LangGraph and format responses.

Story 4.15: 3-tier hybrid generation with per-tier timeouts:
- Tier 1 (algorithmic): 5s timeout — zero LLM calls, should complete in <200ms
- Tier 2 (single LLM):  120s timeout — one LLM call, 2-4s happy path
- Mixed: 120s timeout — combination of Tier 1 + Tier 2 questions
"""

from __future__ import annotations

import asyncio
import logging
import random
import uuid
from typing import Any

from pydantic import ValidationError
from starlette.requests import Request

from src.agent.graph import TIER_1_TYPES, graph
from src.api.schemas import (
    QuizGenerateCustomRequest,
    QuizGenerateCustomResponse,
    QuizGenerateMultiRequest,
    QuizGenerateMultiResponse,
    QuizGenerateRequest,
    QuizGenerateResponse,
)

# Chapter counts per book — mirrors dangdai-mobile/constants/chapters.ts.
# Used to expand a chapter_id range and skip non-existent lessons in the gaps
# (e.g. chapter_ids 216..300 do not exist between Book 2 and Book 3).
BOOK_CHAPTER_COUNTS: dict[int, int] = {1: 15, 2: 15, 3: 12, 4: 12}

# Cap on how many chapters a single multi-chapter quiz may span.
MAX_RANGE_CHAPTERS = 30

# Cap on the multi-chapter generation timeout regardless of fan-out width.
MULTI_TIMEOUT_CAP_SECONDS = 180

logger = logging.getLogger(__name__)

# Tier 1: algorithmic only — should complete in <200ms, 5s gives ample headroom
TIER_1_TIMEOUT_SECONDS = 5

# Tier 2: single LLM call (2-4s happy path) + 2 retries worst case
# Budget: ~4s generation + ~4s retry + ~4s retry = ~12s worst case, 120s cap
TIER_2_TIMEOUT_SECONDS = 120

# Default fallback (mixed type)
GENERATION_TIMEOUT_SECONDS = 120


class QuizService:
    """Service for quiz generation orchestration."""

    async def generate_quiz(
        self,
        request: QuizGenerateRequest,
        user_id: str,
        http_request: Request | None = None,
        question_count: int | None = None,
    ) -> QuizGenerateResponse:
        """Generate a quiz by invoking the LangGraph agent.

        Checks for client disconnection before invoking LangGraph to avoid
        wasting LLM API calls when the client has already navigated away.
        The http_request object is also passed into the graph state so that
        individual nodes can check disconnection before expensive operations.

        Args:
            request: Quiz generation request with chapter_id, book_id, exercise_type.
            user_id: Authenticated user's UUID.
            http_request: Optional FastAPI Request for disconnection detection.
                          When provided, checks is_disconnected() before invoking
                          LangGraph and passes it to graph nodes for mid-graph checks.

        Returns:
            QuizGenerateResponse with generated questions.

        Raises:
            asyncio.CancelledError: If client disconnects before or during generation.
            TimeoutError: If generation exceeds timeout.
            ValueError: If generation produces no valid questions.
        """
        import time

        quiz_id = str(uuid.uuid4())

        # Check for client disconnection before starting expensive LangGraph invocation
        if http_request and await http_request.is_disconnected():
            logger.info(
                "[QuizService] Client disconnected before graph start for chapter=%d user=%s",
                request.chapter_id,
                user_id,
            )
            raise asyncio.CancelledError("Client disconnected")

        # Determine generation tier and corresponding timeout
        exercise_type_str = request.exercise_type.value
        is_tier1 = exercise_type_str in TIER_1_TYPES
        timeout = TIER_1_TIMEOUT_SECONDS if is_tier1 else TIER_2_TIMEOUT_SECONDS
        tier_label = "tier1-algorithmic" if is_tier1 else "tier2-llm"

        # Prepare graph input state — include request for mid-graph disconnection checks
        graph_input: dict[str, Any] = {
            "chapter_id": request.chapter_id,
            "book_id": request.book_id,
            "exercise_type": exercise_type_str,
            "user_id": user_id,
        }
        if http_request is not None:
            graph_input["request"] = http_request
        if question_count is not None:
            graph_input["question_count"] = question_count

        logger.info(
            "[QuizService] Starting graph for quiz_id=%s chapter=%d type=%s tier=%s timeout=%ds",
            quiz_id,
            request.chapter_id,
            exercise_type_str,
            tier_label,
            timeout,
        )
        start = time.perf_counter()

        # Invoke graph with tier-appropriate timeout
        try:
            result = await asyncio.wait_for(
                graph.ainvoke(graph_input),  # type: ignore[call-overload, arg-type]
                timeout=timeout,
            )
        except asyncio.CancelledError:
            elapsed = time.perf_counter() - start
            logger.info(
                "[QuizService] Quiz generation cancelled by client disconnect "
                "(chapter=%d user=%s elapsed=%.1fs)",
                request.chapter_id,
                user_id,
                elapsed,
            )
            raise  # Let FastAPI handle it (closes connection silently)
        except TimeoutError:
            elapsed = time.perf_counter() - start
            logger.error(
                "[QuizService] TIMEOUT after %.1fs (limit=%ds tier=%s) for quiz_id=%s chapter=%d",
                elapsed,
                timeout,
                tier_label,
                quiz_id,
                request.chapter_id,
            )
            raise TimeoutError(
                f"Quiz generation exceeded {timeout}s time limit ({tier_label})"
            )

        elapsed = time.perf_counter() - start
        logger.info(
            "[QuizService] Graph completed in %.1fs for quiz_id=%s",
            elapsed,
            quiz_id,
        )

        # Extract results
        quiz_payload = result.get("quiz_payload", {})
        questions = quiz_payload.get("questions", [])
        validation_errors = result.get("validation_errors", [])
        retry_count = result.get("retry_count", 0)

        logger.info(
            "[QuizService] Result: %d questions, %d validation_errors, %d retries",
            len(questions),
            len(validation_errors),
            retry_count,
        )

        if validation_errors:
            logger.warning(
                "[QuizService] Validation errors: %s",
                validation_errors,
            )

        if not questions:
            error_detail = (
                "; ".join(validation_errors)
                if validation_errors
                else "No questions generated"
            )
            logger.error(
                "[QuizService] No questions for quiz_id=%s: %s",
                quiz_id,
                error_detail,
            )
            raise ValueError(f"Quiz generation failed: {error_detail}")

        # Enrich questions with question_id if missing
        for i, q in enumerate(questions):
            if not q.get("question_id"):
                q["question_id"] = f"q{i + 1}"

        # Validate questions against Pydantic schemas before building response
        try:
            response = QuizGenerateResponse(
                quiz_id=quiz_id,
                chapter_id=request.chapter_id,
                book_id=request.book_id,
                exercise_type=request.exercise_type.value,
                question_count=len(questions),
                questions=questions,
            )
        except ValidationError as e:
            logger.error(
                "[QuizService] Schema validation FAILED for quiz_id=%s: %d errors — %s",
                quiz_id,
                e.error_count(),
                e.errors(),
            )
            raise ValueError(
                f"Quiz generation produced invalid questions: {e.error_count()} "
                f"validation errors"
            ) from e

        logger.info(
            "[QuizService] Quiz ready: quiz_id=%s questions=%d elapsed=%.1fs",
            quiz_id,
            response.question_count,
            time.perf_counter() - start,
        )
        return response

    async def generate_multi_chapter_quiz(
        self,
        request: QuizGenerateMultiRequest,
        user_id: str,
        http_request: Request | None = None,
    ) -> QuizGenerateMultiResponse:
        """Generate a quiz spanning a range of chapters.

        Fans out the existing single-chapter graph in parallel — one invocation
        per (chapter_id, exercise_type) combination — then merges, shuffles
        and truncates the results to the requested question count.

        The persistence of the resulting attempt happens client-side
        (mobile `useQuizPersistence.saveQuizAttempt`).

        Args:
            request: Multi-chapter quiz request.
            user_id: Authenticated user UUID.
            http_request: Optional FastAPI Request for disconnection detection.

        Returns:
            QuizGenerateMultiResponse with the merged questions.

        Raises:
            ValueError: If the range is empty/invalid or no questions could be
                generated.
            asyncio.CancelledError: If the client disconnects before start.
            TimeoutError: If the parallel fan-out exceeds its budget.
        """
        import time

        quiz_id = str(uuid.uuid4())

        if request.chapter_id_start > request.chapter_id_end:
            raise ValueError(
                "chapter_id_start must be <= chapter_id_end "
                f"(got {request.chapter_id_start} > {request.chapter_id_end})"
            )

        chapter_ids = _expand_chapter_range(
            request.chapter_id_start, request.chapter_id_end
        )
        if not chapter_ids:
            raise ValueError(
                "Chapter range produced no valid chapters "
                f"({request.chapter_id_start}..{request.chapter_id_end})"
            )
        if len(chapter_ids) > MAX_RANGE_CHAPTERS:
            raise ValueError(
                f"Range spans {len(chapter_ids)} chapters; max is {MAX_RANGE_CHAPTERS}"
            )

        if http_request and await http_request.is_disconnected():
            logger.info(
                "[QuizService] Client disconnected before multi-chapter start "
                "(range=%d..%d user=%s)",
                request.chapter_id_start,
                request.chapter_id_end,
                user_id,
            )
            raise asyncio.CancelledError("Client disconnected")

        exercise_types = [t.value for t in request.exercise_types]
        combos = [(cid, etype) for cid in chapter_ids for etype in exercise_types]

        # If we have more combos than questions, sample combos uniformly to
        # bound LLM calls. Otherwise every combo runs.
        if len(combos) > request.question_count:
            sampled_combos = random.sample(combos, request.question_count)
        else:
            sampled_combos = combos

        # Distribute the question count across sampled combos.
        per_combo_counts = _distribute(request.question_count, len(sampled_combos))

        logger.info(
            "[QuizService] Multi-chapter generation starting: quiz_id=%s "
            "range=%d..%d chapters=%d types=%s combos=%d count=%d",
            quiz_id,
            request.chapter_id_start,
            request.chapter_id_end,
            len(chapter_ids),
            exercise_types,
            len(sampled_combos),
            request.question_count,
        )

        # Bound total time. Each Tier-2 invocation can take ~12s worst case,
        # so allow generous parallel budget capped at MULTI_TIMEOUT_CAP_SECONDS.
        timeout = min(
            MULTI_TIMEOUT_CAP_SECONDS,
            max(TIER_2_TIMEOUT_SECONDS, 30 * len(sampled_combos)),
        )

        async def _run_one(cid: int, etype: str) -> dict[str, Any]:
            graph_input: dict[str, Any] = {
                "chapter_id": cid,
                "book_id": cid // 100,
                "exercise_type": etype,
                "user_id": user_id,
            }
            if http_request is not None:
                graph_input["request"] = http_request
            return await graph.ainvoke(graph_input)  # type: ignore[arg-type]

        start = time.perf_counter()
        try:
            results = await asyncio.wait_for(
                asyncio.gather(
                    *[_run_one(cid, etype) for (cid, etype) in sampled_combos],
                    return_exceptions=True,
                ),
                timeout=timeout,
            )
        except TimeoutError:
            elapsed = time.perf_counter() - start
            logger.error(
                "[QuizService] Multi-chapter TIMEOUT after %.1fs (limit=%ds) "
                "quiz_id=%s",
                elapsed,
                timeout,
                quiz_id,
            )
            raise TimeoutError(
                f"Multi-chapter quiz generation exceeded {timeout}s time limit"
            )

        # Collect successful per-combo question lists, then sample per-combo.
        merged: list[Any] = []
        failed = 0
        for (cid, etype), result, take in zip(
            sampled_combos, results, per_combo_counts, strict=True
        ):
            if isinstance(result, BaseException):
                failed += 1
                logger.warning(
                    "[QuizService] Combo failed (chapter=%d type=%s): %s",
                    cid,
                    etype,
                    result,
                )
                continue
            payload = result.get("quiz_payload") or {}
            qs = list(payload.get("questions") or [])
            if not qs:
                continue
            random.shuffle(qs)
            merged.extend(qs[:take])

        if not merged:
            raise ValueError(
                "Multi-chapter quiz generation failed: no questions produced "
                f"({failed}/{len(sampled_combos)} combos errored)"
            )

        # If we collected fewer than requested (some combos returned less than
        # asked for), top up by re-sampling extras from the merged pool.
        if len(merged) < request.question_count:
            extras_needed = request.question_count - len(merged)
            pool: list[Any] = []
            for result in results:
                if isinstance(result, BaseException):
                    continue
                payload = result.get("quiz_payload") or {}
                pool.extend(payload.get("questions") or [])
            # Avoid duplicates already in merged
            seen_texts = {q.get("question_text") for q in merged}
            extras = [q for q in pool if q.get("question_text") not in seen_texts]
            random.shuffle(extras)
            merged.extend(extras[:extras_needed])

        random.shuffle(merged)
        merged = merged[: request.question_count]
        for i, q in enumerate(merged):
            q["question_id"] = f"q{i + 1}"

        try:
            response = QuizGenerateMultiResponse(
                quiz_id=quiz_id,
                chapter_id_start=request.chapter_id_start,
                chapter_id_end=request.chapter_id_end,
                chapter_ids=chapter_ids,
                exercise_types=exercise_types,
                question_count=len(merged),
                questions=merged,
            )
        except ValidationError as e:
            logger.error(
                "[QuizService] Multi-chapter schema validation FAILED "
                "quiz_id=%s: %d errors",
                quiz_id,
                e.error_count(),
            )
            raise ValueError(
                "Multi-chapter quiz produced invalid questions: "
                f"{e.error_count()} validation errors"
            ) from e

        elapsed = time.perf_counter() - start
        logger.info(
            "[QuizService] Multi-chapter quiz ready: quiz_id=%s questions=%d "
            "failed_combos=%d elapsed=%.1fs",
            quiz_id,
            response.question_count,
            failed,
            elapsed,
        )
        return response


    async def generate_custom_quiz(
        self,
        request: QuizGenerateCustomRequest,
        user_id: str,
        http_request: Request | None = None,
    ) -> QuizGenerateCustomResponse:
        """Generate a quiz from an explicit list of chapter IDs.

        Unlike `generate_multi_chapter_quiz` (range-based), this method takes a
        free-form list of `chapter_ids` and pairs each chapter with each
        requested exercise type. It then distributes the requested question
        count across those combos as evenly as possible, calls the standard
        graph in parallel with a per-combo diversity seed, dedupes the merged
        question pool by question_text, and returns one shuffled quiz.

        Diversity controls (the user-facing reason this endpoint exists):
        - Each combo invocation gets a unique nonce passed via the graph state
          so the Tier 2 prompt produces structurally different questions even
          when the same (chapter, type) is requested twice.
        - The caller may pass `avoid_question_texts` and the Tier 2 prompt
          lists them as "do not repeat".
        - Output is never written to `premade_exercises`.
        """
        import time

        quiz_id = str(uuid.uuid4())

        seed = (
            request.seed
            if request.seed is not None
            else random.randrange(1, 2**31 - 1)
        )
        rng = random.Random(seed)

        # Validate each chapter_id belongs to a known book/lesson.
        valid_chapter_ids: list[int] = []
        for cid in request.chapter_ids:
            book = cid // 100
            lesson = cid % 100
            max_chapter = BOOK_CHAPTER_COUNTS.get(book)
            if max_chapter is not None and 1 <= lesson <= max_chapter:
                valid_chapter_ids.append(cid)

        if not valid_chapter_ids:
            raise ValueError(
                "No valid chapter_ids in request "
                f"(received {request.chapter_ids}). Each must be book*100+lesson "
                f"with book in {sorted(BOOK_CHAPTER_COUNTS.keys())}."
            )

        # Dedupe + cap
        valid_chapter_ids = list(dict.fromkeys(valid_chapter_ids))
        if len(valid_chapter_ids) > MAX_RANGE_CHAPTERS:
            raise ValueError(
                f"Too many chapter_ids: {len(valid_chapter_ids)} > "
                f"{MAX_RANGE_CHAPTERS}"
            )

        if http_request and await http_request.is_disconnected():
            raise asyncio.CancelledError("Client disconnected")

        exercise_types = [t.value for t in request.exercise_types]

        # Build (chapter, type) combos. If there are more combos than
        # questions, sample combos so we don't spawn one LLM call per
        # combo just to discard most of the output.
        combos = [
            (cid, etype) for cid in valid_chapter_ids for etype in exercise_types
        ]
        if len(combos) > request.question_count:
            sampled_combos = rng.sample(combos, request.question_count)
        else:
            sampled_combos = list(combos)
        rng.shuffle(sampled_combos)

        per_combo_counts = _distribute(request.question_count, len(sampled_combos))

        logger.info(
            "[QuizService] Custom quiz starting: quiz_id=%s chapters=%d types=%s "
            "combos=%d count=%d seed=%d",
            quiz_id,
            len(valid_chapter_ids),
            exercise_types,
            len(sampled_combos),
            request.question_count,
            seed,
        )

        # Per-combo timeout scales with parallel fan-out, capped.
        timeout = min(
            MULTI_TIMEOUT_CAP_SECONDS,
            max(TIER_2_TIMEOUT_SECONDS, 30 * len(sampled_combos)),
        )

        async def _run_one(cid: int, etype: str, nonce: int) -> dict[str, Any]:
            graph_input: dict[str, Any] = {
                "chapter_id": cid,
                "book_id": cid // 100,
                "exercise_type": etype,
                "user_id": user_id,
                # New: diversity nonce + avoid list consumed by generate_quiz
                # node when present. Tier 1 generators currently ignore them.
                "diversity_seed": nonce,
                "avoid_question_texts": list(request.avoid_question_texts),
                "generation_temperature": request.temperature,
            }
            if http_request is not None:
                graph_input["request"] = http_request
            return await graph.ainvoke(graph_input)  # type: ignore[arg-type]

        start = time.perf_counter()
        try:
            results = await asyncio.wait_for(
                asyncio.gather(
                    *[
                        _run_one(cid, etype, rng.randrange(1, 2**31 - 1))
                        for (cid, etype) in sampled_combos
                    ],
                    return_exceptions=True,
                ),
                timeout=timeout,
            )
        except TimeoutError:
            elapsed = time.perf_counter() - start
            logger.error(
                "[QuizService] Custom quiz TIMEOUT after %.1fs (limit=%ds) "
                "quiz_id=%s",
                elapsed,
                timeout,
                quiz_id,
            )
            raise TimeoutError(
                f"Custom quiz generation exceeded {timeout}s time limit"
            )

        # Take per_combo_counts from each result, dedupe by question_text.
        merged: list[Any] = []
        seen_texts: set[str] = set(request.avoid_question_texts)
        failed = 0
        for (cid, etype), result, take in zip(
            sampled_combos, results, per_combo_counts, strict=True
        ):
            if isinstance(result, BaseException):
                failed += 1
                logger.warning(
                    "[QuizService] Custom combo failed (chapter=%d type=%s): %s",
                    cid,
                    etype,
                    result,
                )
                continue
            payload = result.get("quiz_payload") or {}
            qs = list(payload.get("questions") or [])
            if not qs:
                continue
            rng.shuffle(qs)
            taken = 0
            for q in qs:
                if taken >= take:
                    break
                qt = q.get("question_text", "")
                if qt and qt in seen_texts:
                    continue
                seen_texts.add(qt)
                merged.append(q)
                taken += 1

        if not merged:
            raise ValueError(
                "Custom quiz generation failed: no questions produced "
                f"({failed}/{len(sampled_combos)} combos errored)"
            )

        # Top up from leftovers if we're short due to dedupe drops.
        if len(merged) < request.question_count:
            leftover: list[Any] = []
            for result in results:
                if isinstance(result, BaseException):
                    continue
                payload = result.get("quiz_payload") or {}
                for q in payload.get("questions") or []:
                    qt = q.get("question_text", "")
                    if qt and qt not in seen_texts:
                        seen_texts.add(qt)
                        leftover.append(q)
            rng.shuffle(leftover)
            need = request.question_count - len(merged)
            merged.extend(leftover[:need])

        rng.shuffle(merged)
        merged = merged[: request.question_count]
        for i, q in enumerate(merged):
            q["question_id"] = f"q{i + 1}"

        try:
            response = QuizGenerateCustomResponse(
                quiz_id=quiz_id,
                chapter_ids=valid_chapter_ids,
                exercise_types=exercise_types,
                question_count=len(merged),
                seed=seed,
                questions=merged,
            )
        except ValidationError as e:
            logger.error(
                "[QuizService] Custom quiz schema validation FAILED "
                "quiz_id=%s: %d errors",
                quiz_id,
                e.error_count(),
            )
            raise ValueError(
                "Custom quiz produced invalid questions: "
                f"{e.error_count()} validation errors"
            ) from e

        elapsed = time.perf_counter() - start
        logger.info(
            "[QuizService] Custom quiz ready: quiz_id=%s questions=%d "
            "failed_combos=%d elapsed=%.1fs seed=%d",
            quiz_id,
            response.question_count,
            failed,
            elapsed,
            seed,
        )
        return response


def _expand_chapter_range(start: int, end: int) -> list[int]:
    """Return the ordered list of valid chapter_ids in [start, end].

    A chapter_id ``cid`` is valid iff ``cid % 100`` is between 1 and the
    chapter count for ``cid // 100`` (per BOOK_CHAPTER_COUNTS). Chapter ids
    that fall in the gap between books (e.g. 216..300) are skipped.
    """
    out: list[int] = []
    for cid in range(start, end + 1):
        book = cid // 100
        chapter = cid % 100
        max_chapter = BOOK_CHAPTER_COUNTS.get(book)
        if max_chapter is None:
            continue
        if 1 <= chapter <= max_chapter:
            out.append(cid)
    return out


def _distribute(total: int, slots: int) -> list[int]:
    """Distribute ``total`` items across ``slots`` as evenly as possible.

    Each slot gets at least ``total // slots``; the first ``total % slots``
    slots get one extra. Returns a list of length ``slots`` summing to
    ``total``. Caller guarantees ``slots >= 1``.
    """
    if slots <= 0:
        return []
    base = total // slots
    extra = total % slots
    return [base + 1 if i < extra else base for i in range(slots)]
