/**
 * BookCardSkeleton Component
 *
 * Loading skeleton placeholder for BookCard component.
 * Displays a shimmer animation while book data is loading.
 * Per architecture spec, skeleton loading provides better UX than spinner.
 */

import { Card, XStack, YStack, Stack } from 'tamagui'

interface BookCardSkeletonProps {
  count?: number
}

/**
 * Single skeleton card that mimics the BookCard layout.
 */
function SingleSkeleton() {
  return (
    <Card
      elevate
      bordered
      padding="$4"
      borderRadius={12}
      animation="lazy"
      opacity={0.7}
    >
      <XStack gap="$4" alignItems="center">
        {/* Book Cover Skeleton */}
        <Stack
          width={60}
          height={80}
          backgroundColor="$gray6"
          borderRadius="$2"
          animation="lazy"
        />

        {/* Book Info Skeleton */}
        <YStack flex={1} gap="$2">
          {/* Title skeleton */}
          <Stack
            height={20}
            width="60%"
            backgroundColor="$gray6"
            borderRadius="$2"
            animation="lazy"
          />
          {/* Chinese title skeleton */}
          <Stack
            height={16}
            width="80%"
            backgroundColor="$gray5"
            borderRadius="$2"
            animation="lazy"
          />
          {/* Progress bar skeleton */}
          <XStack alignItems="center" gap="$2">
            <Stack
              flex={1}
              height={8}
              backgroundColor="$gray5"
              borderRadius="$1"
              animation="lazy"
            />
            <Stack
              width={40}
              height={14}
              backgroundColor="$gray5"
              borderRadius="$2"
              animation="lazy"
            />
          </XStack>
        </YStack>

        {/* Chevron skeleton */}
        <Stack
          width={24}
          height={24}
          backgroundColor="$gray5"
          borderRadius="$2"
          animation="lazy"
        />
      </XStack>
    </Card>
  )
}

/**
 * Renders multiple skeleton cards for loading state.
 * Default count is 4 (matching the number of books in the app).
 */
export function BookCardSkeleton({ count = 4 }: BookCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SingleSkeleton key={index} />
      ))}
    </>
  )
}
