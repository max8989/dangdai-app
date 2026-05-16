import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { ChatSource } from '@/lib/api'

export type ContentTypeFilter = 'textbook' | 'workbook' | null

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: ChatSource[]
}

interface ChatState {
  messages: ChatMessage[]
  input: string
  bookFilter: number | null
  lessonFilter: number | null
  contentType: ContentTypeFilter
  filtersOpen: boolean

  setInput: (input: string) => void
  setBookFilter: (id: number | null) => void
  setLessonFilter: (id: number | null) => void
  setContentType: (ct: ContentTypeFilter) => void
  setFiltersOpen: (open: boolean) => void
  toggleFilters: () => void

  appendMessage: (msg: ChatMessage) => void
  clearMessages: () => void
  clearScope: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      input: '',
      bookFilter: null,
      lessonFilter: null,
      contentType: null,
      filtersOpen: false,

      setInput: (input) => set({ input }),
      setBookFilter: (id) => set({ bookFilter: id, lessonFilter: null }),
      setLessonFilter: (id) => set({ lessonFilter: id }),
      setContentType: (ct) => set({ contentType: ct }),
      setFiltersOpen: (open) => set({ filtersOpen: open }),
      toggleFilters: () => set((s) => ({ filtersOpen: !s.filtersOpen })),

      appendMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      clearMessages: () => set({ messages: [], input: '' }),
      clearScope: () =>
        set({ bookFilter: null, lessonFilter: null, contentType: null }),
    }),
    {
      name: 'dangdai-chat-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        messages: state.messages,
        input: state.input,
        bookFilter: state.bookFilter,
        lessonFilter: state.lessonFilter,
        contentType: state.contentType,
        filtersOpen: state.filtersOpen,
      }),
    },
  ),
)
