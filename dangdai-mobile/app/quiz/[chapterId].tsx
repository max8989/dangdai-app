/**
 * Chapter Detail Screen
 *
 * Displays chapter information and quiz type selection.
 * Users can choose between vocabulary and grammar quizzes.
 *
 * Open Navigation: No gates, no locks, no prerequisites.
 * Any user can access any chapter regardless of completion status.
 *
 * Story 3.4: Open Chapter Navigation (No Gates)
 */

import { YStack, XStack, Text, H2, Card, Button } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { ChevronLeft, BookOpen, MessageSquare, Trophy } from '@tamagui/lucide-icons'

import { useChapter } from '../../hooks/useChapters'
import { useChapterProgress } from '../../hooks/useChapterProgress'
import { BOOKS } from '../../constants/books'

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

  const handleStartQuiz = (quizType: 'vocabulary' | 'grammar') => {
    // Navigate to quiz loading screen with exercise type
    router.push({
      pathname: '/quiz/loading',
      params: {
        chapterId: chapterIdNum.toString(),
        bookId: chapter.bookId.toString(),
        quizType,
        exerciseType: quizType,
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

      <YStack
        flex={1}
        backgroundColor="$background"
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

        {/* Quiz Type Selection */}
        <YStack gap="$4">
          <Text
            fontSize="$5"
            fontWeight="500"
            marginBottom="$2"
            testID="quiz-section-label"
          >
            {isMastered ? 'Practice Again' : 'Start Learning'}
          </Text>

          {/* Vocabulary Quiz Button */}
          <Card
            elevate
            bordered
            padding="$4"
            borderRadius="$4"
            pressStyle={{ scale: 0.98 }}
            onPress={() => handleStartQuiz('vocabulary')}
            animation="quick"
            testID="vocabulary-quiz-button"
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                width="$4.5"
                height="$4.5"
                backgroundColor="$blue4"
                borderRadius="$3"
                justifyContent="center"
                alignItems="center"
              >
                <BookOpen size={24} color="$blue11" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize="$6" fontWeight="600">
                  Vocabulary Quiz
                </Text>
                <Text fontSize="$4" color="$gray11">
                  Practice characters, pinyin, and meanings
                </Text>
              </YStack>
            </XStack>
          </Card>

          {/* Grammar Quiz Button */}
          <Card
            elevate
            bordered
            padding="$4"
            borderRadius="$4"
            pressStyle={{ scale: 0.98 }}
            onPress={() => handleStartQuiz('grammar')}
            animation="quick"
            testID="grammar-quiz-button"
          >
            <XStack alignItems="center" gap="$3">
              <YStack
                width="$4.5"
                height="$4.5"
                backgroundColor="$purple4"
                borderRadius="$3"
                justifyContent="center"
                alignItems="center"
              >
                <MessageSquare size={24} color="$purple11" />
              </YStack>
              <YStack flex={1}>
                <Text fontSize="$6" fontWeight="600">
                  Grammar Quiz
                </Text>
                <Text fontSize="$4" color="$gray11">
                  Practice sentence patterns and structure
                </Text>
              </YStack>
            </XStack>
          </Card>
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
    </>
  )
}
