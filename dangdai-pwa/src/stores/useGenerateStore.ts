import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { ExerciseType } from '@/types/quiz'

export type GenerationMode = 'range' | 'custom'

interface GenerateState {
  mode: GenerationMode

  startBook: number
  startChapter: number
  endBook: number
  endChapter: number

  customSelectedIds: number[]

  questionCount: number
  selectedTypes: ExerciseType[]
  typesExpanded: boolean

  setMode: (mode: GenerationMode) => void
  setRange: (startBook: number, startChapter: number, endBook: number, endChapter: number) => void
  setStartBook: (n: number) => void
  setStartChapter: (n: number) => void
  setEndBook: (n: number) => void
  setEndChapter: (n: number) => void

  setCustomSelectedIds: (ids: number[]) => void
  toggleCustomChapter: (id: number) => void
  addCustomChapters: (ids: number[]) => void
  removeCustomChapters: (ids: number[]) => void

  setQuestionCount: (n: number) => void
  setSelectedTypes: (types: ExerciseType[]) => void
  toggleSelectedType: (type: ExerciseType) => void
  setTypesExpanded: (open: boolean) => void
}

export const useGenerateStore = create<GenerateState>()(
  persist(
    (set) => ({
      mode: 'range',

      startBook: 2,
      startChapter: 11,
      endBook: 3,
      endChapter: 3,

      customSelectedIds: [201, 207, 305],

      questionCount: 10,
      selectedTypes: ['vocabulary', 'grammar'],
      typesExpanded: false,

      setMode: (mode) => set({ mode }),
      setRange: (startBook, startChapter, endBook, endChapter) =>
        set({ startBook, startChapter, endBook, endChapter }),
      setStartBook: (n) => set({ startBook: n }),
      setStartChapter: (n) => set({ startChapter: n }),
      setEndBook: (n) => set({ endBook: n }),
      setEndChapter: (n) => set({ endChapter: n }),

      setCustomSelectedIds: (ids) => set({ customSelectedIds: ids }),
      toggleCustomChapter: (id) =>
        set((s) => ({
          customSelectedIds: s.customSelectedIds.includes(id)
            ? s.customSelectedIds.filter((x) => x !== id)
            : [...s.customSelectedIds, id],
        })),
      addCustomChapters: (ids) =>
        set((s) => {
          const next = new Set(s.customSelectedIds)
          for (const id of ids) next.add(id)
          return { customSelectedIds: Array.from(next) }
        }),
      removeCustomChapters: (ids) =>
        set((s) => {
          const remove = new Set(ids)
          return { customSelectedIds: s.customSelectedIds.filter((id) => !remove.has(id)) }
        }),

      setQuestionCount: (n) => set({ questionCount: n }),
      setSelectedTypes: (types) => set({ selectedTypes: types }),
      toggleSelectedType: (type) =>
        set((s) => ({
          selectedTypes: s.selectedTypes.includes(type)
            ? s.selectedTypes.filter((t) => t !== type)
            : [...s.selectedTypes, type],
        })),
      setTypesExpanded: (open) => set({ typesExpanded: open }),
    }),
    {
      name: 'dangdai-generate-store',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
