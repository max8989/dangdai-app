import { useState, useCallback } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { YStack, XStack, Input, Button, Text, Spinner } from 'tamagui'
import { useAuth } from '../../hooks/useAuth'

interface ValidationErrors {
  password?: string
  confirmPassword?: string
}

// Password validation helper
const validatePasswordStrength = (password: string): string[] => {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('At least 8 characters')
  }

  return errors
}

const isValidPassword = (password: string): boolean => {
  return password.length >= 8
}

export function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const { updatePassword, isLoading, error: authError, clearError } = useAuth()

  // Get password strength errors for display
  const passwordStrengthErrors = validatePasswordStrength(password)
  const passwordIsValid = isValidPassword(password)

  // Validate individual field
  const validateField = useCallback(
    (field: string, value: string) => {
      const errors: ValidationErrors = { ...validationErrors }

      switch (field) {
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
    },
    [validationErrors, password, confirmPassword]
  )

  // Handle field blur
  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = field === 'password' ? password : confirmPassword
    validateField(field, value)
  }

  // Handle field change
  const handleChange = (field: string, value: string) => {
    if (authError) {
      clearError()
    }

    switch (field) {
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
    setTouched({ password: true, confirmPassword: true })

    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateAll()) {
      return
    }

    await updatePassword(password)
  }

  // Determine which error to show for password field
  const passwordError =
    (touched.password && validationErrors.password) ||
    (authError?.field === 'password' ? authError.message : undefined)

  const confirmPasswordError = touched.confirmPassword && validationErrors.confirmPassword

  const generalError = authError?.field === 'general' ? authError.message : undefined

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

          {/* Password Input */}
          <YStack gap="$2">
            <Text fontWeight="600" fontSize="$3">
              New Password
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
            {/* Password strength indicator */}
            {password.length > 0 && !passwordError && (
              <YStack gap="$1">
                {passwordStrengthErrors.length > 0 ? (
                  passwordStrengthErrors.map((err, i) => (
                    <Text key={i} color="$orange10" fontSize="$2">
                      {err}
                    </Text>
                  ))
                ) : (
                  <Text color="$green10" fontSize="$2">
                    Password meets requirements
                  </Text>
                )}
              </YStack>
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

          {/* Update Password Button */}
          <Button
            size="$5"
            themeInverse
            onPress={handleSubmit}
            disabled={isLoading || !passwordIsValid}
            marginTop="$2"
          >
            {isLoading ? (
              <XStack gap="$2" alignItems="center">
                <Spinner size="small" color="$color" />
                <Text>Updating...</Text>
              </XStack>
            ) : (
              'Update Password'
            )}
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
