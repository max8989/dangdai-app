import { useCallback, useMemo } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useGenerateStore, type GenerationMode } from '@/stores/useGenerateStore'
import {
  ArrowRight,
  BellRing,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Languages,
  Layers,
  Loader2,
  MessagesSquare,
  Minus,
  PencilLine,
  Plus,
  Sparkles,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BOOKS } from '@/constants/books'
import { CHAPTERS, getChapter } from '@/constants/chapters'
import { cn } from '@/lib/utils'
import {
  requestNotificationPermission,
  startGenerationJob,
} from '@/lib/generationJobs'
import { useGenerationJobsStore } from '@/stores/useGenerationJobsStore'
import { useQuizStore } from '@/stores/useQuizStore'
import {
  EXERCISE_TYPE_LABELS,
  type ExerciseType,
} from '@/types/quiz'

export const Route = createFileRoute('/_authed/_tabs/generate')({
  component: GeneratePage,
})

const SELECTABLE_EXERCISE_TYPES: ExerciseType[] = [
  'vocabulary',
  'grammar',
  'fill_in_blank',
  'dialogue_completion',
  'sentence_construction',
  'reading_comprehension',
]

const EXERCISE_TYPE_ICONS: Record<ExerciseType, LucideIcon> = {
  vocabulary: Languages,
  grammar: BookOpen,
  fill_in_blank: PencilLine,
  matching: Layers,
  dialogue_completion: MessagesSquare,
  sentence_construction: Layers,
  reading_comprehension: BookOpenCheck,
  mixed: Sparkles,
}

const MIN_QUESTIONS = 5
const MAX_QUESTIONS = 50

function chapterIdFor(bookId: number, chapterNumber: number): number {
  return bookId * 100 + chapterNumber
}

function chapterLabel(bookId: number, chapterNumber: number): string {
  const ch = getChapter(chapterIdFor(bookId, chapterNumber))
  return ch ? `Ch ${chapterNumber}: ${ch.titleEnglish}` : `Ch ${chapterNumber}`
}

const MIN_BOOK_ID = BOOKS[0].id
const MAX_BOOK_ID = BOOKS[BOOKS.length - 1].id
const MAX_CHAPTER_COUNT = BOOKS.reduce(
  (acc, b) => Math.max(acc, b.chapterCount),
  1,
)

function chapterCountFor(bookId: number): number {
  return BOOKS.find((b) => b.id === bookId)?.chapterCount ?? 1
}

interface RangeSliderRowProps {
  label: string
  startLabel: string
  endLabel: string
  min: number
  max: number
  values: [number, number]
  onValueChange: (values: [number, number]) => void
  testId?: string
}

