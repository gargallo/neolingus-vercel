export interface SimulatorMetadata {
  language: string;
  level: string;
  provider: string;
  skill: string;
  title: string;
  description?: string;
  duration?: number;
  sectionsCount?: number;
}

export interface ParsedQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'essay';
  question_text: string;
  options?: string[];
  correct_answer?: string | string[];
  points?: number;
  skill?: string;
  passage_id?: string;
  order_index: number;
  instructions?: string;
  explanation?: string;
}

export interface ParsedPassage {
  id: string;
  title: string;
  content: string;
  type: 'reading' | 'listening' | 'use_of_english';
  skill: string;
  order_index: number;
}

export interface ParsedExamSection {
  id: string;
  name: string;
  skill: string;
  duration: number;
  instructions?: string;
  order_index: number;
}

export interface ParsedExamData {
  metadata: SimulatorMetadata;
  sections: ParsedExamSection[];
  passages: ParsedPassage[];
  questions: ParsedQuestion[];
  answerKeys: AnswerKeyMap;
  configuration: ExamConfiguration;
}

export interface AnswerKeyMap {
  [questionId: string]: {
    correct: string | string[];
    points: number;
    explanation?: string;
    rubric?: string;
  };
}

export interface ExamConfiguration {
  timing: {
    total_duration: number;
    section_durations: { [sectionId: string]: number };
    warning_times?: number[];
  };
  scoring: {
    total_points: number;
    passing_score?: number;
    section_weights?: { [sectionId: string]: number };
  };
  navigation: {
    allow_review: boolean;
    allow_skip: boolean;
    show_progress: boolean;
  };
}

export interface MigrationResult {
  success: boolean;
  simulatorPath: string;
  examTemplateId?: string;
  questionsImported: number;
  passagesImported: number;
  sectionsImported: number;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

export interface MigrationReport {
  totalSimulators: number;
  successfulMigrations: number;
  failedMigrations: number;
  totalQuestionsImported: number;
  totalPassagesImported: number;
  results: MigrationResult[];
  errors: string[];
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface ValidationResult {
  valid: boolean;
  entity: string;
  entityId: string;
  checks: ValidationCheck[];
  score: number;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationReport {
  overall: {
    passed: boolean;
    score: number;
    summary: string;
  };
  examTemplates: ValidationResult[];
  examContent: ValidationResult[];
  dataIntegrity: ValidationResult[];
  timestamp: Date;
}

export interface SimulatorStructure {
  path: string;
  hasIndexHtml: boolean;
  hasScriptJs: boolean;
  hasStyleCss: boolean;
  additionalFiles: string[];
  isValid: boolean;
  errors: string[];
}

export interface HtmlParsingContext {
  document: any; // cheerio.CheerioAPI or jsdom.JSDOM
  baseUrl?: string;
  encoding?: string;
  language: string;
  provider: string;
}

export interface JsParsingContext {
  ast: any; // babel/parser AST
  sourceCode: string;
  filePath: string;
  variables: Map<string, any>;
}