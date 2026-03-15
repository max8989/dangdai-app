"""Tier 1 algorithmic quiz generators.

Generate quiz questions deterministically from structured textbook data —
no LLM calls required. Used for vocabulary, matching, and fill-in-blank
exercise types.
"""

from __future__ import annotations

import json
import logging
import random
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------


class AlgorithmicGenerator:
    """Base class for Tier 1 algorithmic quiz generators."""

    def generate(self, *args: Any, **kwargs: Any) -> list[dict[str, Any]]:
        """Generate quiz questions from structured data.

        Args:
            *args: Positional arguments (subclass-specific).
            **kwargs: Keyword arguments (subclass-specific).

        Returns:
            List of question dictionaries in the standard quiz payload format.
        """
        raise NotImplementedError


# ---------------------------------------------------------------------------
# Vocabulary generator
# ---------------------------------------------------------------------------


class VocabularyGenerator(AlgorithmicGenerator):
    """Generate vocabulary quiz questions algorithmically from structured data.

    Supports three question subtypes:
    - char_to_meaning: Given character, choose meaning
    - pinyin_to_char:  Given pinyin,     choose character
    - meaning_to_char: Given meaning,    choose character

    Biases 30-50% of questions toward weak vocabulary items when a weakness
    profile is provided.
    """

    SUBTYPES = ["char_to_meaning", "pinyin_to_char", "meaning_to_char"]
    QUESTION_COUNT = 12

    def generate(  # noqa: D102
        self,
        vocabulary: list[dict[str, Any]],
        weakness_profile: dict[str, Any],
        book_id: int,
        lesson_id: int,
    ) -> list[dict[str, Any]]:
        """Generate vocabulary questions with weakness biasing.

        Args:
            vocabulary: List of vocabulary item dicts from the DB.
            weakness_profile: User weakness data with "weak_vocab" list.
            book_id: Book number (for source_citation).
            lesson_id: Lesson number (for source_citation).

        Returns:
            List of vocabulary question dicts.
        """
        if not vocabulary:
            return []

        # Separate weak vs normal vocab
        weak_vocab_items: list[dict[str, Any]] = weakness_profile.get("weak_vocab", [])
        weak_set: set[str] = {
            item.get("vocabulary_item", "") for item in weak_vocab_items
        }

        weak_pool = [v for v in vocabulary if v.get("traditional", "") in weak_set]
        normal_pool = [
            v for v in vocabulary if v.get("traditional", "") not in weak_set
        ]

        # Select items: 30-50% from weak pool (target 40%)
        weak_count = min(len(weak_pool), int(self.QUESTION_COUNT * 0.4))
        normal_count = self.QUESTION_COUNT - weak_count

        selected: list[dict[str, Any]] = []
        if weak_pool:
            selected.extend(random.sample(weak_pool, min(weak_count, len(weak_pool))))
        if normal_pool:
            selected.extend(
                random.sample(normal_pool, min(normal_count, len(normal_pool)))
            )

        # Shuffle and cap at QUESTION_COUNT
        random.shuffle(selected)
        selected = selected[: self.QUESTION_COUNT]

        # Generate questions
        questions: list[dict[str, Any]] = []
        used_subtypes: list[str] = []
        for i, vocab in enumerate(selected):
            subtype = random.choice(self.SUBTYPES)
            used_subtypes.append(subtype)
            distractors = self._pick_distractors(vocab, vocabulary, subtype)
            question = self._build_question(
                vocab, subtype, distractors, i + 1, book_id, lesson_id
            )
            questions.append(question)

        return questions

    def _pick_distractors(
        self, target: dict[str, Any], pool: list[dict[str, Any]], subtype: str
    ) -> list[str]:
        """Pick 3 plausible distractors, preferring same part of speech.

        Args:
            target: The vocabulary item being tested.
            pool: All vocabulary items for the chapter.
            subtype: Question subtype (char_to_meaning, pinyin_to_char, meaning_to_char).

        Returns:
            List of up to 3 distractor strings.
        """
        target_trad = target.get("traditional", "")
        target_pos = target.get("part_of_speech", "")

        # Prefer same POS candidates
        same_pos = [
            v
            for v in pool
            if v.get("part_of_speech") == target_pos
            and v.get("traditional") != target_trad
        ]
        other = [v for v in pool if v.get("traditional") != target_trad]

        candidates = same_pos if len(same_pos) >= 3 else other
        if not candidates:
            return []

        selected = random.sample(candidates, min(3, len(candidates)))

        if subtype == "char_to_meaning":
            return [s.get("english", "") for s in selected if s.get("english")]
        else:
            # pinyin_to_char and meaning_to_char: options are characters
            return [s.get("traditional", "") for s in selected if s.get("traditional")]

    def _build_question(
        self,
        vocab: dict[str, Any],
        subtype: str,
        distractors: list[str],
        index: int,
        book_id: int,
        lesson_id: int,
    ) -> dict[str, Any]:
        """Build a complete vocabulary question dict.

        Args:
            vocab: Vocabulary item data.
            subtype: Question subtype.
            distractors: List of distractor strings.
            index: Question number (for question_id).
            book_id: Book number.
            lesson_id: Lesson number.

        Returns:
            Complete question dictionary.
        """
        traditional = vocab.get("traditional", "")
        pinyin = vocab.get("pinyin", "")
        english = vocab.get("english", "")
        pos = vocab.get("part_of_speech", "")

        if subtype == "char_to_meaning":
            question_text = (
                f"What is the English meaning of '{traditional}' ({pinyin})?"
            )
            correct_answer = english
            options = [english] + distractors
        elif subtype == "pinyin_to_char":
            question_text = f"Which Traditional Chinese character has the pinyin '{pinyin}'? ({english})"
            correct_answer = traditional
            options = [traditional] + distractors
        else:  # meaning_to_char
            question_text = f"Which Traditional Chinese character means '{english}'?"
            correct_answer = traditional
            options = [traditional] + distractors

        # Shuffle options
        random.shuffle(options)

        pos_note = f" ({pos})" if pos else ""
        explanation = (
            f"'{traditional}' ({pinyin}) means '{english}'{pos_note}. "
            f"From Book {book_id}, Lesson {lesson_id} vocabulary."
        )

        return {
            "question_id": f"q{index}",
            "exercise_type": "vocabulary",
            "question_subtype": subtype,
            "question_text": question_text,
            "character": traditional,
            "pinyin": pinyin,
            "meaning": english,
            "correct_answer": correct_answer,
            "options": options,
            "explanation": explanation,
            "source_citation": f"Book {book_id}, Chapter {lesson_id} - Vocabulary",
        }


