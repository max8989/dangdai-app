import { useState, useCallback } from 'react'
import { YStack, XStack, Input, Button, Text, Spinner } from 'tamagui'
import { Link } from 'expo-router'
import { useAuth } from '../../hooks/useAuth'

interface ValidationErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

// Validation helpers
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidPassword = (password: string): boolean => {
  return password.length >= 8
}

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const { signUp, isLoading, error: authError, clearError } = useAuth()

  // Validate individual field
  const validateField = useCallback((field: string, value: string) => {
    const errors: ValidationErrors = { ...validationErrors }

    switch (field) {
      case 'email':
        if (!value) {
          errors.email = undefined
        } else if (!isValidEmail(value)) {
          errors.email = 'Please enter a valid email'
        } else {
          errors.email = undefined
        }
        break
      case 'password':
        if (!value) {
          errors.password = undefined
        } else if (!isValidPassword(value)) {
          errors.password = 'Password must be at least 8 characters'
        } else {
          errors.password = undefined
        }
        // Also revalidate confirm password when password changes
        if (confirmPassword && value !== confirmPassword) {
          errors.confirmPassword = "Passwords don't match"
        } else if (confirmPassword) {
          errors.confirmPassword = undefined
        }
        break
      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = undefined
        } else if (value !== password) {
          errors.confirmPassword = "Passwords don't match"
        } else {
          errors.confirmPassword = undefined
        }
        break
    }

    setValidationErrors(errors)
    return errors
  }, [validationErrors, password, confirmPassword])

  // Handle field blur (mark as touched and validate)
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = field === 'email' ? email : field === 'password' ? password : confirmPassword
    validateField(field, value)
  }

  // Handle field change
  const handleChange = (field: string, value: string) => {
    // Clear any auth errors when user starts typing
    if (authError) {
      clearError()
    }

    switch (field) {
      case 'email':
        setEmail(value)
        break
      case 'password':
        setPassword(value)
        break
      case 'confirmPassword':
        setConfirmPassword(value)
        break
    }

    // Validate on change if field was already touched
    if (touched[field]) {
      validateField(field, value)
    }
  }

  // Validate all fields before submit
  const validateAll = (): boolean => {
    const errors: ValidationErrors = {}

    if (!email) {
      errors.email = 'Email is required'
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (!isValidPassword(password)) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (confirmPassword !== password) {
      errors.confirmPassword = "Passwords don't match"
    }

    setValidationErrors(errors)
    setTouched({ email: true, password: true, confirmPassword: true })

    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateAll()) {
      return
    }

    await signUp(email, password)
  }

  // Determine which error to show for email field (validation or auth error)
  const emailError =
    (touched.email && validationErrors.email) ||
    (authError?.field === 'email' ? authError.message : undefined)

  // Determine which error to show for password field
  const passwordError =
    (touched.password && validationErrors.password) ||
    (authError?.field === 'password' ? authError.message : undefined)

  const confirmPasswordError = touched.confirmPassword && validationErrors.confirmPassword

  const generalError = authError?.field === 'general' ? authError.message : undefined

  return (
    <YStack gap="$4" flex={1}>
      {/* General error message */}
      {generalError && (
        <XStack
          backgroundColor="$red2"
          padding="$3"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$red6"
        >
          <Text color="$red10" fontSize="$3">
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
          onChangeText={(value) => handleChange('email', value)}
          onBlur={() => handleBlur('email')}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          size="$4"
          borderColor={emailError ? '$red8' : undefined}
        />
        {emailError && (
          <Text color="$red10" fontSize="$2">
            {emailError}
          </Text>
        )}
      </YStack>

      {/* Password Input */}
      <YStack gap="$2">
        <Text fontWeight="600" fontSize="$3">
          Password
        </Text>
        <Input
          placeholder="At least 8 characters"
          value={password}
          onChangeText={(value) => handleChange('password', value)}
          onBlur={() => handleBlur('password')}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          size="$4"
          borderColor={passwordError ? '$red8' : undefined}
        />
        {passwordError && (
          <Text color="$red10" fontSize="$2">
            {passwordError}
          </Text>
        )}
      </YStack>

      {/* Confirm Password Input */}
      <YStack gap="$2">
        <Text fontWeight="600" fontSize="$3">
          Confirm Password
        </Text>
        <Input
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={(value) => handleChange('confirmPassword', value)}
          onBlur={() => handleBlur('confirmPassword')}
          secureTextEntry
          textContentType="newPassword"
          autoComplete="new-password"
          size="$4"
          borderColor={confirmPasswordError ? '$red8' : undefined}
        />
        {confirmPasswordError && (
          <Text color="$red10" fontSize="$2">
            {confirmPasswordError}
          </Text>
        )}
      </YStack>

      {/* Sign Up Button */}
      <Button
        size="$5"
        themeInverse
        onPress={handleSubmit}
        disabled={isLoading}
        marginTop="$2"
      >
        {isLoading ? (
          <XStack gap="$2" alignItems="center">
            <Spinner size="small" color="$color" />
            <Text>Creating account...</Text>
          </XStack>
        ) : (
          'Sign Up'
        )}
      </Button>

      {/* Link to Login */}
      <XStack justifyContent="center" marginTop="$4">
        <Link href="/(auth)/login" asChild>
          <Text color="$blue10" fontWeight="600">
            Already have an account? Sign In
          </Text>
        </Link>
      </XStack>
    </YStack>
  )
}
