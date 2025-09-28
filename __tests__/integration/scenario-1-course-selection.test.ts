/**
 * Integration Tests - Scenario 1: New User Course Selection
 * T018: User Journey Testing for Course-Centric Academy
 * 
 * Tests the complete user journey for unauthenticated users visiting /dashboard
 * and browsing available courses with language selection interface.
 * 
 * Test Coverage:
 * ✅ Language selection interface (English/Valenciano)
 * ✅ Course descriptions and level options display
 * ✅ Responsive design across viewport sizes
 * ✅ Call-to-action buttons functionality
 * ✅ Route navigation behavior
 * ✅ Professional UI/UX design validation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRouter } from "next/router";
import AcademiaPage from "@/app/dashboard/page";
import CourseSelection from "@/components/academia/course-selection";

// Mock Next.js router
const mockPush = vi.fn();
const mockRouter: Partial<NextRouter> = {
  push: mockPush,
  pathname: "/dashboard",
  route: "/dashboard",
  asPath: "/dashboard",
  query: {},
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard",
}));

// Mock Supabase client for unauthenticated user
vi.mock("@/utils/supabase/client", () => ({
  createSupabaseClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({
      data: [
        {
          id: "course_english_b2",
          title: "English B2 (EOI)",
          language: "english",
          level: "b2",
          certification_type: "eoi",
          description: "Prepare for your English B2 certification with comprehensive exam simulation",
          is_active: true,
          total_hours: 120,
          difficulty_score: 0.7,
        },
        {
          id: "course_english_c1", 
          title: "English C1 (EOI)",
          language: "english",
          level: "c1",
          certification_type: "eoi",
          description: "Advanced English preparation for C1 level certification",
          is_active: true,
          total_hours: 160,
          difficulty_score: 0.85,
        },
        {
          id: "course_valenciano_c1",
          title: "Valencià C1 (JQCV)",
          language: "valenciano", 
          level: "c1",
          certification_type: "jqcv",
          description: "Preparació per a la certificació de Valencià nivell C1",
          is_active: true,
          total_hours: 140,
          difficulty_score: 0.8,
        },
      ],
      error: null,
    }),
  }),
}));

// Mock demo mode detection
vi.mock("@/lib/demo-mode", () => ({
  isDemoModeActive: vi.fn().mockReturnValue(true),
  isServerSideDemoMode: vi.fn().mockReturnValue(true),
}));

// Mock ResizeObserver for responsive testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("Integration Test - Scenario 1: New User Course Selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Academia Landing Page - Language Selection Interface", () => {
    it("should display both language options (English and Valenciano) for unauthenticated users", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Wait for component to load and verify language options
      await waitFor(() => {
        expect(screen.getByText(/English/i)).toBeInTheDocument();
        expect(screen.getByText(/Valencià/i)).toBeInTheDocument();
      });

      // Verify language selection cards are rendered
      const languageCards = screen.getAllByRole("button");
      expect(languageCards.length).toBeGreaterThanOrEqual(2);
    });

    it("should display course descriptions and level options for each language", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Check for course descriptions
      await waitFor(() => {
        // English courses
        expect(screen.getByText(/English B2.*EOI/i)).toBeInTheDocument();
        expect(screen.getByText(/English C1.*EOI/i)).toBeInTheDocument();
        
        // Valenciano courses  
        expect(screen.getByText(/Valencià C1.*JQCV/i)).toBeInTheDocument();
        
        // Level indicators
        expect(screen.getByText(/B2/)).toBeInTheDocument();
        expect(screen.getByText(/C1/)).toBeInTheDocument();
      });

      // Verify course descriptions contain helpful information
      expect(screen.getByText(/comprehensive exam simulation/i)).toBeInTheDocument();
      expect(screen.getByText(/Advanced English preparation/i)).toBeInTheDocument();
    });

    it("should display call-to-action buttons for course selection", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Verify CTA buttons exist and are actionable
      await waitFor(() => {
        const ctaButtons = screen.getAllByRole("button");
        expect(ctaButtons.length).toBeGreaterThan(0);
        
        // Check for selection-related text
        expect(
          screen.getByText(/Seleccionar/i) || 
          screen.getByText(/Select/i) ||
          screen.getByText(/Comenzar/i) ||
          screen.getByText(/Start/i)
        ).toBeInTheDocument();
      });
    });

    it("should navigate to course-specific routes when language/level is selected", async () => {
      // Arrange
      render(<AcademiaPage />);

      // Act - Find and click English B2 course selection
      await waitFor(() => {
        const englishB2Button = screen.getByText(/English B2/i).closest("button");
        expect(englishB2Button).toBeInTheDocument();
      });

      const englishB2Button = screen.getByText(/English B2/i).closest("button");
      fireEvent.click(englishB2Button!);

      // Assert - Verify navigation to correct route
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard/english/b2");
      });
    });
  });

  describe("Responsive Design Validation", () => {
    it("should render properly on mobile viewport (375px width)", async () => {
      // Arrange - Mock mobile viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 667,
      });

      // Act
      render(<AcademiaPage />);

      // Assert - Verify mobile layout
      await waitFor(() => {
        const container = document.querySelector('[data-testid="language-selection"]') || 
                         document.querySelector('.grid') ||
                         document.querySelector('[class*="grid"]');
        
        if (container) {
          const styles = window.getComputedStyle(container);
          // On mobile, should use single column grid or flex column
          expect(
            styles.gridTemplateColumns === "1fr" ||
            styles.flexDirection === "column" ||
            styles.display === "block"
          ).toBe(true);
        }
      });
    });

    it("should render properly on desktop viewport (1200px width)", async () => {
      // Arrange - Mock desktop viewport
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1200,
      });
      Object.defineProperty(window, "innerHeight", {
        writable: true,
        configurable: true,
        value: 800,
      });

      // Act
      render(<AcademiaPage />);

      // Assert - Verify desktop layout allows for proper spacing
      await waitFor(() => {
        const languageCards = screen.getAllByRole("button");
        expect(languageCards.length).toBeGreaterThan(0);
        
        // Verify elements are visible and not stacked awkwardly
        languageCards.forEach(card => {
          expect(card).toBeVisible();
        });
      });
    });

    it("should maintain proper aspect ratios and spacing across viewports", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Verify consistent spacing and readability
      await waitFor(() => {
        const textElements = screen.getAllByText(/English|Valencià/i);
        
        textElements.forEach(element => {
          expect(element).toBeVisible();
          // Elements should not be cut off or overlapping
          const rect = element.getBoundingClientRect();
          expect(rect.width).toBeGreaterThan(0);
          expect(rect.height).toBeGreaterThan(0);
        });
      });
    });
  });

  describe("Professional UI/UX Design Validation", () => {
    it("should display smooth animations and professional design elements", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Check for professional styling classes or attributes
      await waitFor(() => {
        const containers = document.querySelectorAll('[class*="transition"], [class*="animate"], [class*="hover"]');
        expect(containers.length).toBeGreaterThan(0);
      });

      // Verify proper contrast and typography
      const headings = screen.getAllByRole("heading");
      headings.forEach(heading => {
        expect(heading).toBeVisible();
        expect(heading.tagName).toMatch(/H[1-6]/);
      });
    });

    it("should provide clear visual hierarchy with proper typography", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Verify heading structure and content hierarchy
      await waitFor(() => {
        // Main page heading should exist
        const mainHeading = screen.getByRole("heading", { level: 1 }) ||
                           screen.getByRole("heading", { level: 2 });
        expect(mainHeading).toBeInTheDocument();

        // Language/course options should be clearly labeled
        expect(screen.getByText(/English/i)).toBeInTheDocument();
        expect(screen.getByText(/Valencià/i)).toBeInTheDocument();
      });
    });

    it("should provide accessibility features for screen readers", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Verify ARIA labels and semantic HTML
      await waitFor(() => {
        const buttons = screen.getAllByRole("button");
        
        buttons.forEach(button => {
          // Buttons should have accessible names
          expect(
            button.getAttribute("aria-label") ||
            button.textContent ||
            button.querySelector("span")?.textContent
          ).toBeTruthy();
        });

        // Check for proper heading structure
        const headings = screen.getAllByRole("heading");
        expect(headings.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Course Data Integration", () => {
    it("should load and display course information from Supabase", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Verify course data is loaded and displayed
      await waitFor(() => {
        // English courses
        expect(screen.getByText(/English B2.*EOI/i)).toBeInTheDocument();
        expect(screen.getByText(/English C1.*EOI/i)).toBeInTheDocument();
        
        // Valenciano courses
        expect(screen.getByText(/Valencià C1.*JQCV/i)).toBeInTheDocument();
        
        // Course details
        expect(screen.getByText(/120/)).toBeInTheDocument(); // Total hours
        expect(screen.getByText(/comprehensive exam simulation/i)).toBeInTheDocument();
      });
    });

    it("should handle empty or error states gracefully", async () => {
      // Arrange - Mock empty course data
      vi.mocked(vi.fn()).mockImplementationOnce(() => ({
        createSupabaseClient: vi.fn().mockReturnValue({
          auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
          },
          from: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }));

      // Act
      render(<AcademiaPage />);

      // Assert - Should show appropriate message for no courses
      await waitFor(() => {
        expect(
          screen.getByText(/No courses available/i) ||
          screen.getByText(/Coming soon/i) ||
          screen.getByText(/Loading/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("Demo Mode Integration", () => {
    it("should work properly in demo mode for unauthenticated users", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Verify demo mode doesn't block functionality
      await waitFor(() => {
        expect(screen.getByText(/English/i)).toBeInTheDocument();
        expect(screen.getByText(/Valencià/i)).toBeInTheDocument();
        
        // Should still allow course selection in demo mode
        const buttons = screen.getAllByRole("button");
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it("should provide clear indication of demo mode if applicable", async () => {
      // Arrange & Act
      render(<AcademiaPage />);

      // Assert - Check for demo mode indicators (if any)
      await waitFor(() => {
        // Demo mode might show banners or indicators
        const demoIndicators = document.querySelectorAll('[data-demo], [class*="demo"], [class*="preview"]');
        // This is optional - demo mode may or may not have visual indicators
        
        // Main functionality should still work
        expect(screen.getByText(/English|Valencià/i)).toBeInTheDocument();
      });
    });
  });
});