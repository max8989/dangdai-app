import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/supabase';
import type { QuestionResultInsert, QuizAttemptInsert } from '../types/quiz';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.'
  );
}

// Storage adapter that works across platforms
// AsyncStorage is used for React Native (iOS/Android)
// localStorage is used for web (AsyncStorage polyfills to localStorage on web)
const getStorage = () => {
  if (Platform.OS === 'web') {
    // For web, check if we're in a browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      return {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      };
    }
    // During SSR, return a no-op storage
    return {
      getItem: () => Promise.resolve(null),
      setItem: () => Promise.resolve(),
      removeItem: () => Promise.resolve(),
    };
  }
  // For native platforms, use AsyncStorage
  return AsyncStorage;
};

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: getStorage(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false, // Important for React Native
    },
  }
);

// ─── Error codes ──────────────────────────────────────────────────────────────

/** Postgres error code: relation (table) does not exist */
const PG_ERROR_TABLE_NOT_FOUND = '42P01'
/** Postgres error code: insufficient privilege (RLS policy issue) */
const PG_ERROR_INSUFFICIENT_PRIVILEGE = '42501'
/** Postgres error code: foreign key violation */
const PG_ERROR_FK_VIOLATION = '23503'

// ─── Insert helpers ───────────────────────────────────────────────────────────

/**
 * Insert a per-question result into the question_results table (Story 4.10, Task 3.3).
 *
 * NEVER throws — all errors are logged as warnings and swallowed gracefully.
 * Handles:
 *   - 42P01: table does not exist yet (Story 1.3 in-progress) — log + skip
 *   - 42501: RLS policy issue — log + skip
 *   - 23503: foreign key violation — log + skip
 *   - Network errors (no code): log + skip (retry is handled by useQuizPersistence)
 *   - No auth session: log + skip
 *
 * @param data - Question result data matching the question_results schema exactly
 */
export async function insertQuestionResult(data: QuestionResultInsert): Promise<void> {
  try {
    const { error } = await supabase
      .from('question_results')
      .insert(data)

    if (error) {
      if (error.code === PG_ERROR_TABLE_NOT_FOUND) {
        console.warn('Table question_results does not exist yet (Story 1.3). Skipping write.')
        return
      }
      if (error.code === PG_ERROR_INSUFFICIENT_PRIVILEGE) {
        console.warn('Insufficient privilege inserting question_result (RLS issue):', error.message)
        return
      }
      if (error.code === PG_ERROR_FK_VIOLATION) {
        console.warn('Foreign key violation inserting question_result:', error.message)
        return
      }
      console.warn('Failed to insert question_result:', error.message)
    }
  } catch (err) {
    console.warn('Unexpected error inserting question_result:', err)
  }
}

/**
 * Insert a quiz attempt record into the quiz_attempts table (Story 4.10, Task 3.4).
 *
 * NEVER throws — all errors are logged as warnings and swallowed gracefully.
 * Handles the same error codes as insertQuestionResult.
 *
 * @param data - Quiz attempt data matching the quiz_attempts schema exactly
 */
export async function insertQuizAttempt(data: QuizAttemptInsert): Promise<void> {
  try {
    const { error } = await supabase
      .from('quiz_attempts')
      .insert(data)

    if (error) {
      if (error.code === PG_ERROR_TABLE_NOT_FOUND) {
        console.warn('Table quiz_attempts does not exist yet (Story 1.3). Skipping write.')
        return
      }
      if (error.code === PG_ERROR_INSUFFICIENT_PRIVILEGE) {
        console.warn('Insufficient privilege inserting quiz_attempt (RLS issue):', error.message)
        return
      }
      if (error.code === PG_ERROR_FK_VIOLATION) {
        console.warn('Foreign key violation inserting quiz_attempt:', error.message)
        return
      }
      console.warn('Failed to insert quiz_attempt:', error.message)
    }
  } catch (err) {
    console.warn('Unexpected error inserting quiz_attempt:', err)
  }
}
