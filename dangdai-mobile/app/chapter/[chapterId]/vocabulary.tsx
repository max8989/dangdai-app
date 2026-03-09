/**
 * Vocabulary Browse Screen
 *
 * Displays all vocabulary items for a chapter in a scrollable SectionList,
 * grouped by vocabulary section (Vocab I, Vocab II) with section headers.
 *
 * Route: /chapter/[chapterId]/vocabulary
 * chapterId convention: bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
 *
 * Story 11.5: Vocabulary Browse Screen — Tasks 1, 4
 */

import { SectionList } from 'react-native'
import { YStack, Text, H3, Button, Spinner } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { ChevronLeft, AlertCircle, RefreshCw } from '@tamagui/lucide-icons'

import { VocabularyItem } from '../../../components/chapter/VocabularyItem'
import { useVocabulary } from '../../../hooks/useVocabulary'
import type { VocabularyItem as VocabularyItemType, VocabularySection } from '../../../hooks/useVocabulary'

export default function VocabularyScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()
  const router = useRouter()

  // Parse chapterId into bookId and lessonId
  // Convention: chapterId = bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : NaN
  const isValidChapterId = !Number.isNaN(chapterIdNum) && chapterIdNum > 0
  const bookId = isValidChapterId ? Math.floor(chapterIdNum / 100) : 0
  const lessonId = isValidChapterId ? chapterIdNum % 100 : 0

  const { data: sections, isLoading, error, refetch } = useVocabulary(bookId, lessonId)

  // Total item count across all sections
  const totalCount = sections?.reduce((sum, section) => sum + section.data.length, 0) ?? 0

  // Invalid chapterId state
  if (!isValidChapterId) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Vocabulary',
            headerBackTitle: 'Back',
          }}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          testID="vocabulary-invalid-chapter"
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
          headerTitle: 'Vocabulary',
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

      <YStack flex={1} backgroundColor="$background" testID="vocabulary-screen">
        {/* Loading state */}
        {isLoading ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            testID="vocabulary-loading"
          >
            <Spinner size="large" />
            <Text marginTop="$3" color="$colorSubtle">
              Loading vocabulary...
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
            testID="vocabulary-error"
          >
            <AlertCircle size={48} color="$orange9" />
            <Text fontSize="$5" fontWeight="500" textAlign="center">
              Couldn't load vocabulary
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
        ) : sections && sections.length === 0 ? (
          /* Empty state */
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
            testID="vocabulary-empty"
          >
            <Text fontSize="$5" fontWeight="500" textAlign="center">
              No vocabulary found
            </Text>
            <Text fontSize="$4" color="$colorSubtle" textAlign="center" marginTop="$2">
              Vocabulary for this chapter hasn't been added yet
            </Text>
          </YStack>
        ) : (
          /* Vocabulary SectionList */
          <SectionList<VocabularyItemType, VocabularySection>
            sections={sections ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }} // $4 token ≈ 16px
            testID="vocabulary-section-list"
            renderSectionHeader={({ section }) => (
              <YStack
                paddingVertical="$2"
                paddingHorizontal="$1"
                marginTop="$3"
                marginBottom="$1"
                testID={`vocabulary-section-header-${section.key}`}
              >
                <H3 fontSize="$6" fontWeight="bold">
                  {section.title}
                </H3>
                {/* Item count per section */}
                <Text
                  fontSize="$3"
                  color="$colorSubtle"
                  testID={`vocabulary-section-count-${section.key}`}
                >
                  {section.data.length} {section.data.length === 1 ? 'word' : 'words'}
                </Text>
              </YStack>
            )}
            renderItem={({ item }) => (
              <VocabularyItem item={item} />
            )}
            ListHeaderComponent={
              <YStack paddingBottom="$2" testID="vocabulary-header">
                <Text fontSize="$4" color="$colorSubtle">
                  {totalCount} {totalCount === 1 ? 'word' : 'words'} total
                </Text>
              </YStack>
            }
          />
        )}
      </YStack>
    </>
  )
}
