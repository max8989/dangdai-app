/**
 * ReadingPassageCard Component Tests
 *
 * Unit and integration tests for the reading comprehension passage card.
 *
 * Story 4.8: Reading Comprehension Exercise
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { TamaguiProvider } from 'tamagui'
import { ReadingPassageCard } from './ReadingPassageCard'
import type { ComprehensionSubQuestion } from '../../types/quiz'
import config from '../../tamagui.config'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockComprehensionSubQuestions: ComprehensionSubQuestion[] = [
  {
    question: 'What does the author do first in the morning?',
    options: ['吃早餐', '去跑步', '喝咖啡', '看書'],
    correct_answer: '去跑步',
  },
  {
    question: 'What does the author like to eat for breakfast?',
    options: ['麵包和牛奶', '包子和豆漿', '飯和菜', '水果和咖啡'],
    correct_answer: '包子和豆漿',
  },
  {
    question: 'What time does the author wake up?',
    options: ['五點', '六點', '七點', '八點'],
    correct_answer: '六點',
  },
]

const mockPassage =
  '我每天早上六點起床。起床以後先去跑步，然後吃早餐。我很喜歡吃包子和豆漿。吃完早餐以後，我就去上課了。'
const mockPassagePinyin =
  'Wǒ měi tiān zǎo shàng liù diǎn qǐ chuáng. Qǐ chuáng yǐ hòu xiān qù pǎo bù, rán hòu chī zǎo cān. Wǒ hěn xǐ huān chī bāo zi hé dòu jiāng. Chī wán zǎo cān yǐ hòu, wǒ jiù qù shàng kè le.'

// ─── Test Wrapper ─────────────────────────────────────────────────────────────

function renderWithTamagui(component: React.ReactElement) {
  return render(<TamaguiProvider config={config}>{component}</TamaguiProvider>)
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ReadingPassageCard', () => {
  const mockOnAnswer = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('renders passage text in a scrollable container', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText(mockPassage)).toBeTruthy()
  })

  it('renders "Read the following passage:" header', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText('Read the following passage:')).toBeTruthy()
  })

  it('renders first comprehension question text below passage', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(
      screen.getByText('What does the author do first in the morning?')
    ).toBeTruthy()
  })

  it('renders 4 answer options via AnswerOptionGrid', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText('吃早餐')).toBeTruthy()
    expect(screen.getByText('去跑步')).toBeTruthy()
    expect(screen.getByText('喝咖啡')).toBeTruthy()
    expect(screen.getByText('看書')).toBeTruthy()
  })

  it('shows pinyin toggle button when passagePinyin is provided', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        passagePinyin={mockPassagePinyin}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByTestId('pinyin-toggle')).toBeTruthy()
  })

  it('does not show pinyin toggle button when passagePinyin is undefined', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.queryByTestId('pinyin-toggle')).toBeNull()
  })

  it('does not show pinyin toggle button when passagePinyin is empty string', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        passagePinyin=""
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.queryByTestId('pinyin-toggle')).toBeNull()
  })

  it('tapping pinyin toggle shows pinyin text above passage', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        passagePinyin={mockPassagePinyin}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    // Initially pinyin is hidden
    expect(screen.queryByText(mockPassagePinyin)).toBeNull()

    // Tap pinyin toggle
    fireEvent.press(screen.getByTestId('pinyin-toggle'))

    // Pinyin should now be visible
    expect(screen.getByText(mockPassagePinyin)).toBeTruthy()
  })

  it('tapping pinyin toggle again hides pinyin text', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        passagePinyin={mockPassagePinyin}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    const pinyinToggle = screen.getByTestId('pinyin-toggle')

    // Show pinyin
    fireEvent.press(pinyinToggle)
    expect(screen.getByText(mockPassagePinyin)).toBeTruthy()

    // Hide pinyin
    fireEvent.press(pinyinToggle)
    expect(screen.queryByText(mockPassagePinyin)).toBeNull()
  })

  it('selecting correct answer shows success feedback and calls onAnswer with true', async () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    // Select correct answer
    const correctOption = screen.getByText('去跑步')
    fireEvent.press(correctOption)

    // onAnswer should NOT be called immediately (there's a 1s delay)
    expect(mockOnAnswer).not.toHaveBeenCalled()

    // Fast-forward time by 1s
    jest.advanceTimersByTime(1000)

    // onAnswer should now be called with (true, '去跑步')
    await waitFor(() => {
      expect(mockOnAnswer).toHaveBeenCalledWith(true, '去跑步')
    })
  })

  it('selecting incorrect answer shows error feedback and calls onAnswer with false', async () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    // Select incorrect answer
    const incorrectOption = screen.getByText('吃早餐')
    fireEvent.press(incorrectOption)

    // onAnswer should NOT be called immediately
    expect(mockOnAnswer).not.toHaveBeenCalled()

    // Fast-forward time by 1s
    jest.advanceTimersByTime(1000)

    // onAnswer should now be called with (false, '吃早餐')
    await waitFor(() => {
      expect(mockOnAnswer).toHaveBeenCalledWith(false, '吃早餐')
    })
  })

  it('answer options are disabled after selection', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    // Select an answer
    fireEvent.press(screen.getByText('吃早餐'))

    // Try to select another answer — should not call onAnswer again
    fireEvent.press(screen.getByText('去跑步'))

    // Fast-forward time
    jest.advanceTimersByTime(1000)

    // onAnswer should only be called once (for the first selection)
    expect(mockOnAnswer).toHaveBeenCalledTimes(1)
  })

  it('sub-question progress indicator shows correct count', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText('Question 1/3')).toBeTruthy()
  })

  it('sub-question progress updates when index changes', () => {
    const { rerender } = renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText('Question 1/3')).toBeTruthy()

    // Advance to second sub-question
    rerender(
      <TamaguiProvider config={config}>
        <ReadingPassageCard
          passage={mockPassage}
          comprehensionQuestions={mockComprehensionSubQuestions}
          currentSubQuestionIndex={1}
          onAnswer={mockOnAnswer}
        />
      </TamaguiProvider>
    )

    expect(screen.getByText('Question 2/3')).toBeTruthy()
  })

  it('passage remains rendered (not unmounted) across sub-question transitions', () => {
    const { rerender } = renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    // Passage should be visible
    expect(screen.getByText(mockPassage)).toBeTruthy()

    // Advance to second sub-question
    rerender(
      <TamaguiProvider config={config}>
        <ReadingPassageCard
          passage={mockPassage}
          comprehensionQuestions={mockComprehensionSubQuestions}
          currentSubQuestionIndex={1}
          onAnswer={mockOnAnswer}
        />
      </TamaguiProvider>
    )

    // Passage should STILL be visible (not unmounted)
    expect(screen.getByText(mockPassage)).toBeTruthy()
  })

  it('question text changes when sub-question index changes', () => {
    const { rerender } = renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(
      screen.getByText('What does the author do first in the morning?')
    ).toBeTruthy()

    // Advance to second sub-question
    rerender(
      <TamaguiProvider config={config}>
        <ReadingPassageCard
          passage={mockPassage}
          comprehensionQuestions={mockComprehensionSubQuestions}
          currentSubQuestionIndex={1}
          onAnswer={mockOnAnswer}
        />
      </TamaguiProvider>
    )

    expect(
      screen.getByText('What does the author like to eat for breakfast?')
    ).toBeTruthy()
  })

  it('disabled prop prevents answer selection', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
        disabled={true}
      />
    )

    // Try to select an answer
    fireEvent.press(screen.getByText('去跑步'))

    // Fast-forward time
    jest.advanceTimersByTime(1000)

    // onAnswer should NOT be called because component is disabled
    expect(mockOnAnswer).not.toHaveBeenCalled()
  })

  it('shows error message when comprehensionQuestions is empty array', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={[]}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText('No comprehension questions available.')).toBeTruthy()
  })

  it('shows error message when currentSubQuestionIndex is out of bounds', () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={10}
        onAnswer={mockOnAnswer}
      />
    )

    expect(screen.getByText('Invalid question index.')).toBeTruthy()
  })

  it('respects custom feedbackDelayMs prop', async () => {
    renderWithTamagui(
      <ReadingPassageCard
        passage={mockPassage}
        comprehensionQuestions={mockComprehensionSubQuestions}
        currentSubQuestionIndex={0}
        onAnswer={mockOnAnswer}
        feedbackDelayMs={500}
      />
    )

    // Select an answer
    fireEvent.press(screen.getByText('去跑步'))

    // onAnswer should NOT be called after 400ms
    jest.advanceTimersByTime(400)
    expect(mockOnAnswer).not.toHaveBeenCalled()

    // onAnswer should be called after 500ms
    jest.advanceTimersByTime(100)
    await waitFor(() => {
      expect(mockOnAnswer).toHaveBeenCalledWith(true, '去跑步')
    })
  })
})
