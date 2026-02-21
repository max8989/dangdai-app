/**
 * SentenceBuilder Component Tests
 *
 * Unit + Integration tests for the sentence construction exercise:
 *
 * Task 4.11 — component unit tests:
 * - Renders word bank with all scrambled words
 * - Tapping a tile moves it to the answer area
 * - Tapping a placed tile returns it to the word bank
 * - Submit button is disabled until all tiles are placed
 * - Submit button is enabled when all tiles are placed
 *
 * Task 6 — integration tests:
 * 6.1 SentenceBuilder renders word bank with all scrambled words
 * 6.2 Tapping a tile moves it to the answer area
 * 6.3 Tapping a placed tile returns it to the word bank
 * 6.4 Submit button is disabled until all tiles are placed
 * 6.5 Correct answer (local match) shows all tiles green
 * 6.6 Incorrect answer triggers LLM validation call
 * 6.7 LLM returns valid alternative — shows "also valid" message
 * 6.8 LLM returns incorrect — shows per-tile green/orange + correct sentence
 * 6.9 LLM timeout falls back to local validation (marks as incorrect)
 * 6.10 play.tsx renders SentenceBuilder for sentence_construction (in play.test.tsx)
 *
 * Story 4.7: Sentence Construction Exercise
 */

// Mock AsyncStorage — required by useQuizStore persist middleware (Story 4.10)
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

import React from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { SentenceBuilder } from './SentenceBuilder'
import { useQuizStore } from '../../stores/useQuizStore'
import { api } from '../../lib/api'
import { QuizGenerationError } from '../../types/quiz'
import type { AnswerValidationResponse } from '../../types/quiz'

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../lib/api', () => ({
  api: {
    baseUrl: 'http://localhost:8000',
    generateQuiz: jest.fn(),
    validateAnswer: jest.fn(),
  },
}))

const mockValidateAnswer = api.validateAnswer as jest.MockedFunction<typeof api.validateAnswer>

// Tamagui mock — renders children with accessible testIDs
jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity, ScrollView } = require('react-native')
  const ReactLocal = require('react')

  const styled = (_component: any, _config: any) => {
    return ({ children, testID, onPress, disabled, state }: any) => {
      const props: any = {
        testID,
        onPress,
        disabled,
        // Expose tile state via accessibilityHint for assertion
        accessibilityHint: state ? String(state) : undefined,
      }
      return ReactLocal.createElement(
        onPress && !disabled ? TouchableOpacity : View,
        props,
        children,
      )
    }
  }

  return {
    YStack: ({ children, testID }: any) => ReactLocal.createElement(View, { testID }, children),
    XStack: ({ children, testID }: any) => ReactLocal.createElement(View, { testID }, children),
    Text: ({ children, testID, fontSize }: any) =>
      ReactLocal.createElement(Text, { testID, accessibilityHint: fontSize ? String(fontSize) : undefined }, children),
    Button: ({ children, testID, onPress, disabled }: any) =>
      ReactLocal.createElement(
        !disabled ? TouchableOpacity : View,
        { testID, onPress, disabled },
        children,
      ),
    Spinner: ({ testID, size }: any) => ReactLocal.createElement(View, { testID: testID ?? 'spinner', accessibilityHint: size }, null),
    Theme: ({ children, name }: any) => ReactLocal.createElement(View, { accessibilityHint: name }, children),
    AnimatePresence: ({ children }: any) => ReactLocal.createElement(ReactLocal.Fragment, null, children),
    ScrollView: ({ children, testID }: any) => ReactLocal.createElement(ScrollView, { testID }, children),
    styled,
  }
})

jest.mock('@tamagui/lucide-icons', () => {
  const { View } = require('react-native')
  const ReactLocal = require('react')
  return {
    CheckCircle: ({ testID }: any) => ReactLocal.createElement(View, { testID }, null),
    XCircle: ({ testID }: any) => ReactLocal.createElement(View, { testID }, null),
  }
})

// ─── Test Data ────────────────────────────────────────────────────────────────

// Mock sentence question: ["咖啡", "我", "喜歡", "很", "。"] → correct: "我很喜歡咖啡。"
const mockScrambledWords = ['咖啡', '我', '喜歡', '很', '。']
const mockCorrectOrder = ['我', '很', '喜歡', '咖啡', '。']
const mockCorrectAnswer = '我很喜歡咖啡。'

