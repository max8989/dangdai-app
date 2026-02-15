---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - '/home/maxime/repos/dangdai-app/project-requirement.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/brainstorming/brainstorming-session-20260214.md'
  - '/home/maxime/repos/dangdai-app/dangdai-rag/CLAUDE.md'
  - '/home/maxime/repos/dangdai-app/dangdai-rag/CHUNKER_README.md'
  - '/home/maxime/repos/dangdai-app/Flash-card.tsv'
  - 'Teng Shou-hsin. 當代中文課程 1 (課本) A Course in Contemporary Chinese 1 (Textbook)-28-49.pdf'
  - 'Teng Shou-hsin. 當代中文課程 1 (作業本) A Course in Contemporary Chinese 1 (Workbook)-001.pdf'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 4
  referenceFiles: 2
classification:
  projectType: mobile_app
  domain: edtech
  complexity: medium
  projectContext: brownfield
  quizGeneration: ai_dynamic
  initialScope: friends_group
---

# Product Requirements Document - dangdai-app

**Author:** Maxime  
**Date:** Sat Feb 14 2026  
**Version:** 1.0

## Executive Summary

**Product:** Dangdai App - a gamified Chinese learning mobile app for NTNU 當代中文課程 (A Course in Contemporary Chinese) textbook series.

**Vision:** Enable NTNU alumni to continue their Chinese studies after leaving Taiwan through a Duolingo-style mobile experience that mirrors the familiar Dangdai curriculum.

**Target Users:** Friends who studied Chinese at NTNU Taiwan (5 initial users), expanding to 100 NTNU alumni within 12 months.

**Platform:** Cross-platform mobile app (iOS & Android) using React Native with Expo.

**Differentiator:** Unlike generic Chinese learning apps, Dangdai App follows the exact NTNU curriculum structure - same vocabulary, grammar patterns, and chapter progression that users already learned in Taiwan.

**Core Value Proposition:** "Continue your NTNU Chinese journey, anywhere in the world."

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

- AI-generated quizzes match NTNU workbook quality
- RAG system accurately retrieves chapter-specific content
- User progress persists reliably across sessions

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Weekly Active Users (3-month) | 5 friends |
| Weekly Active Users (12-month) | 100 users |
| Session frequency | 3+ per week |
| Session duration | 15+ minutes |
| Chapter mastery threshold | 80%+ quiz scores |
| Retention (week-over-week) | 70%+ |

## Product Scope & Roadmap

### Phase 1: MVP (Month 1-2)

**Goal:** Prove core learning value with minimal features.

| Feature | Description |
|---------|-------------|
| User Authentication | Email + Apple Sign-In via Supabase |
| Book/Chapter Selection | Browse Books 1-2, open navigation |
| Vocabulary Quiz | AI-generated questions per chapter |
| Grammar Quiz | AI-generated pattern exercises |
| Scoring | Immediate feedback, points per correct answer |
| Progress Tracking | Chapter completion %, quiz history |
| Daily Streak | Consecutive days tracking |
| Dashboard | Progress, streak, recent activity |

**Explicitly Excluded:**
- AI learning coach
- Friend leaderboards  
- Push notifications
- Offline mode
- Audio/listening exercises
- Books 3-6 content

### Phase 2: Growth (Month 3-6)

- AI learning coach analyzing weak areas
- Friend leaderboard and social comparison
- Push notification reminders
- Spaced repetition for retention
- Books 3-4 content expansion

### Phase 3: Vision (Month 6-12)

- Listening comprehension exercises
- Pronunciation practice with audio
- Character writing practice
- Books 5-6 content
- Community features (study groups)
- Web app companion

## User Journeys

> **Note:** These journeys represent the full product vision. MVP supports Journeys 1 and 3 fully, Journey 2 partially (no AI coach). Journey 4 is Phase 2.

### Journey 1: Marie - New Learner (Invited Friend)

**Opening Scene:**
Marie receives a WhatsApp message from Maxime: "Hey! I built an app for us to keep practicing Dangdai. Want to try it?" She clicks the invite link, curious but skeptical.

**Rising Action:**
- Signs up with simple login
- Selects Book 2, Chapter 10 - where she left off at NTNU
- Sees familiar content: vocabulary and grammar patterns from class
- Starts vocabulary quiz: 她, 喜歡, 咖啡... "This is exactly like NTNU!"
- Gets 7/10 correct, earns 70 points, "Day 1 streak started!"

**Climax:**
After 15 minutes: "Chapter 10 Progress: 15% complete" / "+70 points - Level 1 Learner"

**Resolution:**
Marie returns daily. By week's end: 4 sessions completed. Messages group: "Why is this actually fun? 我很喜歡!"

