---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '/home/maxime/repos/dangdai-app/_bmad-output/planning-artifacts/prd.md'
  - '/home/maxime/repos/dangdai-app/_bmad-output/brainstorming/brainstorming-session-20260214.md'
---

# UX Design Specification dangdai-app

**Author:** Maxime
**Date:** Sat Feb 14 2026

---

## Executive Summary

### Project Vision

A gamified mobile app enabling NTNU 當代中文課程 (Dangdai) alumni to continue their Chinese studies anywhere in the world. The app mirrors the exact curriculum structure - same vocabulary, grammar patterns, and chapter progression - that users already learned in Taiwan, delivered through a Duolingo-style mobile experience.

**Core Value Proposition:** "Continue your NTNU Chinese journey, anywhere in the world."

### Target Users

**Primary Users (MVP):** 5 friends who studied Chinese at NTNU Taiwan
- Familiar with Dangdai textbook structure and content
- Want to maintain Chinese skills after leaving Taiwan
- Seek short, engaging sessions (15+ minutes, 3x/week)
- Looking for familiar content that mirrors classroom experience

**Growth Target:** 100 NTNU alumni within 12 months

### Key Design Challenges

1. **Quiz Experience Flow** - Making AI-generated quizzes feel seamless and responsive despite 5-second LLM generation time. Clear loading feedback and smooth question transitions are essential.

2. **Progress Clarity Across Multiple Dimensions** - Users track chapter %, book progress, streaks, points, and quiz history. Must present without overwhelming while making "continue where I left off" instant.

3. **Chinese Character Display & Interaction** - Handling character/pinyin/meaning relationships clearly across question types. Mobile typography and readability for Chinese characters is critical.

4. **Motivation for Small User Group** - MVP gamification (streaks, points) must drive 3x/week engagement among 5 friends without Phase 2 social features.

### Design Opportunities

1. **Familiar Curriculum = Reduced Cognitive Load** - Users know Dangdai structure from NTNU. UX can leverage this familiarity - "pick up where you left off" feels like returning to class, not learning a new app.

2. **Micro-Session Optimization** - Design for 15-minute commute/break sessions. Quick launch → immediate quiz → visible progress → satisfying close.

3. **Celebration & Momentum** - Strong visual feedback for correct answers, chapter completion, and streak milestones creates emotional hooks that keep the friend group engaged.

## Core User Experience

### Defining Experience

The core experience is the **quiz interaction loop**: question → answer → immediate feedback → points reward. This is what users will do most frequently and must feel polished and satisfying.

**Core Loop:**
1. User sees question (character, pinyin, or meaning)
2. User selects/inputs answer
3. Instant feedback with sound + animation (correct/incorrect)
4. Points animate upward
5. Next question or completion celebration

### Platform Strategy

| Aspect | Decision |
|--------|----------|
| Framework | React Native + Expo |
| UI Library | Tamagui (performant, cross-platform styling) |
| Design Style | Playful like Duolingo, but simpler to implement |
| Connectivity | Online-only (LLM quiz generation requires internet) |
| Primary Input | Touch-based mobile interaction |

### Effortless Interactions

- **Continue learning** - One tap from dashboard to resume current chapter quiz
- **Answer questions** - Large, tappable answer options with clear touch feedback
- **Track progress** - Glanceable dashboard shows streak calendar + chapter progress without navigation

### Critical Success Moments

1. **First correct answer** - Sound + animation confirms "this works"
2. **Exercise completion** - Points visibly tally up with satisfying animation
3. **Calendar day filled** - GitHub-style grid shows today's activity, building streak visibility
4. **Chapter mastery** - Clear celebration when reaching 80%+ on chapter

### Experience Principles

1. **Playful but achievable** - Duolingo-inspired fun without over-engineering complexity
2. **Satisfying feedback loops** - Every correct answer rewards with sound + animation
3. **Visual progress is motivating** - GitHub-style activity calendar makes consistency visible
4. **Quick to value** - Minimal taps from launch to learning
5. **Familiar structure** - Dangdai curriculum structure users already know reduces cognitive load

