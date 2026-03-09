/**
 * PointsCounter Component
 *
 * Animated count-up display for points earned at quiz completion.
 * Uses Reanimated useSharedValue + withTiming for the numeric interpolation
 * (the ONE place raw Reanimated is used — Tamagui can't interpolate numeric text).
 * Tamagui animation="bouncy" provides the satisfying end-bounce when count finishes.
 *
 * Design:
 * - Counts from 0 to target points over 1.5 seconds (withTiming)
 * - runOnJS bridges the UI-thread animated value to React state for text display
 * - When count finishes, bounceState flips to 'done', triggering Tamagui bouncy spring
 * - Sound tick: stubbed for Story 4.9 integration (useSound not yet required)
 *
 * Story 4.11: Quiz Results Screen — Task 2
 */

import { useState, useEffect, useRef } from 'react'
import { useSharedValue, withTiming, runOnJS, useDerivedValue } from 'react-native-reanimated'
import { styled, XStack, Text } from 'tamagui'

// ─── Styled container ────────────────────────────────────────────────────────

const PointsCounterContainer = styled(XStack, {
  animation: 'bouncy',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '$2',

  variants: {
    size: {
      inline: { paddingHorizontal: '$2', paddingVertical: '$1' },
      celebration: { paddingHorizontal: '$4', paddingVertical: '$3' },
    },
    bounceState: {
      counting: {},
      done: { scale: 1.1 }, // Triggers bouncy spring overshoot
    },
  } as const,

  defaultVariants: {
    size: 'celebration',
    bounceState: 'counting',
  },
})

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PointsCounterProps {
  /** Target points to count up to */
  points: number
  /** Display size variant */
  size?: 'inline' | 'celebration'
  /** testID for testing */
  testID?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * PointsCounter — animated count-up from 0 to target points.
 *
 * The count-up uses Reanimated withTiming (runs on UI thread).
 * runOnJS bridges the animated value to React state for text rendering.
 * End-bounce uses Tamagui animation="bouncy" declarative spring.
 */
export function PointsCounter({ points, size = 'celebration', testID }: PointsCounterProps) {
  // useSharedValue returns a stable mutable ref object (value is mutated, not replaced).
  // Storing it in a useRef makes that stability explicit and avoids any risk of
  // stale closure if the component ever re-renders before the animation completes.
  const animatedValue = useSharedValue(0)
  const animatedValueRef = useRef(animatedValue)
  const [displayValue, setDisplayValue] = useState(0)
  const [isDone, setIsDone] = useState(false)
  // TODO: Story 4.9 — uncomment when useSound is available
  // const { playTick } = useSound()

  // Bridge animated value → React state for text display.
  // runOnJS is required because state updates must happen on the JS thread.
  useDerivedValue(() => {
    const rounded = Math.round(animatedValue.value)
    runOnJS(setDisplayValue)(rounded)
    // TODO: Story 4.9 — throttled tick sound: runOnJS(playTick)() every ~10 points
  })

  // Start the count-up animation on mount (or when points changes).
  // withTiming runs on the UI thread — no setInterval needed.
  // animatedValueRef.current is used to avoid capturing a potentially stale
  // animatedValue reference in the closure (the ref is stable across re-renders).
  useEffect(() => {
    animatedValueRef.current.value = withTiming(points, { duration: 1500 }, (finished) => {
      if (finished) {
        // Flip bounceState → 'done' to trigger Tamagui bouncy spring scale: 1.1
        runOnJS(setIsDone)(true)
      }
    })
  }, [points])

  return (
    <PointsCounterContainer
      size={size}
      bounceState={isDone ? 'done' : 'counting'}
      testID={testID}
    >
      <Text
        fontSize={size === 'celebration' ? '$9' : '$6'}
        fontWeight="bold"
        color="$secondary"
        testID={testID ? `${testID}-value` : 'points-value'}
      >
        +{displayValue}
      </Text>
      <Text
        fontSize={size === 'celebration' ? '$6' : '$4'}
        color="$colorSubtle"
        testID={testID ? `${testID}-label` : 'points-label'}
      >
        points
      </Text>
    </PointsCounterContainer>
  )
}
