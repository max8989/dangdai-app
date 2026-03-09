# Story 11.5: Vocabulary Browse Screen

Status: ready-for-dev

## Story

As a user,
I want to browse vocabulary for a chapter showing traditional characters, pinyin, and English definitions,
So that I can study and review vocabulary outside of quiz mode.

## Acceptance Criteria

1. **Given** I am on the Exercise Type Selection screen for a chapter
   **When** I tap "View Vocabulary" (or a vocabulary icon)
   **Then** I see a scrollable list of all vocabulary items for this chapter from the `vocabulary` table

2. **Given** the vocabulary list is displayed
   **When** I view each item
   **Then** it shows: traditional character (large font ≥24px), pinyin, English definition, part of speech tag

3. **Given** vocabulary items span two sections
   **When** the list is rendered
   **Then** items are grouped by vocabulary section (Vocab I, Vocab II) with section headers

4. **Given** items have a `sort_order`
   **When** the list is rendered
   **Then** items are sorted by `sort_order` (original textbook order)

## Tasks / Subtasks

- [ ] Task 1: Create Vocabulary Browse route (AC: #1)
  - [ ] 1.1 Create `app/chapter/[chapterId]/vocabulary.tsx`
  - [ ] 1.2 Accept `chapterId` and `bookId` from route params (same pattern as exercises screen)
  - [ ] 1.3 Parse `chapterId` into `bookId` and `lessonId` (convention: `bookId * 100 + lessonNumber`)
  - [ ] 1.4 Add back navigation to Exercise Type Selection screen

- [ ] Task 2: Create vocabulary data hook (AC: #1, #4)
  - [ ] 2.1 Create `hooks/useVocabulary.ts` TanStack Query hook
  - [ ] 2.2 Query `vocabulary` table filtered by `book_id` and `lesson_id`, ordered by `vocab_section`, `sort_order`
  - [ ] 2.3 Return data grouped by `vocab_section`

- [ ] Task 3: Create VocabularyItem component (AC: #2)
  - [ ] 3.1 Create `components/chapter/VocabularyItem.tsx`
  - [ ] 3.2 Display traditional character (large, ≥24px), pinyin below, English definition, POS tag badge
  - [ ] 3.3 Use Tamagui `Card` with `animation: "quick"`, `pressStyle: { scale: 0.98 }`
  - [ ] 3.4 Style POS tag as a small badge/chip (e.g., `<Text fontSize="$1" color="$colorSubtle">N</Text>`)
  - [ ] 3.5 Handle `is_name` entries — show a name indicator icon or subtle label

- [ ] Task 4: Create section headers and list layout (AC: #3)
  - [ ] 4.1 Render "Vocab I" and "Vocab II" section headers using `<H3>` or `<Text fontWeight="bold">`
  - [ ] 4.2 Use `SectionList` or `FlatList` with section separators
  - [ ] 4.3 Show item count per section in the header

- [ ] Task 5: Add navigation from Exercise Type Selection (AC: #1)
  - [ ] 5.1 Add "View Vocabulary" button/icon to the Exercise Type Selection screen (Story 3.5)
  - [ ] 5.2 Navigate to `/chapter/[chapterId]/vocabulary` on tap
  - [ ] 5.3 Use `BookOpen` icon from `@tamagui/lucide-icons`

- [ ] Task 6: Write tests (AC: all)
  - [ ] 6.1 Create `app/chapter/[chapterId]/vocabulary.test.tsx`
  - [ ] 6.2 Test screen renders vocabulary items
  - [ ] 6.3 Test section grouping (Vocab I and Vocab II headers)
  - [ ] 6.4 Test items display traditional, pinyin, english, POS
  - [ ] 6.5 Test empty state when no vocabulary exists
  - [ ] 6.6 Test loading state

## Dev Notes

### Supabase Query

```typescript
// hooks/useVocabulary.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useVocabulary(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: ['vocabulary', bookId, lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vocabulary')
        .select('id, traditional, pinyin, english, part_of_speech, is_name, vocab_section, sort_order')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('vocab_section', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        if (error.code === '42P01') return []; // table doesn't exist yet
        throw error;
      }
      return data;
    },
    enabled: !!bookId && !!lessonId,
  });
}
```

### Component Structure

```
dangdai-mobile/
├── app/chapter/[chapterId]/
│   └── vocabulary.tsx          # THIS STORY
├── components/chapter/
│   └── VocabularyItem.tsx      # THIS STORY
└── hooks/
    └── useVocabulary.ts        # THIS STORY
```

### VocabularyItem Design

```tsx
// Each item in the list:
<Card padding="$3" marginVertical="$1">
  <XStack justifyContent="space-between" alignItems="center">
    <YStack flex={1}>
      <Text fontSize={24} fontWeight="bold">{traditional}</Text>
      <Text fontSize="$3" color="$colorSubtle">{pinyin}</Text>
      <Text fontSize="$3">{english}</Text>
    </YStack>
    {part_of_speech && (
      <Text fontSize="$1" color="$colorSubtle" backgroundColor="$backgroundHover"
            paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
        {part_of_speech}
      </Text>
    )}
  </XStack>
</Card>
```

### Chapter ID Convention

`chapterId = bookId * 100 + lessonNumber` (e.g., Book 2 Chapter 12 = 212).

Parse in component:
```typescript
const bookId = Math.floor(chapterId / 100);
const lessonId = chapterId % 100;
```

### Existing Patterns to Follow

- **Route params:** Same `useLocalSearchParams` pattern as `app/quiz/[chapterId].tsx` and `app/chapter/[bookId].tsx`
- **TanStack Query hooks:** Follow `useChapterProgress.ts` and `useExerciseTypeProgress.ts` patterns
- **Card styling:** Follow `ChapterListItem.tsx` patterns (Tamagui Card with pressStyle)
- **Back navigation:** Same header pattern as chapter screens

### Anti-Patterns to Avoid

- **DO NOT** fetch all books' vocabulary — filter by bookId and lessonId
- **DO NOT** use `FlatList` without `keyExtractor` — use `item.id`
- **DO NOT** hardcode vocabulary data — always query from Supabase
- **DO NOT** use hardcoded colors — use Tamagui theme tokens

### Dependencies

- **Depends on:** Story 1.10 (vocabulary table), Story 11.1 (vocabulary data seeded), Story 3.5 (exercise type selection provides navigation entry)
- **Blocks:** None

### References

- [Source: epics.md#Story-11.5] — Story requirements
- [Source: architecture.md#API-Patterns] — Direct Supabase reads for content tables
- [Source: ux-design-specification.md] — Card and list patterns
- [Source: 3-5-exercise-type-selection-screen.md] — Navigation entry point

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
