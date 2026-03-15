"""LangGraph graph nodes.

Implement nodes for the quiz generation graph:
- retrieve_structured_content: Structured content retrieval (primary) with RAG fallback
- retrieve_content: Legacy RAG-only retrieval node (retained, not in graph)
- query_weakness: Weakness profile node
- generate_quiz: Quiz generation via LLM
- validate_structure: Rule-based structural validation with grammar coverage check
- evaluate_content: LLM-based content quality evaluation node
"""

from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any

from langchain_core.messages import HumanMessage, SystemMessage

from src.agent.generators import (
    FillInBlankGenerator,
    MatchingGenerator,
    VocabularyGenerator,
)
from src.agent.prompts import (
    CONTENT_EVALUATION_PROMPT,
    CONTENT_EVALUATION_SYSTEM_PROMPT,
    EXERCISE_TYPE_INSTRUCTIONS,
    QUIZ_GENERATION_PROMPT,
    SYSTEM_PROMPT,
)
from src.agent.state import QuizGenerationState
from src.repositories.chapter_repo import ChapterRepository
from src.repositories.content_repo import ContentRepository
from src.services.content_service import ContentService
from src.services.rag_service import RagService
from src.services.weakness_service import WeaknessService
from src.utils.llm_factory import get_llm

logger = logging.getLogger(__name__)

# Maximum number of validation/regeneration retries
MAX_RETRIES = 2


async def retrieve_content(state: QuizGenerationState) -> dict[str, Any]:
    """Retrieve chapter content via RAG service with fallback strategy.

    Checks for client disconnection before executing the RAG database query
    to avoid wasting resources when the client has already navigated away.

    Args:
        state: Current graph state with chapter_id, book_id, exercise_type.

    Returns:
        State update with retrieved_content.

    Raises:
        asyncio.CancelledError: If client disconnects before the database query.
    """
    import time

    start = time.perf_counter()
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]

    logger.info(
        "[Node:retrieve_content] START book=%d chapter=%d type=%s",
        book_id,
        chapter_id,
        exercise_type,
    )

    # Check for client disconnection before the RAG database query
    request = state.get("request")
    if request and await request.is_disconnected():
        logger.info("[Node:retrieve_content] Client disconnected, aborting RAG query")
        raise asyncio.CancelledError("Client disconnected")

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    rag_service = RagService()

    if exercise_type == "mixed":
        # Get available types and retrieve content for each
        chapter_repo = ChapterRepository()
        available_types = chapter_repo.get_available_exercise_types(book_id, lesson)
        if not available_types:
            available_types = ["vocabulary", "grammar", "fill_in_blank"]
        chunks = rag_service.retrieve_mixed_content(book_id, lesson, available_types)
    else:
        chunks = rag_service.retrieve_content(book_id, lesson, exercise_type)

    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "[Node:retrieve_content] DONE %d chunks in %.0fms for book=%d, lesson=%d, type=%s",
        len(chunks),
        elapsed,
        book_id,
        lesson,
        exercise_type,
    )

    return {"retrieved_content": chunks}


async def retrieve_structured_content(
    state: QuizGenerationState,
) -> dict[str, Any]:
    """Retrieve structured chapter content from vocabulary, grammar, dialogues tables.

    Replaces RAG-only retrieval as the primary content source for quiz
    generation. Structured content guarantees accurate curriculum data.
    Falls back to RAG-only retrieval if structured content tables are empty.

    Checks for client disconnection before executing database queries.

    Args:
        state: Current graph state with chapter_id, book_id, exercise_type.

    Returns:
        State update with structured_content, grammar_points_list,
        and retrieved_content (for backward compat with generate_quiz).

    Raises:
        asyncio.CancelledError: If client disconnects before the database query.
    """
    import time

    start = time.perf_counter()
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]

    logger.info(
        "[Node:retrieve_structured_content] START book=%d chapter=%d type=%s",
        book_id,
        chapter_id,
        exercise_type,
    )

    # Check for client disconnection before database queries
    request = state.get("request")
    if request and await request.is_disconnected():
        logger.info("[Node:retrieve_structured_content] Client disconnected, aborting")
        raise asyncio.CancelledError("Client disconnected")

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    content_service = ContentService()
    # Wrap synchronous Supabase I/O to avoid blocking the event loop
    content = await asyncio.to_thread(
        content_service.retrieve_chapter_content, book_id, lesson, exercise_type
    )

    vocabulary = content.get("vocabulary", [])
    grammar_points = content.get("grammar_points", [])
    dialogues = content.get("dialogues", [])

    # Fall back to RAG-only if structured tables are empty
    if not vocabulary and not grammar_points:
        logger.warning(
            "[Node:retrieve_structured_content] No structured content for "
            "book=%d lesson=%d, falling back to RAG",
            book_id,
            lesson,
        )
        rag_service = RagService()
        if exercise_type == "mixed":
            chapter_repo = ChapterRepository()
            available_types = chapter_repo.get_available_exercise_types(book_id, lesson)
            if not available_types:
                available_types = ["vocabulary", "grammar", "fill_in_blank"]
            chunks = rag_service.retrieve_mixed_content(
                book_id, lesson, available_types
            )
        else:
            chunks = rag_service.retrieve_content(book_id, lesson, exercise_type)

        elapsed = (time.perf_counter() - start) * 1000
        logger.info(
            "[Node:retrieve_structured_content] FALLBACK to RAG: %d chunks in %.0fms",
            len(chunks),
            elapsed,
        )
        return {
            "retrieved_content": chunks,
            "structured_content": {},
            "grammar_points_list": [],
            "generation_tier": "tier2",
        }

    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "[Node:retrieve_structured_content] DONE %d vocab, %d grammar, "
        "%d dialogues in %.0fms",
        len(vocabulary),
        len(grammar_points),
        len(dialogues),
        elapsed,
    )

    return {
        "structured_content": content,
        "grammar_points_list": grammar_points,
        "retrieved_content": content.get("rag_chunks", []),
        "generation_tier": "tier2",
    }


