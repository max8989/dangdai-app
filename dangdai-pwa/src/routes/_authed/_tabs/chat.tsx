import { useCallback, useEffect, useMemo, useRef } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import {
  ChevronDown,
  Loader2,
  MessageSquare,
  Send,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { BOOKS } from '@/constants/books'
import { api, ChatError, type ChatHistoryTurn, type ChatSource } from '@/lib/api'
import { useChatStore, type ChatMessage } from '@/stores/useChatStore'

// Matches the server-side cap; sending more is wasted bandwidth.
const HISTORY_MAX_TURNS = 8
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authed/_tabs/chat')({
  component: ChatPage,
})

const SUGGESTIONS = [
  'What grammar is in Book 1 Lesson 3?',
  'How do I introduce myself?',
  'Explain when to use 了 vs 過.',
]

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function chapterCountFor(bookId: number | null): number {
  if (bookId == null) return 0
  return BOOKS.find((b) => b.id === bookId)?.chapterCount ?? 0
}

function sourceLabel(s: ChatSource): string {
  const ct = (s.content_type ?? 'textbook').toUpperCase()
  const book = s.book ?? '?'
  const lesson = s.lesson ?? '?'
  const section = s.section ?? 'unknown'
  const ex = s.exercise_type ? ` · ${s.exercise_type}` : ''
  const sim = s.similarity != null ? ` (${s.similarity.toFixed(2)})` : ''
  return `${ct} · Book ${book} · Lesson ${lesson} · ${section}${ex}${sim}`
}

interface PillButtonProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  testId?: string
  className?: string
}

function PillButton({ active, onClick, children, testId, className }: PillButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        'shrink-0 snap-start rounded-full border px-2.5 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
          : 'border-border bg-background text-foreground hover:bg-muted hover:border-muted-foreground/30',
        className,
      )}
    >
      {children}
    </button>
  )
}

interface PillStripProps {
  label: string
  children: React.ReactNode
}

function PillStrip({ label, children }: PillStripProps) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="relative">
        <div className="no-scrollbar flex snap-x snap-mandatory gap-1.5 overflow-x-auto py-0.5 pl-px pr-6">
          {children}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card/80 to-transparent" />
      </div>
    </div>
  )
}

interface ChatPageHeaderProps {
  scopeLabel: string
  hasActiveScope: boolean
  filtersOpen: boolean
  hasMessages: boolean
  onToggleFilters: () => void
  onClearScope: () => void
  onClearChat: () => void
}

