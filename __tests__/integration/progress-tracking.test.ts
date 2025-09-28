import { describe, it, expect, beforeEach, vi } from "vitest";
import { ProgressTrackingIntegration } from "@/lib/integration/progress-tracking";
import { createMockSupabaseClient } from "@/__tests__/helpers/supabase";
import { mockUser } from "@/__tests__/helpers/auth";

describe("Progress Tracking Integration Test", () => {
  let progressTracking: ProgressTrackingIntegration;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    progressTracking = new ProgressTrackingIntegration(mockSupabase);
  });

  it("should calculate and update overall course progress", async () => {
    // Arrange
    const userId = mockUser.id;
    const courseId = "english-b2-eoi";

    const mockProgressData = {
      completed_exams: 3,
      total_exams: 5,
      avg_exam_score: 85,
      last_updated: new Date().toISOString(),
    };

    const mockUpdatedProgress = {
      id: "progress_123",
      user_id: userId,
      course_id: courseId,
      overall_progress: 60,
      last_accessed: new Date().toISOString(),
      created_at: new Date().toISOString(),
      metadata: mockProgressData,
    };

    mockSupabase.rpc.mockResolvedValue({
      data: mockProgressData,
      error: null,
    });

    mockSupabase
      .from("user_course_progress")
      .update()
      .eq()
      .select()
      .single.mockResolvedValue({
        data: mockUpdatedProgress,
        error: null,
      });

    // Act
    const result = await progressTracking.updateCourseProgress(
      userId,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.overall_progress).toBe(60);
    expect(result.data.metadata.completed_exams).toBe(3);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("calculate_course_progress", {
      user_id: userId,
      course_id: courseId,
    });
  });

  it("should retrieve detailed progress analytics for a course", async () => {
    // Arrange
    const userId = mockUser.id;
    const courseId = "english-b2-eoi";

    const mockAnalytics = {
      overall_progress: 75,
      exam_breakdown: {
        reading: { progress: 80, score: 85 },
        writing: { progress: 70, score: 75 },
        listening: { progress: 90, score: 95 },
        speaking: { progress: 60, score: 65 },
      },
      strength_areas: ["listening"],
      improvement_areas: ["speaking"],
      estimated_completion: "2025-10-15",
      last_updated: new Date().toISOString(),
    };

    mockSupabase.rpc.mockResolvedValue({
      data: mockAnalytics,
      error: null,
    });

    // Act
    const result = await progressTracking.getCourseAnalytics(userId, courseId);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.overall_progress).toBe(75);
    expect(result.data.exam_breakdown.reading.progress).toBe(80);
    expect(result.data.strength_areas).toContain("listening");
    expect(result.data.improvement_areas).toContain("speaking");
  });

  it("should track exam performance over time", async () => {
    // Arrange
    const userId = mockUser.id;
    const courseId = "english-b2-eoi";

    const mockPerformanceHistory = [
      {
        exam_id: "exam_1",
        exam_type: "reading",
        score: 75,
        max_score: 100,
        taken_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        time_spent: 45,
      },
      {
        exam_id: "exam_2",
        exam_type: "reading",
        score: 85,
        max_score: 100,
        taken_at: new Date().toISOString(),
        time_spent: 50,
      },
    ];

    mockSupabase
      .from("exam_sessions")
      .select()
      .eq()
      .eq()
      .gte()
      .order.mockResolvedValue({
        data: mockPerformanceHistory,
        error: null,
      });

    // Act
    const result = await progressTracking.getExamPerformanceHistory(
      userId,
      courseId,
      "reading",
      30
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[1].score).toBe(85); // Most recent exam
    expect(result.data[0].score).toBe(75); // Older exam
  });

  it("should generate personalized learning recommendations", async () => {
    // Arrange
    const userId = mockUser.id;
    const courseId = "english-b2-eoi";

    const mockRecommendations = {
      focus_areas: [
        {
          area: "speaking",
          reason: "Low scores in speaking exams",
          recommended_activity: "Practice speaking with AI tutor",
        },
        {
          area: "writing",
          reason: "Inconsistent writing scores",
          recommended_activity: "Complete 3 writing exercises",
        },
      ],
      next_steps: [
        "Take a full practice exam",
        "Review grammar rules for conditionals",
      ],
      resources: [
        {
          title: "Speaking Practice Guide",
          url: "/resources/speaking-guide",
          type: "pdf",
        },
      ],
    };

    mockSupabase.rpc.mockResolvedValue({
      data: mockRecommendations,
      error: null,
    });

    // Act
    const result = await progressTracking.getLearningRecommendations(
      userId,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.focus_areas).toHaveLength(2);
    expect(result.data.focus_areas[0].area).toBe("speaking");
    expect(result.data.next_steps).toHaveLength(2);
    expect(result.data.resources).toHaveLength(1);
  });

  it("should handle database errors when calculating progress", async () => {
    // Arrange
    const userId = mockUser.id;
    const courseId = "english-b2-eoi";
    const errorMessage = "Failed to calculate progress";

    mockSupabase.rpc.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    });

    // Act
    const result = await progressTracking.updateCourseProgress(
      userId,
      courseId
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
  });

  it("should retrieve progress comparison with course averages", async () => {
    // Arrange
    const userId = mockUser.id;
    const courseId = "english-b2-eoi";

    const mockComparison = {
      user_progress: 75,
      course_average: 68,
      user_ranking: "top_25_percent",
      comparison_data: {
        reading: { user: 80, average: 72 },
        writing: { user: 70, average: 65 },
        listening: { user: 90, average: 78 },
        speaking: { user: 60, average: 58 },
      },
    };

    mockSupabase.rpc.mockResolvedValue({
      data: mockComparison,
      error: null,
    });

    // Act
    const result = await progressTracking.getProgressComparison(
      userId,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.user_progress).toBe(75);
    expect(result.data.course_average).toBe(68);
    expect(result.data.user_ranking).toBe("top_25_percent");
  });
});
