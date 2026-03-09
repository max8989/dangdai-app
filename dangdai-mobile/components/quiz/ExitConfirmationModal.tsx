/**
 * ExitConfirmationModal Component
 *
 * Modal dialog shown when the user attempts to navigate away from an active quiz.
 * Presents three options:
 *   - "Stay" — dismiss modal, continue quiz
 *   - "Pause Quiz" — save progress to Supabase, navigate back
 *   - "Cancel Quiz" — discard progress, navigate back
 *
 * Uses Tamagui Dialog with AnimatePresence for smooth enter/exit animations.
 *
 * Story 4.10b: Quiz Pause/Resume — Task 6
 */

import { AnimatePresence } from 'tamagui'
import { Dialog, YStack, XStack, Text, Button, Unspaced } from 'tamagui'
import { Pause, X, BookOpen } from '@tamagui/lucide-icons'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExitConfirmationModalProps {
  /** Whether the modal is visible */
  open: boolean
  /** Called when user taps "Stay" — dismisses modal, continues quiz */
  onStay: () => void
  /** Called when user taps "Pause Quiz" — saves progress and navigates back */
  onPause: () => void
  /** Called when user taps "Cancel Quiz" — discards progress and navigates back */
  onCancel: () => void
  /** Whether the pause action is currently loading */
  isPausing?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ExitConfirmationModal — shown when user tries to leave an active quiz.
 *
 * Three-button layout:
 * - "Stay" (ghost/chromeless, low emphasis)
 * - "Pause Quiz" (primary theme, high emphasis)
 * - "Cancel Quiz" (error/destructive theme)
 */
export function ExitConfirmationModal({
  open,
  onStay,
  onPause,
  onCancel,
  isPausing = false,
}: ExitConfirmationModalProps) {
  return (
    <Dialog modal open={open} onOpenChange={(isOpen) => { if (!isOpen) onStay() }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal>
            <Dialog.Overlay
              key="overlay"
              animation="quick"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
              opacity={0.5}
              backgroundColor="$shadowColor"
            />

            <Dialog.Content
              key="content"
              animation="medium"
              enterStyle={{ opacity: 0, scale: 0.9 }}
              exitStyle={{ opacity: 0, scale: 0.9 }}
              elevate
              bordered
              padding="$5"
              gap="$4"
              maxWidth={360}
              width="90%"
              testID="exit-confirmation-modal"
            >
              {/* Title */}
              <Dialog.Title>
                <Text fontSize="$6" fontWeight="700" color="$color" testID="exit-modal-title">
                  What would you like to do?
                </Text>
              </Dialog.Title>

              {/* Description */}
              <Dialog.Description>
                <Text fontSize="$4" color="$colorSubtle" testID="exit-modal-description">
                  You have answered some questions. Save your progress to resume later.
                </Text>
              </Dialog.Description>

              {/* Action buttons */}
              <YStack gap="$3">
                {/* Pause Quiz — primary action */}
                <Button
                  size="$5"
                  theme="primary"
                  icon={<Pause size={18} />}
                  onPress={onPause}
                  disabled={isPausing}
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                  testID="pause-quiz-button"
                >
                  {isPausing ? 'Saving...' : 'Pause Quiz'}
                </Button>

                {/* Cancel Quiz — destructive action */}
                <Button
                  size="$5"
                  theme="red"
                  icon={<X size={18} />}
                  onPress={onCancel}
                  disabled={isPausing}
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                  testID="cancel-quiz-button"
                >
                  Cancel Quiz
                </Button>

                {/* Stay — low emphasis */}
                <Button
                  size="$5"
                  chromeless
                  icon={<BookOpen size={18} />}
                  onPress={onStay}
                  disabled={isPausing}
                  pressStyle={{ scale: 0.98 }}
                  animation="quick"
                  testID="stay-button"
                >
                  Stay
                </Button>
              </YStack>

              {/* Close button (X) in top-right corner */}
              <Unspaced>
                <Dialog.Close asChild>
                  <Button
                    position="absolute"
                    top="$3"
                    right="$3"
                    size="$2"
                    circular
                    chromeless
                    icon={<X size={16} />}
                    onPress={onStay}
                    testID="exit-modal-close-button"
                  />
                </Dialog.Close>
              </Unspaced>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog>
  )
}
