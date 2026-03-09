/**
 * Dialogue Browse Screen
 *
 * Displays all dialogues for a chapter in a scrollable view.
 * Each dialogue is shown as a numbered section (Dialogue I, Dialogue II)
 * with chat-bubble layout for each speaker turn.
 *
 * Toggle controls at the top allow showing/hiding pinyin, English, and
 * simplified Chinese across all lines simultaneously.
 *
 * Route: /chapter/[chapterId]/dialogues
 * chapterId convention: bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
 *
 * Story 11.7: Dialogue Browse Screen — Tasks 1, 4
 */

import { useState } from 'react'
import { ScrollView } from 'react-native'
import { YStack, XStack, Text, H3, Button, Spinner } from 'tamagui'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { ChevronLeft, AlertCircle, RefreshCw } from '@tamagui/lucide-icons'

import { DialogueBubble } from '../../../components/chapter/DialogueBubble'
import { useDialogues } from '../../../hooks/useDialogues'
import type { Dialogue } from '../../../hooks/useDialogues'

// ─── Roman numeral helper ─────────────────────────────────────────────────────

/** Converts a dialogue_number (1-based) to a Roman numeral label */
const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

function toRomanNumeral(n: number): string {
  return ROMAN_NUMERALS[n - 1] ?? String(n)
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DialoguesScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>()
  const router = useRouter()

  // Parse chapterId into bookId and lessonId
  // Convention: chapterId = bookId * 100 + lessonNumber (e.g., 212 = Book 2, Lesson 12)
  const chapterIdNum = chapterId ? parseInt(chapterId, 10) : NaN
  const isValidChapterId = !Number.isNaN(chapterIdNum) && chapterIdNum > 0
  const bookId = isValidChapterId ? Math.floor(chapterIdNum / 100) : 0
  const lessonId = isValidChapterId ? chapterIdNum % 100 : 0

  // Toggle state — per-screen, not persisted
  // Default: traditional only visible (all toggles OFF per story spec)
  const [showPinyin, setShowPinyin] = useState(false)
  const [showEnglish, setShowEnglish] = useState(false)
  const [showSimplified, setShowSimplified] = useState(false)

  const { data: dialogues, isLoading, error, refetch } = useDialogues(bookId, lessonId)

  // Invalid chapterId state
  if (!isValidChapterId) {
    return (
      <>
        <Stack.Screen
          options={{
            title: 'Dialogues',
            headerBackTitle: 'Back',
          }}
        />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          backgroundColor="$background"
          testID="dialogues-invalid-chapter"
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
          headerTitle: 'Dialogues',
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

      <YStack flex={1} backgroundColor="$background" testID="dialogues-screen">
        {/* Loading state */}
        {isLoading ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            testID="dialogues-loading"
          >
            <Spinner size="large" />
            <Text marginTop="$3" color="$colorSubtle">
              Loading dialogues...
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
            testID="dialogues-error"
          >
            <AlertCircle size={48} color="$orange9" />
            <Text fontSize="$5" fontWeight="500" textAlign="center">
              Couldn't load dialogues
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
        ) : dialogues && dialogues.length === 0 ? (
          /* Empty state */
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$4"
            testID="dialogues-empty"
          >
            <Text fontSize="$5" fontWeight="500" textAlign="center">
              No dialogues found
            </Text>
            <Text fontSize="$4" color="$colorSubtle" textAlign="center" marginTop="$2">
              Dialogues for this chapter haven't been added yet
            </Text>
          </YStack>
        ) : (
          /* Dialogues content */
          <YStack flex={1}>
            {/* Toggle controls — pinyin, English, simplified */}
            <XStack
              gap="$2"
              paddingVertical="$2"
              paddingHorizontal="$4"
              justifyContent="center"
              borderBottomWidth={1}
              borderBottomColor="$borderColor"
              testID="toggle-controls"
            >
              <Button
                size="$2"
                variant={showPinyin ? 'outlined' : undefined}
                backgroundColor={showPinyin ? '$backgroundHover' : undefined}
                onPress={() => setShowPinyin(!showPinyin)}
                testID="toggle-pinyin"
              >
                Pinyin
              </Button>
              <Button
                size="$2"
                variant={showEnglish ? 'outlined' : undefined}
                backgroundColor={showEnglish ? '$backgroundHover' : undefined}
                onPress={() => setShowEnglish(!showEnglish)}
                testID="toggle-english"
              >
                English
              </Button>
              <Button
                size="$2"
                variant={showSimplified ? 'outlined' : undefined}
                backgroundColor={showSimplified ? '$backgroundHover' : undefined}
                onPress={() => setShowSimplified(!showSimplified)}
                testID="toggle-simplified"
              >
                Simplified
              </Button>
            </XStack>

            {/* Scrollable dialogue sections */}
            <ScrollView
              contentContainerStyle={{ padding: 16 }} // $4 token ≈ 16px
              testID="dialogues-scroll-view"
            >
              {(dialogues ?? []).map((dialogue: Dialogue) => (
                <YStack
                  key={dialogue.id}
                  marginBottom="$6"
                  testID={`dialogue-section-${dialogue.dialogue_number}`}
                >
                  {/* Section header: "Dialogue I", "Dialogue II", etc. */}
                  <YStack
                    paddingVertical="$2"
                    paddingHorizontal="$1"
                    marginBottom="$2"
                    testID={`dialogue-header-${dialogue.dialogue_number}`}
                  >
                    <H3
                      fontSize="$6"
                      fontWeight="bold"
                      testID={`dialogue-numeral-${dialogue.dialogue_number}`}
                    >
                      Dialogue {toRomanNumeral(dialogue.dialogue_number)}
                    </H3>
                    {/* Optional dialogue title */}
                    {dialogue.title_english ? (
                      <Text
                        fontSize="$3"
                        color="$colorSubtle"
                        testID={`dialogue-title-${dialogue.dialogue_number}`}
                      >
                        {dialogue.title_english}
                      </Text>
                    ) : null}
                  </YStack>

                  {/* Dialogue lines as chat bubbles */}
                  {dialogue.lines.map((line, lineIndex) => (
                    <DialogueBubble
                      key={lineIndex}
                      line={line}
                      showPinyin={showPinyin}
                      showEnglish={showEnglish}
                      showSimplified={showSimplified}
                      // Alternate alignment: even indices left, odd indices right
                      isAlternate={lineIndex % 2 !== 0}
                      testID={`dialogue-bubble-${dialogue.dialogue_number}-${lineIndex}`}
                    />
                  ))}
                </YStack>
              ))}
            </ScrollView>
          </YStack>
        )}
      </YStack>
    </>
  )
}
