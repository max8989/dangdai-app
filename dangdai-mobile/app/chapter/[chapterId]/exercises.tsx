/**
 * Exercise Type Selection Screen
 *
 * Displays all exercise types for a chapter with dual actions per card:
 * - "Premade" (instant) → /quiz/premade
 * - "Generate with AI" (~15-20s) → /quiz/ai-loading
 *
 * Story 3.5, 3.7, 11.5–11.7, 4.16, 4.17
 */

import React from 'react'
import { ScrollView } from 'react-native'
import { YStack, XStack, Text, H2, Button, Card } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import {
  BookOpen,
  MessageSquare,
  MessageCircle,
  ChevronLeft,
  Sparkles,
  Check,
} from '@tamagui/lucide-icons'

import { useExerciseTypeProgress } from '../../../hooks/useExerciseTypeProgress'
import { useChapter } from '../../../hooks/useChapters'
import { useVocabularyCount } from '../../../hooks/useVocabulary'
import { useGrammarPointsCount } from '../../../hooks/useGrammarPoints'
import { useDialoguesCount } from '../../../hooks/useDialogues'
import { BOOKS } from '../../../constants/books'
import type { ExerciseTypeProgress } from '../../../components/chapter/ExerciseTypeCard'

// ─── AI Exercise Types ───────────────────────────────────────────────────────

const AI_GENERATABLE_TYPES_LIST = [
  { type: 'vocabulary', label: 'Vocabulary' },
  { type: 'grammar', label: 'Grammar' },
  { type: 'fill_in_blank', label: 'Fill in the Blank' },
  // { type: 'matching', label: 'Matching' }, // hidden — Reanimated color bug
  { type: 'dialogue_completion', label: 'Dialogue Completion' },
  { type: 'sentence_construction', label: 'Sentence Construction' },
  { type: 'reading_comprehension', label: 'Reading Comprehension' },
  // { type: 'mixed', label: 'Mixed Practice' }, // hidden for now
]

function AIExerciseCard({
  label,
  exerciseType,
  progress,
  onPress,
}: {
  label: string
  exerciseType: string
  progress: ExerciseTypeProgress | null
  onPress: () => void
}) {
  return (
    <Card
      elevate
      bordered
      padding="$3"
      borderRadius="$3"
      testID={`ai-exercise-card-${exerciseType}`}
    >
      <XStack alignItems="center" gap="$3">
        <YStack flex={1} gap="$1">
          <Text fontSize="$4" fontWeight="500">{label}</Text>
        </YStack>

        {progress?.mastered ? (
          <Check size={20} color="$green10" />
        ) : progress && progress.bestScore > 0 ? (
          <Text fontSize="$3" color="$blue10">{Math.round(progress.bestScore)}%</Text>
        ) : null}
      </XStack>

      <Button
        size="$3"
        marginTop="$2"
        icon={<Sparkles size={14} />}
        onPress={onPress}
        testID={`generate-ai-${exerciseType}`}
      >
        Generate with AI
      </Button>
    </Card>
  )
}

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

          {/* Exercises Section — AI-only generation (Story 4.17) */}
          <YStack gap="$3" testID="ai-exercises-section">
            <H2 fontSize="$6" fontWeight="bold" testID="exercises-section-header">
              Exercises
            </H2>
            <YStack gap="$2">
              {AI_GENERATABLE_TYPES_LIST.map((item) => (
                <AIExerciseCard
                  key={item.type}
                  label={item.label}
                  exerciseType={item.type}
                  progress={progressMap[item.type] ?? null}
                  onPress={() => handleGenerateWithAI(item.type)}
                />
              ))}
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </>
  )
}
