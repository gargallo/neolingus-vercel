import { describe, it, expect, beforeEach, vi } from "vitest";
import { ValencianoCourseIntegration } from "@/lib/integration/valenciano-course";
import { createMockSupabaseClient } from "@/__tests__/helpers/supabase";
import { mockUser } from "@/__tests__/helpers/auth";

describe("Valenciano Course Integration Test", () => {
  let valencianoCourse: ValencianoCourseIntegration;
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    valencianoCourse = new ValencianoCourseIntegration(mockSupabase);
  });

  it("should provide Valenciano language courses with proper localization", async () => {
    // Arrange
    const mockValencianoCourses = [
      {
        id: "valenciano-b2-jqcv",
        language: "Valenciano",
        level: "B2",
        provider: "JQCV",
        title: "Valenciano B2 - JQCV Certificació",
        description:
          "Preparació oficial per a la certificació JQCV de Valenciano B2",
        exam_types: [
          "comprensio-lectora",
          "expressio-escrita",
          "comprensio-audicio",
          "expressio-oral",
        ],
        localized_content: true,
        created_at: new Date().toISOString(),
      },
      {
        id: "valenciano-c1-jqcv",
        language: "Valenciano",
        level: "C1",
        provider: "JQCV",
        title: "Valenciano C1 - JQCV Certificació",
        description:
          "Preparació oficial per a la certificació JQCV de Valenciano C1",
        exam_types: [
          "comprensio-lectora",
          "expressio-escrita",
          "comprensio-audicio",
          "expressio-oral",
        ],
        localized_content: true,
        created_at: new Date().toISOString(),
      },
    ];

    mockSupabase.from("courses").select().eq().mockResolvedValue({
      data: mockValencianoCourses,
      error: null,
    });

    // Act
    const result = await valencianoCourse.getValencianoCourses();

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].language).toBe("Valenciano");
    expect(result.data[0].provider).toBe("JQCV");
    expect(result.data[0].localized_content).toBe(true);
    expect(result.data[0].exam_types).toContain("comprensio-lectora");
  });

  it("should ensure JQCV compliance for Valenciano course content", async () => {
    // Arrange
    const courseId = "valenciano-b2-jqcv";
    const mockComplianceData = {
      course_id: courseId,
      jqcv_standards_met: true,
      compliance_checked_at: new Date().toISOString(),
      compliance_version: "2025.1",
      requirements: {
        ortografia: "Complert",
        gramatica: "Complert",
        lexic: "Complert",
        cultura: "Complert",
      },
      last_updated: new Date().toISOString(),
    };

    mockSupabase
      .from("course_compliance")
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockComplianceData,
        error: null,
      });

    // Act
    const result = await valencianoCourse.checkJQCVCompliance(courseId);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.jqcv_standards_met).toBe(true);
    expect(result.data.compliance_version).toBe("2025.1");
    expect(result.data.requirements.ortografia).toBe("Complert");
  });

  it("should provide Valenciano-specific exam simulations", async () => {
    // Arrange
    const courseId = "valenciano-b2-jqcv";
    const mockExamSimulations = [
      {
        id: "exam_123",
        course_id: courseId,
        exam_type: "comprensio-lectora",
        title: "Simulacre de Comprensió Lectora - B2",
        duration: 65,
        questions: 30,
        jqcv_aligned: true,
      },
      {
        id: "exam_456",
        course_id: courseId,
        exam_type: "expressio-escrita",
        title: "Simulacre d'Expressió Escrita - B2",
        duration: 80,
        questions: 2,
        jqcv_aligned: true,
      },
    ];

    mockSupabase.from("exam_sessions").select().eq().mockResolvedValue({
      data: mockExamSimulations,
      error: null,
    });

    // Act
    const result = await valencianoCourse.getValencianoExamSimulations(
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].exam_type).toBe("comprensio-lectora");
    expect(result.data[1].exam_type).toBe("expressio-escrita");
    expect(result.data[0].jqcv_aligned).toBe(true);
  });

  it("should handle Valenciano-specific AI tutoring with proper localization", async () => {
    // Arrange
    const tutoringData = {
      userId: mockUser.id,
      courseId: "valenciano-b2-jqcv",
      topic: "Gramàtica valenciana",
    };

    const mockTutoringSession = {
      id: "tutor_session_123",
      user_id: mockUser.id,
      course_id: tutoringData.courseId,
      topic: tutoringData.topic,
      language: "Valenciano",
      dialect: "valencià",
      started_at: new Date().toISOString(),
      status: "active",
    };

    mockSupabase.from("ai_tutor_sessions").insert.mockResolvedValue({
      data: [mockTutoringSession],
      error: null,
    });

    // Act
    const result = await valencianoCourse.startValencianoTutoring(tutoringData);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.language).toBe("Valenciano");
    expect(result.data.dialect).toBe("valencià");
  });

  it("should provide Valenciano cultural content integration", async () => {
    // Arrange
    const courseId = "valenciano-b2-jqcv";
    const mockCulturalContent = {
      course_id: courseId,
      content_modules: [
        {
          id: "culture_1",
          title: "Festes i tradicions valencianes",
          type: "article",
          relevance: "high",
        },
        {
          id: "culture_2",
          title: "Geografia de la Comunitat Valenciana",
          type: "interactive_map",
          relevance: "medium",
        },
      ],
      jqcv_cultural_requirements_met: true,
      last_updated: new Date().toISOString(),
    };

    mockSupabase
      .from("cultural_content")
      .select()
      .eq()
      .single.mockResolvedValue({
        data: mockCulturalContent,
        error: null,
      });

    // Act
    const result = await valencianoCourse.getValencianoCulturalContent(
      courseId
    );

    // Assert
    expect(result.success).toBe(true);
    expect(result.data.jqcv_cultural_requirements_met).toBe(true);
    expect(result.data.content_modules).toHaveLength(2);
    expect(result.data.content_modules[0].title).toBe(
      "Festes i tradicions valencianes"
    );
  });

  it("should handle database errors when retrieving Valenciano courses", async () => {
    // Arrange
    const errorMessage = "Failed to fetch Valenciano courses";
    mockSupabase
      .from("courses")
      .select()
      .eq()
      .mockResolvedValue({
        data: null,
        error: new Error(errorMessage),
      });

    // Act
    const result = await valencianoCourse.getValencianoCourses();

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe(errorMessage);
  });
});
