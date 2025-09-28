/**
 * T013: Contract Test - GET /api/academia/progress/[courseId]
 * 
 * Tests the API contract for retrieving user course progress.
 * This test validates the complete API contract including:
 * - Authentication and authorization
 * - Response structure and data types
 * - Progress value constraints (0.0-1.0)
 * - User enrollment validation
 * - Error scenarios
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../../../app/api/academia/progress/[courseId]/route";
import { NextRequest } from "next/server";

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  maybeSingle: vi.fn(),
};

// Mock dependencies
vi.mock("../../../utils/supabase/server", () => ({
  createSupabaseClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock("../../../../utils/auth", () => ({
  verifyToken: vi.fn(),
}));

describe("T013: Contract Test - GET /api/academia/progress/[courseId]", () => {
  const TEST_COURSE_ID = "550e8400-e29b-41d4-a716-446655440000";
  const TEST_USER_ID = "user_123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should return 200 with UserCourseProgress object for enrolled user", async () => {
      // Mock authentication
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock enrollment check
      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: { id: "enrollment_123" }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: "progress_123",
            user_id: TEST_USER_ID,
            course_id: TEST_COURSE_ID,
            enrollment_date: "2025-09-10T10:00:00Z",
            last_activity: "2025-09-11T14:30:00Z",
            overall_progress: 0.65,
            component_progress: {
              reading: 0.7,
              writing: 0.6,
              listening: 0.65,
              speaking: 0.55
            },
            strengths: ["vocabulary", "grammar"],
            weaknesses: ["pronunciation", "listening_speed"],
            readiness_score: 0.62,
            estimated_study_hours: 45,
            analytics: {
              totalSessions: 15,
              totalTimeSpent: 900,
              averageScore: 0.75,
              bestScore: 0.95,
              consistencyScore: 0.8,
              improvementRate: 0.15,
              componentAnalysis: {
                reading: {
                  sessionsCompleted: 5,
                  averageScore: 0.8,
                  bestScore: 0.95,
                  timeSpentMinutes: 250,
                  improvementTrend: "improving",
                  skillBreakdown: { vocabulary: 0.85, comprehension: 0.75 },
                  recommendedFocus: ["reading_speed", "complex_texts"]
                }
              },
              learningVelocity: 0.05
            }
          },
          error: null
        });

      // Create request
      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET",
        headers: {
          "authorization": "Bearer valid-token"
        }
      });

      // Execute request
      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();

      // Contract validations
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      const progressData = responseData.data.progress;
      
      // Validate required fields
      expect(progressData).toHaveProperty("id");
      expect(progressData).toHaveProperty("user_id", TEST_USER_ID);
      expect(progressData).toHaveProperty("course_id", TEST_COURSE_ID);
      expect(progressData).toHaveProperty("enrollment_date");
      expect(progressData).toHaveProperty("last_activity");
      expect(progressData).toHaveProperty("overall_progress");
      expect(progressData).toHaveProperty("component_progress");
      expect(progressData).toHaveProperty("strengths");
      expect(progressData).toHaveProperty("weaknesses");
      expect(progressData).toHaveProperty("readiness_score");
      expect(progressData).toHaveProperty("estimated_study_hours");

      // Validate data types
      expect(typeof progressData.id).toBe("string");
      expect(typeof progressData.user_id).toBe("string");
      expect(typeof progressData.course_id).toBe("string");
      expect(typeof progressData.enrollment_date).toBe("string");
      expect(typeof progressData.last_activity).toBe("string");
      expect(typeof progressData.overall_progress).toBe("number");
      expect(typeof progressData.component_progress).toBe("object");
      expect(Array.isArray(progressData.strengths)).toBe(true);
      expect(Array.isArray(progressData.weaknesses)).toBe(true);
      expect(typeof progressData.readiness_score).toBe("number");
      expect(typeof progressData.estimated_study_hours).toBe("number");

      // Validate progress values are 0.0-1.0
      expect(progressData.overall_progress).toBeGreaterThanOrEqual(0.0);
      expect(progressData.overall_progress).toBeLessThanOrEqual(1.0);
      expect(progressData.readiness_score).toBeGreaterThanOrEqual(0.0);
      expect(progressData.readiness_score).toBeLessThanOrEqual(1.0);

      // Validate component progress structure and ranges
      expect(progressData.component_progress).toHaveProperty("reading");
      expect(progressData.component_progress).toHaveProperty("writing");
      expect(progressData.component_progress).toHaveProperty("listening");
      expect(progressData.component_progress).toHaveProperty("speaking");

      Object.values(progressData.component_progress as Record<string, number>).forEach(score => {
        expect(typeof score).toBe("number");
        expect(score).toBeGreaterThanOrEqual(0.0);
        expect(score).toBeLessThanOrEqual(1.0);
      });

      // Validate analytics structure
      expect(responseData.data.analytics).toBeDefined();
      expect(responseData.data.analytics.totalSessions).toBeGreaterThanOrEqual(0);
      expect(responseData.data.analytics.componentAnalysis).toBeDefined();
    });

    it("should create default progress record if none exists", async () => {
      // Mock authentication
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock enrollment exists but no progress record
      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: { id: "enrollment_123" }, error: null })
        .mockResolvedValueOnce({ data: null, error: null });

      // Mock successful progress creation
      mockSupabaseClient.select = vi.fn(() => mockSupabaseClient);
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: {
          id: "new_progress_123",
          user_id: TEST_USER_ID,
          course_id: TEST_COURSE_ID,
          overall_progress: 0,
          component_progress: {},
          analytics: {
            totalSessions: 0,
            componentAnalysis: {
              reading: { sessionsCompleted: 0, averageScore: 0 }
            }
          }
        },
        error: null
      });

      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data.progress.overall_progress).toBe(0);
    });
  });

  describe("Authentication", () => {
    it("should return 401 when no authorization header", async () => {
      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET"
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid", async () => {
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET",
        headers: { "authorization": "Bearer invalid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Invalid token");
    });
  });

  describe("Authorization", () => {
    it("should require user enrollment in course", async () => {
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock no enrollment found
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(403);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Not enrolled in this course");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent course", async () => {
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock enrollment check error (course doesn't exist)
      mockSupabaseClient.maybeSingle.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "The result contains 0 rows" }
      });

      const request = new NextRequest("http://localhost:3000/api/academia/progress/non-existent-course", {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: "non-existent-course" })
      });

      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Failed to verify enrollment");
    });

    it("should handle database connection errors", async () => {
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock database connection error
      mockSupabaseClient.maybeSingle.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Internal server error");
    });
  });

  describe("Data Validation", () => {
    it("should validate all progress values are within valid ranges", async () => {
      const { verifyToken } = await import("../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock progress data with edge case values
      mockSupabaseClient.maybeSingle
        .mockResolvedValueOnce({ data: { id: "enrollment_123" }, error: null })
        .mockResolvedValueOnce({
          data: {
            id: "progress_123",
            user_id: TEST_USER_ID,
            course_id: TEST_COURSE_ID,
            overall_progress: 1.0, // Maximum value
            component_progress: {
              reading: 0.0,  // Minimum value
              writing: 0.5,  // Middle value
              listening: 1.0, // Maximum value
              speaking: 0.33  // Fractional value
            },
            readiness_score: 0.0, // Minimum value
            strengths: [],
            weaknesses: [],
            estimated_study_hours: 0,
            analytics: {
              totalSessions: 0,
              componentAnalysis: {
                reading: { sessionsCompleted: 0, averageScore: 0 }
              }
            }
          },
          error: null
        });

      const request = new NextRequest("http://localhost:3000/api/academia/progress/" + TEST_COURSE_ID, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ courseId: TEST_COURSE_ID })
      });

      const responseData = await response.json();
      const progressData = responseData.data.progress;

      // Validate all values are in valid ranges
      expect(progressData.overall_progress).toBe(1.0);
      expect(progressData.component_progress.reading).toBe(0.0);
      expect(progressData.component_progress.writing).toBe(0.5);
      expect(progressData.component_progress.listening).toBe(1.0);
      expect(progressData.component_progress.speaking).toBe(0.33);
      expect(progressData.readiness_score).toBe(0.0);
    });
  });
});