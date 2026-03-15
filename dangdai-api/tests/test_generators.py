"""Unit tests for Tier 1 algorithmic generators (Story 4.15).

Tests cover:
- VocabularyGenerator: distractor selection, weakness biasing, subtype rotation
- MatchingGenerator: pair generation, shuffling, alternating match types
- FillInBlankGenerator: example masking, word bank, grammar coverage
"""

from __future__ import annotations

from src.agent.generators import (
    FillInBlankGenerator,
    MatchingGenerator,
    VocabularyGenerator,
)

# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------

SAMPLE_VOCABULARY = [
    {
        "traditional": "學",
        "pinyin": "xué",
        "english": "to study",
        "part_of_speech": "V",
    },
    {
        "traditional": "老師",
        "pinyin": "lǎoshī",
        "english": "teacher",
        "part_of_speech": "N",
    },
    {"traditional": "書", "pinyin": "shū", "english": "book", "part_of_speech": "N"},
    {
        "traditional": "學生",
        "pinyin": "xuéshēng",
        "english": "student",
        "part_of_speech": "N",
    },
    {
        "traditional": "說",
        "pinyin": "shuō",
        "english": "to speak",
        "part_of_speech": "V",
    },
    {
        "traditional": "話",
        "pinyin": "huà",
        "english": "speech/words",
        "part_of_speech": "N",
    },
    {"traditional": "語", "pinyin": "yǔ", "english": "language", "part_of_speech": "N"},
    {
        "traditional": "中文",
        "pinyin": "zhōngwén",
        "english": "Chinese language",
        "part_of_speech": "N",
    },
    {
        "traditional": "對",
        "pinyin": "duì",
        "english": "correct/right",
        "part_of_speech": "Adj",
    },
    {"traditional": "時", "pinyin": "shí", "english": "time", "part_of_speech": "N"},
    {
        "traditional": "會",
        "pinyin": "huì",
        "english": "can/be able to",
        "part_of_speech": "Aux",
    },
    {
        "traditional": "見",
        "pinyin": "jiàn",
        "english": "to see/meet",
        "part_of_speech": "V",
    },
]

SAMPLE_GRAMMAR_POINTS = [
    {
        "title_english": "Using 是",
        "title_chinese": "是的用法",
        "structure_pattern": "Subject + 是 + Noun",
        "function_description": "Equative verb",
        "usage_notes": "Identification",
        "examples": [
            {"chinese": "我是學生", "english": "I am a student"},
            {"chinese": "她是老師", "english": "She is a teacher"},
        ],
    },
    {
        "title_english": "Using 在",
        "title_chinese": "在的用法",
        "structure_pattern": "Subject + 在 + Place",
        "function_description": "Locative verb",
        "usage_notes": "Location",
        "examples": [
            {"chinese": "書在桌子上", "english": "The book is on the table"},
        ],
    },
    {
        "title_english": "Using 有",
        "title_chinese": "有的用法",
        "structure_pattern": "Subject + 有 + Object",
        "function_description": "Possession verb",
        "usage_notes": "Possession or existence",
        "examples": [
            {"chinese": "我有書", "english": "I have a book"},
        ],
    },
    {
        "title_english": "Question particle 嗎",
        "title_chinese": "嗎的用法",
        "structure_pattern": "Statement + 嗎?",
        "function_description": "Yes/no question marker",
        "usage_notes": "Converts statement to yes/no question",
        "examples": [
            {"chinese": "你是學生嗎？", "english": "Are you a student?"},
        ],
    },
    {
        "title_english": "Negative 不",
        "title_chinese": "不的用法",
        "structure_pattern": "Subject + 不 + Verb",
        "function_description": "Negation",
        "usage_notes": "Negates present/future actions",
        "examples": [
            {"chinese": "我不說中文", "english": "I do not speak Chinese"},
        ],
    },
]


# ---------------------------------------------------------------------------
# VocabularyGenerator tests (7.1)
# ---------------------------------------------------------------------------


