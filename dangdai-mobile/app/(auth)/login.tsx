import { YStack, H1, Text, Paragraph } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

// Placeholder login screen - full implementation in Story 2.2
export default function LoginScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} p="$4" gap="$4" justify="center" items="center">
        <H1>Sign In</H1>
        <Paragraph color="$gray11">
          Login functionality coming in Story 2.2
        </Paragraph>
        <Link href="/(auth)/signup" asChild>
          <Text color="$blue10" fontWeight="600">
            Don't have an account? Sign Up
          </Text>
        </Link>
      </YStack>
    </SafeAreaView>
  )
}
