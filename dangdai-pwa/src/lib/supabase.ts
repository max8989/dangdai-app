import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/supabase';
import type { QuestionResultInsert, QuizAttemptInsert } from '../types/quiz';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  },
);

const PG_ERROR_TABLE_NOT_FOUND = '42P01';
const PG_ERROR_INSUFFICIENT_PRIVILEGE = '42501';
const PG_ERROR_FK_VIOLATION = '23503';

export async function insertQuestionResult(data: QuestionResultInsert): Promise<void> {
  try {
    const { error } = await supabase.from('question_results').insert(data);

    if (error) {
      if (error.code === PG_ERROR_TABLE_NOT_FOUND) {
        console.warn('Table question_results does not exist yet. Skipping write.');
        return;
      }
      if (error.code === PG_ERROR_INSUFFICIENT_PRIVILEGE) {
        console.warn('Insufficient privilege inserting question_result:', error.message);
        return;
      }
      if (error.code === PG_ERROR_FK_VIOLATION) {
        console.warn('Foreign key violation inserting question_result:', error.message);
        return;
      }
      console.warn('Failed to insert question_result:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error inserting question_result:', err);
  }
}

export async function insertQuizAttempt(data: QuizAttemptInsert): Promise<void> {
  try {
    const { error } = await supabase.from('quiz_attempts').insert(data);

    if (error) {
      if (error.code === PG_ERROR_TABLE_NOT_FOUND) {
        console.warn('Table quiz_attempts does not exist yet. Skipping write.');
        return;
      }
      if (error.code === PG_ERROR_INSUFFICIENT_PRIVILEGE) {
        console.warn('Insufficient privilege inserting quiz_attempt:', error.message);
        return;
      }
      if (error.code === PG_ERROR_FK_VIOLATION) {
        console.warn('Foreign key violation inserting quiz_attempt:', error.message);
        return;
      }
      console.warn('Failed to insert quiz_attempt:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error inserting quiz_attempt:', err);
  }
}
