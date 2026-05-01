/**
 * Multi-Chapter Quiz Generator Screen
 *
 * Lets the user build a quiz spanning a range of chapters across books,
 * choosing the number of questions and which exercise types to sample from.
 *
 * Calls POST /api/quizzes/generate-multi, then loads the resulting quiz into
 * useQuizStore and navigates to /quiz/play.
 */

import { useState, useMemo, useCallback } from 'react'
import { ScrollView, Alert } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  H2,
  Button,
  Card,
  Input,
  Spinner,
} from 'tamagui'
import { useRouter, Stack } from 'expo-router'
import { Sparkles } from '@tamagui/lucide-icons'

import { BOOKS } from '../../constants/books'
import { CHAPTERS, getChapter } from '../../constants/chapters'
import { api } from '../../lib/api'
import { useQuizStore } from '../../stores/useQuizStore'
import {
  EXERCISE_TYPE_LABELS,
  QuizGenerationError,
  type ExerciseType,
  type QuizResponse,
} from '../../types/quiz'

const SELECTABLE_EXERCISE_TYPES: ExerciseType[] = [
  'vocabulary',
  'grammar',
  'fill_in_blank',
  'matching',
  'dialogue_completion',
  'sentence_construction',
  'reading_comprehension',
]

const MIN_QUESTIONS = 5
const MAX_QUESTIONS = 50
const DEFAULT_QUESTIONS = 10

function chapterIdFor(bookId: number, chapterNumber: number): number {
  return bookId * 100 + chapterNumber
}

function chapterLabel(bookId: number, chapterNumber: number): string {
  const ch = getChapter(chapterIdFor(bookId, chapterNumber))
  return ch ? `Ch ${chapterNumber}: ${ch.titleEnglish}` : `Ch ${chapterNumber}`
}

interface BookChapterPickerProps {
  label: string
  bookId: number
  chapterNumber: number
  onChange: (bookId: number, chapterNumber: number) => void
}

function BookChapterPicker({
  label,
  bookId,
  chapterNumber,
  onChange,
}: BookChapterPickerProps) {
  const book = BOOKS.find((b) => b.id === bookId)
  const chapterCount = book?.chapterCount ?? 1

  return (
    <Card bordered padding="$3" borderRadius="$3">
      <YStack gap="$2">
        <Text fontSize="$3" fontWeight="600" color="$color11">
          {label}
        </Text>

        <Text fontSize="$2" color="$color10">
          Book
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {BOOKS.map((b) => (
            <Button
              key={b.id}
              size="$2"
              theme={b.id === bookId ? 'blue' : undefined}
              onPress={() => onChange(b.id, 1)}
              testID={`${label.toLowerCase()}-book-${b.id}`}
            >
              {b.title}
            </Button>
          ))}
        </XStack>

        <Text fontSize="$2" color="$color10" marginTop="$2">
          Chapter
        </Text>
        <XStack gap="$2" flexWrap="wrap">
          {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              size="$2"
              theme={n === chapterNumber ? 'blue' : undefined}
              onPress={() => onChange(bookId, n)}
              testID={`${label.toLowerCase()}-chapter-${n}`}
            >
              {String(n)}
            </Button>
          ))}
        </XStack>

        <Text fontSize="$2" color="$color11" marginTop="$2">
          {chapterLabel(bookId, chapterNumber)}
        </Text>
      </YStack>
    </Card>
  )
}

