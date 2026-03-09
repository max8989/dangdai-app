# Story 1.10: Create Structured Content Tables and Additional Schema

Status: ready-for-dev

## Story

As a developer,
I want to add structured content tables and missing user data tables to the Supabase schema,
So that curriculum data can be seeded and quiz generation can use structured content as the primary source.

## Acceptance Criteria

1. **Given** the Supabase project has the base schema from Story 1.3
   **When** I apply the structured content migration
   **Then** the `vocabulary` table is created with columns: id, book_id, lesson_id, vocab_section, traditional, pinyin, english, part_of_speech, is_name, sort_order

2. **Given** the structured content migration is applied
   **When** I check the `dialogues` table
   **Then** it exists with columns: id, book_id, lesson_id, dialogue_number, title_traditional, title_english, lines (JSONB)

3. **Given** the structured content migration is applied
   **When** I check the `grammar_points` table
   **Then** it exists with columns: id, book_id, lesson_id, grammar_order, title_english, title_chinese, function_description, structure_pattern, usage_notes, examples (JSONB), sort_order

4. **Given** the structured content migration is applied
   **When** I check the `premade_exercises` table
   **Then** it exists with columns: id, book_id, lesson_id, exercise_type, exercise_order, title, instructions, content (JSONB), difficulty, source_page_range

5. **Given** the structured content migration is applied
   **When** I check the `paused_quizzes` table
   **Then** it exists with columns: id, user_id, chapter_id, exercise_type, quiz_state (JSONB), paused_at, expires_at, created_at, updated_at
   **And** a UNIQUE constraint exists on (user_id, chapter_id, exercise_type)

6. **Given** all tables are created
   **When** I check indexes
   **Then** indexes exist on: vocabulary(book_id, lesson_id), grammar_points(book_id, lesson_id), dialogues(book_id, lesson_id), premade_exercises(book_id, lesson_id, exercise_type), paused_quizzes(user_id), paused_quizzes(expires_at)

7. **Given** all tables are created
   **When** I check Row Level Security
   **Then** RLS is enabled on structured content tables with read-only access for all authenticated users
   **And** RLS is enabled on paused_quizzes with users reading/writing own data only

## Tasks / Subtasks