async def query_weakness(state: QuizGenerationState) -> dict[str, Any]:
    """Query user weakness profile for adaptive quiz generation.

    Checks for client disconnection before executing the database query
    to avoid wasting resources when the client has already navigated away.

    Args:
        state: Current graph state with user_id.

    Returns:
        State update with weakness_profile.

    Raises:
        asyncio.CancelledError: If client disconnects before the database query.
    """
    user_id = state.get("user_id", "")

    # Check for client disconnection before the weakness profile database query
    request = state.get("request")
    if request and await request.is_disconnected():
        logger.info(
            "[Node:query_weakness] Client disconnected, aborting weakness profile query"
        )
        raise asyncio.CancelledError("Client disconnected")

    weakness_service = WeaknessService()
    profile = weakness_service.get_weakness_profile(user_id)

    logger.info("Weakness profile for user %s: %s", user_id, profile)

    return {"weakness_profile": profile}


async def algorithmic_generate(state: QuizGenerationState) -> dict[str, Any]:
    """Generate quiz questions algorithmically (Tier 1) — zero LLM calls.

    Dispatches to the appropriate Tier 1 generator based on exercise_type:
    - vocabulary    → VocabularyGenerator
    - matching      → MatchingGenerator
    - fill_in_blank → FillInBlankGenerator

    Runs structural validation inline (no grammar coverage check for Tier 1
    since data comes directly from the database).

    Checks for client disconnection before database queries.

    Args:
        state: Current graph state with chapter_id, book_id, exercise_type,
               structured_content, weakness_profile.

    Returns:
        State update with quiz_payload (Tier 1 sets payload directly).

    Raises:
        asyncio.CancelledError: If client disconnects before database queries.
    """
    import time

    start = time.perf_counter()
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]
    weakness_profile = state.get("weakness_profile", {})

    logger.info(
        "[Node:algorithmic_generate] START type=%s book=%d chapter=%d",
        exercise_type,
        book_id,
        chapter_id,
    )

    # Check for client disconnection before DB queries
    request = state.get("request")
    if request and await request.is_disconnected():
        logger.info("[Node:algorithmic_generate] Client disconnected, aborting")
        raise asyncio.CancelledError("Client disconnected")

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    # Use structured content already loaded (by retrieve_structured_content)
    # or fetch fresh if not present (direct Tier 1 path without prior node)
    structured_content = state.get("structured_content", {})
    vocabulary: list[dict[str, Any]] = structured_content.get("vocabulary", [])
    grammar_points: list[dict[str, Any]] = structured_content.get("grammar_points", [])

    # If structured content wasn't pre-loaded, fetch it now
    if not vocabulary and not grammar_points:
        content_service = ContentService()
        content = await asyncio.to_thread(
            content_service.retrieve_chapter_content, book_id, lesson, exercise_type
        )
        vocabulary = content.get("vocabulary", [])
        grammar_points = content.get("grammar_points", [])
        structured_content = content

    # Dispatch to generator
    questions: list[dict[str, Any]] = []
    if exercise_type == "vocabulary":
        # Fetch distractor pool: current chapter + up to 2 past chapters.
        # get_vocabulary_for_cumulative returns vocab for lesson 1..up_to_lesson_id.
        # We only want lesson-2..lesson, so we filter afterwards.
        distractor_pool: list[dict[str, Any]] = vocabulary
        if lesson > 1:
            repo = ContentRepository()
            cumulative = await asyncio.to_thread(
                repo.get_vocabulary_for_cumulative, book_id, lesson
            )
            # Filter to current + 2 past lessons only
            min_lesson = max(1, lesson - 2)
            distractor_pool = [
                v for v in cumulative if v.get("lesson_id", lesson) >= min_lesson
            ] or vocabulary
        gen = VocabularyGenerator()
        questions = gen.generate(
            vocabulary, weakness_profile, book_id, lesson, distractor_pool
        )
    elif exercise_type == "matching":
        gen_m = MatchingGenerator()
        questions = gen_m.generate(vocabulary, weakness_profile, book_id, lesson)
    elif exercise_type == "fill_in_blank":
        gen_f = FillInBlankGenerator()
        questions = gen_f.generate(
            grammar_points, vocabulary, weakness_profile, book_id, lesson
        )
    else:
        logger.warning(
            "[Node:algorithmic_generate] Unknown Tier 1 type '%s', returning empty",
            exercise_type,
        )

    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "[Node:algorithmic_generate] DONE %d questions in %.0fms",
        len(questions),
        elapsed,
    )

    if not questions:
        return {
            "questions": [],
            "generation_tier": "tier1",
            "validation_errors": [
                f"Algorithmic generation produced no questions for type={exercise_type}"
            ],
            "retry_count": 1,
            "quiz_payload": {},
        }

    return {
        "questions": questions,
        "generation_tier": "tier1",
        "validation_errors": [],
        "retry_count": 0,
        "quiz_payload": {"questions": questions},
        "structured_content": structured_content,
    }