## Desired Emotional Response

### Primary Emotional Goals

Users should feel these core emotions when using dangdai-app:

1. **Accomplished** - "I'm actually learning and making real progress with my Chinese"
2. **Nostalgic** - "This feels like being back in NTNU class with familiar content"
3. **Playful/Fun** - "This doesn't feel like studying, it's enjoyable"
4. **Motivated** - "I want to come back and do more"

**Share-worthy moment:** "This app is fun AND it uses our NTNU books!" - the combination of enjoyment + familiar curriculum is what makes users tell friends.

### Emotional Journey Mapping

| Stage | Desired Emotion |
|-------|-----------------|
| Opening app | Welcomed, ready to learn |
| During quiz | Engaged, playful, focused |
| Correct answer | Small burst of satisfaction |
| Wrong answer | Encouraged ("nice try"), not shamed |
| Session complete | Productive, accomplished |
| Viewing progress | Proud of consistency |
| Missed days | No guilt - focus on weekly/monthly totals |

### Micro-Emotions

**Prioritize:**
- Confidence over confusion (clear UI, familiar structure)
- Accomplishment over frustration (gentle feedback)
- Delight over mere satisfaction (sounds, animations)
- Encouragement over pressure (activity count vs streak guilt)

**Avoid:**
- Anxiety about breaking streaks
- Shame for wrong answers
- Guilt for missed days
- Overwhelm from too much information

### Design Implications

| Emotional Goal | UX Design Approach |
|----------------|-------------------|
| Accomplished | Points animation, chapter % progress, GitHub-style calendar |
| Nostalgic | NTNU Dangdai structure, familiar vocabulary/grammar |
| Playful/Fun | Sounds, animations, celebratory feedback |
| Motivated | Weekly/monthly activity count (not consecutive streaks) |
| Encouraged (on failure) | Gentle wrong answer feedback, no red X shame |
| Productive (post-session) | Clear summary of what was accomplished |

### Emotional Design Principles

1. **Celebrate effort, not perfection** - Activity frequency matters more than perfect streaks
2. **Gentle failure** - Wrong answers encourage retry, not discourage
3. **Nostalgia as comfort** - Familiar NTNU structure reduces anxiety
4. **Fun is productive** - Playful design doesn't diminish learning value
5. **No guilt mechanics** - Weekly/monthly counts replace streak pressure

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

#### Duolingo
**What they do well:**
- Quiz flow with smooth transitions between questions
- Immediate answer feedback with satisfying sounds/animations
- Clear progress visualization (XP, levels, completion %)
- "Words you struggled with" summary after lessons
- Sound design that celebrates without being annoying
- Bite-sized lesson structure (5-10 min sessions)

**What to avoid:**
- Aggressive streak guilt messaging
- Excessive notifications/nagging
- Hearts/lives system that punishes mistakes
- Heavy upsell pressure for premium

#### Noji (formerly Noji Pro)
**What they do well:**
- Clean, calming visual aesthetic
- Satisfying micro-interactions and animations
- Simple, clear data visualization
- Non-judgmental tracking approach
- Minimal UI that doesn't overwhelm

### Transferable UX Patterns

**From Duolingo:**
| Pattern | Application to dangdai-app |
|---------|---------------------------|
| Quiz flow | Smooth question → answer → feedback → next loop |
| Answer feedback | Sound + animation for correct/incorrect |
| Progress visualization | Chapter %, points, activity calendar |
| Weak area summary | "You struggled with 會 vs 可以" post-quiz |
| Lesson structure | 10-15 question exercises, chapter-based |

**From Noji:**
| Pattern | Application to dangdai-app |
|---------|---------------------------|
| Clean aesthetic | Playful but not cluttered |
| Micro-interactions | Subtle, satisfying animations throughout |
| Non-judgmental tracking | Weekly/monthly counts, no guilt |
| Simple visualization | GitHub-style calendar, clear progress bars |

