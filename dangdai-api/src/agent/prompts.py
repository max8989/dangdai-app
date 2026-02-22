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
- MUST use ONLY Traditional Chinese characters (繁體字 fántǐzì) - NEVER use Simplified Chinese (简体字)
- Each question MUST have exactly one correct answer
- All distractor options must be plausible but clearly incorrect
- Explanations must cite the textbook source
- Pinyin MUST use tone marks/diacritics (e.g., xué, xuéxí, nǐ, hǎo) - NEVER use tone numbers (e.g., xue2, ni3)
- The "question_text" field MUST be written in English - NEVER write question_text in Chinese
- Explanations MUST be written in English
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
- source_citation format: "Book {book_id}, Chapter {lesson} - <section name>"
- explanations should be concise (1-2 sentences) and educational, written in English
- All content must come from the provided chapter material
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) in all Chinese text - NEVER use Simplified Chinese
- Pinyin MUST use tone marks (é, ǐ, ā, etc.) - NEVER use tone numbers (e2, i3, a1)
- "question_text" MUST be in English (e.g., "Which character means 'to study'?") - NEVER write question_text in Chinese
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
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) - NEVER use Simplified Chinese
- Pinyin MUST use tone marks (xuéxí, nǐhǎo, etc.) - NEVER use tone numbers

Question JSON fields:
- question_id, exercise_type ("vocabulary"), question_text, correct_answer
- character (Traditional Chinese chars ONLY), pinyin (with tone marks like é, ǐ, ā), meaning (English)
- question_subtype ("char_to_meaning" | "pinyin_to_char" | "meaning_to_char")
- options (array of 4 strings), explanation, source_citation
"""

GRAMMAR_INSTRUCTIONS = """\
Generate grammar quiz questions. For each question:
- Focus on a grammar point from the chapter
- Present a sentence that tests understanding of the grammar structure
- Provide 4 multiple-choice options for completing or correcting the sentence
- Identify the specific grammar point being tested
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) in all Chinese sentences

Question JSON fields:
- question_id, exercise_type ("grammar"), question_text, correct_answer
- sentence (the full sentence context in Traditional Chinese), options (array of 4 strings)
- grammar_point (the grammar structure being tested)
- explanation, source_citation
"""

FILL_IN_BLANK_INSTRUCTIONS = """\
Generate fill-in-the-blank questions. For each question:
- Create a sentence with 1-2 blanks (marked with ___)
- Provide a word bank that includes the correct answers plus distractors
- Specify blank positions
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) in sentences and word bank

Question JSON fields:
- question_id, exercise_type ("fill_in_blank"), question_text, correct_answer
- sentence_with_blank (sentence with ___ markers in Traditional Chinese)
- word_bank (array of available words in Traditional Chinese, including correct and distractors)
- blank_positions (array of integer positions)
- explanation, source_citation
"""

MATCHING_INSTRUCTIONS = """\
Generate matching exercise questions. For each question:
- Create 4-6 pairs to match (e.g., character↔meaning, pinyin↔character)
- Provide left and right columns
- Specify the correct pairing indices
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) for all Chinese text
- If using pinyin, MUST use tone marks (nǐ, hǎo, etc.) - NEVER use tone numbers

Question JSON fields:
- question_id, exercise_type ("matching"), question_text, correct_answer
- left_items (array of strings in Traditional Chinese), right_items (array of shuffled strings)
- correct_pairs (array of [left_index, right_index] pairs)
- explanation, source_citation
"""

DIALOGUE_COMPLETION_INSTRUCTIONS = """\
Generate dialogue completion questions. For each question:
- Create a short dialogue (2-4 exchanges) with one blank bubble
- Provide options for completing the blank
- Dialogue should be natural and use chapter vocabulary/grammar
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) in all dialogue text

Question JSON fields:
- question_id, exercise_type ("dialogue_completion"), question_text, correct_answer
- dialogue_bubbles (array of {{speaker: str, text: str (Traditional Chinese), is_blank: bool}})
- options (array of strings in Traditional Chinese to fill the blank)
- explanation, source_citation
"""

SENTENCE_CONSTRUCTION_INSTRUCTIONS = """\
Generate sentence construction (word ordering) questions. For each question:
- Provide scrambled words from a correct sentence
- The student must arrange them in correct order
- Use sentences with chapter vocabulary and grammar patterns
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) for all Chinese words

Question JSON fields:
- question_id, exercise_type ("sentence_construction"), question_text, correct_answer
- scrambled_words (array of words in Traditional Chinese in random order)
- correct_order (array of indices representing correct word order)
- explanation, source_citation
"""

READING_COMPREHENSION_INSTRUCTIONS = """\
Generate reading comprehension questions. For each question:
- Write or adapt a short passage (2-4 sentences) using chapter content
- Create 2-3 comprehension questions about the passage
- Each sub-question has 4 multiple-choice options
- USE ONLY TRADITIONAL CHINESE CHARACTERS (繁體字) in the passage and all options

