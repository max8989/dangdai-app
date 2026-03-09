/**
 * Exercise Type Selection Screen
 *
 * Displays two sections for a chapter:
 * 1. "Workbook Exercises" — premade exercises from the database (hidden if none exist)
 * 2. "AI-Generated Exercises" — 2-column grid of 8 exercise type cards
 *
 * Navigation:
 * - AI exercise type tap → /quiz/loading with chapterId, bookId, exerciseType params
 * - Premade exercise tap → /quiz/premade (placeholder for Epic 11)
 * - Browse buttons → /chapter/[chapterId]/vocabulary|grammar|dialogues
 *
 * Browse buttons are conditionally shown based on content availability.
 * Buttons hidden during loading (undefined = falsy) — no flash of content.
 *
 * Open Navigation: No gates, no locks — all exercise types accessible.
 *
 * Story 3.5: Exercise Type Selection Screen
 * Story 3.7: Wire Browse Screen Navigation — conditional browse button visibility
 * Stories 11.5, 11.6, 11.7: Navigation wired up here
 */

import { ScrollView } from 'react-native'
import { YStack, XStack, Text, H2, Button } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import {
  Shuffle,
  BookOpen,
  MessageSquare,
  PenTool,
  Link,
  MessageCircle,
  LayoutGrid,
  FileText,
  ChevronLeft,
} from '@tamagui/lucide-icons'

import { ExerciseTypeCard } from '../../../components/chapter/ExerciseTypeCard'
import { PremadeExerciseCard } from '../../../components/chapter/PremadeExerciseCard'
import { useExerciseTypeProgress } from '../../../hooks/useExerciseTypeProgress'
import { usePremadeExercises } from '../../../hooks/usePremadeExercises'
import { useChapter } from '../../../hooks/useChapters'
import { useVocabularyCount } from '../../../hooks/useVocabulary'
import { useGrammarPointsCount } from '../../../hooks/useGrammarPoints'
import { useDialoguesCount } from '../../../hooks/useDialogues'
import { BOOKS } from '../../../constants/books'
import type { ExerciseType } from '../../../types/quiz'
import type { ExerciseTypeProgress } from '../../../components/chapter/ExerciseTypeCard'

// ─── Exercise Types Constant ──────────────────────────────────────────────────

/**
 * All 8 exercise type cards: Mixed + 7 specific types.
 * Mixed is always first (top-left in the 2-column grid).
 */
