export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_tutor_contexts: {
        Row: {
          ai_session_metadata: Json | null
          context_type: string
          course_id: string
          created_at: string
          current_context: Json
          expires_at: string | null
          id: string
          interaction_history: Json
          learning_profile: Json
          session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_session_metadata?: Json | null
          context_type: string
          course_id: string
          created_at?: string
          current_context?: Json
          expires_at?: string | null
          id?: string
          interaction_history?: Json
          learning_profile?: Json
          session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_session_metadata?: Json | null
          context_type?: string
          course_id?: string
          created_at?: string
          current_context?: Json
          expires_at?: string | null
          id?: string
          interaction_history?: Json
          learning_profile?: Json
          session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_contexts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tutor_contexts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tutor_contexts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_tutor_messages: {
        Row: {
          content: string
          id: string
          sender: string
          session_id: string
          timestamp: string
        }
        Insert: {
          content: string
          id?: string
          sender: string
          session_id: string
          timestamp?: string
        }
        Update: {
          content?: string
          id?: string
          sender?: string
          session_id?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      ai_tutor_sessions: {
        Row: {
          ai_session_metadata: Json | null
          course_id: string
          created_at: string
          ended_at: string | null
          id: string
          started_at: string
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_session_metadata?: Json | null
          course_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_session_metadata?: Json | null
          course_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tutor_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      certification_modules: {
        Row: {
          assessment_rubric: Json
          code: string
          compliance_requirements: Json
          content_config: Json
          created_at: string
          exam_structure: Json
          id: string
          is_active: boolean
          language: string
          launch_date: string | null
          name: string
          official_website: string | null
          phase: number
          updated_at: string
          version: string
        }
        Insert: {
          assessment_rubric?: Json
          code: string
          compliance_requirements?: Json
          content_config?: Json
          created_at?: string
          exam_structure?: Json
          id?: string
          is_active?: boolean
          language: string
          launch_date?: string | null
          name: string
          official_website?: string | null
          phase: number
          updated_at?: string
          version?: string
        }
        Update: {
          assessment_rubric?: Json
          code?: string
          compliance_requirements?: Json
          content_config?: Json
          created_at?: string
          exam_structure?: Json
          id?: string
          is_active?: boolean
          language?: string
          launch_date?: string | null
          name?: string
          official_website?: string | null
          phase?: number
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          assessment_rubric: Json
          certification_module_id: string
          certification_type: string
          components: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          language: string
          level: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_rubric?: Json
          certification_module_id: string
          certification_type: string
          components?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language: string
          level: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_rubric?: Json
          certification_module_id?: string
          certification_type?: string
          components?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          language?: string
          level?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_certification_module_id_fkey"
            columns: ["certification_module_id"]
            isOneToOne: false
            referencedRelation: "certification_modules"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_questions: {
        Row: {
          answer: Json
          answer_text: string | null
          answered_at: string
          attempts: number
          feedback: Json
          id: string
          is_final: boolean
          part_id: string
          question_id: string
          score: number | null
          section_id: string
          session_id: string
          time_spent: number | null
        }
        Insert: {
          answer: Json
          answer_text?: string | null
          answered_at?: string
          attempts?: number
          feedback?: Json
          id?: string
          is_final?: boolean
          part_id: string
          question_id: string
          score?: number | null
          section_id: string
          session_id: string
          time_spent?: number | null
        }
        Update: {
          answer?: Json
          answer_text?: string | null
          answered_at?: string
          attempts?: number
          feedback?: Json
          id?: string
          is_final?: boolean
          part_id?: string
          question_id?: string
          score?: number | null
          section_id?: string
          session_id?: string
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_sessions: {
        Row: {
          ai_feedback: string | null
          component: string
          completed_at: string | null
          course_id: string
          created_at: string
          detailed_scores: Json
          duration_seconds: number
          id: string
          improvement_suggestions: Json
          is_completed: boolean
          progress_id: string
          responses: Json
          score: number | null
          session_data: Json
          session_type: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_feedback?: string | null
          component: string
          completed_at?: string | null
          course_id: string
          created_at?: string
          detailed_scores?: Json
          duration_seconds?: number
          id?: string
          improvement_suggestions?: Json
          is_completed?: boolean
          progress_id: string
          responses?: Json
          score?: number | null
          session_data?: Json
          session_type: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_feedback?: string | null
          component?: string
          completed_at?: string | null
          course_id?: string
          created_at?: string
          detailed_scores?: Json
          duration_seconds?: number
          id?: string
          improvement_suggestions?: Json
          is_completed?: boolean
          progress_id?: string
          responses?: Json
          score?: number | null
          session_data?: Json
          session_type?: string
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_progress_id_fkey"
            columns: ["progress_id"]
            isOneToOne: false
            referencedRelation: "user_course_progress"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_answers: {
        Row: {
          answer: Json
          answer_text: string | null
          answered_at: string
          attempts: number
          feedback: Json
          id: string
          is_final: boolean
          part_id: string
          question_id: string
          score: number | null
          section_id: string
          session_id: string | null
          time_spent: number | null
        }
        Insert: {
          answer: Json
          answer_text?: string | null
          answered_at?: string
          attempts?: number
          feedback?: Json
          id?: string
          is_final?: boolean
          part_id: string
          question_id: string
          score?: number | null
          section_id: string
          session_id?: string | null
          time_spent?: number | null
        }
        Update: {
          answer?: Json
          answer_text?: string | null
          answered_at?: string
          attempts?: number
          feedback?: Json
          id?: string
          is_final?: boolean
          part_id?: string
          question_id?: string
          score?: number | null
          section_id?: string
          session_id?: string | null
          time_spent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      user_course_enrollments: {
        Row: {
          access_expires_at: string | null
          course_id: string
          created_at: string
          enrollment_date: string
          id: string
          subscription_status: string
          subscription_tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          course_id: string
          created_at?: string
          enrollment_date?: string
          id?: string
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          course_id?: string
          created_at?: string
          enrollment_date?: string
          id?: string
          subscription_status?: string
          subscription_tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_course_progress: {
        Row: {
          component_progress: Json
          course_id: string
          created_at: string
          enrollment_date: string
          estimated_study_hours: number
          id: string
          last_activity: string
          overall_progress: number
          readiness_score: number
          strengths: Json
          target_exam_date: string | null
          updated_at: string
          user_id: string
          weaknesses: Json
        }
        Insert: {
          component_progress?: Json
          course_id: string
          created_at?: string
          enrollment_date?: string
          estimated_study_hours?: number
          id?: string
          last_activity?: string
          overall_progress?: number
          readiness_score?: number
          strengths?: Json
          target_exam_date?: string | null
          updated_at?: string
          user_id: string
          weaknesses?: Json
        }
        Update: {
          component_progress?: Json
          course_id?: string
          created_at?: string
          enrollment_date?: string
          estimated_study_hours?: number
          id?: string
          last_activity?: string
          overall_progress?: number
          readiness_score?: number
          strengths?: Json
          target_exam_date?: string | null
          updated_at?: string
          user_id?: string
          weaknesses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          data_retention_preference: string | null
          email: string
          full_name: string | null
          gdpr_consent: boolean
          gdpr_consent_date: string | null
          id: string
          last_active: string
          lopd_consent: boolean
          preferred_language: string | null
        }
        Insert: {
          created_at?: string
          data_retention_preference?: string | null
          email: string
          full_name?: string | null
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          id: string
          last_active?: string
          lopd_consent?: boolean
          preferred_language?: string | null
        }
        Update: {
          created_at?: string
          data_retention_preference?: string | null
          email?: string
          full_name?: string | null
          gdpr_consent?: boolean
          gdpr_consent_date?: string | null
          id?: string
          last_active?: string
          lopd_consent?: boolean
          preferred_language?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_overall_progress: {
        Args: {
          component_progress: Json
        }
        Returns: number
      }
      cleanup_expired_ai_contexts: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_exam_questions_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_exam_session_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_progress_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      update_user_answers_timestamp: {
        Args: Record<PropertyKey, never>
        Returns: unknown
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

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never