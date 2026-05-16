import { useCallback, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAnswerValidation } from '@/hooks/useAnswerValidation'
import type { ValidationResult } from '@/hooks/useAnswerValidation'
import { useQuizStore } from '@/stores/useQuizStore'
import { cn } from '@/lib/utils'

export interface SentenceBuilderProps {
  questionText: string
  scrambledWords: string[]
  correctOrder: string[]
  correctAnswer: string
  explanation: string
  sourceCitation: string
  onAnswer: (isCorrect: boolean, userSentence: string) => void
  disabled?: boolean
  acceptableAnswerVariants?: string[]
}

type TileState = 'available' | 'placed' | 'correct' | 'incorrect'

const ANSWER_AREA_ID = 'sentence-builder-answer-area'
const WORD_BANK_ID = 'sentence-builder-word-bank'

function getTileFontSize(word: string): string {
  if (word.length <= 2) return 'text-2xl'
  if (word.length <= 4) return 'text-xl'
  return 'text-base'
}

function shuffleWords(words: string[], avoid?: string[]): string[] {
  if (words.length <= 1) return [...words]
  const shouldAvoid =
    avoid !== undefined && avoid.length === words.length
  const matchesAvoid = (arr: string[]): boolean =>
    shouldAvoid ? arr.every((w, i) => w === avoid![i]) : false

  let result = [...words]
  for (let attempt = 0; attempt < 10; attempt++) {
    const arr = [...words]
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    result = arr
    if (!matchesAvoid(result)) return result
  }
  return result
}

function computeTileFeedback(
  placedWords: string[],
  correctOrder: string[],
): Array<'correct' | 'incorrect'> {
  return placedWords.map((word, index) =>
    index < correctOrder.length && word === correctOrder[index] ? 'correct' : 'incorrect',
  )
}

const TILE_STATE_CLASSES: Record<TileState, string> = {
  available: 'bg-card border-border text-foreground hover:bg-accent',
  placed: 'bg-accent border-primary text-foreground hover:bg-accent/80',
  correct:
    'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-200',
  incorrect:
    'bg-red-50 dark:bg-red-950 border-red-500 text-red-700 dark:text-red-200',
}

interface TileButtonProps {
  word: string
  state: TileState
  fontSizeClass: string
  className?: string
  isDragging?: boolean
}

function TileButton({
  word,
  state,
  fontSizeClass,
  className,
  isDragging = false,
}: TileButtonProps) {
  return (
    <div
      className={cn(
        'rounded-lg border-2 px-3 py-2 min-h-12 min-w-12 inline-flex items-center justify-center transition-colors select-none whitespace-nowrap',
        TILE_STATE_CLASSES[state],
        isDragging && 'opacity-50',
        className,
      )}
    >
      <span className={cn('font-medium whitespace-nowrap', fontSizeClass)}>{word}</span>
    </div>
  )
}

interface DraggableTileProps {
  tileId: string
  word: string
  state: TileState
  onTap: (tileId: string) => void
  disabled: boolean
  ariaLabel: string
  ariaHint: string
  testId: string
}

function DraggableTile({
  tileId,
  word,
  state,
  onTap,
  disabled,
  ariaLabel,
  ariaHint,
  testId,
}: DraggableTileProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: tileId,
    disabled,
  })

  const fontSizeClass = getTileFontSize(word)

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => {
        if (!disabled) onTap(tileId)
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-description={ariaHint}
      data-testid={testId}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border-2 px-3 py-2 min-h-12 min-w-12 transition-colors select-none cursor-pointer touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        TILE_STATE_CLASSES[state],
        isDragging && 'opacity-50',
        !disabled && 'active:scale-95',
      )}
    >
      <span className={cn('font-medium', fontSizeClass)}>{word}</span>
    </button>
  )
}

interface SortableTileProps {
  tileId: string
  word: string
  state: TileState
  onTap: (tileId: string) => void
  disabled: boolean
  ariaLabel: string
  ariaHint: string
  testId: string
}

function SortableTile({
  tileId,
  word,
  state,
  onTap,
  disabled,
  ariaLabel,
  ariaHint,
  testId,
}: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tileId, disabled })

  const fontSizeClass = getTileFontSize(word)

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <button
      ref={setNodeRef}
      type="button"
      style={style}
      onClick={() => {
        if (!disabled) onTap(tileId)
      }}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-description={ariaHint}
      data-testid={testId}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-lg border-2 px-3 py-2 min-h-12 min-w-12 transition-colors select-none cursor-pointer touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        TILE_STATE_CLASSES[state],
        isDragging && 'opacity-50',
        !disabled && 'active:scale-95',
      )}
    >
      <span className={cn('font-medium', fontSizeClass)}>{word}</span>
    </button>
  )
}