async def generate_quiz(state: QuizGenerationState) -> dict[str, Any]:
    """Generate quiz questions using LLM with structured output.

    Checks for client disconnection before making the LLM call to avoid
    wasting API costs when the client has already navigated away.

    Args:
        state: Current graph state with retrieved_content, exercise_type,
               weakness_profile.

    Returns:
        State update with questions list.

    Raises:
        asyncio.CancelledError: If client disconnects before the LLM call.
    """
    import time

    start = time.perf_counter()
    book_id = state["book_id"]
    chapter_id = state["chapter_id"]
    exercise_type = state["exercise_type"]
    retrieved_content = state.get("retrieved_content", [])
    weakness_profile = state.get("weakness_profile", {})

    logger.info(
        "[Node:generate_quiz] START type=%s chunks=%d retry=%d",
        exercise_type,
        len(retrieved_content),
        state.get("retry_count", 0),
    )

    _, lesson = ChapterRepository.parse_chapter_id(chapter_id)

    # Prepare structured content for the prompt
    structured_content = state.get("structured_content", {})
    structured_vocabulary = _format_structured_vocabulary(
        structured_content.get("vocabulary", [])
    )
    structured_grammar_points = _format_structured_grammar_points(
        structured_content.get("grammar_points", [])
    )
    structured_dialogues = _format_structured_dialogues(
        structured_content.get("dialogues", [])
    )

    # Prepare supplementary RAG content
    chapter_content = _format_chapter_content(retrieved_content)

    # Get exercise-type-specific instructions, biased toward weak areas (AC #2)
    if exercise_type == "mixed":
        weak_types: list[str] = weakness_profile.get("weak_exercise_types", [])
        # Select types biased toward weaknesses
        weakness_service = WeaknessService()
        all_mixed_types = list(EXERCISE_TYPE_INSTRUCTIONS.keys())
        selected_types = weakness_service.select_mixed_exercise_types(
            weakness_profile, all_mixed_types, count=4
        )
        if not selected_types:
            selected_types = ["vocabulary", "grammar", "fill_in_blank", "matching"]
        exercise_instructions = "\n\n".join(
            f"### {etype.upper()} Questions:\n{EXERCISE_TYPE_INSTRUCTIONS[etype]}"
            for etype in selected_types
            if etype in EXERCISE_TYPE_INSTRUCTIONS
        )
    else:
        weak_types = weakness_profile.get("weak_exercise_types", [])
        exercise_instructions = EXERCISE_TYPE_INSTRUCTIONS.get(
            exercise_type,
            EXERCISE_TYPE_INSTRUCTIONS["vocabulary"],
        )

    # Build weakness context
    weakness_context = ""
    if weak_types:
        weakness_context = (
            f"## Student Weakness Profile\n"
            f"The student struggles with: {', '.join(weak_types)}.\n"
            f"Bias question difficulty toward these weak areas when possible."
        )

    # Determine question count
    question_count = 12 if exercise_type != "reading_comprehension" else 5

    # Build output schema hint
    output_schema = _get_output_schema_hint(exercise_type)

    # Format the generation prompt
    prompt_text = QUIZ_GENERATION_PROMPT.format(
        question_count=question_count,
        exercise_type=exercise_type,
        book_id=book_id,
        lesson=lesson,
        exercise_type_instructions=exercise_instructions,
        structured_vocabulary=structured_vocabulary,
        structured_grammar_points=structured_grammar_points,
        structured_dialogues=structured_dialogues,
        chapter_content=chapter_content,
        weakness_context=weakness_context,
        output_schema=output_schema,
    )

    # Append retry feedback for self-correction on retry (Story 4.15: uses
    # validation_errors from validate_structure — evaluator_feedback removed per AC #9)
    retry_feedback = ""
    validation_errors_for_retry = state.get("validation_errors", [])
    if validation_errors_for_retry and state.get("retry_count", 0) > 0:
        retry_feedback = "\n".join(validation_errors_for_retry)

    if retry_feedback:
        prompt_text += (
            "\n\n## CRITICAL: Previous Attempt Failed Validation\n"
            "The following issues were found in your previous generation. "
            "You MUST fix ALL of these issues in this attempt:\n\n"
            f"{retry_feedback}\n\n"
            "Pay special attention to:\n"
            "- Use ONLY Traditional Chinese characters (繁體字) — NEVER Simplified\n"
            "- Pinyin MUST use tone diacritics (nǐ, xué) — NEVER tone numbers\n"
            "- question_text MUST be in English — NEVER in Chinese\n"
        )

    # Check for client disconnection before the expensive LLM call
    request = state.get("request")
    if request and await request.is_disconnected():
        logger.info("[Node:generate_quiz] Client disconnected, aborting LLM call")
        raise asyncio.CancelledError("Client disconnected")

    # Call LLM asynchronously
    llm = get_llm()
    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=prompt_text),
    ]

    try:
        llm_start = time.perf_counter()
        logger.info("[Node:generate_quiz] Calling LLM...")
        response = await llm.ainvoke(messages)
        llm_elapsed = (time.perf_counter() - llm_start) * 1000
        logger.info("[Node:generate_quiz] LLM responded in %.0fms", llm_elapsed)

        # Log token usage if available
        usage = getattr(response, "usage_metadata", None)
        if usage:
            logger.info(
                "[Node:generate_quiz] Token usage: input=%s output=%s total=%s",
                usage.get("input_tokens", "?"),
                usage.get("output_tokens", "?"),
                usage.get("total_tokens", "?"),
            )

        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        # Parse JSON from response
        questions = _parse_questions_json(content)

        elapsed = (time.perf_counter() - start) * 1000
        logger.info(
            "[Node:generate_quiz] DONE %d questions in %.0fms (LLM=%.0fms)",
            len(questions),
            elapsed,
            llm_elapsed,
        )
        return {"questions": questions}

    except asyncio.CancelledError:
        raise  # Do NOT swallow — let cancellation propagate
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        logger.error(
            "[Node:generate_quiz] FAILED after %.0fms: %s: %s",
            elapsed,
            type(e).__name__,
            e,
        )
        return {"questions": [], "validation_errors": [f"LLM generation failed: {e}"]}


# ---------------------------------------------------------------------------
# Deterministic content quality checks (Tier 2 validation — AC #6)
# ---------------------------------------------------------------------------

