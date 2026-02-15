/**
 * ChapterListSkeleton Component Tests
 *
 * Tests for the skeleton loading state component.
 */

import React from 'react'
import { render } from '@testing-library/react-native'

// Mock Tamagui components
jest.mock('tamagui', () => {
  const { View } = require('react-native')

  return {
    Card: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    XStack: ({ children }: any) => <View>{children}</View>,
    YStack: ({ children, testID }: any) => <View testID={testID}>{children}</View>,
    Circle: ({ testID }: any) => <View testID={testID} />,
  }
})

import { ChapterListSkeleton } from './ChapterListSkeleton'

describe('ChapterListSkeleton', () => {
  describe('rendering', () => {
    it('renders default count of 5 skeleton items', () => {
      const { getAllByTestId } = render(<ChapterListSkeleton />)

      const skeletons = getAllByTestId(/chapter-skeleton-/)
      expect(skeletons).toHaveLength(5)
    })

    it('renders specified count of skeleton items', () => {
      const { getAllByTestId } = render(<ChapterListSkeleton count={10} />)

      const skeletons = getAllByTestId(/chapter-skeleton-/)
      expect(skeletons).toHaveLength(10)
    })

    it('renders 0 items when count is 0', () => {
      const { queryAllByTestId } = render(<ChapterListSkeleton count={0} />)

      const skeletons = queryAllByTestId(/chapter-skeleton-/)
      expect(skeletons).toHaveLength(0)
    })
  })

  describe('skeleton structure', () => {
    it('renders badge skeleton for each item', () => {
      const { getAllByTestId } = render(<ChapterListSkeleton count={3} />)

      const badges = getAllByTestId(/skeleton-badge-/)
      expect(badges).toHaveLength(3)
    })

    it('renders title skeleton for each item', () => {
      const { getAllByTestId } = render(<ChapterListSkeleton count={3} />)

      const titles = getAllByTestId(/skeleton-title-/)
      expect(titles).toHaveLength(3)
    })

    it('renders subtitle skeleton for each item', () => {
      const { getAllByTestId } = render(<ChapterListSkeleton count={3} />)

      const subtitles = getAllByTestId(/skeleton-subtitle-/)
      expect(subtitles).toHaveLength(3)
    })
  })
})