interface DropZoneProps {
  id: string
  children: React.ReactNode
  className?: string
  testId?: string
  ariaLabel?: string
}

function DropZone({ id, children, className, testId, ariaLabel }: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      role="list"
      aria-label={ariaLabel}
      data-testid={testId}
      className={cn(className, isOver && 'ring-2 ring-primary ring-offset-2')}
    >
      {children}
    </div>
  )
}

export function SentenceBuilder({
  questionText,
  scrambledWords,
  correctOrder,
  correctAnswer,
  explanation,
  sourceCitation,
  onAnswer,
  disabled = false,
  acceptableAnswerVariants,
}: SentenceBuilderProps) {
  const placedTileIds = useQuizStore((s) => s.placedTileIds)
  const placeTile = useQuizStore((s) => s.placeTile)
  const removeTile = useQuizStore((s) => s.removeTile)
  const setPlacedTileIds = useQuizStore((s) => s.setPlacedTileIds)

  const { validate } = useAnswerValidation()

  const [isSubmitted, setIsSubmitted] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [tileFeedback, setTileFeedback] = useState<Array<'correct' | 'incorrect'>>([])
  const [activeTileId, setActiveTileId] = useState<string | null>(null)

  const isSubmittingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const displayWords = useMemo(
    () => shuffleWords(scrambledWords, correctOrder),
    [scrambledWords, correctOrder],
  )

  const allTileIds = displayWords.map((_, i) => `tile-${i}`)
  const placedTileSet = new Set(placedTileIds)
  const availableTileIds = allTileIds.filter((id) => !placedTileSet.has(id))
  const allTilesPlaced = placedTileIds.length === displayWords.length

  const tileWord = (tileId: string): string => {
    const index = parseInt(tileId.replace('tile-', ''), 10)
    return displayWords[index] ?? ''
  }

  const placedWords = placedTileIds.map(tileWord)
  const constructedSentence = placedWords.join('')

  const interactive = !isSubmitted && !disabled

  const handleAvailableTap = useCallback(
    (tileId: string) => {
      if (!interactive) return
      placeTile(tileId)
    },
    [interactive, placeTile],
  )

  const handlePlacedTap = useCallback(
    (tileId: string) => {
      if (!interactive) return
      removeTile(tileId)
    },
    [interactive, removeTile],
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTileId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTileId(null)
    if (!interactive) return
    const { active, over } = event
    if (!over) return
    const tileId = String(active.id)
    const overId = String(over.id)
    const isPlaced = placedTileSet.has(tileId)
    const overIsPlaced = placedTileSet.has(overId)

    if (isPlaced && overIsPlaced && tileId !== overId) {
      const fromIndex = placedTileIds.indexOf(tileId)
      const toIndex = placedTileIds.indexOf(overId)
      if (fromIndex !== -1 && toIndex !== -1) {
        setPlacedTileIds(arrayMove(placedTileIds, fromIndex, toIndex))
      }
      return
    }

    if (!isPlaced && overIsPlaced) {
      const insertAt = placedTileIds.indexOf(overId)
      if (insertAt !== -1) {
        const next = [...placedTileIds]
        next.splice(insertAt, 0, tileId)
        setPlacedTileIds(next)
      }
      return
    }

    if (overId === ANSWER_AREA_ID && !isPlaced) {
      placeTile(tileId)
    } else if (overId === WORD_BANK_ID && isPlaced) {
      removeTile(tileId)
    }
  }

  const handleDragCancel = () => {
    setActiveTileId(null)
  }

  const handleSubmit = () => {
    if (!allTilesPlaced || isSubmitted || isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitted(true)

    const result = validate({
      userAnswer: constructedSentence,
      correctAnswer,
      questionText,
      exerciseType: 'sentence_construction',
      preGeneratedExplanation: explanation,
      acceptableAnswerVariants,
    })

    setValidationResult(result)
    if (result.isAlternative) {
      setTileFeedback(placedWords.map(() => 'correct'))
    } else {
      setTileFeedback(computeTileFeedback(placedWords, correctOrder))
    }
    onAnswer(result.isCorrect, constructedSentence)
  }

  const activeWord = activeTileId !== null ? tileWord(activeTileId) : ''

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex flex-col gap-4" data-testid="sentence-builder">
        <p
          className="text-sm font-medium text-muted-foreground"
          data-testid="sentence-builder-question"
        >
          {questionText}
        </p>

        {!isSubmitted ? (
          <>
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Your Answer
              </p>
              <DropZone
                id={ANSWER_AREA_ID}
                testId="slot-area"
                ariaLabel="Answer area"
                className="min-h-16 rounded-lg border-2 border-dashed border-border p-2 flex flex-wrap items-center gap-2 transition-shadow"
              >
                {placedTileIds.length === 0 ? (
                  <span className="text-sm text-muted-foreground px-1">
                    Tap or drag words below to place them here
                  </span>
                ) : (
                  <SortableContext items={placedTileIds} strategy={rectSortingStrategy}>
                    {placedTileIds.map((tileId) => (
                      <SortableTile
                        key={`placed-${tileId}`}
                        tileId={tileId}
                        word={tileWord(tileId)}
                        state="placed"
                        onTap={handlePlacedTap}
                        disabled={!interactive}
                        ariaLabel={tileWord(tileId)}
                        ariaHint="Tap to return to word bank, or drag to reorder"
                        testId={`placed-tile-${tileId}`}
                      />
                    ))}
                  </SortableContext>
                )}
              </DropZone>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Word Bank
              </p>
              <DropZone
                id={WORD_BANK_ID}
                testId="word-bank"
                ariaLabel="Word bank"
                className="min-h-12 rounded-lg p-2 flex flex-wrap items-center gap-2"
              >
                {availableTileIds.length === 0 ? (
                  <span className="text-sm text-muted-foreground px-1">
                    All words placed
                  </span>
                ) : (
                  availableTileIds.map((tileId) => (
                    <DraggableTile
                      key={`available-${tileId}`}
                      tileId={tileId}
                      word={tileWord(tileId)}
                      state="available"
                      onTap={handleAvailableTap}
                      disabled={!interactive}
                      ariaLabel={tileWord(tileId)}
                      ariaHint="Tap to place in answer area, or drag"
                      testId={`available-tile-${tileId}`}
                    />
                  ))
                )}
              </DropZone>
            </div>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!allTilesPlaced}
              className="w-full"
              data-testid="submit-button"
            >
              Submit
            </Button>
          </>
        ) : (
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Your Answer
            </p>
            <div
              className="min-h-16 rounded-lg border-2 border-dashed border-border p-2 flex flex-wrap items-center gap-2"
              data-testid="slot-area"
            >
              {placedTileIds.map((tileId, index) => {
                const state = tileFeedback[index] ?? 'placed'
                const word = tileWord(tileId)
                return (
                  <TileButton
                    key={tileId}
                    word={word}
                    state={state}
                    fontSizeClass={getTileFontSize(word)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {isSubmitted && validationResult !== null && (
          <div className="space-y-2" data-testid="sentence-builder-feedback">
            {validationResult.isAlternative ? (
              <div className="rounded-md border border-emerald-500 bg-emerald-50 dark:bg-emerald-950 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <p className="text-base font-semibold text-emerald-700 dark:text-emerald-200">
                    Your answer is also valid!
                  </p>
                </div>
                {validationResult.alternatives && validationResult.alternatives.length > 0 && (
                  <div className="text-sm text-foreground">
                    <p className="font-medium">Other valid orderings:</p>
                    <ul className="list-disc pl-5">
                      {validationResult.alternatives.map((alt) => (
                        <li key={alt}>{alt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : validationResult.isCorrect ? (
              <div className="rounded-md border border-emerald-500 bg-emerald-50 dark:bg-emerald-950 p-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <p className="text-base font-semibold text-emerald-700 dark:text-emerald-200">
                  Correct!
                </p>
              </div>
            ) : (
              <div className="rounded-md border border-red-500 bg-red-50 dark:bg-red-950 p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <p className="text-base font-semibold text-red-700 dark:text-red-200">
                    Not quite
                  </p>
                </div>
                <p className="text-sm font-medium text-foreground">Correct sentence:</p>
                <p className="text-base text-foreground" data-testid="correct-sentence">
                  {correctAnswer}
                </p>
              </div>
            )}

            <div className="rounded-md bg-muted p-3 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Explanation
              </p>
              <p className="text-sm text-foreground">{validationResult.explanation}</p>
              {sourceCitation && (
                <p className="text-xs italic text-muted-foreground">{sourceCitation}</p>
              )}
            </div>
          </div>
        )}
      </div>

      <DragOverlay>
        {activeTileId !== null ? (
          <TileButton
            word={activeWord}
            state={placedTileSet.has(activeTileId) ? 'placed' : 'available'}
            fontSizeClass={getTileFontSize(activeWord)}
            className="cursor-grabbing shadow-lg"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
