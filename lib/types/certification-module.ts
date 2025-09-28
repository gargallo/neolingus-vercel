/**
 * TypeScript types for CertificationModule entity
 * Modular certification system supporting multiple exam providers
 */

// Core types
export type UUID = string;
export type JSONObject = Record<string, unknown>;

// Rollout phase enumeration
export enum CertificationPhase {
  PHASE_1 = 1,
  PHASE_2 = 2,
  PHASE_3 = 3
}

// Language codes following ISO 639-1
export enum LanguageCode {
  EN = 'en',
  ES = 'es',
  VA = 'va', // Valenciano
  CA = 'ca', // Catalan
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt'
}

// Exam component types
export enum ExamComponentType {
  LISTENING = 'listening',
  READING = 'reading',
  WRITING = 'writing',
  SPEAKING = 'speaking',
  USE_OF_LANGUAGE = 'use_of_language',
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary'
}

// Question types for content configuration
export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_IN_BLANK = 'fill_in_blank',
  ESSAY = 'essay',
  LISTENING_COMPREHENSION = 'listening_comprehension',
  READING_COMPREHENSION = 'reading_comprehension',
  ORAL_PRESENTATION = 'oral_presentation',
  WRITTEN_COMPOSITION = 'written_composition',
  MATCHING = 'matching',
  ORDERING = 'ordering'
}

// Difficulty levels
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  ELEMENTARY = 'elementary',
  INTERMEDIATE = 'intermediate',
  UPPER_INTERMEDIATE = 'upper_intermediate',
  ADVANCED = 'advanced',
  PROFICIENCY = 'proficiency'
}

// Exam structure interfaces
export interface ExamComponent {
  type: ExamComponentType;
  name: string;
  description?: string;
  duration_minutes: number;
  max_score: number;
  weight_percentage: number;
  is_required: boolean;
  sections?: ExamSection[];
}

export interface ExamSection {
  id: string;
  name: string;
  description?: string;
  question_count: number;
  duration_minutes?: number;
  instructions?: string;
  question_types: QuestionType[];
}

export interface ExamTiming {
  total_duration_minutes: number;
  break_duration_minutes?: number;
  components: Array<{
    component_type: ExamComponentType;
    start_time_minutes: number;
    duration_minutes: number;
  }>;
}

export interface ScoringCriteria {
  total_max_score: number;
  passing_score: number;
  component_requirements?: Array<{
    component_type: ExamComponentType;
    min_score: number;
    is_required_to_pass: boolean;
  }>;
  grade_boundaries?: Array<{
    grade: string;
    min_score: number;
    max_score: number;
  }>;
}

export interface ExamStructure {
  components: ExamComponent[];
  timing: ExamTiming;
  scoring: ScoringCriteria;
  format: 'paper' | 'digital' | 'mixed';
  certification_level?: string;
  cefr_level?: string; // Common European Framework of Reference
}

// Content configuration interfaces
export interface QuestionTypeConfig {
  type: QuestionType;
  enabled: boolean;
  weight: number;
  difficulty_distribution: Record<DifficultyLevel, number>;
  max_per_section?: number;
  special_requirements?: JSONObject;
}

export interface ContentConfig {
  question_types: QuestionTypeConfig[];
  difficulty_levels: DifficultyLevel[];
  content_domains: string[];
  adaptive_difficulty: boolean;
  randomization_enabled: boolean;
  time_limits: Record<QuestionType, number>;
  special_accommodations?: JSONObject;
}

// Compliance and regulatory interfaces
export interface GDPRCompliance {
  data_retention_days: number;
  consent_required: boolean;
  right_to_erasure: boolean;
  data_portability: boolean;
  privacy_notice_url?: string;
}

export interface RegionalCompliance {
  region: string;
  regulations: string[];
  certification_requirements?: string[];
  accessibility_standards?: string[];
}

export interface ComplianceRequirements {
  gdpr: GDPRCompliance;
  regional: RegionalCompliance[];
  accessibility: {
    wcag_level: 'A' | 'AA' | 'AAA';
    screen_reader_support: boolean;
    keyboard_navigation: boolean;
    high_contrast_support: boolean;
  };
  data_security: {
    encryption_required: boolean;
    audit_logging: boolean;
    secure_transmission: boolean;
  };
}

// Main CertificationModule interface
export interface CertificationModule {
  id: UUID;
  name: string;
  code: string;
  language: LanguageCode;
  certification_body: string;
  official_website: string;
  exam_structure: ExamStructure;
  content_config: ContentConfig;
  compliance_requirements: ComplianceRequirements;
  is_active: boolean;
  phase: CertificationPhase;
  launch_date: Date;
  version: string;
  created_at: Date;
  updated_at: Date;
}

// Validation schemas and utility types
export interface CertificationModuleValidation {
  code_unique: boolean;
  exam_structure_valid: boolean;
  phase_valid: boolean;
  launch_date_valid: boolean;
  compliance_complete: boolean;
}

