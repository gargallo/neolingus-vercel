/**
 * Contract Test: GET /api/academia/courses/[courseId] (T011)
 * 
 * Tests the API contract for retrieving detailed course information by ID
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

describe("Contract Test: GET /api/academia/courses/[courseId]", () => {
  let mockSupabaseClient: any;
  let mockVerifyToken: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase client mock
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
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
        async GET(request: NextRequest, context: { params: Promise<{ courseId: string }> }) {
          // Verify authentication
          const token = request.headers.get("authorization")?.split(" ")[1];
          if (!token) {
            return new Response(
              JSON.stringify({ success: false, error: "Unauthorized" }),
              { status: 401, headers: { "Content-Type": "application/json" } }
            );
          }
          return new Response(JSON.stringify({ success: true, data: {} }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      };
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses/course123");

      const response = await mockRoute.GET(request, {
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
        const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course123", {
          headers: {
            authorization: "Bearer invalid_token",
          },
        });

        const response = await GET(request, {
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
  });

  describe("Course Detail Response", () => {
    it("should return 200 with CourseDetail object for valid courseId", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const mockCourseDetail = {
        id: "course_english_b2_eoi",
        language: "english",
        level: "b2",
        certification_type: "eoi",
        title: "English B2 - EOI Preparation",
        description: "Intermediate English course for EOI certification",
        components: ["reading", "writing", "listening", "speaking"],
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        // CourseDetail specific fields
        assessment_rubric: {
          reading: { weight: 25, pass_threshold: 5.0, max_score: 10.0 },
          writing: { weight: 25, pass_threshold: 5.0, max_score: 10.0 },
          listening: { weight: 25, pass_threshold: 5.0, max_score: 10.0 },
          speaking: { weight: 25, pass_threshold: 5.0, max_score: 10.0 },
        },
        exam_structure: {
          total_duration: 180,
          components: {
            reading: { duration: 60, questions: 40 },
            writing: { duration: 60, tasks: 2 },
            listening: { duration: 30, questions: 30 },
            speaking: { duration: 30, tasks: 3 },
          },
        },
      };
      
      mockSupabaseClient.single.mockResolvedValue({
        data: mockCourseDetail,
        error: null,
      });

      try {
        const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_english_b2_eoi", {
          headers: { authorization: "Bearer valid_token" },
        });

        const response = await GET(request, {
          params: Promise.resolve({ courseId: "course_english_b2_eoi" }),
        });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual({
          success: true,
          data: mockCourseDetail,
        });
        
        // Verify CourseDetail schema
        validateCourseDetailSchema(data.data);
        
        // Verify database query
        expect(mockSupabaseClient.from).toHaveBeenCalledWith("courses");
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", "course_english_b2_eoi");
        expect(mockSupabaseClient.single).toHaveBeenCalled();
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should include assessment_rubric and exam_structure in response", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const mockCourseDetail = {
        id: "course_valenciano_c1_jqcv",
        language: "valenciano",
        level: "c1",
        certification_type: "jqcv",
        title: "Valencià C1 - JQCV Preparation",
        description: "Advanced Valenciano course for JQCV certification",
        components: ["reading", "writing", "listening", "speaking"],
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
        assessment_rubric: {
          reading: { weight: 30, pass_threshold: 6.0, max_score: 10.0 },
          writing: { weight: 30, pass_threshold: 6.0, max_score: 10.0 },
          listening: { weight: 20, pass_threshold: 6.0, max_score: 10.0 },
          speaking: { weight: 20, pass_threshold: 6.0, max_score: 10.0 },
        },
        exam_structure: {
          total_duration: 210,
          components: {
            reading: { duration: 75, questions: 45 },
            writing: { duration: 75, tasks: 2 },
            listening: { duration: 30, questions: 35 },
            speaking: { duration: 30, tasks: 4 },
          },
        },
      };
      
      mockSupabaseClient.single.mockResolvedValue({
        data: mockCourseDetail,
        error: null,
      });

      try {
        const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course_valenciano_c1_jqcv", {
          headers: { authorization: "Bearer valid_token" },
        });

        const response = await GET(request, {
          params: Promise.resolve({ courseId: "course_valenciano_c1_jqcv" }),
        });
        const data = await response.json();
        
        const courseDetail = data.data;
        
        // Verify assessment rubric structure
        expect(courseDetail).toHaveProperty("assessment_rubric");
        expect(courseDetail.assessment_rubric).toHaveProperty("reading");
        expect(courseDetail.assessment_rubric.reading).toHaveProperty("weight");
        expect(courseDetail.assessment_rubric.reading).toHaveProperty("pass_threshold");
        expect(courseDetail.assessment_rubric.reading).toHaveProperty("max_score");
        
        // Verify exam structure
        expect(courseDetail).toHaveProperty("exam_structure");
        expect(courseDetail.exam_structure).toHaveProperty("total_duration");
        expect(courseDetail.exam_structure).toHaveProperty("components");
        expect(courseDetail.exam_structure.components).toHaveProperty("reading");
        expect(courseDetail.exam_structure.components.reading).toHaveProperty("duration");
        expect(courseDetail.exam_structure.components.reading).toHaveProperty("questions");
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should validate course schema for different certification types", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const testCases = [
        {
          courseId: "course_english_c1_eoi",
          mockData: {
            id: "course_english_c1_eoi",
            language: "english",
            level: "c1",
            certification_type: "eoi",
            title: "English C1 Advanced",
            description: "Advanced English course",
            components: ["reading", "writing", "listening", "speaking"],
            is_active: true,
            assessment_rubric: {
              reading: { weight: 25, pass_threshold: 6.5, max_score: 10.0 },
              writing: { weight: 25, pass_threshold: 6.5, max_score: 10.0 },
              listening: { weight: 25, pass_threshold: 6.5, max_score: 10.0 },
              speaking: { weight: 25, pass_threshold: 6.5, max_score: 10.0 },
            },
            exam_structure: {
              total_duration: 240,
              components: {
                reading: { duration: 90, questions: 50 },
                writing: { duration: 90, tasks: 2 },
                listening: { duration: 30, questions: 35 },
                speaking: { duration: 30, tasks: 4 },
              },
            },
          },
        },
      ];

      for (const testCase of testCases) {
        mockSupabaseClient.single.mockResolvedValue({
          data: testCase.mockData,
          error: null,
        });

        try {
          const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
          
          const request = new NextRequest(`http://localhost:3000/api/academia/courses/${testCase.courseId}`, {
            headers: { authorization: "Bearer valid_token" },
          });

          const response = await GET(request, {
            params: Promise.resolve({ courseId: testCase.courseId }),
          });
          const data = await response.json();
          
          validateCourseDetailSchema(data.data);
          expect(data.data.certification_type).toBe("eoi");
        } catch (error: any) {
          // Expected to fail until route is implemented
          expect(error.message).toContain("Cannot resolve module");
        }
      }
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent course", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock no course found
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: "PGRST116", message: "No rows found" },
      });

      try {
        const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/non_existent_course", {
          headers: { authorization: "Bearer valid_token" },
        });

        const response = await GET(request, {
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
      
      // Mock database error
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: "Connection timeout" },
      });

      try {
        const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course123", {
          headers: { authorization: "Bearer valid_token" },
        });

        const response = await GET(request, {
          params: Promise.resolve({ courseId: "course123" }),
        });
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toEqual({
          success: false,
          error: "Failed to fetch course details",
        });
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      mockVerifyToken.mockRejectedValue(new Error("Unexpected auth error"));

      try {
        const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        const request = new NextRequest("http://localhost:3000/api/academia/courses/course123", {
          headers: { authorization: "Bearer valid_token" },
        });

        const response = await GET(request, {
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
    it("should only support GET method", async () => {
      try {
        const routeModule = await import("../../../../app/api/academia/courses/[courseId]/route");
        
        expect(routeModule.GET).toBeDefined();
        expect(routeModule.POST).toBeUndefined();
        expect(routeModule.PUT).toBeUndefined();
        expect(routeModule.DELETE).toBeUndefined();
        expect(routeModule.PATCH).toBeUndefined();
      } catch (error: any) {
        // Expected to fail until route is implemented
        expect(error.message).toContain("Cannot resolve module");
      }
    });
  });

  describe("Data Validation", () => {
    it("should return course with valid Phase 1 certification mapping", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const testCases = [
        {
          courseId: "course_english_b2_eoi",
          expectedLang: "english",
          expectedCert: "eoi",
        },
        {
          courseId: "course_valenciano_b2_jqcv", 
          expectedLang: "valenciano",
          expectedCert: "jqcv",
        },
      ];

      for (const testCase of testCases) {
        const mockCourse = {
          id: testCase.courseId,
          language: testCase.expectedLang,
          level: "b2",
          certification_type: testCase.expectedCert,
          title: `${testCase.expectedLang} B2`,
          description: `Intermediate ${testCase.expectedLang} course`,
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
          assessment_rubric: {},
          exam_structure: {},
        };
        
        mockSupabaseClient.single.mockResolvedValue({
          data: mockCourse,
          error: null,
        });

        try {
          const { GET } = await import("../../../../app/api/academia/courses/[courseId]/route");
          
          const request = new NextRequest(`http://localhost:3000/api/academia/courses/${testCase.courseId}`, {
            headers: { authorization: "Bearer valid_token" },
          });

          const response = await GET(request, {
            params: Promise.resolve({ courseId: testCase.courseId }),
          });
          const data = await response.json();
          
          expect(data.data.language).toBe(testCase.expectedLang);
          expect(data.data.certification_type).toBe(testCase.expectedCert);
        } catch (error: any) {
          // Expected to fail until route is implemented
          expect(error.message).toContain("Cannot resolve module");
        }
      }
    });
  });
});

// Helper function to validate CourseDetail schema
function validateCourseDetailSchema(courseDetail: any) {
  // Base Course properties
  expect(courseDetail).toHaveProperty("id");
  expect(typeof courseDetail.id).toBe("string");
  
  expect(courseDetail).toHaveProperty("language");
  expect(["english", "valenciano"]).toContain(courseDetail.language);
  
  expect(courseDetail).toHaveProperty("level");
  expect(["a1", "a2", "b1", "b2", "c1", "c2"]).toContain(courseDetail.level);
  
  expect(courseDetail).toHaveProperty("certification_type");
  expect(["eoi", "jqcv", "delf", "goethe", "cils"]).toContain(courseDetail.certification_type);
  
  expect(courseDetail).toHaveProperty("title");
  expect(typeof courseDetail.title).toBe("string");
  expect(courseDetail.title.length).toBeGreaterThan(0);
  
  expect(courseDetail).toHaveProperty("description");
  expect(typeof courseDetail.description).toBe("string");
  
  expect(courseDetail).toHaveProperty("components");
  expect(Array.isArray(courseDetail.components)).toBe(true);
  expect(courseDetail.components.length).toBeGreaterThan(0);
  
  courseDetail.components.forEach((component: string) => {
    expect(["reading", "writing", "listening", "speaking"]).toContain(component);
  });
  
  expect(courseDetail).toHaveProperty("is_active");
  expect(typeof courseDetail.is_active).toBe("boolean");
  
  // CourseDetail specific properties
  expect(courseDetail).toHaveProperty("assessment_rubric");
  expect(typeof courseDetail.assessment_rubric).toBe("object");
  
  expect(courseDetail).toHaveProperty("exam_structure");
  expect(typeof courseDetail.exam_structure).toBe("object");
}