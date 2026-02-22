"""Tests for Pydantic schema validation."""

import pytest
from pydantic import ValidationError

from src.api.schemas import (
    ComprehensionSubQuestion,
    DialogueCompletionQuestion,
    ExerciseType,
    FillInBlankQuestion,
    GrammarQuestion,
    MatchingQuestion,
    QuizGenerateRequest,
    QuizGenerateResponse,
    ReadingComprehensionQuestion,
    SentenceConstructionQuestion,
    ValidationExerciseType,
    ValidationRequest,
    ValidationResponse,
    VocabularyQuestion,
)


class TestExerciseTypeEnum:
    def test_all_exercise_types_present(self):
        expected = {
            "vocabulary",
            "grammar",
            "fill_in_blank",
            "matching",
            "dialogue_completion",
            "sentence_construction",
            "reading_comprehension",
            "mixed",
        }
        actual = {e.value for e in ExerciseType}
        assert actual == expected

    def test_exercise_type_from_string(self):
        assert ExerciseType("vocabulary") == ExerciseType.VOCABULARY
        assert ExerciseType("mixed") == ExerciseType.MIXED

    def test_invalid_exercise_type_raises(self):
        with pytest.raises(ValueError):
            ExerciseType("invalid_type")


class TestQuizGenerateRequest:
    def test_valid_request(self):
        req = QuizGenerateRequest(
            chapter_id=212, book_id=2, exercise_type=ExerciseType.VOCABULARY
        )
        assert req.chapter_id == 212
        assert req.book_id == 2
        assert req.exercise_type == ExerciseType.VOCABULARY

    def test_default_exercise_type(self):
        req = QuizGenerateRequest(chapter_id=101, book_id=1)
        assert req.exercise_type == ExerciseType.VOCABULARY

    def test_invalid_book_id_too_high(self):
        with pytest.raises(ValidationError):
            QuizGenerateRequest(chapter_id=101, book_id=7)

    def test_invalid_book_id_too_low(self):
        with pytest.raises(ValidationError):
            QuizGenerateRequest(chapter_id=101, book_id=0)


class TestVocabularyQuestion:
    def test_valid_vocabulary_question(self):
        q = VocabularyQuestion(
            question_id="q1",
            exercise_type=ExerciseType.VOCABULARY,
            question_text="What does this character mean?",
            correct_answer="to study",
            explanation="學 means to study.",
            source_citation="Book 1, Chapter 1 - Vocabulary",
            character="學",
            pinyin="xue2",
            meaning="to study",
            question_subtype="char_to_meaning",
            options=["to study", "to teach", "to read", "to write"],
        )
        assert q.exercise_type == ExerciseType.VOCABULARY
        assert len(q.options) == 4

    def test_options_must_have_4_items(self):
        with pytest.raises(ValidationError):
            VocabularyQuestion(
                question_id="q1",
                exercise_type=ExerciseType.VOCABULARY,
                question_text="test",
                correct_answer="a",
                explanation="test",
                source_citation="test",
                character="學",
                pinyin="xue2",
                meaning="to study",
                question_subtype="char_to_meaning",
                options=["a", "b"],  # too few
            )


class TestGrammarQuestion:
    def test_valid_grammar_question(self):
        q = GrammarQuestion(
            question_id="q1",
            exercise_type=ExerciseType.GRAMMAR,
            question_text="Choose the correct word",
            correct_answer="了",
            explanation="了 indicates completed action.",
            source_citation="Book 1, Chapter 2 - Grammar",
            sentence="我昨天___三本書",
            options=["了", "過", "著", "在"],
            grammar_point="aspect marker 了",
        )
        assert q.grammar_point == "aspect marker 了"


class TestFillInBlankQuestion:
    def test_valid_fill_in_blank(self):
        q = FillInBlankQuestion(
            question_id="q1",
            exercise_type=ExerciseType.FILL_IN_BLANK,
            question_text="Fill in the blank",
            correct_answer="學",
            explanation="學 fits here.",
            source_citation="Book 1, Chapter 1",
            sentence_with_blanks="我___中文",
            word_bank=["學", "吃", "看", "寫"],
            blank_positions=[1],
        )
        assert q.sentence_with_blanks == "我___中文"


class TestMatchingQuestion:
    def test_valid_matching(self):
        q = MatchingQuestion(
            question_id="q1",
            exercise_type=ExerciseType.MATCHING,
            question_text="Match the pairs",
            correct_answer="See pairs",
            explanation="Standard vocabulary matching.",
            source_citation="Book 1, Chapter 1",
            left_items=["學", "吃"],
            right_items=["to eat", "to study"],
            correct_pairs=[[0, 1], [1, 0]],
        )
        assert len(q.left_items) == 2


class TestDialogueCompletionQuestion:
    def test_valid_dialogue(self):
        q = DialogueCompletionQuestion(
            question_id="q1",
            exercise_type=ExerciseType.DIALOGUE_COMPLETION,
            question_text="Complete the dialogue",
            correct_answer="你好",
            explanation="你好 is a greeting.",
            source_citation="Book 1, Chapter 1",
            dialogue_bubbles=[
                {"speaker": "A", "text": "___", "is_blank": True},
                {"speaker": "B", "text": "你好！", "is_blank": False},
            ],
            options=["你好", "再見", "謝謝", "對不起"],
        )
        assert len(q.dialogue_bubbles) == 2


class TestSentenceConstructionQuestion:
    def test_valid_sentence_construction(self):
        q = SentenceConstructionQuestion(
            question_id="q1",
            exercise_type=ExerciseType.SENTENCE_CONSTRUCTION,
            question_text="Arrange the words",
            correct_answer="我學中文",
            explanation="The correct order is subject-verb-object.",
            source_citation="Book 1, Chapter 1",
            scrambled_words=["中文", "我", "學"],
            correct_order=[1, 2, 0],
        )
        assert len(q.scrambled_words) == 3


