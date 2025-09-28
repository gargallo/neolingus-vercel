/**
 * T015: Contract Test - GET /api/academia/exams/sessions/[sessionId]
 * 
 * Tests the API contract for retrieving a specific exam session.
 * This test validates the complete API contract including:
 * - Authentication and authorization
 * - Ownership validation (users can only access their own sessions)
 * - Response structure with ExamSession details
 * - Session timing and responses inclusion
 * - Error scenarios (404 for non-existent sessions)
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { GET } from "../../../app/api/academia/exams/sessions/[sessionId]/route";
import { NextRequest } from "next/server";

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  maybeSingle: vi.fn(),
};

// Mock dependencies
vi.mock("../../../utils/supabase/server", () => ({
  createSupabaseClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

vi.mock("../../../../../../utils/auth", () => ({
  verifyToken: vi.fn(),
}));

describe("T015: Contract Test - GET /api/academia/exams/sessions/[sessionId]", () => {
  const TEST_SESSION_ID = "session_550e8400-e29b-41d4-a716-446655440000";
  const TEST_COURSE_ID = "course_550e8400-e29b-41d4-a716-446655440001";
  const TEST_USER_ID = "user_123";
  const OTHER_USER_ID = "user_456";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Success Cases", () => {
    it("should return 200 with ExamSession details for valid session", async () => {
      // Mock authentication
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock session retrieval
      const mockSession = {
        id: TEST_SESSION_ID,
        user_id: TEST_USER_ID,
        course_id: TEST_COURSE_ID,
        session_type: "practice",
        component: "reading",
        started_at: "2025-09-11T10:00:00Z",
        completed_at: null,
        duration_seconds: 1800, // 30 minutes
        score: null,
        responses: [
          {
            questionId: "q1",
            userAnswer: "A",
            correctAnswer: "A",
            isCorrect: true,
            timeSpent: 45,
            timestamp: "2025-09-11T10:05:00Z"
          },
          {
            questionId: "q2",
            userAnswer: "B",
            correctAnswer: "C",
            isCorrect: false,
            timeSpent: 60,
            timestamp: "2025-09-11T10:06:00Z"
          }
        ],
        detailed_scores: {
          vocabulary: 0.8,
          grammar: 0.6,
          comprehension: 0.9
        },
        improvement_suggestions: [
          "Focus on grammar rules for conditionals",
          "Practice reading comprehension with technical texts"
        ],
        is_completed: false,
        session_data: {
          examConfig: {
            certificationModule: TEST_COURSE_ID,
            component: "reading",
            sessionType: "practice",
            questionCount: 10,
            timeLimit: 30,
            questionSelection: {
              strategy: "random",
              excludeRecentQuestions: false,
            },
            scoringMethod: {
              algorithm: "simple",
              passingScore: 60,
              partialCreditEnabled: true,
              penaltyForGuessing: false,
            },
            adaptiveMode: false,
            allowReview: true,
            showProgress: true,
            randomizeQuestions: true,
            randomizeOptions: true,
          },
          startTime: "2025-09-11T10:00:00Z",
          allowedTime: 30,
          currentQuestionIndex: 2,
          questionsAttempted: 2,
          timeRemaining: 1680, // 28 minutes in seconds
        },
        created_at: "2025-09-11T10:00:00Z",
        updated_at: "2025-09-11T10:06:00Z"
      };

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: mockSession,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: {
          "authorization": "Bearer valid-token"
        }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      // Contract validations
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();

      const sessionData = responseData.data;

      // Validate ExamSession object structure
      expect(sessionData).toHaveProperty("id", TEST_SESSION_ID);
      expect(sessionData).toHaveProperty("user_id", TEST_USER_ID);
      expect(sessionData).toHaveProperty("course_id", TEST_COURSE_ID);
      expect(sessionData).toHaveProperty("session_type", "practice");
      expect(sessionData).toHaveProperty("component", "reading");
      expect(sessionData).toHaveProperty("started_at");
      expect(sessionData).toHaveProperty("duration_seconds");
      expect(sessionData).toHaveProperty("responses");
      expect(sessionData).toHaveProperty("detailed_scores");
      expect(sessionData).toHaveProperty("improvement_suggestions");
      expect(sessionData).toHaveProperty("is_completed");
      expect(sessionData).toHaveProperty("session_data");

      // Validate data types
      expect(typeof sessionData.id).toBe("string");
      expect(typeof sessionData.user_id).toBe("string");
      expect(typeof sessionData.course_id).toBe("string");
      expect(typeof sessionData.session_type).toBe("string");
      expect(typeof sessionData.component).toBe("string");
      expect(typeof sessionData.started_at).toBe("string");
      expect(typeof sessionData.duration_seconds).toBe("number");
      expect(Array.isArray(sessionData.responses)).toBe(true);
      expect(typeof sessionData.detailed_scores).toBe("object");
      expect(Array.isArray(sessionData.improvement_suggestions)).toBe(true);
      expect(typeof sessionData.is_completed).toBe("boolean");
      expect(typeof sessionData.session_data).toBe("object");

      // Validate session timing and responses inclusion
      expect(sessionData.duration_seconds).toBe(1800);
      expect(sessionData.responses).toHaveLength(2);
      
      // Validate response structure
      sessionData.responses.forEach((response: any) => {
        expect(response).toHaveProperty("questionId");
        expect(response).toHaveProperty("userAnswer");
        expect(response).toHaveProperty("correctAnswer");
        expect(response).toHaveProperty("isCorrect");
        expect(response).toHaveProperty("timeSpent");
        expect(response).toHaveProperty("timestamp");
        expect(typeof response.isCorrect).toBe("boolean");
        expect(typeof response.timeSpent).toBe("number");
      });

      // Validate session_data includes timing information
      expect(sessionData.session_data).toHaveProperty("startTime");
      expect(sessionData.session_data).toHaveProperty("allowedTime");
      expect(sessionData.session_data).toHaveProperty("currentQuestionIndex");
      expect(sessionData.session_data).toHaveProperty("questionsAttempted");
      expect(sessionData.session_data).toHaveProperty("timeRemaining");
    });

    it("should return completed session with final scores", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      const completedSession = {
        id: TEST_SESSION_ID,
        user_id: TEST_USER_ID,
        course_id: TEST_COURSE_ID,
        session_type: "mock_exam",
        component: "writing",
        started_at: "2025-09-11T10:00:00Z",
        completed_at: "2025-09-11T11:30:00Z",
        duration_seconds: 5400, // 90 minutes
        score: 0.75,
        responses: [],
        detailed_scores: {
          task_achievement: 0.8,
          coherence_cohesion: 0.7,
          lexical_resource: 0.75,
          grammatical_accuracy: 0.7
        },
        improvement_suggestions: [
          "Work on sentence variety for better coherence",
          "Expand vocabulary for academic writing"
        ],
        is_completed: true,
        session_data: {
          examConfig: {
            certificationModule: TEST_COURSE_ID,
            component: "writing",
            sessionType: "mock_exam",
            questionCount: 2,
            timeLimit: 90
          },
          startTime: "2025-09-11T10:00:00Z",
          allowedTime: 90,
          finalScore: 0.75,
          timeUsed: 5400
        }
      };

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: completedSession,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.data.is_completed).toBe(true);
      expect(responseData.data.completed_at).toBe("2025-09-11T11:30:00Z");
      expect(responseData.data.score).toBe(0.75);
      expect(responseData.data.session_data.finalScore).toBe(0.75);
    });
  });

  describe("Authentication", () => {
    it("should return 401 when no authorization header", async () => {
      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET"
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Unauthorized");
    });

    it("should return 401 when token is invalid", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer invalid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Invalid token");
    });
  });

  describe("Ownership Validation", () => {
    it("should only allow access to user's own sessions", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock session owned by different user - this should return null due to user_id filter
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Exam session not found");

      // Verify the query includes user_id filter for ownership
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
    });

    it("should verify database query includes ownership filter", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: { id: TEST_SESSION_ID, user_id: TEST_USER_ID },
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      // Verify the query chain includes proper filters
      expect(mockSupabaseClient.from).toHaveBeenCalledWith("exam_sessions");
      expect(mockSupabaseClient.select).toHaveBeenCalledWith("*");
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("id", TEST_SESSION_ID);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith("user_id", TEST_USER_ID);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent sessions", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock no session found
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: null
      });

      const request = new NextRequest("http://localhost:3000/api/academia/exams/sessions/non-existent-session", {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: "non-existent-session" })
      });

      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Exam session not found");
    });

    it("should handle database connection errors", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock database connection error
      mockSupabaseClient.maybeSingle.mockRejectedValue(new Error("Database connection failed"));

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Internal server error");
    });

    it("should handle database query errors", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      // Mock database query error
      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: null,
        error: { code: "PGRST204", message: "The query failed" }
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe("Failed to fetch exam session");
    });
  });

  describe("Response Data Validation", () => {
    it("should include all required session timing fields", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      const sessionWithTiming = {
        id: TEST_SESSION_ID,
        user_id: TEST_USER_ID,
        course_id: TEST_COURSE_ID,
        session_type: "diagnostic",
        component: "listening",
        started_at: "2025-09-11T10:00:00Z",
        completed_at: null,
        duration_seconds: 900, // 15 minutes elapsed
        is_completed: false,
        session_data: {
          startTime: "2025-09-11T10:00:00Z",
          allowedTime: 45, // 45 minutes total
          timeRemaining: 1800, // 30 minutes remaining
          currentQuestionIndex: 5,
          questionsAttempted: 5
        },
        responses: []
      };

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: sessionWithTiming,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();
      const sessionData = responseData.data;

      // Validate timing information is present
      expect(sessionData.started_at).toBeDefined();
      expect(sessionData.duration_seconds).toBe(900);
      expect(sessionData.session_data.startTime).toBe("2025-09-11T10:00:00Z");
      expect(sessionData.session_data.allowedTime).toBe(45);
      expect(sessionData.session_data.timeRemaining).toBe(1800);
      expect(sessionData.session_data.currentQuestionIndex).toBe(5);
      expect(sessionData.session_data.questionsAttempted).toBe(5);
    });

    it("should include responses with proper structure", async () => {
      const { verifyToken } = await import("../../../../../../utils/auth");
      vi.mocked(verifyToken).mockResolvedValue({ id: TEST_USER_ID, email: "test@example.com" });

      const sessionWithResponses = {
        id: TEST_SESSION_ID,
        user_id: TEST_USER_ID,
        responses: [
          {
            questionId: "q1",
            userAnswer: "A",
            correctAnswer: "A",
            isCorrect: true,
            timeSpent: 30,
            timestamp: "2025-09-11T10:02:30Z"
          },
          {
            questionId: "q2",
            userAnswer: "B",
            correctAnswer: "C",
            isCorrect: false,
            timeSpent: 45,
            timestamp: "2025-09-11T10:03:15Z"
          }
        ]
      };

      mockSupabaseClient.maybeSingle.mockResolvedValue({
        data: sessionWithResponses,
        error: null
      });

      const request = new NextRequest(`http://localhost:3000/api/academia/exams/sessions/${TEST_SESSION_ID}`, {
        method: "GET",
        headers: { "authorization": "Bearer valid-token" }
      });

      const response = await GET(request, {
        params: Promise.resolve({ sessionId: TEST_SESSION_ID })
      });

      const responseData = await response.json();
      const responses = responseData.data.responses;

      expect(Array.isArray(responses)).toBe(true);
      expect(responses).toHaveLength(2);

      responses.forEach((response: any) => {
        expect(response).toHaveProperty("questionId");
        expect(response).toHaveProperty("userAnswer");
        expect(response).toHaveProperty("correctAnswer");
        expect(response).toHaveProperty("isCorrect");
        expect(response).toHaveProperty("timeSpent");
        expect(response).toHaveProperty("timestamp");

        expect(typeof response.questionId).toBe("string");
        expect(typeof response.userAnswer).toBe("string");
        expect(typeof response.correctAnswer).toBe("string");
        expect(typeof response.isCorrect).toBe("boolean");
        expect(typeof response.timeSpent).toBe("number");
        expect(typeof response.timestamp).toBe("string");
      });
    });
  });
});