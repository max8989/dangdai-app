/**
 * Chapter Detail Screen
 *
 * Displays chapter information and exercise type selection.
 * Users can choose from 7 exercise types + Mixed mode.
 *
 * Open Navigation: No gates, no locks, no prerequisites.
 * Any user can access any chapter regardless of completion status.
 *
 * Story 3.4: Open Chapter Navigation (No Gates)
 * Story 3.5: Exercise Type Selection Screen
 * FR15: User can select exercise type per chapter (7 types + "Mixed")
 */

import { YStack, XStack, Text, H2, Card, Button, ScrollView, type ColorTokens } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import {
  ChevronLeft,
  BookOpen,
  MessageSquare,
  Trophy,
  PenLine,
  Link2,
  MessagesSquare,
  ArrowRightLeft,
  FileText,
  Shuffle,
} from '@tamagui/lucide-icons'

import { useChapter } from '../../hooks/useChapters'
import { useChapterProgress } from '../../hooks/useChapterProgress'
import { BOOKS } from '../../constants/books'
import type { ExerciseType } from '../../types/quiz'

/**
 * Exercise type card configuration.
 * Defines the visual appearance and metadata for each exercise type card.
 */
interface ExerciseTypeCardConfig {
  type: ExerciseType
  label: string
  subtitle: string
  icon: React.ReactNode
  iconBgColor: ColorTokens
  testID: string
}

/**
 * Build the list of exercise type card configs.
 * "Mixed" is first with distinct primary styling per UX spec (Story 3.5).
 */
const EXERCISE_TYPE_CARDS: ExerciseTypeCardConfig[] = [
  {
    type: 'mixed',
    label: 'Mixed',
    subtitle: 'AI picks exercises based on your weak areas',
    icon: <Shuffle size={24} color="$blue11" />,
    iconBgColor: '$blue4',
    testID: 'mixed-quiz-button',
  },
  {
    type: 'vocabulary',
    label: 'Vocabulary Quiz',
    subtitle: 'Practice characters, pinyin, and meanings',
    icon: <BookOpen size={24} color="$blue11" />,
    iconBgColor: '$blue4',
    testID: 'vocabulary-quiz-button',
  },
  {
    type: 'grammar',
    label: 'Grammar Quiz',
    subtitle: 'Practice sentence patterns and structure',
    icon: <MessageSquare size={24} color="$purple11" />,
    iconBgColor: '$purple4',
    testID: 'grammar-quiz-button',
  },
  {
    type: 'fill_in_blank',
    label: 'Fill-in-the-Blank',
    subtitle: 'Complete sentences with the right words',
    icon: <PenLine size={24} color="$orange11" />,
    iconBgColor: '$orange4',
    testID: 'fill-in-blank-quiz-button',
  },
  {
    type: 'matching',
    label: 'Matching',
    subtitle: 'Connect characters with pinyin or meanings',
    icon: <Link2 size={24} color="$green11" />,
    iconBgColor: '$green4',
    testID: 'matching-quiz-button',
  },
  {
    type: 'dialogue_completion',
    label: 'Dialogue Completion',
    subtitle: 'Complete conversation exchanges',
    icon: <MessagesSquare size={24} color="$pink11" />,
    iconBgColor: '$pink4',
    testID: 'dialogue-completion-quiz-button',
  },
  {
    type: 'sentence_construction',
    label: 'Sentence Construction',
    subtitle: 'Rearrange words into correct order',
    icon: <ArrowRightLeft size={24} color="$yellow11" />,
    iconBgColor: '$yellow4',
    testID: 'sentence-construction-quiz-button',
  },
  {
    type: 'reading_comprehension',
    label: 'Reading Comprehension',
    subtitle: 'Read passages and answer questions',
    icon: <FileText size={24} color="$red11" />,
    iconBgColor: '$red4',
    testID: 'reading-comprehension-quiz-button',
  },
]

