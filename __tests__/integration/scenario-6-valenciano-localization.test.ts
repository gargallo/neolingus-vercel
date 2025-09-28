/**
 * Integration Tests - Scenario 6: Valenciano Course Localization
 * T023: JQCV Valenciano C1 Course Localization Testing
 * 
 * Tests the complete user journey for Valenciano language learners
 * accessing the specialized C1 course with full localization following
 * JQCV (Junta Qualificadora de Coneixements de Valencià) standards.
 * 
 * Test Coverage:
 * ✅ Valenciano language interface and content localization
 * ✅ JQCV certification alignment and assessment structure
 * ✅ Regional cultural context integration in examples
 * ✅ Compliance with Valencian educational standards
 * ✅ Independent LOPD-compliant data handling
 * ✅ Valenciano-specific exam formats and timing
 * ✅ Cultural sensitivity and regional references
 * ✅ Legal compliance with regional education requirements
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextRouter } from "next/router";
import ValencianoCoursePage from "@/app/dashboard/[idioma]/[nivel]/page";

// Mock Next.js router for Valenciano course
const mockPush = vi.fn();
const mockRouter: Partial<NextRouter> = {
  push: mockPush,
  pathname: "/dashboard/valenciano/c1",
  route: "/dashboard/[idioma]/[nivel]",
  asPath: "/dashboard/valenciano/c1",
  query: { idioma: "valenciano", nivel: "c1" },
};

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/dashboard/valenciano/c1",
  useParams: () => ({ idioma: "valenciano", nivel: "c1" }),
}));

// Mock authenticated user for Valenciano course
const mockUser = {
  id: "user_valenciano_12345678-1234-1234-1234-123456789abc",
  email: "estudiant@neolingus.com",
  user_metadata: { 
    full_name: "Maria Pérez",
    language_preference: "valenciano"
  },
};

// Mock Valenciano course data with JQCV specifications
const mockValencianoCourse = {
  id: "course_valenciano_c1",
  title: "Valencià C1 (JQCV)",
  language: "valenciano",
  level: "c1",
  certification_type: "jqcv",
  description: "Preparació per a la certificació de Valencià nivell C1 segons els estàndards de la Junta Qualificadora",
  is_active: true,
  total_hours: 140,
  difficulty_score: 0.8,
  regional_context: "valencia",
  cultural_content: true,
  compliance_standards: ["lopd", "jqcv", "gva"],
  exam_structure: {
    comprensio_oral: { duration_minutes: 45, questions: 20 },
    comprensio_escrita: { duration_minutes: 90, questions: 30 },
    expressio_oral: { duration_minutes: 20, tasks: 4 },
    expressio_escrita: { duration_minutes: 90, tasks: 2 },
    mediacio: { duration_minutes: 60, tasks: 2 }, // Unique to JQCV
  },
  cultural_references: [
    "Literatura valenciana contemporània",
    "Tradicions i festes populars",
    "Gastronomia mediterrània", 
    "Arquitectura i patrimoni",
    "Economia i societat valenciana"
  ],
};

// Mock user progress in Valenciano with JQCV-specific components
const mockValencianoProgress = {
  overall_progress: 0.68,
  component_progress: {
    comprensio_oral: 0.72,
    comprensio_escrita: 0.75,
    expressio_oral: 0.60,
    expressio_escrita: 0.65,
    mediacio: 0.58, // New component specific to JQCV
  },
  sessions_completed: 12,
  cultural_competency: 0.70,
  regional_knowledge: 0.65,
  jqcv_readiness: 0.64,
  strengths: ["comprensio_escrita", "vocabulari_tecnic"],
  weaknesses: ["expressio_oral_formal", "mediacio_intercultural"],
};

// Mock Supabase client with Valenciano-specific data
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
          data: mockValencianoCourse,
          error: null,
        });
      } else if (table === "user_course_progress") {
        mockChain.single.mockResolvedValue({
          data: mockValencianoProgress,
          error: null,
        });
      } else if (table === "user_course_enrollments") {
        mockChain.single.mockResolvedValue({
          data: {
            id: "enrollment_valenciano_123",
            user_id: mockUser.id,
            course_id: mockValencianoCourse.id,
            enrolled_at: "2025-01-10T10:00:00Z",
            status: "active",
            lopd_consent: true,
            data_retention_consent: true,
            cultural_content_consent: true,
          },
          error: null,
        });
      }

      return mockChain;
    }),
  }),
}));

// Mock LOPD compliance module
vi.mock("@/lib/compliance/lopd", () => ({
  LOPDCompliance: {
    validateDataHandling: vi.fn().mockReturnValue({ valid: true, region: "valencia" }),
    getRetentionPolicy: vi.fn().mockReturnValue({ 
      retention_years: 7,
      anonymization_after: 3,
      cross_border_transfers: false,
    }),
    generateConsentRecord: vi.fn().mockReturnValue({
      consent_id: "lopd_consent_123",
      granted_at: "2025-01-10T10:00:00Z",
      scope: ["educational_progress", "cultural_content", "regional_data"],
    }),
  },
}));

// Mock cultural content service
vi.mock("@/lib/cultural/valenciano-content", () => ({
  ValencianoCulturalContent: {
    getLocalizedContent: vi.fn().mockReturnValue({
      greetings: "Bon dia",
      cultural_references: mockValencianoCourse.cultural_references,
      regional_examples: [
        "La Lonja de la Seda de València",
        "Les Falles patrimoni immaterial",
        "El Tribunal de les Aigües"
      ],
    }),
    validateCulturalSensitivity: vi.fn().mockReturnValue({ appropriate: true }),
  },
}));

// Mock JQCV certification engine
vi.mock("@/lib/certification/jqcv-engine", () => ({
  JQCVEngine: {
    validateExamStructure: vi.fn().mockReturnValue({ valid: true, components: 5 }),
    calculateJQCVScore: vi.fn().mockReturnValue({
      overall_score: 0.68,
      component_scores: mockValencianoProgress.component_progress,
      certification_ready: false,
      areas_improvement: ["expressio_oral_formal", "mediacio"],
    }),
    generateCertificationReport: vi.fn().mockReturnValue({
      level: "c1",
      status: "en_progres",
      estimated_certification_date: "2025-03-15",
    }),
  },
}));

describe("Integration Test - Scenario 6: Valenciano Course Localization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Valenciano Language Interface and Localization", () => {
    it("should display complete interface in Valenciano language", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for Valenciano interface elements
      await waitFor(() => {
        // Course title and description in Valenciano
        expect(screen.getByText(/Valencià C1.*JQCV/i)).toBeInTheDocument();
        expect(screen.getByText(/Preparació.*certificació.*Valencià/i)).toBeInTheDocument();
        
        // Navigation and UI elements in Valenciano
        expect(screen.getByText(/Progrés/i)).toBeInTheDocument();
        expect(screen.getByText(/Exercicis/i)).toBeInTheDocument();
        expect(screen.getByText(/Avaluació/i)).toBeInTheDocument();
        
        // Welcome message in Valenciano
        expect(screen.getByText(/Bon dia/i)).toBeInTheDocument();
      });
    });

    it("should use Valenciano-specific terminology and expressions", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for region-specific terminology
      await waitFor(() => {
        // JQCV-specific terms
        expect(screen.getByText(/Junta Qualificadora/i)).toBeInTheDocument();
        expect(screen.getByText(/Coneixements.*Valencià/i)).toBeInTheDocument();
        
        // Valenciano language skills terminology
        expect(screen.getByText(/Comprensió oral/i)).toBeInTheDocument();
        expect(screen.getByText(/Comprensió escrita/i)).toBeInTheDocument();
        expect(screen.getByText(/Expressió oral/i)).toBeInTheDocument();
        expect(screen.getByText(/Expressió escrita/i)).toBeInTheDocument();
        expect(screen.getByText(/Mediació/i)).toBeInTheDocument(); // Unique to JQCV
      });
    });

    it("should provide culturally appropriate date, number, and currency formatting", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for regional formatting
      await waitFor(() => {
        // Date format should follow European/Spanish conventions
        expect(
          screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/) || // DD/MM/YYYY
          screen.getByText(/\d{1,2} de \w+ de \d{4}/) // DD de Month de YYYY
        ).toBeInTheDocument();
        
        // Time format should use 24-hour clock
        expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
        
        // Progress percentages with European formatting
        expect(screen.getByText(/68%|72%|75%/)).toBeInTheDocument();
      });
    });

    it("should handle text direction and typography appropriate for Valenciano", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for proper text rendering
      await waitFor(() => {
        // Should handle special Valenciano characters correctly
        const textElements = screen.getAllByText(/à|è|í|ï|ò|ó|ú|ü|ç|ny|l·l/i);
        textElements.forEach(element => {
          expect(element).toBeVisible();
          expect(element.textContent).toMatch(/[àèíïòóúüçñ]/);
        });
        
        // Text should be left-to-right
        const mainContent = document.querySelector("main") || document.body;
        expect(getComputedStyle(mainContent).direction).toBe("ltr");
      });
    });
  });

  describe("JQCV Certification Alignment", () => {
    it("should follow JQCV certification structure with 5 components", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for all JQCV components
      await waitFor(() => {
        // Traditional 4 skills
        expect(screen.getByText(/Comprensió oral/i)).toBeInTheDocument();
        expect(screen.getByText(/Comprensió escrita/i)).toBeInTheDocument();
        expect(screen.getByText(/Expressió oral/i)).toBeInTheDocument();
        expect(screen.getByText(/Expressió escrita/i)).toBeInTheDocument();
        
        // Mediation component (unique to JQCV)
        expect(screen.getByText(/Mediació/i)).toBeInTheDocument();
        expect(screen.getByText(/intercultural/i)).toBeInTheDocument();
      });
    });

    it("should display JQCV-specific timing and exam structure", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for JQCV timing
      await waitFor(() => {
        // Comprensió oral: 45 minutes
        expect(screen.getByText(/45.*minuts/i)).toBeInTheDocument();
        
        // Comprensió escrita: 90 minutes
        expect(screen.getByText(/90.*minuts/i)).toBeInTheDocument();
        
        // Expressió oral: 20 minutes (different from EOI)
        expect(screen.getByText(/20.*minuts/i)).toBeInTheDocument();
        
        // Mediació: 60 minutes (unique component)
        expect(screen.getByText(/60.*minuts.*mediació/i)).toBeInTheDocument();
      });
    });

    it("should provide JQCV-specific assessment criteria and rubrics", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for assessment information
      await waitFor(() => {
        expect(screen.getByText(/criteris.*avaluació/i)).toBeInTheDocument();
        expect(screen.getByText(/rúbrica.*JQCV/i)).toBeInTheDocument();
        
        // Should mention competency levels
        expect(screen.getByText(/competència.*lingüística/i)).toBeInTheDocument();
        expect(screen.getByText(/competència.*cultural/i)).toBeInTheDocument();
        
        // Assessment according to JQCV standards
        expect(screen.getByText(/estàndards.*JQCV/i)).toBeInTheDocument();
      });
    });

    it("should track mediation component progress separately", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for mediation-specific tracking
      await waitFor(() => {
        expect(screen.getByText(/Mediació.*58%/i)).toBeInTheDocument();
        expect(screen.getByText(/mediació.*intercultural/i)).toBeInTheDocument();
        
        // Should show mediation-specific weaknesses
        expect(screen.getByText(/millora.*mediació/i)).toBeInTheDocument();
        
        // Should provide mediation practice options
        expect(
          screen.getByText(/pràctica.*mediació/i) ||
          screen.getByRole("button", { name: /mediació/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe("Regional Cultural Context Integration", () => {
    it("should incorporate Valencian cultural references in content", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for cultural content
      await waitFor(() => {
        // Historical and architectural references
        expect(screen.getByText(/Lonja.*Seda.*València/i)).toBeInTheDocument();
        expect(screen.getByText(/Falles.*patrimoni/i)).toBeInTheDocument();
        expect(screen.getByText(/Tribunal.*Aigües/i)).toBeInTheDocument();
        
        // Cultural categories
        expect(screen.getByText(/Literatura valenciana/i)).toBeInTheDocument();
        expect(screen.getByText(/Tradicions.*festes/i)).toBeInTheDocument();
        expect(screen.getByText(/Gastronomia mediterrània/i)).toBeInTheDocument();
      });
    });

    it("should use regionally appropriate examples and scenarios", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for regional examples
      await waitFor(() => {
        // Geographic references
        expect(
          screen.getByText(/València|Alacant|Castelló/i) ||
          screen.getByText(/País Valencià/i)
        ).toBeInTheDocument();
        
        // Regional institutions
        expect(
          screen.getByText(/Generalitat/i) ||
          screen.getByText(/Acadèmia Valenciana/i) ||
          screen.getByText(/À Punt/i) // Regional media
        ).toBeInTheDocument();
        
        // Economic and social context
        expect(screen.getByText(/economia.*valenciana/i)).toBeInTheDocument();
        expect(screen.getByText(/societat.*valenciana/i)).toBeInTheDocument();
      });
    });

    it("should demonstrate cultural sensitivity in content presentation", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for cultural sensitivity
      await waitFor(() => {
        // Should avoid controversial topics
        expect(screen.queryByText(/conflicte.*lingüístic/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/política.*identitària/i)).not.toBeInTheDocument();
        
        // Should focus on positive cultural aspects
        expect(screen.getByText(/riquesa.*cultural/i)).toBeInTheDocument();
        expect(screen.getByText(/diversitat.*lingüística/i)).toBeInTheDocument();
        
        // Should promote intercultural competence
        expect(screen.getByText(/competència.*intercultural/i)).toBeInTheDocument();
      });
    });

    it("should provide context for regional expressions and idioms", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for regional language features
      await waitFor(() => {
        // Regional expressions
        expect(
          screen.getByText(/expressió.*regional/i) ||
          screen.getByText(/modismes.*valencians/i)
        ).toBeInTheDocument();
        
        // Dialectal variations explanation
        expect(
          screen.getByText(/variants.*dialectals/i) ||
          screen.getByText(/varietats.*territorials/i)
        ).toBeInTheDocument();
        
        // Cultural context for expressions
        expect(screen.getByText(/context.*cultural/i)).toBeInTheDocument();
      });
    });
  });

  describe("Valencian Educational Standards Compliance", () => {
    it("should align with Generalitat Valenciana educational requirements", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for compliance indicators
      await waitFor(() => {
        expect(screen.getByText(/Generalitat.*Valenciana/i)).toBeInTheDocument();
        expect(screen.getByText(/estàndards.*educatius/i)).toBeInTheDocument();
        
        // Should mention official recognition
        expect(
          screen.getByText(/reconeixement.*oficial/i) ||
          screen.getByText(/certificació.*oficial/i)
        ).toBeInTheDocument();
        
        // Compliance with GVA standards
        expect(screen.getByText(/normativa.*GVA/i)).toBeInTheDocument();
      });
    });

    it("should follow Marco Común Europeo adaptations for Valenciano", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for CEFR adaptation
      await waitFor(() => {
        expect(screen.getByText(/Marc.*Comú.*Europeu/i)).toBeInTheDocument();
        expect(screen.getByText(/nivell.*C1/i)).toBeInTheDocument();
        
        // Should show CEFR descriptors in Valenciano
        expect(
          screen.getByText(/competència.*comunicativa/i) ||
          screen.getByText(/domini.*avançat/i)
        ).toBeInTheDocument();
        
        // Adaptation for regional context
        expect(screen.getByText(/adaptació.*context.*valencià/i)).toBeInTheDocument();
      });
    });

    it("should provide official certification pathway information", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for certification info
      await waitFor(() => {
        expect(screen.getByText(/camí.*certificació/i)).toBeInTheDocument();
        expect(screen.getByText(/examen.*oficial/i)).toBeInTheDocument();
        
        // Should show next certification date
        expect(screen.getByText(/2025.*març/i)).toBeInTheDocument();
        
        // Should explain certification benefits
        expect(
          screen.getByText(/beneficis.*certificació/i) ||
          screen.getByText(/reconeixement.*laboral/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("LOPD-Compliant Data Handling", () => {
    it("should implement independent data handling compliant with LOPD", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for LOPD compliance
      await waitFor(() => {
        expect(screen.getByText(/protecció.*dades/i)).toBeInTheDocument();
        expect(screen.getByText(/LOPD/i)).toBeInTheDocument();
        
        // Should show consent status
        expect(screen.getByText(/consentiment.*concedit/i)).toBeInTheDocument();
        
        // Should mention data retention policy
        expect(
          screen.getByText(/política.*retenció/i) ||
          screen.getByText(/7.*anys/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide Spanish data protection rights information", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for data rights
      await waitFor(() => {
        expect(screen.getByText(/drets.*protecció.*dades/i)).toBeInTheDocument();
        
        // ARCO rights in Spanish context
        expect(screen.getByText(/accés/i)).toBeInTheDocument();
        expect(screen.getByText(/rectificació/i)).toBeInTheDocument();
        expect(screen.getByText(/cancel·lació/i)).toBeInTheDocument();
        expect(screen.getByText(/oposició/i)).toBeInTheDocument();
        
        // Contact for data protection
        expect(
          screen.getByText(/delegat.*protecció.*dades/i) ||
          screen.getByText(/contacte.*privacitat/i)
        ).toBeInTheDocument();
      });
    });

    it("should handle cross-border data transfer restrictions", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for data locality
      await waitFor(() => {
        expect(
          screen.getByText(/dades.*locals/i) ||
          screen.getByText(/servidor.*espanyol/i) ||
          screen.getByText(/no.*transferència.*internacional/i)
        ).toBeInTheDocument();
        
        // Should indicate EU data protection compliance
        expect(screen.getByText(/compliment.*GDPR/i)).toBeInTheDocument();
        
        // Regional data handling notice
        expect(screen.getByText(/tractament.*regional/i)).toBeInTheDocument();
      });
    });

    it("should provide granular consent options for different data uses", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for consent granularity
      await waitFor(() => {
        expect(screen.getByText(/consentiments.*granulars/i)).toBeInTheDocument();
        
        // Different consent categories
        expect(screen.getByText(/progrés.*educatiu/i)).toBeInTheDocument();
        expect(screen.getByText(/contingut.*cultural/i)).toBeInTheDocument();
        expect(screen.getByText(/dades.*regionals/i)).toBeInTheDocument();
        
        // Ability to withdraw consent
        expect(screen.getByText(/retirar.*consentiment/i)).toBeInTheDocument();
      });
    });
  });

  describe("User Experience and Navigation", () => {
    it("should provide seamless navigation in Valenciano interface", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check navigation elements
      await waitFor(() => {
        // Navigation menu in Valenciano
        expect(screen.getByText(/Inici/i)).toBeInTheDocument();
        expect(screen.getByText(/Exercicis/i)).toBeInTheDocument();
        expect(screen.getByText(/Progrés/i)).toBeInTheDocument();
        expect(screen.getByText(/Perfil/i)).toBeInTheDocument();
        
        // Action buttons in Valenciano
        const practiceButton = screen.getByRole("button", { name: /començar.*pràctica/i });
        expect(practiceButton).toBeInTheDocument();
      });

      // Test navigation functionality
      const exerciseButton = screen.getByText(/Exercicis/i);
      fireEvent.click(exerciseButton);

      expect(mockPush).toHaveBeenCalledWith(
        expect.stringMatching(/\/dashboard\/valenciano\/c1\/.*/)
      );
    });

    it("should handle language switching between Valenciano and Spanish", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for language switching options
      await waitFor(() => {
        expect(
          screen.getByText(/idioma/i) ||
          screen.getByText(/llengua/i) ||
          screen.getByRole("button", { name: /canviar.*idioma/i })
        ).toBeInTheDocument();
        
        // Should offer Spanish as alternative
        expect(
          screen.getByText(/Castellà/i) ||
          screen.getByText(/Español/i)
        ).toBeInTheDocument();
      });
    });

    it("should maintain consistent Valenciano terminology throughout the application", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check terminology consistency
      await waitFor(() => {
        // Consistent use of "exercici" not "ejercicio"
        expect(screen.getAllByText(/exercici/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/ejercicio/i)).not.toBeInTheDocument();
        
        // Consistent use of "avaluació" not "evaluación"
        expect(screen.getAllByText(/avaluació/i).length).toBeGreaterThan(0);
        expect(screen.queryByText(/evaluación/i)).not.toBeInTheDocument();
        
        // Consistent use of Valenciano numerals and time expressions
        expect(
          screen.getByText(/minuts/i) ||
          screen.getByText(/hores/i)
        ).toBeInTheDocument();
      });
    });

    it("should provide appropriate help and support in Valenciano", async () => {
      // Arrange & Act
      render(<ValencianoCoursePage params={{ idioma: "valenciano", nivel: "c1" }} />);

      // Assert - Check for Valenciano support
      await waitFor(() => {
        expect(
          screen.getByText(/ajuda/i) ||
          screen.getByText(/suport/i) ||
          screen.getByRole("button", { name: /ajuda/i })
        ).toBeInTheDocument();
        
        // Should provide Valenciano FAQ or help section
        expect(
          screen.getByText(/preguntes.*freqüents/i) ||
          screen.getByText(/guia.*ús/i)
        ).toBeInTheDocument();
        
        // Contact information in Valenciano
        expect(
          screen.getByText(/contacte/i) ||
          screen.getByText(/suport.*tècnic/i)
        ).toBeInTheDocument();
      });
    });
  });
});