function ChatPageHeader({
  scopeLabel,
  hasActiveScope,
  filtersOpen,
  hasMessages,
  onToggleFilters,
  onClearScope,
  onClearChat,
}: ChatPageHeaderProps) {
  return (
    <div className="flex items-center gap-2 border-b bg-card/40 px-3 py-2.5">
      <button
        type="button"
        onClick={onToggleFilters}
        className={cn(
          'flex flex-1 min-w-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          filtersOpen
            ? 'border-primary bg-primary/10 text-foreground'
            : 'border-border bg-background text-foreground hover:bg-muted',
        )}
        data-testid="chat-filter-toggle"
        aria-expanded={filtersOpen}
      >
        <SlidersHorizontal className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{scopeLabel}</span>
        <ChevronDown
          className={cn(
            'size-3.5 shrink-0 text-muted-foreground transition-transform',
            filtersOpen && 'rotate-180',
          )}
        />
      </button>
      {hasActiveScope && (
        <button
          type="button"
          onClick={onClearScope}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Clear scope"
          data-testid="chat-clear-scope"
        >
          <X className="size-3.5" />
        </button>
      )}
      {hasMessages && (
        <button
          type="button"
          onClick={onClearChat}
          className="flex size-7 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Clear chat"
          data-testid="chat-clear-messages"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  )
}

function ChatPage() {
  const messages = useChatStore((s) => s.messages)
  const input = useChatStore((s) => s.input)
  const bookFilter = useChatStore((s) => s.bookFilter)
  const lessonFilter = useChatStore((s) => s.lessonFilter)
  const contentType = useChatStore((s) => s.contentType)
  const filtersOpen = useChatStore((s) => s.filtersOpen)
  const setInput = useChatStore((s) => s.setInput)
  const setBookFilter = useChatStore((s) => s.setBookFilter)
  const setLessonFilter = useChatStore((s) => s.setLessonFilter)
  const setContentType = useChatStore((s) => s.setContentType)
  const toggleFilters = useChatStore((s) => s.toggleFilters)
  const appendMessage = useChatStore((s) => s.appendMessage)
  const clearMessages = useChatStore((s) => s.clearMessages)
  const clearScope = useChatStore((s) => s.clearScope)
  const submitting = useChatStore((s) => s.submitting)
  const setSubmitting = useChatStore((s) => s.setSubmitting)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 0)
    return () => window.clearTimeout(t)
  }, [messages, submitting])

  const lessonCount = chapterCountFor(bookFilter)

  const onSelectBook = useCallback(
    (id: number | null) => {
      setBookFilter(id)
    },
    [setBookFilter],
  )

  const hasActiveScope =
    bookFilter !== null || lessonFilter !== null || contentType !== null

  const scopeLabel = useMemo(() => {
    if (!hasActiveScope) return 'All books · textbook + workbook'
    const parts: string[] = []
    if (bookFilter !== null) {
      parts.push(`Book ${bookFilter}${lessonFilter !== null ? ` · L${lessonFilter}` : ''}`)
    } else {
      parts.push('All books')
    }
    if (contentType !== null) {
      parts.push(contentType === 'textbook' ? 'Textbook' : 'Workbook')
    }
    return parts.join(' · ')
  }, [hasActiveScope, bookFilter, lessonFilter, contentType])

  const submitWith = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || submitting) return

      const userMsg: ChatMessage = { id: makeId(), role: 'user', text: trimmed }
      const history: ChatHistoryTurn[] = messages
        .slice(-HISTORY_MAX_TURNS)
        .map((m) => ({ role: m.role, content: m.text }))
      appendMessage(userMsg)
      setInput('')
      setSubmitting(true)

      try {
        const result = await api.askChat({
          query: trimmed,
          book: bookFilter,
          lesson: lessonFilter,
          contentType,
          history,
        })
        appendMessage({
          id: makeId(),
          role: 'assistant',
          text: result.answer,
          sources: result.sources,
        })
      } catch (err) {
        const msg =
          err instanceof ChatError
            ? err.message
            : "Couldn't get an answer. Please try again."
        toast.error('Chat error', { description: msg })
      } finally {
        setSubmitting(false)
      }
    },
    [submitting, bookFilter, lessonFilter, contentType, messages, appendMessage, setInput],
  )

  const onSubmit = useCallback(() => {
    void submitWith(input)
  }, [submitWith, input])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <section className="flex h-[calc(100dvh-5rem)] flex-col">
      <ChatPageHeader
        scopeLabel={scopeLabel}
        hasActiveScope={hasActiveScope}
        filtersOpen={filtersOpen}
        hasMessages={messages.length > 0}
        onToggleFilters={toggleFilters}
        onClearScope={clearScope}
        onClearChat={clearMessages}
      />

      {/* Collapsible filter panel */}
      {filtersOpen && (
        <div className="flex flex-col gap-2.5 border-b bg-card/30 px-3 py-3">
          <PillStrip label="Book">
            <PillButton
              active={bookFilter === null}
              onClick={() => onSelectBook(null)}
              testId="chat-book-all"
            >
              All
            </PillButton>
            {BOOKS.map((b) => (
              <PillButton
                key={b.id}
                active={bookFilter === b.id}
                onClick={() => onSelectBook(b.id)}
                testId={`chat-book-${b.id}`}
              >
                {b.title}
              </PillButton>
            ))}
          </PillStrip>

          {bookFilter !== null && lessonCount > 0 && (
            <PillStrip label="Lesson">
              <PillButton
                active={lessonFilter === null}
                onClick={() => setLessonFilter(null)}
                testId="chat-lesson-all"
              >
                All
              </PillButton>
              {Array.from({ length: lessonCount }, (_, i) => i + 1).map((n) => (
                <PillButton
                  key={n}
                  active={lessonFilter === n}
                  onClick={() => setLessonFilter(n)}
                  testId={`chat-lesson-${n}`}
                  className="min-w-8 justify-center tabular-nums"
                >
                  {n}
                </PillButton>
              ))}
            </PillStrip>
          )}

          <PillStrip label="Content">
            <PillButton
              active={contentType === null}
              onClick={() => setContentType(null)}
              testId="chat-content-all"
            >
              Both
            </PillButton>
            <PillButton
              active={contentType === 'textbook'}
              onClick={() => setContentType('textbook')}
              testId="chat-content-textbook"
            >
              Textbook
            </PillButton>
            <PillButton
              active={contentType === 'workbook'}
              onClick={() => setContentType('workbook')}
              testId="chat-content-workbook"
            >
              Workbook
            </PillButton>
          </PillStrip>
        </div>
      )}

      {/* Message list. `min-h-full justify-end` anchors content to the bottom so the
          empty state / latest messages sit just above the input bar. Without this,
          iOS Safari's keyboard auto-scroll exposes the empty top half of the list. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4">
        <div
          className={cn(
            'flex min-h-full flex-col gap-3',
            messages.length === 0 && !submitting ? 'justify-start' : 'justify-end',
          )}
        >
          {messages.length === 0 && !submitting && (
            <div className="flex flex-col items-center gap-4 pt-4 text-center">
              <div className="rounded-2xl bg-primary/10 p-3">
                <Sparkles className="size-6 text-primary" />
              </div>
              <div className="max-w-sm">
                <h2 className="text-base font-semibold">Ask anything about the textbook</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Get answers grounded in the Dangdai textbook and workbook content.
                </p>
              </div>
              <div className="flex w-full flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void submitWith(s)}
                    className="rounded-xl border bg-card px-3 py-2.5 text-left text-xs text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    data-testid="chat-suggestion"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {submitting && (
            <div
              className="flex items-center gap-2 px-2 py-2 text-xs text-muted-foreground"
              data-testid="chat-loading"
            >
              <Loader2 className="size-3.5 animate-spin" />
              Searching the textbook…
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="border-t bg-background px-3 py-3">
        <div className="flex items-end gap-2 rounded-2xl border bg-card pl-3 pr-1.5 py-1.5 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30 transition-colors">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question…"
            disabled={submitting}
            data-testid="chat-input"
            className="flex-1 bg-transparent py-1.5 text-base outline-none placeholder:text-muted-foreground disabled:opacity-50 md:text-sm"
          />
          <Button
            onClick={onSubmit}
            disabled={submitting || input.trim().length === 0}
            size="icon"
            className="size-9 shrink-0 rounded-xl"
            data-testid="chat-send"
            aria-label="Send"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <div
      className={cn('flex w-full gap-2', isUser ? 'justify-end' : 'justify-start')}
      data-testid={`chat-msg-${message.role}`}
    >
      {!isUser && (
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MessageSquare className="size-3.5" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
          isUser
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm border bg-card text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>

        {!isUser && message.sources && message.sources.length > 0 && (
          <details className="mt-2 group">
            <summary className="flex cursor-pointer list-none items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
              <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
              {message.sources.length} {message.sources.length === 1 ? 'source' : 'sources'}
            </summary>
            <ul className="mt-1.5 space-y-0.5 border-l-2 border-border pl-2">
              {message.sources.map((s, i) => (
                <li key={i} className="text-[11px] text-muted-foreground">
                  {sourceLabel(s)}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  )
}
