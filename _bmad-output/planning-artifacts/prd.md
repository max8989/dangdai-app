---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-e-01-discovery', 'step-e-02-review', 'step-e-03-edit']
inputDocuments:
  - '/home/maxime/repos/dangdai-app/project-requirement.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/brainstorming/brainstorming-session-20260214.md'
  - '/home/maxime/repos/dangdai-app/dangdai-rag/CLAUDE.md'
  - '/home/maxime/repos/dangdai-app/dangdai-rag/CHUNKER_README.md'
  - '/home/maxime/repos/dangdai-app/Flash-card.tsv'
  - 'Teng Shou-hsin. 當代中文課程 1 (課本) A Course in Contemporary Chinese 1 (Textbook)-28-49.pdf'
  - 'Teng Shou-hsin. 當代中文課程 1 (作業本) A Course in Contemporary Chinese 1 (Workbook)-001.pdf'
  - '/home/maxime/repos/dangdai-app/dangdai-rag/output_chunks/workbook1_chunks.json'
  - '/home/maxime/repos/dangdai-app/dangdai-rag/rag_query.py'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 4
  referenceFiles: 4
classification:
  projectType: mobile_app
  domain: edtech
  complexity: medium-high
  projectContext: brownfield
  quizGeneration: ai_dynamic_rag_adaptive
  initialScope: friends_group
lastEdited: 'Sat Apr 11 2026'
editHistory:
  - date: 'Sat Apr 11 2026'
    changes: 'Re-introduced on-the-fly AI-generated exercises as a user-opt-in alongside premade exercises. User picks Premade or Generate-with-AI per exercise type at the selection screen. Provider swapped from Azure OpenAI → OpenAI (gpt-5). Generation collapsed from 2 LLM calls to 1 (validation metadata baked into the generation payload — zero runtime LLM calls for answer validation). Added FR59-FR62 for user-choice, on-the-fly generation, cancellation, and cache-on-generate behavior. NFR1 latency budget updated to 15-20s for on-the-fly generation; NFR31 cost ceiling relaxed (quality over cost per product decision).'
  - date: 'Sun Mar 08 2026'
    changes: 'Structured content architecture: Added structured content tables (vocabulary, dialogues, grammar_points) as primary source for quiz generation, replacing RAG-only approach. Added premade workbook exercises (premade_exercises table). Expanded content scope from Books 1-2 to Books 1-4. Added FR51-FR58 for premade exercises, content browsing, and grammar coverage. Updated NFRs for structured content reliability. Chapter view redesigned to show premade + custom AI exercises.'
  - date: 'Thu Feb 20 2026'
    changes: 'Major expansion: Added 10 workbook exercise types, RAG-powered quiz generation, agentic adaptive learning with performance memory, weakness profiles. FR count expanded from 35 to 50, NFR count from 21 to 31.'
---

# Product Requirements Document - dangdai-app

**Author:** Maxime  
**Date:** Sun Mar 08 2026  
**Version:** 3.0 (Edit: Structured content tables, premade exercises, Books 1-4)

## Executive Summary

**Product:** Dangdai App - a gamified Chinese learning mobile app for NTNU 當代中文課程 (A Course in Contemporary Chinese) textbook series, powered by RAG-driven AI quiz generation and adaptive learning.

**Vision:** Enable NTNU alumni to continue their Chinese studies after leaving Taiwan through a Duolingo-style mobile experience that mirrors the familiar Dangdai curriculum, with an AI teacher that adapts to each learner's strengths and weaknesses.

**Target Users:** Friends who studied Chinese at NTNU Taiwan (5 initial users), expanding to 100 NTNU alumni within 12 months.

**Platform:** Cross-platform mobile app (iOS & Android) using React Native with Expo.

