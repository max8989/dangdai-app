import { useState, useCallback } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { YStack, XStack, Input, Button, Text, Spinner } from 'tamagui'
import { Link } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [validationError, setValidationError] = useState<string | undefined>()
  const [touched, setTouched] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const { resetPassword, isLoading, error: authError, clearError } = useAuth()

  // Validate email field
  const validateEmail = useCallback((value: string) => {
    if (!value) {
      setValidationError(undefined)
    } else if (!isValidEmail(value)) {
      setValidationError('Please enter a valid email')
    } else {
      setValidationError(undefined)
    }
  }, [])

  // Handle field blur
  const handleBlur = () => {
    setTouched(true)
    validateEmail(email)
  }

  // Handle email change
  const handleChange = (value: string) => {
    if (authError) {
      clearError()
    }
    setEmail(value)
    if (touched) {
      validateEmail(value)
    }
  }

  // Validate before submit
  const validateAll = (): boolean => {
    if (!email) {
      setValidationError('Email is required')
      setTouched(true)
      return false
    }
    if (!isValidEmail(email)) {
      setValidationError('Please enter a valid email')
      setTouched(true)
      return false
    }
    return true
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateAll()) {
      return
    }

    const success = await resetPassword(email)
    if (success) {
      setEmailSent(true)
    }
  }

  // Determine which error to show
  const emailError =
    (touched && validationError) ||
    (authError?.field === 'email' ? authError.message : undefined)

  const generalError = authError?.field === 'general' ? authError.message : undefined

  // Success state - show confirmation message
  if (emailSent) {
    return (
      <YStack gap="$6" flex={1} paddingTop="$4">
        <YStack
          backgroundColor="$successBackground"
          padding="$4"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$successBorder"
          gap="$2"
        >
          <Text color="$successText" fontWeight="600" fontSize="$5">
            Check your email
          </Text>
          <Text color="$success" fontSize="$3">
            Reset link sent to your email
          </Text>
          <Text color="$colorSubtle" fontSize="$2" marginTop="$2">
            If an account exists with this email, you will receive password reset
            instructions shortly. Check your spam folder if you don't see it.
          </Text>
        </YStack>

        <Link href="/(auth)/login" asChild>
          <Button size="$5" theme="primary">
            Back to Login
          </Button>
        </Link>
      </YStack>
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack gap="$4" flex={1}>
          {/* General error message */}
          {generalError && (
            <XStack
              backgroundColor="$errorBackground"
              padding="$3"
              borderRadius="$4"
              borderWidth={1}
              borderColor="$errorBorder"
              accessibilityRole="alert"
            >
              <Text color="$error" fontSize="$3">
                {generalError}
              </Text>
            </XStack>
          )}

          {/* Email Input */}
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              Email
            </Text>
            <Input
              placeholder="your@email.com"
              value={email}
              onChangeText={handleChange}
              onBlur={handleBlur}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              size="$4"
              borderColor={emailError ? '$error' : undefined}
            />
            {emailError && (
              <Text color="$error" fontSize="$2">
                {emailError}
              </Text>
            )}
          </YStack>

          {/* Send Reset Link Button */}
          <Button
            size="$5"
            theme="primary"
            onPress={handleSubmit}
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            marginTop="$2"
          >
            {isLoading ? (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" />
                <Text>Sending...</Text>
              </XStack>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          {/* Back to Login Link */}
          <XStack justifyContent="center" marginTop="$4">
            <Link href="/(auth)/login" asChild>
              <Text color="$primary" fontWeight="600">
                Back to Login
              </Text>
            </Link>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
