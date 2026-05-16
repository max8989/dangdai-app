import {
  ArrowRightLeft,
  BookOpen,
  ChevronLeft,
  FileText,
  Link2,
  MessageSquare,
  MessagesSquare,
  PenLine,
  Shuffle,
  Trophy,
} from 'lucide-react'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import { PausedQuizBanner } from '@/components/quiz/PausedQuizBanner'
import { useAllPausedQuizzes } from '@/hooks/usePausedQuiz'
import { useChapter } from '@/hooks/useChapters'
import { useChapterProgress } from '@/hooks/useChapterProgress'
import { BOOKS } from '@/constants/books'
import type { ExerciseType } from '@/types/quiz'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authed/quiz/$chapterId')({
  component: ChapterDetailPage,
})

interface ExerciseTypeCardConfig {
  type: ExerciseType
  label: string
  subtitle: string
  Icon: typeof BookOpen
  iconBg: string
  iconColor: string
  testID: string
}

const EXERCISE_TYPE_CARDS: ExerciseTypeCardConfig[] = [
  {
    type: 'mixed',
    label: 'Mixed',
    subtitle: 'AI picks exercises based on your weak areas',
    Icon: Shuffle,
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-700 dark:text-blue-200',
    testID: 'mixed-quiz-button',
  },
  {
    type: 'vocabulary',
    label: 'Vocabulary Quiz',
    subtitle: 'Practice characters, pinyin, and meanings',
    Icon: BookOpen,
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-700 dark:text-blue-200',
    testID: 'vocabulary-quiz-button',
  },
  {
    type: 'grammar',
    label: 'Grammar Quiz',
    subtitle: 'Practice sentence patterns and structure',
    Icon: MessageSquare,
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-700 dark:text-purple-200',
    testID: 'grammar-quiz-button',
  },
  {
    type: 'fill_in_blank',
    label: 'Fill-in-the-Blank',
    subtitle: 'Complete sentences with the right words',
    Icon: PenLine,
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    iconColor: 'text-orange-700 dark:text-orange-200',
    testID: 'fill-in-blank-quiz-button',
  },
  {
    type: 'matching',
    label: 'Matching',
    subtitle: 'Connect characters with pinyin or meanings',
    Icon: Link2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900',
    iconColor: 'text-emerald-700 dark:text-emerald-200',
    testID: 'matching-quiz-button',
  },
  {
    type: 'dialogue_completion',
    label: 'Dialogue Completion',
    subtitle: 'Complete conversation exchanges',
    Icon: MessagesSquare,
    iconBg: 'bg-pink-100 dark:bg-pink-900',
    iconColor: 'text-pink-700 dark:text-pink-200',
    testID: 'dialogue-completion-quiz-button',
  },
  {
    type: 'sentence_construction',
    label: 'Sentence Construction',
    subtitle: 'Rearrange words into correct order',
    Icon: ArrowRightLeft,
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-700 dark:text-yellow-200',
    testID: 'sentence-construction-quiz-button',
  },
  {
    type: 'reading_comprehension',
    label: 'Reading Comprehension',
    subtitle: 'Read passages and answer questions',
    Icon: FileText,
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-700 dark:text-red-200',
    testID: 'reading-comprehension-quiz-button',
  },
]