# Known Simplified → Traditional mapping (common violations by LLMs)
# Covers the most frequently confused characters in Chinese language learning content.
_SIMPLIFIED_TO_TRADITIONAL: dict[str, str] = {
    # ── Verbs & common words ──
    "学": "學",
    "习": "習",
    "说": "說",
    "话": "話",
    "语": "語",
    "见": "見",
    "让": "讓",
    "请": "請",
    "进": "進",
    "远": "遠",
    "运": "運",
    "过": "過",
    "还": "還",
    "写": "寫",
    "读": "讀",
    "认": "認",
    "识": "識",
    "听": "聽",
    "爱": "愛",
    "来": "來",
    "给": "給",
    "发": "發",
    "从": "從",
    "为": "為",
    "带": "帶",
    "别": "別",
    "办": "辦",
    "变": "變",
    "帮": "幫",
    "报": "報",
    "边": "邊",
    "称": "稱",
    "传": "傳",
    "错": "錯",
    "担": "擔",
    "当": "當",
    "动": "動",
    "断": "斷",
    "对": "對",
    "尔": "爾",
    "费": "費",
    "丰": "豐",
    "负": "負",
    "干": "幹",
    "顾": "顧",
    "观": "觀",
    "汉": "漢",
    "号": "號",
    "华": "華",
    "换": "換",
    "画": "畫",
    "获": "獲",
    "击": "擊",
    "极": "極",
    "继": "繼",
    "际": "際",
    "价": "價",
    "检": "檢",
    "简": "簡",
    "将": "將",
    "较": "較",
    "节": "節",
    "结": "結",
    "经": "經",
    "举": "舉",
    "据": "據",
    "决": "決",
    "军": "軍",
    "开": "開",
    "课": "課",
    "块": "塊",
    "类": "類",
    "离": "離",
    "联": "聯",
    "两": "兩",
    "临": "臨",
    "领": "領",
    "乱": "亂",
    "论": "論",
    "买": "買",
    "卖": "賣",
    "满": "滿",
    "没": "沒",
    "们": "們",
    "梦": "夢",
    "难": "難",
    "脑": "腦",
    "内": "內",
    "农": "農",
    "欧": "歐",
    "盘": "盤",
    "篇": "篇",
    "强": "強",
    "桥": "橋",
    "亲": "親",
    "区": "區",
    "权": "權",
    "确": "確",
    "热": "熱",
    "软": "軟",
    "设": "設",
    "声": "聲",
    "师": "師",
    "实": "實",
    "势": "勢",
    "书": "書",
    "属": "屬",
    "数": "數",
    "随": "隨",
    "岁": "歲",
    "台": "臺",
    "态": "態",
    "题": "題",
    "条": "條",
    "铁": "鐵",
    "头": "頭",
    "图": "圖",
    "团": "團",
    "万": "萬",
    "网": "網",
    "问": "問",
    "务": "務",
    "现": "現",
    "线": "線",
    "乡": "鄉",
    "响": "響",
    "向": "嚮",
    "协": "協",
    "兴": "興",
    "须": "須",
    "选": "選",
    "样": "樣",
    "药": "藥",
    "业": "業",
    "义": "義",
    "艺": "藝",
    "阴": "陰",
    "应": "應",
    "拥": "擁",
    "用": "用",
    "优": "優",
    "邮": "郵",
    "鱼": "魚",
    "员": "員",
    "院": "院",
    "乐": "樂",
    "贬": "貶",
    "证": "證",
    "只": "隻",
    "质": "質",
    "终": "終",
    "众": "眾",
    "组": "組",
    "总": "總",
    "钟": "鐘",
    # ── Nouns / things ──
    "国": "國",
    "个": "個",
    "场": "場",
    "车": "車",
    "东": "東",
    "风": "風",
    "间": "間",
    "关": "關",
    "机": "機",
    "级": "級",
    "门": "門",
    "马": "馬",
    "鸟": "鳥",
    "钱": "錢",
    "时": "時",
    "云": "雲",
    "长": "長",
    "点": "點",
    "电": "電",
    "飞": "飛",
    "龙": "龍",
    "这": "這",
    "会": "會",
    "几": "幾",
}
_SIMPLIFIED_CHARS: frozenset[str] = frozenset(_SIMPLIFIED_TO_TRADITIONAL.keys())

# Regex patterns for deterministic checks
_TONE_NUMBER_PATTERN = re.compile(r"[a-züā-ǖA-Z][1-5]", re.IGNORECASE)
_CJK_PATTERN = re.compile(r"[\u4e00-\u9fff]")


def _check_simplified_chinese(text: str) -> list[str]:
    """Detect Simplified Chinese characters in text.

    Args:
        text: Text to check.

    Returns:
        List of issue strings (empty if no violations).
    """
    issues: list[str] = []
    for char in text:
        if char in _SIMPLIFIED_CHARS:
            trad = _SIMPLIFIED_TO_TRADITIONAL[char]
            issues.append(f"Simplified '{char}' found — should be Traditional '{trad}'")
    return issues


def _check_pinyin_format(text: str) -> list[str]:
    """Detect tone number patterns in pinyin text (e.g., ni3, xue2).

    Args:
        text: Text to check.

    Returns:
        List of issue strings (empty if no violations).
    """
    matches = _TONE_NUMBER_PATTERN.findall(text)
    if matches:
        return [f"Tone numbers detected: {', '.join(matches)} — must use diacritics"]
    return []


def _check_question_language(question_text: str) -> list[str]:
    """Detect if question_text is written primarily in Chinese (should be English).

    Allows question_text to reference Chinese characters inline
    (e.g., "What does 學 mean?") — these are valid English question texts.
    Flags only when the question itself is written in Chinese (i.e., CJK
    characters make up the majority of meaningful characters).

    Args:
        question_text: The question_text field to check.

    Returns:
        List of issue strings (empty if no violations).
    """
    if not question_text:
        return []

    cjk_chars = [c for c in question_text if "\u4e00" <= c <= "\u9fff"]
    # Count alphabetic (Latin) characters as "English" signal
    latin_chars = [
        c for c in question_text if c.isalpha() and not ("\u4e00" <= c <= "\u9fff")
    ]

    # If CJK chars outnumber Latin chars, the question is written in Chinese
    if len(cjk_chars) > len(latin_chars):
        return ["question_text appears to be written in Chinese — must be in English"]
    return []


