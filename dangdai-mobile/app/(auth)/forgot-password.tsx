import { YStack, H1, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ForgotPasswordForm } from '../../components/auth/ForgotPasswordForm'

export default function ForgotPasswordScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} paddingHorizontal="$4" gap="$8">
        <YStack gap="$2" paddingTop="$6" alignItems="center">
          <H1>Forgot Password?</H1>
          <Text color="$colorSubtle" textAlign="center">
            Enter your email and we'll send you a reset link
          </Text>
        </YStack>

        <ForgotPasswordForm />
      </YStack>
    </SafeAreaView>
  )
}