class TestReadingComprehensionQuestion:
    def test_valid_reading_comprehension(self):
        q = ReadingComprehensionQuestion(
            question_id="q1",
            exercise_type=ExerciseType.READING_COMPREHENSION,
            question_text="Read and answer",
            correct_answer="See sub-questions",
            explanation="Based on the passage.",
            source_citation="Book 1, Chapter 3",
            passage="小明每天早上八點去學校。",
            comprehension_questions=[
                ComprehensionSubQuestion(
                    question="When does Xiao Ming go to school?",
                    options=["7am", "8am", "9am", "10am"],
                    correct=1,
                ),
            ],
        )
        assert len(q.comprehension_questions) == 1


class TestValidationExerciseTypeEnum:
    def test_only_complex_types_allowed(self):
        """Only sentence_construction and dialogue_completion are valid."""
        assert (
            ValidationExerciseType.SENTENCE_CONSTRUCTION.value
            == "sentence_construction"
        )
        assert ValidationExerciseType.DIALOGUE_COMPLETION.value == "dialogue_completion"
        assert len(ValidationExerciseType) == 2

    def test_from_string(self):
        assert (
            ValidationExerciseType("sentence_construction")
            == ValidationExerciseType.SENTENCE_CONSTRUCTION
        )
        assert (
            ValidationExerciseType("dialogue_completion")
            == ValidationExerciseType.DIALOGUE_COMPLETION
        )

    def test_invalid_type_raises(self):
        with pytest.raises(ValueError):
            ValidationExerciseType("vocabulary")

    def test_grammar_type_rejected(self):
        with pytest.raises(ValueError):
            ValidationExerciseType("grammar")

    def test_fill_in_blank_type_rejected(self):
        with pytest.raises(ValueError):
            ValidationExerciseType("fill_in_blank")


class TestValidationRequest:
    def _valid_request(self, **overrides):
        defaults = {
            "question": "Arrange these words: 我 學 中文",
            "user_answer": "我學中文",
            "correct_answer": "我學中文",
            "exercise_type": "sentence_construction",
        }
        defaults.update(overrides)
        return ValidationRequest(**defaults)

    def test_valid_sentence_construction_request(self):
        req = self._valid_request()
        assert req.exercise_type == ValidationExerciseType.SENTENCE_CONSTRUCTION
        assert req.question == "Arrange these words: 我 學 中文"
        assert req.user_answer == "我學中文"
        assert req.correct_answer == "我學中文"

    def test_valid_dialogue_completion_request(self):
        req = self._valid_request(exercise_type="dialogue_completion")
        assert req.exercise_type == ValidationExerciseType.DIALOGUE_COMPLETION

    def test_empty_question_raises(self):
        with pytest.raises(ValidationError):
            self._valid_request(question="")

    def test_empty_user_answer_raises(self):
        with pytest.raises(ValidationError):
            self._valid_request(user_answer="")

    def test_empty_correct_answer_raises(self):
        with pytest.raises(ValidationError):
            self._valid_request(correct_answer="")

    def test_invalid_exercise_type_raises(self):
        with pytest.raises(ValidationError):
            self._valid_request(exercise_type="vocabulary")

    def test_vocabulary_exercise_type_rejected(self):
        with pytest.raises(ValidationError):
            self._valid_request(exercise_type="vocabulary")

    def test_grammar_exercise_type_rejected(self):
        with pytest.raises(ValidationError):
            self._valid_request(exercise_type="grammar")

    def test_matching_exercise_type_rejected(self):
        with pytest.raises(ValidationError):
            self._valid_request(exercise_type="matching")


class TestValidationResponse:
    def test_valid_correct_response(self):
        resp = ValidationResponse(
            is_correct=True,
            explanation="Your answer is correct.",
            alternatives=["alternative sentence"],
        )
        assert resp.is_correct is True
        assert resp.explanation == "Your answer is correct."
        assert len(resp.alternatives) == 1

    def test_valid_incorrect_response(self):
        resp = ValidationResponse(
            is_correct=False,
            explanation="Word order is incorrect.",
            alternatives=["correct order"],
        )
        assert resp.is_correct is False

    def test_alternatives_default_empty(self):
        resp = ValidationResponse(is_correct=True, explanation="Correct!")
        assert resp.alternatives == []

    def test_multiple_alternatives(self):
        resp = ValidationResponse(
            is_correct=True,
            explanation="Your answer is valid.",
            alternatives=["alt1", "alt2", "alt3"],
        )
        assert len(resp.alternatives) == 3

    def test_missing_is_correct_raises(self):
        with pytest.raises(ValidationError):
            ValidationResponse(explanation="test")  # type: ignore[call-arg]

    def test_missing_explanation_raises(self):
        with pytest.raises(ValidationError):
            ValidationResponse(is_correct=True)  # type: ignore[call-arg]


class TestQuizGenerateResponse:
    def test_valid_response_with_vocabulary(self):
        resp = QuizGenerateResponse(
            quiz_id="test-uuid",
            chapter_id=101,
            book_id=1,
            exercise_type="vocabulary",
            question_count=1,
            questions=[
                VocabularyQuestion(
                    question_id="q1",
                    exercise_type=ExerciseType.VOCABULARY,
                    question_text="What does 學 mean?",
                    correct_answer="to study",
                    explanation="學 means to study.",
                    source_citation="Book 1, Ch 1",
                    character="學",
                    pinyin="xue2",
                    meaning="to study",
                    question_subtype="char_to_meaning",
                    options=["to study", "to eat", "to go", "to come"],
                ),
            ],
        )
        assert resp.question_count == 1
        assert len(resp.questions) == 1