def _check_curriculum_alignment(
    questions: list[dict[str, Any]], vocab_set: set[str]
) -> list[str]:
    """Verify Chinese text in questions exists in the chapter's vocabulary.

    Only checks short single-word values (≤4 chars) to avoid false positives
    on full sentences or compound phrases not in the vocab list.

    Args:
        questions: List of question dicts to validate.
        vocab_set: Set of Traditional Chinese strings for the chapter.

    Returns:
        List of issue strings (empty if no violations).
    """
    issues: list[str] = []
    for q in questions:
        for field in ["character", "correct_answer"]:
            value = q.get(field, "")
            if value and any("\u4e00" <= c <= "\u9fff" for c in value):
                if len(value) <= 4 and value not in vocab_set:
                    qid = q.get("question_id", "?")
                    issues.append(
                        f"Question {qid}: '{value}' not in chapter vocabulary"
                    )
    return issues


def _run_deterministic_content_checks(
    questions: list[dict[str, Any]],
    vocab_set: set[str],
) -> list[str]:
    """Run all 4 deterministic content quality checks on generated questions.

    Checks:
    1. No Simplified Chinese characters in Chinese text fields
    2. No tone-number pinyin (e.g., ni3 → must be nǐ)
    3. question_text must be in English (no CJK)
    4. Curriculum alignment: Chinese single-words must be in chapter vocab

    Args:
        questions: List of question dicts to validate.
        vocab_set: Set of Traditional Chinese strings for curriculum check.

    Returns:
        Aggregated list of issue strings across all questions.
    """
    all_issues: list[str] = []

    chinese_fields = [
        "character",
        "pinyin",
        "sentence",
        "sentence_with_blanks",
        "passage",
        "correct_answer",
        "options",
        "left_items",
        "right_items",
        "scrambled_words",
        "word_bank",
    ]

    for q in questions:
        qid = q.get("question_id", "?")

        # Check question_text is in English (no CJK)
        qt = q.get("question_text", "")
        for issue in _check_question_language(qt):
            all_issues.append(f"[{qid}] {issue}")

        # Check pinyin field specifically
        pinyin_val = q.get("pinyin", "")
        if pinyin_val:
            for issue in _check_pinyin_format(pinyin_val):
                all_issues.append(f"[{qid}] pinyin: {issue}")

        # Check all Chinese text fields for Simplified chars
        for field in chinese_fields:
            val = q.get(field)
            if val is None:
                continue
            values_to_check: list[str] = []
            if isinstance(val, str):
                values_to_check = [val]
            elif isinstance(val, list):
                values_to_check = [str(v) for v in val if v]

            for text in values_to_check:
                for issue in _check_simplified_chinese(text):
                    all_issues.append(f"[{qid}] {field}: {issue}")

        # Check dialogue bubbles
        bubbles = q.get("dialogue_bubbles", [])
        if isinstance(bubbles, list):
            for bubble in bubbles:
                if isinstance(bubble, dict):
                    bubble_text = bubble.get("text", "")
                    for issue in _check_simplified_chinese(bubble_text):
                        all_issues.append(f"[{qid}] dialogue_bubbles.text: {issue}")

    # Curriculum alignment check
    if vocab_set:
        for issue in _check_curriculum_alignment(questions, vocab_set):
            all_issues.append(issue)

    return all_issues


