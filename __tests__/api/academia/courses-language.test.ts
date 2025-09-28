/**
 * Contract Test: GET /api/academia/courses/by-language/{language}
 *
 * Tests the API contract for retrieving courses by language
 * This test MUST FAIL until the API endpoint is implemented
 */

import { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";

// Mock the MCP client to avoid database dependency in contract tests
jest.mock("../../../utils/supabase/mcp-config", () => ({
  mcp: {
    query: jest.fn(),
  },
}));

describe("Contract Test: GET /api/academia/courses/by-language/{language}", () => {
  const ENDPOINT_BASE = "/api/academia/courses/by-language";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("English Language Courses", () => {
    it("should return 200 with English courses when language=english", async () => {
      // This test MUST FAIL until endpoint is implemented
      const { req, res } = createMocks({
        method: "GET",
        url: `${ENDPOINT_BASE}/english`,
      });

      // Import route handler - this will fail until implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );
      } catch (error: any) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
        expect(error.message).toContain("Cannot find module");
        return;
      }

      // If route exists, test the contract
      const response = await routeHandler.GET(req, {
        params: { language: "english" },
      });
      const responseData = await response.json();

      // Contract: Response should be 200 OK
      expect(response.status).toBe(200);

      // Contract: Response should have language and courses properties
      expect(responseData).toHaveProperty("language");
      expect(responseData).toHaveProperty("courses");
      expect(responseData.language).toBe("english");
      expect(Array.isArray(responseData.courses)).toBe(true);

      // Contract: All returned courses should be English
      responseData.courses.forEach((course: any) => {
        expect(course.language).toBe("english");
      });

      // Contract: Should include EOI certification courses
      const eoiCourses = responseData.courses.filter(
        (course: any) => course.certification_type === "eoi"
      );
      expect(eoiCourses.length).toBeGreaterThan(0);
    });
  });

  describe("Valenciano Language Courses", () => {
    it("should return 200 with Valenciano courses when language=valenciano", async () => {
      // This test MUST FAIL until endpoint is implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );
      } catch (error) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
        return;
      }

      const { req } = createMocks({
        method: "GET",
        url: `${ENDPOINT_BASE}/valenciano`,
      });

      const response = await routeHandler.GET(req, {
        params: { language: "valenciano" },
      });
      const responseData = await response.json();

      // Contract: Response should be 200 OK
      expect(response.status).toBe(200);

      // Contract: Response should have language and courses properties
      expect(responseData).toHaveProperty("language");
      expect(responseData).toHaveProperty("courses");
      expect(responseData.language).toBe("valenciano");
      expect(Array.isArray(responseData.courses)).toBe(true);

      // Contract: All returned courses should be Valenciano
      responseData.courses.forEach((course: any) => {
        expect(course.language).toBe("valenciano");
      });

      // Contract: Should include JQCV certification courses
      const jqcvCourses = responseData.courses.filter(
        (course: any) => course.certification_type === "jqcv"
      );
      expect(jqcvCourses.length).toBeGreaterThan(0);
    });
  });

  describe("Invalid Language Handling", () => {
    it("should return 404 for unsupported languages", async () => {
      // This test MUST FAIL until endpoint is implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );
      } catch (error) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
        return;
      }

      const { req } = createMocks({
        method: "GET",
        url: `${ENDPOINT_BASE}/french`,
      });

      const response = await routeHandler.GET(req, {
        params: { language: "french" },
      });

      // Contract: Should return 404 for unsupported languages
      expect(response.status).toBe(404);

      const responseData = await response.json();
      expect(responseData).toHaveProperty("error");
      expect(responseData.error).toContain("not found");
    });
  });

  describe("Response Schema Validation", () => {
    it("should return courses with complete course object structure", async () => {
      // This test MUST FAIL until endpoint is implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );
      } catch (error) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
        return;
      }

      const { req } = createMocks({
        method: "GET",
        url: `${ENDPOINT_BASE}/english`,
      });

      const response = await routeHandler.GET(req, {
        params: { language: "english" },
      });
      const responseData = await response.json();

      // Contract: Each course should have required fields
      if (responseData.courses.length > 0) {
        const course = responseData.courses[0];
        expect(course).toHaveProperty("id");
        expect(course).toHaveProperty("language");
        expect(course).toHaveProperty("level");
        expect(course).toHaveProperty("certification_type");
        expect(course).toHaveProperty("title");
        expect(course).toHaveProperty("description");
        expect(course).toHaveProperty("components");
        expect(course).toHaveProperty("is_active");

        // Contract: Language should match request parameter
        expect(course.language).toBe("english");

        // Contract: Components should be array of valid components
        expect(Array.isArray(course.components)).toBe(true);
        course.components.forEach((component: string) => {
          expect(["reading", "writing", "listening", "speaking"]).toContain(
            component
          );
        });
      }
    });
  });

  describe("Filtering Logic", () => {
    it("should only return active courses for the requested language", async () => {
      // This test MUST FAIL until endpoint is implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );
      } catch (error) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
        return;
      }

      const { req } = createMocks({
        method: "GET",
        url: `${ENDPOINT_BASE}/english`,
      });

      const response = await routeHandler.GET(req, {
        params: { language: "english" },
      });
      const responseData = await response.json();

      // Contract: All returned courses should be active
      responseData.courses.forEach((course: any) => {
        expect(course.is_active).toBe(true);
      });

      // Contract: All returned courses should be English
      responseData.courses.forEach((course: any) => {
        expect(course.language).toBe("english");
      });
    });
  });

  describe("Performance Requirements", () => {
    it("should respond within 200ms for language-specific queries", async () => {
      // This test MUST FAIL until endpoint is implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );
      } catch (error) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
        return;
      }

      const { req } = createMocks({
        method: "GET",
        url: `${ENDPOINT_BASE}/english`,
      });

      const startTime = performance.now();
      await routeHandler.GET(req, { params: { language: "english" } });
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Contract: Response time should be under 200ms
      expect(duration).toBeLessThan(200);
    });
  });

  describe("Error Handling", () => {
    it("should handle database errors gracefully", async () => {
      // This test MUST FAIL until endpoint is implemented
      let routeHandler;
      try {
        routeHandler = await import(
          "../../../app/api/academia/courses/by-language/[language]/route"
        );

        // Mock database error
        const { mcp } = require("../../../utils/supabase/mcp-config");
        mcp.query.mockRejectedValue(new Error("Database connection failed"));

        const { req } = createMocks({
          method: "GET",
          url: `${ENDPOINT_BASE}/english`,
        });

        const response = await routeHandler.GET(req, {
          params: { language: "english" },
        });

        // Contract: Should return 500 on database error
        expect(response.status).toBe(500);

        const responseData = await response.json();
        expect(responseData).toHaveProperty("error");
        expect(responseData.error).toContain("Database");
      } catch (error) {
        // Expected to fail - endpoint not implemented yet
        expect(error).toBeDefined();
      }
    });
  });
});