**Differentiator:** Unlike generic Chinese learning apps, Dangdai App:
- Follows the exact NTNU curriculum structure - same vocabulary, grammar patterns, and chapter progression
- Uses **structured content tables** (vocabulary, grammar, dialogues) from the actual textbooks as the primary source for AI quiz generation — no hallucinated content
- Provides **premade workbook exercises** from the official workbook for instant practice without LLM latency or cost
- Generates **7 workbook-style exercise types** on the fly using structured content + AI, ensuring ALL grammar points per chapter are covered
- Features an **agentic AI teacher with memory** that tracks learner performance across sessions and adaptively focuses on weak areas

**Core Value Proposition:** "Continue your NTNU Chinese journey, anywhere in the world - with an AI teacher that knows exactly what you need to practice."

## Success Criteria

### User Success

**Engagement:**
- Users engage 3+ times per week with sessions of 15+ minutes
- Gamification (points, streaks, progress visualization) creates "fun" learning experience

**Learning:**
- Users score 80%+ on vocabulary and grammar quizzes to feel "ready" for next chapter
- Cumulative learning reinforces knowledge from previous chapters

**"Aha!" Moment:**
- First chapter quiz completion with visible progress toward mastery
- AI coach identifies specific weaknesses (Phase 2)

### Business Success

| Milestone | Target |
|-----------|--------|
| 3-Month MVP | 5 active friends using weekly |
| 12-Month Growth | 100 NTNU alumni actively using |

### Technical Success

- AI-generated quizzes match NTNU workbook quality across all 7 exercise types
- Structured content tables provide accurate, complete curriculum data for quiz generation
- Premade workbook exercises work instantly without LLM dependency
- Adaptive learning system correctly identifies weak areas and adjusts quiz content
- User progress and performance memory persist reliably across sessions
- Quiz generation produces valid, curriculum-aligned exercises covering ALL grammar points per chapter

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Weekly Active Users (3-month) | 5 friends |
| Weekly Active Users (12-month) | 100 users |
| Session frequency | 3+ per week |
| Session duration | 15+ minutes |
| Chapter mastery threshold | 80%+ quiz scores |
| Retention (week-over-week) | 70%+ |
| Exercise type coverage | All 7 MVP types available per chapter + premade workbook exercises |
| Content accuracy | 100% of generated quiz content sourced from structured content tables (no hallucination) |
| Adaptive quiz accuracy | 70%+ of adaptive questions target documented weak areas |
| Weak area improvement | Users improve weak-area scores by 20%+ over 5 sessions |

## Product Scope & Roadmap

### Phase 1: MVP (Month 1-2)

**Goal:** Prove core learning value with diverse, RAG-powered quizzes and adaptive learning.

| Feature | Description |
|---------|-------------|
| User Authentication | Email + Apple Sign-In via Supabase |
| Book/Chapter Selection | Browse Books 1-4, open navigation (54 lessons: 15+15+12+12) |
| Structured Content Database | Vocabulary, grammar points, and dialogues stored in structured tables from official textbooks |
| Premade Workbook Exercises | Pre-existing workbook exercises available per chapter — instant practice, no LLM needed |
| AI-Powered Quiz Engine | On-the-fly quiz generation using structured content tables as primary source (vocabulary, grammar, dialogues) |
| Multiple Exercise Types (MVP set) | Vocabulary (character/pinyin/meaning), Grammar (sentence completion, pattern recognition), Fill-in-the-Blank, Matching, Dialogue Completion, Sentence Construction, Reading Comprehension |
| Exercise Type Selection | User chooses exercise type per chapter, or "Mixed" for variety. Chapter view shows both premade exercises and AI-generated options |
| Grammar Coverage | AI-generated quizzes guarantee ALL grammar points for a chapter are covered |
| Scoring & Feedback | Immediate per-answer feedback, points per correct answer, explanations citing textbook source |
| Performance Memory | Per-question results saved (correct/incorrect, exercise type, vocabulary item, time spent) |
| Adaptive Quiz Generation | AI uses learner weakness profile to bias quiz content toward weak areas |
| Weakness Dashboard | User sees summary of weak vocabulary, grammar patterns, and exercise types |
| Progress Tracking | Chapter completion %, quiz history, per-exercise-type mastery |
| Daily Streak | Consecutive days tracking |
| Dashboard | Progress, streak, recent activity, weakness summary |