async def validate_structure(state: QuizGenerationState) -> dict[str, Any]:
    """Validate generated quiz questions for structural and content correctness.

    Performs rule-based validation (no LLM call):
    - Correct answers exist
    - Options are distinct
    - No duplicate questions
    - Required fields present
    - Deterministic content quality checks (Tier 2 only):
      * No Simplified Chinese characters
      * No tone-number pinyin
      * question_text in English
      * Curriculum alignment (vocab set membership)
    - Grammar coverage: at least min(4, total_grammar_points) covered

    Questions that fail structural checks are dropped. Only triggers a retry
    if zero valid questions remain or content/grammar checks fail.

    The evaluate_content LLM node is NOT called (deprecated by this story).

    Declared async (Story 4.15 review fix) so the now-heavier regex validation
    work does not block the event loop thread.

    Args:
        state: Current graph state with questions.

    Returns:
        State update with valid questions, validation_errors, retry_count,
        and quiz_payload (set on success).
    """
    questions = state.get("questions", [])
    retry_count = state.get("retry_count", 0)
    generation_tier = state.get("generation_tier", "tier2")
    errors: list[str] = []
    valid_questions: list[dict[str, Any]] = []

    logger.info(
        "[Node:validate_structure] START questions=%d retry=%d tier=%s",
        len(questions),
        retry_count,
        generation_tier,
    )

    if not questions:
        errors.append("No questions were generated")
        logger.warning("[Node:validate_structure] No questions to validate")
        return {
            "validation_errors": errors,
            "retry_count": retry_count + 1,
        }

    seen_texts: set[str] = set()

    for i, q in enumerate(questions):
        qid = q.get("question_id", f"q{i + 1}")
        question_errors: list[str] = []

        # Check required base fields
        for field in ["question_text", "correct_answer", "exercise_type"]:
            if not q.get(field):
                question_errors.append(f"{qid}: missing required field '{field}'")

        # Check for duplicate question text
        qtext = q.get("question_text", "")
        if qtext in seen_texts:
            question_errors.append(f"{qid}: duplicate question text")
        seen_texts.add(qtext)

        # Check options are distinct (for types that have options)
        options = q.get("options", [])
        if options and len(options) != len(set(options)):
            question_errors.append(f"{qid}: duplicate options found")

        # Check correct answer is in options (for MC types)
        correct = q.get("correct_answer", "")
        if options and correct and correct not in options:
            question_errors.append(f"{qid}: correct_answer not in options")

        # Check explanation exists
        if not q.get("explanation"):
            question_errors.append(f"{qid}: missing explanation")

        if question_errors:
            errors.extend(question_errors)
            logger.warning(
                "[Node:validate_structure] Dropping %s: %s", qid, question_errors
            )
        else:
            valid_questions.append(q)

    dropped = len(questions) - len(valid_questions)
    if dropped > 0:
        logger.warning(
            "[Node:validate_structure] DONE — dropped %d/%d questions, %d valid: %s",
            dropped,
            len(questions),
            len(valid_questions),
            errors,
        )
    else:
        logger.info(
            "[Node:validate_structure] DONE — all %d questions passed",
            len(questions),
        )

    # Only trigger retry if no valid questions remain
    needs_retry = len(valid_questions) == 0

    # Deterministic content quality checks (Tier 2 only — AC #6)
    # Tier 1 data comes from DB so these checks are skipped
    content_feedback = ""
    if generation_tier == "tier2" and valid_questions and not needs_retry:
        structured_content = state.get("structured_content", {})
        vocab_list: list[dict[str, Any]] = structured_content.get("vocabulary", [])
        vocab_set: set[str] = {
            v.get("traditional", "") for v in vocab_list if v.get("traditional")
        }

        content_issues = _run_deterministic_content_checks(valid_questions, vocab_set)
        if content_issues:
            content_feedback = (
                "Content quality check failures:\n"
                + "\n".join(f"  - {issue}" for issue in content_issues[:10])
                + "\n\nFix all issues: use Traditional Chinese only, "
                "use pinyin diacritics (not tone numbers), "
                "write question_text in English."
            )
            logger.warning(
                "[Node:validate_structure] Deterministic content checks FAILED: "
                "%d issues: %s",
                len(content_issues),
                content_issues[:5],
            )
            needs_retry = True

    # Grammar coverage validation — relaxed to min(4, total) instead of ALL (AC #6)
    MIN_GRAMMAR_COVERAGE = 4
    grammar_points_list = state.get("grammar_points_list", [])
    grammar_feedback = ""
    if grammar_points_list and valid_questions and not needs_retry:
        covered_grammar: set[str] = set()
        for question in valid_questions:
            gp = question.get("grammar_pattern")
            if gp:
                covered_grammar.add(gp)

        required_coverage = min(MIN_GRAMMAR_COVERAGE, len(grammar_points_list))
        if len(covered_grammar) < required_coverage:
            missing = [
                gp["title_english"]
                for gp in grammar_points_list
                if gp.get("title_english")
                and gp["title_english"] not in covered_grammar
            ]
            grammar_feedback = (
                f"Only {len(covered_grammar)}/{required_coverage} grammar points covered. "
                f"Missing: {', '.join(missing[:5])}. "
                "Generate questions covering these grammar patterns. "
                "Include the 'grammar_pattern' field in each question."
            )
            logger.warning(
                "[Node:validate_structure] Grammar coverage: %d/%d covered, "
                "need %d, missing: %s",
                len(covered_grammar),
                len(grammar_points_list),
                required_coverage,
                missing,
            )
            needs_retry = True

    result_dict: dict[str, Any] = {
        "questions": valid_questions,
        "validation_errors": errors if needs_retry else [],
        "retry_count": retry_count + (1 if needs_retry else 0),
    }

    # On success: set quiz_payload directly (evaluate_content node deprecated)
    if not needs_retry:
        result_dict["quiz_payload"] = {"questions": valid_questions}
        logger.info(
            "[Node:validate_structure] All checks PASSED — quiz_payload set with %d questions",
            len(valid_questions),
        )

    # Build retry feedback for self-correction (replaces evaluator_feedback)
    combined_feedback_parts = []
    if content_feedback:
        combined_feedback_parts.append(content_feedback)
    if grammar_feedback:
        combined_feedback_parts.append(grammar_feedback)

    if combined_feedback_parts:
        combined_feedback = "\n\n".join(combined_feedback_parts)
        result_dict["validation_errors"] = [combined_feedback]
        logger.info(
            "[Node:validate_structure] Retry feedback prepared (%d chars)",
            len(combined_feedback),
        )

    return result_dict


