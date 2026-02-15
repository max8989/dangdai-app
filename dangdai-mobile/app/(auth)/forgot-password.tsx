import { YStack, H1, Text, Paragraph } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'

// Placeholder forgot password screen - full implementation in Story 2.5
export default function ForgotPasswordScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} p="$4" gap="$4" justify="center" items="center">
        <H1>Reset Password</H1>
        <Paragraph color="$gray11" textAlign="center">
          Password reset functionality coming in Story 2.5
        </Paragraph>
        <Link href="/(auth)/login" asChild>
          <Text color="$blue10" fontWeight="600">
            Back to Sign In
          </Text>
        </Link>
      </YStack>
    </SafeAreaView>
  )
}
