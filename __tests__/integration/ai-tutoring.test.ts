import { describe, it, expect, beforeEach, vi } from "vitest";
import { AITutoringIntegration } from "@/lib/integration/ai-tutoring";
import { AITutorService } from "@/lib/ai-agents/services/ai-tutor-service";
import { createMockSupabaseClient } from "@/__tests__/helpers/supabase";
import { mockUser } from "@/__tests__/helpers/auth";

// Mock the AI Tutor Service
vi.mock("@/lib/ai-agents/services/ai-tutor-service", () => ({
  AITutorService: vi.fn().mockImplementation(() => ({
    createSession: vi.fn(),
    sendMessage: vi.fn(),
    endSession: vi.fn(),
    getConversationHistory: vi.fn(),
  })),
}));

describe("AI Tutoring Integration Test", () => {
  let aiTutoring: AITutoringIntegration;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockAITutorService: InstanceType<typeof AITutorService>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    mockAITutorService = new (AITutorService as any)();
    aiTutoring = new AITutoringIntegration(mockSupabase, mockAITutorService);
  });

  it("should create a new AI tutoring session with AI SDK", async () => {
    // Arrange
    const sessionData = {
      userId: mockUser.id,
      courseId: "english-b2-eoi",
      topic: "Reading Comprehension",
    };

    const mockSession = {
      id: "ai_session_123",
      userId: mockUser.id,
      courseId: sessionData.courseId,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTutorSession = {
      id: "tutor_session_456",
      user_id: mockUser.id,
      course_id: sessionData.courseId,
      ai_session_metadata: {
        session_id: mockSession.id,
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        created_at: new Date().toISOString(),
      },
      topic: sessionData.topic,
      started_at: new Date().toISOString(),
      status: "active",
    };

    mockAITutorService.createSession.mockResolvedValue(mockSession);

    mockSupabase.from("ai_tutor_sessions").insert.mockResolvedValue({
      data: [mockTutorSession],
      error: null,
    });

    // Act
    const result = await aiTutoring.startTutoringSession(sessionData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.id).toBe("tutor_session_456");
    expect(result.data.ai_session_metadata.session_id).toBe("ai_session_123");
    expect(mockAITutorService.createSession).toHaveBeenCalledWith({
      userId: mockUser.id,
      courseId: sessionData.courseId,
      topic: sessionData.topic,
    });
  });

  it("should send a message to the AI tutor and receive a response", async () => {
    // Arrange
    const messageData = {
      sessionId: "tutor_session_456",
      aiSessionId: "ai_session_123",
      userId: mockUser.id,
      courseId: "english-b2-eoi",
      message:
        "Can you explain how to approach inference questions in reading?",
    };

    const mockResponse = {
      content:
        "For inference questions, look for clues in the text that suggest meaning without stating it directly.",
      suggestions: ["Look for context clues", "Practice with sample questions"],
      resources: [],
    };

    const mockMessage = {
      id: "message_101",
      session_id: messageData.sessionId,
      sender: "user",
      content: messageData.message,
      timestamp: new Date().toISOString(),
    };

    const mockReply = {
      id: "reply_102",
      session_id: messageData.sessionId,
      sender: "ai",
      content: mockResponse.content,
      timestamp: new Date().toISOString(),
    };

    mockAITutorService.sendMessage.mockResolvedValue(mockResponse);

    mockSupabase.from("ai_tutor_messages").insert.mockImplementation((data) => {
      if (data[0].sender === "user") {
        return Promise.resolve({ data: [mockMessage], error: null });
      } else {
        return Promise.resolve({ data: [mockReply], error: null });
      }
    });

    // Act
    const result = await aiTutoring.sendTutorMessage(messageData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.reply.content).toBe(mockResponse.content);
    expect(mockAITutorService.sendMessage).toHaveBeenCalledWith(
      messageData.aiSessionId,
      messageData.message
    );
  });

  it("should retrieve conversation history for a tutoring session", async () => {
    // Arrange
    const sessionId = "tutor_session_456";
    const mockMessages = [
      {
        id: "message_1",
        session_id: sessionId,
        sender: "user",
        content: "How do I improve my writing?",
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      },
      {
        id: "message_2",
        session_id: sessionId,
        sender: "ai",
        content: "Practice writing essays on various topics and get feedback.",
        timestamp: new Date(Date.now() - 240000).toISOString(), // 4 minutes ago
      },
      {
        id: "message_3",
        session_id: sessionId,
        sender: "user",
        content: "What topics should I focus on?",
        timestamp: new Date().toISOString(),
      },
    ];

    mockSupabase
      .from("ai_tutor_messages")
      .select()
      .eq()
      .order.mockResolvedValue({
        data: mockMessages,
        error: null,
      });

    // Act
    const result = await aiTutoring.getConversationHistory(sessionId);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.data[0].sender).toBe("user");
    expect(result.data[1].sender).toBe("ai");
  });

  it("should end an AI tutoring session properly", async () => {
    // Arrange
    const sessionId = "tutor_session_456";
    const aiSessionId = "ai_session_123";
    const endedAt = new Date().toISOString();

    const mockEndedSession = {
      id: sessionId,
      user_id: mockUser.id,
      course_id: "english-b2-eoi",
      ai_session_metadata: {
        session_id: aiSessionId,
        provider: 'anthropic',
        model: 'claude-3-sonnet-20240229',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      topic: "Reading Comprehension",
      started_at: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      ended_at: endedAt,
      status: "completed",
    };

    mockAITutorService.endSession.mockResolvedValue({ success: true });

    mockSupabase
      .from("ai_tutor_sessions")
      .update()
      .eq()
      .select()
      .single.mockResolvedValue({
        data: mockEndedSession,
        error: null,
      });

    // Act
    const result = await aiTutoring.endTutoringSession(
      sessionId,
      aiSessionId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.status).toBe("completed");
    expect(result.data.ended_at).toBe(endedAt);
    expect(mockAITutorService.endSession).toHaveBeenCalledWith(aiSessionId);
  });

  it("should handle AI service errors gracefully", async () => {
    // Arrange
    const sessionData = {
      userId: mockUser.id,
      courseId: "english-b2-eoi",
      topic: "Reading Comprehension",
    };

    const errorMessage = "AI service unavailable";
    mockAITutorService.createSession.mockRejectedValue(new Error(errorMessage));

    // Act
    const result = await aiTutoring.startTutoringSession(sessionData);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
  });

  it("should retrieve tutoring session history for a user", async () => {
    // Arrange
    const courseId = "english-b2-eoi";
    const mockSessions = [
      {
        id: "session_123",
        user_id: mockUser.id,
        course_id: courseId,
        ai_session_metadata: {
          session_id: "ai_session_123",
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        topic: "Reading Comprehension",
        started_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        ended_at: new Date(Date.now() - 86300000).toISOString(), // 1 day ago + 100 seconds
        status: "completed",
      },
      {
        id: "session_456",
        user_id: mockUser.id,
        course_id: courseId,
        ai_session_metadata: {
          session_id: "ai_session_456",
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          created_at: new Date().toISOString(),
        },
        topic: "Writing Practice",
        started_at: new Date().toISOString(),
        status: "active",
      },
    ];

    mockSupabase
      .from("ai_tutor_sessions")
      .select()
      .eq()
      .eq()
      .order.mockResolvedValue({
        data: mockSessions,
        error: null,
      });

    // Act
    const result = await aiTutoring.getTutoringSessionHistory(
      mockUser.id,
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].status).toBe("completed");
    expect(result.data[1].status).toBe("active");
  });
});