**Explicitly Excluded from MVP:**
- Friend leaderboards
- Push notifications
- Offline mode
- Audio playback for listening exercises
- Pronunciation practice with microphone
- Character handwriting input
- Composition/essay exercises (requires free-text AI grading)
- Books 5-6 content

### Phase 2: Growth (Month 3-6)

- Friend leaderboard and social comparison
- Push notification reminders
- Spaced repetition algorithm integrated with performance memory
- Pronunciation/tone exercises (with audio playback, no mic yet)
- Character writing exercises (typed input, stroke order display)
- Books 5-6 content expansion (data sources already available)
- Enhanced AI teacher: proactive learning suggestions ("You should review Chapter 3 grammar")

### Phase 3: Vision (Month 6-12)

- Listening comprehension with audio playback
- Pronunciation practice with microphone input
- Character handwriting recognition (camera/touch)
- Composition exercises with AI grading
- Community features (study groups)
- Web app companion
- Export learning data / progress reports

## User Journeys

> **Note:** These journeys represent the full product vision. MVP supports Journeys 1, 2, and 3 fully (adaptive learning is MVP). Journey 4 is Phase 2.

### Journey 1: Marie - New Learner (Invited Friend)

**Opening Scene:**
Marie receives a WhatsApp message from Maxime: "Hey! I built an app for us to keep practicing Dangdai. Want to try it?" She clicks the invite link, curious but skeptical.

**Rising Action:**
- Signs up with simple login
- Selects Book 2, Chapter 10 - where she left off at NTNU
- Sees exercise types: Vocabulary, Fill-in-the-Blank, Dialogue Completion, Matching, Grammar...
- Starts vocabulary quiz: 她, 喜歡, 咖啡... "This is exactly like the NTNU workbook!"
- Tries a Dialogue Completion exercise: completes conversations from Chapter 10
- Gets 7/10 correct on vocabulary, 8/10 on dialogue. Earns 150 points. "Day 1 streak started!"

**Climax:**
After 15 minutes: "Chapter 10 Progress: 15% complete" / "+150 points - Level 1 Learner"
Sees weakness summary: "Review: 比較 vs 比 (grammar pattern)"

**Resolution:**
Marie returns daily. By week's end: 4 sessions with different exercise types. Messages group: "This is exactly like the workbook exercises! 我很喜歡!"

---

### Journey 2: Marie - Returning Learner (Adaptive Learning)

*MVP feature: Adaptive quiz generation with performance memory*

**Opening Scene:**
Monday evening. Marie opens app during commute. Dashboard shows weakness summary: "會 vs 可以 - missed 3 times" and "Sentence Construction - 40% accuracy."

**Rising Action:**
- Dashboard: Book 2, Chapter 12 - 60% complete
- Selects "Mixed" exercise mode for Chapter 12
- AI generates quiz weighted toward her weak areas: 3 grammar questions on 會/可以, 2 sentence construction exercises, plus new vocabulary
- Struggles again with 會 vs 可以 in a fill-in-the-blank context
- Gets the sentence construction right this time - improvement tracked

**Climax:**
Tries "Grammar" exercise type specifically. AI generates focused 會 vs 可以 drill using RAG-retrieved textbook grammar explanation + workbook-style exercises. Finally gets it consistently.

**Resolution:**
+85 points. "Chapter 12: 75% complete." Weakness dashboard updates: "會 vs 可以 - improving!" Sentence Construction accuracy now at 60%.

---

### Journey 3: Marie - Completing a Chapter

**Opening Scene:**
Chapter 12: 95% complete across multiple exercise types. Marie taps "Take Chapter Test."

**Rising Action:**
- Test combines multiple exercise types: vocabulary matching, grammar fill-in-the-blank, dialogue completion, sentence construction, reading comprehension
- 20 questions covering Chapter 12 + cumulative review from earlier chapters
- AI includes extra questions on her documented weak areas from previous chapters
- Finishes in 12 minutes