const EXERCISE_TYPES = [
  {
    type: 'mixed' as ExerciseType,
    label: 'Mixed',
    icon: Shuffle,
    isMixed: true,
    subtitle: 'AI picks exercises based on your weak areas',
  },
  { type: 'vocabulary' as ExerciseType, label: 'Vocabulary', icon: BookOpen },
  { type: 'grammar' as ExerciseType, label: 'Grammar', icon: MessageSquare },
  { type: 'fill_in_blank' as ExerciseType, label: 'Fill in Blank', icon: PenTool },
  { type: 'matching' as ExerciseType, label: 'Matching', icon: Link },
  { type: 'dialogue_completion' as ExerciseType, label: 'Dialogue', icon: MessageCircle },
  { type: 'sentence_construction' as ExerciseType, label: 'Sentence Builder', icon: LayoutGrid },
  { type: 'reading_comprehension' as ExerciseType, label: 'Reading', icon: FileText },
] as const

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ExercisesScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()
  const router = useRouter()

  // Parse chapterId — convention: bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : NaN
  const isValidChapterId = !Number.isNaN(chapterIdNum) && chapterIdNum > 0
  // Use 0 as fallback — hooks use `enabled` guards to skip fetching when invalid
  const safeChapterId = isValidChapterId ? chapterIdNum : 0
  const bookId = isValidChapterId ? Math.floor(chapterIdNum / 100) : 0
  const lessonId = isValidChapterId ? chapterIdNum % 100 : 0

  // Always call hooks unconditionally (Rules of Hooks)
  // useChapter returns undefined for chapterId=0 (not found)
  const chapter = useChapter(safeChapterId)
  const book = chapter ? BOOKS.find((b) => b.id === chapter.bookId) : null

  // Fetch exercise type progress (gracefully handles missing table)
  // Hook is disabled when chapterId <= 0 via its own `enabled` guard
  const { data: progressRows } = useExerciseTypeProgress(safeChapterId)

  // Build progress map: { exerciseType: ExerciseTypeProgress }
  const progressMap: Record<string, ExerciseTypeProgress> = {}
  for (const row of progressRows ?? []) {
    progressMap[row.exercise_type] = {
      bestScore: row.best_score,
      attemptCount: row.attempts_count,
      mastered: !!row.mastered_at,
    }
  }

  // Fetch premade exercises (gracefully handles missing table — returns [] on 42P01)
  // Hook is disabled when bookId=0 or lessonId=0 via its own `enabled` guard
  const { data: premadeExercises } = usePremadeExercises(bookId, lessonId)
  const hasPremadeExercises = (premadeExercises?.length ?? 0) > 0

  // Fetch content availability for conditional browse button visibility (Story 3.7)
  // Always called unconditionally (Rules of Hooks); disabled when bookId=0 or lessonId=0
  // Undefined during loading = falsy = buttons hidden (correct UX — no flash)
  const { data: hasVocabulary } = useVocabularyCount(bookId, lessonId)
  const { data: hasGrammar } = useGrammarPointsCount(bookId, lessonId)
  const { data: hasDialogues } = useDialoguesCount(bookId, lessonId)

  const hasBrowseContent = hasVocabulary || hasGrammar || hasDialogues

  // Invalid chapterId state — render after all hooks are called
  if (!isValidChapterId || !chapter) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Exercises',
            headerBackTitle: 'Back',
          }}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          testID="exercises-invalid-chapter"
        >
          <Text>Chapter not found</Text>
        </YStack>
      </>
    )
  }

  // ─── Navigation Handlers ────────────────────────────────────────────────────

  const handleAIExercisePress = (exerciseType: ExerciseType) => {
    router.push({
      pathname: '/quiz/loading',
      params: {
        chapterId: chapterIdNum.toString(),
        bookId: chapter.bookId.toString(),
        exerciseType,
        quizType: exerciseType,
      },
    })
  }

  const handlePremadeExercisePress = (exerciseId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({
      pathname: '/quiz/premade' as any,
      params: {
        chapterId: chapterIdNum.toString(),
        bookId: chapter.bookId.toString(),
        exerciseId,
      },
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `Chapter ${chapter.chapterNumber}`,
          headerBackTitle: 'Chapters',
          headerLeft: () => (
            <Button
              chromeless
              icon={<ChevronLeft size={24} />}
              onPress={() => router.back()}
              testID="back-button"
            />
          ),
        }}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        testID="exercises-scroll-view"
      >
        <YStack padding="$4" gap="$4" testID="exercises-screen">
          {/* Chapter Info Header */}
          <YStack gap="$1" testID="chapter-header">
            <Text fontSize="$2" color="$gray10" testID="book-info">
              {book?.title} · {book?.titleChinese}
            </Text>
            <Text fontSize="$7" fontWeight="bold" testID="chapter-title-english">
              {chapter.titleEnglish}
            </Text>
            <Text fontSize="$5" color="$gray11" testID="chapter-title-chinese">
              {chapter.titleChinese}
            </Text>
          </YStack>

          {/* Browse Content Buttons — conditionally shown based on content availability (Story 3.7) */}
          {hasBrowseContent && (
            <XStack gap="$2" testID="browse-buttons">
              {hasVocabulary && (
                <Button
                  flex={1}
                  size="$3"
                  icon={<BookOpen size={16} />}
                  onPress={() => router.push(`/chapter/${chapterIdNum}/vocabulary`)}
                  testID="browse-vocabulary-button"
                  chromeless
                  bordered
                >
                  Vocabulary
                </Button>
              )}
              {hasGrammar && (
                <Button
                  flex={1}
                  size="$3"
                  icon={<MessageSquare size={16} />}
                  onPress={() => router.push(`/chapter/${chapterIdNum}/grammar`)}
                  testID="browse-grammar-button"
                  chromeless
                  bordered
                >
                  Grammar
                </Button>
              )}
              {hasDialogues && (
                <Button
                  flex={1}
                  size="$3"
                  icon={<MessageCircle size={16} />}
                  onPress={() => router.push(`/chapter/${chapterIdNum}/dialogues`)}
                  testID="browse-dialogues-button"
                  chromeless
                  bordered
                >
                  Dialogues
                </Button>
              )}
            </XStack>
          )}

          {/* Workbook Exercises Section — hidden when no premade exercises exist */}
          {hasPremadeExercises && (
            <YStack gap="$3" testID="premade-exercises-section">
              <H2 fontSize="$6" fontWeight="bold" testID="premade-section-header">
                Workbook Exercises
              </H2>
              <YStack gap="$2">
                {(premadeExercises ?? []).map((exercise) => (
                  <PremadeExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    progress={progressMap[exercise.exercise_type] ?? null}
                    onPress={() => handlePremadeExercisePress(exercise.id)}
                  />
                ))}
              </YStack>
            </YStack>
          )}

          {/* AI-Generated Exercises Section */}
          <YStack gap="$3" testID="ai-exercises-section">
            <H2 fontSize="$6" fontWeight="bold" testID="ai-section-header">
              AI-Generated Exercises
            </H2>

            {/* 2-column grid of exercise type cards */}
            <YStack gap="$2" testID="exercise-type-grid">
              {/* Render cards in pairs for 2-column layout */}
              {Array.from({ length: Math.ceil(EXERCISE_TYPES.length / 2) }, (_, rowIndex) => {
                const leftCard = EXERCISE_TYPES[rowIndex * 2]
                const rightCard = EXERCISE_TYPES[rowIndex * 2 + 1]

                // Use left card type as stable row key (always defined)
                const rowKey = leftCard.type

                return (
                  <XStack key={rowKey} gap="$2">
                    {leftCard && (
                      <ExerciseTypeCard
                        type={leftCard.type}
                        label={leftCard.label}
                        icon={<leftCard.icon size={20} />}
                        subtitle={'subtitle' in leftCard ? leftCard.subtitle : undefined}
                        progress={progressMap[leftCard.type] ?? null}
                        onPress={() => handleAIExercisePress(leftCard.type)}
                        isMixed={'isMixed' in leftCard ? leftCard.isMixed : false}
                      />
                    )}
                    {rightCard ? (
                      <ExerciseTypeCard
                        type={rightCard.type}
                        label={rightCard.label}
                        icon={<rightCard.icon size={20} />}
                        subtitle={'subtitle' in rightCard ? rightCard.subtitle : undefined}
                        progress={progressMap[rightCard.type] ?? null}
                        onPress={() => handleAIExercisePress(rightCard.type)}
                        isMixed={false}
                      />
                    ) : (
                      /* Empty spacer to maintain grid alignment */
                      <YStack flex={1} />
                    )}
                  </XStack>
                )
              })}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </>
  )
}