# ---------------------------------------------------------------------------
# Matching generator
# ---------------------------------------------------------------------------


class MatchingGenerator(AlgorithmicGenerator):
    """Generate matching exercise questions from vocabulary items.

    Each question presents 4-6 vocab pairs: left column = Traditional
    characters, right column = shuffled meanings (or pinyin). Two questions
    are generated (~12 total pairs).
    """

    PAIRS_PER_QUESTION = 5  # 4-6 pairs per question
    QUESTION_COUNT = 2

    def generate(  # noqa: D102
        self,
        vocabulary: list[dict[str, Any]],
        weakness_profile: dict[str, Any],
        book_id: int,
        lesson_id: int,
    ) -> list[dict[str, Any]]:
        """Generate matching questions from vocabulary items.

        Args:
            vocabulary: List of vocabulary item dicts from the DB.
            weakness_profile: User weakness data (not heavily used for matching).
            book_id: Book number (for source_citation).
            lesson_id: Lesson number (for source_citation).

        Returns:
            List of matching question dicts.
        """
        if not vocabulary:
            return []

        # Shuffle vocabulary and split into question batches
        shuffled = list(vocabulary)
        random.shuffle(shuffled)

        questions: list[dict[str, Any]] = []
        start = 0

        for i in range(self.QUESTION_COUNT):
            end = start + self.PAIRS_PER_QUESTION
            batch = shuffled[start:end]
            if not batch:
                break

            # Alternate between char↔meaning and char↔pinyin matching
            use_pinyin = i % 2 == 1
            question = self._build_question(
                batch, i + 1, book_id, lesson_id, use_pinyin=use_pinyin
            )
            questions.append(question)
            start = end

        return questions

    def _build_question(
        self,
        vocab_batch: list[dict[str, Any]],
        index: int,
        book_id: int,
        lesson_id: int,
        *,
        use_pinyin: bool = False,
    ) -> dict[str, Any]:
        """Build a single matching question.

        Args:
            vocab_batch: Vocabulary items for this question.
            index: Question number.
            book_id: Book number.
            lesson_id: Lesson number.
            use_pinyin: If True, match characters to pinyin; else to meanings.

        Returns:
            Matching question dictionary.
        """
        left_items = [v.get("traditional", "") for v in vocab_batch]

        if use_pinyin:
            right_items_orig = [v.get("pinyin", "") for v in vocab_batch]
            match_type = "pinyin"
        else:
            right_items_orig = [v.get("english", "") for v in vocab_batch]
            match_type = "meaning"

        # Shuffle right column and track correct pairs
        right_shuffled = list(right_items_orig)
        random.shuffle(right_shuffled)

        correct_pairs: list[list[int]] = []
        for left_idx, item in enumerate(vocab_batch):
            if use_pinyin:
                value = item.get("pinyin", "")
            else:
                value = item.get("english", "")
            right_idx = right_shuffled.index(value)
            correct_pairs.append([left_idx, right_idx])

        if use_pinyin:
            question_text = (
                "Match each Traditional Chinese character to its pinyin pronunciation."
            )
        else:
            question_text = (
                "Match each Traditional Chinese character to its English meaning."
            )

        explanation = (
            f"Vocabulary matching from Book {book_id}, Lesson {lesson_id}. "
            f"Match characters to their {match_type}s."
        )

        # correct_answer encodes all pairs as a JSON string so answer validation
        # can parse and compare programmatically (e.g., "[[0,2],[1,0],[2,1]]")
        correct_answer = json.dumps(correct_pairs, separators=(",", ":"))

        return {
            "question_id": f"q{index}",
            "exercise_type": "matching",
            "question_text": question_text,
            "left_items": left_items,
            "right_items": right_shuffled,
            "correct_pairs": correct_pairs,
            "correct_answer": correct_answer,
            "explanation": explanation,
            "source_citation": f"Book {book_id}, Chapter {lesson_id} - Vocabulary",
        }