**Climax:**
Results: 88% - "Chapter 12 Mastered!" Breakdown by exercise type shown.

**Resolution:**
Earns badge and bonus points. Performance memory updated. Weakness profile carries forward to future chapters. Jumps to Chapter 14 to align with private tutor schedule.

---

### Journey 4: Maxime - Admin/Owner

*Phase 2 feature*

**Opening Scene:**
Maxime checks app to see friends' progress.

**Rising Action:**
- Dashboard: 5 active users this week
- Leaderboard: Marie on 12-day streak, Pierre absent 5 days
- Aggregate stats: "Most missed vocab: 會/可以"

**Climax:**
Sends Pierre a nudge: "Your streak is about to break!"

**Resolution:**
Pierre logs in that evening. Friend group stays engaged.

---

### Journey → Capability Mapping

| Capability | Journey | MVP? |
|------------|---------|------|
| Book/chapter selection (Books 1-4) | All | Yes |
| Multiple exercise types (7 types) | All | Yes |
| AI quiz generation (structured content) | All | Yes |
| Premade workbook exercises | 1, 2, 3 | Yes |
| Exercise type selection | 1, 2 | Yes |
| Content browsing (vocab, grammar, dialogues) | 1, 2 | Yes |
| Performance memory (per-question tracking) | All | Yes |
| Adaptive quiz generation (weakness-biased) | 2, 3 | Yes |
| Weakness dashboard | 2 | Yes |
| Progress tracking (per-exercise-type) | 1, 2, 3 | Yes |
| Points & streaks | 1, 2 | Yes |
| Chapter test (multi-type) | 3 | Yes |
| Friend leaderboard | 1, 2, 4 | No (Phase 2) |
| Proactive AI suggestions | 2 | No (Phase 2) |
| Admin dashboard | 4 | No (Phase 2) |
| Notifications | 2, 4 | No (Phase 2) |

## Mobile App Requirements

### Platform Overview

| Attribute | Value |
|-----------|-------|
| Framework | React Native + Expo (managed workflow) |
| Distribution | App Store (iOS) + Google Play (Android) |
| Connectivity | Online-only (LLM requires internet) |
| Min iOS | 13.0+ |
| Min Android | API 21 (5.0)+ |

### Device Permissions (MVP)

| Permission | Required | Purpose |
|------------|----------|---------|
| Internet | Yes | Quiz generation, sync |
| Audio | No (future) | Listening exercises |
| Microphone | No (future) | Pronunciation practice |
| Camera | No (future) | Character recognition |
| Notifications | No (Phase 2) | Streak reminders |

### Store Compliance

**App Store (iOS):**
- Apple Developer Program ($99/year)
- Privacy policy required
- App Review guidelines compliance

**Google Play (Android):**
- Developer account ($25 one-time)
- Privacy policy + data safety section required
- Content rating questionnaire

### Development & Deployment

- Expo managed workflow for rapid iteration
- EAS Build for store submissions
- EAS Update for OTA bug fixes
- TestFlight / Internal Testing for friends beta

## Domain-Specific Requirements

### Privacy & Data

- Authentication via Supabase Auth
- Data stored: email, progress, scores, streaks
- No sensitive data beyond learning metrics
- GDPR: data export/deletion on request

### Content Licensing

- NTNU Dangdai materials: acceptable for personal/educational use (friends group)
- **Action required:** Revisit licensing before scaling beyond 100 users

### Technical Infrastructure

- **Database:** Supabase (PostgreSQL)
- **Structured content tables (PRIMARY):** `vocabulary` (~3,000 items), `grammar_points` (~200-300 points), `dialogues` (~108 dialogues), `premade_exercises` (~375 exercises) — covering Books 1-4 (54 lessons)
- **Vector storage (SUPPLEMENTARY):** Supabase pgvector (`dangdai_chunks` table with embeddings) — used only for culture notes, pronunciation context, not for primary exercise generation
- **LLM:** External API (OpenAI gpt-5, single structured-output call) for on-the-fly exercise generation. Provider is configurable via `LLM_PROVIDER` env var; Azure OpenAI retained as rollback.
- **Content coverage:** Books 1-4 with structured vocabulary, grammar, dialogues, and premade workbook exercises. Content seeded from Flash-card.tsv, textbook chunks/PDFs, and workbook chunks.

