import { ScrollView } from 'react-native'
import { H2, Paragraph, YStack, XStack, Card, Text, Button } from 'tamagui'
import { useRouter } from 'expo-router'
import { Pause, Play, Trash2, Trophy, BookOpen, Target, TrendingUp } from '@tamagui/lucide-icons'

import { APP_NAME } from '../../constants/app'
import { useAllPausedQuizzes } from '../../hooks/usePausedQuiz'
import { usePauseQuiz } from '../../hooks/usePauseQuiz'
import { useUserStats } from '../../hooks/useUserStats'
import { EXERCISE_TYPE_LABELS } from '../../types/quiz'
import type { ExerciseType } from '../../types/quiz'
import type { PausedQuiz } from '../../types/paused-quiz'

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

function getProgressPercent(quiz: PausedQuiz): number {
  const answered = Object.keys(quiz.quiz_state.answers).length
  const total = quiz.quiz_state.questions.length
  return total > 0 ? Math.round((answered / total) * 100) : 0
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <Card bordered padding="$3" borderRadius="$3" flex={1}>
      <YStack alignItems="center" gap="$1">
        {icon}
        <Text fontSize="$6" fontWeight="bold">{value}</Text>
        <Text fontSize="$1" color="$gray10" textAlign="center">{label}</Text>
      </YStack>
    </Card>
  )
}

export default function HomeScreen() {
  const router = useRouter()
  const { data: pausedQuizzes } = useAllPausedQuizzes()
  const { deletePausedQuiz } = usePauseQuiz()
  const { data: stats } = useUserStats()

  const handleResume = (quiz: PausedQuiz) => {
    router.push({
      pathname: '/quiz/loading',
      params: {
        chapterId: quiz.chapter_id.toString(),
        bookId: quiz.quiz_state.bookId.toString(),
        exerciseType: quiz.exercise_type,
        resumePaused: 'true',
      },
    })
  }

  const handleDiscard = async (quiz: PausedQuiz) => {
    try {
      await deletePausedQuiz({
        chapterId: quiz.chapter_id,
        exerciseType: quiz.exercise_type,
      })
    } catch (err) {
      console.warn('[HomeScreen] Failed to discard paused quiz:', err)
    }
  }

  const hasPausedQuizzes = pausedQuizzes && pausedQuizzes.length > 0

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <YStack flex={1} gap="$4" paddingHorizontal="$4" paddingTop="$6" backgroundColor="$background">
        <YStack alignItems="center" gap="$1">
          <H2>{APP_NAME}</H2>
          <Paragraph color="$colorSubtle">Learn Chinese through quizzes</Paragraph>
        </YStack>

        {/* Stats Section */}
        {stats && (stats.totalQuizzesCompleted > 0 || stats.masteredExercises > 0) && (
          <YStack gap="$2" testID="stats-section">
            <Text fontSize="$4" fontWeight="600" color="$gray11">Your Progress</Text>
            <XStack gap="$2">
              <StatCard
                icon={<BookOpen size={18} color="$blue10" />}
                value={stats.totalQuizzesCompleted}
                label="Quizzes Done"
              />
              <StatCard
                icon={<Target size={18} color="$green10" />}
                value={stats.totalQuestionsAnswered}
                label="Questions"
              />
            </XStack>
            <XStack gap="$2">
              <StatCard
                icon={<Trophy size={18} color="$orange10" />}
                value={stats.masteredExercises}
                label="Mastered"
              />
              <StatCard
                icon={<TrendingUp size={18} color="$purple10" />}
                value={stats.averageScore > 0 ? `${stats.averageScore}%` : '—'}
                label="Avg Score"
              />
            </XStack>
          </YStack>
        )}

        {/* Paused Quizzes Section */}
        {hasPausedQuizzes && (
          <YStack gap="$2" testID="paused-quizzes-section">
            <Text fontSize="$4" fontWeight="600" color="$gray11">
              Paused Quizzes ({pausedQuizzes.length})
            </Text>
            <YStack gap="$2">
              {pausedQuizzes.map((quiz) => {
                const percent = getProgressPercent(quiz)
                const answered = Object.keys(quiz.quiz_state.answers).length
                const total = quiz.quiz_state.questions.length

                return (
                  <Card
                    key={quiz.id}
                    bordered
                    padding="$3"
                    borderRadius="$3"
                    backgroundColor="$blue2"
                    borderColor="$blue6"
                    testID={`paused-quiz-card-${quiz.id}`}
                  >
                    <YStack gap="$2">
                      <XStack alignItems="center" gap="$2">
                        <Pause size={16} color="$blue10" />
                        <YStack flex={1}>
                          <Text fontSize="$4" fontWeight="600" color="$blue11">
                            {EXERCISE_TYPE_LABELS[quiz.exercise_type as ExerciseType] ?? quiz.exercise_type}
                          </Text>
                          <Text fontSize="$2" color="$blue9">
                            Book {quiz.quiz_state.bookId} · Ch. {quiz.chapter_id % 100} · {answered}/{total} questions · {percent}% · {formatTimeAgo(quiz.paused_at)}
                          </Text>
                        </YStack>
                      </XStack>

                      <XStack gap="$2">
                        <Button
                          flex={1}
                          size="$3"
                          theme="blue"
                          icon={<Play size={14} />}
                          onPress={() => handleResume(quiz)}
                          pressStyle={{ scale: 0.98 }}
                          animation="quick"
                          testID={`resume-button-${quiz.id}`}
                        >
                          Resume
                        </Button>
                        <Button
                          size="$3"
                          chromeless
                          icon={<Trash2 size={14} color="$gray9" />}
                          onPress={() => { void handleDiscard(quiz) }}
                          pressStyle={{ scale: 0.98 }}
                          animation="quick"
                          testID={`discard-button-${quiz.id}`}
                        >
                          Discard
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                )
              })}
            </YStack>
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
