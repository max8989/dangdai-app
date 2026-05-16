import { Pause, X, BookOpen } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export interface ExitConfirmationModalProps {
  open: boolean
  onStay: () => void
  onPause: () => void
  onCancel: () => void
  isPausing?: boolean
}

export function ExitConfirmationModal({
  open,
  onStay,
  onPause,
  onCancel,
  isPausing = false,
}: ExitConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onStay() }}>
      <DialogContent className="max-w-sm" data-testid="exit-confirmation-modal">
        <DialogHeader>
          <DialogTitle data-testid="exit-modal-title">What would you like to do?</DialogTitle>
          <DialogDescription data-testid="exit-modal-description">
            You have answered some questions. Save your progress to resume later.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-2">
          <Button
            size="lg"
            onClick={onPause}
            disabled={isPausing}
            data-testid="pause-quiz-button"
          >
            <Pause className="h-4 w-4 mr-2" />
            {isPausing ? 'Saving...' : 'Pause Quiz'}
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={onCancel}
            disabled={isPausing}
            data-testid="cancel-quiz-button"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel Quiz
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={onStay}
            disabled={isPausing}
            data-testid="stay-button"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Stay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
