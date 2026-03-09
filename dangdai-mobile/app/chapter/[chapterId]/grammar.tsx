/**
 * Grammar Points Browse Screen
 *
 * Displays all grammar points for a chapter in a scrollable FlatList,
 * ordered by grammar_order (original textbook order).
 *
 * Route: /chapter/[chapterId]/grammar
 * chapterId convention: bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
 *
 * Story 11.6: Grammar Points Browse Screen — Tasks 1, 4
 */

import { FlatList } from 'react-native'
import { YStack, Text, Button, Spinner } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { ChevronLeft, AlertCircle, RefreshCw } from '@tamagui/lucide-icons'

import { GrammarPointCard } from '../../../components/chapter/GrammarPointCard'
import { useGrammarPoints } from '../../../hooks/useGrammarPoints'
import type { GrammarPoint } from '../../../hooks/useGrammarPoints'

export default function GrammarScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()
  const router = useRouter()

  // Parse chapterId into bookId and lessonId
  // Convention: chapterId = bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : NaN
  const isValidChapterId = !Number.isNaN(chapterIdNum) && chapterIdNum > 0
  const bookId = isValidChapterId ? Math.floor(chapterIdNum / 100) : 0
  const lessonId = isValidChapterId ? chapterIdNum % 100 : 0

  const { data: grammarPoints, isLoading, error, refetch } = useGrammarPoints(bookId, lessonId)

  // Invalid chapterId state
  if (!isValidChapterId) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Grammar Points',
            headerBackTitle: 'Back',
          }}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          testID="grammar-invalid-chapter"
        >
          <Text>Invalid chapter ID</Text>
        </YStack>
      </>
    )
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Grammar Points',
          headerBackTitle: 'Back',
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

      <YStack flex={1} backgroundColor="$background" testID="grammar-screen">
        {/* Loading state */}
        {isLoading ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            testID="grammar-loading"
          >
            <Spinner size="large" />
            <Text marginTop="$3" color="$colorSubtle">
              Loading grammar points...
            </Text>
          </YStack>
        ) : error ? (
          /* Error state */
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
            gap="$3"
            testID="grammar-error"
          >
            <AlertCircle size={48} color="$orange9" />
            <Text fontSize="$5" fontWeight="500" textAlign="center">
              Couldn't load grammar points
            </Text>
            <Text fontSize="$4" color="$colorSubtle" textAlign="center">
              Check your connection and try again
            </Text>
            <Button
              size="$3"
              icon={RefreshCw}
              onPress={() => refetch()}
              testID="retry-button"
            >
              Try Again
            </Button>
          </YStack>
        ) : grammarPoints && grammarPoints.length === 0 ? (
          /* Empty state */
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
            testID="grammar-empty"
          >
            <Text fontSize="$5" fontWeight="500" textAlign="center">
              No grammar points found
            </Text>
            <Text fontSize="$4" color="$colorSubtle" textAlign="center" marginTop="$2">
              Grammar points for this chapter haven't been added yet
            </Text>
          </YStack>
        ) : (
          /* Grammar Points FlatList */
          <FlatList<GrammarPoint>
            data={grammarPoints ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }} // $4 token ≈ 16px
            testID="grammar-flat-list"
            ListHeaderComponent={
              <YStack paddingBottom="$2" testID="grammar-header">
                <Text fontSize="$4" color="$colorSubtle">
                  {grammarPoints?.length ?? 0}{' '}
                  {grammarPoints?.length === 1 ? 'grammar point' : 'grammar points'}
                </Text>
              </YStack>
            }
            renderItem={({ item }) => <GrammarPointCard item={item} />}
          />
        )}
      </YStack>
    </>
  )
}