function RangeSliderRow({
  label,
  startLabel,
  endLabel,
  min,
  max,
  values,
  onValueChange,
  testId,
}: RangeSliderRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        <p className="text-sm font-semibold tabular-nums">
          {startLabel} <span className="text-muted-foreground">—</span> {endLabel}
        </p>
      </div>
      <Slider
        min={min}
        max={max}
        step={1}
        minStepsBetweenThumbs={0}
        value={values}
        onValueChange={(v) => {
          if (v.length < 2) return
          const next: [number, number] = [v[0], v[1]]
          onValueChange(next)
        }}
        data-testid={testId}
      />
    </div>
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

function GeneratePage() {
  const navigate = useNavigate()
  const startQuiz = useQuizStore((s) => s.startQuiz)
  // The previous quiz payload (if any) — used in Custom mode to avoid
  // re-emitting question texts the user has just seen.
  const previousQuizPayload = useQuizStore((s) => s.quizPayload)

  const mode = useGenerateStore((s) => s.mode)
  const setMode = useGenerateStore((s) => s.setMode)

  const startBook = useGenerateStore((s) => s.startBook)
  const startChapter = useGenerateStore((s) => s.startChapter)
  const endBook = useGenerateStore((s) => s.endBook)
  const endChapter = useGenerateStore((s) => s.endChapter)
  const setStartBook = useGenerateStore((s) => s.setStartBook)
  const setStartChapter = useGenerateStore((s) => s.setStartChapter)
  const setEndBook = useGenerateStore((s) => s.setEndBook)
  const setEndChapter = useGenerateStore((s) => s.setEndChapter)

  const customSelectedIdsArr = useGenerateStore((s) => s.customSelectedIds)
  const customSelectedIds = useMemo(
    () => new Set(customSelectedIdsArr),
    [customSelectedIdsArr],
  )
  const toggleCustomChapterStore = useGenerateStore((s) => s.toggleCustomChapter)
  const addCustomChapters = useGenerateStore((s) => s.addCustomChapters)
  const removeCustomChapters = useGenerateStore((s) => s.removeCustomChapters)

  const questionCount = useGenerateStore((s) => s.questionCount)
  const setQuestionCount = useGenerateStore((s) => s.setQuestionCount)
  const selectedTypes = useGenerateStore((s) => s.selectedTypes)
  const toggleSelectedType = useGenerateStore((s) => s.toggleSelectedType)
  const typesExpanded = useGenerateStore((s) => s.typesExpanded)
  const setTypesExpanded = useGenerateStore((s) => s.setTypesExpanded)

  const activeJobId = useGenerateStore((s) => s.activeJobId)
  const setActiveJobId = useGenerateStore((s) => s.setActiveJobId)
  const activeJob = useGenerationJobsStore((s) =>
    activeJobId ? s.jobs[activeJobId] : undefined,
  )
  const removeJob = useGenerationJobsStore((s) => s.removeJob)

  const submitting = activeJob?.status === 'generating'

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

  const toggleType = toggleSelectedType

  const decrementCount = useCallback(() => {
    setQuestionCount(Math.max(MIN_QUESTIONS, questionCount - 1))
  }, [questionCount, setQuestionCount])

  const incrementCount = useCallback(() => {
    setQuestionCount(Math.min(MAX_QUESTIONS, questionCount + 1))
  }, [questionCount, setQuestionCount])

  const toggleCustomChapter = toggleCustomChapterStore

  const selectAllInBook = useCallback(
    (bookId: number) => {
      const book = BOOKS.find((b) => b.id === bookId)
      if (!book) return
      const ids: number[] = []
      for (let n = 1; n <= book.chapterCount; n++) {
        ids.push(chapterIdFor(bookId, n))
      }
      addCustomChapters(ids)
    },
    [addCustomChapters],
  )

  const clearBook = useCallback(
    (bookId: number) => {
      const book = BOOKS.find((b) => b.id === bookId)
      if (!book) return
      const ids: number[] = []
      for (let n = 1; n <= book.chapterCount; n++) {
        ids.push(chapterIdFor(bookId, n))
      }
      removeCustomChapters(ids)
    },
    [removeCustomChapters],
  )

  const onSubmit = useCallback(() => {
    if (!canSubmit) return

    void requestNotificationPermission()

    let jobId: string
    if (mode === 'custom') {
      const prevChapterId = previousQuizPayload?.chapter_id
      const previousQuizOverlaps =
        prevChapterId != null && customSelectedIds.has(prevChapterId)
      const avoidQuestionTexts: string[] = previousQuizOverlaps
        ? (previousQuizPayload?.questions ?? [])
            .map((q) => q.question_text)
            .filter((t): t is string => Boolean(t))
        : []

      jobId = startGenerationJob({
        params: {
          source: 'custom',
          chapterIds: customChapterIds,
          questionCount,
          exerciseTypes: selectedTypes,
          avoidQuestionTexts: avoidQuestionTexts.slice(0, 50),
        },
      })
    } else {
      jobId = startGenerationJob({
        params: {
          source: 'multi',
          chapterIdStart: startId,
          chapterIdEnd: endId,
          questionCount,
          exerciseTypes: selectedTypes,
        },
      })
    }

    setActiveJobId(jobId)
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
    setActiveJobId,
  ])

  const onStartReady = useCallback(() => {
    if (!activeJob || activeJob.status !== 'ready' || !activeJob.result) return
    startQuiz(
      activeJob.result.quiz_id,
      activeJob.result,
      activeJob.chapterId ?? activeJob.result.chapter_id,
      activeJob.bookId ?? activeJob.result.book_id,
      activeJob.exerciseType ?? activeJob.result.exercise_type,
      activeJob.chapterIdEnd ?? null,
    )
    removeJob(activeJob.id)
    setActiveJobId(null)
    void navigate({ to: '/quiz/play' })
  }, [activeJob, startQuiz, removeJob, setActiveJobId, navigate])

  const onDismissActiveJob = useCallback(() => {
    if (activeJob) removeJob(activeJob.id)
    setActiveJobId(null)
  }, [activeJob, removeJob, setActiveJobId])

  const onLeaveToHome = useCallback(() => {
    toast('Generating in background', {
      description: "You'll see it on the home screen and we'll notify you.",
    })
    void navigate({ to: '/' })
  }, [navigate])

  const onRetryFromError = useCallback(() => {
    if (activeJob) removeJob(activeJob.id)
    setActiveJobId(null)
    // Re-submit with current form values
    onSubmit()
  }, [activeJob, removeJob, setActiveJobId, onSubmit])

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

            <div className="space-y-5 p-4">
              <RangeSliderRow
                label="Books"
                startLabel={`Book ${startBook}`}
                endLabel={`Book ${endBook}`}
                min={MIN_BOOK_ID}
                max={MAX_BOOK_ID}
                values={[startBook, endBook]}
                testId="book-range-slider"
                onValueChange={([s, e]) => {
                  setStartBook(s)
                  setEndBook(e)
                  const sMax = chapterCountFor(s)
                  const eMax = chapterCountFor(e)
                  if (startChapter > sMax) setStartChapter(sMax)
                  if (endChapter > eMax) setEndChapter(eMax)
                }}
              />

              <RangeSliderRow
                label="Chapters"
                startLabel={`Ch ${startChapter}`}
                endLabel={`Ch ${endChapter}`}
                min={1}
                max={MAX_CHAPTER_COUNT}
                values={[startChapter, endChapter]}
                testId="chapter-range-slider"
                onValueChange={([s, e]) => {
                  setStartChapter(Math.min(s, chapterCountFor(startBook)))
                  setEndChapter(Math.min(e, chapterCountFor(endBook)))
                }}
              />

              <p className="text-xs text-muted-foreground">
                {chapterLabel(startBook, startChapter)} →{' '}
                {chapterLabel(endBook, endChapter)}
              </p>
            </div>
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

      {/* Exercise types grid (collapsible) */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setTypesExpanded(!typesExpanded)}
          data-testid="exercise-types-toggle"
          aria-expanded={typesExpanded}
          className="flex w-full items-center justify-between focus-visible:outline-none"
        >
          <p className="text-sm font-semibold">Exercise types</p>
          <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {selectedTypes.length} selected
            {typesExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
        </button>
        {typesExpanded && (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
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
        )}
        {!typesValid && (
          <p className="mt-2 text-xs text-destructive">Pick at least one exercise type.</p>
        )}
      </div>

      {/* Active job status panel */}
      {activeJob ? (
        <JobStatusPanel
          status={activeJob.status}
          label={activeJob.label}
          subtitle={activeJob.subtitle}
          error={activeJob.error}
          onStart={onStartReady}
          onDismiss={onDismissActiveJob}
          onLeave={onLeaveToHome}
          onRetry={onRetryFromError}
        />
      ) : (
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="mt-1 h-12 gap-2 rounded-xl text-base font-semibold shadow-sm"
          data-testid="generate-submit"
        >
          <Sparkles className="size-5" />
          Generate Quiz
        </Button>
      )}
    </section>
  )
}

interface JobStatusPanelProps {
  status: 'generating' | 'ready' | 'error'
  label: string
  subtitle?: string
  error?: string
  onStart: () => void
  onDismiss: () => void
  onLeave: () => void
  onRetry: () => void
}

function JobStatusPanel({
  status,
  label,
  subtitle,
  error,
  onStart,
  onDismiss,
  onLeave,
  onRetry,
}: JobStatusPanelProps) {
  if (status === 'generating') {
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-sm"
        data-testid="generate-status-generating"
      >
        <div className="flex items-start gap-3">
          <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Generating exercise…</p>
            <p className="truncate text-xs text-muted-foreground">
              {label}
              {subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Leave this screen if you want — we'll notify you when it's ready and
          you can start it from the home screen.
        </p>
        <Button
          variant="outline"
          onClick={onLeave}
          className="h-10 gap-2 rounded-xl"
          data-testid="generate-leave"
        >
          <BellRing className="size-4" />
          Leave (notify me when ready)
        </Button>
      </div>
    )
  }

  if (status === 'ready') {
    return (
      <div
        className="flex flex-col gap-3 rounded-2xl border border-green-300 bg-green-50 p-4 shadow-sm dark:border-green-700 dark:bg-green-950"
        data-testid="generate-status-ready"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-600 dark:text-green-300" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-green-900 dark:text-green-100">
              Ready to start
            </p>
            <p className="truncate text-xs text-green-800 dark:text-green-200">
              {label}
              {subtitle ? ` · ${subtitle}` : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onStart}
            className="h-11 flex-1 gap-2 rounded-xl text-base font-semibold"
            data-testid="generate-start-ready"
          >
            <Sparkles className="size-5" />
            Start
          </Button>
          <Button
            variant="ghost"
            onClick={onDismiss}
            className="h-11 rounded-xl"
            data-testid="generate-dismiss-ready"
            aria-label="Discard generated exercise"
          >
            <XCircle className="size-5" />
          </Button>
        </div>
      </div>
    )
  }

  // error
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4"
      data-testid="generate-status-error"
    >
      <div className="flex items-start gap-3">
        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-destructive">
            Generation failed
          </p>
          <p className="text-xs text-destructive/90">
            {error ?? 'Could not generate exercise. Please try again.'}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={onRetry} className="h-10 flex-1 rounded-xl">
          Retry
        </Button>
        <Button variant="ghost" onClick={onDismiss} className="h-10 rounded-xl">
          Dismiss
        </Button>
      </div>
    </div>
  )
}