---

### Journey 2: Marie - Returning Learner (Weekly Routine)

*Includes Phase 2 features: AI coach, notifications*

**Opening Scene:**
Monday evening. Marie gets notification: "Your streak is at 12 days!" Opens app during commute.

**Rising Action:**
- Dashboard: Book 2, Chapter 12 - 60% complete
- Quiz mixes new vocab with previously missed items
- Struggles with 會 vs 可以 (grammar from Chapter 11)
- AI coach suggests: "You're mixing up 會 and 可以. Want a quick grammar refresher?"

**Climax:**
Taps "Yes" - focused 5-minute drill. Finally gets it.

**Resolution:**
+85 points. "Chapter 12: 75% complete." Checks leaderboard: now ahead of one friend.

---

### Journey 3: Marie - Completing a Chapter

**Opening Scene:**
Chapter 12: 95% complete. Marie taps "Take Chapter Test."

**Rising Action:**
- Test combines vocabulary, grammar, reading comprehension
- 20 questions covering Chapter 12 + cumulative review
- Finishes in 12 minutes

**Climax:**
Results: 88% - "Chapter 12 Mastered!"

**Resolution:**
Earns badge and bonus points. Jumps to Chapter 14 to align with private tutor schedule.

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
| AI-generated quizzes | All | Yes |
| Progress tracking | 1, 2, 3 | Yes |
| Points & streaks | 1, 2 | Yes |
| Friend leaderboard | 1, 2, 4 | No (Phase 2) |
| AI learning coach | 2 | No (Phase 2) |
| Chapter test | 3 | Yes |
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
- **Vector storage:** Supabase pgvector (existing RAG system)
- **LLM:** External API for quiz generation (monitor costs)

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

### Vocabulary Quizzes

- **FR11:** User can start vocabulary quiz for selected chapter
- **FR12:** System generates questions via RAG + LLM using chapter content
- **FR13:** User answers questions (character ↔ pinyin ↔ meaning)
- **FR14:** User receives immediate feedback per answer
- **FR15:** User sees quiz results with score upon completion

### Grammar Quizzes

- **FR16:** User can start grammar quiz for selected chapter
- **FR17:** System generates grammar questions via RAG + LLM
- **FR18:** User answers grammar questions (sentence completion, pattern recognition)
- **FR19:** User receives immediate feedback per answer
- **FR20:** User sees quiz results with score upon completion

### Chapter Assessment

- **FR21:** User can take chapter test combining vocabulary and grammar
- **FR22:** User sees chapter mastery status after assessment

### Progress Tracking

- **FR23:** System tracks quiz scores per chapter
- **FR24:** System calculates chapter completion percentage
- **FR25:** User can view progress across all chapters
- **FR26:** User can view quiz history

### Gamification

- **FR27:** System awards points for correct answers
- **FR28:** System tracks daily streak (consecutive active days)
- **FR29:** User can view current streak
- **FR30:** User can view total points
- **FR31:** System resets streak after missed day

### Dashboard & Home

- **FR32:** User can view dashboard with recent activity
- **FR33:** User can see book/chapter progress on dashboard
- **FR34:** User can see streak and points on dashboard
- **FR35:** User can quickly continue where they left off

## Non-Functional Requirements

### Performance

- **NFR1:** Quiz generation completes within 5 seconds (loading indicator displayed)
- **NFR2:** Screen navigation completes within 500ms
- **NFR3:** App launches to usable state within 3 seconds

### Security

- **NFR4:** Authentication via Supabase Auth only
- **NFR5:** Apple Sign-In follows Apple security guidelines
- **NFR6:** API keys stored securely (not in client bundle)
- **NFR7:** All data transmitted over HTTPS

### Reliability

- **NFR8:** Quiz progress saved after each answer (crash-safe)
- **NFR9:** Progress persists across app restarts and devices
- **NFR10:** Data synced to server within 5 seconds of activity

### Integration

- **NFR11:** Supabase connection required for core functionality
- **NFR12:** LLM API failures display user-friendly error
- **NFR13:** Apple Sign-In available on iOS devices

### Offline Behavior

- **NFR14:** "No connection" displayed immediately when offline
- **NFR15:** No cached content or offline functionality in MVP

### Scalability

- **NFR16:** System supports 100 concurrent users (12-month target)
- **NFR17:** Supabase handles scaling (no special infrastructure for MVP)

### Localization

- **NFR18:** UI supports English, French, Japanese, Korean
- **NFR19:** Quiz instructions generated in user's selected language
- **NFR20:** User can change display language in settings
- **NFR21:** Chinese content unchanged regardless of UI language
