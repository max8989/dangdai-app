import { useCallback, useMemo, useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Languages,
  Layers,
  Loader2,
  MessagesSquare,
  Minus,
  PencilLine,
  Plus,
  Shuffle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

const EXERCISE_TYPE_ICONS: Record<ExerciseType, LucideIcon> = {
  vocabulary: Languages,
  grammar: BookOpen,
  fill_in_blank: PencilLine,
  matching: Shuffle,
  dialogue_completion: MessagesSquare,
  sentence_construction: Layers,
  reading_comprehension: BookOpenCheck,
  mixed: Sparkles,
}

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

interface PillButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  testId?: string
  size?: 'sm' | 'md'
}

function PillButton({ active, onClick, children, testId, size = 'md' }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'rounded-full border font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/30',
      )}
    >
      {children}
    </button>
  )
}

interface ChapterChipProps {
  active: boolean
  onClick: () => void
  number: number
  testId?: string
}

function ChapterChip({ active, onClick, number, testId }: ChapterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'flex size-9 items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/30',
      )}
    >
      {number}
    </button>
  )
}

interface BookChapterPickerProps {
  bookId: number
  chapterNumber: number
  onChange: (bookId: number, chapterNumber: number) => void
  slug: string
}

function BookChapterPicker({ bookId, chapterNumber, onChange, slug }: BookChapterPickerProps) {
  const book = BOOKS.find((b) => b.id === bookId)
  const chapterCount = book?.chapterCount ?? 1

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {BOOKS.map((b) => (
          <PillButton
            key={b.id}
            active={b.id === bookId}
            onClick={() => onChange(b.id, 1)}
            testId={`${slug}-book-${b.id}`}
            size="sm"
          >
            {b.title}
          </PillButton>
        ))}
      </div>

      <div className="grid grid-cols-8 gap-1.5">
        {Array.from({ length: chapterCount }, (_, i) => i + 1).map((n) => (
          <ChapterChip
            key={n}
            active={n === chapterNumber}
            onClick={() => onChange(bookId, n)}
            number={n}
            testId={`${slug}-chapter-${n}`}
          />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{chapterLabel(bookId, chapterNumber)}</p>
    </div>
  )
}

/** "Custom" mode: multi-select chips across all books with collapsible sections. */
interface MultiChapterPickerProps {
  selectedIds: Set<number>
  onToggle: (chapterId: number) => void
  onSelectAllBook: (bookId: number) => void
  onClearBook: (bookId: number) => void
}

function MultiChapterPicker({
  selectedIds,
  onToggle,
  onSelectAllBook,
  onClearBook,
}: MultiChapterPickerProps) {
  return (
    <div className="space-y-4">
      {BOOKS.map((book) => {
        const chaptersForBook = Array.from(
          { length: book.chapterCount },
          (_, i) => i + 1,
        )
        const bookSelectedCount = chaptersForBook.filter((n) =>
          selectedIds.has(chapterIdFor(book.id, n)),
        ).length
        return (
          <div key={book.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {book.title}
                <span className="ml-2 text-[10px] font-medium text-muted-foreground/70">
                  {bookSelectedCount}/{book.chapterCount}
                </span>
              </p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onSelectAllBook(book.id)}
                  className="rounded-md px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10"
                  data-testid={`custom-book-${book.id}-all`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => onClearBook(book.id)}
                  className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                  data-testid={`custom-book-${book.id}-clear`}
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {chaptersForBook.map((n) => {
                const id = chapterIdFor(book.id, n)
                return (
                  <ChapterChip
                    key={id}
                    active={selectedIds.has(id)}
                    onClick={() => onToggle(id)}
                    number={n}
                    testId={`custom-chip-${id}`}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type GenerationMode = 'range' | 'custom'

function GeneratePage() {
  const navigate = useNavigate()
  const startQuiz = useQuizStore((s) => s.startQuiz)
  // The previous quiz payload (if any) — used in Custom mode to avoid
  // re-emitting question texts the user has just seen.
  const previousQuizPayload = useQuizStore((s) => s.quizPayload)

  const [mode, setMode] = useState<GenerationMode>('range')

  // Range-mode state (existing)
  const [startBook, setStartBook] = useState(2)
  const [startChapter, setStartChapter] = useState(11)
  const [endBook, setEndBook] = useState(3)
  const [endChapter, setEndChapter] = useState(3)

  // Custom-mode state — Set of composite chapter IDs
  const [customSelectedIds, setCustomSelectedIds] = useState<Set<number>>(
    () => new Set<number>([201, 207, 305]),
  )

  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTIONS)
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

  const customChapterIds = useMemo(
    () => Array.from(customSelectedIds).sort((a, b) => a - b),
    [customSelectedIds],
  )

  const countValid = questionCount >= MIN_QUESTIONS && questionCount <= MAX_QUESTIONS
  const rangeValid = startId <= endId && chaptersInRange.length > 0
  const customValid = customChapterIds.length > 0 && customChapterIds.length <= 30
  const typesValid = selectedTypes.length > 0
  const selectionValid = mode === 'range' ? rangeValid : customValid
  const canSubmit = selectionValid && typesValid && countValid && !submitting

  const toggleType = useCallback((type: ExerciseType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    )
  }, [])

  const decrementCount = useCallback(() => {
    setQuestionCount((c) => Math.max(MIN_QUESTIONS, c - 1))
  }, [])

  const incrementCount = useCallback(() => {
    setQuestionCount((c) => Math.min(MAX_QUESTIONS, c + 1))
  }, [])

  const toggleCustomChapter = useCallback((id: number) => {
    setCustomSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAllInBook = useCallback((bookId: number) => {
    const book = BOOKS.find((b) => b.id === bookId)
    if (!book) return
    setCustomSelectedIds((prev) => {
      const next = new Set(prev)
      for (let n = 1; n <= book.chapterCount; n++) {
        next.add(chapterIdFor(bookId, n))
      }
      return next
    })
  }, [])

  const clearBook = useCallback((bookId: number) => {
    const book = BOOKS.find((b) => b.id === bookId)
    if (!book) return
    setCustomSelectedIds((prev) => {
      const next = new Set(prev)
      for (let n = 1; n <= book.chapterCount; n++) {
        next.delete(chapterIdFor(bookId, n))
      }
      return next
    })
  }, [])

  const onSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      const exerciseType: ExerciseType =
        selectedTypes.length === 1 ? selectedTypes[0] : 'mixed'

      if (mode === 'custom') {
        // If the previous quiz covered any of the chapters we're about to
        // regenerate, hand the backend the question texts the user just saw
        // so it skips obvious repeats.
        const prevChapterId = previousQuizPayload?.chapter_id
        const previousQuizOverlaps =
          prevChapterId != null && customSelectedIds.has(prevChapterId)
        const avoidQuestionTexts: string[] = previousQuizOverlaps
          ? (previousQuizPayload?.questions ?? [])
              .map((q) => q.question_text)
              .filter((t): t is string => Boolean(t))
          : []

        const result = await api.generateCustomQuiz({
          chapterIds: customChapterIds,
          questionCount,
          exerciseTypes: selectedTypes,
          avoidQuestionTexts: avoidQuestionTexts.slice(0, 50),
        })

        const firstId = result.chapter_ids[0] ?? customChapterIds[0]
        const lastId = result.chapter_ids[result.chapter_ids.length - 1] ?? firstId

        const quizPayload: QuizResponse = {
          quiz_id: result.quiz_id,
          chapter_id: firstId,
          book_id: Math.floor(firstId / 100),
          exercise_type: exerciseType,
          question_count: result.question_count,
          questions: result.questions,
        }

        startQuiz(
          result.quiz_id,
          quizPayload,
          firstId,
          Math.floor(firstId / 100),
          exerciseType,
          lastId,
        )
      } else {
        const result = await api.generateMultiChapterQuiz({
          chapterIdStart: startId,
          chapterIdEnd: endId,
          questionCount,
          exerciseTypes: selectedTypes,
        })

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
      }

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
  }, [
    canSubmit,
    mode,
    customChapterIds,
    customSelectedIds,
    previousQuizPayload,
    startId,
    endId,
    questionCount,
    selectedTypes,
    startQuiz,
    navigate,
  ])

  return (
    <section className="flex flex-col gap-3 p-4 pt-5 pb-24" data-testid="generate-screen">
      {/* Compact header */}
      <header className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold leading-tight tracking-tight">Generate Quiz</h1>
          <p className="text-xs text-muted-foreground">Mix chapters and exercise types</p>
        </div>
      </header>

      {/* Mode selector — Range vs Custom */}
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as GenerationMode)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2" data-testid="mode-tabs">
          <TabsTrigger value="range" data-testid="mode-range">
            Range
          </TabsTrigger>
          <TabsTrigger value="custom" data-testid="mode-custom">
            Custom
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === 'range' ? (
        <>
          {/* Range card */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2 text-sm">
                <span className="font-semibold tabular-nums">
                  B{startBook}·{startChapter}
                </span>
                <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-semibold tabular-nums">
                  B{endBook}·{endChapter}
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary tabular-nums">
                {chaptersInRange.length} {chaptersInRange.length === 1 ? 'ch' : 'chs'}
              </span>
            </div>

            <Tabs defaultValue="from" className="p-3">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="from">From</TabsTrigger>
                <TabsTrigger value="to">To</TabsTrigger>
              </TabsList>

              <TabsContent value="from" className="mt-3">
                <BookChapterPicker
                  bookId={startBook}
                  chapterNumber={startChapter}
                  slug="from"
                  onChange={(b, c) => {
                    setStartBook(b)
                    setStartChapter(c)
                    if (b * 100 + c > endBook * 100 + endChapter) {
                      setEndBook(b)
                      setEndChapter(c)
                    }
                  }}
                />
              </TabsContent>

              <TabsContent value="to" className="mt-3">
                <BookChapterPicker
                  bookId={endBook}
                  chapterNumber={endChapter}
                  slug="to"
                  onChange={(b, c) => {
                    setEndBook(b)
                    setEndChapter(c)
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>

          {!rangeValid && (
            <p
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
              data-testid="range-error"
            >
              Invalid range — start must come before or equal to end.
            </p>
          )}
        </>
      ) : (
        <>
          {/* Custom multi-select card */}
          <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
              <p className="text-sm font-semibold">Pick chapters</p>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
                  customChapterIds.length > 30
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-primary/10 text-primary',
                )}
                data-testid="custom-count-badge"
              >
                {customChapterIds.length} / 30
              </span>
            </div>
            <div className="p-3">
              <MultiChapterPicker
                selectedIds={customSelectedIds}
                onToggle={toggleCustomChapter}
                onSelectAllBook={selectAllInBook}
                onClearBook={clearBook}
              />
              <p className="mt-3 text-[11px] text-muted-foreground">
                Fresh content every call — different seed each time, so two
                runs with the same chapters give different questions.
              </p>
            </div>
          </div>

          {!customValid && (
            <p
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
              data-testid="custom-error"
            >
              {customChapterIds.length === 0
                ? 'Pick at least one chapter.'
                : `Too many chapters (${customChapterIds.length}). Max is 30.`}
            </p>
          )}
        </>
      )}

      {/* Question count stepper */}
      <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-sm">
        <div>
          <p className="text-sm font-semibold">Questions</p>
          <p className="text-[11px] text-muted-foreground">
            {MIN_QUESTIONS}–{MAX_QUESTIONS} per quiz
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={decrementCount}
            disabled={questionCount <= MIN_QUESTIONS}
            className="size-8 rounded-full"
            aria-label="Decrease questions"
          >
            <Minus className="size-3.5" />
          </Button>
          <span
            className="w-9 text-center text-xl font-bold tabular-nums"
            data-testid="question-count-input"
          >
            {questionCount}
          </span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={incrementCount}
            disabled={questionCount >= MAX_QUESTIONS}
            className="size-8 rounded-full"
            aria-label="Increase questions"
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Exercise types grid */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-sm font-semibold">Exercise types</p>
          <span className="text-[11px] text-muted-foreground">
            {selectedTypes.length} selected
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {SELECTABLE_EXERCISE_TYPES.map((type) => {
            const Icon = EXERCISE_TYPE_ICONS[type]
            const active = selectedTypes.includes(type)
            return (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                data-testid={`type-${type}`}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-2.5 text-left text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'border-primary bg-primary/10 text-foreground shadow-sm'
                    : 'border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/30',
                )}
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                    active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-3.5" />
                </span>
                <span className="truncate text-xs">{EXERCISE_TYPE_LABELS[type]}</span>
              </button>
            )
          })}
        </div>
        {!typesValid && (
          <p className="mt-2 text-xs text-destructive">Pick at least one exercise type.</p>
        )}
      </div>

      {/* Generate button */}
      <Button
        size="lg"
        onClick={onSubmit}
        disabled={!canSubmit}
        className="mt-1 h-12 gap-2 rounded-xl text-base font-semibold shadow-sm"
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
