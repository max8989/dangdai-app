/**
 * Chat Screen — Ask the textbook/workbook RAG agent
 *
 * Lets the user ask free-form questions about the 當代中文課程 textbook
 * and workbook. Each request is stateless (no conversation memory) and is
 * scoped by optional Book / Lesson / content-type filters. Source citations
 * are rendered under each AI answer.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  H4,
  Button,
  Card,
  Input,
  Spinner,
  Separator,
} from 'tamagui'
import { Stack } from 'expo-router'
import { Send, BookOpen, Sparkles } from '@tamagui/lucide-icons'

import { BOOKS } from '../../constants/books'
import { api, ChatError, type ChatSource } from '../../lib/api'

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

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bookFilter, setBookFilter] = useState<number | null>(null)
  const [lessonFilter, setLessonFilter] = useState<number | null>(null)
  const [contentType, setContentType] = useState<ContentTypeFilter>(null)

  const scrollRef = useRef<ScrollView | null>(null)

  useEffect(() => {
    // Auto-scroll to the latest message whenever the list changes.
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true })
    }, 0)
    return () => clearTimeout(t)
  }, [messages, submitting])

  const lessonCount = chapterCountFor(bookFilter)

  const onSelectBook = useCallback((id: number | null) => {
    setBookFilter(id)
    setLessonFilter(null) // reset lesson when book changes
  }, [])

  const onSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || submitting) return

    const userMsg: ChatMessage = {
      id: makeId(),
      role: 'user',
      text: trimmed,
    }
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
        err instanceof ChatError ? err.message : "Couldn't get an answer. Please try again."
      Alert.alert('Chat error', msg)
    } finally {
      setSubmitting(false)
    }
  }, [input, submitting, bookFilter, lessonFilter, contentType])

  return (
    <>
      <Stack.Screen options={{ title: 'Ask the Textbook' }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <YStack flex={1} backgroundColor="$background">
          {/* Filter bar */}
          <Card bordered padding="$3" margin="$3" borderRadius="$4">
            <YStack gap="$2">
              <XStack alignItems="center" gap="$2">
                <BookOpen size={16} />
                <Text fontSize="$2" fontWeight="600" color="$color11">
                  Scope
                </Text>
              </XStack>

              <Text fontSize="$1" color="$color10">
                Book
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                <Button
                  size="$2"
                  theme={bookFilter === null ? 'blue' : undefined}
                  onPress={() => onSelectBook(null)}
                  testID="chat-book-all"
                >
                  All
                </Button>
                {BOOKS.map((b) => (
                  <Button
                    key={b.id}
                    size="$2"
                    theme={bookFilter === b.id ? 'blue' : undefined}
                    onPress={() => onSelectBook(b.id)}
                    testID={`chat-book-${b.id}`}
                  >
                    {b.title}
                  </Button>
                ))}
              </XStack>

              {bookFilter !== null && lessonCount > 0 && (
                <>
                  <Text fontSize="$1" color="$color10" marginTop="$1">
                    Lesson
                  </Text>
                  <XStack gap="$2" flexWrap="wrap">
                    <Button
                      size="$2"
                      theme={lessonFilter === null ? 'blue' : undefined}
                      onPress={() => setLessonFilter(null)}
                      testID="chat-lesson-all"
                    >
                      All
                    </Button>
                    {Array.from({ length: lessonCount }, (_, i) => i + 1).map((n) => (
                      <Button
                        key={n}
                        size="$2"
                        theme={lessonFilter === n ? 'blue' : undefined}
                        onPress={() => setLessonFilter(n)}
                        testID={`chat-lesson-${n}`}
                      >
                        {String(n)}
                      </Button>
                    ))}
                  </XStack>
                </>
              )}

              <Text fontSize="$1" color="$color10" marginTop="$1">
                Content
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                <Button
                  size="$2"
                  theme={contentType === null ? 'blue' : undefined}
                  onPress={() => setContentType(null)}
                  testID="chat-content-all"
                >
                  Both
                </Button>
                <Button
                  size="$2"
                  theme={contentType === 'textbook' ? 'blue' : undefined}
                  onPress={() => setContentType('textbook')}
                  testID="chat-content-textbook"
                >
                  Textbook
                </Button>
                <Button
                  size="$2"
                  theme={contentType === 'workbook' ? 'blue' : undefined}
                  onPress={() => setContentType('workbook')}
                  testID="chat-content-workbook"
                >
                  Workbook
                </Button>
              </XStack>
            </YStack>
          </Card>

          {/* Message list */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <YStack gap="$3">
              {messages.length === 0 && (
                <Card
                  bordered
                  padding="$4"
                  borderRadius="$4"
                  backgroundColor="$backgroundHover"
                >
                  <YStack gap="$2" alignItems="center">
                    <Sparkles size={24} />
                    <H4>Ask anything about the textbook</H4>
                    <Text fontSize="$2" color="$color11" textAlign="center">
                      Try “What grammar is in Book 1 Lesson 3?”, “How do I introduce
                      myself?”, or “Show me workbook listening exercises.”
                    </Text>
                  </YStack>
                </Card>
              )}

              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}

              {submitting && (
                <XStack
                  alignItems="center"
                  gap="$2"
                  padding="$3"
                  testID="chat-loading"
                >
                  <Spinner />
                  <Text fontSize="$2" color="$color10">
                    Searching the textbook…
                  </Text>
                </XStack>
              )}
            </YStack>
          </ScrollView>

          {/* Input bar */}
          <XStack
            padding="$3"
            gap="$2"
            borderTopWidth={1}
            borderTopColor="$borderColor"
            backgroundColor="$background"
          >
            <Input
              flex={1}
              value={input}
              onChangeText={setInput}
              placeholder="Ask a question…"
              onSubmitEditing={onSubmit}
              returnKeyType="send"
              editable={!submitting}
              testID="chat-input"
            />
            <Button
              theme="blue"
              icon={<Send size={18} />}
              onPress={onSubmit}
              disabled={submitting || input.trim().length === 0}
              testID="chat-send"
            />
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  return (
    <YStack
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      maxWidth="92%"
      testID={`chat-msg-${message.role}`}
    >
      <Card
        bordered
        padding="$3"
        borderRadius="$4"
        backgroundColor={isUser ? '$blue4' : '$background'}
      >
        <Text fontSize="$3">{message.text}</Text>

        {!isUser && message.sources && message.sources.length > 0 && (
          <YStack marginTop="$2" gap="$1">
            <Separator marginVertical="$1" />
            <Text fontSize="$1" fontWeight="600" color="$color11">
              Sources
            </Text>
            {message.sources.map((s, i) => (
              <Text key={i} fontSize="$1" color="$color10">
                • {sourceLabel(s)}
              </Text>
            ))}
          </YStack>
        )}
      </Card>
    </YStack>
  )
}
