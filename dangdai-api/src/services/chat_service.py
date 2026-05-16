"""Chat / RAG Q&A service.

Answer free-form questions about the 當代中文課程 textbook and workbook by
combining semantic retrieval (pgvector via the ``dangdai_search`` RPC) with
LLM generation. Mirrors the pipeline in ``dangdai-rag/rag_query.py`` but
runs inside the deployed FastAPI backend.
"""

from __future__ import annotations

import logging
import os
import re
from typing import Any

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage

from src.api.schemas import ChatResponse, ChatSource, ChatTurn
from src.repositories.vector_store import VectorStore
from src.utils.llm_factory import get_llm

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are a helpful Chinese language learning assistant specializing in
當代中文課程 (A Course in Contemporary Chinese) textbooks and workbooks.

Your role is to:
1. Answer questions about Chinese language learning based on the provided content
2. Explain grammar patterns, vocabulary, and cultural notes from textbooks
3. Help with workbook exercises (listening, reading, fill-in-the-blank, composition, etc.)
4. Provide examples and practice suggestions when helpful
5. Always cite which book, lesson, and source type (textbook/workbook) the information comes from

Guidelines:
- Be encouraging and supportive of language learners
- Use both traditional Chinese characters (as in the textbook) and pinyin when helpful
- Keep answers concise but comprehensive

Content types you may receive:
- TEXTBOOK: Dialogues, vocabulary, grammar explanations, cultural notes, reading passages
- WORKBOOK: Exercises tagged by type (listening, pronunciation, reading, fill_in_blank,
  matching, dialogue_completion, sentence_construction, character_writing, composition, vocabulary)