### Adaptive Learning Infrastructure

- **Performance storage:** Per-question results stored in Supabase (user_id, chapter_id, exercise_type, vocabulary_item, correct/incorrect, timestamp)
- **Weakness profile:** Aggregated from performance history - weak vocabulary items, grammar patterns, and exercise types
- **Adaptive generation:** LangGraph agent retrieves weakness profile before generating quiz, biases question selection toward weak areas
- **Memory persistence:** Performance data retained indefinitely for longitudinal learning tracking

## Risk Mitigation

| Risk Type | Risk | Mitigation |
|-----------|------|------------|
| Technical | Quiz quality depends on LLM + structured content | Structured content tables eliminate hallucination risk; premade exercises provide LLM-free fallback; evaluator-optimizer pattern catches quality issues |
| Market | Friends may not engage | Weekly check-ins during beta; adjust based on usage |
| Resource | Solo developer capacity | Strict MVP scope; Expo + Supabase reduce complexity |

## Functional Requirements

### User Authentication & Identity

- **FR1:** User can create account using email
- **FR2:** User can sign in using email
- **FR3:** User can sign in using Apple ID (iOS)
- **FR4:** User can sign out
- **FR5:** User can reset password (email accounts)
- **FR6:** System persists identity across sessions

### Content Navigation

- **FR7:** User can view available textbooks (Books 1-4)
- **FR8:** User can view chapters within a book
- **FR9:** User can select any chapter (open navigation, no gates)
- **FR10:** User can see chapter completion status at a glance

### Structured Content & Quiz Generation

- **FR11:** System retrieves chapter-specific content from structured content tables (vocabulary, grammar_points, dialogues) as the PRIMARY source for quiz generation. RAG chunks used only as supplementary context (culture, pronunciation).
- **FR12:** System generates quiz questions via LangGraph agent using structured content as context, ensuring ALL grammar points for the chapter are represented in the generated quiz
- **FR13:** System validates generated questions for accuracy, curriculum alignment, and grammar coverage before presenting to user
- **FR14:** System returns structured quiz with questions, answer options, correct answers, and source citations (book/lesson/section)

### Exercise Types (MVP - 7 Types)

- **FR15:** User can select exercise type for a chapter: Vocabulary, Grammar, Fill-in-the-Blank, Matching, Dialogue Completion, Sentence Construction, Reading Comprehension, or "Mixed"
- **FR16:** **Vocabulary Quiz** - User answers character ↔ pinyin ↔ meaning questions (multiple choice, typed input). Generated from textbook vocabulary tables and workbook vocabulary exercises.
- **FR17:** **Grammar Quiz** - User completes sentence patterns, identifies correct grammar usage, and applies grammar rules. Generated from textbook grammar sections and workbook grammar exercises.
- **FR18:** **Fill-in-the-Blank** - User selects or types the correct word/phrase to complete sentences. Generated from workbook fill_in_blank exercises with word banks from chapter vocabulary.
- **FR19:** **Matching** - User connects related items (character ↔ pinyin, character ↔ meaning, question ↔ response). Generated from workbook matching exercises and vocabulary tables.
- **FR20:** **Dialogue Completion** - User completes conversation exchanges by selecting or typing appropriate responses. Generated from workbook dialogue_completion exercises and textbook dialogues.
- **FR21:** **Sentence Construction** - User rearranges words/characters into correct sentence order. Generated from workbook sentence_construction exercises.
- **FR22:** **Reading Comprehension** - User reads a passage and answers questions about it. Generated from workbook reading exercises and textbook reading passages.