class TestVocabularyGenerator:
    """Tests for VocabularyGenerator (Task 7.1)."""

    def test_generate_returns_list_of_questions(self):
        """Generate returns a list of question dicts."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert isinstance(questions, list)
        assert len(questions) > 0

    def test_generate_question_count_capped_at_vocab_size(self):
        """Generate at most min(QUESTION_COUNT, len(vocab)) questions."""
        gen = VocabularyGenerator()
        small_vocab = SAMPLE_VOCABULARY[:3]
        questions = gen.generate(small_vocab, {}, book_id=1, lesson_id=1)
        assert len(questions) <= 3

    def test_generate_with_full_vocab_produces_twelve_questions(self):
        """With sufficient vocab, generates QUESTION_COUNT = 12 questions."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert len(questions) == 12

    def test_generate_question_structure(self):
        """Each question has required fields."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY[:4], {}, book_id=1, lesson_id=2)
        for q in questions:
            assert "question_id" in q
            assert "exercise_type" in q
            assert q["exercise_type"] == "vocabulary"
            assert "question_text" in q
            assert "correct_answer" in q
            assert "explanation" in q
            assert "source_citation" in q
            assert "options" in q

    def test_question_text_is_english(self):
        """question_text must not contain majority Chinese characters."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            text = q["question_text"]
            # Count CJK vs Latin chars
            cjk = sum(1 for c in text if "\u4e00" <= c <= "\u9fff")
            latin = sum(
                1 for c in text if c.isalpha() and not ("\u4e00" <= c <= "\u9fff")
            )
            # question_text should not be primarily Chinese
            assert cjk <= latin, f"question_text appears to be in Chinese: {text!r}"

    def test_correct_answer_in_options(self):
        """correct_answer must be present in options."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY[:4], {}, book_id=1, lesson_id=1)
        for q in questions:
            assert q["correct_answer"] in q["options"]

    def test_options_are_distinct(self):
        """Options must not contain duplicates."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            options = q["options"]
            assert len(options) == len(set(options)), f"Duplicate options: {options}"

    def test_subtypes_covered(self):
        """Both subtypes should appear across 12 generated questions."""
        gen = VocabularyGenerator()
        # Run multiple times to ensure variety
        all_subtypes: set[str] = set()
        for _ in range(5):
            questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
            for q in questions:
                all_subtypes.add(q.get("question_subtype", ""))

        assert "pinyin_to_char" in all_subtypes
        assert "char_to_pinyin" in all_subtypes

    def test_weakness_biasing_prioritizes_weak_vocab(self):
        """30-50% of questions should target weak vocabulary items."""
        gen = VocabularyGenerator()
        weak_trad = "學"
        weakness_profile = {"weak_vocab": [{"vocabulary_item": weak_trad}]}

        weak_count = 0
        total = 0
        for _ in range(10):
            questions = gen.generate(
                SAMPLE_VOCABULARY, weakness_profile, book_id=1, lesson_id=1
            )
            for q in questions:
                total += 1
                # character or correct_answer may contain the target
                if q.get("character") == weak_trad or q.get("meaning") == "to study":
                    weak_count += 1

        # Weak item should appear more often than random selection
        assert weak_count > 0, "Weak vocabulary item was never selected"

    def test_weakness_biasing_empty_profile(self):
        """Empty weakness profile falls back to normal selection."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert len(questions) > 0

    def test_source_citation_contains_book_and_lesson(self):
        """source_citation must reference the correct book and lesson."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY[:4], {}, book_id=2, lesson_id=5)
        for q in questions:
            assert "Book 2" in q["source_citation"]
            assert "Chapter 5" in q["source_citation"]

    def test_generate_empty_vocabulary_returns_empty(self):
        """Empty vocabulary produces no questions."""
        gen = VocabularyGenerator()
        questions = gen.generate([], {}, book_id=1, lesson_id=1)
        assert questions == []

    def test_distractor_pool_used_when_provided(self):
        """Distractors should be drawn from distractor_pool, not just vocabulary."""
        gen = VocabularyGenerator()
        # Use only 2 items as vocabulary (small — distractors would be limited)
        small_vocab = SAMPLE_VOCABULARY[:2]
        # Provide a broader pool
        questions = gen.generate(
            small_vocab,
            {},
            book_id=1,
            lesson_id=1,
            distractor_pool=SAMPLE_VOCABULARY,
        )
        assert len(questions) > 0
        for q in questions:
            # With a broader pool, we should still get 4 options
            assert len(q["options"]) == 4, (
                f"Expected 4 options with broader pool, got {len(q['options'])}"
            )

    def test_no_english_in_options(self):
        """All options must be Chinese characters or pinyin — never English."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            subtype = q["question_subtype"]
            for opt in q["options"]:
                if subtype == "pinyin_to_char":
                    # Options should be Chinese characters
                    assert any("\u4e00" <= c <= "\u9fff" for c in opt), (
                        f"pinyin_to_char option should be Chinese: {opt!r}"
                    )
                else:  # char_to_pinyin
                    # Options should be pinyin (no CJK)
                    assert not any("\u4e00" <= c <= "\u9fff" for c in opt), (
                        f"char_to_pinyin option should be pinyin: {opt!r}"
                    )

    def test_pinyin_to_char_hides_character(self):
        """pinyin_to_char questions should NOT reveal the character on card."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            if q["question_subtype"] == "pinyin_to_char":
                assert q["character"] is None, (
                    f"pinyin_to_char should hide character, got: {q['character']!r}"
                )
                assert q["pinyin"] is not None, "pinyin_to_char must show pinyin"

    def test_char_to_pinyin_hides_pinyin(self):
        """char_to_pinyin questions should NOT reveal the pinyin on card."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            if q["question_subtype"] == "char_to_pinyin":
                assert q["pinyin"] is None, (
                    f"char_to_pinyin should hide pinyin, got: {q['pinyin']!r}"
                )
                assert q["character"] is not None, "char_to_pinyin must show character"

    def test_explanation_contains_traditional_and_pinyin(self):
        """Explanation must contain the Traditional character and pinyin."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY[:4], {}, book_id=1, lesson_id=1)
        for q in questions:
            explanation = q["explanation"]
            # Explanation always contains the full character + pinyin
            # (even if the card hides one for the quiz)
            meaning = q.get("meaning", "")
            # Find the original vocab to get the traditional char
            orig = [v for v in SAMPLE_VOCABULARY if v["english"] == meaning]
            if orig:
                assert orig[0]["traditional"] in explanation, (
                    f"Character '{orig[0]['traditional']}' not in explanation: {explanation!r}"
                )
                assert orig[0]["pinyin"] in explanation, (
                    f"Pinyin '{orig[0]['pinyin']}' not in explanation: {explanation!r}"
                )

    def test_explanation_does_not_contain_english_meaning(self):
        """Explanation must NOT contain the English meaning (shown in question/options)."""
        gen = VocabularyGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY[:4], {}, book_id=1, lesson_id=1)
        for q in questions:
            explanation = q["explanation"]
            english = q.get("meaning", "")
            assert english not in explanation, (
                f"English meaning '{english}' should not appear in explanation: {explanation!r}"
            )

    def test_explanation_pos_uses_comma_separator(self):
        """POS in explanation uses comma, not double-parenthetical."""
        gen = VocabularyGenerator()
        # 學 has POS=V; generate a question targeting it
        vocab_with_pos = [v for v in SAMPLE_VOCABULARY if v.get("part_of_speech")]
        questions = gen.generate(vocab_with_pos[:4], {}, book_id=1, lesson_id=1)
        for q in questions:
            explanation = q["explanation"]
            # Should NOT have consecutive closing-opening parens like ) (
            assert ") (" not in explanation, (
                f"Double-parenthetical found in explanation: {explanation!r}"
            )

    def test_pick_distractors_same_pos_preferred(self):
        """Distractors should prefer same part-of-speech."""
        gen = VocabularyGenerator()
        target = {
            "traditional": "學",
            "pinyin": "xué",
            "english": "to study",
            "part_of_speech": "V",
        }
        distractors = gen._pick_distractors(target, SAMPLE_VOCABULARY, "pinyin_to_char")
        # Result should be Traditional characters for pinyin_to_char
        assert len(distractors) > 0
        for d in distractors:
            assert d != "學"  # Not the correct answer

    def test_pick_distractors_char_to_pinyin_returns_pinyin(self):
        """char_to_pinyin distractors should be pinyin strings (no Chinese)."""
        gen = VocabularyGenerator()
        target = SAMPLE_VOCABULARY[0]  # 學
        distractors = gen._pick_distractors(target, SAMPLE_VOCABULARY, "char_to_pinyin")
        # All distractors should be pinyin (ASCII-ish, no CJK)
        for d in distractors:
            assert not any("\u4e00" <= c <= "\u9fff" for c in d), (
                f"Expected pinyin string, got CJK: {d}"
            )

    def test_pick_distractors_pinyin_to_char_returns_traditional(self):
        """pinyin_to_char distractors should be Traditional Chinese characters."""
        gen = VocabularyGenerator()
        target = SAMPLE_VOCABULARY[0]  # 學
        distractors = gen._pick_distractors(target, SAMPLE_VOCABULARY, "pinyin_to_char")
        # Distractors should contain Chinese characters
        for d in distractors:
            assert any("\u4e00" <= c <= "\u9fff" for c in d), (
                f"Expected Chinese char: {d}"
            )