IMPORTANT - Handling OCR content:
- The content may have OCR artifacts (extra spaces between characters, fragmented text)
- When you see content like "陳 月 美" or "生 詞", treat it as "陳月美" or "生詞" (remove extra spaces)
- Vocabulary tables contain words with pinyin and English translations - extract and present them clearly
- If the user asks for vocabulary, dialogues, or specific content, synthesize the information from the provided chunks even if they appear fragmented
- When listing vocabulary, format it nicely: 中文 (pinyin) - English meaning
- If you can identify dialogue content, present it as a proper dialogue format
- For workbook exercises, present them clearly and explain what the student needs to do
- ALWAYS attempt to provide useful information from the chunks, even if the formatting is imperfect"""


def _embed_query(query: str) -> list[float]:
    """Generate an embedding for the user's query using OpenAI.

    Uses the ``text-embedding-3-small`` model (1536 dim) to match the chunks
    stored in ``dangdai_chunks`` by the RAG ingestion pipeline.

    Args:
        query: The user's natural-language question.

    Returns:
        1536-dimensional embedding vector.
    """
    from openai import OpenAI

    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is required for chat embeddings")

    client = OpenAI(api_key=api_key)
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    return response.data[0].embedding


# Maps Chinese numerals 一-十 (and a few past 十) to ints. Used by the
# 第N課 parser so users can write "第三課" or "第十二課" in the query.
_CN_NUM: dict[str, int] = {
    "一": 1, "二": 2, "兩": 2, "三": 3, "四": 4, "五": 5,
    "六": 6, "七": 7, "八": 8, "九": 9, "十": 10,
}


def _cn_to_int(s: str) -> int | None:
    """Parse a short Chinese numeral like "三", "十", "十二", "二十". Returns None if unparseable."""
    if not s:
        return None
    if s.isdigit():
        return int(s)
    if "十" not in s:
        if len(s) == 1 and s in _CN_NUM:
            return _CN_NUM[s]
        return None
    left, _, right = s.partition("十")
    tens = _CN_NUM[left] if left else 1
    ones = _CN_NUM[right] if right else 0
    if tens is None or ones is None:
        return None
    return tens * 10 + ones


def extract_book_lesson(query: str) -> tuple[int | None, int | None]:
    """Pull explicit Book / Lesson hints out of a free-form query.

    Recognizes English forms ("Book 1 Lesson 3", "B1L3", "lesson 3 of book 1")
    and Chinese forms ("第三課", "第3課"). Returns (book, lesson); either may
    be None if not mentioned. The caller decides whether to apply these as
    filters (only when the request did not pass them explicitly).
    """
    if not query:
        return None, None
    q = query.strip()

    book: int | None = None
    lesson: int | None = None

    m = re.search(r"\bb(?:ook)?\s*(\d+)\s*[,\-]?\s*l(?:esson)?\s*(\d+)\b", q, re.IGNORECASE)
    if m:
        book = int(m.group(1))
        lesson = int(m.group(2))
        return book, lesson

    m = re.search(r"\bl(?:esson)?\s*(\d+)\s+(?:of|in|from)\s+b(?:ook)?\s*(\d+)\b", q, re.IGNORECASE)
    if m:
        lesson = int(m.group(1))
        book = int(m.group(2))
        return book, lesson

    m = re.search(r"\bbook\s*(\d+)\b", q, re.IGNORECASE)
    if m:
        book = int(m.group(1))

    m = re.search(r"\b(?:lesson|chapter)\s*(\d+)\b", q, re.IGNORECASE)
    if m:
        lesson = int(m.group(1))

    m_cn = re.search(r"第\s*([一二兩三四五六七八九十百\d]+)\s*課", q)
    if m_cn and lesson is None:
        lesson = _cn_to_int(m_cn.group(1))

    return book, lesson


def _build_context(chunks: list[dict[str, Any]]) -> str:
    """Format retrieved chunks into a single context string for the LLM.

    Args:
        chunks: Chunks returned by ``VectorStore.semantic_search``.

    Returns:
        Context string with one labeled source per chunk.
    """
    parts: list[str] = []
    for i, chunk in enumerate(chunks, 1):
        content_type = (chunk.get("content_type") or "textbook").upper()
        source = f"Book {chunk.get('book', '?')}, Lesson {chunk.get('lesson', '?')}"
        section = chunk.get("section", "unknown")
        exercise_type = chunk.get("exercise_type")
        if exercise_type:
            label = f"{content_type} {source} - {section} (exercise: {exercise_type})"
        else:
            label = f"{content_type} {source} - {section}"
        parts.append(f"[Source {i}: {label}]\n{chunk.get('content', '')}")
    return "\n\n---\n\n".join(parts)


class ChatService:
    """Service that answers free-form questions over the textbook/workbook RAG."""

    def __init__(self, vector_store: VectorStore | None = None) -> None:
        """Initialize ChatService.

        Args:
            vector_store: Optional VectorStore (for dependency injection in tests).
        """
        self._vector_store = vector_store or VectorStore()

    # How many prior turns to feed the LLM. Past this, context grows fast
    # and old turns rarely affect the answer.
    _HISTORY_MAX_TURNS = 8

    def ask(
        self,
        query: str,
        book: int | None = None,
        lesson: int | None = None,
        content_type: str | None = None,
        exercise_type: str | None = None,
        num_chunks: int = 5,
        history: list[ChatTurn] | None = None,
    ) -> ChatResponse:
        """Answer a question with retrieved-context RAG.

        Args:
            query: User's natural-language question.
            book: Optional book filter (1-6).
            lesson: Optional lesson filter within the selected book.
            content_type: Optional 'textbook' or 'workbook' filter.
            exercise_type: Optional workbook exercise type filter.
            num_chunks: Number of chunks to retrieve.
            history: Prior conversation turns (oldest first), excluding the
                current query. Trimmed to the last ``_HISTORY_MAX_TURNS``.

        Returns:
            ChatResponse with the answer, source citations, and model name.
        """
        # When the client did not pass explicit book/lesson filters, try to
        # pull them from the natural-language query (e.g. "Book 1 Lesson 3",
        # "第三課"). Without this the embedding search returns grammatically
        # similar chunks from the wrong chapter.
        if book is None or lesson is None:
            parsed_book, parsed_lesson = extract_book_lesson(query)
            if book is None and parsed_book is not None:
                book = parsed_book
            if lesson is None and parsed_lesson is not None:
                lesson = parsed_lesson

        # Sticky scope: if the current query has no Book/Lesson hint, walk
        # back through history (newest first) and reuse the most recent
        # explicit mention. Otherwise a follow-up like "give me an example"
        # would retrieve from a random chapter.
        if (book is None or lesson is None) and history:
            for turn in reversed(history):
                if turn.role != "user":
                    continue
                h_book, h_lesson = extract_book_lesson(turn.content)
                if book is None and h_book is not None:
                    book = h_book
                if lesson is None and h_lesson is not None:
                    lesson = h_lesson
                if book is not None and lesson is not None:
                    break

        query_embedding = _embed_query(query)

        chunks = self._vector_store.semantic_search(
            query_embedding=query_embedding,
            book=book,
            lesson=lesson,
            content_type=content_type,
            exercise_type=exercise_type,
            limit=num_chunks,
        )

        if not chunks:
            logger.info(
                "Chat: no chunks retrieved for query=%r book=%s lesson=%s",
                query,
                book,
                lesson,
            )
            return ChatResponse(
                answer=(
                    "I couldn't find anything relevant in the textbook or workbook "
                    "for your question. Try rephrasing, or remove the book/lesson "
                    "filter to broaden the search."
                ),
                sources=[],
                model=os.getenv("LLM_MODEL", "unknown"),
            )

        context = _build_context(chunks)
        user_prompt = (
            "Based on the following content from 當代中文課程 textbooks and workbooks, "
            "please answer the question.\n\n"
            f"CONTENT:\n{context}\n\n"
            f"QUESTION: {query}\n\n"
            "Instructions:\n"
            "1. Extract and present the relevant information from the content above\n"
            "2. If the content has OCR artifacts (extra spaces), clean them up in your response\n"
            "3. For vocabulary questions: list words in format \"中文 (pinyin) - English meaning\"\n"
            "4. For dialogue questions: format as \"Speaker: Chinese text (pinyin if helpful)\"\n"
            "5. For workbook exercises: explain what the exercise asks and help the student understand it\n"
            "6. Include relevant Chinese characters, pinyin, and cite which book/lesson "
            "(and whether textbook or workbook) the information comes from\n"
            "7. If the chunks contain the requested information but it's fragmented, "
            "synthesize it into a coherent answer"
        )

        messages: list[BaseMessage] = [SystemMessage(content=SYSTEM_PROMPT)]
        if history:
            trimmed = history[-self._HISTORY_MAX_TURNS :]
            for turn in trimmed:
                if turn.role == "user":
                    messages.append(HumanMessage(content=turn.content))
                else:
                    messages.append(AIMessage(content=turn.content))
        messages.append(HumanMessage(content=user_prompt))

        llm = get_llm(temperature=0.7, max_tokens=1500)
        result = llm.invoke(messages)

        answer_text = result.content if isinstance(result.content, str) else str(result.content)

        sources = [
            ChatSource(
                book=chunk.get("book"),
                lesson=chunk.get("lesson"),
                section=chunk.get("section"),
                content_type=chunk.get("content_type"),
                exercise_type=chunk.get("exercise_type"),
                similarity=chunk.get("similarity"),
                page_range=chunk.get("page_range"),
            )
            for chunk in chunks
        ]

        model_name = (
            getattr(llm, "model_name", None)
            or getattr(llm, "model", None)
            or os.getenv("LLM_MODEL", "unknown")
        )

        return ChatResponse(answer=answer_text, sources=sources, model=str(model_name))
