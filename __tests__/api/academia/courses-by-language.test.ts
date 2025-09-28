/**
 * Contract Test: GET /api/academia/courses/by-language/[language] (T010)
 * 
 * Tests the API contract for retrieving courses by specific language
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

describe("Contract Test: GET /api/academia/courses/by-language/[language]", () => {
  const BASE_URL = "/api/academia/courses/by-language";
  
  let mockSupabaseClient: any;
  let mockVerifyToken: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase client mock
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(), 
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
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
      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english"
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "english" }),
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
      
      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english",
        {
          headers: {
            authorization: "Bearer invalid_token",
          },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "english" }),
      });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: "Invalid token",
      });
    });
  });

  describe("Language Filtering", () => {
    it("should return courses for valid language (english)", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const mockCourses = [
        {
          id: "course_english_b1",
          language: "english",
          level: "b1",
          certification_type: "eoi",
          title: "English B1",
          description: "Pre-intermediate English",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
        {
          id: "course_english_b2",
          language: "english",
          level: "b2",
          certification_type: "eoi",
          title: "English B2",
          description: "Intermediate English",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: mockCourses,
        error: null,
      });

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "english" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockCourses,
      });
      
      // Verify all courses are in English
      data.data.forEach((course: any) => {
        expect(course.language).toBe("english");
        validateCourseSchema(course);
      });
      
      // Verify database query
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("courses");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("language", "english");
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("level");
    });

    it("should return courses for valid language (valenciano)", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const mockCourses = [
        {
          id: "course_valenciano_b1",
          language: "valenciano",
          level: "b1",
          certification_type: "jqcv",
          title: "Valencià B1",
          description: "Pre-intermedi de Valencià",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: mockCourses,
        error: null,
      });

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/valenciano",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "valenciano" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      
      // Verify all courses are in Valenciano
      data.data.forEach((course: any) => {
        expect(course.language).toBe("valenciano");
        validateCourseSchema(course);
      });
    });

    it("should return empty array for unsupported language", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock empty result for unsupported language
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/french",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "french" }),
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: [],
      });
    });

    it("should return courses ordered by level (A1 to C2)", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const mockCourses = [
        {
          id: "course_english_a2",
          language: "english",
          level: "a2",
          certification_type: "eoi",
          title: "English A2",
          description: "Elementary English",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
        {
          id: "course_english_b1",
          language: "english",
          level: "b1",
          certification_type: "eoi",
          title: "English B1",
          description: "Pre-intermediate English",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: mockCourses,
        error: null,
      });

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      await GET(request, {
        params: Promise.resolve({ language: "english" }),
      });
      
      // Verify ordering query was applied
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("level");
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      // Mock database error
      mockSupabaseClient.order.mockResolvedValue({
        data: null,
        error: { message: "Connection timeout" },
      });

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "english" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to fetch courses",
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      mockVerifyToken.mockRejectedValue(new Error("Unexpected auth error"));

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "english" }),
      });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Internal server error",
      });
    });
  });

  describe("Language Validation", () => {
    it("should support Phase 1 languages (english, valenciano)", async () => {
      const validLanguages = ["english", "valenciano"];
      
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      mockSupabaseClient.order.mockResolvedValue({
        data: [],
        error: null,
      });

      for (const language of validLanguages) {
        const { GET } = await import(
          "../../../../app/api/academia/courses/by-language/[language]/route"
        );
        
        const request = new NextRequest(
          `http://localhost:3000/api/academia/courses/by-language/${language}`,
          {
            headers: { authorization: "Bearer valid_token" },
          }
        );

        const response = await GET(request, {
          params: Promise.resolve({ language }),
        });

        expect(response.status).toBe(200);
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith("language", language);
      }
    });

    it("should maintain proper certification mapping", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const englishCourses = [
        {
          id: "course_english_b2",
          language: "english",
          level: "b2",
          certification_type: "eoi",
          title: "English B2",
          description: "Intermediate English",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: englishCourses,
        error: null,
      });

      const { GET } = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      const request = new NextRequest(
        "http://localhost:3000/api/academia/courses/by-language/english",
        {
          headers: { authorization: "Bearer valid_token" },
        }
      );

      const response = await GET(request, {
        params: Promise.resolve({ language: "english" }),
      });
      const data = await response.json();
      
      // Contract: English courses should have EOI certification
      data.data.forEach((course: any) => {
        expect(course.language).toBe("english");
        expect(course.certification_type).toBe("eoi");
      });
    });
  });

  describe("HTTP Method Support", () => {
    it("should only support GET method", async () => {
      const routeModule = await import(
        "../../../../app/api/academia/courses/by-language/[language]/route"
      );
      
      expect(routeModule.GET).toBeDefined();
      expect(routeModule.POST).toBeUndefined();
      expect(routeModule.PUT).toBeUndefined();
      expect(routeModule.DELETE).toBeUndefined();
      expect(routeModule.PATCH).toBeUndefined();
    });
  });
});

// Helper function to validate course schema
function validateCourseSchema(course: any) {
  expect(course).toHaveProperty("id");
  expect(typeof course.id).toBe("string");
  
  expect(course).toHaveProperty("language");
  expect(["english", "valenciano"]).toContain(course.language);
  
  expect(course).toHaveProperty("level");
  expect(["a1", "a2", "b1", "b2", "c1", "c2"]).toContain(course.level);
  
  expect(course).toHaveProperty("certification_type");
  expect(["eoi", "jqcv", "delf", "goethe", "cils"]).toContain(course.certification_type);
  
  expect(course).toHaveProperty("title");
  expect(typeof course.title).toBe("string");
  expect(course.title.length).toBeGreaterThan(0);
  
  expect(course).toHaveProperty("description");
  expect(typeof course.description).toBe("string");
  
  expect(course).toHaveProperty("components");
  expect(Array.isArray(course.components)).toBe(true);
  expect(course.components.length).toBeGreaterThan(0);
  
  course.components.forEach((component: string) => {
    expect(["reading", "writing", "listening", "speaking"]).toContain(component);
  });
  
  expect(course).toHaveProperty("is_active");
  expect(typeof course.is_active).toBe("boolean");
}