Question JSON fields:
- question_id, exercise_type ("reading_comprehension"), question_text, correct_answer
- passage (the reading text in Traditional Chinese)
- comprehension_questions (array of {{question: str, options: [4 strings in Traditional Chinese], correct: int}})
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

ANSWER_VALIDATION_SYSTEM_PROMPT = """\
You are an expert Chinese language evaluator for the 當代中文課程 \
(A Course in Contemporary Chinese) textbook series. Your task is to evaluate \
whether a student's answer to a Chinese language exercise is correct, even if \
it differs from the provided answer key.

CRITICAL RULES:
- The textbook uses ONLY Traditional Chinese characters (繁體字) - evaluate answers accordingly
- Consider semantic equivalence, not just exact string matching
- For Sentence Construction: accept valid alternative word orderings that are \
grammatically correct and convey the same meaning
- For Dialogue Completion: accept responses that are contextually appropriate \
and grammatically correct, even if different from the answer key
- Always provide a brief educational explanation
- List 1-3 alternative valid answers when they exist (in Traditional Chinese)
- Respond ONLY with valid JSON, no additional text
"""

ANSWER_VALIDATION_PROMPT = """\
Evaluate the following student answer for a {exercise_type} exercise.

## Question
{question}

## Expected Answer (from answer key)
{correct_answer}

## Student's Answer
{user_answer}

## Evaluation Criteria
For {exercise_type}:
- Is the student's answer grammatically correct?
- Does it convey the same meaning as the expected answer?
- Is it a valid response to the question, even if different from the key?

## Required Output Format
Return ONLY a JSON object with this exact structure:
{{
  "is_correct": true or false,
  "explanation": "Brief explanation of why the answer is correct or incorrect (1-2 sentences)",
  "alternatives": ["alt1", "alt2"]
}}

- "is_correct": true if the student's answer is a valid response, false otherwise
- "explanation": educational feedback for the student
- "alternatives": list of 1-3 other valid answers (may include the answer key if different \
from student's answer). Empty list if no alternatives exist.
"""

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

# ---------------------------------------------------------------------------
# Content evaluation prompts (Evaluator-Optimizer pattern)
# ---------------------------------------------------------------------------

CONTENT_EVALUATION_SYSTEM_PROMPT = """\
You are a strict quality evaluator for Chinese language quiz content generated \
for the 當代中文課程 (A Course in Contemporary Chinese) textbook series.

Your ONLY job is to check generated quiz questions against 5 mandatory rules. \
You must be extremely thorough and flag ANY violation, no matter how minor.

You respond ONLY with valid JSON matching the required schema. No additional text.
"""

CONTENT_EVALUATION_PROMPT = """\
Evaluate the following generated quiz questions against ALL 5 rules below.

## Rules to Check

### Rule 1: Traditional Chinese Only (traditional_chinese)
ALL Chinese text in every field (character, options, sentence, passage, dialogue_bubbles, \
left_items, right_items, scrambled_words, word_bank, correct_answer if Chinese) \
MUST use Traditional Chinese characters (繁體字).
Flag ANY Simplified Chinese character (简体字). Common violations:
- 学 → should be 學, 习 → should be 習, 书 → should be 書
- 说 → should be 說, 话 → should be 話, 语 → should be 語
- 这 → should be 這, 对 → should be 對, 时 → should be 時

### Rule 2: Pinyin Diacritics (pinyin_diacritics)
ALL pinyin text MUST use tone mark diacritics (ā, á, ǎ, à, ē, é, ě, è, etc.).
Flag ANY of these violations:
- Tone numbers: xue2, ni3, hao3, ma1 → should be xué, nǐ, hǎo, mā
- Bare pinyin without tones: xue, ni, hao → must have diacritics
- Mixed formats: some with diacritics, some without

### Rule 3: Question Text Language (question_language)
The "question_text" field MUST be in English (the UI language).
Flag if question_text is written in Chinese or any other language.
Examples of violations:
- "哪個字對應拼音 'bàba'?" → should be "Which character corresponds to the pinyin 'bàba'?"
- "選出正確的答案" → should be "Select the correct answer"

### Rule 4: Curriculum Alignment (curriculum_alignment)
Questions should test vocabulary, grammar, and content that plausibly belongs \
to the specified textbook chapter. Flag questions that test obviously \
advanced or unrelated content for the given book and chapter level.

### Rule 5: Pedagogical Quality (pedagogical_quality)
- Distractor options must be plausible (not obviously wrong or random)
- Explanations must be present and educational
- Questions must be clear and unambiguous
- For matching exercises, pairs must be logically related

## Questions to Evaluate

```json
{questions_json}
```

## Required Output Format

Return ONLY a JSON object with this exact structure:
{{
  "passed": true or false,
  "issues": [
    {{
      "question_id": "q1",
      "rule": "traditional_chinese",
      "detail": "Field 'character' contains Simplified '学' — should be Traditional '學'"
    }}
  ]
}}

- "passed": true ONLY if ALL questions pass ALL 5 rules with zero violations
- "issues": array of violation objects (empty array if passed is true)
- Each issue must specify the exact question_id, rule name, and a specific detail

Be thorough. Check EVERY question against EVERY rule.
"""
