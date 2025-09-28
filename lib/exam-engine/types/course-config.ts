import { ExamConfiguration, ExamLanguage, LanguageLevel } from './exam-config';

// Configuración específica por curso siguiendo el paradigma Course-Centric

export interface CourseTheme {
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  typography: {
    headers: string;
    body: string;
    accent: string;
  };
  culturalElements: {
    patterns: string;
    icons: string;
    imagery: string;
    references: string[];
  };
}

export interface CourseMessages {
  // Navigation
  start: string;
  pause: string;
  continue: string;
  finish: string;
  next: string;
  previous: string;
  
  // Status
  timeWarning: string; // "{{minutes}}" placeholder
  examComplete: string;
  autoSave: string;
  loading: string;
  
  // Instructions
  selectAnswer: string;
  writeYourAnswer: string;
  recordYourResponse: string;
  
  // Feedback
  correct: string;
  incorrect: string;
  partialCredit: string;
  
  // Cultural context
  culturalGreeting: string;
  encouragement: string[];
}

export interface CourseNavigation {
  sections: {
    [sectionId: string]: string;
  };
  breadcrumbs: {
    home: string;
    exams: string;
    practice: string;
  };
}

export interface CourseUIConfig {
  language: ExamLanguage;
  locale: string; // 'es-ES', 'en-GB', 'ca-ES', etc.
  rtl: boolean;
  theme: CourseTheme;
  navigation: CourseNavigation;
  messages: CourseMessages;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
}

export interface CourseConfiguration {
  courseId: string; // 'valenciano_c1', 'ingles_b2', etc.
  
  // Course metadata
  metadata: {
    title: string;
    language: ExamLanguage;
    level: LanguageLevel;
    region: string; // 'valencia', 'andalucia', 'cambridge', etc.
    institution: string;
    description: string;
    culturalContext: string[];
  };
  
  // UI configuration (completamente específico)
  ui: CourseUIConfig;
  
  // Exam configurations (puede incluir múltiples exámenes)
  examConfigs: {
    [examId: string]: ExamConfiguration;
  };
  
  // Available providers for this course
  providers: {
    [providerId: string]: {
      name: string;
      examIds: string[];
      official: boolean;
      description: string;
    };
  };
  
  // Course-specific scoring adjustments
  scoringAdjustments: {
    culturalBonus: number; // Bonus for cultural knowledge
    languageVariant: string; // 'british', 'american', 'valencia', 'balear'
    dialectSupport: boolean;
  };
  
  // Integration with existing simulators
  simulatorIntegration: {
    legacyPath: string; // Path to existing HTML simulator
    migrationStatus: 'legacy' | 'hybrid' | 'native';
    features: {
      timer: boolean;
      progress: boolean;
      autoSave: boolean;
      analytics: boolean;
    };
  };
}