/**
 * ChapterListSkeleton Component
 *
 * Displays skeleton loading state for chapter list items.
 * Matches the ChapterListItem layout for smooth transition when data loads.
 *
 * Story 3.3: Chapter Completion Status Display (AC #4)
 */

import { Card, XStack, YStack, Circle } from 'tamagui'

interface ChapterListSkeletonProps {
  count?: number
}

export function ChapterListSkeleton({ count = 5 }: ChapterListSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card
          key={index}
          bordered
          padding="$3"
          borderRadius="$3"
          opacity={0.5}
          testID={`chapter-skeleton-${index}`}
        >
          <XStack gap="$3" alignItems="center">
            {/* Badge Skeleton */}
            <Circle
              size={44}
              backgroundColor="$gray4"
              testID={`skeleton-badge-${index}`}
            />

            {/* Content Skeleton */}
            <YStack flex={1} gap="$2">
              <YStack
                height={16}
                width="60%"
                backgroundColor="$gray4"
                borderRadius="$2"
                testID={`skeleton-title-${index}`}
              />
              <YStack
                height={14}
                width="40%"
                backgroundColor="$gray4"
                borderRadius="$2"
                testID={`skeleton-subtitle-${index}`}
              />
            </YStack>
          </XStack>
        </Card>
      ))}
    </>
  )
}
