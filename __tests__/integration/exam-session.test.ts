import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExamSessionIntegration } from "@/lib/integration/exam-session";
import { createMockSupabaseClient } from "@/__tests__/helpers/supabase";
import { mockUser } from "@/__tests__/helpers/auth";

describe("Exam Session Integration Test", () => {
  let examSession: ExamSessionIntegration;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    examSession = new ExamSessionIntegration(mockSupabase);
  });

  it("should create a new exam session for a user", async () => {
    // Arrange
    const examData = {
      course_id: "english-b2-eoi",
      exam_type: "reading",
      title: "Reading Practice Test 1",
      duration: 60,
    };

    const mockSession = {
      id: "session_123",
      user_id: mockUser.id,
      course_id: examData.course_id,
      exam_type: examData.exam_type,
      title: examData.title,
      status: "started",
      started_at: new Date().toISOString(),
      time_limit: examData.duration,
      current_question_index: 0,
    };

    mockSupabase.from("exam_sessions").insert.mockResolvedValue({
      data: [mockSession],
      error: null,
    });

    // Act
    const result = await examSession.createExamSession(mockUser.id, examData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("session_123");
    expect(result.data.status).toBe("started");
    expect(result.data.current_question_index).toBe(0);
  });

  it("should retrieve exam questions for a session", async () => {
    // Arrange
    const sessionId = "session_123";
    const mockQuestions = [
      {
        id: "q1",
        session_id: sessionId,
        question_number: 1,
        question_text: "What is the capital of France?",
        question_type: "multiple_choice",
        options: ["London", "Berlin", "Paris", "Madrid"],
        correct_answer: "Paris",
        points: 1,
      },
      {
        id: "q2",
        session_id: sessionId,
        question_number: 2,
        question_text: "Write a short paragraph about your daily routine.",
        question_type: "written_response",
        points: 5,
      },
    ];

    mockSupabase.from("exam_questions").select().eq().order.mockResolvedValue({
      data: mockQuestions,
      error: null,
    });

    // Act
    const result = await examSession.getExamQuestions(sessionId);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].question_number).toBe(1);
    expect(result.data[1].question_type).toBe("written_response");
  });

  it("should save user answers during an exam session", async () => {
    // Arrange
    const answerData = {
      session_id: "session_123",
      question_id: "q1",
      answer: "Paris",
      answered_at: new Date().toISOString(),
    };

    const mockAnswer = {
      id: "answer_456",
      ...answerData,
      is_correct: true,
      points_earned: 1,
    };

    mockSupabase.from("user_answers").insert.mockResolvedValue({
      data: [mockAnswer],
      error: null,
    });

    // Act
    const result = await examSession.saveUserAnswer(answerData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.is_correct).toBe(true);
    expect(result.data.points_earned).toBe(1);
  });

  it("should complete an exam session and calculate results", async () => {
    // Arrange
    const sessionId = "session_123";
    const completedAt = new Date().toISOString();

    const mockCompletedSession = {
      id: sessionId,
      user_id: mockUser.id,
      course_id: "english-b2-eoi",
      exam_type: "reading",
      status: "completed",
      started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      completed_at: completedAt,
      time_limit: 60,
      score: 85,
      max_score: 100,
    };

    mockSupabase
      .from("exam_sessions")
      .update()
      .eq()
      .select()
      .single.mockResolvedValue({
        data: mockCompletedSession,
        error: null,
      });

    // Act
    const result = await examSession.completeExamSession(sessionId);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
    expect(result.data.completed_at).toBe(completedAt);
    expect(result.data.score).toBe(85);
  });

  it("should handle database errors when creating exam session", async () => {
    // Arrange
    const examData = {
      course_id: "english-b2-eoi",
      exam_type: "reading",
      title: "Reading Practice Test 1",
      duration: 60,
    };

    const errorMessage = "Failed to create exam session";
    mockSupabase.from("exam_sessions").insert.mockResolvedValue({
      data: null,
      error: new Error(errorMessage),
    });

    // Act
    const result = await examSession.createExamSession(mockUser.id, examData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
  });

  it("should retrieve exam session history for a user", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const mockSessions = [
      {
        id: "session_123",
        user_id: mockUser.id,
        course_id: courseId,
        exam_type: "reading",
        title: "Reading Practice Test 1",
        status: "completed",
        started_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        completed_at: new Date(Date.now() - 86300000).toISOString(), // 1 day ago + 100 seconds
        score: 85,
        max_score: 100,
      },
      {
        id: "session_456",
        user_id: mockUser.id,
        course_id: courseId,
        exam_type: "listening",
        title: "Listening Practice Test 1",
        status: "in_progress",
        started_at: new Date().toISOString(),
        time_limit: 45,
      },
    ];

    mockSupabase
      .from("exam_sessions")
      .select()
      .eq()
      .eq()
      .order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

    // Act
    const result = await examSession.getExamSessionHistory(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].status).toBe("completed");
    expect(result.data[1].status).toBe("in_progress");
  });
});
