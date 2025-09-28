/**
 * Integration Tests - Scenario 5: Progress Analytics
 * T022: Comprehensive Progress Analytics Dashboard Testing
 * 
 * Tests the complete user journey for students viewing detailed performance
 * insights after completing multiple practice sessions across different
 * components, with CEFR-aligned analytics and recommendations.
 * 
 * Test Coverage:
 * ✅ Visual progress charts for each exam component
 * ✅ Component-wise breakdown and performance trends
 * ✅ Strengths and weaknesses identification algorithms
 * ✅ Readiness score calculation and exam preparedness assessment
 * ✅ CEFR alignment in scoring methodology
 * ✅ Historical progress tracking and trend analysis
 * ✅ Personalized study recommendations engine
 * ✅ Performance metrics visualization and data accuracy
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRouter } from "next/router";
import ProgressAnalytics from "@/components/academia/progress-analytics";
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

// Mock authenticated user with rich progress data
const mockUser = {
  id: "user_12345678-1234-1234-1234-123456789abc",
  email: "student@neolingus.com",
  user_metadata: { full_name: "Analytics Test User" },
};

// Mock comprehensive progress data after multiple sessions
const mockProgressData = {
  overall_progress: 0.72,
  component_progress: {
    reading: 0.78,
    writing: 0.65,
    listening: 0.68,
    speaking: 0.80,
  },
  sessions_completed: 15,
  total_practice_time: 1380, // 23 hours in minutes
  readiness_score: 0.74,
  strengths: ["speaking", "reading", "vocabulary"],
  weaknesses: ["writing_structure", "listening_detail", "time_management"],
  last_updated: "2025-01-15T16:45:00Z",
  cefr_assessment: {
    current_level: "b2",
    confidence: 0.85,
    next_level_progress: 0.42, // Progress toward C1
    skills_breakdown: {
      reading: { level: "b2", confidence: 0.88 },
      writing: { level: "b1", confidence: 0.75 }, // Weakness
      listening: { level: "b2", confidence: 0.72 },
      speaking: { level: "b2", confidence: 0.92 },
    },
  },
};

// Mock detailed session history for trend analysis
const mockSessionHistory = [
  {
    id: "session_001",
    component: "reading",
    score: 0.65,
    completed_at: "2025-01-10T10:00:00Z",
    duration_minutes: 45,
    questions_correct: 8,
    questions_total: 12,
  },
  {
    id: "session_002", 
    component: "reading",
    score: 0.72,
    completed_at: "2025-01-11T14:30:00Z",
    duration_minutes: 42,
    questions_correct: 9,
    questions_total: 12,
  },
  {
    id: "session_003",
    component: "reading",
    score: 0.78,
    completed_at: "2025-01-12T09:15:00Z",
    duration_minutes: 40,
    questions_correct: 10,
    questions_total: 12,
  },
  {
    id: "session_004",
    component: "writing",
    score: 0.60,
    completed_at: "2025-01-12T15:45:00Z",
    duration_minutes: 60,
    tasks_completed: 2,
    feedback: "Good ideas but needs better structure",
  },
  {
    id: "session_005",
    component: "listening",
    score: 0.68,
    completed_at: "2025-01-13T11:20:00Z",
    duration_minutes: 35,
    questions_correct: 17,
    questions_total: 25,
  },
  {
    id: "session_006",
    component: "speaking",
    score: 0.80,
    completed_at: "2025-01-14T16:00:00Z",
    duration_minutes: 15,
    tasks_completed: 3,
    feedback: "Excellent fluency and pronunciation",
  },
];

// Mock analytics calculations and recommendations
const mockAnalytics = {
  performance_trends: {
    reading: { trend: "improving", change_rate: 0.13 },
    writing: { trend: "stable", change_rate: -0.02 },
    listening: { trend: "improving", change_rate: 0.08 },
    speaking: { trend: "excellent", change_rate: 0.15 },
  },
  time_efficiency: {
    reading: { avg_time_per_question: 3.5, target: 3.0 },
    writing: { avg_time_per_task: 30, target: 45 },
    listening: { avg_time_per_question: 1.4, target: 1.6 },
    speaking: { avg_time_per_task: 5, target: 5 },
  },
  recommendations: [
    {
      priority: "high",
      area: "writing_structure",
      suggestion: "Practice organizing ideas with clear thesis statements and supporting paragraphs",
      estimated_improvement: 0.15,
    },
    {
      priority: "medium", 
      area: "listening_detail",
      suggestion: "Focus on note-taking techniques for detailed information questions",
      estimated_improvement: 0.10,
    },
    {
      priority: "low",
      area: "time_management",
      suggestion: "Practice timed reading exercises to improve speed while maintaining accuracy",
      estimated_improvement: 0.08,
    },
  ],
  exam_readiness: {
    overall_ready: true,
    estimated_score: 0.74,
    components_ready: {
      reading: true,
      writing: false, // Below threshold
      listening: true,
      speaking: true,
    },
    improvement_needed: 3, // weeks
  },
};

// Mock Supabase client with analytics data
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
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (table === "user_course_progress") {
        mockChain.single.mockResolvedValue({
          data: mockProgressData,
          error: null,
        });
      } else if (table === "exam_sessions") {
        mockChain.order.mockReturnValue({
          ...mockChain,
          limit: vi.fn().mockResolvedValue({
            data: mockSessionHistory,
            error: null,
          }),
        });
      } else if (table === "exam_results") {
        mockChain.order.mockReturnValue({
          ...mockChain,
          limit: vi.fn().mockResolvedValue({
            data: mockSessionHistory.map(session => ({
              session_id: session.id,
              component_scores: { [session.component]: session.score },
              detailed_feedback: session.feedback,
            })),
            error: null,
          }),
        });
      }

      return mockChain;
    }),
  }),
}));

// Mock analytics engine
vi.mock("@/lib/exam-engine/core/analytics-engine", () => ({
  AnalyticsEngine: {
    getInstance: vi.fn().mockReturnValue({
      calculateProgressTrends: vi.fn().mockReturnValue(mockAnalytics.performance_trends),
      analyzeTimeEfficiency: vi.fn().mockReturnValue(mockAnalytics.time_efficiency),
      generateRecommendations: vi.fn().mockReturnValue(mockAnalytics.recommendations),
      assessExamReadiness: vi.fn().mockReturnValue(mockAnalytics.exam_readiness),
      calculateCEFRAlignment: vi.fn().mockReturnValue(mockProgressData.cefr_assessment),
    }),
  },
}));

// Mock Chart.js for visualizations
vi.mock("react-chartjs-2", () => ({
  Line: vi.fn(({ data, options }) => (
    <div data-testid="line-chart" data-chart-type="line">
      Chart: {data.datasets[0].label}
    </div>
  )),
  Doughnut: vi.fn(({ data }) => (
    <div data-testid="doughnut-chart" data-chart-type="doughnut">
      Progress: {data.datasets[0].data.join(", ")}
    </div>
  )),
  Bar: vi.fn(({ data }) => (
    <div data-testid="bar-chart" data-chart-type="bar">
      Components: {data.labels.join(", ")}
    </div>
  )),
}));

describe("Integration Test - Scenario 5: Progress Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Visual Progress Charts Display", () => {
    it("should display visual progress charts for each exam component", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for component-specific charts
      await waitFor(() => {
        expect(screen.getByText(/Reading.*78%/i)).toBeInTheDocument();
        expect(screen.getByText(/Writing.*65%/i)).toBeInTheDocument();
        expect(screen.getByText(/Listening.*68%/i)).toBeInTheDocument();
        expect(screen.getByText(/Speaking.*80%/i)).toBeInTheDocument();
      });

      // Verify chart components are rendered
      expect(screen.getAllByTestId("line-chart")).toHaveLength(4);
      expect(screen.getByTestId("doughnut-chart")).toBeInTheDocument();
    });

    it("should show overall progress visualization with milestone markers", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for overall progress display
      await waitFor(() => {
        expect(screen.getByText(/72%.*overall/i)).toBeInTheDocument();
        expect(screen.getByText(/15.*sessions.*completed/i)).toBeInTheDocument();
        expect(screen.getByText(/23.*hours/i)).toBeInTheDocument(); // total_practice_time
      });

      // Check for milestone indicators
      expect(
        screen.getByText(/milestone/i) ||
        screen.getByText(/achievement/i) ||
        screen.getByText(/badge/i)
      ).toBeInTheDocument();
    });

    it("should display trend arrows and improvement indicators", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for trend indicators
      await waitFor(() => {
        // Improving trends (reading, listening, speaking)
        const improvingElements = screen.getAllByText(/improving|↗|trend.*up/i);
        expect(improvingElements.length).toBeGreaterThan(0);

        // Stable/concerning trends (writing)
        expect(
          screen.getByText(/stable|→|needs.*attention/i) ||
          screen.getByText(/writing.*focus/i)
        ).toBeInTheDocument();
      });

      // Check for visual trend indicators
      const trendIcons = document.querySelectorAll('[data-trend], [class*="trend"], [class*="arrow"]');
      expect(trendIcons.length).toBeGreaterThan(0);
    });
  });

  describe("Component-wise Breakdown and Performance", () => {
    it("should provide detailed breakdown for each component with sub-skills", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for detailed component analysis
      await waitFor(() => {
        // Reading component details
        expect(screen.getByText(/reading.*comprehension/i)).toBeInTheDocument();
        expect(screen.getByText(/scanning.*inference/i)).toBeInTheDocument();
        
        // Writing component details
        expect(screen.getByText(/writing.*structure/i)).toBeInTheDocument();
        expect(screen.getByText(/organization.*thesis/i)).toBeInTheDocument();
        
        // Listening component details
        expect(screen.getByText(/listening.*detail/i)).toBeInTheDocument();
        expect(screen.getByText(/note.*taking/i)).toBeInTheDocument();
        
        // Speaking component details
        expect(screen.getByText(/speaking.*fluency/i)).toBeInTheDocument();
        expect(screen.getByText(/pronunciation/i)).toBeInTheDocument();
      });
    });

    it("should show performance metrics and efficiency analysis", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for efficiency metrics
      await waitFor(() => {
        // Time efficiency indicators
        expect(screen.getByText(/3\.5.*minutes.*question/i)).toBeInTheDocument(); // Reading
        expect(screen.getByText(/30.*minutes.*task/i)).toBeInTheDocument(); // Writing
        
        // Target comparisons
        expect(
          screen.getByText(/target.*3\.0/i) ||
          screen.getByText(/above.*target/i)
        ).toBeInTheDocument();
        
        // Accuracy metrics
        expect(screen.getByText(/accuracy/i)).toBeInTheDocument();
        expect(screen.getByText(/questions.*correct/i)).toBeInTheDocument();
      });
    });

    it("should display session-by-session improvement tracking", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for session tracking
      await waitFor(() => {
        // Should show session progression
        expect(screen.getByText(/session.*history/i)).toBeInTheDocument();
        expect(screen.getByText(/recent.*sessions/i)).toBeInTheDocument();
        
        // Should show score progression for reading (65% → 72% → 78%)
        expect(screen.getByText(/65%.*72%.*78%/i) || screen.getByText(/improving.*trend/i)).toBeInTheDocument();
        
        // Timeline indicators
        expect(screen.getByText(/January.*10|Jan.*10/i)).toBeInTheDocument();
        expect(screen.getByText(/January.*14|Jan.*14/i)).toBeInTheDocument();
      });
    });
  });

  describe("Strengths and Weaknesses Identification", () => {
    it("should clearly identify and display user strengths", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for strengths identification
      await waitFor(() => {
        expect(screen.getByText(/strengths/i)).toBeInTheDocument();
        expect(screen.getByText(/speaking/i)).toBeInTheDocument();
        expect(screen.getByText(/reading/i)).toBeInTheDocument();
        expect(screen.getByText(/vocabulary/i)).toBeInTheDocument();
        
        // Should show positive indicators for strengths
        expect(
          screen.getByText(/excellent/i) ||
          screen.getByText(/strong/i) ||
          screen.getByText(/80%/i) // Speaking score
        ).toBeInTheDocument();
      });
    });

    it("should identify specific areas for improvement with actionable insights", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for weakness identification
      await waitFor(() => {
        expect(screen.getByText(/areas.*improvement/i)).toBeInTheDocument();
        expect(screen.getByText(/writing.*structure/i)).toBeInTheDocument();
        expect(screen.getByText(/listening.*detail/i)).toBeInTheDocument();
        expect(screen.getByText(/time.*management/i)).toBeInTheDocument();
        
        // Should provide specific guidance
        expect(screen.getByText(/thesis.*statements/i)).toBeInTheDocument();
        expect(screen.getByText(/note.*taking.*techniques/i)).toBeInTheDocument();
      });
    });

    it("should use AI-powered analysis to provide personalized recommendations", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for AI recommendations
      await waitFor(() => {
        expect(screen.getByText(/recommendations/i)).toBeInTheDocument();
        
        // High priority recommendation
        expect(screen.getByText(/organizing.*ideas/i)).toBeInTheDocument();
        expect(screen.getByText(/15%.*improvement/i)).toBeInTheDocument();
        
        // Medium priority recommendation
        expect(screen.getByText(/note.*taking/i)).toBeInTheDocument();
        expect(screen.getByText(/10%.*improvement/i)).toBeInTheDocument();
        
        // Priority indicators
        expect(screen.getByText(/high.*priority/i)).toBeInTheDocument();
        expect(screen.getByText(/medium.*priority/i)).toBeInTheDocument();
      });
    });
  });

  describe("CEFR Alignment and Scoring", () => {
    it("should display current CEFR level assessment with confidence scores", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for CEFR assessment
      await waitFor(() => {
        expect(screen.getByText(/B2.*level/i)).toBeInTheDocument();
        expect(screen.getByText(/85%.*confidence/i)).toBeInTheDocument();
        
        // Component-specific CEFR levels
        expect(screen.getByText(/Reading.*B2.*88%/i)).toBeInTheDocument();
        expect(screen.getByText(/Writing.*B1.*75%/i)).toBeInTheDocument(); // Below target
        expect(screen.getByText(/Listening.*B2.*72%/i)).toBeInTheDocument();
        expect(screen.getByText(/Speaking.*B2.*92%/i)).toBeInTheDocument();
      });
    });

    it("should show progress toward next CEFR level (C1)", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for next level progression
      await waitFor(() => {
        expect(screen.getByText(/C1.*progress/i)).toBeInTheDocument();
        expect(screen.getByText(/42%.*toward.*C1/i)).toBeInTheDocument();
        
        // Should show what's needed for C1
        expect(
          screen.getByText(/advance.*C1/i) ||
          screen.getByText(/next.*level/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide CEFR-aligned scoring methodology explanation", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for scoring explanation
      await waitFor(() => {
        expect(
          screen.getByText(/CEFR.*standard/i) ||
          screen.getByText(/Common.*European.*Framework/i)
        ).toBeInTheDocument();
        
        // Should explain scoring criteria
        expect(
          screen.getByText(/criteria/i) ||
          screen.getByText(/assessment.*based/i) ||
          screen.getByText(/rubric/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Readiness Score and Exam Preparedness", () => {
    it("should calculate and display overall exam readiness score", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for readiness assessment
      await waitFor(() => {
        expect(screen.getByText(/74%.*ready/i)).toBeInTheDocument();
        expect(screen.getByText(/exam.*prepared/i)).toBeInTheDocument();
        
        // Should show readiness indicator
        expect(
          screen.getByText(/ready.*exam/i) ||
          screen.getByText(/prepared/i) ||
          screen.getByTestId("readiness-indicator")
        ).toBeInTheDocument();
      });
    });

    it("should identify components that need improvement before exam", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for component readiness
      await waitFor(() => {
        // Ready components
        expect(screen.getByText(/Reading.*ready/i)).toBeInTheDocument();
        expect(screen.getByText(/Listening.*ready/i)).toBeInTheDocument();
        expect(screen.getByText(/Speaking.*ready/i)).toBeInTheDocument();
        
        // Not ready component
        expect(screen.getByText(/Writing.*not.*ready/i)).toBeInTheDocument();
        expect(screen.getByText(/Writing.*needs.*improvement/i)).toBeInTheDocument();
      });
    });

    it("should provide estimated timeline for exam readiness", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for timeline estimation
      await waitFor(() => {
        expect(screen.getByText(/3.*weeks/i)).toBeInTheDocument();
        expect(
          screen.getByText(/estimated.*time/i) ||
          screen.getByText(/ready.*in/i) ||
          screen.getByText(/improvement.*needed/i)
        ).toBeInTheDocument();
        
        // Should show specific recommendations for faster improvement
        expect(
          screen.getByText(/focus.*writing/i) ||
          screen.getByText(/prioritize/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Historical Progress Tracking", () => {
    it("should display historical progress trends over time", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for historical tracking
      await waitFor(() => {
        expect(screen.getByText(/progress.*over.*time/i)).toBeInTheDocument();
        expect(screen.getByText(/trend.*analysis/i)).toBeInTheDocument();
        
        // Should show specific improvements
        expect(screen.getByText(/Reading.*improving.*13%/i)).toBeInTheDocument();
        expect(screen.getByText(/Speaking.*excellent.*15%/i)).toBeInTheDocument();
        
        // Chart should show trends
        expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      });
    });

    it("should show learning velocity and acceleration patterns", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for velocity analysis
      await waitFor(() => {
        expect(
          screen.getByText(/learning.*velocity/i) ||
          screen.getByText(/pace/i) ||
          screen.getByText(/acceleration/i)
        ).toBeInTheDocument();
        
        // Should show rate of improvement
        expect(
          screen.getByText(/13%.*improvement/i) || // Reading trend
          screen.getByText(/15%.*improvement/i)    // Speaking trend
        ).toBeInTheDocument();
      });
    });

    it("should provide comparative analysis against typical learner patterns", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for comparative analysis
      await waitFor(() => {
        expect(
          screen.getByText(/compared.*to.*others/i) ||
          screen.getByText(/typical.*learner/i) ||
          screen.getByText(/average.*progress/i)
        ).toBeInTheDocument();
        
        // Should show percentile or comparison
        expect(
          screen.getByText(/above.*average/i) ||
          screen.getByText(/percentile/i) ||
          screen.getByText(/faster.*than/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Study Recommendations Engine", () => {
    it("should generate personalized study plans based on analytics", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for study plan
      await waitFor(() => {
        expect(screen.getByText(/study.*plan/i)).toBeInTheDocument();
        expect(screen.getByText(/personalized.*recommendations/i)).toBeInTheDocument();
        
        // Should prioritize writing improvement
        expect(screen.getByText(/focus.*writing.*structure/i)).toBeInTheDocument();
        expect(screen.getByText(/high.*priority/i)).toBeInTheDocument();
        
        // Should provide time estimates
        expect(
          screen.getByText(/15%.*improvement/i) ||
          screen.getByText(/estimated.*gain/i)
        ).toBeInTheDocument();
      });
    });

    it("should suggest specific practice materials and exercises", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for specific recommendations
      await waitFor(() => {
        // Writing structure materials
        expect(screen.getByText(/thesis.*statements/i)).toBeInTheDocument();
        expect(screen.getByText(/supporting.*paragraphs/i)).toBeInTheDocument();
        
        // Listening detail materials
        expect(screen.getByText(/note.*taking.*techniques/i)).toBeInTheDocument();
        
        // Time management materials
        expect(screen.getByText(/timed.*reading.*exercises/i)).toBeInTheDocument();
        
        // Should include links or action buttons
        const practiceButtons = screen.getAllByRole("button").filter(button =>
          /practice|start|begin/i.test(button.textContent || "")
        );
        expect(practiceButtons.length).toBeGreaterThan(0);
      });
    });

    it("should update recommendations based on recent performance changes", async () => {
      // Arrange - Simulate updated progress data
      const updatedProgress = {
        ...mockProgressData,
        component_progress: {
          ...mockProgressData.component_progress,
          writing: 0.75, // Improved
        },
        strengths: [...mockProgressData.strengths, "writing_improvement"],
        weaknesses: mockProgressData.weaknesses.filter(w => w !== "writing_structure"),
      };

      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={updatedProgress}
      />);

      // Assert - Recommendations should adapt
      await waitFor(() => {
        // Should acknowledge writing improvement
        expect(screen.getByText(/writing.*improved/i)).toBeInTheDocument();
        
        // Should shift focus to next priority
        expect(
          screen.getByText(/listening.*detail/i) ||
          screen.getByText(/time.*management/i)
        ).toBeInTheDocument();
        
        // Should update priority levels
        expect(screen.getByText(/medium.*priority/i)).toBeInTheDocument();
      });
    });
  });

  describe("Data Accuracy and Visualization Quality", () => {
    it("should ensure all displayed metrics match underlying data", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Verify data accuracy
      await waitFor(() => {
        // Overall progress matches
        expect(screen.getByText(/72%/)).toBeInTheDocument();
        
        // Component progress matches
        expect(screen.getByText(/78%/)).toBeInTheDocument(); // Reading
        expect(screen.getByText(/65%/)).toBeInTheDocument(); // Writing
        expect(screen.getByText(/68%/)).toBeInTheDocument(); // Listening
        expect(screen.getByText(/80%/)).toBeInTheDocument(); // Speaking
        
        // Session count matches
        expect(screen.getByText(/15.*sessions/)).toBeInTheDocument();
        
        // Practice time matches (23 hours)
        expect(screen.getByText(/23.*hours/)).toBeInTheDocument();
      });
    });

    it("should provide interactive chart elements with detailed tooltips", async () => {
      // Arrange & Act
      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={mockProgressData}
      />);

      // Assert - Check for interactive elements
      await waitFor(() => {
        const charts = screen.getAllByTestId(/chart/);
        expect(charts.length).toBeGreaterThan(0);
        
        // Charts should be properly labeled
        expect(screen.getByText(/Chart.*Reading/i)).toBeInTheDocument();
        expect(screen.getByText(/Progress.*78, 65, 68, 80/i)).toBeInTheDocument();
        expect(screen.getByText(/Components.*reading, writing, listening, speaking/i)).toBeInTheDocument();
      });
    });

    it("should handle edge cases and missing data gracefully", async () => {
      // Arrange - Simulate incomplete data
      const incompleteProgress = {
        ...mockProgressData,
        component_progress: {
          reading: 0.78,
          writing: null, // Missing data
          listening: 0.68,
          speaking: 0.80,
        },
      };

      render(<ProgressAnalytics 
        userId={mockUser.id}
        courseId="course_english_b2"
        progressData={incompleteProgress}
      />);

      // Assert - Should handle missing data
      await waitFor(() => {
        expect(screen.getByText(/Reading.*78%/i)).toBeInTheDocument();
        expect(screen.getByText(/Listening.*68%/i)).toBeInTheDocument();
        expect(screen.getByText(/Speaking.*80%/i)).toBeInTheDocument();
        
        // Should show appropriate message for missing data
        expect(
          screen.getByText(/Writing.*no.*data/i) ||
          screen.getByText(/Writing.*insufficient/i) ||
          screen.getByText(/complete.*more.*sessions/i)
        ).toBeInTheDocument();
      });
    });
  });
});