### Anti-Patterns to Avoid

1. **Streak guilt** - No "You'll lose your streak!" pressure messaging
2. **Punishment mechanics** - No hearts/lives that limit learning
3. **Notification spam** - Minimal, respectful reminders only (Phase 2)
4. **Cluttered UI** - Keep screens focused, avoid feature overload
5. **Shame on failure** - Wrong answers encourage, not discourage

### Design Inspiration Strategy

**Adopt Directly:**
- Duolingo quiz flow (question → feedback → next)
- Duolingo sound design approach (celebratory, not annoying)
- Duolingo weak area summary
- Noji clean aesthetic and micro-interactions
- Noji non-judgmental tracking philosophy

**Adapt for dangdai-app:**
- Duolingo progress → Simplify to chapter % + GitHub calendar
- Duolingo lesson structure → Map to Dangdai chapters/vocabulary
- Noji minimal UI → Add playfulness while keeping clarity

**Explicitly Avoid:**
- Duolingo streak guilt mechanics
- Duolingo hearts/lives system
- Duolingo aggressive notifications
- Over-gamification that distracts from learning

## Design System Foundation

### Design System Choice

**Primary UI Library:** Tamagui

Tamagui provides a performant, themeable foundation for React Native + Expo that aligns with dangdai-app's need for a playful, custom aesthetic with smooth animations.

### Rationale for Selection

| Requirement | How Tamagui Addresses It |
|-------------|-------------------------|
| Playful aesthetic | Fully themeable, not locked to Material Design |
| Performance | Compiles to native, optimized for animations |
| Expo compatibility | First-class Expo support |
| Custom look | Strong theming system for brand customization |
| Animation support | Works with @tamagui/animations for quiz feedback |

### Implementation Approach

**Foundation Layer:**
- Tamagui core components (Button, Card, Text, Stack, etc.)
- Custom theme with playful color palette
- Typography scale optimized for Chinese characters

**Custom Components (to build):**
- Quiz question/answer cards
- Progress bar with animation
- Points counter with tally animation
- GitHub-style activity calendar
- Correct/incorrect feedback overlays

**Animation Strategy:**
- Tamagui animations for UI transitions
- React Native Reanimated for complex quiz feedback
- Sound integration via expo-av

### Customization Strategy

**Theme Customization:**
- Define playful color tokens (primary, success, error, etc.)
- Create custom spacing and radius for rounded, friendly feel
- Typography tokens for Latin and Chinese character display

**Component Customization:**
- Extend Tamagui primitives for quiz-specific components
- Build reusable feedback patterns (correct/incorrect states)
- Create consistent touch targets for mobile quiz interaction

## Defining Experience

### Core Interaction

**One-sentence description:** "A cool app that feels like a game but to continue learning Taiwan Chinese in the NTNU books where you left it."

**Defining experience:** Complete a workbook-style exercise and see your progress fill up the calendar.

The satisfaction comes at **exercise completion**, not individual questions. Individual correct answers are small wins leading to the big payoff.

### User Mental Model

**Background from NTNU:**
- Users learned through: class with teacher + textbook → workbook exercises
- The app serves as a **digital workbook** with gamification
- Familiar structure reduces learning curve

**User expectations:**
- Exercise = set of 10-15 related questions (like a workbook page)
- Completion = satisfying moment of accomplishment
- Progress = visible, cumulative, non-judgmental

### Success Criteria

| Criteria | What Success Looks Like |
|----------|------------------------|
| Exercise completion | Clear celebration moment with sound + animation |
| Progress visibility | Calendar fills up, points tally animates |
| Session satisfaction | User feels productive after 15 minutes |
| Return motivation | "I want to fill more calendar squares" |

### Pattern Analysis

**Established Patterns (users already know):**
- Workbook exercise structure (from NTNU experience)
- Quiz question/answer format (familiar from any learning app)
- Progress tracking (familiar from fitness/habit apps)