# ---------------------------------------------------------------------------
# Fill-in-blank generator
# ---------------------------------------------------------------------------


class FillInBlankGenerator(AlgorithmicGenerator):
    """Generate fill-in-blank questions from grammar point examples.

    Uses grammar_points.examples[] as source sentences. Masks the key
    pattern word and builds a word bank from chapter vocabulary.
    Ensures at least min(MIN_GRAMMAR_COVERAGE, total_grammar_points)
    grammar points are represented.
    """

    QUESTION_COUNT = 12
    MIN_GRAMMAR_COVERAGE = 4

    def generate(  # noqa: D102
        self,
        grammar_points: list[dict[str, Any]],
        vocabulary: list[dict[str, Any]],
        weakness_profile: dict[str, Any],
        book_id: int,
        lesson_id: int,
    ) -> list[dict[str, Any]]:
        """Generate fill-in-blank questions from grammar examples.

        Args:
            grammar_points: List of grammar point dicts with "examples" field.
            vocabulary: Chapter vocabulary for building word banks.
            weakness_profile: User weakness data (not heavily used here).
            book_id: Book number.
            lesson_id: Lesson number.

        Returns:
            List of fill-in-blank question dicts.
        """
        if not grammar_points:
            return []

        questions: list[dict[str, Any]] = []
        required_coverage = min(self.MIN_GRAMMAR_COVERAGE, len(grammar_points))
        used_gp_indices: set[int] = set()

        # First pass: ensure required grammar coverage
        for gp_idx, gp in enumerate(grammar_points[:required_coverage]):
            examples = gp.get("examples", [])
            if not isinstance(examples, list) or not examples:
                continue

            example = random.choice(examples)
            question = self._mask_example(
                example, gp, vocabulary, len(questions) + 1, book_id, lesson_id
            )
            if question:
                questions.append(question)
                used_gp_indices.add(gp_idx)

        # Second pass: fill remaining slots from all grammar points
        max_attempts = self.QUESTION_COUNT * 3
        attempt = 0
        while len(questions) < self.QUESTION_COUNT and attempt < max_attempts:
            attempt += 1
            gp = random.choice(grammar_points)
            examples = gp.get("examples", [])
            if not isinstance(examples, list) or not examples:
                continue

            example = random.choice(examples)
            question = self._mask_example(
                example, gp, vocabulary, len(questions) + 1, book_id, lesson_id
            )
            if question:
                questions.append(question)

        final = questions[: self.QUESTION_COUNT]

        if len(final) < self.QUESTION_COUNT:
            logger.warning(
                "[FillInBlankGenerator] Only produced %d/%d questions — "
                "grammar point examples may lack maskable vocabulary words "
                "(grammar_points=%d, vocab=%d)",
                len(final),
                self.QUESTION_COUNT,
                len(grammar_points),
                len(vocabulary),
            )

        return final

    def _mask_example(
        self,
        example: dict[str, Any],
        grammar_point: dict[str, Any],
        vocabulary: list[dict[str, Any]],
        index: int,
        book_id: int,
        lesson_id: int,
    ) -> dict[str, Any] | None:
        """Mask a key word in a grammar example to create a fill-in-blank question.

        Strategy: Find a vocabulary item that appears in the Chinese example
        sentence and mask it. If no vocab word found, try to mask the last
        meaningful word in the sentence.

        Args:
            example: Grammar point example with "chinese" and "english" keys.
            grammar_point: Grammar point data for explanation and citation.
            vocabulary: Chapter vocabulary items.
            index: Question number.
            book_id: Book number.
            lesson_id: Lesson number.

        Returns:
            Fill-in-blank question dict, or None if masking not possible.
        """
        chinese = example.get("chinese", "")
        english = example.get("english", "")

        if not chinese:
            return None

        # Find a maskable vocabulary item in the sentence
        maskable: dict[str, Any] | None = None
        for v in vocabulary:
            trad = v.get("traditional", "")
            if trad and trad in chinese and len(trad) >= 1:
                maskable = v
                break

        if not maskable:
            # Try to mask a single character from the sentence that looks vocab-like
            # Fall back: skip this example
            return None

        mask_word = maskable.get("traditional", "")
        sentence_with_blank = chinese.replace(mask_word, "___", 1)

        # Build word bank: correct answer + 3-5 distractors from chapter vocab
        correct_answer = mask_word
        distractor_pool = [
            v.get("traditional", "")
            for v in vocabulary
            if v.get("traditional") != mask_word and v.get("traditional")
        ]
        distractor_count = min(4, len(distractor_pool))
        distractors = (
            random.sample(distractor_pool, distractor_count) if distractor_pool else []
        )
        word_bank = [correct_answer] + distractors
        random.shuffle(word_bank)

        gp_title = grammar_point.get("title_english", "Grammar")
        gp_pattern = grammar_point.get("structure_pattern", "")
        explanation = (
            f"The correct answer is '{correct_answer}'. "
            f"Grammar pattern: {gp_title}"
            + (f" ({gp_pattern})" if gp_pattern else "")
            + f". Example: {chinese} — {english}"
        )

        return {
            "question_id": f"q{index}",
            "exercise_type": "fill_in_blank",
            "question_text": f"Fill in the blank: {sentence_with_blank} ({english})",
            "sentence_with_blanks": sentence_with_blank,
            "word_bank": word_bank,
            "blank_positions": [1],
            "correct_answer": correct_answer,
            "explanation": explanation,
            "source_citation": (
                f"Book {book_id}, Chapter {lesson_id} - Grammar: {gp_title}"
            ),
            "grammar_pattern": gp_title,
        }
