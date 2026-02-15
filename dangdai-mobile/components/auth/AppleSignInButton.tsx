import { useState } from 'react'
import { Platform, StyleSheet } from 'react-native'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as Crypto from 'expo-crypto'
import { router } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { YStack, Text, Spinner } from 'tamagui'
import { supabase } from '../../lib/supabase'

export interface AppleSignInError {
  message: string
  code?: string
}

/**
 * Handles Apple authentication errors and returns a user-friendly message
 * @param error - The error thrown by Apple Authentication
 * @returns User-friendly error message or null if user cancelled
 */
function handleAppleError(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const errorCode = (error as { code: string }).code
    switch (errorCode) {
      case 'ERR_REQUEST_CANCELED':
        // User cancelled - no action needed
        return null
      case 'ERR_REQUEST_FAILED':
        return 'Apple Sign-In failed. Please try again.'
      case 'ERR_INVALID_RESPONSE':
        return 'Invalid response from Apple. Please try again.'
      default:
        return 'Unable to sign in with Apple.'
    }
  }
  return 'Unable to sign in with Apple.'
}

/**
 * AppleSignInButton component - renders the native Apple Sign-In button
 * Only renders on iOS devices (returns null on Android/web)
 * 
 * Implements the Apple Sign-In flow:
 * 1. Generate secure nonce
 * 2. Request Apple credentials
 * 3. Exchange with Supabase for session
 * 4. Navigate to dashboard
 */
export function AppleSignInButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AppleSignInError | null>(null)
  const toast = useToastController()

  // Only render on iOS - per AC #2 and NFR13
  if (Platform.OS !== 'ios') {
    return null
  }

  const signInWithApple = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Generate secure random nonce using expo-crypto
      const rawNonce = Crypto.getRandomBytes(32)
      const nonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Array.from(rawNonce)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      )

      // Request Apple credentials with nonce
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce,
      })

      // Exchange Apple identity token with Supabase
      if (credential.identityToken) {
        const { error: supabaseError } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
          nonce, // Must match nonce used in Apple request
        })

        if (supabaseError) {
          // Handle Supabase OAuth errors
          setError({
            message: 'Unable to complete sign-in. Please try again.',
            code: 'SUPABASE_ERROR',
          })
          return
        }

        // Success - user profile is auto-created by database trigger (Story 1.3)
        toast.show('Welcome!', {
          message: 'You have signed in with Apple successfully.',
        })

        // Navigate to dashboard
        router.replace('/(tabs)')
      } else {
        // No identity token received
        setError({
          message: 'No authentication token received from Apple.',
          code: 'NO_TOKEN',
        })
      }
    } catch (err: unknown) {
      // Handle Apple authentication errors
      const errorMessage = handleAppleError(err)
      if (errorMessage) {
        // Only set error if it's not a user cancellation
        setError({
          message: errorMessage,
          code:
            err && typeof err === 'object' && 'code' in err
              ? (err as { code: string }).code
              : 'UNKNOWN',
        })
      }
      // If user cancelled (errorMessage is null), just return silently
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return (
    <YStack gap="$2" width="100%">
      {/* Error message display */}
      {error && (
        <Text
          color="$red10"
          fontSize="$2"
          textAlign="center"
          onPress={clearError}
        >
          {error.message}
        </Text>
      )}

      {/* Loading overlay */}
      {isLoading ? (
        <YStack
          backgroundColor="$gray2"
          borderRadius="$2"
          height={48}
          justifyContent="center"
          alignItems="center"
        >
          <Spinner size="small" color="$gray10" />
        </YStack>
      ) : (
        /* Native Apple Sign-In Button (required by Apple guidelines) */
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={styles.button}
          onPress={signInWithApple}
        />
      )}
    </YStack>
  )
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    height: 48,
  },
})