export default function GenerateScreen() {
  const router = useRouter()
  const startQuiz = useQuizStore((s) => s.startQuiz)

  const [startBook, setStartBook] = useState(2)
  const [startChapter, setStartChapter] = useState(11)
  const [endBook, setEndBook] = useState(3)
  const [endChapter, setEndChapter] = useState(3)
  const [questionCountText, setQuestionCountText] = useState(
    String(DEFAULT_QUESTIONS),
  )
  const [selectedTypes, setSelectedTypes] = useState<ExerciseType[]>([
    'vocabulary',
    'grammar',
  ])
  const [submitting, setSubmitting] = useState(false)

  const startId = chapterIdFor(startBook, startChapter)
  const endId = chapterIdFor(endBook, endChapter)

  const chaptersInRange = useMemo(
    () => CHAPTERS.filter((c) => c.id >= startId && c.id <= endId),
    [startId, endId],
  )

  const parsedCount = parseInt(questionCountText, 10)
  const countValid =
    Number.isFinite(parsedCount) &&
    parsedCount >= MIN_QUESTIONS &&
    parsedCount <= MAX_QUESTIONS

  const rangeValid = startId <= endId && chaptersInRange.length > 0
  const typesValid = selectedTypes.length > 0
  const canSubmit = rangeValid && typesValid && countValid && !submitting

  const toggleType = useCallback((type: ExerciseType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const result = await api.generateMultiChapterQuiz({
        chapterIdStart: startId,
        chapterIdEnd: endId,
        questionCount: parsedCount,
        exerciseTypes: selectedTypes,
      })

      const quizPayload: QuizResponse = {
        quiz_id: result.quiz_id,
        chapter_id: result.chapter_id_start,
        book_id: Math.floor(result.chapter_id_start / 100),
        exercise_type:
          selectedTypes.length === 1
            ? selectedTypes[0]
            : ('mixed' as ExerciseType),
        question_count: result.question_count,
        questions: result.questions,
      }

      startQuiz(
        result.quiz_id,
        quizPayload,
        result.chapter_id_start,
        Math.floor(result.chapter_id_start / 100),
        quizPayload.exercise_type,
        result.chapter_id_end,
      )

      router.push('/quiz/play' as never)
    } catch (err) {
      const msg =
        err instanceof QuizGenerationError
          ? err.message
          : 'Could not generate quiz. Please try again.'
      Alert.alert('Generation failed', msg)
    } finally {
      setSubmitting(false)
    }
  }, [
    canSubmit,
    startId,
    endId,
    parsedCount,
    selectedTypes,
    startQuiz,
    router,
  ])

  return (
    <>
      <Stack.Screen options={{ title: 'Generate Quiz' }} />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <YStack gap="$4" testID="generate-screen">
          <YStack gap="$1">
            <H2>Multi-Chapter Quiz</H2>
            <Text fontSize="$3" color="$color11">
              Pick a chapter range, the number of questions, and which exercise
              types to mix.
            </Text>
          </YStack>

          <BookChapterPicker
            label="From"
            bookId={startBook}
            chapterNumber={startChapter}
            onChange={(b, c) => {
              setStartBook(b)
              setStartChapter(c)
              if (b * 100 + c > endBook * 100 + endChapter) {
                setEndBook(b)
                setEndChapter(c)
              }
            }}
          />

          <BookChapterPicker
            label="To"
            bookId={endBook}
            chapterNumber={endChapter}
            onChange={(b, c) => {
              setEndBook(b)
              setEndChapter(c)
            }}
          />

          {!rangeValid && (
            <Text fontSize="$2" color="$red10" testID="range-error">
              Invalid range — start must come before or equal to end.
            </Text>
          )}

          <Card bordered padding="$3" borderRadius="$3">
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Number of questions
              </Text>
              <Input
                value={questionCountText}
                onChangeText={setQuestionCountText}
                keyboardType="numeric"
                placeholder={`${MIN_QUESTIONS}–${MAX_QUESTIONS}`}
                testID="question-count-input"
              />
              {!countValid && (
                <Text fontSize="$2" color="$red10">
                  Pick a number between {MIN_QUESTIONS} and {MAX_QUESTIONS}.
                </Text>
              )}
            </YStack>
          </Card>

          <Card bordered padding="$3" borderRadius="$3">
            <YStack gap="$2">
              <Text fontSize="$3" fontWeight="600">
                Exercise types
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {SELECTABLE_EXERCISE_TYPES.map((type) => {
                  const active = selectedTypes.includes(type)
                  return (
                    <Button
                      key={type}
                      size="$2"
                      theme={active ? 'blue' : undefined}
                      onPress={() => toggleType(type)}
                      testID={`type-${type}`}
                    >
                      {EXERCISE_TYPE_LABELS[type]}
                    </Button>
                  )
                })}
              </XStack>
              {!typesValid && (
                <Text fontSize="$2" color="$red10">
                  Pick at least one exercise type.
                </Text>
              )}
            </YStack>
          </Card>

          <Card bordered padding="$3" borderRadius="$3" backgroundColor="$backgroundHover">
            <YStack gap="$1">
              <Text fontSize="$2" color="$color11">
                Range covers {chaptersInRange.length}{' '}
                {chaptersInRange.length === 1 ? 'chapter' : 'chapters'}.
              </Text>
              <Text fontSize="$2" color="$color10">
                {chaptersInRange.length > 0
                  ? `${chapterLabel(startBook, startChapter)} → ${chapterLabel(endBook, endChapter)}`
                  : 'No valid chapters in range.'}
              </Text>
            </YStack>
          </Card>

          <Button
            size="$5"
            theme="blue"
            icon={submitting ? undefined : <Sparkles size={20} />}
            onPress={onSubmit}
            disabled={!canSubmit}
            testID="generate-submit"
          >
            {submitting ? <Spinner /> : <Text>Generate Quiz</Text>}
          </Button>
        </YStack>
      </ScrollView>
    </>
  )
}
