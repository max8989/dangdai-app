/**
 * ExerciseTypeProgressList Component Tests
 *
 * Unit tests for the per-exercise-type progress bars shown on CompletionScreen.
 * Tests: all 7 types rendered, status logic (mastered/in-progress/new),
 * highlight of just-completed type, empty/null progress handling.
 *
 * Story 4.11: Quiz Results Screen — Task 3.8
 */

import React from 'react'
import { render } from '@testing-library/react-native'

import { ExerciseTypeProgressList } from './ExerciseTypeProgressList'
import type { ExerciseTypeProgressRow } from './ExerciseTypeProgressList'

// ─── Mock Tamagui ─────────────────────────────────────────────────────────────

jest.mock('tamagui', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { View, Text } = require('react-native')

  const YStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const XStack = ({ children, testID, ...rest }: any) => (
    <View testID={testID} {...rest}>{children}</View>
  )
  const TamaguiText = ({ children, testID, ...rest }: any) => (
    <Text testID={testID} {...rest}>{children}</Text>
  )
  const Theme = ({ children }: any) => <>{children}</>
  const styled = (_component: any, _config: any) => {
    return ({ children, testID, ...rest }: any) => (
      <View testID={testID} {...rest}>{children}</View>
    )
  }

  return { YStack, XStack, Text: TamaguiText, Theme, styled }
})

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockProgress: ExerciseTypeProgressRow[] = [
  { exercise_type: 'vocabulary', best_score: 85, attempts_count: 3, mastered_at: '2026-02-19T10:00:00Z' },
  { exercise_type: 'grammar', best_score: 65, attempts_count: 2, mastered_at: null },
  { exercise_type: 'matching', best_score: 88, attempts_count: 1, mastered_at: '2026-02-20T14:00:00Z' },
  { exercise_type: 'fill_in_blank', best_score: 0, attempts_count: 0, mastered_at: null },
  { exercise_type: 'dialogue_completion', best_score: 0, attempts_count: 0, mastered_at: null },
  { exercise_type: 'sentence_construction', best_score: 0, attempts_count: 0, mastered_at: null },
  { exercise_type: 'reading_comprehension', best_score: 0, attempts_count: 0, mastered_at: null },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExerciseTypeProgressList — rendering all 7 types (Task 3.1)', () => {
  it('renders the list container', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList
        progress={mockProgress}
        highlightType="matching"
        testID="progress-list"
      />
    )
    expect(getByTestId('progress-list')).toBeTruthy()
  })

  it('renders all 7 exercise type rows', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList
        progress={mockProgress}
        highlightType="matching"
      />
    )
    const types = [
      'vocabulary', 'grammar', 'fill_in_blank', 'matching',
      'dialogue_completion', 'sentence_construction', 'reading_comprehension',
    ]
    types.forEach((type) => {
      expect(getByTestId(`exercise-type-row-${type}`)).toBeTruthy()
    })
  })

  it('renders labels for all 7 types', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList
        progress={mockProgress}
        highlightType="vocabulary"
      />
    )
    expect(getByTestId('exercise-type-label-vocabulary')).toBeTruthy()
    expect(getByTestId('exercise-type-label-grammar')).toBeTruthy()
    expect(getByTestId('exercise-type-label-fill_in_blank')).toBeTruthy()
    expect(getByTestId('exercise-type-label-matching')).toBeTruthy()
    expect(getByTestId('exercise-type-label-dialogue_completion')).toBeTruthy()
    expect(getByTestId('exercise-type-label-sentence_construction')).toBeTruthy()
    expect(getByTestId('exercise-type-label-reading_comprehension')).toBeTruthy()
  })
})

describe('ExerciseTypeProgressList — status logic (Task 3.5)', () => {
  it('shows ✓ for mastered types (best_score >= 80)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={mockProgress} highlightType="vocabulary" />
    )
    // vocabulary: best_score = 85 → mastered
    expect(getByTestId('exercise-type-status-vocabulary').props.children).toBe('✓')
    // matching: best_score = 88 → mastered
    expect(getByTestId('exercise-type-status-matching').props.children).toBe('✓')
  })

  it('shows percentage for in-progress types (attempts > 0, best_score < 80)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={mockProgress} highlightType="vocabulary" />
    )
    // grammar: best_score = 65, attempts_count = 2 → in-progress (rendered as "65%")
    const statusEl = getByTestId('exercise-type-status-grammar')
    // Text children may be [65, "%"] or "65%" depending on mock
    const children = statusEl.props.children
    const text = Array.isArray(children) ? children.join('') : String(children)
    expect(text).toBe('65%')
  })

  it('shows "New" for types never attempted (attempts_count === 0)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={mockProgress} highlightType="vocabulary" />
    )
    // fill_in_blank: attempts_count = 0 → new
    expect(getByTestId('exercise-type-status-fill_in_blank').props.children).toBe('New')
    expect(getByTestId('exercise-type-status-dialogue_completion').props.children).toBe('New')
    expect(getByTestId('exercise-type-status-sentence_construction').props.children).toBe('New')
    expect(getByTestId('exercise-type-status-reading_comprehension').props.children).toBe('New')
  })
})

describe('ExerciseTypeProgressList — highlight just-completed type (Task 3.3, 3.4)', () => {
  it('renders highlighted type row (Task 3.3)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={mockProgress} highlightType="matching" />
    )
    // The highlighted row should still be rendered
    expect(getByTestId('exercise-type-row-matching')).toBeTruthy()
  })

  it('renders non-highlighted rows without special styling', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={mockProgress} highlightType="matching" />
    )
    // Non-highlighted rows exist too
    expect(getByTestId('exercise-type-row-vocabulary')).toBeTruthy()
    expect(getByTestId('exercise-type-row-grammar')).toBeTruthy()
  })
})

describe('ExerciseTypeProgressList — null/empty progress (Task 3.7)', () => {
  it('renders with null progress (shows all types as New)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={null} highlightType="vocabulary" />
    )
    // All types shown as New when no data
    expect(getByTestId('exercise-type-status-vocabulary').props.children).toBe('New')
    expect(getByTestId('exercise-type-status-grammar').props.children).toBe('New')
  })

  it('renders with empty progress array (shows all types as New)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={[]} highlightType="vocabulary" />
    )
    expect(getByTestId('exercise-type-status-vocabulary').props.children).toBe('New')
  })

  it('renders with undefined progress (shows all types as New)', () => {
    const { getByTestId } = render(
      <ExerciseTypeProgressList progress={undefined} highlightType="vocabulary" />
    )
    expect(getByTestId('exercise-type-status-vocabulary').props.children).toBe('New')
  })
})
