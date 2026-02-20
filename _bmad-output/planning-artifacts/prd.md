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
lastEdited: 'Thu Feb 20 2026'
editHistory:
  - date: 'Thu Feb 20 2026'
    changes: 'Major expansion: Added 10 workbook exercise types, RAG-powered quiz generation, agentic adaptive learning with performance memory, weakness profiles. FR count expanded from 35 to 50, NFR count from 21 to 31.'
---

# Product Requirements Document - dangdai-app

**Author:** Maxime  
**Date:** Thu Feb 20 2026  
**Version:** 2.0 (Edit: Expanded quiz types, RAG generation, adaptive learning)

## Executive Summary

**Product:** Dangdai App - a gamified Chinese learning mobile app for NTNU 當代中文課程 (A Course in Contemporary Chinese) textbook series, powered by RAG-driven AI quiz generation and adaptive learning.

**Vision:** Enable NTNU alumni to continue their Chinese studies after leaving Taiwan through a Duolingo-style mobile experience that mirrors the familiar Dangdai curriculum, with an AI teacher that adapts to each learner's strengths and weaknesses.

**Target Users:** Friends who studied Chinese at NTNU Taiwan (5 initial users), expanding to 100 NTNU alumni within 12 months.

**Platform:** Cross-platform mobile app (iOS & Android) using React Native with Expo.

**Differentiator:** Unlike generic Chinese learning apps, Dangdai App:
- Follows the exact NTNU curriculum structure - same vocabulary, grammar patterns, and chapter progression
- Generates **10 workbook-style exercise types** on the fly using RAG retrieval from the actual textbook/workbook content stored in a vector database
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

- AI-generated quizzes match NTNU workbook quality across all 10 exercise types
- RAG system accurately retrieves chapter-specific content filtered by exercise type
- Adaptive learning system correctly identifies weak areas and adjusts quiz content
- User progress and performance memory persist reliably across sessions
- Quiz generation produces valid, curriculum-aligned exercises for each workbook exercise type

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Weekly Active Users (3-month) | 5 friends |
| Weekly Active Users (12-month) | 100 users |
| Session frequency | 3+ per week |
| Session duration | 15+ minutes |
| Chapter mastery threshold | 80%+ quiz scores |
| Retention (week-over-week) | 70%+ |
| Exercise type coverage | All 10 workbook types available per chapter |
| RAG retrieval relevance | 90%+ of retrieved chunks match requested chapter + exercise type |
| Adaptive quiz accuracy | 70%+ of adaptive questions target documented weak areas |
| Weak area improvement | Users improve weak-area scores by 20%+ over 5 sessions |

## Product Scope & Roadmap

### Phase 1: MVP (Month 1-2)

**Goal:** Prove core learning value with diverse, RAG-powered quizzes and adaptive learning.

| Feature | Description |
|---------|-------------|
| User Authentication | Email + Apple Sign-In via Supabase |
| Book/Chapter Selection | Browse Books 1-2, open navigation |
| RAG-Powered Quiz Engine | On-the-fly quiz generation using vector DB retrieval of textbook/workbook content |
| Multiple Exercise Types (MVP set) | Vocabulary (character/pinyin/meaning), Grammar (sentence completion, pattern recognition), Fill-in-the-Blank, Matching, Dialogue Completion, Sentence Construction, Reading Comprehension |
| Exercise Type Selection | User chooses exercise type per chapter, or "Mixed" for variety |
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
- Books 3-6 content

### Phase 2: Growth (Month 3-6)

- Friend leaderboard and social comparison
- Push notification reminders
- Spaced repetition algorithm integrated with performance memory
- Pronunciation/tone exercises (with audio playback, no mic yet)
- Character writing exercises (typed input, stroke order display)
- Books 3-4 content expansion
- Enhanced AI teacher: proactive learning suggestions ("You should review Chapter 3 grammar")

### Phase 3: Vision (Month 6-12)

- Listening comprehension with audio playback
- Pronunciation practice with microphone input
- Character handwriting recognition (camera/touch)
- Composition exercises with AI grading
- Books 5-6 content
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
| Book/chapter selection | All | Yes |
| Multiple exercise types (7 types) | All | Yes |
| RAG-powered quiz generation | All | Yes |
| Exercise type selection | 1, 2 | Yes |
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
- **Vector storage:** Supabase pgvector (`dangdai_chunks` table with 1536-dim embeddings, filterable by `book`, `lesson`, `content_type`, `exercise_type`)
- **RAG pipeline:** Semantic retrieval via `dangdai_search` RPC function, filtered by chapter and exercise type
- **LLM:** External API for quiz generation via LangGraph agent (monitor costs)
- **Content coverage:** Textbook chunks (dialogue, vocabulary, grammar, culture, activities) + Workbook chunks (10 exercise types: listening, pronunciation, reading, fill_in_blank, matching, dialogue_completion, sentence_construction, character_writing, composition, vocabulary)

### Adaptive Learning Infrastructure

- **Performance storage:** Per-question results stored in Supabase (user_id, chapter_id, exercise_type, vocabulary_item, correct/incorrect, timestamp)
- **Weakness profile:** Aggregated from performance history - weak vocabulary items, grammar patterns, and exercise types
- **Adaptive generation:** LangGraph agent retrieves weakness profile before generating quiz, biases question selection toward weak areas
- **Memory persistence:** Performance data retained indefinitely for longitudinal learning tracking

## Risk Mitigation

| Risk Type | Risk | Mitigation |
|-----------|------|------------|
| Technical | Quiz quality depends on LLM + RAG | Test generation with real content before UI; iterate prompts |
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

- **FR7:** User can view available textbooks (Books 1-2)
- **FR8:** User can view chapters within a book
- **FR9:** User can select any chapter (open navigation, no gates)
- **FR10:** User can see chapter completion status at a glance

### RAG-Powered Quiz Generation

- **FR11:** System retrieves chapter-specific content from vector DB (`dangdai_chunks`) filtered by book, lesson, and exercise type
- **FR12:** System generates quiz questions via LangGraph agent using RAG-retrieved content as context
- **FR13:** System validates generated questions for accuracy and curriculum alignment before presenting to user
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

## Non-Functional Requirements

### Performance

- **NFR1:** RAG retrieval + LLM quiz generation completes within 8 seconds for standard quiz (10 questions), loading indicator displayed with progress
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
- **NFR13:** RAG retrieval returns relevant content for all 7 MVP exercise types per chapter (no empty results)

### Integration

- **NFR14:** Supabase connection required for core functionality
- **NFR15:** LLM API failures display user-friendly error with option to retry
- **NFR16:** Apple Sign-In available on iOS devices
- **NFR17:** LangGraph agent gracefully degrades if RAG retrieval returns insufficient content (falls back to broader chapter content)

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

- **NFR27:** Generated quiz questions are curriculum-aligned: 90%+ of questions use vocabulary/grammar from the specified chapter
- **NFR28:** RAG retrieval relevance: 90%+ of retrieved chunks match the requested book, lesson, and exercise type
- **NFR29:** Adaptive quiz content: when weakness profile is available, 30-50% of generated questions target documented weak areas
- **NFR30:** Generated exercises follow workbook formatting patterns (matching, fill-in-blank structure, dialogue format)
- **NFR31:** LLM cost per quiz generation stays under $0.05 per 10-question quiz
