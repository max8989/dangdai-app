import { useCallback, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BOOKS } from '@/constants/books'
import { CHAPTERS, getChapter } from '@/constants/chapters'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useQuizStore } from '@/stores/useQuizStore'
import {
  EXERCISE_TYPE_LABELS,
  QuizGenerationError,
  type ExerciseType,
  type QuizResponse,
} from '@/types/quiz'

export const Route = createFileRoute('/_authed/_tabs/generate')({
  component: GeneratePage,
})

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

interface ChipButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  testId?: string
}

function ChipButton({ active, onClick, children, testId }: ChipButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

interface BookChapterPickerProps {
  label: string
  bookId: number
  chapterNumber: number
  onChange: (bookId: number, chapterNumber: number) => void
}

function BookChapterPicker({ label, bookId, chapterNumber, onChange }: BookChapterPickerProps) {
  const book = BOOKS.find((b) => b.id === bookId)
  const chapterCount = book?.chapterCount ?? 1
  const slug = label.toLowerCase()

  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-3 text-xs text-muted-foreground">Book</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {BOOKS.map((b) => (
          <ChipButton
            key={b.id}
            active={b.id === bookId}
            onClick={() => onChange(b.id, 1)}
            testId={`${slug}-book-${b.id}`}
          >
            {b.title}
          </ChipButton>
        ))}
      </div>

      <p className="mt-3 text-xs text-muted-foreground">Chapter</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
          <ChipButton
            key={n}
            active={n === chapterNumber}
            onClick={() => onChange(bookId, n)}
            testId={`${slug}-chapter-${n}`}
          >
            {String(n)}
          </ChipButton>
        ))}
      </div>

      <p className="mt-3 text-sm text-foreground">{chapterLabel(bookId, chapterNumber)}</p>
    </div>
  )
}

function GeneratePage() {
  const navigate = useNavigate()
  const startQuiz = useQuizStore((s) => s.startQuiz)

  const [startBook, setStartBook] = useState(2)
  const [startChapter, setStartChapter] = useState(11)
  const [endBook, setEndBook] = useState(3)
  const [endChapter, setEndChapter] = useState(3)
  const [questionCountText, setQuestionCountText] = useState(String(DEFAULT_QUESTIONS))
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

      const exerciseType: ExerciseType =
        selectedTypes.length === 1 ? selectedTypes[0] : 'mixed'

      const quizPayload: QuizResponse = {
        quiz_id: result.quiz_id,
        chapter_id: result.chapter_id_start,
        book_id: Math.floor(result.chapter_id_start / 100),
        exercise_type: exerciseType,
        question_count: result.question_count,
        questions: result.questions,
      }

      startQuiz(
        result.quiz_id,
        quizPayload,
        result.chapter_id_start,
        Math.floor(result.chapter_id_start / 100),
        exerciseType,
        result.chapter_id_end,
      )

      await navigate({ to: '/quiz/play' })
    } catch (err) {
      const msg =
        err instanceof QuizGenerationError
          ? err.message
          : 'Could not generate quiz. Please try again.'
      toast.error('Generation failed', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, startId, endId, parsedCount, selectedTypes, startQuiz, navigate])

  return (
    <section className="flex flex-col gap-4 p-4 pt-6" data-testid="generate-screen">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Multi-Chapter Quiz</h1>
        <p className="text-sm text-muted-foreground">
          Pick a chapter range, the number of questions, and which exercise types to mix.
        </p>
      </div>

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
        <p
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          data-testid="range-error"
        >
          Invalid range — start must come before or equal to end.
        </p>
      )}

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <Label htmlFor="question-count" className="text-sm font-semibold">
          Number of questions
        </Label>
        <Input
          id="question-count"
          inputMode="numeric"
          pattern="[0-9]*"
          value={questionCountText}
          onChange={(e) => setQuestionCountText(e.target.value)}
          placeholder={`${MIN_QUESTIONS}–${MAX_QUESTIONS}`}
          className="mt-2"
          data-testid="question-count-input"
        />
        {!countValid && (
          <p className="mt-2 text-xs text-destructive">
            Pick a number between {MIN_QUESTIONS} and {MAX_QUESTIONS}.
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <p className="text-sm font-semibold">Exercise types</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SELECTABLE_EXERCISE_TYPES.map((type) => (
            <ChipButton
              key={type}
              active={selectedTypes.includes(type)}
              onClick={() => toggleType(type)}
              testId={`type-${type}`}
            >
              {EXERCISE_TYPE_LABELS[type]}
            </ChipButton>
          ))}
        </div>
        {!typesValid && (
          <p className="mt-2 text-xs text-destructive">Pick at least one exercise type.</p>
        )}
      </div>

      <div className="rounded-xl border bg-muted/40 p-4">
        <p className="text-sm text-foreground">
          Range covers {chaptersInRange.length}{' '}
          {chaptersInRange.length === 1 ? 'chapter' : 'chapters'}.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {chaptersInRange.length > 0
            ? `${chapterLabel(startBook, startChapter)} → ${chapterLabel(endBook, endChapter)}`
            : 'No valid chapters in range.'}
        </p>
      </div>

      <Button
        size="lg"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="gap-2"
        data-testid="generate-submit"
      >
        {submitting ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Sparkles className="size-5" />
        )}
        {submitting ? 'Generating…' : 'Generate Quiz'}
      </Button>
    </section>
  )
}