### Quiz Interaction

- **FR23:** User receives immediate feedback per answer with correct answer shown
- **FR24:** Feedback includes source citation (e.g., "From Book 1, Chapter 8 - Grammar")
- **FR25:** User sees quiz results upon completion with score, time, and per-question breakdown
- **FR26:** User can review incorrect answers after quiz completion

### Chapter Assessment

- **FR27:** User can take chapter test combining multiple exercise types (vocabulary, grammar, fill-in-the-blank, matching, dialogue completion)
- **FR28:** Chapter test includes cumulative review questions from previous chapters
- **FR29:** Chapter test uses adaptive generation to include extra questions on documented weak areas
- **FR30:** User sees chapter mastery status and per-exercise-type breakdown after assessment

### Performance Memory & Adaptive Learning

- **FR31:** System saves per-question performance: correct/incorrect, exercise type, specific vocabulary/grammar item tested, time spent
- **FR32:** System maintains a learner weakness profile aggregating: frequently missed vocabulary items, weak grammar patterns, low-accuracy exercise types
- **FR33:** System uses weakness profile to bias quiz generation - 30-50% of questions in adaptive mode target documented weak areas
- **FR34:** User can view weakness dashboard showing: weak vocabulary items (with correct answer), weak grammar patterns, exercise type accuracy breakdown
- **FR35:** Weakness profile updates in real-time after each quiz completion
- **FR36:** System distinguishes between "never practiced" and "practiced but weak" items

### Progress Tracking

- **FR37:** System tracks quiz scores per chapter per exercise type
- **FR38:** System calculates chapter completion percentage factoring in exercise type coverage
- **FR39:** User can view progress across all chapters with per-exercise-type breakdown
- **FR40:** User can view quiz history with exercise type, score, and date

### Gamification

- **FR41:** System awards points for correct answers (scaled by exercise difficulty)
- **FR42:** System tracks daily streak (consecutive active days)
- **FR43:** User can view current streak
- **FR44:** User can view total points
- **FR45:** System resets streak after missed day

### Dashboard & Home

- **FR46:** User can view dashboard with recent activity and weakness summary
- **FR47:** User can see book/chapter progress on dashboard with exercise type coverage
- **FR48:** User can see streak and points on dashboard
- **FR49:** User can quickly continue where they left off (last exercise type and chapter)
- **FR50:** Dashboard highlights areas needing review based on weakness profile

### Premade Workbook Exercises

- **FR51:** User can view a list of premade workbook exercises for each chapter, with completion status per exercise
- **FR52:** User can complete premade workbook exercises directly (fill-in-blank, matching, dialogue completion, sentence construction, reading comprehension) with local validation against stored correct answers — no LLM or API call needed
- **FR53:** Premade exercise results are tracked in the same performance system as AI-generated quizzes (question_results, exercise_type_progress)
- **FR54:** Chapter view displays both premade exercises (with individual completion status) and an option to generate custom AI exercises

### Content Browsing

- **FR55:** User can browse vocabulary for a chapter, seeing traditional characters, pinyin, and English definitions
- **FR56:** User can browse grammar points for a chapter, seeing pattern descriptions, structures, and examples
- **FR57:** User can browse dialogues for a chapter, seeing traditional, simplified, pinyin, and English translations

### Grammar Coverage

- **FR58:** AI-generated quizzes for a chapter MUST cover all grammar points listed in the grammar_points table for that chapter — the structure validation node enforces this before returning the quiz

### On-the-Fly AI Exercise Generation (Story 4.17)

