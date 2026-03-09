# Story {{epic_num}}.{{story_num}}: {{story_title}}

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a {{role}},
I want {{action}},
so that {{benefit}}.

## Acceptance Criteria

1. [Add acceptance criteria from epics/PRD]

## Tasks / Subtasks

- [ ] Task 1 (AC: #)
  - [ ] Subtask 1.1
- [ ] Task 2 (AC: #)
  - [ ] Subtask 2.1

## Dev Notes

- Relevant architecture patterns and constraints
- Source tree components to touch
- Testing standards summary

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### Seeding Script Patterns (required for any Python seeding/LLM extraction story)

If this story involves a seeding script or LLM-based content extraction, include ALL of
the following from the start (do not wait for code review to catch these):

1. **Quality threshold** — Skip chunks where `content_quality < 0.5`:
   `if chunk.get("metadata", {}).get("content_quality", 1.0) < 0.5: continue`
2. **Deduplication before upsert** — For chunked content, keep the last extraction per
   unique key (later chunks = more complete content) before calling `assign_*_order()`.
3. **Lazy LLM instantiation** — Create LLM client only on first non-dry-run call so
   `--dry-run` works without API keys (important for CI and local testing).
4. **JSON parsing with fallback** — Strip markdown code fences before `json.loads()`.
5. **Schema validation of LLM output** — Validate structure, not just types.
6. **Rate limiting** — Add `asyncio.sleep()` between API calls.
7. **DB UNIQUE constraint verification** — Before writing upsert logic, verify the actual
   constraint against the live Supabase DB (not story documentation).

[Source: epic-11-retro-2026-03-09.md#3.1, 3.2, 3.7, 4.3]

### Mobile Hook Patterns (required for any TanStack Query hook story)

If this story involves a new TanStack Query hook:

1. **queryKeys factory** — All new hooks MUST add their key to `lib/queryKeys.ts`.
   Never use inline arrays like `['vocabulary', bookId]` directly.
2. **staleTime for static content** — Hooks querying static textbook content
   (vocabulary, grammar, dialogues, premade exercises) MUST use
   `staleTime: 1000 * 60 * 30` (30 minutes). Dynamic content (quiz results, progress)
   uses shorter or no staleTime.

[Source: epic-11-retro-2026-03-09.md#3.3, 3.4]

### Mobile Component Patterns (required for any pressable component story)

If this story creates pressable UI components (Cards, ListItems, Buttons with custom behavior):

1. **Accessibility** — Every pressable Card MUST have `accessibilityRole` and
   `accessibilityLabel`. Reference existing pattern: `ChapterListItem`, `BookCard`.
2. **Co-located component tests** — Each component file must have a co-located
   `*.test.tsx` file. Do not rely solely on screen-level tests.

[Source: epic-11-retro-2026-03-09.md#3.5, 3.8]

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
