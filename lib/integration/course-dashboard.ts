import { SupabaseClient } from "@supabase/supabase-js";

export class CourseDashboardIntegration {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async validateCourseAccess(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("user_course_enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: "User is not enrolled in this course",
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

  async getCourseDashboardData(userId: string, courseId: string) {
    try {
      // Validate access first
      const accessValidation = await this.validateCourseAccess(
        userId,
        courseId
      );
      if (!accessValidation.success) {
        return accessValidation;
      }

      // Fetch course details
      const { data: course, error: courseError } = await this.supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) {
        return {
          success: false,
          error: courseError.message,
        };
      }

      // Fetch user progress
      const { data: progress, error: progressError } = await this.supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      if (progressError) {
        return {
          success: false,
          error: progressError.message,
        };
      }

      // Fetch available exams
      const { data: exams, error: examsError } = await this.supabase
        .from("exam_sessions")
        .select("*")
        .eq("course_id", courseId);

      if (examsError) {
        return {
          success: false,
          error: examsError.message,
        };
      }

      return {
        success: true,
        data: {
          course,
          progress,
          exams,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async updateLastAccessed(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("user_course_progress")
        .update({ last_accessed: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("course_id", courseId)
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

  async getExamStatistics(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase.rpc("get_exam_statistics", {
        user_id: userId,
        course_id: courseId,
      });

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