- **FR59:** At the Exercise Type Selection screen, each exercise type card offers two actions: **Premade** (instant, from `premade_exercises`) and **Generate with AI** (on-the-fly, ~15-20s). Premade is the default; Generate-with-AI is opt-in.
- **FR60:** When the user taps Generate-with-AI, the app displays a cancellable loading screen with tips while the backend produces a fresh exercise via a single OpenAI gpt-5 structured-output call. The user can cancel at any time (back button, cancel button, or navigation away), which aborts the backend request.
- **FR61:** Generated exercises are cached into the `premade_exercises` table on success (upsert), so subsequent users see them as Premade without regenerating. Cache key: (book_id, lesson_id, exercise_type).
- **FR62:** On any generation failure (timeout, API error, validation fail, user cancel), the app shows an error toast and returns to the Exercise Type Selection screen. There is no automatic retry — the user may tap Generate-with-AI again to retry manually.
- **FR63:** The single-call generation pipeline produces validation metadata (acceptable answer variants, explanations, source citations) inline with the exercise payload. Runtime answer validation is entirely local — no second LLM call during exercise play. The deprecated `/api/quizzes/validate-answer` endpoint is removed.

## Non-Functional Requirements

### Performance

- **NFR1:** On-the-fly AI exercise generation completes within 15-20 seconds for a standard exercise (10 questions). Loading screen displays tips carousel with a visible cancel affordance throughout. Premade exercises load in <500ms.
- **NFR2:** Screen navigation completes within 500ms
- **NFR3:** App launches to usable state within 3 seconds
- **NFR4:** Weakness profile calculation completes within 2 seconds after quiz submission

### Security

- **NFR5:** Authentication via Supabase Auth only
- **NFR6:** Apple Sign-In follows Apple security guidelines
- **NFR7:** API keys stored securely (not in client bundle)
- **NFR8:** All data transmitted over HTTPS
- **NFR9:** Performance data accessible only to the authenticated user who generated it

### Reliability

- **NFR10:** Quiz progress saved after each answer (crash-safe)
- **NFR11:** Progress and performance memory persist across app restarts and devices
- **NFR12:** Data synced to server within 5 seconds of activity
- **NFR13:** Structured content tables contain complete vocabulary, grammar, and dialogue data for all chapters in Books 1-4. Quiz generation never returns empty results because structured content is guaranteed to exist for every chapter.

### Integration

- **NFR14:** Supabase connection required for core functionality
- **NFR15:** LLM API failures display user-friendly error with option to retry
- **NFR16:** Apple Sign-In available on iOS devices
- **NFR17:** LangGraph agent uses structured content tables as primary source (guaranteed to have content). RAG chunks used only as supplementary context. Graceful degradation if supplementary RAG retrieval returns insufficient content.

### Offline Behavior

- **NFR18:** "No connection" displayed immediately when offline
- **NFR19:** No cached content or offline functionality in MVP

### Scalability

- **NFR20:** System supports 100 concurrent users (12-month target)
- **NFR21:** Supabase handles scaling (no special infrastructure for MVP)
- **NFR22:** Performance memory storage scales linearly with user count (estimated 100 rows/user/week)

### Localization

- **NFR23:** UI supports English, French, Japanese, Korean
- **NFR24:** Quiz instructions generated in user's selected language
- **NFR25:** User can change display language in settings
- **NFR26:** Chinese content unchanged regardless of UI language

### AI & RAG Quality

- **NFR27:** Generated quiz questions are curriculum-aligned: 100% of questions use vocabulary/grammar from the structured content tables for the specified chapter
- **NFR28:** Structured content coverage: 100% of chapters in Books 1-4 have vocabulary, grammar points, and dialogues in the structured content tables
- **NFR29:** Adaptive quiz content: when weakness profile is available, 30-50% of generated questions target documented weak areas
- **NFR30:** Generated exercises follow workbook formatting patterns (matching, fill-in-blank structure, dialogue format)
- **NFR31:** LLM cost per on-the-fly exercise generation is not a hard constraint — quality is prioritized over cost per product decision (Story 4.17). The cache-on-generate behavior (FR61) amortizes cost across users. Monitor monthly OpenAI spend via dashboard; set a soft alert at $100/month for MVP.
- **NFR32:** On-the-fly generation requests MUST be cancellable. The backend honors FastAPI `Request.is_disconnected()` and aborts the underlying OpenAI call. Cache write is skipped on cancelled requests.
