import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { ExerciseType, QuizResponse } from '@/types/quiz'

export type JobStatus = 'generating' | 'ready' | 'error'

export interface MultiJobParams {
  source: 'multi'
  chapterIdStart: number
  chapterIdEnd: number
  questionCount: number
  exerciseTypes: ExerciseType[]
}

export interface CustomJobParams {
  source: 'custom'
  chapterIds: number[]
  questionCount: number
  exerciseTypes: ExerciseType[]
  avoidQuestionTexts?: string[]
}

export interface ChapterJobParams {
  source: 'chapter'
  chapterId: number
  bookId: number
  exerciseType: ExerciseType
}

export type JobParams = MultiJobParams | CustomJobParams | ChapterJobParams

export interface GenerationJob {
  id: string
  status: JobStatus
  /** Short user-facing label, e.g., "B2·11 → B3·3 · Mixed" */
  label: string
  /** Secondary line, e.g., "20 questions · Vocabulary + Grammar" */
  subtitle?: string
  startedAt: number
  finishedAt?: number
  params: JobParams
  /** Resolved quiz payload — set when status moves to 'ready'. */
  result?: QuizResponse
  /** Effective primary chapter/book/exerciseType used to call startQuiz. */
  chapterId?: number
  bookId?: number
  exerciseType?: ExerciseType
  chapterIdEnd?: number
  error?: string
}

interface JobsState {
  jobs: Record<string, GenerationJob>

  addJob: (job: GenerationJob) => void
  setJobReady: (
    id: string,
    payload: {
      result: QuizResponse
      chapterId: number
      bookId: number
      exerciseType: ExerciseType
      chapterIdEnd?: number
    },
  ) => void
  setJobError: (id: string, error: string) => void
  removeJob: (id: string) => void

  getJob: (id: string) => GenerationJob | undefined
  listByStatus: (status: JobStatus) => GenerationJob[]
}

function makeJobId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const newJobId = makeJobId

export const useGenerationJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      jobs: {},

      addJob: (job) =>
        set((s) => ({ jobs: { ...s.jobs, [job.id]: job } })),

      setJobReady: (id, { result, chapterId, bookId, exerciseType, chapterIdEnd }) =>
        set((s) => {
          const prev = s.jobs[id]
          if (!prev) return s
          const next: GenerationJob = {
            ...prev,
            status: 'ready',
            finishedAt: Date.now(),
            result,
            chapterId,
            bookId,
            exerciseType,
            chapterIdEnd,
          }
          return { jobs: { ...s.jobs, [id]: next } }
        }),

      setJobError: (id, error) =>
        set((s) => {
          const prev = s.jobs[id]
          if (!prev) return s
          const next: GenerationJob = {
            ...prev,
            status: 'error',
            finishedAt: Date.now(),
            error,
          }
          return { jobs: { ...s.jobs, [id]: next } }
        }),

      removeJob: (id) =>
        set((s) => {
          const next = { ...s.jobs }
          delete next[id]
          return { jobs: next }
        }),

      getJob: (id) => get().jobs[id],
      listByStatus: (status) =>
        Object.values(get().jobs)
          .filter((j) => j.status === status)
          .sort((a, b) => b.startedAt - a.startedAt),
    }),
    {
      name: 'dangdai-generation-jobs',
      storage: createJSONStorage(() => localStorage),
      // Don't persist 'generating' jobs — the in-flight fetch promise can't
      // survive a reload. Persist only 'ready' (so user can resume) and
      // 'error' (so retry/dismiss is available).
      partialize: (state) => ({
        jobs: Object.fromEntries(
          Object.entries(state.jobs).filter(
            ([, j]) => j.status === 'ready' || j.status === 'error',
          ),
        ),
      }),
    },
  ),
)
