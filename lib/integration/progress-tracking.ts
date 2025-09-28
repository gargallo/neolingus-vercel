import { SupabaseClient } from "@supabase/supabase-js";

export class ProgressTrackingIntegration {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  async updateCourseProgress(userId: string, courseId: string) {
    try {
      // Calculate progress using database function
      const { data: progressData, error: calcError } = await this.supabase.rpc(
        "calculate_course_progress",
        {
          user_id: userId,
          course_id: courseId,
        }
      );

      if (calcError) {
        return {
          success: false,
          error: calcError.message,
        };
      }

      // Update progress record
      const { data, error: updateError } = await this.supabase
        .from("user_course_progress")
        .update({
          overall_progress: Math.round(
            (progressData.completed_exams / progressData.total_exams) * 100
          ),
          last_accessed: new Date().toISOString(),
          metadata: progressData,
        })
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .select()
        .single();

      if (updateError) {
        return {
          success: false,
          error: updateError.message,
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

  async getCourseAnalytics(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase.rpc("get_course_analytics", {
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

  async getExamPerformanceHistory(
    userId: string,
    courseId: string,
    examType: string,
    daysBack: number
  ) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await this.supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("exam_type", examType)
        .gte("completed_at", startDate.toISOString())
        .order("taken_at", { ascending: true });

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

  async getLearningRecommendations(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_learning_recommendations",
        {
          user_id: userId,
          course_id: courseId,
        }
      );

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

  async getProgressComparison(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase.rpc(
        "get_progress_comparison",
        {
          user_id: userId,
          course_id: courseId,
        }
      );

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