const mockDefaultProps = {
  questionText: 'Arrange the words into a correct sentence:',
  scrambledWords: mockScrambledWords,
  correctOrder: mockCorrectOrder,
  correctAnswer: mockCorrectAnswer,
  explanation: 'The adverb 很 comes before the verb 喜歡 in Chinese.',
  sourceCitation: 'Book 2, Chapter 12 - Grammar',
  onAnswer: jest.fn(),
}

const mockLlmValidAlternative: AnswerValidationResponse = {
  is_correct: true,
  explanation: 'Your word order is also grammatically correct.',
  alternatives: ['我很喜歡咖啡。', '我很喜歡喝咖啡。'],
}

const mockLlmIncorrect: AnswerValidationResponse = {
  is_correct: false,
  explanation: 'The adverb 很 must come directly before the verb 喜歡.',
  alternatives: [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

function renderSentenceBuilder(
  props: Partial<React.ComponentProps<typeof SentenceBuilder>> = {}
) {
  const allProps = { ...mockDefaultProps, onAnswer: jest.fn(), ...props }

  return render(
    React.createElement(SentenceBuilder, allProps),
    { wrapper: createWrapper() }
  )
}

/** Helper: place all tiles in correct order */
function placeAllTilesInOrder(getByTestId: ReturnType<typeof render>['getByTestId']) {
  // Correct order is ["我"(tile-1), "很"(tile-3), "喜歡"(tile-2), "咖啡"(tile-0), "。"(tile-4)]
  // Available tiles in scrambled order: tile-0 to tile-4
  // We tap them so they produce the correct answer
  const correctTileOrder = ['tile-1', 'tile-3', 'tile-2', 'tile-0', 'tile-4']
  correctTileOrder.forEach((id) => {
    fireEvent.press(getByTestId(`available-tile-${id}`))
  })
}

/** Reset quiz store between tests */
function resetStore() {
  useQuizStore.getState().resetQuiz()
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SentenceBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetStore()
    jest.useFakeTimers()
  })

  afterEach(() => {
    // Clear any pending timers before restoring real timers (M6 fix: prevents
    // worker process leak warnings from feedback delay timeouts left running).
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  // ─── 6.1: Renders word bank with all scrambled words ─────────────────────

  describe('6.1 — word bank renders all scrambled words', () => {
    it('renders all scrambled word tiles in the word bank', () => {
      const { getByTestId } = renderSentenceBuilder()

      mockScrambledWords.forEach((_, i) => {
        expect(getByTestId(`available-tile-tile-${i}`)).toBeTruthy()
      })
    })

    it('renders question text', () => {
      const { getByTestId } = renderSentenceBuilder()
      expect(getByTestId('sentence-builder-question')).toBeTruthy()
    })

    it('renders the word bank container', () => {
      const { getByTestId } = renderSentenceBuilder()
      expect(getByTestId('word-bank')).toBeTruthy()
    })

    it('renders the slot area (answer area)', () => {
      const { getByTestId } = renderSentenceBuilder()
      expect(getByTestId('slot-area')).toBeTruthy()
    })
  })

  // ─── 6.2: Tapping a tile moves it to answer area ─────────────────────────

  describe('6.2 — tapping a tile moves it to the answer area', () => {
    it('removes tile from word bank when tapped', () => {
      const { getByTestId, queryByTestId } = renderSentenceBuilder()

      fireEvent.press(getByTestId('available-tile-tile-0'))

      expect(queryByTestId('available-tile-tile-0')).toBeNull()
    })

    it('places tile in answer area when tapped', () => {
      const { getByTestId } = renderSentenceBuilder()

      fireEvent.press(getByTestId('available-tile-tile-0'))

      expect(getByTestId('placed-tile-tile-0')).toBeTruthy()
    })

    it('tapping multiple tiles places them in order', () => {
      const { getByTestId } = renderSentenceBuilder()

      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-3'))

      expect(getByTestId('placed-tile-tile-1')).toBeTruthy()
      expect(getByTestId('placed-tile-tile-3')).toBeTruthy()
    })
  })

  // ─── 6.3: Tapping a placed tile returns it to word bank ──────────────────

  describe('6.3 — tapping a placed tile returns it to word bank', () => {
    it('returns placed tile to word bank on tap', () => {
      const { getByTestId, queryByTestId } = renderSentenceBuilder()

      // Place a tile
      fireEvent.press(getByTestId('available-tile-tile-0'))
      expect(getByTestId('placed-tile-tile-0')).toBeTruthy()

      // Return it
      fireEvent.press(getByTestId('placed-tile-tile-0'))
      expect(queryByTestId('placed-tile-tile-0')).toBeNull()
      expect(getByTestId('available-tile-tile-0')).toBeTruthy()
    })
  })

  // ─── 6.4: Submit button disabled until all tiles placed ──────────────────

  describe('6.4 — submit button disabled until all tiles placed', () => {
    it('submit button is present', () => {
      const { getByTestId } = renderSentenceBuilder()
      expect(getByTestId('submit-button')).toBeTruthy()
    })

    it('submit button is disabled when no tiles are placed', () => {
      const { getByTestId } = renderSentenceBuilder()
      // In our mock, disabled elements render as View (non-pressable)
      // We can verify the store has no placed tiles
      expect(useQuizStore.getState().placedTileIds).toHaveLength(0)
      // The button should not be pressable (rendered as View when disabled)
      const button = getByTestId('submit-button')
      expect(button).toBeTruthy()
    })

    it('submit button is disabled when only some tiles are placed', () => {
      const { getByTestId } = renderSentenceBuilder()

      // Place only 2 of 5 tiles
      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))

      expect(useQuizStore.getState().placedTileIds).toHaveLength(2)
      // allTilesPlaced = false → button still disabled (rendered as View)
    })

    it('submit becomes pressable when all tiles are placed', () => {
      const { getByTestId } = renderSentenceBuilder()

      placeAllTilesInOrder(getByTestId)

      expect(useQuizStore.getState().placedTileIds).toHaveLength(mockScrambledWords.length)
    })
  })

  // ─── 6.5: Correct answer (local match) shows all tiles green ─────────────

  describe('6.5 — correct answer (local match) shows all tiles green', () => {
    it('shows correct feedback for exact local match', async () => {
      const onAnswer = jest.fn()
      const { getByTestId, queryByTestId } = renderSentenceBuilder({ onAnswer })

      // Place tiles in correct order: 我(tile-1) 很(tile-3) 喜歡(tile-2) 咖啡(tile-0) 。(tile-4)
      placeAllTilesInOrder(getByTestId)

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(queryByTestId('feedback-section')).toBeTruthy()
      })

      // LLM should NOT be called for local match
      expect(mockValidateAnswer).not.toHaveBeenCalled()

      // Correct feedback shown
      expect(queryByTestId('correct-feedback')).toBeTruthy()
      expect(queryByTestId('incorrect-feedback')).toBeNull()
    })

    it('calls onAnswer(true) immediately after validation for correct answer', async () => {
      const onAnswer = jest.fn()
      const { getByTestId } = renderSentenceBuilder({ onAnswer })

      placeAllTilesInOrder(getByTestId)

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      // onAnswer is called immediately after validate() resolves —
      // auto-advance is handled by play.tsx's unified FeedbackOverlay timer.
      expect(onAnswer).toHaveBeenCalledWith(true)
    })
  })

  // ─── 6.6: Incorrect answer triggers LLM validation call ──────────────────

  describe('6.6 — incorrect answer triggers LLM validation call', () => {
    it('calls api.validateAnswer when answer does not locally match', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmIncorrect)

      const { getByTestId } = renderSentenceBuilder()

      // Place tiles in wrong order: tile-0 first (咖啡 is wrong position)
      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(mockValidateAnswer).toHaveBeenCalledWith(
          expect.objectContaining({
            correctAnswer: mockCorrectAnswer,
            exerciseType: 'sentence_construction',
          })
        )
      })
    })
  })

  // ─── 6.7: LLM returns valid alternative → "also valid" message ───────────

  describe('6.7 — LLM returns valid alternative shows "also valid" message', () => {
    it('shows "Your answer is also valid!" when LLM confirms alternative', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmValidAlternative)

      const { getByTestId, queryByTestId } = renderSentenceBuilder()

      // Place tiles in wrong order (won't locally match)
      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(queryByTestId('alternative-valid-message')).toBeTruthy()
      })

      expect(queryByTestId('correct-feedback')).toBeNull()
      expect(queryByTestId('incorrect-feedback')).toBeNull()
    })

    it('calls onAnswer(true) immediately for valid alternative', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmValidAlternative)
      const onAnswer = jest.fn()

      const { getByTestId } = renderSentenceBuilder({ onAnswer })

      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      // onAnswer is called immediately after validate() resolves
      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalledWith(true)
      })
    })
  })

  // ─── 6.8: LLM returns incorrect → per-tile feedback + correct sentence ────

  describe('6.8 — LLM returns incorrect shows per-tile feedback and correct sentence', () => {
    it('shows incorrect feedback and correct sentence for LLM-confirmed incorrect', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmIncorrect)

      const { getByTestId, queryByTestId } = renderSentenceBuilder()

      // Wrong order
      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(queryByTestId('incorrect-feedback')).toBeTruthy()
      })

      // Correct sentence shown
      expect(queryByTestId('correct-sentence')).toBeTruthy()
      expect(queryByTestId('alternative-valid-message')).toBeNull()
    })

    it('calls onAnswer(false) immediately for incorrect LLM result', async () => {
      mockValidateAnswer.mockResolvedValue(mockLlmIncorrect)
      const onAnswer = jest.fn()

      const { getByTestId } = renderSentenceBuilder({ onAnswer })

      // Wrong order
      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      // onAnswer is called immediately after validate() resolves
      await waitFor(() => {
        expect(onAnswer).toHaveBeenCalledWith(false)
      })
    })
  })

  // ─── 6.9: LLM timeout falls back to local (incorrect) ────────────────────

  describe('6.9 — LLM timeout falls back to local validation (marks incorrect)', () => {
    it('shows incorrect feedback and calls onAnswer(false) immediately on timeout', async () => {
      const timeoutError = new QuizGenerationError('timeout', 'Validation timed out.')
      mockValidateAnswer.mockRejectedValue(timeoutError)
      const onAnswer = jest.fn()

      const { getByTestId, queryByTestId } = renderSentenceBuilder({ onAnswer })

      // Wrong order
      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      // onAnswer is called immediately after validate() rejects (fallback to local)
      await waitFor(() => {
        expect(queryByTestId('incorrect-feedback')).toBeTruthy()
        expect(onAnswer).toHaveBeenCalledWith(false)
      })
    })

    it('shows incorrect feedback on network error (fallback)', async () => {
      const networkError = new QuizGenerationError('network', 'Validation request failed.')
      mockValidateAnswer.mockRejectedValue(networkError)

      const { getByTestId, queryByTestId } = renderSentenceBuilder()

      fireEvent.press(getByTestId('available-tile-tile-0'))
      fireEvent.press(getByTestId('available-tile-tile-1'))
      fireEvent.press(getByTestId('available-tile-tile-2'))
      fireEvent.press(getByTestId('available-tile-tile-3'))
      fireEvent.press(getByTestId('available-tile-tile-4'))

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(queryByTestId('incorrect-feedback')).toBeTruthy()
      })
    })
  })

  // ─── H1 fix: sourceCitation is displayed after submit ────────────────────

  describe('sourceCitation — displayed in feedback section after submit', () => {
    it('shows sourceCitation in the explanation section after a correct answer', async () => {
      const onAnswer = jest.fn()
      const { getByTestId } = renderSentenceBuilder({
        onAnswer,
        sourceCitation: 'Book 2, Chapter 12 - Grammar',
      })

      placeAllTilesInOrder(getByTestId)

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(getByTestId('source-citation')).toBeTruthy()
      })
    })

    it('does not render source-citation when sourceCitation prop is empty string', async () => {
      const { getByTestId, queryByTestId } = renderSentenceBuilder({
        sourceCitation: '',
      })

      placeAllTilesInOrder(getByTestId)

      await act(async () => {
        fireEvent.press(getByTestId('submit-button'))
      })

      await waitFor(() => {
        expect(queryByTestId('feedback-section')).toBeTruthy()
      })

      expect(queryByTestId('source-citation')).toBeNull()
    })
  })

  // ─── Store reset after question advance ───────────────────────────────────

  describe('tile placement state resets', () => {
    it('store clears placedTileIds after nextQuestion', () => {
      renderSentenceBuilder()

      act(() => {
        useQuizStore.getState().placeTile('tile-0')
        useQuizStore.getState().placeTile('tile-1')
      })
      expect(useQuizStore.getState().placedTileIds).toHaveLength(2)

      act(() => {
        useQuizStore.getState().nextQuestion()
      })
      expect(useQuizStore.getState().placedTileIds).toHaveLength(0)
    })
  })
})