async def evaluate_content(state: QuizGenerationState) -> dict[str, Any]:
    """Evaluate generated quiz content quality using LLM as judge.

    Checks 5 rules via an LLM evaluator:
    1. Traditional Chinese only (no Simplified)
    2. Pinyin uses tone diacritics (not tone numbers)
    3. question_text is in English (not Chinese)
    4. Curriculum alignment (content from specified chapter)
    5. Pedagogical quality (plausible distractors, good explanations)

    On failure, sets evaluator_feedback for the generator to self-correct.
    If the evaluator LLM itself fails, defaults to pass (don't block the quiz).
    Checks for client disconnection before the evaluator LLM call to avoid
    wasting API costs when the client has already navigated away.

    Performance Budget:
    - Latency: ~1-2 seconds per evaluation (LLM call)
    - Cost: ~$0.005 per evaluation (varies by LLM model)
    - Happy path: 0 retries (4-7s total quiz generation)
    - With 1 retry: ~8-12s total (within 30s service timeout)

    Args:
        state: Current graph state with questions from generate_quiz.

    Returns:
        State update with validation_errors, evaluator_feedback,
        retry_count, and quiz_payload.

    Raises:
        asyncio.CancelledError: If client disconnects before the evaluator LLM call.
    """
    import time

    start = time.perf_counter()
    questions = state.get("questions", [])
    retry_count = state.get("retry_count", 0)

    # Skip evaluation if structural validation already failed
    structural_errors = state.get("validation_errors", [])
    if structural_errors:
        logger.info("[Node:evaluate_content] SKIPPED — structural errors present")
        return {}

    logger.info(
        "[Node:evaluate_content] START evaluating %d questions (retry=%d)",
        len(questions),
        retry_count,
    )

    # Check for client disconnection before the evaluator LLM call
    request = state.get("request")
    if request and await request.is_disconnected():
        logger.info("[Node:evaluate_content] Client disconnected, skipping evaluation")
        raise asyncio.CancelledError("Client disconnected")

    try:
        questions_json = json.dumps(questions, ensure_ascii=False, indent=2)

        prompt_text = CONTENT_EVALUATION_PROMPT.format(
            questions_json=questions_json,
        )

        llm = get_llm()
        messages = [
            SystemMessage(content=CONTENT_EVALUATION_SYSTEM_PROMPT),
            HumanMessage(content=prompt_text),
        ]

        llm_start = time.perf_counter()
        response = await llm.ainvoke(messages)
        llm_elapsed = (time.perf_counter() - llm_start) * 1000
        logger.info("[Node:evaluate_content] LLM responded in %.0fms", llm_elapsed)

        # Log token usage if available
        usage = getattr(response, "usage_metadata", None)
        if usage:
            logger.info(
                "[Node:evaluate_content] Token usage: input=%s output=%s total=%s",
                usage.get("input_tokens", "?"),
                usage.get("output_tokens", "?"),
                usage.get("total_tokens", "?"),
            )

        content = (
            response.content
            if isinstance(response.content, str)
            else str(response.content)
        )

        evaluation = _parse_evaluation_response(content)

        if evaluation.get("passed", False):
            elapsed = (time.perf_counter() - start) * 1000
            logger.info(
                "[Node:evaluate_content] PASSED in %.0fms — all rules satisfied",
                elapsed,
            )
            return {
                "validation_errors": [],
                "evaluator_feedback": "",
                "quiz_payload": {"questions": questions},
            }

        # Evaluation found issues — drop failing questions, keep valid ones
        issues = evaluation.get("issues", [])
        feedback_lines: list[str] = []
        failed_qids: set[str] = set()
        for issue in issues:
            qid = issue.get("question_id", "unknown")
            rule = issue.get("rule", "unknown")
            detail = issue.get("detail", "no detail")
            feedback_lines.append(f"- [{qid}] {rule}: {detail}")
            failed_qids.add(qid)

        feedback = "\n".join(feedback_lines)

        # Filter out questions with issues, keep the rest
        valid_questions = [
            q for q in questions if q.get("question_id", "") not in failed_qids
        ]
        dropped = len(questions) - len(valid_questions)

        elapsed = (time.perf_counter() - start) * 1000

        # Minimum viable quiz: at least 3 questions
        min_questions = 3
        if len(valid_questions) >= min_questions:
            logger.warning(
                "[Node:evaluate_content] PARTIAL PASS in %.0fms — "
                "dropped %d/%d questions with %d issues, %d valid:\n%s",
                elapsed,
                dropped,
                len(questions),
                len(issues),
                len(valid_questions),
                feedback,
            )
            return {
                "validation_errors": [],
                "evaluator_feedback": "",
                "quiz_payload": {"questions": valid_questions},
            }

        # Too few valid questions — retry with full regeneration
        logger.warning(
            "[Node:evaluate_content] FAILED in %.0fms — only %d valid "
            "questions after dropping %d (min=%d), retrying:\n%s",
            elapsed,
            len(valid_questions),
            dropped,
            min_questions,
            feedback,
        )

        return {
            "validation_errors": [
                f"Content evaluation failed: {len(issues)} issues, "
                f"only {len(valid_questions)} valid (min={min_questions})"
            ],
            "evaluator_feedback": feedback,
            "retry_count": retry_count + 1,
            "quiz_payload": {},
        }

    except asyncio.CancelledError:
        raise  # Do NOT swallow — let cancellation propagate
    except Exception as e:
        # If the evaluator itself fails, don't block the quiz
        # This is a safety mechanism to ensure quizzes are delivered even if
        # the evaluator LLM has issues (cost: potential quality degradation)
        elapsed = (time.perf_counter() - start) * 1000
        logger.error(
            "[Node:evaluate_content] EVALUATOR ERROR after %.0fms: %s: %s "
            "— defaulting to PASS",
            elapsed,
            type(e).__name__,
            e,
        )
        logger.warning(
            "[Node:evaluate_content] Auto-passed %d questions without content validation. "
            "Questions: %s",
            len(questions),
            [q.get("question_id", "unknown") for q in questions],
        )
        return {
            "validation_errors": [],
            "evaluator_feedback": "",
            "quiz_payload": {"questions": questions},
        }


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------


def _format_chapter_content(chunks: list[dict[str, Any]]) -> str:
    """Format RAG chunks into a readable text block for the LLM.

    Args:
        chunks: List of content chunk dictionaries.

    Returns:
        Formatted string of chapter content.
    """
    if not chunks:
        return "(No chapter content available)"

    sections: list[str] = []
    for chunk in chunks:
        section = chunk.get("section", "")
        content = chunk.get("content", "")
        exercise_type = chunk.get("exercise_type", "")
        topic = chunk.get("topic", "")

        header_parts = [p for p in [section, exercise_type, topic] if p]
        header = " | ".join(header_parts) if header_parts else "Content"
        sections.append(f"### {header}\n{content}")

    return "\n\n".join(sections)