export default function ChapterDetailScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()
  const router = useRouter()

  // Validate chapterId param - handle invalid/missing values
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : NaN
  const isValidChapterId = !Number.isNaN(chapterIdNum) && chapterIdNum > 0

  const chapter = isValidChapterId ? useChapter(chapterIdNum) : undefined
  const book = chapter ? BOOKS.find((b) => b.id === chapter.bookId) : null

  // Get progress for this specific chapter
  const { data: progressMap } = useChapterProgress(chapter?.bookId ?? 0)
  const progress = progressMap?.[chapterIdNum]
  const percentage = progress?.completionPercentage ?? 0
  const isMastered = percentage >= 80

  // Invalid chapterId or chapter not found state
  if (!isValidChapterId || !chapter) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Chapter',
            headerBackTitle: 'Chapters',
          }}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          testID="chapter-not-found"
        >
          <Text>Chapter not found</Text>
        </YStack>
      </>
    )
  }

  const handleStartQuiz = (exerciseType: ExerciseType) => {
    // Navigate to quiz loading screen with exercise type
    router.push({
      pathname: '/quiz/loading',
      params: {
        chapterId: chapterIdNum.toString(),
        bookId: chapter.bookId.toString(),
        quizType: exerciseType,
        exerciseType,
      },
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: `Chapter ${chapter.chapterNumber}`,
          headerBackTitle: 'Chapters',
          headerLeft: () => (
            <Button
              chromeless
              icon={<ChevronLeft size={24} />}
              onPress={() => router.back()}
              testID="back-button"
            />
          ),
        }}
      />

      <ScrollView flex={1} backgroundColor="$background">
        <YStack
          padding="$4"
          testID="chapter-detail-screen"
        >
          {/* Chapter Info */}
          <YStack gap="$2" marginBottom="$6">
            <Text fontSize="$2" color="$gray10" testID="book-info">
              {book?.title} - {book?.titleChinese}
            </Text>
            <H2 fontSize="$9" fontWeight="bold" testID="chapter-title-english">
              {chapter.titleEnglish}
            </H2>
            <Text fontSize="$7" color="$gray11" testID="chapter-title-chinese">
              {chapter.titleChinese}
            </Text>
          </YStack>

          {/* Progress Card (if any progress exists) */}
          {percentage > 0 && (
            <Card
              bordered
              padding="$4"
              marginBottom="$4"
              borderRadius="$4"
              testID="progress-card"
            >
              <XStack alignItems="center" gap="$3">
                {isMastered ? (
                  <>
                    <Trophy size={24} color="$green11" testID="mastered-badge" />
                    <YStack flex={1}>
                      <Text fontWeight="600" color="$green11">
                        Mastered
                      </Text>
                      <Text fontSize="$4" color="$gray11">
                        You've achieved 80%+ on this chapter
                      </Text>
                    </YStack>
                  </>
                ) : (
                  <>
                    <YStack flex={1}>
                      <Text fontWeight="500">Current Progress</Text>
                      <Text
                        fontSize="$4"
                        color="$gray11"
                        testID="progress-percentage"
                      >
                        {percentage}% complete
                      </Text>
                    </YStack>
                  </>
                )}
              </XStack>
            </Card>
          )}

          {/* Exercise Type Selection */}
          <YStack gap="$4">
            <Text
              fontSize="$5"
              fontWeight="500"
              marginBottom="$2"
              testID="quiz-section-label"
            >
              {isMastered ? 'Practice Again' : 'Start Learning'}
            </Text>

            {/* Exercise Type Cards */}
            {EXERCISE_TYPE_CARDS.map((cardConfig) => (
              <Card
                key={cardConfig.type}
                elevate
                bordered
                padding="$4"
                borderRadius="$4"
                pressStyle={{ scale: 0.98 }}
                onPress={() => handleStartQuiz(cardConfig.type)}
                animation="quick"
                testID={cardConfig.testID}
              >
                <XStack alignItems="center" gap="$3">
                  <YStack
                    width="$4.5"
                    height="$4.5"
                    backgroundColor={cardConfig.iconBgColor}
                    borderRadius="$3"
                    justifyContent="center"
                    alignItems="center"
                  >
                    {cardConfig.icon}
                  </YStack>
                  <YStack flex={1}>
                    <Text fontSize="$6" fontWeight="600">
                      {cardConfig.label}
                    </Text>
                    <Text fontSize="$4" color="$gray11">
                      {cardConfig.subtitle}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            ))}
          </YStack>

          {/* Helper Text for New Users */}
          {percentage === 0 && (
            <Text
              fontSize="$2"
              color="$gray10"
              marginTop="$6"
              textAlign="center"
              testID="new-user-helper-text"
            >
              Start with vocabulary to learn new words, or try grammar for
              sentence practice
            </Text>
          )}
        </YStack>
      </ScrollView>
    </>
  )
}
