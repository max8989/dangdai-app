/**
 * Theme Verification Demo Screen (temporary dev screen)
 *
 * Story 1.1b - Task 5: Demonstrates all 4 sub-themes, animations,
 * and AnimatePresence in both light and dark mode.
 */

import { useState } from 'react'
import {
  AnimatePresence,
  Button,
  Card,
  H3,
  H4,
  Paragraph,
  ScrollView,
  Separator,
  Square,
  Theme,
  XStack,
  YStack,
} from 'tamagui'

function SubThemeCard({ themeName }: { themeName: string }) {
  return (
    <Theme name={themeName as any}>
      <Card
        bordered
        padded
        bg="$background"
        borderColor="$borderColor"
        borderRadius="$md"
      >
        <H4 color="$color">{themeName}</H4>
        <Paragraph color="$color" opacity={0.8}>
          Sub-theme demonstration
        </Paragraph>
        <XStack gap="$sm" mt="$sm">
          <Button size="$3" bg="$background" color="$color" borderColor="$borderColor">
            Default
          </Button>
          <Button size="$3" bg="$backgroundHover" color="$colorHover">
            Hover
          </Button>
        </XStack>
      </Card>
    </Theme>
  )
}

function AnimatedBox() {
  return (
    <Square
      animation="bouncy"
      size={80}
      bg="$primary"
      borderRadius="$sm"
      enterStyle={{
        opacity: 0,
        scale: 0.5,
      }}
      opacity={1}
      scale={1}
    />
  )
}

function AnimatePresenceDemo() {
  const [show, setShow] = useState(true)

  return (
    <YStack gap="$md">
      <H4>AnimatePresence Toggle</H4>
      <Button size="$3" onPress={() => setShow(!show)}>
        {show ? 'Hide' : 'Show'} Animated Box
      </Button>
      <YStack height={100} items="center" justify="center">
        <AnimatePresence>
          {show && (
            <Square
              key="animated-square"
              animation="bouncy"
              size={80}
              bg="$secondary"
              borderRadius="$sm"
              opacity={1}
              scale={1}
              enterStyle={{
                opacity: 0,
                scale: 0.5,
                y: -20,
              }}
              exitStyle={{
                opacity: 0,
                scale: 0.5,
                y: 20,
              }}
            />
          )}
        </AnimatePresence>
      </YStack>
    </YStack>
  )
}

function PrimaryButtonDemo() {
  return (
    <YStack gap="$sm">
      <H4>Primary Theme Button (AC #5)</H4>
      <Paragraph color="$colorSubtle">
        Should render teal background with white text
      </Paragraph>
      <Theme name="primary">
        <Button size="$4" bg="$background" color="$color">
          Test Button
        </Button>
      </Theme>
    </YStack>
  )
}

export default function ThemeDemoScreen() {
  return (
    <ScrollView bg="$background">
      <YStack flex={1} gap="$lg" px="$md" py="$lg">
        <H3>Theme & Animation Demo</H3>

        {/* Sub-themes section (AC #2) */}
        <YStack gap="$md">
          <H4 color="$colorSubtle">Sub-Themes (Light)</H4>
          <SubThemeCard themeName="primary" />
          <SubThemeCard themeName="success" />
          <SubThemeCard themeName="error" />
          <SubThemeCard themeName="warning" />
        </YStack>

        <Separator />

        {/* Primary button verification (AC #5) */}
        <PrimaryButtonDemo />

        <Separator />

        {/* Animated component (AC #3) */}
        <YStack gap="$sm">
          <H4>Bouncy Animation on Mount (AC #3)</H4>
          <YStack height={100} items="center" justify="center">
            <AnimatedBox />
          </YStack>
        </YStack>

        <Separator />

        {/* AnimatePresence (AC #5) */}
        <AnimatePresenceDemo />

        <Separator />

        {/* Token verification */}
        <YStack gap="$sm">
          <H4>Token Spacing Verification (AC #4)</H4>
          <XStack gap="$xs">
            <Square size={20} bg="$primary" borderRadius="$sm" />
            <Square size={20} bg="$success" borderRadius="$sm" />
            <Square size={20} bg="$error" borderRadius="$sm" />
            <Square size={20} bg="$warning" borderRadius="$sm" />
          </XStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
