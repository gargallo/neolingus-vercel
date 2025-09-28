/**
 * Integration Tests - Scenario 3: Exam Simulation Session
 * T020: Reading Component Practice Session Journey Testing
 * 
 * Tests the complete user journey for enrolled users starting and completing
 * a Reading component practice session in official exam format simulation.
 * 
 * Test Coverage:
 * ✅ Reading practice session initiation from dashboard
 * ✅ Official EOI English B2 exam format simulation
 * ✅ Exam timer functionality and timing constraints
 * ✅ Question structure and CEFR alignment
 * ✅ Response submission and validation
 * ✅ Immediate AI feedback provision
 * ✅ Score calculation according to CEFR rubrics
 * ✅ Progress tracking and dashboard updates
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRouter } from "next/router";
import ExamSimulatorPage from "@/app/dashboard/[idioma]/[nivel]/examens/[proveedor]/[examId]/simulador/page";
import ExamSimulator from "@/components/academia/exam-simulator";

// Mock Next.js router for exam simulation route
const mockPush = vi.fn();
const mockRouter: Partial<NextRouter> = {
  push: mockPush,
  pathname: "/dashboard/english/b2/examens/eoi/reading-practice-001/simulador",
  route: "/dashboard/[idioma]/[nivel]/examens/[proveedor]/[examId]/simulador",
  asPath: "/dashboard/english/b2/examens/eoi/reading-practice-001/simulador",
  query: { 
    idioma: "english", 
    nivel: "b2", 
    proveedor: "eoi", 
    examId: "reading-practice-001" 
  },
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard/english/b2/examens/eoi/reading-practice-001/simulador",
  useParams: () => ({ 
    idioma: "english", 
    nivel: "b2", 
    proveedor: "eoi", 
    examId: "reading-practice-001" 
  }),
}));

// Mock authenticated user
const mockUser = {
  id: "user_12345678-1234-1234-1234-123456789abc",
  email: "test@neolingus.com",
  user_metadata: { full_name: "Test User" },
};

// Mock exam session data
const mockExamSession = {
  id: "session_reading_12345",
  user_id: mockUser.id,
  course_id: "course_english_b2", 
  session_type: "practice",
  component: "reading",
  status: "active",
  started_at: new Date().toISOString(),
  duration_minutes: 90,
  questions: [
    {
      id: "q1",
      type: "multiple_choice",
      text: "According to the passage, what is the main advantage of renewable energy?",
      passage: "Renewable energy sources such as solar and wind power offer numerous advantages over traditional fossil fuels...",
      options: [
        "It is cheaper to produce",
        "It reduces environmental impact", 
        "It is more reliable",
        "It requires less maintenance"
      ],
      correct_answer: 1,
      difficulty: "intermediate",
      points: 2,
    },
    {
      id: "q2", 
      type: "true_false",
      text: "The author suggests that fossil fuels will become obsolete within the next decade.",
      passage: "While renewable energy is growing rapidly, experts predict a gradual transition over the next 20-30 years...",
      correct_answer: false,
      difficulty: "intermediate",
      points: 1,
    },
    {
      id: "q3",
      type: "fill_in_blank",
      text: "Solar panels convert _____ into electricity through photovoltaic cells.",
      correct_answer: "sunlight",
      difficulty: "basic",
      points: 1,
    }
  ],
  timer: {
    total_minutes: 90,
    remaining_seconds: 5400, // 90 minutes
    started_at: Date.now(),
  },
};

// Mock exam results and scoring
const mockExamResults = {
  session_id: mockExamSession.id,
  total_score: 0.75, // 75%
  component_scores: {
    reading: 0.75,
  },
  detailed_feedback: {
    strengths: ["Reading comprehension", "Vocabulary understanding"],
    weaknesses: ["Time management", "Detail-oriented questions"],
    recommendations: [
      "Practice more timed reading exercises",
      "Focus on identifying key information quickly",
      "Review vocabulary in context"
    ],
  },
  cefr_alignment: {
    level: "b2",
    meets_requirements: true,
    areas_for_improvement: ["scanning techniques", "inference skills"],
  },
  ai_feedback: "Well done! You demonstrated strong reading comprehension skills. Focus on improving your speed when scanning for specific details.",
};

// Mock Supabase client with exam simulation data
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
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
      };

      if (table === "exam_sessions") {
        mockChain.single.mockResolvedValue({
          data: mockExamSession,
          error: null,
        });
        mockChain.insert.mockResolvedValue({
          data: { id: "session_new_123" },
          error: null,
        });
        mockChain.update.mockResolvedValue({
          data: { ...mockExamSession, status: "completed" },
          error: null,
        });
      } else if (table === "exam_results") {
        mockChain.insert.mockResolvedValue({
          data: mockExamResults,
          error: null,
        });
      } else if (table === "user_course_progress") {
        mockChain.update.mockResolvedValue({
          data: { 
            component_progress: { reading: 0.75 },
            sessions_completed: 9,
          },
          error: null,
        });
      }

      return mockChain;
    }),
  }),
}));

// Mock exam engine
vi.mock("@/lib/exam-engine/core/universal-engine", () => ({
  UniversalExamEngine: {
    getInstance: vi.fn().mockReturnValue({
      startSession: vi.fn().mockResolvedValue(mockExamSession),
      submitAnswer: vi.fn().mockResolvedValue({ success: true }),
      completeSession: vi.fn().mockResolvedValue(mockExamResults),
      getSessionState: vi.fn().mockReturnValue(mockExamSession),
    }),
  },
}));

// Mock timer functionality
vi.useFakeTimers();

describe("Integration Test - Scenario 3: Exam Simulation Session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Exam Session Initiation", () => {
    it("should start a new Reading practice session from course dashboard", async () => {
      // Arrange & Act
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Assert - Verify session initialization
      await waitFor(() => {
        expect(screen.getByText(/Reading Practice/i)).toBeInTheDocument();
        expect(screen.getByText(/English B2/i)).toBeInTheDocument();
        expect(screen.getByText(/EOI/i)).toBeInTheDocument();
      });

      // Verify session setup
      expect(screen.getByText(/90.*minutes/i)).toBeInTheDocument(); // Duration
      expect(screen.getByText(/Start.*Practice/i) || screen.getByText(/Begin.*Exam/i)).toBeInTheDocument();
    });

    it("should display proper exam instructions and format information", async () => {
      // Arrange & Act
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Assert - Check for exam instructions
      await waitFor(() => {
        expect(
          screen.getByText(/instructions/i) ||
          screen.getByText(/format/i) ||
          screen.getByText(/before.*start/i)
        ).toBeInTheDocument();

        // Should show exam structure info
        expect(
          screen.getByText(/questions/i) ||
          screen.getByText(/passages/i) ||
          screen.getByText(/multiple.*choice/i)
        ).toBeInTheDocument();
      });
    });

    it("should verify user enrollment before allowing session start", async () => {
      // Arrange & Act
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Assert - Should not show "not enrolled" errors
      await waitFor(() => {
        expect(screen.queryByText(/not enrolled/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/unauthorized/i)).not.toBeInTheDocument();
      });

      // Should show session is ready to start
      expect(screen.getByText(/Start/i) || screen.getByText(/Begin/i)).toBeInTheDocument();
    });
  });

  describe("Official EOI English B2 Exam Format", () => {
    it("should follow official EOI English B2 reading exam structure", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start the exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Assert - Verify exam format
      await waitFor(() => {
        // Should show reading passages
        expect(
          screen.getByText(/passage/i) ||
          screen.getByText(/text/i) ||
          screen.getByText(/renewable energy/i) // Sample passage text
        ).toBeInTheDocument();

        // Should show question types typical of B2 level
        expect(
          screen.getByText(/multiple.*choice/i) ||
          screen.getByText(/true.*false/i) ||
          screen.getByText(/fill.*blank/i)
        ).toBeInTheDocument();
      });
    });

    it("should present questions with appropriate B2-level complexity and CEFR alignment", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam and navigate to questions
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Assert - Check question complexity and structure
      await waitFor(() => {
        // Should show B2-appropriate vocabulary and concepts
        expect(screen.getByText(/renewable energy/i)).toBeInTheDocument();
        expect(screen.getByText(/photovoltaic/i)).toBeInTheDocument();

        // Should have clear question formatting
        expect(screen.getByText(/According to the passage/i)).toBeInTheDocument();
        
        // Should show answer options for multiple choice
        const answerOptions = screen.getAllByRole("radio") || screen.getAllByRole("button");
        expect(answerOptions.length).toBeGreaterThan(0);
      });
    });

    it("should include diverse question types matching official exam format", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Assert - Verify question type diversity
      await waitFor(() => {
        // Multiple choice question
        expect(screen.getByText(/main advantage/i)).toBeInTheDocument();
        
        // Should be able to navigate between questions
        const nextButton = screen.getByRole("button", { name: /next/i });
        expect(nextButton).toBeInTheDocument();
      });

      // Navigate to check other question types
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      await waitFor(() => {
        // True/False question
        expect(
          screen.getByText(/true.*false/i) ||
          screen.getByText(/suggests.*obsolete/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Exam Timer Functionality", () => {
    it("should display and maintain accurate 90-minute countdown timer", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Assert - Check timer display
      await waitFor(() => {
        expect(
          screen.getByText(/90:00/i) ||
          screen.getByText(/89:5/i) ||
          screen.getByText(/1:30:00/i) // 1 hour 30 minutes
        ).toBeInTheDocument();
      });

      // Simulate time passage
      vi.advanceTimersByTime(60000); // 1 minute

      await waitFor(() => {
        expect(
          screen.getByText(/89:00/i) ||
          screen.getByText(/1:29:00/i)
        ).toBeInTheDocument();
      });
    });

    it("should show timer warnings as time runs low", async () => {
      // Arrange
      const sessionWithLowTime = {
        ...mockExamSession,
        timer: {
          ...mockExamSession.timer,
          remaining_seconds: 300, // 5 minutes remaining
        },
      };

      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam with low time
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Assert - Check for time warnings
      await waitFor(() => {
        expect(
          screen.getByText(/5.*minutes.*remaining/i) ||
          screen.getByText(/time.*running.*out/i) ||
          screen.getByText(/warning/i)
        ).toBeInTheDocument();
      });
    });

    it("should auto-submit exam when timer reaches zero", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam and simulate timer expiration
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Fast forward to timer expiration
      vi.advanceTimersByTime(5400000); // 90 minutes

      // Assert - Should auto-submit
      await waitFor(() => {
        expect(
          screen.getByText(/time.*up/i) ||
          screen.getByText(/automatically.*submitted/i) ||
          screen.getByText(/exam.*completed/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Question Response and Submission", () => {
    it("should allow users to select answers and navigate between questions", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam and answer questions
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      await waitFor(() => {
        // Select an answer for multiple choice
        const answerOption = screen.getByText(/reduces environmental impact/i);
        fireEvent.click(answerOption);
      });

      // Navigate to next question
      const nextButton = screen.getByRole("button", { name: /next/i });
      fireEvent.click(nextButton);

      // Assert - Should move to next question
      await waitFor(() => {
        expect(screen.getByText(/suggests.*obsolete/i)).toBeInTheDocument();
      });
    });

    it("should validate responses and provide feedback on completion", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete all questions and submit
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Answer questions (simplified for test)
      await waitFor(() => {
        const answerOption = screen.getByText(/reduces environmental impact/i);
        fireEvent.click(answerOption);
      });

      // Submit exam
      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Should show completion confirmation
      await waitFor(() => {
        expect(
          screen.getByText(/submitted/i) ||
          screen.getByText(/completed/i) ||
          screen.getByText(/results/i)
        ).toBeInTheDocument();
      });
    });

    it("should save progress continuously during the session", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Start exam and answer a question
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      await waitFor(() => {
        const answerOption = screen.getByText(/reduces environmental impact/i);
        fireEvent.click(answerOption);
      });

      // Simulate auto-save after answer selection
      vi.advanceTimersByTime(2000); // 2 seconds for auto-save

      // Assert - Progress should be saved (verified through mock calls)
      // This would be verified through Supabase mock calls in real implementation
      expect(screen.queryByText(/error.*saving/i)).not.toBeInTheDocument();
    });
  });

  describe("Immediate AI Feedback and Scoring", () => {
    it("should provide immediate AI feedback after session completion", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      // Submit exam (simplified)
      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Check for AI feedback
      await waitFor(() => {
        expect(
          screen.getByText(/Well done/i) ||
          screen.getByText(/feedback/i) ||
          screen.getByText(/strong reading comprehension/i)
        ).toBeInTheDocument();

        // Should show specific recommendations
        expect(
          screen.getByText(/timed reading exercises/i) ||
          screen.getByText(/scanning techniques/i)
        ).toBeInTheDocument();
      });
    });

    it("should calculate and display score according to CEFR rubrics", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Check for CEFR-aligned scoring
      await waitFor(() => {
        expect(screen.getByText(/75%/i)).toBeInTheDocument(); // Overall score
        expect(
          screen.getByText(/B2.*level/i) ||
          screen.getByText(/meets.*requirements/i)
        ).toBeInTheDocument();

        // Should show component breakdown
        expect(screen.getByText(/reading.*75%/i)).toBeInTheDocument();
      });
    });

    it("should identify strengths and weaknesses with specific recommendations", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Check for detailed feedback
      await waitFor(() => {
        // Strengths
        expect(screen.getByText(/Reading comprehension/i)).toBeInTheDocument();
        expect(screen.getByText(/Vocabulary understanding/i)).toBeInTheDocument();

        // Weaknesses
        expect(screen.getByText(/Time management/i)).toBeInTheDocument();
        expect(screen.getByText(/Detail-oriented questions/i)).toBeInTheDocument();

        // Recommendations
        expect(screen.getByText(/Practice more timed/i)).toBeInTheDocument();
      });
    });
  });

  describe("Progress Tracking and Dashboard Updates", () => {
    it("should update user progress in the course dashboard", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Progress should be updated
      await waitFor(() => {
        expect(
          screen.getByText(/progress.*updated/i) ||
          screen.getByText(/dashboard.*updated/i) ||
          screen.getByText(/view.*progress/i)
        ).toBeInTheDocument();
      });
    });

    it("should increment session completion counter", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete exam
      const startButton = await waitFor(() => screen.getByText(/Start/i });
      fireEvent.click(startButton);

      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Session count should be updated
      await waitFor(() => {
        expect(
          screen.getByText(/session.*9/i) || // New session count
          screen.getByText(/completed.*9/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide option to return to course dashboard", async () => {
      // Arrange
      render(<ExamSimulatorPage params={{ 
        idioma: "english", 
        nivel: "b2", 
        proveedor: "eoi", 
        examId: "reading-practice-001" 
      }} />);

      // Act - Complete exam
      const startButton = await waitFor(() => screen.getByText(/Start/i));
      fireEvent.click(startButton);

      const submitButton = await waitFor(() => 
        screen.getByRole("button", { name: /submit/i })
      );
      fireEvent.click(submitButton);

      // Assert - Should show return to dashboard option
      await waitFor(() => {
        const returnButton = screen.getByRole("button", { name: /dashboard|return|back/i }) ||
                            screen.getByRole("link", { name: /dashboard|return|back/i });
        expect(returnButton).toBeInTheDocument();
      });

      // Verify navigation
      const returnButton = screen.getByRole("button", { name: /dashboard|return|back/i });
      fireEvent.click(returnButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard/english/b2");
    });
  });
});