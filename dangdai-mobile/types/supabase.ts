export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chapter_progress: {
        Row: {
          book_id: number
          chapter_id: number
          completion_percentage: number | null
          id: string
          mastered_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: number
          chapter_id: number
          completion_percentage?: number | null
          id?: string
          mastered_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: number
          chapter_id?: number
          completion_percentage?: number | null
          id?: string
          mastered_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      dangdai_chunks: {
        Row: {
          book: number
          category: string | null
          content: string
          content_quality: number | null
          content_type: string | null
          created_at: string | null
          difficulty: string | null
          element_ids: string[] | null
          embedding: string | null
          exercise_type: string | null
          id: string
          lesson: number | null
          lesson_title: string | null
          material_type: string | null
          page_numbers: number[] | null
          page_range: string | null
          script: string | null
          section: string | null
          topic: string | null
          updated_at: string | null
        }
        Insert: {
          book: number
          category?: string | null
          content: string
          content_quality?: number | null
          content_type?: string | null
          created_at?: string | null
          difficulty?: string | null
          element_ids?: string[] | null
          embedding?: string | null
          exercise_type?: string | null
          id?: string
          lesson?: number | null
          lesson_title?: string | null
          material_type?: string | null
          page_numbers?: number[] | null
          page_range?: string | null
          script?: string | null
          section?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Update: {
          book?: number
          category?: string | null
          content?: string
          content_quality?: number | null
          content_type?: string | null
          created_at?: string | null
          difficulty?: string | null
          element_ids?: string[] | null
          embedding?: string | null
          exercise_type?: string | null
          id?: string
          lesson?: number | null
          lesson_title?: string | null
          material_type?: string | null
          page_numbers?: number[] | null
          page_range?: string | null
          script?: string | null
          section?: string | null
          topic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      exercise_type_progress: {
        Row: {
          attempts_count: number
          best_score: number
          chapter_id: number
          exercise_type: string
          id: string
          mastered_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts_count?: number
          best_score?: number
          chapter_id: number
          exercise_type: string
          id?: string
          mastered_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts_count?: number
          best_score?: number
          chapter_id?: number
          exercise_type?: string
          id?: string
          mastered_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_results: {
        Row: {
          book_id: number
          chapter_id: number
          correct: boolean
          created_at: string
          exercise_type: string
          grammar_pattern: string | null
          id: string
          time_spent_ms: number
          user_id: string
          vocabulary_item: string | null
        }
        Insert: {
          book_id: number
          chapter_id: number
          correct: boolean
          created_at?: string
          exercise_type: string
          grammar_pattern?: string | null
          id?: string
          time_spent_ms: number
          user_id: string
          vocabulary_item?: string | null
        }
        Update: {
          book_id?: number
          chapter_id?: number
          correct?: boolean
          created_at?: string
          exercise_type?: string
          grammar_pattern?: string | null
          id?: string
          time_spent_ms?: number
          user_id?: string
          vocabulary_item?: string | null
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers_json: Json
          book_id: number
          chapter_id: number
          created_at: string
          exercise_type: string
          id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers_json: Json
          book_id: number
          chapter_id: number
          created_at?: string
          exercise_type: string
          id?: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers_json?: Json
          book_id?: number
          chapter_id?: number
          created_at?: string
          exercise_type?: string
          id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          current_streak: number
          display_name: string | null
          email: string
          id: string
          streak_updated_at: string | null
          total_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email: string
          id: string
          streak_updated_at?: string | null
          total_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_streak?: number
          display_name?: string | null
          email?: string
          id?: string
          streak_updated_at?: string | null
          total_points?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      dangdai_search: {
        Args: {
          filter_book?: number
          filter_category?: string
          filter_content_type?: string
          filter_difficulty?: string
          filter_exercise_type?: string
          filter_lesson?: number
          match_count?: number
          query_embedding: string
        }
        Returns: {
          book: number
          category: string
          content: string
          content_type: string
          difficulty: string
          exercise_type: string
          id: string
          lesson: number
          lesson_title: string
          page_range: string
          section: string
          similarity: number
          topic: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
