import { describe, it, expect, beforeEach, vi } from "vitest";
import { CourseSelectionIntegration } from "@/lib/integration/course-selection";
import { SupabaseClient } from "@supabase/supabase-js";
import { mockUser } from "@/__tests__/helpers/auth";
import { createMockSupabaseClient } from "@/__tests__/helpers/supabase";

// Mock Supabase client
vi.mock("@/utils/supabase/client", () => ({
  createClient: vi.fn().mockReturnValue(createMockSupabaseClient()),
}));

describe("Course Selection Integration Test", () => {
  let courseSelection: CourseSelectionIntegration;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    courseSelection = new CourseSelectionIntegration(
      mockSupabase as unknown as SupabaseClient
    );
  });

  it("should allow a new user to browse available courses by language", async () => {
    // Arrange
    const mockCourses = [
      {
        id: "english-b2-eoi",
        language: "English",
        level: "B2",
        provider: "EOI",
        title: "English B2 - EOI Certification",
        description: "Official EOI English B2 certification preparation course",
        exam_types: ["reading", "writing", "listening", "speaking"],
        created_at: new Date().toISOString(),
      },
      {
        id: "english-c1-eoi",
        language: "English",
        level: "C1",
        provider: "EOI",
        title: "English C1 - EOI Certification",
        description: "Official EOI English C1 certification preparation course",
        exam_types: ["reading", "writing", "listening", "speaking"],
        created_at: new Date().toISOString(),
      },
    ];

    mockSupabase.from("courses").select.mockResolvedValue({
      data: mockCourses,
      error: null,
    });

    // Act
    const result = await courseSelection.getCoursesByLanguage("English");

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].language).toBe("English");
    expect(result.data[0].level).toBe("B2");
    expect(mockSupabase.from).toHaveBeenCalledWith("courses");
  });

  it("should allow a user to select a course and create enrollment", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const mockEnrollment = {
      id: "enrollment_123",
      user_id: mockUser.id,
      course_id: courseId,
      enrolled_at: new Date().toISOString(),
      status: "active",
    };

    mockSupabase.from("user_course_enrollments").insert.mockResolvedValue({
      data: [mockEnrollment],
      error: null,
    });

    // Act
    const result = await courseSelection.enrollUserInCourse(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("enrollment_123");
    expect(result.data.user_id).toBe(mockUser.id);
    expect(result.data.course_id).toBe(courseId);
    expect(mockSupabase.from).toHaveBeenCalledWith("user_course_enrollments");
  });

  it("should initialize user progress when enrolling in a course", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const mockProgress = {
      id: "progress_456",
      user_id: mockUser.id,
      course_id: courseId,
      overall_progress: 0,
      last_accessed: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    mockSupabase.from("user_course_progress").insert.mockResolvedValue({
      data: [mockProgress],
      error: null,
    });

    // Act
    const result = await courseSelection.initializeUserProgress(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.overall_progress).toBe(0);
    expect(result.data.user_id).toBe(mockUser.id);
    expect(result.data.course_id).toBe(courseId);
    expect(mockSupabase.from).toHaveBeenCalledWith("user_course_progress");
  });

  it("should handle database errors gracefully", async () => {
    // Arrange
    const errorMessage = "Database connection failed";
    mockSupabase.from("courses").select.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    });

    // Act
    const result = await courseSelection.getCoursesByLanguage("English");

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
  });

  it("should return empty array when no courses are available for a language", async () => {
    // Arrange
    mockSupabase.from("courses").select.mockResolvedValue({
      data: [],
      error: null,
    });

    // Act
    const result = await courseSelection.getCoursesByLanguage("German");

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
  });
});
