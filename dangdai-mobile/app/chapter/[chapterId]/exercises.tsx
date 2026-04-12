/**
 * Exercise Type Selection Screen
 *
 * Displays all exercise types for a chapter with dual actions per card:
 * - "Premade" (instant) → /quiz/premade
 * - "Generate with AI" (~15-20s) → /quiz/ai-loading
 *
 * Story 3.5, 3.7, 11.5–11.7, 4.16, 4.17
 */

import { ScrollView } from 'react-native'
import { YStack, XStack, Text, H2, Button } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import {
  BookOpen,
  MessageSquare,
  MessageCircle,
  ChevronLeft,
} from '@tamagui/lucide-icons'

import { PremadeExerciseCard } from '../../../components/chapter/PremadeExerciseCard'
import { useExerciseTypeProgress } from '../../../hooks/useExerciseTypeProgress'
import { usePremadeExercises } from '../../../hooks/usePremadeExercises'
import { useChapter } from '../../../hooks/useChapters'
import { useVocabularyCount } from '../../../hooks/useVocabulary'
import { useGrammarPointsCount } from '../../../hooks/useGrammarPoints'
import { useDialoguesCount } from '../../../hooks/useDialogues'
import { BOOKS } from '../../../constants/books'
import type { ExerciseTypeProgress } from '../../../components/chapter/ExerciseTypeCard'

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

  // Fetch premade exercises — all 8 types served from premade_exercises table (Story 4.16)
  // Hook is disabled when bookId=0 or lessonId=0 via its own `enabled` guard
  const { data: premadeExercises } = usePremadeExercises(bookId, lessonId)

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

  // Exercise types the backend LLM pipeline can generate on-the-fly (Story 4.17)
  const AI_GENERATABLE_TYPES = new Set([
    'vocabulary', 'grammar', 'fill_in_blank', 'matching',
    'dialogue_completion', 'sentence_construction', 'reading_comprehension', 'mixed',
  ])

  const handleGenerateWithAI = (exerciseType: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({
      pathname: '/quiz/ai-loading' as any,
      params: {
        bookId: bookId.toString(),
        chapterId: chapterIdNum.toString(),
        exerciseType,
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

          {/* Exercises Section — all 8 types served from premade_exercises table (Story 4.16) */}
          {premadeExercises && premadeExercises.length > 0 && (
            <YStack gap="$3" testID="premade-exercises-section">
              <H2 fontSize="$6" fontWeight="bold" testID="premade-section-header">
                Exercises
              </H2>
              <YStack gap="$2">
                {premadeExercises.map((exercise) => (
                  <PremadeExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    progress={progressMap[exercise.exercise_type] ?? null}
                    onPress={() => handlePremadeExercisePress(exercise.id)}
                    onGeneratePress={
                      AI_GENERATABLE_TYPES.has(exercise.exercise_type)
                        ? () => handleGenerateWithAI(exercise.exercise_type)
                        : undefined
                    }
                  />
                ))}
              </YStack>
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </>
  )
}
