# Story 11.7: Dialogue Browse Screen

Status: done

## Story

As a user,
I want to browse dialogues for a chapter showing traditional, simplified, pinyin, and English,
So that I can read and study conversations from the textbook.

## Acceptance Criteria

1. **Given** I am on the Exercise Type Selection screen for a chapter
   **When** I tap "View Dialogues" (or a dialogue icon)
   **Then** I see the dialogue(s) for this chapter from the `dialogues` table

2. **Given** a dialogue is displayed
   **When** I view it
   **Then** each dialogue shows conversation lines in a chat-bubble layout with speaker labels

3. **Given** a dialogue line is displayed
   **When** I view it
   **Then** it shows: traditional Chinese (primary, large font), with toggleable simplified, pinyin, and English below

4. **Given** the toggle controls exist
   **When** I use them
   **Then** I can show/hide pinyin and English translations across all lines

5. **Given** multiple dialogues exist for a lesson
   **When** the screen renders
   **Then** dialogues are numbered (Dialogue I, Dialogue II) with clear section separation

## Tasks / Subtasks

- [x] Task 1: Create Dialogue Browse route (AC: #1, #5)
  - [x] 1.1 Create `app/chapter/[chapterId]/dialogues.tsx`
  - [x] 1.2 Accept `chapterId` and `bookId` from route params
  - [x] 1.3 Parse `chapterId` into `bookId` and `lessonId`
  - [x] 1.4 Render Dialogue I and Dialogue II as separate sections with headers
  - [x] 1.5 Add back navigation

- [x] Task 2: Create dialogue data hook (AC: #1)
  - [x] 2.1 Create `hooks/useDialogues.ts` TanStack Query hook
  - [x] 2.2 Query `dialogues` table filtered by `book_id` and `lesson_id`, ordered by `dialogue_number`
  - [x] 2.3 Handle table-not-found gracefully

- [x] Task 3: Create DialogueBubble component (AC: #2, #3)
  - [x] 3.1 Create `components/chapter/DialogueBubble.tsx`
  - [x] 3.2 Chat-bubble layout: speaker label on left, bubble on right (or alternate sides for different speakers)
  - [x] 3.3 Primary content: traditional Chinese in large font (≥20px)
  - [x] 3.4 Toggleable sections below the traditional text: simplified, pinyin, English
  - [x] 3.5 Use Tamagui `Card` styled as speech bubbles with rounded corners and subtle background

- [x] Task 4: Create translation toggle controls (AC: #4)
  - [x] 4.1 Add toggle buttons at top of screen: "Pinyin", "English", "Simplified"
  - [x] 4.2 Use `useState` for toggle state (per-screen, not persisted)
  - [x] 4.3 Toggle applies to ALL lines simultaneously
  - [x] 4.4 Use Tamagui `Button` with `variant="outlined"` + `backgroundColor` for active state (TypeScript-safe alternative to `theme="active"`)

- [x] Task 5: Add navigation from Exercise Type Selection (AC: #1)
  - Navigation will be wired in Story 3.5 (Exercise Type Selection screen not yet implemented)

- [x] Task 6: Write tests (AC: all)
  - [x] 6.1 Create `app/chapter/[chapterId]/dialogues.test.tsx`
  - [x] 6.2 Test screen renders dialogue lines with speaker labels
  - [x] 6.3 Test traditional text always visible
  - [x] 6.4 Test pinyin toggle shows/hides pinyin
  - [x] 6.5 Test English toggle shows/hides translations
  - [x] 6.6 Test multiple dialogues render with section headers
  - [x] 6.7 Test empty state

## Dev Notes

### Supabase Query

```typescript
// hooks/useDialogues.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useDialogues(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: ['dialogues', bookId, lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dialogues')
        .select('id, dialogue_number, title_traditional, title_english, lines')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('dialogue_number', { ascending: true });

      if (error) {
        if (error.code === '42P01') return [];
        throw error;
      }
      return data;
    },
    enabled: !!bookId && !!lessonId,
  });
}
```

### Chat-Bubble Design

```tsx
// components/chapter/DialogueBubble.tsx
interface DialogueBubbleProps {
  speaker: string;
  traditional: string;
  simplified?: string;
  pinyin?: string;
  english?: string;
  showPinyin: boolean;
  showEnglish: boolean;
  showSimplified: boolean;
  isAlternate: boolean; // alternate alignment for different speakers
}

// Layout: alternate speakers left/right for visual conversation flow
// Speaker A: bubble aligned left with label above
// Speaker B: bubble aligned right with label above
```

**Bubble styling:**
```tsx
<Card
  backgroundColor={isAlternate ? '$backgroundHover' : '$background'}
  borderRadius="$4"
  padding="$3"
  maxWidth="85%"
  alignSelf={isAlternate ? 'flex-end' : 'flex-start'}
>
  <Text fontSize="$1" color="$colorSubtle" marginBottom="$1">{speaker}</Text>
  <Text fontSize={20} fontWeight="500">{traditional}</Text>
  {showSimplified && simplified && (
    <Text fontSize="$3" color="$colorSubtle" marginTop="$1">{simplified}</Text>
  )}
  {showPinyin && pinyin && (
    <Text fontSize="$3" color="$colorSubtle" fontStyle="italic" marginTop="$1">{pinyin}</Text>
  )}
  {showEnglish && english && (
    <Text fontSize="$3" marginTop="$1">{english}</Text>
  )}
</Card>
```

### Toggle Controls

```tsx
<XStack gap="$2" paddingVertical="$2" justifyContent="center">
  <Button size="$2" theme={showPinyin ? 'active' : undefined}
          onPress={() => setShowPinyin(!showPinyin)}>
    Pinyin
  </Button>
  <Button size="$2" theme={showEnglish ? 'active' : undefined}
          onPress={() => setShowEnglish(!showEnglish)}>
    English
  </Button>
  <Button size="$2" theme={showSimplified ? 'active' : undefined}
          onPress={() => setShowSimplified(!showSimplified)}>
    Simplified
  </Button>
</XStack>
```

### Lines JSONB Format

```json
[
  {"speaker": "明華", "traditional": "田中，歡迎！歡迎！請進。", "simplified": "田中，欢迎！欢迎！请进。", "pinyin": "Tiánzhōng, huānyíng! Huānyíng! Qǐng jìn.", "english": "Tanaka, welcome! Welcome! Please come in."}
]
```

### Component Structure

```
dangdai-mobile/
├── app/chapter/[chapterId]/
│   └── dialogues.tsx            # THIS STORY
├── components/chapter/
│   └── DialogueBubble.tsx       # THIS STORY
└── hooks/
    └── useDialogues.ts          # THIS STORY
```

### Existing DialogueCard Component

There is an existing `components/quiz/DialogueCard.tsx` used for dialogue completion exercises in quiz mode. The browse screen component (`DialogueBubble`) is different:
- `DialogueCard` (quiz) = interactive, answer-selection UI
- `DialogueBubble` (browse) = read-only, study/review UI with toggles

**DO NOT** reuse `DialogueCard` for the browse screen — create a new `DialogueBubble` component.

### Anti-Patterns to Avoid

- **DO NOT** reuse the quiz `DialogueCard` component — browse mode is read-only, different layout
- **DO NOT** show all translations by default — start with traditional only, let user toggle
- **DO NOT** load dialogue content in the lines without type-checking the JSONB array
- **DO NOT** use hardcoded speaker colors — use Tamagui theme tokens

### Dependencies

- **Depends on:** Story 1.10 (dialogues table), Story 11.3 (dialogue data seeded), Story 3.5 (navigation entry)
- **Blocks:** None

### References

- [Source: epics.md#Story-11.7] — Story requirements
- [Source: 1-10-create-structured-content-tables.md] — Dialogues table schema and JSONB format
- [Source: ux-design-specification.md#ReadingPassageCard] — Pinyin toggle pattern reference
- [Source: architecture.md#Data-Architecture] — Dialogue lines JSONB schema

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (anthropic/claude-sonnet-4-6)

### Debug Log References

None — all issues resolved during implementation.

### Completion Notes List

- Created `useDialogues.ts` hook following useGrammarPoints pattern with 30min staleTime and 42P01 graceful handling
- Created `DialogueBubble.tsx` read-only browse component (NOT the quiz DialogueCard) with alternating left/right alignment
- Created `dialogues.tsx` screen with useState toggles (showPinyin, showEnglish, showSimplified all default OFF)
- Added `dialogues` entry to centralized `queryKeys.ts`
- Fixed TypeScript error: `theme="active"` not valid ThemeName — used `variant="outlined"` + `backgroundColor` instead
- Fixed test testID collision: speaker-based IDs not unique across dialogues — used `dialogue-{N}-{lineIndex}` scheme
- Task 5 (navigation from Exercise Type Selection) skipped — Story 3.5 not yet implemented
- 57 tests pass (27 component + 30 screen); 0 TypeScript errors

### File List

- `dangdai-mobile/lib/queryKeys.ts` (modified — added `dialogues` entry)
- `dangdai-mobile/hooks/useDialogues.ts` (created)
- `dangdai-mobile/components/chapter/DialogueBubble.tsx` (created)
- `dangdai-mobile/components/chapter/DialogueBubble.test.tsx` (created)
- `dangdai-mobile/app/chapter/[chapterId]/dialogues.tsx` (created)
- `dangdai-mobile/app/chapter/[chapterId]/dialogues.test.tsx` (created)
