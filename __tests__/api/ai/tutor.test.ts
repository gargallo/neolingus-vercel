import { describe, it, expect, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/ai/tutor/chat/route";
import { AITutorService } from "@/lib/ai-agents/services/ai-tutor-service";
import { createMockContext } from "@/__tests__/helpers/context";
import { mockUser } from "@/__tests__/helpers/auth";

// Mock the AI Tutor Service
vi.mock("@/lib/ai-agents/services/ai-tutor-service", () => ({
  AITutorService: vi.fn().mockImplementation(() => ({
    sendMessage: vi.fn(),
    createSession: vi.fn(),
    endSession: vi.fn(),
    getConversationHistory: vi.fn(),
  })),
}));

// Mock auth utilities
vi.mock("@/utils/auth", () => ({
  verifyToken: vi.fn().mockResolvedValue(mockUser),
}));

describe("POST /api/ai/tutor/chat", () => {
  const mockContext = createMockContext();
  const mockAITutorService = new (AITutorService as any)();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock request data
    mockContext.json = vi.fn().mockResolvedValue({
      message: "How do I prepare for the speaking section?",
      sessionId: "session_123",
      courseId: "course_456",
    });
  });

  it("should successfully send a message to the AI tutor and return response", async () => {
    // Arrange
    const mockResponse = {
      content:
        "To prepare for the speaking section, practice describing images and expressing opinions.",
      suggestions: ["Practice with native speakers", "Record yourself speaking"],
      resources: [],
    };

    mockAITutorService.sendMessage.mockResolvedValue(mockResponse);

    // Act
    const response = await POST(mockContext.req as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(responseBody).toEqual({
      success: true,
      data: {
        message: mockResponse.content,
        sessionId: "session_123",
        suggestions: mockResponse.suggestions,
        resources: mockResponse.resources,
      },
    });
    expect(mockAITutorService.sendMessage).toHaveBeenCalledWith(
      "session_123",
      "How do I prepare for the speaking section?"
    );
  });

  it("should create a new session when sessionId is not provided", async () => {
    // Arrange
    mockContext.json = vi.fn().mockResolvedValue({
      message: "What are the exam requirements?",
      courseId: "course_456",
    });

    const mockSession = {
      id: "new_session_123",
      userId: mockUser.id,
      courseId: "course_456",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockResponse = {
      content:
        "The exam requirements include reading, writing, listening, and speaking sections.",
      suggestions: ["Review the official syllabus", "Practice all four skills"],
      resources: [],
    };

    mockAITutorService.createSession.mockResolvedValue(mockSession);
    mockAITutorService.sendMessage.mockResolvedValue(mockResponse);

    // Act
    const response = await POST(mockContext.req as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(mockAITutorService.createSession).toHaveBeenCalledWith({
      userId: mockUser.id,
      courseId: "course_456",
      topic: "General tutoring",
    });
    expect(mockAITutorService.sendMessage).toHaveBeenCalledWith(
      "new_session_123",
      "What are the exam requirements?"
    );
    expect(responseBody.data.sessionId).toBe("new_session_123");
  });

  it("should return 400 error when message is missing", async () => {
    // Arrange
    mockContext.json = vi.fn().mockResolvedValue({
      courseId: "course_456",
    });

    // Act
    const response = await POST(mockContext.req as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "Message is required",
    });
  });

  it("should return 400 error when courseId is missing", async () => {
    // Arrange
    mockContext.json = vi.fn().mockResolvedValue({
      message: "How do I prepare for the exam?",
      sessionId: "session_123",
    });

    // Act
    const response = await POST(mockContext.req as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(responseBody).toEqual({
      success: false,
      error: "Course ID is required",
    });
  });

  it("should return 401 error when user is not authenticated", async () => {
    // Arrange
    vi.mock("@/utils/auth", () => ({
      verifyToken: vi.fn().mockResolvedValue(null),
    }));

    // Act
    const response = await POST(mockContext.req as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(responseBody).toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("should return 500 error when AI service fails", async () => {
    // Arrange
    const errorMessage = "AI service unavailable";
    mockAITutorService.sendMessage.mockRejectedValue(new Error(errorMessage));

    // Act
    const response = await POST(mockContext.req as any);
    const responseBody = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(responseBody).toEqual({
      success: false,
      error: "Internal server error",
    });
  });
});