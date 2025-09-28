import { SupabaseClient } from "@supabase/supabase-js";

export class CourseSelectionIntegration {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async getCoursesByLanguage(language: string) {
    try {
      const { data, error } = await this.supabase
        .from("courses")
        .select("*")
        .eq("language", language)
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

  async enrollUserInCourse(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("user_course_enrollments")
        .insert([
          {
            user_id: userId,
            course_id: courseId,
            enrolled_at: new Date().toISOString(),
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

  async initializeUserProgress(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("user_course_progress")
        .insert([
          {
            user_id: userId,
            course_id: courseId,
            overall_progress: 0,
            last_accessed: new Date().toISOString(),
            created_at: new Date().toISOString(),
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
}
