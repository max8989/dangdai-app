import { H2, Paragraph, YStack, XStack, Card, Text, Button } from 'tamagui'
import { useRouter } from 'expo-router'
import { Pause, Play } from '@tamagui/lucide-icons'

import { APP_NAME } from '../../constants/app'
import { useAllPausedQuizzes } from '../../hooks/usePausedQuiz'
import { usePauseQuiz } from '../../hooks/usePauseQuiz'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType } from '../../types/quiz'

/**
 * Format a timestamp as a human-readable "X hours/minutes ago" string.
 */
function formatTimeAgo(isoTimestamp: string): string {
  const now = Date.now()
  const then = new Date(isoTimestamp).getTime()
  const diffMs = now - then

  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMinutes < 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export default function HomeScreen() {
  const router = useRouter()
  const { data: pausedQuizzes } = useAllPausedQuizzes()
  const { deletePausedQuiz } = usePauseQuiz()

  // Show the most recent paused quiz as a continue card
  const latestPaused = pausedQuizzes?.[0]

  const handleResumePaused = () => {
    if (!latestPaused) return
    router.push({
      pathname: '/quiz/loading',
      params: {
        chapterId: latestPaused.chapter_id.toString(),
        bookId: latestPaused.quiz_state.bookId.toString(),
        exerciseType: latestPaused.exercise_type,
        resumePaused: 'true',
      },
    })
  }

  const handleDiscardPaused = async () => {
    if (!latestPaused) return
    try {
      await deletePausedQuiz({
        chapterId: latestPaused.chapter_id,
        exerciseType: latestPaused.exercise_type,
      })
    } catch (err) {
      console.warn('[HomeScreen] Failed to discard paused quiz:', err)
    }
  }

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" paddingHorizontal="$4" backgroundColor="$background">
      <H2>{APP_NAME}</H2>
      <Paragraph color="$colorSubtle">Learn Chinese through quizzes</Paragraph>

      {/* Story 4.10b: Paused Quiz Continue Card */}
      {latestPaused && (
        <Card
          bordered
          padding="$4"
          width="100%"
          borderRadius="$4"
          backgroundColor="$blue2"
          borderColor="$blue6"
          testID="paused-quiz-continue-card"
        >
          <YStack gap="$3">
            <XStack alignItems="center" gap="$2">
              <Pause size={20} color="$blue10" />
              <YStack flex={1}>
                <Text fontSize="$5" fontWeight="600" color="$blue11" testID="continue-card-title">
                  Resume {EXERCISE_TYPE_LABELS[latestPaused.exercise_type as ExerciseType] ?? latestPaused.exercise_type}
                </Text>
                <Text fontSize="$3" color="$blue9" testID="continue-card-subtitle">
                  Chapter {latestPaused.chapter_id % 100} •{' '}
                  {Object.keys(latestPaused.quiz_state.answers).length}/{latestPaused.quiz_state.questions.length} questions •{' '}
                  {formatTimeAgo(latestPaused.paused_at)}
                </Text>
              </YStack>
            </XStack>

            <XStack gap="$3">
              <Button
                flex={1}
                size="$4"
                theme="blue"
                icon={<Play size={16} />}
                onPress={handleResumePaused}
                pressStyle={{ scale: 0.98 }}
                animation="quick"
                testID="continue-card-resume-button"
              >
                Resume
              </Button>
              <Button
                size="$4"
                chromeless
                onPress={() => { void handleDiscardPaused() }}
                pressStyle={{ scale: 0.98 }}
                animation="quick"
                testID="continue-card-discard-button"
              >
                Discard
              </Button>
            </XStack>
          </YStack>
        </Card>
      )}
    </YStack>
  )
}
