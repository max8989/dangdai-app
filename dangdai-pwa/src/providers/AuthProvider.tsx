import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { useUserStore } from '@/stores/useUserStore';
import { useQuizStore } from '@/stores/useQuizStore';

export interface AuthError {
  message: string;
  field?: 'email' | 'password' | 'general';
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  signOut: () => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updatePassword: (newPassword: string) => Promise<boolean>;
  error: AuthError | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const wasManualSignOutRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        setSession(currentSession);

        if (event === 'SIGNED_OUT') {
          wasManualSignOutRef.current = false;
        }

        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }

        if (event === 'USER_UPDATED' && isPasswordRecovery) {
          setIsPasswordRecovery(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, [isPasswordRecovery]);

  const signUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null);
      try {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          const m = signUpError.message.toLowerCase();
          if (
            m.includes('already registered') ||
            m.includes('user already registered') ||
            m.includes('email already exists')
          ) {
            setError({ message: 'Email already registered', field: 'email' });
            return false;
          }
          if (m.includes('invalid email')) {
            setError({ message: 'Please enter a valid email', field: 'email' });
            return false;
          }
          if (m.includes('password')) {
            setError({ message: 'Password must be at least 8 characters', field: 'password' });
            return false;
          }
          setError({ message: signUpError.message, field: 'general' });
          return false;
        }

        return true;
      } catch {
        setError({ message: 'An unexpected error occurred. Please try again.', field: 'general' });
        return false;
      }
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setError(null);
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          const m = signInError.message.toLowerCase();
          if (
            m.includes('invalid login credentials') ||
            m.includes('invalid email or password') ||
            m.includes('wrong password') ||
            m.includes('user not found')
          ) {
            setError({ message: 'Invalid email or password', field: 'general' });
            return false;
          }
          if (m.includes('email not confirmed')) {
            setError({ message: 'Please verify your email first', field: 'email' });
            return false;
          }
          setError({ message: 'Unable to sign in. Please try again.', field: 'general' });
          return false;
        }

        return true;
      } catch {
        setError({ message: 'An unexpected error occurred. Please try again.', field: 'general' });
        return false;
      }
    },
    [],
  );

  const signInWithApple = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (oauthError) {
        setError({ message: 'Unable to sign in with Apple. Please try again.', field: 'general' });
        return false;
      }
      return true;
    } catch {
      setError({ message: 'An unexpected error occurred. Please try again.', field: 'general' });
      return false;
    }
  }, []);

  const resetPassword = useCallback(async (email: string): Promise<boolean> => {
    setError(null);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        const m = resetError.message.toLowerCase();
        if (m.includes('rate limit') || m.includes('too many')) {
          setError({ message: 'Too many attempts. Please try again later.', field: 'general' });
          return false;
        }
      }
      return true;
    } catch {
      setError({ message: 'Unable to send reset link. Please try again.', field: 'general' });
      return false;
    }
  }, []);

  const updatePassword = useCallback(async (newPassword: string): Promise<boolean> => {
    setError(null);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        const m = updateError.message.toLowerCase();
        if (m.includes('password') && m.includes('weak')) {
          setError({
            message: 'Password is too weak. Please choose a stronger password.',
            field: 'password',
          });
          return false;
        }
        if (m.includes('same password')) {
          setError({
            message: 'New password must be different from your current password.',
            field: 'password',
          });
          return false;
        }
        setError({ message: 'Unable to update password. Please try again.', field: 'general' });
        return false;
      }
      return true;
    } catch {
      setError({ message: 'An unexpected error occurred. Please try again.', field: 'general' });
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<boolean> => {
    setError(null);
    try {
      wasManualSignOutRef.current = true;
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        wasManualSignOutRef.current = false;
        setError({ message: 'Unable to sign out. Please try again.', field: 'general' });
        return false;
      }

      queryClient.clear();
      useUserStore.getState().clearUser();
      useQuizStore.getState().resetQuiz();

      return true;
    } catch {
      wasManualSignOutRef.current = false;
      setError({ message: 'An unexpected error occurred. Please try again.', field: 'general' });
      return false;
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isLoading: loading,
      isPasswordRecovery,
      signIn,
      signUp,
      signInWithApple,
      signOut,
      resetPassword,
      updatePassword,
      error,
      clearError,
    }),
    [
      session,
      loading,
      isPasswordRecovery,
      signIn,
      signUp,
      signInWithApple,
      signOut,
      resetPassword,
      updatePassword,
      error,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
