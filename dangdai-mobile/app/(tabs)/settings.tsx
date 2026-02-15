import { useState } from 'react'
import { Alert, Platform } from 'react-native'
import { H2, YStack, XStack, Text, Button, Separator, Spinner } from 'tamagui'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useAuth } from '../../hooks/useAuth'
import { useSession } from '../../hooks/useSession'

export default function SettingsScreen() {
  const { signOut, isLoading, error } = useAuth()
  const { user } = useSession()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = () => {
    // Show confirmation dialog
    if (Platform.OS === 'web') {
      // Web uses window.confirm
      const confirmed = window.confirm('Are you sure you want to sign out?')
      if (confirmed) {
        performSignOut()
      }
    } else {
      // Native uses Alert.alert
      Alert.alert(
        'Sign Out',
        'Are you sure you want to sign out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Sign Out',
            style: 'destructive',
            onPress: performSignOut,
          },
        ],
        { cancelable: true }
      )
    }
  }

  const performSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <YStack flex={1} padding="$4">
        <H2 marginBottom="$4">Settings</H2>

        {/* User Info Section */}
        <YStack marginBottom="$4" gap="$1">
          <Text fontSize="$3" color="$colorSubtle">
            Signed in as
          </Text>
          <Text fontSize="$5" fontWeight="600">
            {user?.email ?? 'Loading...'}
          </Text>
        </YStack>

        <Separator marginVertical="$4" />

        {/* Settings Options Placeholder */}
        <YStack gap="$3">
          <Text color="$colorSubtle" fontSize="$3">
            More settings coming soon...
          </Text>
          {/* Language, Theme, Sound settings - Story 9.x */}
        </YStack>

        {/* Spacer to push sign out to bottom */}
        <YStack flex={1} />

        {/* Error Message */}
        {error && (
          <XStack
            backgroundColor="$errorBackground"
            padding="$3"
            borderRadius="$3"
            marginBottom="$3"
            accessibilityRole="alert"
          >
            <Text color="$error">{error.message}</Text>
          </XStack>
        )}

        {/* Sign Out Button */}
        <Button
          theme="red"
          size="$4"
          onPress={handleSignOut}
          disabled={isLoading || isSigningOut}
          icon={isSigningOut ? <Spinner size="small" /> : undefined}
        >
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </Button>
      </YStack>
    </SafeAreaView>
  )
}
