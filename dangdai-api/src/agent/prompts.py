"""LLM prompt templates.

Define per-exercise-type prompt templates for quiz generation.
"""

from __future__ import annotations

SYSTEM_PROMPT = """\
You are an expert Chinese language quiz generator for the 當代中文課程 \
(A Course in Contemporary Chinese) textbook series. You generate high-quality, \
pedagogically sound quiz questions based on chapter content provided via RAG retrieval.

CRITICAL RULES:
- ONLY use vocabulary, grammar, and content from the provided chapter material
- Each question MUST have exactly one correct answer
- All distractor options must be plausible but clearly incorrect
- Explanations must cite the textbook source
- Pinyin must use tone numbers (e.g., xue2) for consistency
- Generate questions in the EXACT JSON format specified
"""

QUIZ_GENERATION_PROMPT = """\
Generate {question_count} quiz questions of type "{exercise_type}" \
for Book {book_id}, Chapter {lesson} of 當代中文課程.

{exercise_type_instructions}

## Chapter Content (from RAG retrieval):
{chapter_content}

{weakness_context}

## Output Format
Return a JSON array of question objects. Each question must follow this structure:
{output_schema}

IMPORTANT:
- Generate exactly {question_count} questions
- Every question must have a unique question_id (q1, q2, q3, ...)
- source_citation format: "Book {book_id}, Chapter {lesson} - {section}"
- explanations should be concise (1-2 sentences) and educational
- All content must come from the provided chapter material
"""

# ---------------------------------------------------------------------------
# Per-exercise-type instructions
# ---------------------------------------------------------------------------

VOCABULARY_INSTRUCTIONS = """\
Generate vocabulary quiz questions. For each question:
- Pick a vocabulary item from the chapter content
- Create a question testing one direction (char→meaning, pinyin→char, or meaning→char)
- Provide 4 multiple-choice options (1 correct, 3 plausible distractors from same chapter)
- Include the character, pinyin, and meaning fields

Question JSON fields:
- question_id, exercise_type ("vocabulary"), question_text, correct_answer
- character (Chinese chars), pinyin (tone numbers), meaning (English)
- question_subtype ("char_to_meaning" | "pinyin_to_char" | "meaning_to_char")
- options (array of 4 strings), explanation, source_citation
"""

GRAMMAR_INSTRUCTIONS = """\
Generate grammar quiz questions. For each question:
- Focus on a grammar point from the chapter
- Present a sentence that tests understanding of the grammar structure
- Provide 4 multiple-choice options for completing or correcting the sentence
- Identify the specific grammar point being tested

Question JSON fields:
- question_id, exercise_type ("grammar"), question_text, correct_answer
- sentence (the full sentence context), options (array of 4 strings)
- grammar_point (the grammar structure being tested)
- explanation, source_citation
"""

FILL_IN_BLANK_INSTRUCTIONS = """\
Generate fill-in-the-blank questions. For each question:
- Create a sentence with 1-2 blanks (marked with ___)
- Provide a word bank that includes the correct answers plus distractors
- Specify blank positions

Question JSON fields:
- question_id, exercise_type ("fill_in_blank"), question_text, correct_answer
- sentence_with_blank (sentence with ___ markers)
- word_bank (array of available words, including correct and distractors)
- blank_positions (array of integer positions)
- explanation, source_citation
"""

MATCHING_INSTRUCTIONS = """\
Generate matching exercise questions. For each question:
- Create 4-6 pairs to match (e.g., character↔meaning, pinyin↔character)
- Provide left and right columns
- Specify the correct pairing indices

Question JSON fields:
- question_id, exercise_type ("matching"), question_text, correct_answer
- left_items (array of strings), right_items (array of shuffled strings)
- correct_pairs (array of [left_index, right_index] pairs)
- explanation, source_citation
"""

DIALOGUE_COMPLETION_INSTRUCTIONS = """\
Generate dialogue completion questions. For each question:
- Create a short dialogue (2-4 exchanges) with one blank bubble
- Provide options for completing the blank
- Dialogue should be natural and use chapter vocabulary/grammar

Question JSON fields:
- question_id, exercise_type ("dialogue_completion"), question_text, correct_answer
- dialogue_bubbles (array of {{speaker: str, text: str, is_blank: bool}})
- options (array of strings to fill the blank)
- explanation, source_citation
"""

SENTENCE_CONSTRUCTION_INSTRUCTIONS = """\
Generate sentence construction (word ordering) questions. For each question:
- Provide scrambled words from a correct sentence
- The student must arrange them in correct order
- Use sentences with chapter vocabulary and grammar patterns

Question JSON fields:
- question_id, exercise_type ("sentence_construction"), question_text, correct_answer
- scrambled_words (array of words in random order)
- correct_order (array of indices representing correct word order)
- explanation, source_citation
"""

READING_COMPREHENSION_INSTRUCTIONS = """\
Generate reading comprehension questions. For each question:
- Write or adapt a short passage (2-4 sentences) using chapter content
- Create 2-3 comprehension questions about the passage
- Each sub-question has 4 multiple-choice options

Question JSON fields:
- question_id, exercise_type ("reading_comprehension"), question_text, correct_answer
- passage (the reading text)
- comprehension_questions (array of {{question: str, options: [4 strings], correct: int}})
- explanation, source_citation
"""

EXERCISE_TYPE_INSTRUCTIONS: dict[str, str] = {
    "vocabulary": VOCABULARY_INSTRUCTIONS,
    "grammar": GRAMMAR_INSTRUCTIONS,
    "fill_in_blank": FILL_IN_BLANK_INSTRUCTIONS,
    "matching": MATCHING_INSTRUCTIONS,
    "dialogue_completion": DIALOGUE_COMPLETION_INSTRUCTIONS,
    "sentence_construction": SENTENCE_CONSTRUCTION_INSTRUCTIONS,
    "reading_comprehension": READING_COMPREHENSION_INSTRUCTIONS,
}

VALIDATION_PROMPT = """\
Validate the following quiz questions for quality and correctness.

Check each question for:
1. Correct answer exists and is valid
2. All options are distinct (no duplicates)
3. Vocabulary and grammar items are from the chapter content
4. No duplicate questions
5. Question format matches the exercise type specification
6. Explanations are present and educational

Questions to validate:
{questions_json}

Return a JSON object with:
- "valid": true/false
- "errors": array of error strings (empty if valid)
- "question_ids_to_regenerate": array of question_ids that need fixing
"""
