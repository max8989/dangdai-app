# Story 11.6: Grammar Points Browse Screen

Status: ready-for-dev

## Story

As a user,
I want to browse grammar points for a chapter showing patterns, structures, and examples,
So that I can study grammar rules before or after exercising.

## Acceptance Criteria

1. **Given** I am on the Exercise Type Selection screen for a chapter
   **When** I tap "View Grammar" (or a grammar icon)
   **Then** I see a scrollable list of all grammar points for this chapter from the `grammar_points` table

2. **Given** a grammar point is displayed
   **When** I view it
   **Then** it shows: title (English + Chinese), function description, structure pattern, usage notes

3. **Given** a grammar point has examples
   **When** I view them
   **Then** examples are shown below each point with traditional Chinese, pinyin, and English translation

4. **Given** points have a `grammar_order`
   **When** the list is rendered
   **Then** points are sorted by `grammar_order` (original textbook order)

## Tasks / Subtasks

- [ ] Task 1: Create Grammar Browse route (AC: #1)
  - [ ] 1.1 Create `app/chapter/[chapterId]/grammar.tsx`
  - [ ] 1.2 Accept `chapterId` and `bookId` from route params
  - [ ] 1.3 Parse `chapterId` into `bookId` and `lessonId`
  - [ ] 1.4 Add back navigation

- [ ] Task 2: Create grammar data hook (AC: #1, #4)
  - [ ] 2.1 Create `hooks/useGrammarPoints.ts` TanStack Query hook
  - [ ] 2.2 Query `grammar_points` table filtered by `book_id` and `lesson_id`, ordered by `grammar_order`
  - [ ] 2.3 Handle table-not-found gracefully (return empty array)

- [ ] Task 3: Create GrammarPointCard component (AC: #2, #3)
  - [ ] 3.1 Create `components/chapter/GrammarPointCard.tsx`
  - [ ] 3.2 Display title as header: English title (bold) + Chinese title (subtitle)
  - [ ] 3.3 Display function description in a highlighted section
  - [ ] 3.4 Display structure pattern in a code-like or monospace block
  - [ ] 3.5 Display usage notes as body text
  - [ ] 3.6 Display examples list: each example shows traditional (large), pinyin (medium), English (small/subtle)
  - [ ] 3.7 Use Tamagui `Card` with expandable/collapsible sections for long content

- [ ] Task 4: Add navigation from Exercise Type Selection (AC: #1)
  - [ ] 4.1 Add "View Grammar" button/icon to Exercise Type Selection screen
  - [ ] 4.2 Navigate to `/chapter/[chapterId]/grammar` on tap
  - [ ] 4.3 Use `MessageSquare` or `BookType` icon from `@tamagui/lucide-icons`

- [ ] Task 5: Write tests (AC: all)
  - [ ] 5.1 Create `app/chapter/[chapterId]/grammar.test.tsx`
  - [ ] 5.2 Test screen renders grammar points
  - [ ] 5.3 Test each grammar point displays title, function, structure, usage, examples
  - [ ] 5.4 Test empty state
  - [ ] 5.5 Test loading state

## Dev Notes

### Supabase Query

```typescript
// hooks/useGrammarPoints.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export function useGrammarPoints(bookId: number, lessonId: number) {
  return useQuery({
    queryKey: ['grammarPoints', bookId, lessonId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('grammar_points')
        .select('id, grammar_order, title_english, title_chinese, function_description, structure_pattern, usage_notes, examples')
        .eq('book_id', bookId)
        .eq('lesson_id', lessonId)
        .order('grammar_order', { ascending: true });

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

### GrammarPointCard Design

```tsx
<Card padding="$4" marginVertical="$2" bordered>
  {/* Title */}
  <YStack gap="$1" marginBottom="$3">
    <Text fontSize="$5" fontWeight="bold">{title_english}</Text>
    {title_chinese && <Text fontSize="$4" color="$colorSubtle">{title_chinese}</Text>}
  </YStack>

  {/* Function */}
  {function_description && (
    <YStack backgroundColor="$backgroundHover" padding="$3" borderRadius="$3" marginBottom="$2">
      <Text fontSize="$2" fontWeight="600" marginBottom="$1">Function</Text>
      <Text fontSize="$3">{function_description}</Text>
    </YStack>
  )}

  {/* Structure Pattern */}
  {structure_pattern && (
    <YStack marginBottom="$2">
      <Text fontSize="$2" fontWeight="600" marginBottom="$1">Structure</Text>
      <Text fontSize="$3" fontFamily="$mono">{structure_pattern}</Text>
    </YStack>
  )}

  {/* Usage Notes */}
  {usage_notes && (
    <YStack marginBottom="$2">
      <Text fontSize="$2" fontWeight="600" marginBottom="$1">Usage</Text>
      <Text fontSize="$3">{usage_notes}</Text>
    </YStack>
  )}

  {/* Examples */}
  {examples.length > 0 && (
    <YStack gap="$2">
      <Text fontSize="$2" fontWeight="600">Examples</Text>
      {examples.map((ex, i) => (
        <YStack key={i} paddingLeft="$2" borderLeftWidth={2} borderLeftColor="$borderColor">
          <Text fontSize={20} fontWeight="500">{ex.traditional}</Text>
          <Text fontSize="$3" color="$colorSubtle">{ex.pinyin}</Text>
          <Text fontSize="$3">{ex.english}</Text>
        </YStack>
      ))}
    </YStack>
  )}
</Card>
```

### Component Structure

```
dangdai-mobile/
├── app/chapter/[chapterId]/
│   └── grammar.tsx              # THIS STORY
├── components/chapter/
│   └── GrammarPointCard.tsx     # THIS STORY
└── hooks/
    └── useGrammarPoints.ts      # THIS STORY
```

### Examples JSONB Format

```json
[
  {"traditional": "王先生要不要喝咖啡？", "pinyin": "Wáng xiānshēng yào bú yào hē kāfēi?", "english": "Does Mr. Wang want to have some coffee?"}
]
```

### Existing Patterns to Follow

- Same route structure as Story 11.5 (vocabulary browse)
- Same TanStack Query hook pattern
- Same back navigation and header pattern

### Anti-Patterns to Avoid

- **DO NOT** render grammar points without checking for null fields — function_description, structure_pattern, usage_notes, title_chinese are all nullable
- **DO NOT** try to render examples if the array is empty
- **DO NOT** use hardcoded colors

### Dependencies

- **Depends on:** Story 1.10 (grammar_points table), Story 11.2 (grammar data seeded), Story 3.5 (navigation entry)
- **Blocks:** None

### References

- [Source: epics.md#Story-11.6] — Story requirements
- [Source: 1-10-create-structured-content-tables.md] — Grammar points table schema
- [Source: architecture.md#Data-Architecture] — Grammar points JSONB examples format

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