**Our Unique Twist:**
- Gamified workbook (sounds, animations, points on completion)
- NTNU-specific content (nostalgia + curriculum familiarity)
- Guilt-free progress tracking (weekly/monthly counts, not streaks)

### Experience Mechanics

**1. Initiation:**
- User taps "Continue" or selects chapter
- Exercise loads (10-15 questions from chapter content)

**2. Interaction:**
- Question appears (character/pinyin/meaning)
- User taps answer from multiple choice
- Immediate feedback: sound + visual (correct = green + ding, incorrect = gentle orange + encouraging)
- Next question auto-advances

**3. Feedback (per question):**
- Correct: satisfying sound, brief green flash, small point increment
- Incorrect: gentle sound, orange highlight, show correct answer, "nice try" energy

**4. Completion (the big moment):**
- All questions answered → celebration screen
- Points tally up with animation + sound
- "You struggled with: 會 vs 可以" summary
- Calendar square fills in for today
- "Exercise complete! +85 points"

## Visual Design Foundation

### Color System

**Primary Palette:**

| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| Primary | Teal/Cyan | `#06B6D4` | Main actions, buttons, highlights |
| Primary Dark | Deep Teal | `#0891B2` | Pressed states, emphasis |
| Secondary | Warm Orange | `#F97316` | Accents, points, celebrations |

**Semantic Colors:**

| Token | Color | Hex | Usage |
|-------|-------|-----|-------|
| Success | Soft Green | `#22C55E` | Correct answers, completion |
| Error | Gentle Orange | `#FB923C` | Wrong answers (encouraging, not harsh) |
| Warning | Amber | `#FBBF24` | Alerts, attention |
| Background | Off-white | `#FAFAF9` | Main background |
| Surface | White | `#FFFFFF` | Cards, elevated surfaces |
| Text Primary | Dark Gray | `#1C1917` | Main text |
| Text Secondary | Medium Gray | `#78716C` | Secondary text |

**Color Rationale:**
- Teal primary = fresh, modern, calming but energetic
- Orange accents = celebratory, warm (points, rewards)
- Gentle orange for errors = encouraging, not punishing (aligns with emotional goals)
- Soft green for success = satisfying without being harsh

### Typography System

**Font Families:**

| Type | Font | Fallback |
|------|------|----------|
| Latin (UI) | Inter | SF Pro, system-ui |
| Chinese | System Default | PingFang SC (iOS), Noto Sans CJK (Android) |

**Type Scale:**

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display | 32px | Bold | Celebration screens |
| H1 | 24px | Semibold | Screen titles |
| H2 | 20px | Semibold | Section headers |
| Body Large | 18px | Regular | Quiz questions, Chinese characters |
| Body | 16px | Regular | General text |
| Caption | 14px | Regular | Secondary info, labels |
| Small | 12px | Medium | Badges, metadata |

**Chinese Character Guidelines:**
- Minimum 18-20px for quiz content
- Adequate line height (1.5) for character clarity
- Consider character weight for stroke visibility

### Spacing & Layout Foundation

**Base Unit:** 4px

**Spacing Scale:**

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Tight spacing, inline elements |
| sm | 8px | Related elements |
| md | 16px | Standard spacing |
| lg | 24px | Section spacing |
| xl | 32px | Large gaps |
| 2xl | 48px | Screen padding, major sections |

**Border Radius:**

| Element | Radius |
|---------|--------|
| Buttons, Cards | 12px |
| Small elements | 8px |
| Icons, Avatars | Full (50%) |

**Layout Principles:**
1. **Generous touch targets** - Minimum 48px for tappable elements
2. **Breathing room** - Cards and quiz options have ample padding
3. **Clear hierarchy** - Spacing increases between less related elements
4. **Mobile-first** - Designed for one-handed use

### Accessibility Considerations

- All text meets WCAG AA contrast ratios (4.5:1 minimum)
- Large Chinese characters for readability (18px+ for quiz content)
- Color is never the only indicator (icons + color for correct/incorrect)
- Touch targets minimum 48x48px
- Support for system font scaling
