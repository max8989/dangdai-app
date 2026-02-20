import { YStack, H1, Text } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ResetPasswordForm } from '../../components/auth/ResetPasswordForm'

export default function ResetPasswordScreen() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack flex={1} paddingHorizontal="$4" gap="$8">
        <YStack gap="$2" paddingTop="$6" alignItems="center">
          <H1>Set New Password</H1>
          <Text color="$colorSubtle" textAlign="center">
            Enter your new password below
          </Text>
        </YStack>

        <ResetPasswordForm />
      </YStack>
    </SafeAreaView>
  )
}
