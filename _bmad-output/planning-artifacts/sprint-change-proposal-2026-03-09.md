# Sprint Change Proposal — Epic 11 Retrospective Correct Course

**Date:** 2026-03-09
**Workflow:** correct-course
**Prepared by:** Claude Code (BMAD Correct Course Workflow)
**Reviewed by:** Maxime (Product Owner)
**Change scope:** Minor — direct implementation by development team

---

## Section 1: Issue Summary

### Problem Statement

Epic 11 (Content Seeding & Structured Data Pipeline) completed successfully — 8 stories, 402 passing tests, clean lint and type checks throughout. However, the retrospective (2026-03-09) revealed three categories of issues that must be resolved before the next sprint begins:

**Issue 1 — Missing coding patterns in story template (Process gap)**
Five recurring issues were caught in code review across multiple Epic 11 stories rather than being present from the start: quality threshold for LLM calls (found in 11.3 and 11.4), deduplication before upsert (found in 11.3 and 11.4), inline query keys instead of centralized factory (found in 11.5), missing `staleTime` for static content (found in 11.5), and missing accessibility attributes on pressable cards (found in 11.5). Each was fixed in code review but could have been written correctly the first time if the story template had included these requirements explicitly.

**Issue 2 — Structured content tables have 0 rows (Data pipeline blocker)**
Three of four structured content tables are empty: `grammar_points`, `dialogues`, and `premade_exercises` all have 0 rows because the seeding scripts (Stories 11.2, 11.3, 11.4) require a real LLM API key to run and the actual seeding was deferred. Story 4.14 (Migrate Quiz Generation to Structured Content) is `ready-for-dev` and is the highest-priority next story, but it cannot be meaningfully developed or tested against empty tables. NFR13, NFR27, and NFR28 are currently unmet.

**Issue 3 — Browse screens are incomplete as a user-facing feature (Navigation gap)**
Browse screens for Vocabulary (11.5), Grammar (11.6), and Dialogues (11.7) are complete with 143 passing tests. Story 3.5 completion notes confirm stub navigation was wired from the Exercise Type Selection screen. However, this navigation wiring was never formalised as a tracked story with acceptance criteria and end-to-end tests, leaving the feature in a partially-reachable state that is not validated from the main navigation flow.

### Discovery Context

All three issues were surfaced during the Epic 11 retrospective (2026-03-09), which was the first retrospective for this project. They were not discovered through user-facing defects but through code review patterns and post-epic assessment.

### Evidence

- Retro section 3.1–3.5: recurring code review findings with `[RECURRING]` tag
- Retro section 6.1: data pipeline status table showing 0 rows for 3 tables
- Retro section 3.8 and 6.2: navigation gap documented with `⚠️ Not wired from 3.5`
- Story 3.5 completion notes: "browse → vocabulary/grammar/dialogues" listed as done, but no standalone story or tests verify the full navigation path

---

## Section 2: Impact Analysis

### Epic Impact

| Epic | Impact | Details |
|------|--------|---------|
| Epic 3 (Content Navigation) | Moderate | Missing Story 3.7; browse screens exist but navigation not formally tracked or E2E tested |
| Epic 4 (Quiz Experience) | High | Story 4.14 blocked by empty structured content tables (A10) |
| Epic 11 (Content Seeding) | None | Complete — 8/8 stories done, retrospective done |
| Epics 5–10 | Low | Future seeding/hook/component stories will benefit from updated template; no structural change |

### Story Impact

| Story | Impact | Details |
|-------|--------|---------|
| 4.14 (Migrate quiz gen) | Blocked | Cannot be tested until grammar_points/dialogues tables populated (0 rows) |
| 3.6 (Expand Book Selection) | Unblocked | Vocabulary data confirmed (3,997 rows); readiness criteria met |
| 4.10b (Quiz Pause/Resume) | Unblocked | Independent of Epic 11 data |
| 1.9 (Request Cancellation) | Unblocked | Independent of Epic 11 data |
| **3.7 (Browse Nav — NEW)** | New story | Formally tracks the navigation wiring action item (A7) |

### Artifact Conflicts

| Artifact | Conflict | Resolution |
|----------|----------|------------|
| PRD NFR13, NFR27, NFR28 | Currently unmet — 3 tables empty | Resolved by completing A10 (seeding); no PRD text change needed |
| `epics.md` | Missing Story 3.7 | **Applied** — Story 3.7 added to Epic 3 |
| `sprint-status.yaml` | Missing 3.7 entry | **Applied** — `3-7-wire-browse-screen-navigation: ready-for-dev` added |
| Story template | Missing mandatory patterns | **Applied** — Seeding, hook, and component pattern sections added |
| Story 4.14 | Missing explicit prerequisite block | **Applied** — A10 prerequisite checklist added to Dev Notes |

### Technical Impact

- No code changes in this proposal — all changes are to planning artifacts and templates
- No database schema changes
- No API contract changes
- No mobile app UI changes (those come in Story 3.7 implementation)

---

## Section 3: Recommended Approach

**Selected path: Option 1 — Direct Adjustment**

No rollback of any completed work is needed. No MVP scope reduction is warranted. Epic 11 work is solid. The correct course is three targeted adjustments before the next sprint begins:

1. **Template update** (done): Encode the recurring patterns from retro A1–A9 directly into the story creation template so future stories start with these requirements rather than discovering them in code review.

2. **Prerequisite gate on Story 4.14** (done): Add an explicit blocker checklist to Story 4.14's Dev Notes requiring A10 (seeding run with real LLM API key) to be completed before dev starts.

3. **Formalise Story 3.7** (done): Create a tracked story for browse screen navigation wiring so it has acceptance criteria, is assigned, and completion can be verified rather than remaining in an ambiguous "partially done" state.

**Rationale:**
- Effort: Low — all artifact changes already applied; remaining effort is Story 3.7 implementation (small) and running seeding scripts (ops task)
- Risk: Low — no architectural changes, no rollback, no scope reduction
- Timeline impact: Minimal — Story 4.14 was already waiting on A10; formalising that wait as a prerequisite adds no delay
- Team morale: Positive — retro action items are now tracked and unambiguous

---

## Section 4: Detailed Change Proposals

All four proposals have been reviewed and applied (Incremental mode, all approved by Maxime).

### P1: Story Creation Template — Mandatory Pattern Sections

**File:** `_bmad/bmm/workflows/4-implementation/create-story/template.md`
**Status:** Applied

Added three new sections to `## Dev Notes`:

- **Seeding Script Patterns** — 7 mandatory items for any Python seeding/LLM extraction story: quality threshold, deduplication before upsert, lazy LLM instantiation, JSON parsing with fallback, schema validation of LLM output, rate limiting, DB UNIQUE constraint verification. Sourced from retro A1, A2, A6, A9.

- **Mobile Hook Patterns** — 2 mandatory items for any TanStack Query hook story: queryKeys factory requirement, staleTime for static content. Sourced from retro A3, A4.

- **Mobile Component Patterns** — 2 mandatory items for any pressable component story: accessibility attributes (`accessibilityRole`, `accessibilityLabel`), co-located component tests. Sourced from retro A5, A8.

### P2: epics.md — New Story 3.7

**File:** `_bmad-output/planning-artifacts/epics.md`
**Status:** Applied

Added Story 3.7 "Wire Browse Screen Navigation from Exercise Type Selection" to Epic 3. Story includes:
- Acceptance criteria for all three browse routes (vocabulary, grammar, dialogues)
- Graceful degradation for chapters without content (matching 42P01 pattern)
- Note referencing Story 3.5 completion and clarifying this story's scope
- FR55–FR57 coverage map updated to include `Epic 3 (Story 3.7)`
- `updateHistory` frontmatter updated with 2026-03-09 entry

### P3: sprint-status.yaml — Story 3.7 Entry

**File:** `_bmad-output/implementation-artifacts/sprint-status.yaml`
**Status:** Applied

Added: `3-7-wire-browse-screen-navigation: ready-for-dev` to the Epic 3 block.

### P4: Story 4.14 Dev Notes — Prerequisite Block

**File:** `_bmad-output/implementation-artifacts/4-14-migrate-quiz-generation-to-structured-content.md`
**Status:** Applied

Added a `### Prerequisites — MUST be completed before dev starts` section with a `BLOCKER` callout explaining that `grammar_points`, `dialogues`, and `premade_exercises` currently have 0 rows, and a six-item checklist of seeding verification steps that must be completed before the dev agent picks up this story.

---

## Section 5: Implementation Handoff

### Change Scope Classification: **Minor**

All planning artifact changes are already applied. The remaining work is:

1. **Ops task (Maxime — HIGH priority, before 4.14 starts):**
   Run the three LLM-based seeding scripts with a real API key and verify coverage. This is a manual operations task, not a development story.

2. **Story 3.7 (Dev team — MEDIUM priority, can run in parallel with 4.10b and 3.6):**
   Implement and test the browse screen navigation wiring. Small story — the screens and stub navigation already exist from Story 3.5.

3. **Story template (Effective immediately):**
   The updated template applies to all future stories from this point forward. No action needed — it is already in place.

### Sprint Queue — Recommended Sequence

| Priority | Item | Owner | Blocker |
|----------|------|-------|---------|
| 1 | Run seeding scripts (A10) | Maxime | LLM API key required |
| 2 | Story 4.14 | Dev | Blocked until A10 complete |
| 2 | Story 4.10b (Quiz Pause/Resume) | Dev | None — start immediately |
| 2 | Story 3.6 (Expand Book Selection) | Dev | None — start immediately |
| 3 | Story 3.7 (Browse Nav) | Dev | None — start immediately |
| 3 | Stories 1.8, 1.9, 2.4, 2.5 (in-review/ready) | Dev | Normal review process |

### Success Criteria

- [ ] Seeding scripts run successfully; `grammar_points`, `dialogues`, `premade_exercises` have data for all 54 lessons
- [ ] Story 4.14 implemented and all tests pass
- [ ] Story 3.7 implemented; all three browse routes reachable and tested from Exercise Type Selection
- [ ] No new story written without consulting the updated template patterns
- [ ] No new code-review-caught instance of quality threshold, dedup, queryKeys, staleTime, or accessibility issues

---

*Sprint Change Proposal generated: 2026-03-09*
*Workflow: correct-course*
*All artifact changes applied — proposal ready for approval*
