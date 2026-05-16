import { api } from '@/lib/api'
import { useGenerationJobsStore, newJobId, type JobParams } from '@/stores/useGenerationJobsStore'
import {
  EXERCISE_TYPE_LABELS,
  QuizGenerationError,
  type ExerciseType,
  type QuizResponse,
} from '@/types/quiz'

const NOTIFY_TITLE = 'Dangdai — exercise ready'

function fireNotification(label: string) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(NOTIFY_TITLE, {
      body: `${label} is ready to start.`,
      icon: '/icon-192.png',
      tag: 'dangdai-exercise-ready',
    })
  } catch {
    // Notifications may be disabled by the OS — ignore.
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

function describeTypes(types: ExerciseType[]): string {
  if (types.length === 0) return 'Mixed'
  if (types.length === 1) return EXERCISE_TYPE_LABELS[types[0]] ?? types[0]
  return `${types.length} types`
}

function effectiveExerciseType(types: ExerciseType[]): ExerciseType {
  return types.length === 1 ? types[0] : 'mixed'
}

export interface StartJobInput {
  params: JobParams
}

/**
 * Kicks off a generation job. Returns immediately with the job id; the actual
 * fetch runs in the background and writes its result to the jobs store.
 *
 * Safe to navigate away while the request is in flight.
 */
export function startGenerationJob({ params }: StartJobInput): string {
  const id = newJobId()
  const store = useGenerationJobsStore.getState()

  let label: string
  let subtitle: string

  if (params.source === 'multi') {
    const startBook = Math.floor(params.chapterIdStart / 100)
    const startCh = params.chapterIdStart - startBook * 100
    const endBook = Math.floor(params.chapterIdEnd / 100)
    const endCh = params.chapterIdEnd - endBook * 100
    label = `B${startBook}·${startCh} → B${endBook}·${endCh}`
    subtitle = `${params.questionCount} q · ${describeTypes(params.exerciseTypes)}`
  } else if (params.source === 'custom') {
    label = `${params.chapterIds.length} chapter${params.chapterIds.length === 1 ? '' : 's'}`
    subtitle = `${params.questionCount} q · ${describeTypes(params.exerciseTypes)}`
  } else {
    const ch = params.chapterId - params.bookId * 100
    label = `B${params.bookId}·${ch}`
    subtitle = EXERCISE_TYPE_LABELS[params.exerciseType] ?? params.exerciseType
  }

  store.addJob({
    id,
    status: 'generating',
    label,
    subtitle,
    startedAt: Date.now(),
    params,
  })

  void run(id, params, label)
  return id
}

async function run(id: string, params: JobParams, label: string): Promise<void> {
  const store = useGenerationJobsStore.getState()
  try {
    if (params.source === 'multi') {
      const result = await api.generateMultiChapterQuiz({
        chapterIdStart: params.chapterIdStart,
        chapterIdEnd: params.chapterIdEnd,
        questionCount: params.questionCount,
        exerciseTypes: params.exerciseTypes,
      })
      const exerciseType = effectiveExerciseType(params.exerciseTypes)
      const quizPayload: QuizResponse = {
        quiz_id: result.quiz_id,
        chapter_id: result.chapter_id_start,
        book_id: Math.floor(result.chapter_id_start / 100),
        exercise_type: exerciseType,
        question_count: result.question_count,
        questions: result.questions,
      }
      useGenerationJobsStore.getState().setJobReady(id, {
        result: quizPayload,
        chapterId: result.chapter_id_start,
        bookId: Math.floor(result.chapter_id_start / 100),
        exerciseType,
        chapterIdEnd: result.chapter_id_end,
      })
    } else if (params.source === 'custom') {
      const result = await api.generateCustomQuiz({
        chapterIds: params.chapterIds,
        questionCount: params.questionCount,
        exerciseTypes: params.exerciseTypes,
        avoidQuestionTexts: params.avoidQuestionTexts?.slice(0, 50),
      })
      const exerciseType = effectiveExerciseType(params.exerciseTypes)
      const firstId = result.chapter_ids[0] ?? params.chapterIds[0]
      const lastId = result.chapter_ids[result.chapter_ids.length - 1] ?? firstId
      const quizPayload: QuizResponse = {
        quiz_id: result.quiz_id,
        chapter_id: firstId,
        book_id: Math.floor(firstId / 100),
        exercise_type: exerciseType,
        question_count: result.question_count,
        questions: result.questions,
      }
      useGenerationJobsStore.getState().setJobReady(id, {
        result: quizPayload,
        chapterId: firstId,
        bookId: Math.floor(firstId / 100),
        exerciseType,
        chapterIdEnd: lastId,
      })
    } else {
      const result = await api.generateQuiz({
        chapterId: params.chapterId,
        bookId: params.bookId,
        exerciseType: params.exerciseType,
      })
      useGenerationJobsStore.getState().setJobReady(id, {
        result,
        chapterId: params.chapterId,
        bookId: params.bookId,
        exerciseType: params.exerciseType,
      })
    }
    fireNotification(label)
  } catch (err) {
    const message =
      err instanceof QuizGenerationError
        ? err.message
        : 'Could not generate exercise. Please try again.'
    // Use the latest store ref in case the store was rehydrated mid-flight.
    useGenerationJobsStore.getState().setJobError(id, message)
    void store // silence unused
  }
}