export interface CertificationModuleCreateInput {
  name: string;
  code: string;
  language: LanguageCode;
  certification_body: string;
  official_website: string;
  exam_structure: ExamStructure;
  content_config: ContentConfig;
  compliance_requirements: ComplianceRequirements;
  phase: CertificationPhase;
  launch_date: Date;
  version: string;
}

export interface CertificationModuleUpdateInput {
  name?: string;
  code?: string;
  language?: LanguageCode;
  certification_body?: string;
  official_website?: string;
  exam_structure?: ExamStructure;
  content_config?: ContentConfig;
  compliance_requirements?: ComplianceRequirements;
  is_active?: boolean;
  phase?: CertificationPhase;
  launch_date?: Date;
  version?: string;
}

// Utility types for working with certification modules
export type CertificationModuleWithValidation = CertificationModule & {
  validation: CertificationModuleValidation;
};

export type CertificationModuleSummary = Pick<
  CertificationModule,
  'id' | 'name' | 'code' | 'language' | 'certification_body' | 'is_active' | 'phase' | 'version'
>;

export type ActiveCertificationModule = CertificationModule & {
  is_active: true;
  launch_date: Date;
};

// Filter and query types
export interface CertificationModuleFilters {
  language?: LanguageCode;
  certification_body?: string;
  is_active?: boolean;
  phase?: CertificationPhase;
  launch_date_from?: Date;
  launch_date_to?: Date;
}

export interface CertificationModuleQuery {
  filters?: CertificationModuleFilters;
  sort_by?: keyof CertificationModule;
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Error types for validation
export interface CertificationModuleError {
  field: keyof CertificationModule;
  message: string;
  code: string;
}

export type CertificationModuleValidationResult = 
  | { success: true; data: CertificationModule }
  | { success: false; errors: CertificationModuleError[] };

// Export common validation constants
export const CERTIFICATION_MODULE_CONSTANTS = {
  PHASES: [1, 2, 3] as const,
  MAX_CODE_LENGTH: 50,
  MAX_NAME_LENGTH: 255,
  MAX_VERSION_LENGTH: 20,
  REQUIRED_EXAM_COMPONENTS: [ExamComponentType.READING, ExamComponentType.LISTENING] as const,
} as const;

// Type guards
export function isCertificationPhase(value: number): value is CertificationPhase {
  return Object.values(CertificationPhase).includes(value as CertificationPhase);
}

export function isLanguageCode(value: string): value is LanguageCode {
  return Object.values(LanguageCode).includes(value as LanguageCode);
}

export function isQuestionType(value: string): value is QuestionType {
  return Object.values(QuestionType).includes(value as QuestionType);
}

export function isActiveCertificationModule(
  module: CertificationModule
): module is ActiveCertificationModule {
  return module.is_active && module.launch_date instanceof Date;
}

// Validation helper functions
export function validateCertificationModuleCode(code: string): boolean {
  return /^[a-z0-9_]+$/.test(code) && code.length <= CERTIFICATION_MODULE_CONSTANTS.MAX_CODE_LENGTH;
}

export function validateExamStructure(structure: ExamStructure): boolean {
  const hasRequiredComponents = CERTIFICATION_MODULE_CONSTANTS.REQUIRED_EXAM_COMPONENTS.every(
    requiredType => structure.components.some(component => component.type === requiredType)
  );
  
  const totalWeight = structure.components.reduce(
    (sum, component) => sum + component.weight_percentage, 0
  );
  
  return hasRequiredComponents && Math.abs(totalWeight - 100) < 0.01;
}

export function validateCertificationModule(
  module: CertificationModuleCreateInput
): CertificationModuleValidationResult {
  const errors: CertificationModuleError[] = [];

  // Validate code
  if (!validateCertificationModuleCode(module.code)) {
    errors.push({
      field: 'code',
      message: 'Code must be lowercase alphanumeric with underscores only',
      code: 'INVALID_CODE_FORMAT'
    });
  }

  // Validate exam structure
  if (!validateExamStructure(module.exam_structure)) {
    errors.push({
      field: 'exam_structure',
      message: 'Exam structure must include required components and weights must sum to 100%',
      code: 'INVALID_EXAM_STRUCTURE'
    });
  }

  // Validate phase
  if (!isCertificationPhase(module.phase)) {
    errors.push({
      field: 'phase',
      message: 'Phase must be 1, 2, or 3',
      code: 'INVALID_PHASE'
    });
  }

  // Validate launch date (must be future date for new modules)
  if (module.launch_date < new Date()) {
    errors.push({
      field: 'launch_date',
      message: 'Launch date must be in the future',
      code: 'INVALID_LAUNCH_DATE'
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      ...module,
      id: crypto.randomUUID(),
      is_active: false,
      created_at: new Date(),
      updated_at: new Date()
    } as CertificationModule
  };
}