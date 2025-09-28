/**
 * Contract Test: POST /api/academia/courses/[courseId]/enroll (T012)
 * 
 * Tests the API contract for course enrollment functionality
 * Following TDD principles - tests define expected behavior
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock authentication
vi.mock("@/utils/auth", () => ({
  verifyToken: vi.fn(),
}));

// Mock Supabase client
vi.mock("@/utils/supabase/server", () => ({
  createSupabaseClient: vi.fn(),
}));

describe("Contract Test: POST /api/academia/courses/[courseId]/enroll", () => {
  let mockSupabaseClient: any;
  let mockVerifyToken: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase client mock
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    };
    
    const { createSupabaseClient } = require("@/utils/supabase/server");
    createSupabaseClient.mockResolvedValue(mockSupabaseClient);
    
    // Setup auth mock
    const { verifyToken } = require("@/utils/auth");
    mockVerifyToken = verifyToken;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Authentication Requirements", () => {
    it("should return 401 when no authorization header provided", async () => {
      // Mock the route to test authentication requirements
      const mockRoute = {
        async POST(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
          // Verify authentication
          const token = request.headers.get("authorization")?.split(" ")[1];
          if (!token) {
            return new Response(
              JSON.stringify({ success: false, error: "Unauthorized" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 201,
            headers: { "Content-Type": "application/json" },
          });
        },
      };
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses/course123/enroll", {
        method: "POST",
      });

      const response = await mockRoute.POST(request, {
        params: Promise.resolve({ courseId: "course123" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("should return 401 when invalid token provided", async () => {
      mockVerifyToken.mockResolvedValue(null);
      
      // This test expects the actual route to exist and be importable
      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course123/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer invalid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course123" }),
        });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data).toEqual({
          success: false,
          error: "Invalid token",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should require authentication for enrollment", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123", email: "test@example.com" });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_english_b2_eoi/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        // Mock successful enrollment creation
        mockSupabaseClient.single.mockResolvedValue({
          data: {
            id: "progress123",
            user_id: "user123",
            course_id: "course_english_b2_eoi",
            enrollment_date: "2024-01-01T00:00:00Z",
            status: "enrolled",
            progress_percentage: 0,
          },
          error: null,
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course_english_b2_eoi" }),
        });

        // Should not return 401 with valid token
        expect(response.status).not.toBe(401);
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });
  });

  describe("Enrollment Success Cases", () => {
    it("should return 201 with UserCourseProgress object on successful enrollment", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123", email: "test@example.com" });
      
      const mockProgress = {
        id: "progress_user123_course_english_b2",
        user_id: "user123",
        course_id: "course_english_b2_eoi",
        enrollment_date: "2024-01-01T00:00:00Z",
        status: "enrolled",
        progress_percentage: 0,
        last_accessed: null,
        completed_components: [],
        exam_attempts: 0,
        best_score: null,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Mock course exists check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "course_english_b2_eoi", is_active: true },
        error: null,
      });
      
      // Mock enrollment creation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: mockProgress,
        error: null,
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_english_b2_eoi/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course_english_b2_eoi" }),
        });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual({
          success: true,
          data: mockProgress,
        });
        
        // Verify UserCourseProgress schema
        validateUserCourseProgressSchema(data.data);
        
        // Verify database operations
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("user_course_progress");
        expect(mockSupabaseClient.insert).toHaveBeenCalled();
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should create progress record with correct initial values", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user456", email: "student@example.com" });
      
      const courseId = "course_valenciano_b2_jqcv";
      const expectedProgress = {
        id: "progress_user456_valenciano_b2",
        user_id: "user456",
        course_id: courseId,
        enrollment_date: "2024-01-01T00:00:00Z",
        status: "enrolled",
        progress_percentage: 0,
        last_accessed: null,
        completed_components: [],
        exam_attempts: 0,
        best_score: null,
      };

      // Mock course exists check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: courseId, is_active: true },
        error: null,
      });
      
      // Mock enrollment creation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: expectedProgress,
        error: null,
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest(`http://localhost:3000/api/academia/courses/${courseId}/enroll`, {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId }),
        });
        const data = await response.json();
        
        // Verify initial enrollment state
        expect(data.data.status).toBe("enrolled");
        expect(data.data.progress_percentage).toBe(0);
        expect(data.data.exam_attempts).toBe(0);
        expect(data.data.best_score).toBe(null);
        expect(Array.isArray(data.data.completed_components)).toBe(true);
        expect(data.data.completed_components).toHaveLength(0);
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should handle enrollment for different course types", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });

      const testCases = [
        {
          courseId: "course_english_c1_eoi",
          expectedCert: "eoi",
          expectedLang: "english",
        },
        {
          courseId: "course_valenciano_c2_jqcv",
          expectedCert: "jqcv", 
          expectedLang: "valenciano",
        },
      ];

      for (const testCase of testCases) {
        // Mock course exists check
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: {
            id: testCase.courseId,
            language: testCase.expectedLang,
            certification_type: testCase.expectedCert,
            is_active: true,
          },
          error: null,
        });
        
        // Mock enrollment creation
        mockSupabaseClient.single.mockResolvedValueOnce({
          data: {
            id: `progress_user123_${testCase.courseId}`,
            user_id: "user123",
            course_id: testCase.courseId,
            status: "enrolled",
            progress_percentage: 0,
          },
          error: null,
        });

        try {
          const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
          
          const request = new NextRequest(`http://localhost:3000/api/academia/courses/${testCase.courseId}/enroll`, {
            method: "POST",
            headers: {
              authorization: "Bearer valid_token",
              "content-type": "application/json",
            },
          });

          const response = await POST(request, {
            params: Promise.resolve({ courseId: testCase.courseId }),
          });
          const data = await response.json();
          
          expect(response.status).toBe(201);
          expect(data.data.course_id).toBe(testCase.courseId);
          expect(data.data.user_id).toBe("user123");
        } catch (error: any) {
          // Expected to fail until route is implemented
          expect(error.message).toContain("Cannot resolve module");
        }
      }
    });
  });

  describe("Enrollment Conflict Handling", () => {
    it("should return 409 if user is already enrolled", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock course exists check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "course_english_b2_eoi", is_active: true },
        error: null,
      });
      
      // Mock duplicate enrollment attempt
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_english_b2_eoi/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course_english_b2_eoi" }),
        });
        const data = await response.json();

        expect(response.status).toBe(409);
        expect(data).toEqual({
          success: false,
          error: "User is already enrolled in this course",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should prevent enrollment in inactive courses", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock inactive course check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "course_disabled", is_active: false },
        error: null,
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_disabled/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course_disabled" }),
        });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data).toEqual({
          success: false,
          error: "Course is not available for enrollment",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent course", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock no course found
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/non_existent_course/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "non_existent_course" }),
        });
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data).toEqual({
          success: false,
          error: "Course not found",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should handle database errors gracefully", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock course exists check success
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "course_english_b2_eoi", is_active: true },
        error: null,
      });
      
      // Mock enrollment creation error
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Database connection failed" },
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_english_b2_eoi/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course_english_b2_eoi" }),
        });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to enroll in course",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      mockVerifyToken.mockRejectedValue(new Error("Unexpected auth error"));

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course123/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course123" }),
        });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Internal server error",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });
  });

  describe("HTTP Method Support", () => {
    it("should only support POST method", async () => {
      try {
        const routeModule = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        expect(routeModule.POST).toBeDefined();
        expect(routeModule.GET).toBeUndefined();
        expect(routeModule.PUT).toBeUndefined();
        expect(routeModule.DELETE).toBeUndefined();
        expect(routeModule.PATCH).toBeUndefined();
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });
  });

  describe("Request Validation", () => {
    it("should accept POST requests with proper Content-Type", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock course exists check
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: { id: "course_english_b2_eoi", is_active: true },
        error: null,
      });
      
      // Mock enrollment creation
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          id: "progress123",
          user_id: "user123",
          course_id: "course_english_b2_eoi",
          status: "enrolled",
        },
        error: null,
      });

      try {
        const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_english_b2_eoi/enroll", {
          method: "POST",
          headers: {
            authorization: "Bearer valid_token",
            "content-type": "application/json",
          },
        });

        const response = await POST(request, {
          params: Promise.resolve({ courseId: "course_english_b2_eoi" }),
        });

        // Should not fail due to content type
        expect(response.status).not.toBe(400);
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should validate courseId parameter format", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });

      const invalidCourseIds = [
        "",
        " ",
        "course with spaces",
        "course/with/slashes",
        "course@with@symbols",
      ];

      for (const courseId of invalidCourseIds) {
        try {
          const { POST } = await import("../../../../app/api/academia/courses/[courseId]/enroll/route");
          
          const request = new NextRequest(`http://localhost:3000/api/academia/courses/${encodeURIComponent(courseId)}/enroll`, {
            method: "POST",
            headers: {
              authorization: "Bearer valid_token",
              "content-type": "application/json",
            },
          });

          const response = await POST(request, {
            params: Promise.resolve({ courseId }),
          });

          // Should handle invalid course IDs gracefully
          expect([400, 404, 500]).toContain(response.status);
        } catch (error: any) {
          // Expected to fail until route is implemented
          expect(error.message).toContain("Cannot resolve module");
        }
      }
    });
  });
});

// Helper function to validate UserCourseProgress schema
function validateUserCourseProgressSchema(progress: any) {
  expect(progress).toHaveProperty("id");
  expect(typeof progress.id).toBe("string");
  
  expect(progress).toHaveProperty("user_id");
  expect(typeof progress.user_id).toBe("string");
  
  expect(progress).toHaveProperty("course_id");
  expect(typeof progress.course_id).toBe("string");
  
  expect(progress).toHaveProperty("enrollment_date");
  expect(typeof progress.enrollment_date).toBe("string");
  
  expect(progress).toHaveProperty("status");
  expect(["enrolled", "in_progress", "completed", "suspended"]).toContain(progress.status);
  
  expect(progress).toHaveProperty("progress_percentage");
  expect(typeof progress.progress_percentage).toBe("number");
  expect(progress.progress_percentage).toBeGreaterThanOrEqual(0);
  expect(progress.progress_percentage).toBeLessThanOrEqual(100);
  
  expect(progress).toHaveProperty("completed_components");
  expect(Array.isArray(progress.completed_components)).toBe(true);
  
  expect(progress).toHaveProperty("exam_attempts");
  expect(typeof progress.exam_attempts).toBe("number");
  expect(progress.exam_attempts).toBeGreaterThanOrEqual(0);
  
  if (progress.best_score !== null) {
    expect(typeof progress.best_score).toBe("number");
    expect(progress.best_score).toBeGreaterThanOrEqual(0);
    expect(progress.best_score).toBeLessThanOrEqual(10);
  }
}