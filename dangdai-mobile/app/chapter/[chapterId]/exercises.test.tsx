/**
 * Exercise Type Selection Screen Tests
 *
 * Integration tests for the exercises screen.
 * Tests: all 8 AI cards rendered, premade section visibility,
 * navigation calls, progress indicators, Mixed card styling,
 * conditional browse button visibility based on content availability.
 *
 * Story 3.5: Exercise Type Selection Screen — Task 6
 * Story 3.7: Wire Browse Screen Navigation — conditional visibility tests
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

// ─── Mock expo-router ─────────────────────────────────────────────────────────

const mockPush = jest.fn()
const mockBack = jest.fn()
const mockUseLocalSearchParams = jest.fn()

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ push: mockPush, back: mockBack }),
  Stack: {
    Screen: ({ options }: any) => null,
  },
}))

// ─── Mock Tamagui ─────────────────────────────────────────────────────────────

jest.mock('tamagui', () => {
  const { View, Text, TouchableOpacity, ScrollView: RNScrollView } = require('react-native')

  return {
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Text: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    H2: ({ children, testID }: any) => <Text testID={testID}>{children}</Text>,
    Button: ({ children, onPress, testID, icon }: any) => (
      <TouchableOpacity testID={testID} onPress={onPress}>
        <Text>{children}</Text>
      </TouchableOpacity>
    ),
    Theme: ({ children }: any) => <View testID="theme-primary-wrapper">{children}</View>,
    Card: ({ children, testID, onPress, accessibilityRole, accessibilityLabel }: any) => (
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    ),
  }
})

// ─── Mock lucide icons ────────────────────────────────────────────────────────

jest.mock('@tamagui/lucide-icons', () => {
  const { View } = require('react-native')
  const MockIcon = ({ testID }: any) => <View testID={testID} />
  return {
    Shuffle: MockIcon,
    BookOpen: MockIcon,
    MessageSquare: MockIcon,
    PenTool: MockIcon,
    Link: MockIcon,
    MessageCircle: MockIcon,
    LayoutGrid: MockIcon,
    FileText: MockIcon,
    ChevronLeft: MockIcon,
    Check: MockIcon,
  }
})

// ─── Mock hooks ───────────────────────────────────────────────────────────────

const mockUseExerciseTypeProgress = jest.fn()
jest.mock('../../../hooks/useExerciseTypeProgress', () => ({
  useExerciseTypeProgress: (chapterId: number) => mockUseExerciseTypeProgress(chapterId),
}))

const mockUsePremadeExercises = jest.fn()
jest.mock('../../../hooks/usePremadeExercises', () => ({
  usePremadeExercises: (bookId: number, lessonId: number) =>
    mockUsePremadeExercises(bookId, lessonId),
}))

// Mock count hooks for conditional browse button visibility (Story 3.7)
const mockUseVocabularyCount = jest.fn()
jest.mock('../../../hooks/useVocabulary', () => ({
  useVocabularyCount: (bookId: number, lessonId: number) =>
    mockUseVocabularyCount(bookId, lessonId),
}))

const mockUseGrammarPointsCount = jest.fn()
jest.mock('../../../hooks/useGrammarPoints', () => ({
  useGrammarPointsCount: (bookId: number, lessonId: number) =>
    mockUseGrammarPointsCount(bookId, lessonId),
}))

const mockUseDialoguesCount = jest.fn()
jest.mock('../../../hooks/useDialogues', () => ({
  useDialoguesCount: (bookId: number, lessonId: number) =>
    mockUseDialoguesCount(bookId, lessonId),
}))

// Mock useChapters
jest.mock('../../../hooks/useChapters', () => ({
  useChapter: (chapterId: number) => {
    if (chapterId === 101) {
      return {
        id: 101,
        bookId: 1,
        chapterNumber: 1,
        titleEnglish: 'Welcome to Taiwan!',
        titleChinese: '歡迎你來臺灣！',
      }
    }
    return undefined
  },
}))

// Mock BOOKS constant
jest.mock('../../../constants/books', () => ({
  BOOKS: [
    { id: 1, title: 'Book 1', titleChinese: '第一册', chapterCount: 15, coverColor: '#06B6D4' },
  ],
}))

// ─── Mock child components ────────────────────────────────────────────────────

jest.mock('../../../components/chapter/ExerciseTypeCard', () => ({
  ExerciseTypeCard: ({ type, label, onPress, isMixed, progress }: any) => {
    const { TouchableOpacity, Text, View } = require('react-native')
    return (
      <TouchableOpacity
        testID={`exercise-type-card-${type}`}
        onPress={onPress}
      >
        <Text testID={`exercise-type-label-${type}`}>{label}</Text>
        {isMixed && <View testID="mixed-card-indicator" />}
        {progress?.mastered && <View testID={`mastered-${type}`} />}
        {!progress && <Text testID={`new-${type}`}>New</Text>}
      </TouchableOpacity>
    )
  },
}))

jest.mock('../../../components/chapter/PremadeExerciseCard', () => ({
  PremadeExerciseCard: ({ exercise, onPress }: any) => {
    const { TouchableOpacity, Text } = require('react-native')
    return (
      <TouchableOpacity
        testID={`premade-exercise-card-${exercise.id}`}
        onPress={onPress}
      >
        <Text>{exercise.title}</Text>
      </TouchableOpacity>
    )
  },
}))

// Import after mocks
import ExercisesScreen from './exercises'

// ─── Test fixtures ────────────────────────────────────────────────────────────

const defaultProgressRows = [
  { exercise_type: 'vocabulary', best_score: 65, attempts_count: 2, mastered_at: null },
  { exercise_type: 'grammar', best_score: 85, attempts_count: 3, mastered_at: '2026-01-01T00:00:00Z' },
]

const mockPremadeExercises = [
  {
    id: 'ex-1',
    exercise_type: 'vocabulary',
    exercise_order: 1,
    title: 'Vocabulary Set A',
    instructions: 'Match the words',
    difficulty: 'beginner',
  },
  {
    id: 'ex-2',
    exercise_type: 'grammar',
    exercise_order: 2,
    title: 'Grammar Practice',
    instructions: 'Fill in the blanks',
    difficulty: 'intermediate',
  },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ExercisesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ chapterId: '101' })
    mockUseExerciseTypeProgress.mockReturnValue({ data: [] })
    mockUsePremadeExercises.mockReturnValue({ data: [] })
    // Default: all content exists (browse buttons visible) — preserves existing test behavior
    mockUseVocabularyCount.mockReturnValue({ data: true })
    mockUseGrammarPointsCount.mockReturnValue({ data: true })
    mockUseDialoguesCount.mockReturnValue({ data: true })
  })

  describe('screen rendering (AC #1)', () => {
    it('renders the exercises screen', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('exercises-screen')).toBeTruthy()
    })

    it('displays chapter header info', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('chapter-title-english')).toHaveTextContent('Welcome to Taiwan!')
      expect(getByTestId('chapter-title-chinese')).toHaveTextContent('歡迎你來臺灣！')
    })

    it('shows "Chapter not found" for invalid chapterId', () => {
      mockUseLocalSearchParams.mockReturnValue({ chapterId: 'invalid' })
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('exercises-invalid-chapter')).toBeTruthy()
    })
  })

  describe('AI-Generated Exercises section (AC #1, #2)', () => {
    it('renders all 8 exercise type cards', () => {
      const { getByTestId } = render(<ExercisesScreen />)

      const expectedTypes = [
        'mixed',
        'vocabulary',
        'grammar',
        'fill_in_blank',
        'matching',
        'dialogue_completion',
        'sentence_construction',
        'reading_comprehension',
      ]

      for (const type of expectedTypes) {
        expect(getByTestId(`exercise-type-card-${type}`)).toBeTruthy()
      }
    })

    it('renders the AI section header', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('ai-section-header')).toHaveTextContent('AI-Generated Exercises')
    })

    it('renders the exercise type grid', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('exercise-type-grid')).toBeTruthy()
    })
  })

  describe('Premade Exercises section (AC #1, #6)', () => {
    it('hides premade section when no premade exercises exist', () => {
      mockUsePremadeExercises.mockReturnValue({ data: [] })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('premade-exercises-section')).toBeNull()
    })

    it('hides premade section when data is undefined (loading/error)', () => {
      mockUsePremadeExercises.mockReturnValue({ data: undefined })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('premade-exercises-section')).toBeNull()
    })

    it('shows premade section when premade exercises exist', () => {
      mockUsePremadeExercises.mockReturnValue({ data: mockPremadeExercises })
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('premade-exercises-section')).toBeTruthy()
    })

    it('renders premade section header when exercises exist', () => {
      mockUsePremadeExercises.mockReturnValue({ data: mockPremadeExercises })
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('premade-section-header')).toHaveTextContent('Workbook Exercises')
    })

    it('renders all premade exercise cards', () => {
      mockUsePremadeExercises.mockReturnValue({ data: mockPremadeExercises })
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('premade-exercise-card-ex-1')).toBeTruthy()
      expect(getByTestId('premade-exercise-card-ex-2')).toBeTruthy()
    })
  })

  describe('navigation (AC #3, #4, #5)', () => {
    it('navigates to quiz loading when AI exercise type is tapped (AC #4)', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      fireEvent.press(getByTestId('exercise-type-card-vocabulary'))
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/loading',
        params: {
          chapterId: '101',
          bookId: '1',
          exerciseType: 'vocabulary',
          quizType: 'vocabulary',
        },
      })
    })

    it('navigates to quiz loading with mixed type when Mixed card is tapped (AC #5)', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      fireEvent.press(getByTestId('exercise-type-card-mixed'))
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/loading',
        params: {
          chapterId: '101',
          bookId: '1',
          exerciseType: 'mixed',
          quizType: 'mixed',
        },
      })
    })

    it('navigates to premade exercise screen when premade card is tapped (AC #3)', () => {
      mockUsePremadeExercises.mockReturnValue({ data: mockPremadeExercises })
      const { getByTestId } = render(<ExercisesScreen />)
      fireEvent.press(getByTestId('premade-exercise-card-ex-1'))
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/quiz/premade',
        params: {
          chapterId: '101',
          bookId: '1',
          exerciseId: 'ex-1',
        },
      })
    })

    it('navigates to vocabulary browse screen', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      fireEvent.press(getByTestId('browse-vocabulary-button'))
      expect(mockPush).toHaveBeenCalledWith('/chapter/101/vocabulary')
    })

    it('navigates to grammar browse screen', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      fireEvent.press(getByTestId('browse-grammar-button'))
      expect(mockPush).toHaveBeenCalledWith('/chapter/101/grammar')
    })

    it('navigates to dialogues browse screen', () => {
      const { getByTestId } = render(<ExercisesScreen />)
      fireEvent.press(getByTestId('browse-dialogues-button'))
      expect(mockPush).toHaveBeenCalledWith('/chapter/101/dialogues')
    })
  })

  describe('progress indicators (AC #2)', () => {
    it('passes progress data to exercise type cards', () => {
      mockUseExerciseTypeProgress.mockReturnValue({ data: defaultProgressRows })
      const { queryByTestId } = render(<ExercisesScreen />)
      // vocabulary has progress (65%) — should NOT show "New"
      expect(queryByTestId('new-vocabulary')).toBeNull()
    })

    it('shows "New" for exercise types with no progress', () => {
      mockUseExerciseTypeProgress.mockReturnValue({ data: [] })
      const { getByTestId } = render(<ExercisesScreen />)
      // All types should show "New" when no progress data
      expect(getByTestId('new-vocabulary')).toBeTruthy()
    })
  })

  describe('browse buttons (Stories 11.5, 11.6, 11.7)', () => {
    it('renders all three browse buttons when all content exists', () => {
      // Default beforeEach: all count hooks return { data: true }
      const { getByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('browse-vocabulary-button')).toBeTruthy()
      expect(getByTestId('browse-grammar-button')).toBeTruthy()
      expect(getByTestId('browse-dialogues-button')).toBeTruthy()
    })
  })

  describe('conditional browse button visibility (Story 3.7 — AC #1, #5)', () => {
    it('hides vocabulary button when useVocabularyCount returns false', () => {
      mockUseVocabularyCount.mockReturnValue({ data: false })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-vocabulary-button')).toBeNull()
      // Grammar and dialogues still visible
      expect(queryByTestId('browse-grammar-button')).toBeTruthy()
      expect(queryByTestId('browse-dialogues-button')).toBeTruthy()
    })

    it('hides grammar button when useGrammarPointsCount returns false', () => {
      mockUseGrammarPointsCount.mockReturnValue({ data: false })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-grammar-button')).toBeNull()
      // Vocabulary and dialogues still visible
      expect(queryByTestId('browse-vocabulary-button')).toBeTruthy()
      expect(queryByTestId('browse-dialogues-button')).toBeTruthy()
    })

    it('hides dialogues button when useDialoguesCount returns false', () => {
      mockUseDialoguesCount.mockReturnValue({ data: false })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-dialogues-button')).toBeNull()
      // Vocabulary and grammar still visible
      expect(queryByTestId('browse-vocabulary-button')).toBeTruthy()
      expect(queryByTestId('browse-grammar-button')).toBeTruthy()
    })

    it('hides vocabulary button when useVocabularyCount returns undefined (loading)', () => {
      mockUseVocabularyCount.mockReturnValue({ data: undefined })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-vocabulary-button')).toBeNull()
    })

    it('hides grammar button when useGrammarPointsCount returns undefined (loading)', () => {
      mockUseGrammarPointsCount.mockReturnValue({ data: undefined })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-grammar-button')).toBeNull()
    })

    it('hides dialogues button when useDialoguesCount returns undefined (loading)', () => {
      mockUseDialoguesCount.mockReturnValue({ data: undefined })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-dialogues-button')).toBeNull()
    })

    it('hides browse-buttons container when all three counts are false', () => {
      mockUseVocabularyCount.mockReturnValue({ data: false })
      mockUseGrammarPointsCount.mockReturnValue({ data: false })
      mockUseDialoguesCount.mockReturnValue({ data: false })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-buttons')).toBeNull()
      expect(queryByTestId('browse-vocabulary-button')).toBeNull()
      expect(queryByTestId('browse-grammar-button')).toBeNull()
      expect(queryByTestId('browse-dialogues-button')).toBeNull()
    })

    it('hides browse-buttons container when all three counts are undefined (loading)', () => {
      mockUseVocabularyCount.mockReturnValue({ data: undefined })
      mockUseGrammarPointsCount.mockReturnValue({ data: undefined })
      mockUseDialoguesCount.mockReturnValue({ data: undefined })
      const { queryByTestId } = render(<ExercisesScreen />)
      expect(queryByTestId('browse-buttons')).toBeNull()
    })

    it('shows browse-buttons container when at least one count is true', () => {
      mockUseVocabularyCount.mockReturnValue({ data: false })
      mockUseGrammarPointsCount.mockReturnValue({ data: true })
      mockUseDialoguesCount.mockReturnValue({ data: false })
      const { getByTestId, queryByTestId } = render(<ExercisesScreen />)
      expect(getByTestId('browse-buttons')).toBeTruthy()
      expect(queryByTestId('browse-vocabulary-button')).toBeNull()
      expect(getByTestId('browse-grammar-button')).toBeTruthy()
      expect(queryByTestId('browse-dialogues-button')).toBeNull()
    })
  })
})
