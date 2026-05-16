import { useCallback, useEffect, useRef, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { BookOpen, Loader2, Send, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { BOOKS } from '@/constants/books'
import { api, ChatError, type ChatSource } from '@/lib/api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authed/_tabs/chat')({
  component: ChatPage,
})

type ContentTypeFilter = 'textbook' | 'workbook' | null

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  sources?: ChatSource[]
}

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
        'rounded-full border px-3 py-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  )
}

function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookFilter, setBookFilter] = useState<number | null>(null)
  const [lessonFilter, setLessonFilter] = useState<number | null>(null)
  const [contentType, setContentType] = useState<ContentTypeFilter>(null)

  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => {
      const el = scrollRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 0)
    return () => window.clearTimeout(t)
  }, [messages, submitting])

  const lessonCount = chapterCountFor(bookFilter)

  const onSelectBook = useCallback((id: number | null) => {
    setBookFilter(id)
    setLessonFilter(null)
  }, [])

  const onSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || submitting) return

    const userMsg: ChatMessage = { id: makeId(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSubmitting(true)

    try {
      const result = await api.askChat({
        query: trimmed,
        book: bookFilter,
        lesson: lessonFilter,
        contentType,
      })
      setMessages((prev) => [
        ...prev,
        {
          id: makeId(),
          role: 'assistant',
          text: result.answer,
          sources: result.sources,
        },
      ])
    } catch (err) {
      const msg =
        err instanceof ChatError
          ? err.message
          : "Couldn't get an answer. Please try again."
      toast.error('Chat error', { description: msg })
    } finally {
      setSubmitting(false)
    }
  }, [input, submitting, bookFilter, lessonFilter, contentType])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void onSubmit()
    }
  }

  return (
    <section className="flex h-[calc(100dvh-5rem)] flex-col">
      {/* Filter bar */}
      <div className="flex flex-col gap-2 border-b bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Scope
          </p>
        </div>

        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Book</p>
        <div className="flex flex-wrap gap-2">
          <ChipButton
            active={bookFilter === null}
            onClick={() => onSelectBook(null)}
            testId="chat-book-all"
          >
            All
          </ChipButton>
          {BOOKS.map((b) => (
            <ChipButton
              key={b.id}
              active={bookFilter === b.id}
              onClick={() => onSelectBook(b.id)}
              testId={`chat-book-${b.id}`}
            >
              {b.title}
            </ChipButton>
          ))}
        </div>

        {bookFilter !== null && lessonCount > 0 && (
          <>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Lesson
            </p>
            <div className="flex flex-wrap gap-2">
              <ChipButton
                active={lessonFilter === null}
                onClick={() => setLessonFilter(null)}
                testId="chat-lesson-all"
              >
                All
              </ChipButton>
              {Array.from({ length: lessonCount }, (_, i) => i + 1).map((n) => (
                <ChipButton
                  key={n}
                  active={lessonFilter === n}
                  onClick={() => setLessonFilter(n)}
                  testId={`chat-lesson-${n}`}
                >
                  {String(n)}
                </ChipButton>
              ))}
            </div>
          </>
        )}

        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Content</p>
        <div className="flex flex-wrap gap-2">
          <ChipButton
            active={contentType === null}
            onClick={() => setContentType(null)}
            testId="chat-content-all"
          >
            Both
          </ChipButton>
          <ChipButton
            active={contentType === 'textbook'}
            onClick={() => setContentType('textbook')}
            testId="chat-content-textbook"
          >
            Textbook
          </ChipButton>
          <ChipButton
            active={contentType === 'workbook'}
            onClick={() => setContentType('workbook')}
            testId="chat-content-workbook"
          >
            Workbook
          </ChipButton>
        </div>
      </div>

      {/* Message list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
        <div className="flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="rounded-xl border bg-muted/40 p-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <Sparkles className="size-6 text-primary" />
                <h2 className="text-lg font-semibold">Ask anything about the textbook</h2>
                <p className="text-xs text-muted-foreground">
                  Try “What grammar is in Book 1 Lesson 3?”, “How do I introduce
                  myself?”, or “Show me workbook listening exercises.”
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}

          {submitting && (
            <div
              className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground"
              data-testid="chat-loading"
            >
              <Loader2 className="size-4 animate-spin" />
              Searching the textbook…
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 border-t bg-background p-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question…"
          disabled={submitting}
          data-testid="chat-input"
        />
        <Button
          onClick={() => void onSubmit()}
          disabled={submitting || input.trim().length === 0}
          size="icon"
          data-testid="chat-send"
        >
          <Send className="size-4" />
        </Button>
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
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
      data-testid={`chat-msg-${message.role}`}
    >
      <div
        className={cn(
          'max-w-[92%] rounded-2xl border p-3 text-sm shadow-sm',
          isUser
            ? 'border-primary/30 bg-primary/10 text-foreground'
            : 'border-border bg-card text-foreground',
        )}
      >
        <p className="whitespace-pre-wrap">{message.text}</p>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <Separator className="my-2" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sources
            </p>
            <ul className="mt-1 space-y-0.5">
              {message.sources.map((s, i) => (
                <li key={i} className="text-[11px] text-muted-foreground">
                  • {sourceLabel(s)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
