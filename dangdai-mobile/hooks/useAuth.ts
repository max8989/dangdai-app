import { useState } from 'react'
import { router } from 'expo-router'
import { useToastController } from '@tamagui/toast'
import { supabase } from '../lib/supabase'

export interface AuthError {
  message: string
  field?: 'email' | 'password' | 'general'
}

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const toast = useToastController()

  const signUp = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        // Handle specific error cases
        if (
          signUpError.message.includes('already registered') ||
          signUpError.message.includes('User already registered')
        ) {
          setError({
            message: 'Email already registered',
            field: 'email',
          })
          return false
        }

        if (signUpError.message.includes('Invalid email')) {
          setError({
            message: 'Please enter a valid email',
            field: 'email',
          })
          return false
        }

        if (signUpError.message.includes('Password')) {
          setError({
            message: 'Password must be at least 8 characters',
            field: 'password',
          })
          return false
        }

        // Generic error
        setError({
          message: signUpError.message,
          field: 'general',
        })
        return false
      }

      // Success - user profile is auto-created by database trigger (Story 1.3)
      toast.show('Welcome!', {
        message: 'Your account has been created successfully.',
      })

      // Navigate to books screen (main app)
      router.replace('/(tabs)')

      return true
    } catch (err) {
      setError({
        message: 'An unexpected error occurred. Please try again.',
        field: 'general',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const clearError = () => {
    setError(null)
  }

  return {
    signUp,
    isLoading,
    error,
    clearError,
  }
}
