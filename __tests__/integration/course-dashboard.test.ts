import { describe, it, expect, beforeEach, vi } from "vitest";
import { CourseDashboardIntegration } from "@/lib/integration/course-dashboard";
import { createMockSupabaseClient } from "@/__tests__/helpers/supabase";
import { mockUser } from "@/__tests__/helpers/auth";

describe("Course Dashboard Integration Test", () => {
  let courseDashboard: CourseDashboardIntegration;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    courseDashboard = new CourseDashboardIntegration(mockSupabase);
  });

  it("should retrieve course dashboard data for an enrolled user", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const mockCourse = {
      id: courseId,
      language: "English",
      level: "B2",
      provider: "EOI",
      title: "English B2 - EOI Certification",
      description: "Official EOI English B2 certification preparation course",
    };

    const mockProgress = {
      id: "progress_123",
      user_id: mockUser.id,
      course_id: courseId,
      overall_progress: 75,
      last_accessed: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    const mockExams = [
      {
        id: "exam_456",
        course_id: courseId,
        type: "reading",
        title: "Reading Practice Test 1",
        duration: 60,
        max_score: 100,
      },
    ];

    mockSupabase.from("courses").select().eq().single.mockResolvedValue({
      data: mockCourse,
      error: null,
    });

    mockSupabase
      .from("user_course_progress")
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockProgress,
        error: null,
      });

    mockSupabase.from("exam_sessions").select().eq().mockResolvedValue({
      data: mockExams,
      error: null,
    });

    // Act
    const result = await courseDashboard.getCourseDashboardData(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.course.title).toBe("English B2 - EOI Certification");
    expect(result.data.progress.overall_progress).toBe(75);
    expect(result.data.exams).toHaveLength(1);
    expect(result.data.exams[0].type).toBe("reading");
  });

  it("should return error when user is not enrolled in the course", async () => {
    // Arrange
    const courseId = "english-b2-eoi";

    mockSupabase
      .from("user_course_enrollments")
      .select()
      .eq()
      .maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

    // Act
    const result = await courseDashboard.validateCourseAccess(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe("User is not enrolled in this course");
  });

  it("should update last accessed timestamp when accessing dashboard", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const currentTime = new Date().toISOString();

    mockSupabase
      .from("user_course_progress")
      .update()
      .eq()
      .select()
      .single.mockResolvedValue({
        data: {
          id: "progress_123",
          user_id: mockUser.id,
          course_id: courseId,
          overall_progress: 75,
          last_accessed: currentTime,
          created_at: new Date().toISOString(),
        },
        error: null,
      });

    // Act
    const result = await courseDashboard.updateLastAccessed(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.last_accessed).toBe(currentTime);
  });

  it("should handle database errors when retrieving dashboard data", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const errorMessage = "Failed to fetch course data";

    mockSupabase
      .from("courses")
      .select()
      .eq()
      .single.mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });

    // Act
    const result = await courseDashboard.getCourseDashboardData(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
  });

  it("should retrieve exam statistics for the course", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const mockStats = {
      total_exams: 5,
      completed_exams: 3,
      average_score: 85,
      best_score: 95,
    };

    mockSupabase.rpc.mockResolvedValue({
      data: mockStats,
      error: null,
    });

    // Act
    const result = await courseDashboard.getExamStatistics(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.total_exams).toBe(5);
    expect(result.data.completed_exams).toBe(3);
    expect(result.data.average_score).toBe(85);
  });
});
