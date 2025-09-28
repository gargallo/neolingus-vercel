import {
  UserProgress,
  ComponentAnalysis,
} from "@/lib/exam-engine/types";
import { createSupabaseClient } from "@/utils/supabase/server";

export class ProgressCalculator {
  /**
   * Calculate overall course progress based on completed exams
   */
  async calculateCourseProgress(
    userId: string,
    courseId: string
  ): Promise<UserProgress> {
    try {
      const supabase = await createSupabaseClient();

      // Fetch exam sessions for this user and course
      const { data: examSessions, error: sessionsError } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId);

      if (sessionsError) {
        throw new Error(
          `Failed to fetch exam sessions: ${sessionsError.message}`
        );
      }

      // Calculate progress metrics
      const totalExams = examSessions?.length || 0;
      const completedExams =
        examSessions?.filter((session) => session.is_completed).length || 0;

      const avgScore =
        examSessions && examSessions.length > 0
          ? examSessions.reduce((sum, session) => {
              return sum + (session.score || 0);
            }, 0) / examSessions.length
          : 0;

      // Calculate overall progress (0.0 to 1.0 scale)
      const overallProgress = totalExams > 0 ? completedExams / totalExams : 0;

      // Initialize component progress as empty record
      const componentProgress: Record<string, number> = {};

      return {
        id: `progress_${userId}_${courseId}`,
        userId,
        courseId,
        enrollmentDate: new Date(),
        lastActivity: new Date(),
        overallProgress,
        componentProgress,
        strengths: [],
        weaknesses: [],
        readinessScore: overallProgress,
        estimatedStudyHours: 0,
        analytics: {
          totalSessions: totalExams,
          totalTimeSpent: 0,
          averageScore: avgScore,
          bestScore: 0,
          consistencyScore: 0,
          improvementRate: 0,
          componentAnalysis: {
            reading: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
            writing: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
            listening: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
            speaking: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
          },
          learningVelocity: 0,
        },
      };
    } catch (_err) {
      console.error("Error calculating course progress");
      throw new Error("Failed to calculate course progress");
    }
  }

  /**
   * Generate detailed progress analytics
   */
  async generateProgressAnalytics(
    userId: string,
    courseId: string
  ): Promise<UserProgress["analytics"]> {
    try {
      const supabase = await createSupabaseClient();

      // Fetch exam sessions with scores
      const { data: examSessions, error: sessionsError } = await supabase
        .from("exam_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .eq("is_completed", true);

      if (sessionsError) {
        throw new Error(
          `Failed to fetch exam sessions: ${sessionsError.message}`
        );
      }

      if (!examSessions || examSessions.length === 0) {
        return {
          totalSessions: 0,
          totalTimeSpent: 0,
          averageScore: 0,
          bestScore: 0,
          consistencyScore: 0,
          improvementRate: 0,
          componentAnalysis: {
            reading: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
            writing: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
            listening: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
            speaking: {
              sessionsCompleted: 0,
              averageScore: 0,
              bestScore: 0,
              timeSpentMinutes: 0,
              improvementTrend: "stable",
              skillBreakdown: {},
              recommendedFocus: [],
            },
          },
          learningVelocity: 0,
        };
      }

      // Group by exam type and calculate averages
      const componentAnalysis: Record<string, ComponentAnalysis> = {
        reading: {
          sessionsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          timeSpentMinutes: 0,
          improvementTrend: "stable",
          skillBreakdown: {},
          recommendedFocus: [],
        },
        writing: {
          sessionsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          timeSpentMinutes: 0,
          improvementTrend: "stable",
          skillBreakdown: {},
          recommendedFocus: [],
        },
        listening: {
          sessionsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          timeSpentMinutes: 0,
          improvementTrend: "stable",
          skillBreakdown: {},
          recommendedFocus: [],
        },
        speaking: {
          sessionsCompleted: 0,
          averageScore: 0,
          bestScore: 0,
          timeSpentMinutes: 0,
          improvementTrend: "stable",
          skillBreakdown: {},
          recommendedFocus: [],
        },
      };

      const componentScores: Record<string, number[]> = {};

      examSessions.forEach((session: Record<string, unknown>) => {
        const component = session.component;
        if (!componentScores[component]) {
          componentScores[component] = [];
        }
        componentScores[component].push(session.score || 0);
      });

      Object.keys(componentScores).forEach((component) => {
        const scores = componentScores[component];
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const bestScore = Math.max(...scores);

        if (componentAnalysis[component]) {
          componentAnalysis[component] = {
            sessionsCompleted: scores.length,
            averageScore: avgScore,
            bestScore: bestScore,
            timeSpentMinutes: scores.length * 30, // Assuming 30 min per session
            improvementTrend: "stable",
            skillBreakdown: {},
            recommendedFocus: [],
          };
        }
      });

      // Calculate overall metrics
      const overallScores = examSessions.map(
        (session: Record<string, unknown>) => session.score || 0
      );
      const overallAvgScore =
        overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
      const bestScore = Math.max(...overallScores);

      return {
        totalSessions: examSessions.length,
        totalTimeSpent: examSessions.length * 30, // Assuming 30 min per session
        averageScore: overallAvgScore,
        bestScore: bestScore,
        consistencyScore: 0,
        improvementRate: 0,
        componentAnalysis,
        learningVelocity: 0,
      };
    } catch (err) {
      console.error("Error generating progress analytics:", err);
      throw new Error("Failed to generate progress analytics");
    }
  }

  /**
   * Generate personalized learning recommendations
   */
  async generateLearningRecommendations(
    userId: string,
    courseId: string,
    analytics: UserProgress["analytics"]
  ): Promise<Record<string, unknown>[]> {
    try {
      const recommendations: Record<string, unknown>[] = [];

      // Get improvement areas from component analysis
      const improvementAreas = Object.entries(analytics.componentAnalysis)
        .filter(([, analysis]) => analysis.averageScore < 70)
        .map(([component]) => component);

      const strengthAreas = Object.entries(analytics.componentAnalysis)
        .filter(([, analysis]) => analysis.averageScore >= 80)
        .map(([component]) => component);

      // Recommendation based on improvement areas
      if (improvementAreas.length > 0) {
        recommendations.push({
          id: `rec_improve_${Date.now()}`,
          type: "focus_area",
          title: "Focus on Improvement Areas",
          description: `You should focus on improving your skills in: ${improvementAreas.join(
            ", "
          )}`,
          priority: "high",
          action: "practice",
          resources: improvementAreas.map((area) => ({
            title: `Practice ${area} exercises`,
            url: `/dashboard/${courseId}/practice/${area}`,
            type: "internal",
          })),
        });
      }

      // Recommendation based on strength areas
      if (strengthAreas.length > 0) {
        recommendations.push({
          id: `rec_strengthen_${Date.now()}`,
          type: "strength_building",
          title: "Build on Your Strengths",
          description: `Continue practicing your strong areas: ${strengthAreas.join(
            ", "
          )} to maintain excellence`,
          priority: "medium",
          action: "practice",
          resources: strengthAreas.map((area) => ({
            title: `Advanced ${area} challenges`,
            url: `/dashboard/${courseId}/advanced/${area}`,
            type: "internal",
          })),
        });
      }

      // General progress recommendation
      if (analytics.averageScore < 50) {
        recommendations.push({
          id: `rec_progress_${Date.now()}`,
          type: "general",
          title: "Study Plan Recommendation",
          description:
            "Create a consistent study schedule to improve your overall progress",
          priority: "high",
          action: "schedule",
          resources: [
            {
              title: "Study planning guide",
              url: "/resources/study-planning",
              type: "pdf",
            },
          ],
        });
      } else if (analytics.averageScore < 80) {
        recommendations.push({
          id: `rec_advance_${Date.now()}`,
          type: "general",
          title: "Advance to Next Level",
          description:
            "Consider taking a full practice exam to test your readiness",
          priority: "medium",
          action: "assessment",
          resources: [
            {
              title: "Full practice exam",
              url: `/dashboard/${courseId}/exam/full-practice`,
              type: "internal",
            },
          ],
        });
      } else {
        recommendations.push({
          id: `rec_excellence_${Date.now()}`,
          type: "general",
          title: "Maintain Excellence",
          description:
            "Continue your excellent progress with regular review sessions",
          priority: "low",
          action: "review",
          resources: [
            {
              title: "Review past exams",
              url: `/dashboard/${courseId}/review`,
              type: "internal",
            },
          ],
        });
      }

      return recommendations;
    } catch (err) {
      console.error("Error generating learning recommendations:", err);
      throw new Error("Failed to generate learning recommendations");
    }
  }

  /**
   * Update progress in the database
   */
  async updateProgressInDatabase(progress: UserProgress): Promise<boolean> {
    try {
      const supabase = await createSupabaseClient();

      // Check if progress record exists
      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_course_progress")
        .select("id")
        .eq("user_id", progress.userId)
        .eq("course_id", progress.courseId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(
          `Failed to check existing progress: ${fetchError.message}`
        );
      }

      if (existingProgress) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("user_course_progress")
          .update({
            overall_progress: progress.overallProgress,
            last_activity: progress.lastActivity,
            analytics: progress.analytics,
          })
          .eq("id", existingProgress.id);

        if (updateError) {
          throw new Error(`Failed to update progress: ${updateError.message}`);
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("user_course_progress")
          .insert([
            {
              user_id: progress.userId,
              course_id: progress.courseId,
              enrollment_date: progress.enrollmentDate,
              last_activity: progress.lastActivity,
              overall_progress: progress.overallProgress,
              component_progress: progress.componentProgress,
              strengths: progress.strengths,
              weaknesses: progress.weaknesses,
              readiness_score: progress.readinessScore,
              estimated_study_hours: progress.estimatedStudyHours,
              analytics: progress.analytics,
            },
          ]);

        if (insertError) {
          throw new Error(
            `Failed to create progress record: ${insertError.message}`
          );
        }
      }

      return true;
    } catch (err) {
      console.error("Error updating progress in database:", err);
      return false;
    }
  }

  /**
   * Get progress comparison with course averages
   */
  async getProgressComparison(userId: string, courseId: string): Promise<Record<string, unknown>> {
    try {
      const supabase = await createSupabaseClient();

      // Get user's progress
      const { data: userProgress, error: userError } = await supabase
        .from("user_course_progress")
        .select("overall_progress")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (userError) {
        throw new Error(`Failed to fetch user progress: ${userError.message}`);
      }

      // Get course average progress
      const { data: courseProgress, error: courseError } = await supabase
        .from("user_course_progress")
        .select("overall_progress")
        .eq("course_id", courseId);

      if (courseError) {
        throw new Error(
          `Failed to fetch course progress: ${courseError.message}`
        );
      }

      const courseAverage =
        courseProgress && courseProgress.length > 0
          ? courseProgress.reduce(
              (sum, progress) => sum + (progress.overall_progress || 0),
              0
            ) / courseProgress.length
          : 0;

      // Determine ranking
      let ranking = "average";
      const userScore = userProgress?.overall_progress || 0;

      if (userScore >= 0.9) {
        ranking = "top_10_percent";
      } else if (userScore >= 0.75) {
        ranking = "top_25_percent";
      } else if (userScore >= 0.5) {
        ranking = "average";
      } else {
        ranking = "below_average";
      }

      return {
        userProgress: userScore,
        courseAverage: courseAverage,
        ranking,
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Error getting progress comparison:", err);
      throw new Error("Failed to get progress comparison");
    }
  }

  static async calculateProgress(
    userId: string,
    courseId: string,
    component: string,
    // Fixed: replaced 'any' with proper type
    answeredQuestions: Array<{ questionId: string; answer: unknown; score?: number }>
  ): Promise<CourseProgress> {
    try {
      const supabase = await createSupabaseClient();

      // Fetch user progress
      let userProgress = await ProgressCalculator.getUserProgress(
        userId,
        courseId
      );

      if (!userProgress) {
        userProgress = await ProgressCalculator.initProgress(
          userId,
          courseId,
          component
        );
      }

      // Calculate component progress
      let componentScore = userProgress.componentProgress[component] || 0;

      answeredQuestions.forEach((question) => {
        componentScore += question.score || 0;
      });

      userProgress.componentProgress[component] = componentScore;

      // Calculate overall progress
      const totalComponents = Object.keys(userProgress.componentProgress).length;
      const completedComponents = Object.entries(
        userProgress.componentProgress
      ).filter(([, score]) => score > 0).length;
      const overallProgress = completedComponents / totalComponents;

      userProgress.overallProgress = overallProgress;
      userProgress.lastActivity = new Date();

      // Update progress in the database
      await ProgressCalculator.updateProgressInDatabase(userProgress);

      return userProgress;
    } catch (err) {
      console.error("Error calculating progress:", err);
      throw new Error("Failed to calculate progress");
    }
  }

  private static async getUserProgress(
    userId: string,
    courseId: string
  ): Promise<UserProgress | null> {
    try {
      const supabase = await createSupabaseClient();

      // Fetch user progress from the database
      const { data: progress, error } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (error) {
        throw new Error(`Failed to fetch user progress: ${error.message}`);
      }

      return progress || null;
    } catch (err) {
      console.error("Error fetching user progress:", err);
      return null;
    }
  }

  private static async initProgress(
    userId: string,
    courseId: string,
    component: string
  ): Promise<UserProgress> {
    try {
      const supabase = await createSupabaseClient();

      // Initialize progress for the user in the database
      const { data: progress, error } = await supabase
        .from("user_course_progress")
        .insert([
          {
            user_id: userId,
            course_id: courseId,
            enrollment_date: new Date(),
            last_activity: new Date(),
            overall_progress: 0,
            component_progress: {
              [component]: 0,
            },
            strengths: [],
            weaknesses: [],
            readiness_score: 0,
            estimated_study_hours: 0,
            analytics: {
              totalSessions: 0,
              totalTimeSpent: 0,
              averageScore: 0,
              bestScore: 0,
              consistencyScore: 0,
              improvementRate: 0,
              componentAnalysis: {
                reading: {
                  sessionsCompleted: 0,
                  averageScore: 0,
                  bestScore: 0,
                  timeSpentMinutes: 0,
                  improvementTrend: "stable",
                  skillBreakdown: {},
                  recommendedFocus: [],
                },
                writing: {
                  sessionsCompleted: 0,
                  averageScore: 0,
                  bestScore: 0,
                  timeSpentMinutes: 0,
                  improvementTrend: "stable",
                  skillBreakdown: {},
                  recommendedFocus: [],
                },
                listening: {
                  sessionsCompleted: 0,
                  averageScore: 0,
                  bestScore: 0,
                  timeSpentMinutes: 0,
                  improvementTrend: "stable",
                  skillBreakdown: {},
                  recommendedFocus: [],
                },
                speaking: {
                  sessionsCompleted: 0,
                  averageScore: 0,
                  bestScore: 0,
                  timeSpentMinutes: 0,
                  improvementTrend: "stable",
                  skillBreakdown: {},
                  recommendedFocus: [],
                },
              },
              learningVelocity: 0,
            },
          },
        ])
        .select("*");

      if (error) {
        throw new Error(
          `Failed to initialize user progress: ${error.message}`
        );
      }

      return progress[0];
    } catch (err) {
      console.error("Error initializing user progress:", err);
      throw new Error("Failed to initialize user progress");
    }
  }
}

// Export a singleton instance
export const progressCalculator = new ProgressCalculator();
