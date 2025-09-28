import { SupabaseClient } from "@supabase/supabase-js";

export class ExamSessionIntegration {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async createExamSession(
    userId: string,
    examData: {
      course_id: string;
      exam_type: string;
      title: string;
      duration: number;
    }
  ) {
    try {
      const { data, error } = await this.supabase
        .from("exam_sessions")
        .insert([
          {
            user_id: userId,
            course_id: examData.course_id,
            exam_type: examData.exam_type,
            title: examData.title,
            status: "started",
            started_at: new Date().toISOString(),
            time_limit: examData.duration,
            current_question_index: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async getExamQuestions(sessionId: string) {
    try {
      const { data, error } = await this.supabase
        .from("exam_questions")
        .select("*")
        .eq("session_id", sessionId)
        .order("question_number", { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async saveUserAnswer(answerData: {
    session_id: string;
    question_id: string;
    answer: string;
    answered_at: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from("user_answers")
        .insert([
          {
            session_id: answerData.session_id,
            question_id: answerData.question_id,
            answer: answerData.answer,
            answered_at: answerData.answered_at,
          },
        ])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async completeExamSession(sessionId: string) {
    try {
      const { data, error } = await this.supabase
        .from("exam_sessions")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async getExamSessionHistory(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .order("started_at", { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }
}
