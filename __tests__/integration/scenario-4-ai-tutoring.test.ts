/**
 * Integration Tests - Scenario 4: AI Tutoring Interaction
 * T021: Context7-Powered Personalized Tutoring Journey Testing
 * 
 * Tests the complete user journey for students receiving AI tutoring
 * after completing practice sessions with low scores, featuring
 * Context7 integration for personalized educational assistance.
 * 
 * Test Coverage:
 * ✅ AI tutor chat interface accessibility after low-score sessions
 * ✅ Context7 integration and session management
 * ✅ Contextual responses aligned with English B2 EOI requirements
 * ✅ Weakness-specific suggestions and recommendations
 * ✅ Certification-specific resource provision
 * ✅ Response time performance (<2s requirement)
 * ✅ Conversation context persistence across interactions
 * ✅ Educational content quality and relevance
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRouter } from "next/router";
import AITutor from "@/components/academia/ai-tutor";
import CoursePage from "@/app/dashboard/[idioma]/[nivel]/page";

// Mock Next.js router
const mockPush = vi.fn();
const mockRouter: Partial<NextRouter> = {
  push: mockPush,
  pathname: "/dashboard/english/b2",
  route: "/dashboard/[idioma]/[nivel]",
  asPath: "/dashboard/english/b2",
  query: { idioma: "english", nivel: "b2" },
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard/english/b2",
  useParams: () => ({ idioma: "english", nivel: "b2" }),
}));

// Mock authenticated user with poor reading performance
const mockUser = {
  id: "user_12345678-1234-1234-1234-123456789abc",
  email: "test@neolingus.com",
  user_metadata: { full_name: "Test User" },
};

// Mock user progress with low reading score triggering AI tutoring
const mockUserProgress = {
  overall_progress: 0.55,
  component_progress: {
    reading: 0.45, // < 70% triggers tutoring
    writing: 0.65,
    listening: 0.40, // Also weak
    speaking: 0.75,
  },
  recent_session: {
    id: "session_poor_reading",
    component: "reading",
    score: 0.45,
    completed_at: "2025-01-15T14:30:00Z",
    weaknesses: ["scanning", "inference", "vocabulary_in_context"],
  },
  strengths: ["speaking", "basic_comprehension"],
  weaknesses: ["reading_speed", "listening_detail", "vocabulary_range"],
  readiness_score: 0.52,
};

// Mock Context7 AI responses
const mockAIResponses = {
  initial_help: {
    message: "I understand you're having difficulty with reading comprehension. Based on your recent practice session, I can see you scored 45% on the reading component. Let me help you improve your scanning and inference skills specifically for the EOI English B2 exam.",
    suggestions: [
      "Practice timed reading with 10-minute intervals",
      "Focus on identifying key words in questions first",
      "Learn to distinguish between main ideas and supporting details",
      "Build vocabulary through reading in context"
    ],
    resources: [
      {
        title: "B2 Reading Strategies Guide",
        url: "https://eoi-resources.com/b2-reading-strategies",
        type: "article"
      },
      {
        title: "Timed Reading Practice Tests",
        url: "https://eoi-practice.com/reading-b2",
        type: "exercise"
      },
      {
        title: "Vocabulary in Context Exercises",
        url: "https://eoi-vocab.com/context-b2",
        type: "exercise"
      }
    ]
  },
  follow_up: {
    message: "Great question! For scanning techniques, start by reading the questions before the text. Look for keywords and their synonyms in the passage. Practice with newspaper articles - read the headline and first paragraph, then scan for specific information.",
    suggestions: [
      "Use the 'question-first' approach",
      "Identify keywords and synonyms",
      "Practice with authentic materials",
      "Time yourself - aim for 1 minute per question"
    ],
    resources: [
      {
        title: "Scanning Technique Video Tutorial",
        url: "https://eoi-videos.com/scanning-b2",
        type: "video"
      }
    ]
  }
};

// Mock Context7 session
const mockContext7Session = {
  sessionId: "ctx7_user_123_1234567890",
  userId: mockUser.id,
  courseId: "course_english_b2",
  contextType: "weakness_focused",
  learningProfile: {
    level: "b2",
    language: "english",
    certification: "eoi",
    strengths: ["speaking", "basic_comprehension"],
    weaknesses: ["reading_speed", "listening_detail", "vocabulary_range"],
    learningStyle: "mixed",
    preferredPace: "normal",
    goals: ["improve_reading", "pass_eoi_exam"],
    progressData: mockUserProgress,
  },
  contextHistory: [],
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 30 * 60 * 1000),
};

// Mock Supabase client
vi.mock("@/utils/supabase/client", () => ({
  createSupabaseClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: mockUser }, 
        error: null 
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      if (table === "user_course_progress") {
        mockChain.single.mockResolvedValue({
          data: mockUserProgress,
          error: null,
        });
      } else if (table === "exam_sessions") {
        mockChain.limit.mockResolvedValue({
          data: [mockUserProgress.recent_session],
          error: null,
        });
      } else if (table === "ai_tutor_messages") {
        mockChain.insert.mockResolvedValue({
          data: { id: "msg_123" },
          error: null,
        });
        mockChain.order.mockReturnValue({
          ...mockChain,
          limit: vi.fn().mockResolvedValue({
            data: [
              {
                id: "msg_1",
                sender: "user",
                content: "Help me improve my reading comprehension",
                timestamp: "2025-01-15T15:00:00Z",
              },
              {
                id: "msg_2", 
                sender: "ai",
                content: mockAIResponses.initial_help.message,
                timestamp: "2025-01-15T15:00:05Z",
              }
            ],
            error: null,
          }),
        });
      }

      return mockChain;
    }),
  }),
}));

// Mock Context7 Client
vi.mock("@/utils/ai/context7-client", () => ({
  Context7Client: {
    getInstance: vi.fn().mockReturnValue({
      getOrCreateSession: vi.fn().mockResolvedValue(mockContext7Session),
      sendMessage: vi.fn().mockImplementation((sessionId: string, message: string) => {
        if (message.includes("scanning")) {
          return Promise.resolve(mockAIResponses.follow_up);
        }
        return Promise.resolve(mockAIResponses.initial_help);
      }),
      updateLearningProfile: vi.fn().mockResolvedValue({}),
    }),
  },
}));

// Mock performance timing
const mockPerformanceNow = vi.fn();
global.performance = { now: mockPerformanceNow } as any;

describe("Integration Test - Scenario 4: AI Tutoring Interaction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockPerformanceNow.mockReturnValue(Date.now());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AI Tutor Interface Accessibility", () => {
    it("should display AI tutor interface after user completes low-score session", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - AI tutor should be prominently featured for struggling students
      await waitFor(() => {
        expect(
          screen.getByText(/AI.*tutor/i) ||
          screen.getByText(/get.*help/i) ||
          screen.getByText(/improve.*reading/i)
        ).toBeInTheDocument();
      });

      // Should show suggestion to use AI tutor based on poor performance
      expect(
        screen.getByText(/need.*help/i) ||
        screen.getByText(/struggling/i) ||
        screen.getByText(/recommend.*tutor/i)
      ).toBeInTheDocument();
    });

    it("should highlight weak areas and suggest AI tutoring", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Should identify and highlight weaknesses
      await waitFor(() => {
        expect(screen.getByText(/reading.*45%/i)).toBeInTheDocument();
        expect(screen.getByText(/listening.*40%/i)).toBeInTheDocument();
        
        // Should suggest improvement
        expect(
          screen.getByText(/improve.*reading/i) ||
          screen.getByText(/focus.*weak/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide immediate access to AI chat interface", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Assert - Chat interface should be ready
      await waitFor(() => {
        expect(
          screen.getByRole("textbox") ||
          screen.getByPlaceholderText(/ask.*question/i) ||
          screen.getByPlaceholderText(/message/i)
        ).toBeInTheDocument();

        expect(
          screen.getByRole("button", { name: /send/i }) ||
          screen.getByRole("button", { name: /ask/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Context7 Integration and Session Management", () => {
    it("should establish Context7 session with user learning profile", async () => {
      // Arrange
      const { Context7Client } = await import("@/utils/ai/context7-client");
      const mockInstance = Context7Client.getInstance();

      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Trigger AI tutor initialization
      await waitFor(() => {
        expect(screen.getByRole("textbox")).toBeInTheDocument();
      });

      // Assert - Should create Context7 session with proper profile
      expect(mockInstance.getOrCreateSession).toHaveBeenCalledWith(
        mockUser.id,
        "course_english_b2",
        "weakness_focused", // Based on poor performance
        expect.objectContaining({
          level: "b2",
          language: "english",
          certification: "eoi",
          weaknesses: expect.arrayContaining(["reading_speed"]),
        })
      );
    });

    it("should maintain session context across multiple interactions", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Send first message
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Help me improve my reading comprehension" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Wait for response
      await waitFor(() => {
        expect(screen.getByText(/scanning and inference skills/i)).toBeInTheDocument();
      });

      // Send follow-up message
      fireEvent.change(chatInput, { target: { value: "Can you explain more about scanning techniques?" } });
      fireEvent.click(sendButton);

      // Assert - Should maintain context and provide relevant follow-up
      await waitFor(() => {
        expect(screen.getByText(/question-first.*approach/i)).toBeInTheDocument();
      });
    });

    it("should handle Context7 service errors gracefully", async () => {
      // Arrange - Mock Context7 error
      const { Context7Client } = await import("@/utils/ai/context7-client");
      const mockInstance = Context7Client.getInstance();
      mockInstance.sendMessage.mockRejectedValue(new Error("Context7 service unavailable"));

      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Send message when service is down
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Help me with reading" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should show graceful error handling
      await waitFor(() => {
        expect(
          screen.getByText(/temporarily.*unavailable/i) ||
          screen.getByText(/try.*again/i) ||
          screen.getByText(/connection.*issue/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Contextual Educational Responses", () => {
    it("should provide responses aligned with English B2 EOI requirements", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Ask for reading help
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Help me improve my reading comprehension" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Response should be specific to EOI B2 requirements
      await waitFor(() => {
        expect(screen.getByText(/EOI English B2 exam/i)).toBeInTheDocument();
        expect(screen.getByText(/scanning and inference skills/i)).toBeInTheDocument();
        expect(screen.getByText(/45%.*reading component/i)).toBeInTheDocument();
      });
    });

    it("should provide certification-specific study strategies", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Request study advice
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "What should I study for the EOI exam?" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should provide EOI-specific advice
      await waitFor(() => {
        expect(
          screen.getByText(/EOI/i) &&
          (screen.getByText(/exam format/i) || screen.getByText(/B2.*level/i))
        ).toBeTruthy();
        
        // Should mention specific techniques
        expect(
          screen.getByText(/key words/i) ||
          screen.getByText(/main ideas/i) ||
          screen.getByText(/supporting details/i)
        ).toBeInTheDocument();
      });
    });

    it("should adapt language complexity appropriate for B2 level", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Ask complex question
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "How can I improve my lexical resource?" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Response should use B2-appropriate language
      await waitFor(() => {
        const responseText = screen.getByText(/vocabulary/i).closest("div")?.textContent || "";
        
        // Should explain complex terms
        expect(responseText.includes("vocabulary") || responseText.includes("lexical")).toBe(true);
        
        // Should use B2-level explanations
        expect(responseText.length).toBeGreaterThan(50); // Detailed explanation
      });
    });
  });

  describe("Weakness-Specific Suggestions", () => {
    it("should identify user weaknesses and provide targeted advice", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - General help request
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "I need help improving" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should identify specific weaknesses
      await waitFor(() => {
        expect(screen.getByText(/reading.*45%/i)).toBeInTheDocument();
        expect(screen.getByText(/listening.*40%/i)).toBeInTheDocument();
        
        // Should provide targeted suggestions
        expect(
          screen.getByText(/timed reading/i) ||
          screen.getByText(/scanning/i) ||
          screen.getByText(/inference/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide progressive difficulty recommendations", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Ask for practice recommendations
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "What should I practice first?" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should suggest progressive approach
      await waitFor(() => {
        expect(
          screen.getByText(/start.*with/i) ||
          screen.getByText(/first.*practice/i) ||
          screen.getByText(/begin.*by/i)
        ).toBeInTheDocument();
        
        // Should mention time intervals or stages
        expect(
          screen.getByText(/10.*minute/i) ||
          screen.getByText(/interval/i) ||
          screen.getByText(/step.*by.*step/i)
        ).toBeInTheDocument();
      });
    });

    it("should suggest practice materials appropriate for current level", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Request resources
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "What materials should I use?" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should provide level-appropriate resources
      await waitFor(() => {
        expect(screen.getByText(/B2.*Reading/i)).toBeInTheDocument();
        expect(screen.getByText(/newspaper.*articles/i)).toBeInTheDocument();
        
        // Should include links to resources
        const links = screen.getAllByRole("link");
        expect(links.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Resource Provision and Links", () => {
    it("should provide relevant educational resources with working links", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Request help
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Help me with reading" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should show resource links
      await waitFor(() => {
        expect(screen.getByText(/B2 Reading Strategies Guide/i)).toBeInTheDocument();
        expect(screen.getByText(/Timed Reading Practice Tests/i)).toBeInTheDocument();
        expect(screen.getByText(/Vocabulary in Context Exercises/i)).toBeInTheDocument();
        
        // Should have clickable links
        const resourceLinks = screen.getAllByRole("link");
        expect(resourceLinks.length).toBeGreaterThanOrEqual(3);
        
        resourceLinks.forEach(link => {
          expect(link.getAttribute("href")).toMatch(/^https?:\/\//);
        });
      });
    });

    it("should categorize resources by type (articles, exercises, videos)", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Request scanning help
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Tell me about scanning techniques" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should show categorized resources
      await waitFor(() => {
        expect(
          screen.getByText(/article/i) ||
          screen.getByText(/guide/i)
        ).toBeInTheDocument();
        
        expect(
          screen.getByText(/exercise/i) ||
          screen.getByText(/practice/i)
        ).toBeInTheDocument();
        
        expect(
          screen.getByText(/video/i) ||
          screen.getByText(/tutorial/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide resources aligned with official exam preparation", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Ask about exam preparation
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "How do I prepare for the official exam?" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Resources should be exam-focused
      await waitFor(() => {
        expect(
          screen.getByText(/EOI/i) ||
          screen.getByText(/official/i) ||
          screen.getByText(/exam/i)
        ).toBeInTheDocument();
        
        // Should mention authentic materials
        expect(
          screen.getByText(/authentic/i) ||
          screen.getByText(/real.*exam/i) ||
          screen.getByText(/official.*format/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Performance and Response Time", () => {
    it("should provide responses within 2 seconds requirement", async () => {
      // Arrange
      const startTime = Date.now();
      mockPerformanceNow.mockReturnValue(startTime);

      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Send message and measure response time
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Quick help please" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      const responseStartTime = Date.now();

      // Assert - Response should appear within 2 seconds
      await waitFor(() => {
        expect(screen.getByText(/help.*improve/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      const responseTime = Date.now() - responseStartTime;
      expect(responseTime).toBeLessThan(2000);
    });

    it("should show loading indicators during response generation", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Send message
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Help me" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should show loading indicator briefly
      expect(
        screen.getByText(/typing/i) ||
        screen.getByText(/thinking/i) ||
        document.querySelector('[class*="loading"], [class*="spinner"]')
      ).toBeTruthy();
    });

    it("should handle multiple concurrent users efficiently", async () => {
      // Arrange - Simulate multiple chat instances
      const { rerender } = render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Send multiple messages rapidly
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      const sendButton = screen.getByRole("button", { name: /send/i });

      fireEvent.change(chatInput, { target: { value: "Help 1" } });
      fireEvent.click(sendButton);

      fireEvent.change(chatInput, { target: { value: "Help 2" } });
      fireEvent.click(sendButton);

      // Assert - Should handle concurrent requests
      await waitFor(() => {
        expect(screen.getByText(/Help 1/i)).toBeInTheDocument();
        expect(screen.getByText(/Help 2/i)).toBeInTheDocument();
      });
    });
  });

  describe("Conversation Context Persistence", () => {
    it("should remember previous conversation topics and build upon them", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Have multi-turn conversation
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      const sendButton = screen.getByRole("button", { name: /send/i });

      // First message about reading
      fireEvent.change(chatInput, { target: { value: "I struggle with reading comprehension" } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/scanning and inference/i)).toBeInTheDocument();
      });

      // Follow-up question
      fireEvent.change(chatInput, { target: { value: "What about scanning specifically?" } });
      fireEvent.click(sendButton);

      // Assert - Should reference previous context
      await waitFor(() => {
        expect(screen.getByText(/question-first.*approach/i)).toBeInTheDocument();
        expect(screen.getByText(/keywords.*synonyms/i)).toBeInTheDocument();
      });
    });

    it("should maintain learning profile updates across sessions", async () => {
      // Arrange
      const { Context7Client } = await import("@/utils/ai/context7-client");
      const mockInstance = Context7Client.getInstance();

      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Simulate profile update through conversation
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "I improved my vocabulary!" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should update learning profile
      await waitFor(() => {
        expect(mockInstance.updateLearningProfile).toHaveBeenCalledWith(
          mockContext7Session.sessionId,
          expect.objectContaining({
            strengths: expect.arrayContaining(["vocabulary"]),
          })
        );
      });
    });

    it("should save conversation history for future reference", async () => {
      // Arrange
      render(<AITutor 
        courseId="course_english_b2" 
        userId={mockUser.id}
        userProgress={mockUserProgress}
      />);

      // Act - Send message
      const chatInput = await waitFor(() => screen.getByRole("textbox"));
      fireEvent.change(chatInput, { target: { value: "Save this conversation" } });
      
      const sendButton = screen.getByRole("button", { name: /send/i });
      fireEvent.click(sendButton);

      // Assert - Should display previous messages on reload
      await waitFor(() => {
        expect(screen.getByText(/Help me improve my reading comprehension/i)).toBeInTheDocument();
        expect(screen.getByText(/scanning and inference skills/i)).toBeInTheDocument();
      });
    });
  });
});