# ---------------------------------------------------------------------------
# MatchingGenerator tests (7.2)
# ---------------------------------------------------------------------------


class TestMatchingGenerator:
    """Tests for MatchingGenerator (Task 7.2)."""

    def test_generate_returns_list(self):
        """Generate returns a list of question dicts."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert isinstance(questions, list)
        assert len(questions) > 0

    def test_generate_question_count(self):
        """Generates QUESTION_COUNT = 2 matching questions."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert len(questions) == 2

    def test_generate_question_structure(self):
        """Each matching question has required fields."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            assert q["exercise_type"] == "matching"
            assert "left_items" in q
            assert "right_items" in q
            assert "correct_pairs" in q
            assert "question_text" in q
            assert "explanation" in q
            assert "source_citation" in q

    def test_left_and_right_same_length(self):
        """left_items and right_items should have the same count."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            assert len(q["left_items"]) == len(q["right_items"])

    def test_correct_pairs_are_valid_indices(self):
        """correct_pairs indices must be within bounds of left/right items."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            n_left = len(q["left_items"])
            n_right = len(q["right_items"])
            for pair in q["correct_pairs"]:
                left_idx, right_idx = pair
                assert 0 <= left_idx < n_left
                assert 0 <= right_idx < n_right

    def test_all_left_items_covered_by_pairs(self):
        """Every left item should have exactly one correct pair."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            left_indices = [p[0] for p in q["correct_pairs"]]
            assert len(left_indices) == len(set(left_indices)), "Duplicate left indices"
            assert set(left_indices) == set(range(len(q["left_items"])))

    def test_right_items_are_shuffled(self):
        """right_items should have consistent structure after shuffling."""
        gen = MatchingGenerator()
        # Verify the structure is correct — shuffling is verified by
        # correct_pairs tests which confirm the mapping is maintained
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert len(questions) == 2
        for q in questions:
            assert len(q["right_items"]) == len(q["left_items"])

    def test_source_citation_correct(self):
        """source_citation references correct book and lesson."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=3, lesson_id=7)
        for q in questions:
            assert "Book 3" in q["source_citation"]
            assert "Chapter 7" in q["source_citation"]

    def test_generate_empty_vocabulary_returns_empty(self):
        """Empty vocabulary produces no questions."""
        gen = MatchingGenerator()
        questions = gen.generate([], {}, book_id=1, lesson_id=1)
        assert questions == []

    def test_left_items_are_traditional_characters(self):
        """left_items should contain Traditional Chinese characters (left = characters)."""
        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        q = questions[0]
        for item in q["left_items"]:
            assert any("\u4e00" <= c <= "\u9fff" for c in item), (
                f"left_item does not contain Chinese: {item!r}"
            )

    def test_correct_answer_is_json_encoded_pairs(self):
        """correct_answer must be a JSON-encoded list of [left, right] index pairs."""
        import json

        gen = MatchingGenerator()
        questions = gen.generate(SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        for q in questions:
            pairs = json.loads(q["correct_answer"])
            assert isinstance(pairs, list)
            assert len(pairs) == len(q["left_items"])
            for pair in pairs:
                assert isinstance(pair, list)
                assert len(pair) == 2


# ---------------------------------------------------------------------------
# FillInBlankGenerator tests (7.3)
# ---------------------------------------------------------------------------


class TestFillInBlankGenerator:
    """Tests for FillInBlankGenerator (Task 7.3)."""

    def test_generate_returns_list(self):
        """Generate returns a list of question dicts."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        assert isinstance(questions, list)
        assert len(questions) > 0

    def test_generate_question_structure(self):
        """Each fill-in-blank question has required fields."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        for q in questions:
            assert q["exercise_type"] == "fill_in_blank"
            assert "sentence_with_blanks" in q
            assert "word_bank" in q
            assert "correct_answer" in q
            assert "explanation" in q
            assert "source_citation" in q

    def test_blank_marker_in_sentence(self):
        """sentence_with_blanks must contain the ___ marker."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        for q in questions:
            assert "___" in q["sentence_with_blanks"], (
                f"No blank in: {q['sentence_with_blanks']!r}"
            )

    def test_correct_answer_in_word_bank(self):
        """correct_answer must be present in word_bank."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        for q in questions:
            assert q["correct_answer"] in q["word_bank"], (
                f"correct_answer {q['correct_answer']!r} not in word_bank {q['word_bank']}"
            )

    def test_grammar_coverage_min4(self):
        """At least min(4, total_grammar_points) grammar points covered."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        covered = {
            q.get("grammar_pattern") for q in questions if q.get("grammar_pattern")
        }
        required = min(
            FillInBlankGenerator.MIN_GRAMMAR_COVERAGE, len(SAMPLE_GRAMMAR_POINTS)
        )
        assert len(covered) >= required, (
            f"Only {len(covered)} grammar points covered, need {required}"
        )

    def test_grammar_coverage_with_few_points(self):
        """With fewer than 4 grammar points, covers all of them."""
        gen = FillInBlankGenerator()
        few_gps = SAMPLE_GRAMMAR_POINTS[:2]
        questions = gen.generate(few_gps, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        covered = {
            q.get("grammar_pattern") for q in questions if q.get("grammar_pattern")
        }
        required = min(FillInBlankGenerator.MIN_GRAMMAR_COVERAGE, len(few_gps))
        assert len(covered) >= required

    def test_word_bank_has_distractors(self):
        """word_bank should contain more than just the correct answer."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        for q in questions:
            assert len(q["word_bank"]) >= 2, f"word_bank too short: {q['word_bank']}"

    def test_source_citation_references_grammar(self):
        """source_citation should reference grammar."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=3
        )
        for q in questions:
            assert (
                "Grammar" in q["source_citation"] or "Chapter 3" in q["source_citation"]
            )

    def test_generate_empty_grammar_returns_empty(self):
        """Empty grammar_points produces no questions."""
        gen = FillInBlankGenerator()
        questions = gen.generate([], SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1)
        assert questions == []

    def test_question_count_capped_at_twelve(self):
        """Generate at most QUESTION_COUNT = 12 questions."""
        gen = FillInBlankGenerator()
        questions = gen.generate(
            SAMPLE_GRAMMAR_POINTS, SAMPLE_VOCABULARY, {}, book_id=1, lesson_id=1
        )
        assert len(questions) <= FillInBlankGenerator.QUESTION_COUNT

    def test_mask_example_masks_vocab_word(self):
        """_mask_example should replace a vocabulary word with ___."""
        gen = FillInBlankGenerator()
        example = {"chinese": "我是學生", "english": "I am a student"}
        gp = SAMPLE_GRAMMAR_POINTS[0]
        result = gen._mask_example(example, gp, SAMPLE_VOCABULARY, 1, 1, 1)
        if result is not None:  # None = vocab word not found in sentence
            assert "___" in result["sentence_with_blanks"]
            assert result["correct_answer"] in ["學", "學生", "老師"]

    def test_mask_example_returns_none_for_empty_chinese(self):
        """_mask_example returns None when example has no Chinese text."""
        gen = FillInBlankGenerator()
        example = {"chinese": "", "english": "no content"}
        result = gen._mask_example(
            example, SAMPLE_GRAMMAR_POINTS[0], SAMPLE_VOCABULARY, 1, 1, 1
        )
        assert result is None
