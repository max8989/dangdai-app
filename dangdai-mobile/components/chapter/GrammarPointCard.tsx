/**
 * GrammarPointCard Component
 *
 * Displays a single grammar point as a card with:
 * - Title: English (bold) + Chinese subtitle
 * - Function description in a highlighted section
 * - Structure pattern in a monospace block
 * - Usage notes as body text
 * - Examples list: traditional (large), pinyin (medium), English (small/subtle)
 *
 * All nullable fields (title_chinese, function_description, structure_pattern,
 * usage_notes) are guarded before rendering. Examples are only rendered when
 * the array is non-empty.
 *
 * Design follows VocabularyItem patterns:
 * - Tamagui Card with Tamagui theme tokens only (no hardcoded colors)
 * - accessibilityRole and accessibilityLabel for screen readers
 *
 * Story 11.6: Grammar Points Browse Screen — Task 3
 */

import { Card, YStack, Text } from 'tamagui'

import type { GrammarPoint } from '../../hooks/useGrammarPoints'

interface GrammarPointCardProps {
  item: GrammarPoint
}

/**
 * Renders a grammar point card with title, function, structure, usage, and examples.
 * All optional fields are guarded against null/undefined before rendering.
 */
export function GrammarPointCard({ item }: GrammarPointCardProps) {
  const {
    id,
    title_english,
    title_chinese,
    function_description,
    structure_pattern,
    usage_notes,
    examples,
  } = item

  // Build a descriptive accessibility label for screen readers
  const chineseLabel = title_chinese ? `, ${title_chinese}` : ''
  const a11yLabel = `Grammar point: ${title_english}${chineseLabel}`

  return (
    <Card
      elevate
      bordered
      padding="$4"
      marginVertical="$2"
      borderRadius="$3"
      testID={`grammar-point-card-${id}`}
      accessibilityRole="text"
      accessibilityLabel={a11yLabel}
    >
      {/* Title: English (bold) + Chinese subtitle */}
      <YStack gap="$1" marginBottom="$3" testID={`grammar-point-title-${id}`}>
        <Text
          fontSize="$5"
          fontWeight="bold"
          testID={`grammar-point-title-english-${id}`}
        >
          {title_english}
        </Text>
        {title_chinese ? (
          <Text
            fontSize="$4"
            color="$colorSubtle"
            testID={`grammar-point-title-chinese-${id}`}
          >
            {title_chinese}
          </Text>
        ) : null}
      </YStack>

      {/* Function description in a highlighted section */}
      {function_description ? (
        <YStack
          backgroundColor="$backgroundHover"
          padding="$3"
          borderRadius="$3"
          marginBottom="$2"
          testID={`grammar-point-function-${id}`}
        >
          <Text fontSize="$2" fontWeight="600" marginBottom="$1">
            Function
          </Text>
          <Text fontSize="$3" testID={`grammar-point-function-text-${id}`}>
            {function_description}
          </Text>
        </YStack>
      ) : null}

      {/* Structure pattern in a monospace block */}
      {structure_pattern ? (
        <YStack marginBottom="$2" testID={`grammar-point-structure-${id}`}>
          <Text fontSize="$2" fontWeight="600" marginBottom="$1">
            Structure
          </Text>
          <Text fontSize="$3" testID={`grammar-point-structure-text-${id}`}>
            {structure_pattern}
          </Text>
        </YStack>
      ) : null}

      {/* Usage notes as body text */}
      {usage_notes ? (
        <YStack marginBottom="$2" testID={`grammar-point-usage-${id}`}>
          <Text fontSize="$2" fontWeight="600" marginBottom="$1">
            Usage
          </Text>
          <Text fontSize="$3" testID={`grammar-point-usage-text-${id}`}>
            {usage_notes}
          </Text>
        </YStack>
      ) : null}

      {/* Examples list: traditional (large), pinyin (medium), English (small/subtle) */}
      {examples.length > 0 ? (
        <YStack gap="$2" testID={`grammar-point-examples-${id}`}>
          <Text fontSize="$2" fontWeight="600">
            Examples
          </Text>
          {examples.map((ex, i) => (
            <YStack
              key={i}
              paddingLeft="$2"
              borderLeftWidth={2}
              borderLeftColor="$borderColor"
              testID={`grammar-point-example-${id}-${i}`}
            >
              <Text fontSize={20} fontWeight="500" testID={`grammar-example-traditional-${id}-${i}`}>
                {ex.traditional}
              </Text>
              <Text fontSize="$3" color="$colorSubtle" testID={`grammar-example-pinyin-${id}-${i}`}>
                {ex.pinyin}
              </Text>
              <Text fontSize="$3" testID={`grammar-example-english-${id}-${i}`}>
                {ex.english}
              </Text>
            </YStack>
          ))}
        </YStack>
      ) : null}
    </Card>
  )
}
