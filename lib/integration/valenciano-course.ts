import { SupabaseClient } from "@supabase/supabase-js";

export class ValencianoCourseIntegration {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async getValencianoCourses() {
    try {
      const { data, error } = await this.supabase
        .from("courses")
        .select("*")
        .eq("language", "Valenciano")
        .order("level");

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

  async checkJQCVCompliance(courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("course_compliance")
        .select("*")
        .eq("course_id", courseId)
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

  async getValencianoExamSimulations(courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("exam_sessions")
        .select("*")
        .eq("course_id", courseId)
        .order("exam_type");

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

  async startValencianoTutoring(tutoringData: {
    userId: string;
    courseId: string;
    topic: string;
  }) {
    try {
      const { data, error } = await this.supabase
        .from("ai_tutor_sessions")
        .insert([
          {
            user_id: tutoringData.userId,
            course_id: tutoringData.courseId,
            topic: tutoringData.topic,
            language: "Valenciano",
            dialect: "valencià",
            started_at: new Date().toISOString(),
            status: "active",
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

  async getValencianoCulturalContent(courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("cultural_content")
        .select("*")
        .eq("course_id", courseId)
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
}
