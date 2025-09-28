/**
 * Contract Test: GET /api/academia/courses (T009)
 * 
 * Tests the API contract for retrieving available courses
 * Following TDD principles - tests define expected behavior
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";

// Mock authentication
vi.mock("../../../../utils/auth", () => ({
  verifyToken: vi.fn(),
}));

// Mock Supabase client
vi.mock("@/utils/supabase/server", () => ({
  createSupabaseClient: vi.fn(),
}));

describe("Contract Test: GET /api/academia/courses", () => {
  const ENDPOINT_URL = "/api/academia/courses";
  
  let mockSupabaseClient: any;
  let mockVerifyToken: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup Supabase client mock
    mockSupabaseClient = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(), 
      order: vi.fn().mockReturnThis(),
    };
    
    const { createSupabaseClient } = require("@/utils/supabase/server");
    createSupabaseClient.mockResolvedValue(mockSupabaseClient);
    
    // Setup auth mock
    const { verifyToken } = require("../../../../utils/auth");
    mockVerifyToken = verifyToken;
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Authentication Requirements", () => {
    it("should return 401 when no authorization header provided", async () => {
      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: {},
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: "Unauthorized",
      });
    });

    it("should return 401 when invalid token provided", async () => {
      mockVerifyToken.mockResolvedValue(null);
      
      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: {
          authorization: "Bearer invalid_token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual({
        success: false,
        error: "Invalid token",
      });
    });
  });

  describe("Success Response Schema", () => {
    it("should return 200 with valid courses array when authenticated", async () => {
      // Setup successful authentication
      mockVerifyToken.mockResolvedValue({
        id: "user123",
        email: "test@example.com",
      });
      
      // Setup successful database response
      const mockCourses = [
        {
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
        },
        {
          id: "course_valenciano_b2_jqcv",
          language: "valenciano",
          level: "b2",
          certification_type: "jqcv",
          title: "Valencià B2 - JQCV Preparation",
          description: "Intermediate Valenciano course for JQCV certification",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: mockCourses,
        error: null,
      });

      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: {
          authorization: "Bearer valid_token",
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockCourses,
      });
      
      // Verify API contract schema
      expect(Array.isArray(data.data)).toBe(true);
      
      // Validate each course object structure
      data.data.forEach((course: any) => {
        validateCourseSchema(course);
      });
    });

    it("should validate course schema structure", async () => {
      mockVerifyToken.mockResolvedValue({ id: "user123" });
      
      const mockCourse = {
        id: "course_english_c1_eoi",
        language: "english",
        level: "c1",
        certification_type: "eoi",
        title: "English C1 Advanced",
        description: "Advanced English course",
        components: ["reading", "writing", "listening", "speaking"],
        is_active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };
      
      mockSupabaseClient.order.mockResolvedValue({
        data: [mockCourse],
        error: null,
      });

      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: { authorization: "Bearer valid_token" },
      });

      const response = await GET(request);
      const data = await response.json();
      
      const course = data.data[0];
      
      // Validate all required fields exist and have correct types
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
    });

    it("should return courses ordered by language and level", async () => {
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
          id: "course_valenciano_b2", 
          language: "valenciano",
          level: "b2",
          certification_type: "jqcv",
          title: "Valencià B2",
          description: "Intermediate Valenciano",
          components: ["reading", "writing", "listening", "speaking"],
          is_active: true,
        },
      ];
      
      mockSupabaseClient.order.mockResolvedValue({
        data: mockCourses,
        error: null,
      });

      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: { authorization: "Bearer valid_token" },
      });

      await GET(request);
      
      // Verify the ordering query was called correctly
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("courses");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("*");
      expect(mockSupabaseClient.order).toHaveBeenCalledWith("language");
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

      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: { authorization: "Bearer valid_token" },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Failed to fetch courses",
      });
    });

    it("should handle unexpected errors gracefully", async () => {
      mockVerifyToken.mockRejectedValue(new Error("Unexpected auth error"));

      const { GET } = await import("../../../../app/api/academia/courses/route");
      
      const request = new NextRequest("http://localhost:3000/api/academia/courses", {
        method: "GET",
        headers: { authorization: "Bearer valid_token" },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        success: false,
        error: "Internal server error",
      });
    });
  });

  describe("HTTP Method Support", () => {
    it("should only support GET method", async () => {
      const routeModule = await import("../../../../app/api/academia/courses/route");
      
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