function ChapterDetailPage() {
  const { chapterId } = Route.useParams()
  const navigate = useNavigate()

  const chapterIdNum = Number.parseInt(chapterId, 10)
  const valid = !Number.isNaN(chapterIdNum) && chapterIdNum > 0

  const chapter = valid ? useChapter(chapterIdNum) : undefined
  const book = chapter ? BOOKS.find((b) => b.id === chapter.bookId) : null

  const { data: progressMap } = useChapterProgress(chapter?.bookId ?? 0)
  const progress = progressMap?.[chapterIdNum]
  const percentage = progress?.completionPercentage ?? 0
  const isMastered = percentage >= 80

  const { data: allPausedQuizzes } = useAllPausedQuizzes()
  const pausedQuizzesForChapter =
    allPausedQuizzes?.filter((pq) => pq.chapter_id === chapterIdNum) ?? []

  if (!valid || !chapter) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center min-h-dvh bg-background p-4">
        <p data-testid="chapter-not-found">Chapter not found</p>
      </div>
    )
  }

  const handleStartQuiz = (exerciseType: ExerciseType) => {
    void navigate({
      to: '/quiz/loading',
      search: {
        chapterId: chapterIdNum,
        bookId: chapter.bookId,
        exerciseType,
      },
    })
  }

  const handleResume = (exerciseType: string) => {
    void navigate({
      to: '/quiz/loading',
      search: {
        chapterId: chapterIdNum,
        bookId: chapter.bookId,
        exerciseType,
        resumePaused: true,
      },
    })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-background">
      <header className="sticky top-0 z-30 flex items-center gap-2 border-b bg-background/95 px-2 py-2 backdrop-blur">
        <Button asChild variant="ghost" size="icon" aria-label="Back to chapters">
          <Link to="/chapter/$bookId" params={{ bookId: String(chapter.bookId) }}>
            <ChevronLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="flex-1 text-base font-semibold">Chapter {chapter.chapterNumber}</h1>
      </header>

      <main className="flex-1 p-4">
        {pausedQuizzesForChapter.map((pq) => (
          <PausedQuizBanner
            key={`${pq.chapter_id}-${pq.exercise_type}`}
            chapterId={chapterIdNum}
            exerciseType={pq.exercise_type}
            onResume={() => handleResume(pq.exercise_type)}
            onDiscard={() => { /* banner refetches automatically */ }}
          />
        ))}

        <div className="space-y-2 mb-6">
          <p className="text-xs text-muted-foreground" data-testid="book-info">
            {book?.title} - {book?.titleChinese}
          </p>
          <h2 className="text-2xl font-bold" data-testid="chapter-title-english">
            {chapter.titleEnglish}
          </h2>
          <p className="text-lg text-muted-foreground" data-testid="chapter-title-chinese">
            {chapter.titleChinese}
          </p>
        </div>

        {percentage > 0 && (
          <div
            className="rounded-md border bg-card p-4 mb-4 flex items-center gap-3"
            data-testid="progress-card"
          >
            {isMastered ? (
              <>
                <Trophy className="h-6 w-6 text-emerald-600" data-testid="mastered-badge" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-700 dark:text-emerald-300">Mastered</p>
                  <p className="text-sm text-muted-foreground">
                    You've achieved 80%+ on this chapter
                  </p>
                </div>
              </>
            ) : (
              <div className="flex-1">
                <p className="font-medium">Current Progress</p>
                <p className="text-sm text-muted-foreground" data-testid="progress-percentage">
                  {percentage}% complete
                </p>
              </div>
            )}
          </div>
        )}

        <div className="mb-6 grid grid-cols-3 gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              to="/chapter/$chapterId/vocabulary"
              params={{ chapterId: String(chapterIdNum) }}
            >
              Vocabulary
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/chapter/$chapterId/grammar"
              params={{ chapterId: String(chapterIdNum) }}
            >
              Grammar
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              to="/chapter/$chapterId/dialogues"
              params={{ chapterId: String(chapterIdNum) }}
            >
              Dialogues
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          <p className="text-base font-medium mb-2" data-testid="quiz-section-label">
            {isMastered ? 'Practice Again' : 'Start Learning'}
          </p>

          {EXERCISE_TYPE_CARDS.map((card) => (
            <button
              key={card.type}
              type="button"
              onClick={() => handleStartQuiz(card.type)}
              className="w-full rounded-md border bg-card p-4 text-left transition-colors hover:bg-accent active:scale-[0.98]"
              data-testid={card.testID}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-12 w-12 rounded-md flex items-center justify-center',
                    card.iconBg,
                  )}
                >
                  <card.Icon className={cn('h-5 w-5', card.iconColor)} />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold">{card.label}</p>
                  <p className="text-sm text-muted-foreground">{card.subtitle}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {percentage === 0 && (
          <p
            className="text-xs text-muted-foreground mt-6 text-center"
            data-testid="new-user-helper-text"
          >
            Start with vocabulary to learn new words, or try grammar for sentence practice
          </p>
        )}
      </main>
    </div>
  )
}
