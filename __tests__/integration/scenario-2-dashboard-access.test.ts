/**
 * Integration Tests - Scenario 2: Course Dashboard Access
 * T019: Authenticated User Course Dashboard Journey Testing
 * 
 * Tests the complete user journey for authenticated users accessing
 * the dedicated English B2 course dashboard at /dashboard/english/b2.
 * 
 * Test Coverage:
 * ✅ Course-specific dashboard loading and rendering
 * ✅ Enrollment status verification and display
 * ✅ Progress analytics dashboard components
 * ✅ Four exam component sections accessibility
 * ✅ AI tutor chat interface integration
 * ✅ Practice session initiation capability
 * ✅ Course-specific branding and navigation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRouter } from "next/router";
import CoursePage from "@/app/dashboard/[idioma]/[nivel]/page";
import CourseDashboard from "@/components/academia/course-dashboard";

// Mock Next.js router with course-specific route
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

// Mock authenticated user
const mockUser = {
  id: "user_12345678-1234-1234-1234-123456789abc",
  email: "test@neolingus.com",
  user_metadata: {
    full_name: "Test User",
    avatar_url: null,
  },
};

// Mock course data
const mockCourseData = {
  id: "course_english_b2",
  title: "English B2 (EOI)",
  language: "english",
  level: "b2",
  certification_type: "eoi",
  description: "Prepare for your English B2 certification with comprehensive exam simulation",
  is_active: true,
  total_hours: 120,
  difficulty_score: 0.7,
  components: ["reading", "writing", "listening", "speaking"],
  exam_structure: {
    reading: { duration_minutes: 90, questions: 30 },
    writing: { duration_minutes: 90, tasks: 2 },
    listening: { duration_minutes: 40, questions: 25 },
    speaking: { duration_minutes: 15, tasks: 3 },
  },
};

// Mock user enrollment and progress
const mockEnrollmentData = {
  id: "enrollment_123",
  user_id: mockUser.id,
  course_id: mockCourseData.id,
  enrolled_at: "2025-01-15T10:00:00Z",
  status: "active",
  progress: {
    overall_progress: 0.65,
    component_progress: {
      reading: 0.75,
      writing: 0.55,
      listening: 0.45,
      speaking: 0.70,
    },
    sessions_completed: 8,
    total_practice_time: 720, // minutes
    readiness_score: 0.68,
    strengths: ["reading", "speaking"],
    weaknesses: ["listening", "writing"],
  },
};

// Mock Supabase client for authenticated user
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
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      if (table === "courses") {
        mockChain.single.mockResolvedValue({
          data: mockCourseData,
          error: null,
        });
      } else if (table === "user_course_enrollments") {
        mockChain.select.mockReturnValue({
          ...mockChain,
          single: vi.fn().mockResolvedValue({
            data: mockEnrollmentData,
            error: null,
          }),
        });
      } else if (table === "user_course_progress") {
        mockChain.single.mockResolvedValue({
          data: mockEnrollmentData.progress,
          error: null,
        });
      } else if (table === "exam_sessions") {
        mockChain.limit.mockResolvedValue({
          data: [
            {
              id: "session_123",
              component: "reading",
              score: 0.85,
              completed_at: "2025-01-14T15:30:00Z",
            },
            {
              id: "session_124", 
              component: "listening",
              score: 0.65,
              completed_at: "2025-01-13T11:20:00Z",
            },
          ],
          error: null,
        });
      }

      return mockChain;
    }),
  }),
}));

// Mock demo mode (user is authenticated, so not in demo mode)
vi.mock("@/lib/demo-mode", () => ({
  isDemoModeActive: vi.fn().mockReturnValue(false),
  isServerSideDemoMode: vi.fn().mockReturnValue(false),
}));

// Mock AI tutor integration
vi.mock("@/utils/ai/context7-client", () => ({
  Context7Client: {
    getInstance: vi.fn().mockReturnValue({
      getOrCreateSession: vi.fn().mockResolvedValue({
        sessionId: "ctx7_session_123",
        userId: mockUser.id,
        courseId: mockCourseData.id,
      }),
    }),
  },
}));

describe("Integration Test - Scenario 2: Course Dashboard Access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Course Dashboard Loading and Authentication", () => {
    it("should load the dedicated English B2 course dashboard for authenticated users", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify course-specific dashboard loads
      await waitFor(() => {
        expect(screen.getByText(/English B2/i)).toBeInTheDocument();
        expect(screen.getByText(/EOI/i)).toBeInTheDocument();
        expect(screen.getByText(/certification/i)).toBeInTheDocument();
      });

      // Verify user-specific content is displayed
      expect(screen.getByText(/Test User/i) || screen.getByText(/Welcome/i)).toBeInTheDocument();
    });

    it("should verify and display enrollment status correctly", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check enrollment status display
      await waitFor(() => {
        expect(
          screen.getByText(/enrolled/i) ||
          screen.getByText(/active/i) ||
          screen.getByText(/January/i) // Enrollment date
        ).toBeInTheDocument();
      });

      // Verify course access is granted
      expect(screen.queryByText(/not enrolled/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/access denied/i)).not.toBeInTheDocument();
    });

    it("should display course-specific branding and header", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify course branding
      await waitFor(() => {
        expect(screen.getByText(/English B2/i)).toBeInTheDocument();
        expect(screen.getByText(/EOI/i)).toBeInTheDocument();
        
        // Check for course description or branding elements
        expect(
          screen.getByText(/comprehensive exam simulation/i) ||
          screen.getByText(/certification/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Progress Analytics Dashboard", () => {
    it("should display comprehensive progress analytics with component breakdown", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify progress analytics display
      await waitFor(() => {
        // Overall progress
        expect(screen.getByText(/65%/i) || screen.getByText(/0\.65/)).toBeInTheDocument();
        
        // Component-specific progress
        expect(screen.getByText(/reading/i)).toBeInTheDocument();
        expect(screen.getByText(/writing/i)).toBeInTheDocument();
        expect(screen.getByText(/listening/i)).toBeInTheDocument();
        expect(screen.getByText(/speaking/i)).toBeInTheDocument();
      });

      // Verify progress visualization
      const progressElements = document.querySelectorAll('[role="progressbar"], [class*="progress"], [class*="chart"]');
      expect(progressElements.length).toBeGreaterThan(0);
    });

    it("should show strengths and weaknesses identification", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for strengths/weaknesses display
      await waitFor(() => {
        expect(
          screen.getByText(/strength/i) ||
          screen.getByText(/strong/i) ||
          screen.getByText(/good/i)
        ).toBeInTheDocument();
        
        expect(
          screen.getByText(/weakness/i) ||
          screen.getByText(/improve/i) ||
          screen.getByText(/focus/i)
        ).toBeInTheDocument();
      });
    });

    it("should display readiness score and study recommendations", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify readiness indicators
      await waitFor(() => {
        expect(
          screen.getByText(/68%/i) ||
          screen.getByText(/0\.68/) ||
          screen.getByText(/readiness/i)
        ).toBeInTheDocument();
        
        // Should show recommendations
        expect(
          screen.getByText(/recommend/i) ||
          screen.getByText(/study/i) ||
          screen.getByText(/focus/i)
        ).toBeInTheDocument();
      });
    });

    it("should show recent session history and performance trends", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for session history
      await waitFor(() => {
        expect(
          screen.getByText(/recent/i) ||
          screen.getByText(/history/i) ||
          screen.getByText(/sessions/i)
        ).toBeInTheDocument();
        
        // Should show completed sessions count
        expect(screen.getByText(/8/)).toBeInTheDocument(); // sessions_completed
      });
    });
  });

  describe("Exam Component Sections Access", () => {
    it("should display all four exam component sections (Reading, Writing, Listening, Speaking)", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify all components are accessible
      await waitFor(() => {
        expect(screen.getByText(/reading/i)).toBeInTheDocument();
        expect(screen.getByText(/writing/i)).toBeInTheDocument(); 
        expect(screen.getByText(/listening/i)).toBeInTheDocument();
        expect(screen.getByText(/speaking/i)).toBeInTheDocument();
      });

      // Verify components are clickable/interactive
      const componentButtons = screen.getAllByRole("button");
      const componentSections = componentButtons.filter(button => 
        /reading|writing|listening|speaking/i.test(button.textContent || "")
      );
      expect(componentSections.length).toBeGreaterThanOrEqual(4);
    });

    it("should show component-specific progress and difficulty indicators", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for component progress indicators
      await waitFor(() => {
        // Reading: 75%
        expect(screen.getByText(/75%/) || screen.getByText(/0\.75/)).toBeInTheDocument();
        
        // Writing: 55%
        expect(screen.getByText(/55%/) || screen.getByText(/0\.55/)).toBeInTheDocument();
        
        // Listening: 45% (weakness)
        expect(screen.getByText(/45%/) || screen.getByText(/0\.45/)).toBeInTheDocument();
        
        // Speaking: 70%
        expect(screen.getByText(/70%/) || screen.getByText(/0\.70/)).toBeInTheDocument();
      });
    });

    it("should provide clear entry points for practice sessions", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify practice session entry points
      await waitFor(() => {
        const practiceButtons = screen.getAllByRole("button").filter(button =>
          /practice|start|begin|continue/i.test(button.textContent || "")
        );
        expect(practiceButtons.length).toBeGreaterThan(0);
      });

      // Check for practice session indicators
      expect(
        screen.getByText(/practice/i) ||
        screen.getByText(/simulation/i) ||
        screen.getByText(/exam/i)
      ).toBeInTheDocument();
    });

    it("should display exam timing and structure information", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for exam structure info
      await waitFor(() => {
        // Should show timing information
        expect(
          screen.getByText(/90.*minutes/i) || // Reading/Writing
          screen.getByText(/40.*minutes/i) || // Listening
          screen.getByText(/15.*minutes/i)    // Speaking
        ).toBeInTheDocument();
        
        // Should show question/task counts
        expect(
          screen.getByText(/30.*questions/i) || // Reading
          screen.getByText(/25.*questions/i) || // Listening
          screen.getByText(/2.*tasks/i) ||      // Writing
          screen.getByText(/3.*tasks/i)         // Speaking
        ).toBeInTheDocument();
      });
    });
  });

  describe("AI Tutor Chat Interface Integration", () => {
    it("should display accessible AI tutor chat interface", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for AI tutor interface
      await waitFor(() => {
        expect(
          screen.getByText(/tutor/i) ||
          screen.getByText(/AI/i) ||
          screen.getByText(/chat/i) ||
          screen.getByText(/help/i)
        ).toBeInTheDocument();
      });

      // Verify chat interface is interactive
      const chatElements = document.querySelectorAll(
        '[placeholder*="message"], [placeholder*="question"], [type="text"], textarea'
      );
      expect(chatElements.length).toBeGreaterThan(0);
    });

    it("should initialize Context7 session for the current course", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify AI tutor integration is ready
      await waitFor(() => {
        // Should show tutor availability
        expect(
          screen.queryByText(/tutor.*unavailable/i) ||
          screen.queryByText(/AI.*offline/i)
        ).not.toBeInTheDocument();
        
        // Should have interactive elements
        expect(
          screen.getByRole("textbox") ||
          screen.getByRole("button", { name: /send|ask|chat/i })
        ).toBeInTheDocument();
      });
    });

    it("should show personalized tutor introduction based on user progress", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for personalized content
      await waitFor(() => {
        expect(
          screen.getByText(/welcome/i) ||
          screen.getByText(/help.*improve/i) ||
          screen.getByText(/listening.*writing/i) // User's weaknesses
        ).toBeInTheDocument();
      });
    });
  });

  describe("Practice Session Initiation", () => {
    it("should allow users to start practice sessions for each component", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Find and verify practice session buttons
      await waitFor(() => {
        const readingPractice = screen.getByText(/reading.*practice/i) ||
                               screen.getByText(/start.*reading/i);
        expect(readingPractice).toBeInTheDocument();
      });

      // Verify practice sessions are launchable
      const practiceButton = screen.getByRole("button", { name: /practice|start/i });
      fireEvent.click(practiceButton);

      // Should navigate to exam interface or show session setup
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(
          expect.stringMatching(/\/dashboard\/english\/b2\/.*/)
        );
      });
    });

    it("should show practice session options and difficulty selection", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for session configuration options
      await waitFor(() => {
        expect(
          screen.getByText(/difficulty/i) ||
          screen.getByText(/level/i) ||
          screen.getByText(/timed/i) ||
          screen.getByText(/practice.*mode/i)
        ).toBeInTheDocument();
      });
    });

    it("should display recommended practice sessions based on weaknesses", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for weakness-focused recommendations
      await waitFor(() => {
        // User's weaknesses are listening and writing
        expect(
          screen.getByText(/recommended.*listening/i) ||
          screen.getByText(/focus.*writing/i) ||
          screen.getByText(/improve.*listening/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Navigation and User Experience", () => {
    it("should provide clear navigation back to academia main page", async () => {
      // Arrange & Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Check for navigation elements
      await waitFor(() => {
        const backButton = screen.getByRole("button", { name: /back|return/i }) ||
                          screen.getByRole("link", { name: /dashboard|courses/i });
        expect(backButton).toBeInTheDocument();
      });
    });

    it("should maintain responsive design across different screen sizes", async () => {
      // Arrange - Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      // Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Verify mobile responsiveness
      await waitFor(() => {
        const mainContent = document.querySelector("main") || document.body;
        expect(mainContent).toBeInTheDocument();
        
        // Content should be visible and not overflow
        const progressElements = screen.getAllByText(/reading|writing|listening|speaking/i);
        progressElements.forEach(element => {
          expect(element).toBeVisible();
        });
      });
    });

    it("should handle loading states gracefully", async () => {
      // Arrange - Mock slow loading
      const slowPromise = new Promise(resolve => setTimeout(resolve, 100));
      
      // Act
      render(<CoursePage params={{ idioma: "english", nivel: "b2" }} />);

      // Assert - Should show loading indicators initially
      expect(
        screen.getByText(/loading/i) ||
        screen.getByRole("progressbar") ||
        document.querySelector('[class*="loading"], [class*="spinner"]')
      ).toBeTruthy();

      // After loading completes
      await waitFor(() => {
        expect(screen.getByText(/English B2/i)).toBeInTheDocument();
      });
    });
  });
});