def _get_output_schema_hint(exercise_type: str) -> str:
    """Get a JSON schema hint for the LLM output format.

    Args:
        exercise_type: The exercise type.

    Returns:
        Schema hint string.
    """
    base = (
        '{"question_id": "q1", "exercise_type": "<type>", '
        '"question_text": "...", "correct_answer": "...", '
        '"explanation": "...", "source_citation": "..."'
    )

    type_fields: dict[str, str] = {
        "vocabulary": ', "character": "...", "pinyin": "...", "meaning": "...", '
        '"question_subtype": "char_to_meaning", "options": ["a", "b", "c", "d"]}',
        "grammar": ', "sentence": "...", "options": ["a", "b", "c", "d"], '
        '"grammar_point": "...", "grammar_pattern": "..."}',
        "fill_in_blank": ', "sentence_with_blanks": "I ___ Chinese", '
        '"word_bank": ["study", "eat", "read"], "blank_positions": [1]}',
        "matching": ', "left_items": ["A", "B"], "right_items": ["1", "2"], '
        '"correct_pairs": [[0, 0], [1, 1]]}',
        "dialogue_completion": ', "dialogue_bubbles": [{"speaker": "A", "text": "...", '
        '"is_blank": false}], "options": ["a", "b", "c", "d"]}',
        "sentence_construction": ', "scrambled_words": ["word1", "word2"], '
        '"correct_order": [1, 0]}',
        "reading_comprehension": ', "passage": "...", '
        '"comprehension_questions": [{"question": "...", '
        '"options": ["a", "b", "c", "d"], "correct": 0}]}',
    }

    suffix = type_fields.get(exercise_type, "}")
    return base + suffix


def _parse_evaluation_response(content: str) -> dict[str, Any]:
    """Parse JSON evaluation response from evaluator LLM.

    Handles markdown code blocks and various JSON formats.

    Args:
        content: Raw LLM response text.

    Returns:
        Parsed evaluation dict with 'passed' and 'issues' keys.
        Defaults to passed=True if parsing fails.
    """
    text = content.strip()
    if text.startswith("```"):
        first_newline = text.index("\n") if "\n" in text else len(text)
        text = text[first_newline + 1 :]
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3].rstrip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            result: dict[str, Any] = parsed
            return result
        logger.warning("Evaluation response is not a dict: %s", type(parsed))
        return {"passed": True, "issues": []}
    except json.JSONDecodeError as e:
        logger.error("Failed to parse evaluation JSON response: %s", e)
        return {"passed": True, "issues": []}


def _parse_questions_json(content: str) -> list[dict[str, Any]]:
    """Parse JSON question array from LLM response text.

    Handles cases where the JSON is wrapped in markdown code blocks.

    Args:
        content: Raw LLM response text.

    Returns:
        Parsed list of question dictionaries.
    """
    # Strip markdown code blocks if present
    text = content.strip()
    if text.startswith("```"):
        # Remove opening code fence
        first_newline = text.index("\n") if "\n" in text else len(text)
        text = text[first_newline + 1 :]
        # Remove closing code fence
        if text.rstrip().endswith("```"):
            text = text.rstrip()[:-3].rstrip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, list):
            result: list[dict[str, Any]] = parsed
            return result
        if isinstance(parsed, dict) and "questions" in parsed:
            questions: list[dict[str, Any]] = parsed["questions"]
            return questions
        return [parsed]
    except json.JSONDecodeError as e:
        logger.error("Failed to parse LLM JSON response: %s", e)
        return []


def _format_structured_vocabulary(vocab_items: list[dict[str, Any]]) -> str:
    """Format structured vocabulary list for the LLM prompt.

    Args:
        vocab_items: List of vocabulary dictionaries from content_repo.

    Returns:
        Formatted string listing each vocab item.
    """
    if not vocab_items:
        return "(No vocabulary data available)"

    lines: list[str] = []
    for item in vocab_items:
        traditional = item.get("traditional", "")
        pinyin = item.get("pinyin", "")
        english = item.get("english", "")
        pos = item.get("part_of_speech", "")
        pos_str = f" ({pos})" if pos else ""
        lines.append(f"- {traditional} [{pinyin}] — {english}{pos_str}")

    return "\n".join(lines)


def _format_structured_grammar_points(
    grammar_points: list[dict[str, Any]],
) -> str:
    """Format structured grammar points for the LLM prompt.

    Args:
        grammar_points: List of grammar point dictionaries from content_repo.

    Returns:
        Formatted string listing each grammar point with patterns and examples.
    """
    if not grammar_points:
        return "(No grammar points data available)"

    sections: list[str] = []
    for i, gp in enumerate(grammar_points, 1):
        title = gp.get("title_english", "Unknown")
        title_cn = gp.get("title_chinese", "")
        pattern = gp.get("structure_pattern", "")
        description = gp.get("function_description", "")
        usage = gp.get("usage_notes", "")
        examples = gp.get("examples", [])

        parts = [f"### {i}. {title}"]
        if title_cn:
            parts.append(f"   Chinese: {title_cn}")
        if pattern:
            parts.append(f"   Pattern: {pattern}")
        if description:
            parts.append(f"   Function: {description}")
        if usage:
            parts.append(f"   Usage: {usage}")
        if examples and isinstance(examples, list):
            for ex in examples[:3]:
                if isinstance(ex, dict):
                    cn = ex.get("chinese", "")
                    en = ex.get("english", "")
                    parts.append(f"   Example: {cn} — {en}")

        sections.append("\n".join(parts))

    return "\n\n".join(sections)


def _format_structured_dialogues(dialogues: list[dict[str, Any]]) -> str:
    """Format structured dialogues for the LLM prompt.

    Args:
        dialogues: List of dialogue dictionaries from content_repo.

    Returns:
        Formatted string with dialogue content.
    """
    if not dialogues:
        return "(No dialogue data available)"

    sections: list[str] = []
    for dlg in dialogues:
        num = dlg.get("dialogue_number", "")
        title_trad = dlg.get("title_traditional", "")
        title_en = dlg.get("title_english", "")
        lines = dlg.get("lines", [])

        header = f"### Dialogue {num}: {title_trad} ({title_en})"
        line_strs: list[str] = []
        if isinstance(lines, list):
            for line in lines:
                if isinstance(line, dict):
                    speaker = line.get("speaker", "")
                    text = line.get("traditional", "")
                    english = line.get("english", "")
                    line_strs.append(f"   {speaker}: {text} ({english})")

        sections.append(header + "\n" + "\n".join(line_strs))

    return "\n\n".join(sections)