- [ ] Task 1: Create structured content tables migration (AC: #1, #2, #3, #4)
  - [ ] 1.1 Create `vocabulary` table with all columns and proper types
  - [ ] 1.2 Create `dialogues` table with JSONB `lines` column
  - [ ] 1.3 Create `grammar_points` table with JSONB `examples` column
  - [ ] 1.4 Create `premade_exercises` table with JSONB `content` column
  - [ ] 1.5 Add CHECK constraints on exercise_type ENUM values

- [ ] Task 2: Create paused_quizzes table (AC: #5)
  - [ ] 2.1 Create `paused_quizzes` table with JSONB `quiz_state` column
  - [ ] 2.2 Add UNIQUE constraint on (user_id, chapter_id, exercise_type)
  - [ ] 2.3 Add foreign key to auth.users(id) with ON DELETE CASCADE
  - [ ] 2.4 Add default expressions for paused_at and expires_at (NOW() + 7 days)

- [ ] Task 3: Create indexes (AC: #6)
  - [ ] 3.1 Add composite indexes on structured content tables (book_id, lesson_id)
  - [ ] 3.2 Add index on premade_exercises(book_id, lesson_id, exercise_type)
  - [ ] 3.3 Add index on paused_quizzes(user_id) and paused_quizzes(expires_at)
  - [ ] 3.4 Add index on vocabulary(traditional) for lookup queries

- [ ] Task 4: Configure Row Level Security (AC: #7)
  - [ ] 4.1 Enable RLS on vocabulary, dialogues, grammar_points, premade_exercises
  - [ ] 4.2 Create read-only SELECT policy for authenticated users on content tables
  - [ ] 4.3 Enable RLS on paused_quizzes with SELECT/INSERT/UPDATE/DELETE policies for own data
  - [ ] 4.4 Use optimized `(select auth.uid())` subquery pattern for all policies

- [ ] Task 5: Apply migration and verify (AC: all)
  - [ ] 5.1 Apply migration via Supabase MCP `apply_migration` tool
  - [ ] 5.2 Verify all tables exist with correct columns using `list_tables`
  - [ ] 5.3 Run security and performance advisors
  - [ ] 5.4 Generate updated TypeScript types via `generate_typescript_types`

## Dev Notes

### Migration SQL

Apply as a single migration named `create_structured_content_tables`:

```sql
-- Migration: create_structured_content_tables
-- Description: Add structured content tables for curriculum data and paused quizzes

-- ============================================================
-- STRUCTURED CONTENT TABLES (read-only for authenticated users)
-- ============================================================

-- Vocabulary table: ~3,000 items from Flash-card.tsv for Books 1-4
CREATE TABLE IF NOT EXISTS public.vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    vocab_section TEXT NOT NULL CHECK (vocab_section IN ('I', 'II')),
    traditional TEXT NOT NULL,
    pinyin TEXT NOT NULL,
    english TEXT NOT NULL,
    part_of_speech TEXT,
    is_name BOOLEAN DEFAULT FALSE NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Dialogues table: ~108 dialogues (2 per lesson × 54 lessons)
CREATE TABLE IF NOT EXISTS public.dialogues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    dialogue_number INTEGER NOT NULL CHECK (dialogue_number IN (1, 2)),
    title_traditional TEXT,
    title_english TEXT,
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Grammar points table: ~4-6 per lesson × 54 lessons
CREATE TABLE IF NOT EXISTS public.grammar_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    grammar_order INTEGER NOT NULL,
    title_english TEXT NOT NULL,
    title_chinese TEXT,
    function_description TEXT,
    structure_pattern TEXT,
    usage_notes TEXT,
    examples JSONB NOT NULL DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Premade exercises table: restructured workbook exercises
CREATE TABLE IF NOT EXISTS public.premade_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    exercise_type TEXT NOT NULL CHECK (exercise_type IN (
        'listening', 'reading', 'fill_in_blank', 'dialogue_completion',
        'sentence_construction', 'matching', 'character_writing',
        'composition', 'pronunciation'
    )),
    exercise_order INTEGER NOT NULL,
    title TEXT,
    instructions TEXT,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_page_range TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- INDEXES ON STRUCTURED CONTENT TABLES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_vocabulary_book_lesson ON public.vocabulary(book_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_traditional ON public.vocabulary(traditional);
CREATE INDEX IF NOT EXISTS idx_dialogues_book_lesson ON public.dialogues(book_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_grammar_points_book_lesson ON public.grammar_points(book_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_premade_exercises_book_lesson_type ON public.premade_exercises(book_id, lesson_id, exercise_type);

-- ============================================================
-- RLS ON STRUCTURED CONTENT TABLES (read-only for authenticated)
-- ============================================================

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premade_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vocabulary"
    ON public.vocabulary FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read dialogues"
    ON public.dialogues FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read grammar_points"
    ON public.grammar_points FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read premade_exercises"
    ON public.premade_exercises FOR SELECT
    USING (auth.role() = 'authenticated');

-- ============================================================
-- PAUSED QUIZZES TABLE (user-specific data)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.paused_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chapter_id INTEGER NOT NULL,
    exercise_type TEXT NOT NULL,
    quiz_state JSONB NOT NULL,
    paused_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT paused_quizzes_user_chapter_unique UNIQUE (user_id, chapter_id, exercise_type)
);

CREATE INDEX IF NOT EXISTS idx_paused_quizzes_user_id ON public.paused_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_paused_quizzes_expires_at ON public.paused_quizzes(expires_at);

-- Apply updated_at trigger (reuse existing function from Story 1.3)
CREATE TRIGGER set_paused_quizzes_updated_at
    BEFORE UPDATE ON public.paused_quizzes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS on paused_quizzes (users own data only)
ALTER TABLE public.paused_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own paused quizzes"
    ON public.paused_quizzes FOR SELECT
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own paused quizzes"
    ON public.paused_quizzes FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own paused quizzes"
    ON public.paused_quizzes FOR UPDATE
    USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own paused quizzes"
    ON public.paused_quizzes FOR DELETE
    USING ((select auth.uid()) = user_id);
```

### JSONB Schema References

**`dialogues.lines` JSONB:**
```json
[
  { "speaker": "A", "traditional": "你好嗎？", "simplified": "你好吗？", "pinyin": "Nǐ hǎo ma?", "english": "How are you?" },
  { "speaker": "B", "traditional": "我很好。", "simplified": "我很好。", "pinyin": "Wǒ hěn hǎo.", "english": "I'm fine." }
]
```

**`grammar_points.examples` JSONB:**
```json
[
  { "traditional": "我想學中文。", "pinyin": "Wǒ xiǎng xué Zhōngwén.", "english": "I want to learn Chinese." }
]
```

**`premade_exercises.content` JSONB (by exercise_type):**
- Fill-in-the-blank: `{ "sentences": [{ "text_with_blanks": "...", "word_bank": ["..."], "correct_answers": ["..."] }] }`
- Matching: `{ "pairs": [{ "prompt": "...", "response": "..." }] }`
- Sentence construction: `{ "sentences": [{ "scrambled_words": ["..."], "correct_order": "..." }] }`
- Reading comprehension: `{ "passage": "...", "questions": [{ "question": "...", "options": ["..."], "correct_answer": "..." }] }`

**`paused_quizzes.quiz_state` JSONB:**
```typescript
{
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<number, string>;
  startedAt: string;
  timeElapsed: number;
  exerciseType: string;
  chapterId: number;
  bookId: number;
}
```

### Database Naming Conventions (MUST FOLLOW)

From Architecture and Story 1.3:
- **Tables:** snake_case, plural (`vocabulary`, `grammar_points`)
- **Columns:** snake_case (`book_id`, `lesson_id`, `sort_order`)
- **Indexes:** `idx_{table}_{column}` pattern
- **Constraints:** descriptive names (`paused_quizzes_user_chapter_unique`)
- **RLS policies:** Use optimized `(select auth.uid())` subquery pattern

### Content Coverage (Expected After Seeding — Epic 11)

| Book | Lessons | Vocab Items | Dialogues | Grammar Points | Premade Exercises |
|------|---------|-------------|-----------|----------------|-------------------|
| 1    | 15      | ~568        | ~30       | ~60-90         | ~133 chunks       |
| 2    | 15      | ~658        | ~30       | ~60-90         | ~122 chunks       |
| 3    | 12      | ~850        | ~24       | ~48-72         | ~69 chunks        |
| 4    | 12      | ~997        | ~24       | ~48-72         | ~51 chunks        |

### Verification Steps

```sql
-- Verify all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('vocabulary', 'dialogues', 'grammar_points', 'premade_exercises', 'paused_quizzes');

-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('vocabulary', 'dialogues', 'grammar_points', 'premade_exercises', 'paused_quizzes');

-- Verify indexes
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('vocabulary', 'dialogues', 'grammar_points', 'premade_exercises', 'paused_quizzes');

-- Verify policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('vocabulary', 'dialogues', 'grammar_points', 'premade_exercises', 'paused_quizzes');
```

### Anti-Patterns to Avoid

- **DO NOT** use camelCase for database columns — use snake_case
- **DO NOT** skip RLS on any table — all tables must have RLS enabled
- **DO NOT** use `auth.uid()` directly in policies — use `(select auth.uid())` subquery pattern
- **DO NOT** allow write access to structured content tables from client — content is read-only, seeded via service key
- **DO NOT** create the `daily_activity` table here if it already exists from Story 1.3

### Dependencies

- **Depends on:** Story 1.3 (base schema, `handle_updated_at` function must exist)
- **Blocks:** Epic 11 (content seeding needs these tables), Story 4.14 (structured content quiz generation), Story 4.10b (pause/resume needs `paused_quizzes`)

### Project Structure Notes

This story only creates database tables via Supabase migration. No mobile app or backend code changes.

After migration, run `generate_typescript_types` to update `dangdai-mobile/types/supabase.ts` with the new table types.

### References

- [Source: architecture.md#Data-Architecture] — Structured content table schemas
- [Source: architecture.md#Quiz-Pause-Resume-Architecture] — paused_quizzes schema
- [Source: epics.md#Story-1.10] — Story requirements
- [Source: 1-3-configure-supabase-project-and-base-schema.md] — Base schema and `handle_updated_at` function

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
