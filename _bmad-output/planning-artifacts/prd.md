---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success']
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
  projectType: web_app
  domain: edtech
  complexity: medium
  projectContext: brownfield
  quizGeneration: ai_dynamic
  initialScope: friends_group
---

# Product Requirements Document - dangdai-app

**Author:** Maxime
**Date:** Sat Feb 14 2026

## Success Criteria

### User Success

**Engagement Success:**
- Users engage **3+ times per week** with sessions of **15+ minutes**
- Users experience the app as "fun" through:
  - Points, streaks, and level progression
  - Visual progress tracking through chapters
  - Friend comparisons and social features

**Learning Success:**
- Users feel "ready" for the next chapter by scoring **80%+ on vocabulary and grammar quizzes**
- Users retain knowledge from previous chapters (cumulative learning, not isolated chapters)
- Users can interact with an **AI learning coach** that identifies areas for improvement

**"Aha!" Moment:**
- User completes their first chapter quiz, scores well, and sees their progress toward the next chapter
- User gets a personalized recommendation from the AI coach and realizes "it knows exactly what I'm struggling with"

### Business Success

**3-Month Success (MVP Validation):**
- **5 active friends** using the app weekly
- Users progressing through at least 2-3 chapters
- Positive feedback: "I'm actually learning and having fun"

**12-Month Success (Growth):**
- **100 NTNU alumni** actively using the platform
- Coverage of multiple books (Books 1-3 minimum)
- Word-of-mouth growth within NTNU alumni community

### Technical Success

- AI-generated quizzes feel natural and match NTNU workbook quality
- RAG system accurately retrieves relevant content per chapter
- App performs well (fast quiz generation, no lag)
- User progress persists reliably across sessions

### Measurable Outcomes

| Metric | Target |
|--------|--------|
| Weekly Active Users (3-month) | 5 friends |
| Weekly Active Users (12-month) | 100 users |
| Session frequency | 3+ per week |
| Session duration | 15+ minutes |
| Chapter mastery threshold | 80%+ quiz scores |
| Retention (return users) | 70%+ week-over-week |

## Product Scope

### MVP - Minimum Viable Product

**Must have to prove the concept:**
- User authentication (simple login for friends group)
- Book/chapter selection (start with Books 1-2)
- AI-generated quizzes based on chapter content:
  - Vocabulary quizzes (character → pinyin → meaning)
  - Grammar pattern exercises (A-not-A, sentence completion)
- Basic gamification: points per correct answer, daily streak
- Progress tracking: chapter completion %, quiz scores
- Simple dashboard showing progress

### Growth Features (Post-MVP)

**Makes it competitive:**
- AI learning coach that analyzes weak areas and suggests focus
- Friend leaderboards and comparisons
- More exercise types (listening, dialogue practice, character writing)
- Spaced repetition system for long-term retention
- Coverage of Books 3-6
- Push notifications / reminders

### Vision (Future)

**Dream version:**
- Full NTNU Dangdai curriculum coverage (Books 1-6)
- Voice/pronunciation practice with AI feedback
- Community features (study groups, challenges)
- Mobile app (iOS/Android)
- Integration with other Chinese learning resources
- Potential expansion beyond NTNU alumni
