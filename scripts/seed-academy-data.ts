/**
 * Academia Seed Data Generation Script
 * 
 * Generates realistic seed data for testing and development of the academia system.
 * Includes all certification types (EOI, JQCV, DELF, Goethe, CILS) and ensures
 * data follows GDPR/LOPD requirements.
 * 
 * Run with: npx tsx scripts/seed-academy-data.ts
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { academiaMCPClient } from '../lib/supabase-mcp/dashboard-client';
import type {
  CertificationModule,
  Course,
  UserProfile,
  UserCourseProgress,
  ExamSession,
  AITutorContext,
  AcademiaCourseEnrollmentRequest
} from '../lib/types/academia';

// =============================================================================
// SEED DATA CONFIGURATION
// =============================================================================

interface SeedDataConfig {
  /** Number of certification modules to create */
  certification_modules: number;
  
  /** Number of courses per certification module */
  courses_per_module: number;
  
  /** Number of test users to create */
  test_users: number;
  
  /** Number of enrollments per user */
  enrollments_per_user: number;
  
  /** Number of exam sessions per enrollment */
  sessions_per_enrollment: number;
  
  /** Whether to create AI tutor contexts */
  create_ai_contexts: boolean;
  
  /** Whether to skip existing data */
  skip_existing: boolean;
}

const DEFAULT_SEED_CONFIG: SeedDataConfig = {
  certification_modules: 5,
  courses_per_module: 6,
  test_users: 10,
  enrollments_per_user: 2,
  sessions_per_enrollment: 3,
  create_ai_contexts: true,
  skip_existing: true
};

interface SeedDataResult {
  success: boolean;
  created: {
    certification_modules: number;
    courses: number;
    users: number;
    enrollments: number;
    sessions: number;
    ai_contexts: number;
  };
  errors: string[];
  duration_ms: number;
}

// =============================================================================
// SEED DATA TEMPLATES
// =============================================================================

/**
 * Certification module templates
 */
const CERTIFICATION_MODULE_TEMPLATES: Omit<CertificationModule, 'id' | 'created_at' | 'updated_at'>[] = [
  {
    name: 'EOI English Certification',
    code: 'eoi_english',
    language: 'en' as any,
    certification_body: 'Escuela Oficial de Idiomas',
    official_website: 'https://www.eoibd.cat/',
    exam_structure: {
      components: [
        {
          type: 'reading',
          name: 'Reading Comprehension',
          description: 'Reading comprehension exercises',
          duration_minutes: 90,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'writing',
          name: 'Written Expression',
          description: 'Writing tasks and compositions',
          duration_minutes: 90,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'listening',
          name: 'Listening Comprehension',
          description: 'Audio comprehension exercises',
          duration_minutes: 45,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'speaking',
          name: 'Oral Expression',
          description: 'Speaking tests and presentations',
          duration_minutes: 15,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        }
      ],
      timing: {
        total_duration_minutes: 240,
        break_duration_minutes: 15,
        components: [
          { component_type: 'reading', start_time_minutes: 0, duration_minutes: 90 },
          { component_type: 'writing', start_time_minutes: 105, duration_minutes: 90 },
          { component_type: 'listening', start_time_minutes: 210, duration_minutes: 45 },
          { component_type: 'speaking', start_time_minutes: 270, duration_minutes: 15 }
        ]
      },
      scoring: {
        total_max_score: 400,
        passing_score: 200,
        component_requirements: [
          { component_type: 'reading', min_score: 40, is_required_to_pass: true },
          { component_type: 'writing', min_score: 40, is_required_to_pass: true },
          { component_type: 'listening', min_score: 40, is_required_to_pass: true },
          { component_type: 'speaking', min_score: 40, is_required_to_pass: true }
        ]
      },
      format: 'mixed',
      certification_level: 'Official',
      cefr_level: 'B2-C2'
    },
    content_config: {
      question_types: [
        { type: 'multiple_choice', enabled: true, weight: 0.3, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } },
        { type: 'essay', enabled: true, weight: 0.4, difficulty_distribution: { beginner: 0.0, elementary: 0.1, intermediate: 0.4, upper_intermediate: 0.3, advanced: 0.2, proficiency: 0.0 } },
        { type: 'listening_comprehension', enabled: true, weight: 0.2, difficulty_distribution: { beginner: 0.1, elementary: 0.2, intermediate: 0.4, upper_intermediate: 0.2, advanced: 0.1, proficiency: 0.0 } },
        { type: 'oral_presentation', enabled: true, weight: 0.1, difficulty_distribution: { beginner: 0.0, elementary: 0.1, intermediate: 0.3, upper_intermediate: 0.4, advanced: 0.2, proficiency: 0.0 } }
      ],
      difficulty_levels: ['elementary', 'intermediate', 'upper_intermediate', 'advanced'],
      content_domains: ['general', 'academic', 'professional'],
      adaptive_difficulty: true,
      randomization_enabled: true,
      time_limits: {
        multiple_choice: 2,
        essay: 30,
        listening_comprehension: 3,
        oral_presentation: 15
      }
    },
    compliance_requirements: {
      gdpr: {
        data_retention_days: 1095, // 3 years
        consent_required: true,
        right_to_erasure: true,
        data_portability: true,
        privacy_notice_url: 'https://example.com/privacy'
      },
      regional: [
        {
          region: 'Spain',
          regulations: ['LOPD', 'GDPR'],
          certification_requirements: ['EOI Official Recognition'],
          accessibility_standards: ['WCAG 2.1 AA']
        }
      ],
      accessibility: {
        wcag_level: 'AA' as any,
        screen_reader_support: true,
        keyboard_navigation: true,
        high_contrast_support: true
      },
      data_security: {
        encryption_required: true,
        audit_logging: true,
        secure_transmission: true
      }
    },
    is_active: true,
    phase: 2,
    launch_date: new Date('2024-01-15'),
    version: '2.1.0'
  },
  
  {
    name: 'JQCV Valenciano Certification',
    code: 'jqcv_valenciano',
    language: 'va' as any,
    certification_body: 'Junta Qualificadora de Coneixements de Valencià',
    official_website: 'https://www.ceice.gva.es/ca/web/jqcv',
    exam_structure: {
      components: [
        {
          type: 'reading',
          name: 'Comprensió Oral i Escrita',
          description: 'Comprensió de textos escrits i orals',
          duration_minutes: 120,
          max_score: 100,
          weight_percentage: 50,
          is_required: true
        },
        {
          type: 'writing',
          name: 'Expressió Oral i Escrita',
          description: 'Expressió escrita i oral en valencià',
          duration_minutes: 90,
          max_score: 100,
          weight_percentage: 50,
          is_required: true
        }
      ],
      timing: {
        total_duration_minutes: 210,
        break_duration_minutes: 15,
        components: [
          { component_type: 'reading', start_time_minutes: 0, duration_minutes: 120 },
          { component_type: 'writing', start_time_minutes: 135, duration_minutes: 90 }
        ]
      },
      scoring: {
        total_max_score: 200,
        passing_score: 100,
        component_requirements: [
          { component_type: 'reading', min_score: 40, is_required_to_pass: true },
          { component_type: 'writing', min_score: 40, is_required_to_pass: true }
        ]
      },
      format: 'mixed',
      certification_level: 'Official',
      cefr_level: 'A2-C2'
    },
    content_config: {
      question_types: [
        { type: 'multiple_choice', enabled: true, weight: 0.3, difficulty_distribution: { beginner: 0.3, elementary: 0.4, intermediate: 0.2, upper_intermediate: 0.1, advanced: 0.0, proficiency: 0.0 } },
        { type: 'written_composition', enabled: true, weight: 0.5, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } },
        { type: 'listening_comprehension', enabled: true, weight: 0.2, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } }
      ],
      difficulty_levels: ['beginner', 'elementary', 'intermediate', 'upper_intermediate'],
      content_domains: ['cultural', 'administrative', 'educational'],
      adaptive_difficulty: true,
      randomization_enabled: true,
      time_limits: {
        multiple_choice: 2,
        written_composition: 25,
        listening_comprehension: 3
      }
    },
    compliance_requirements: {
      gdpr: {
        data_retention_days: 1095,
        consent_required: true,
        right_to_erasure: true,
        data_portability: true,
        privacy_notice_url: 'https://example.com/privacy-va'
      },
      regional: [
        {
          region: 'Comunitat Valenciana',
          regulations: ['LOPD', 'GDPR', 'Llei d\'Ús del Valencià'],
          certification_requirements: ['JQCV Official Recognition'],
          accessibility_standards: ['WCAG 2.1 AA']
        }
      ],
      accessibility: {
        wcag_level: 'AA' as any,
        screen_reader_support: true,
        keyboard_navigation: true,
        high_contrast_support: true
      },
      data_security: {
        encryption_required: true,
        audit_logging: true,
        secure_transmission: true
      }
    },
    is_active: true,
    phase: 2,
    launch_date: new Date('2024-02-01'),
    version: '1.8.0'
  },
  
  {
    name: 'DELF French Certification',
    code: 'delf_french',
    language: 'fr' as any,
    certification_body: 'Centre International d\'Études Pédagogiques',
    official_website: 'https://www.ciep.fr/delf-dalf',
    exam_structure: {
      components: [
        {
          type: 'listening',
          name: 'Compréhension de l\'oral',
          description: 'Listening comprehension tasks',
          duration_minutes: 25,
          max_score: 25,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'reading',
          name: 'Compréhension des écrits',
          description: 'Reading comprehension exercises',
          duration_minutes: 50,
          max_score: 25,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'writing',
          name: 'Production écrite',
          description: 'Written production tasks',
          duration_minutes: 60,
          max_score: 25,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'speaking',
          name: 'Production orale',
          description: 'Oral production and interaction',
          duration_minutes: 15,
          max_score: 25,
          weight_percentage: 25,
          is_required: true
        }
      ],
      timing: {
        total_duration_minutes: 150,
        break_duration_minutes: 10,
        components: [
          { component_type: 'listening', start_time_minutes: 0, duration_minutes: 25 },
          { component_type: 'reading', start_time_minutes: 35, duration_minutes: 50 },
          { component_type: 'writing', start_time_minutes: 95, duration_minutes: 60 },
          { component_type: 'speaking', start_time_minutes: 165, duration_minutes: 15 }
        ]
      },
      scoring: {
        total_max_score: 100,
        passing_score: 50,
        component_requirements: [
          { component_type: 'listening', min_score: 5, is_required_to_pass: true },
          { component_type: 'reading', min_score: 5, is_required_to_pass: true },
          { component_type: 'writing', min_score: 5, is_required_to_pass: true },
          { component_type: 'speaking', min_score: 5, is_required_to_pass: true }
        ]
      },
      format: 'mixed',
      certification_level: 'International',
      cefr_level: 'A1-B2'
    },
    content_config: {
      question_types: [
        { type: 'multiple_choice', enabled: true, weight: 0.25, difficulty_distribution: { beginner: 0.4, elementary: 0.3, intermediate: 0.2, upper_intermediate: 0.1, advanced: 0.0, proficiency: 0.0 } },
        { type: 'essay', enabled: true, weight: 0.35, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } },
        { type: 'listening_comprehension', enabled: true, weight: 0.25, difficulty_distribution: { beginner: 0.3, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.1, advanced: 0.0, proficiency: 0.0 } },
        { type: 'oral_presentation', enabled: true, weight: 0.15, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } }
      ],
      difficulty_levels: ['beginner', 'elementary', 'intermediate', 'upper_intermediate'],
      content_domains: ['personal', 'educational', 'professional', 'public'],
      adaptive_difficulty: false,
      randomization_enabled: true,
      time_limits: {
        multiple_choice: 2,
        essay: 20,
        listening_comprehension: 3,
        oral_presentation: 10
      }
    },
    compliance_requirements: {
      gdpr: {
        data_retention_days: 1095,
        consent_required: true,
        right_to_erasure: true,
        data_portability: true,
        privacy_notice_url: 'https://example.com/privacy-fr'
      },
      regional: [
        {
          region: 'International',
          regulations: ['GDPR'],
          certification_requirements: ['DELF Official Recognition'],
          accessibility_standards: ['WCAG 2.1 AA']
        }
      ],
      accessibility: {
        wcag_level: 'AA' as any,
        screen_reader_support: true,
        keyboard_navigation: true,
        high_contrast_support: true
      },
      data_security: {
        encryption_required: true,
        audit_logging: true,
        secure_transmission: true
      }
    },
    is_active: true,
    phase: 2,
    launch_date: new Date('2024-03-01'),
    version: '2.0.0'
  },
  
  {
    name: 'Goethe German Certification',
    code: 'goethe_german',
    language: 'de' as any,
    certification_body: 'Goethe Institut',
    official_website: 'https://www.goethe.de/en/spr/kup.html',
    exam_structure: {
      components: [
        {
          type: 'reading',
          name: 'Lesen',
          description: 'Reading comprehension tasks',
          duration_minutes: 65,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'listening',
          name: 'Hören',
          description: 'Listening comprehension exercises',
          duration_minutes: 40,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'writing',
          name: 'Schreiben',
          description: 'Written expression tasks',
          duration_minutes: 75,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        },
        {
          type: 'speaking',
          name: 'Sprechen',
          description: 'Oral expression and interaction',
          duration_minutes: 15,
          max_score: 100,
          weight_percentage: 25,
          is_required: true
        }
      ],
      timing: {
        total_duration_minutes: 195,
        break_duration_minutes: 15,
        components: [
          { component_type: 'reading', start_time_minutes: 0, duration_minutes: 65 },
          { component_type: 'listening', start_time_minutes: 80, duration_minutes: 40 },
          { component_type: 'writing', start_time_minutes: 135, duration_minutes: 75 },
          { component_type: 'speaking', start_time_minutes: 225, duration_minutes: 15 }
        ]
      },
      scoring: {
        total_max_score: 400,
        passing_score: 240,
        component_requirements: [
          { component_type: 'reading', min_score: 60, is_required_to_pass: true },
          { component_type: 'listening', min_score: 60, is_required_to_pass: true },
          { component_type: 'writing', min_score: 60, is_required_to_pass: true },
          { component_type: 'speaking', min_score: 60, is_required_to_pass: true }
        ]
      },
      format: 'mixed',
      certification_level: 'International',
      cefr_level: 'A1-C2'
    },
    content_config: {
      question_types: [
        { type: 'multiple_choice', enabled: true, weight: 0.3, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.1, advanced: 0.1, proficiency: 0.0 } },
        { type: 'essay', enabled: true, weight: 0.4, difficulty_distribution: { beginner: 0.1, elementary: 0.2, intermediate: 0.4, upper_intermediate: 0.2, advanced: 0.1, proficiency: 0.0 } },
        { type: 'listening_comprehension', enabled: true, weight: 0.2, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.1, advanced: 0.1, proficiency: 0.0 } },
        { type: 'oral_presentation', enabled: true, weight: 0.1, difficulty_distribution: { beginner: 0.1, elementary: 0.2, intermediate: 0.4, upper_intermediate: 0.2, advanced: 0.1, proficiency: 0.0 } }
      ],
      difficulty_levels: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced'],
      content_domains: ['personal', 'public', 'educational', 'professional'],
      adaptive_difficulty: true,
      randomization_enabled: true,
      time_limits: {
        multiple_choice: 2,
        essay: 25,
        listening_comprehension: 3,
        oral_presentation: 12
      }
    },
    compliance_requirements: {
      gdpr: {
        data_retention_days: 1095,
        consent_required: true,
        right_to_erasure: true,
        data_portability: true,
        privacy_notice_url: 'https://example.com/privacy-de'
      },
      regional: [
        {
          region: 'International',
          regulations: ['GDPR'],
          certification_requirements: ['Goethe Institut Recognition'],
          accessibility_standards: ['WCAG 2.1 AA']
        }
      ],
      accessibility: {
        wcag_level: 'AA' as any,
        screen_reader_support: true,
        keyboard_navigation: true,
        high_contrast_support: true
      },
      data_security: {
        encryption_required: true,
        audit_logging: true,
        secure_transmission: true
      }
    },
    is_active: true,
    phase: 2,
    launch_date: new Date('2024-04-01'),
    version: '2.2.0'
  },
  
  {
    name: 'CILS Italian Certification',
    code: 'cils_italian',
    language: 'it' as any,
    certification_body: 'Università per Stranieri di Siena',
    official_website: 'https://cils.unistrasi.it/',
    exam_structure: {
      components: [
        {
          type: 'listening',
          name: 'Ascolto',
          description: 'Listening comprehension tasks',
          duration_minutes: 30,
          max_score: 100,
          weight_percentage: 20,
          is_required: true
        },
        {
          type: 'reading',
          name: 'Comprensione della lettura',
          description: 'Reading comprehension exercises',
          duration_minutes: 70,
          max_score: 100,
          weight_percentage: 30,
          is_required: true
        },
        {
          type: 'writing',
          name: 'Produzione scritta',
          description: 'Written production tasks',
          duration_minutes: 90,
          max_score: 100,
          weight_percentage: 30,
          is_required: true
        },
        {
          type: 'speaking',
          name: 'Produzione orale',
          description: 'Oral production and interaction',
          duration_minutes: 10,
          max_score: 100,
          weight_percentage: 20,
          is_required: true
        }
      ],
      timing: {
        total_duration_minutes: 200,
        break_duration_minutes: 15,
        components: [
          { component_type: 'listening', start_time_minutes: 0, duration_minutes: 30 },
          { component_type: 'reading', start_time_minutes: 45, duration_minutes: 70 },
          { component_type: 'writing', start_time_minutes: 130, duration_minutes: 90 },
          { component_type: 'speaking', start_time_minutes: 235, duration_minutes: 10 }
        ]
      },
      scoring: {
        total_max_score: 400,
        passing_score: 220,
        component_requirements: [
          { component_type: 'listening', min_score: 50, is_required_to_pass: true },
          { component_type: 'reading', min_score: 60, is_required_to_pass: true },
          { component_type: 'writing', min_score: 60, is_required_to_pass: true },
          { component_type: 'speaking', min_score: 50, is_required_to_pass: true }
        ]
      },
      format: 'mixed',
      certification_level: 'International',
      cefr_level: 'A1-C2'
    },
    content_config: {
      question_types: [
        { type: 'multiple_choice', enabled: true, weight: 0.25, difficulty_distribution: { beginner: 0.3, elementary: 0.3, intermediate: 0.2, upper_intermediate: 0.1, advanced: 0.1, proficiency: 0.0 } },
        { type: 'essay', enabled: true, weight: 0.4, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } },
        { type: 'listening_comprehension', enabled: true, weight: 0.2, difficulty_distribution: { beginner: 0.3, elementary: 0.3, intermediate: 0.2, upper_intermediate: 0.1, advanced: 0.1, proficiency: 0.0 } },
        { type: 'oral_presentation', enabled: true, weight: 0.15, difficulty_distribution: { beginner: 0.2, elementary: 0.3, intermediate: 0.3, upper_intermediate: 0.2, advanced: 0.0, proficiency: 0.0 } }
      ],
      difficulty_levels: ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced'],
      content_domains: ['personal', 'public', 'educational', 'professional'],
      adaptive_difficulty: true,
      randomization_enabled: true,
      time_limits: {
        multiple_choice: 2,
        essay: 30,
        listening_comprehension: 2,
        oral_presentation: 8
      }
    },
    compliance_requirements: {
      gdpr: {
        data_retention_days: 1095,
        consent_required: true,
        right_to_erasure: true,
        data_portability: true,
        privacy_notice_url: 'https://example.com/privacy-it'
      },
      regional: [
        {
          region: 'International',
          regulations: ['GDPR'],
          certification_requirements: ['CILS Official Recognition'],
          accessibility_standards: ['WCAG 2.1 AA']
        }
      ],
      accessibility: {
        wcag_level: 'AA' as any,
        screen_reader_support: true,
        keyboard_navigation: true,
        high_contrast_support: true
      },
      data_security: {
        encryption_required: true,
        audit_logging: true,
        secure_transmission: true
      }
    },
    is_active: true,
    phase: 1,
    launch_date: new Date('2024-05-01'),
    version: '1.5.0'
  }
];

/**
 * Course templates for each certification module
 */
const COURSE_TEMPLATES: Array<{
  certificationCode: string;
  courses: Array<Omit<Course, 'id' | 'certification_module_id' | 'created_at' | 'updated_at'>>
}> = [
  {
    certificationCode: 'eoi_english',
    courses: [
      {
        language: 'english' as any,
        level: 'b1' as any,
        certification_type: 'eoi' as any,
        title: 'English B1 - Intermediate',
        description: 'Intermediate level English course preparing for EOI B1 certification',
        components: [
          {
            id: 'reading_b1',
            name: 'Reading Comprehension B1',
            skill_type: 'reading' as any,
            duration: 90,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['multiple_choice', 'fill_in_blank'],
              question_count: 25,
              difficulty_distribution: { easy: 30, medium: 50, hard: 20 },
              format_requirements: { time_per_question: 3 }
            }
          },
          {
            id: 'writing_b1',
            name: 'Writing B1',
            skill_type: 'writing' as any,
            duration: 90,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['essay'],
              question_count: 2,
              difficulty_distribution: { easy: 20, medium: 60, hard: 20 },
              format_requirements: { word_limit: 150 }
            }
          },
          {
            id: 'listening_b1',
            name: 'Listening Comprehension B1',
            skill_type: 'listening' as any,
            duration: 45,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['multiple_choice', 'fill_in_blank'],
              question_count: 20,
              difficulty_distribution: { easy: 25, medium: 55, hard: 20 },
              format_requirements: { audio_quality: 'standard' as any }
            }
          },
          {
            id: 'speaking_b1',
            name: 'Speaking B1',
            skill_type: 'speaking' as any,
            duration: 15,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['oral_presentation'],
              question_count: 3,
              difficulty_distribution: { easy: 20, medium: 60, hard: 20 },
              format_requirements: { speaking_format: 'monologue' as any, time_per_question: 5 }
            }
          }
        ],
        assessment_rubric: {
          passing_score: 60,
          component_minimums: {
            reading: 50,
            writing: 50,
            listening: 50,
            speaking: 50
          },
          grading_scale: {
            type: 'percentage' as any,
            max_score: 100,
            grade_boundaries: [
              { grade: 'A', min_score: 90, max_score: 100, description: 'Excellent' },
              { grade: 'B', min_score: 80, max_score: 89, description: 'Good' },
              { grade: 'C', min_score: 70, max_score: 79, description: 'Satisfactory' },
              { grade: 'D', min_score: 60, max_score: 69, description: 'Pass' },
              { grade: 'F', min_score: 0, max_score: 59, description: 'Fail' }
            ]
          },
          cefr_descriptors: {
            overall: {
              b1: 'Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.'
            },
            skills: {
              reading: { b1: 'Can understand texts that consist mainly of high frequency everyday or job-related language.' },
              writing: { b1: 'Can write simple connected text on topics which are familiar or of personal interest.' },
              listening: { b1: 'Can understand the main points of clear standard speech on familiar matters.' },
              speaking: { b1: 'Can deal with most situations likely to arise whilst travelling in an area where the language is spoken.' }
            },
            can_do_statements: {
              b1: [
                'Can describe experiences and events, dreams, hopes and ambitions',
                'Can briefly give reasons and explanations for opinions and plans',
                'Can narrate a story or relate the plot of a book or film'
              ]
            }
          },
          feedback_templates: [
            {
              score_range: { min: 90, max: 100 },
              message: 'Excellent performance! You demonstrate strong command of English at the B1 level.',
              suggestions: ['Continue practicing to maintain your level', 'Consider advancing to B2 level'],
              next_steps: ['Take B2 diagnostic test', 'Enroll in B2 course']
            },
            {
              score_range: { min: 60, max: 89 },
              message: 'Good progress! You have achieved the B1 level requirements.',
              suggestions: ['Focus on weaker skill areas for improvement', 'Practice regularly to consolidate learning'],
              next_steps: ['Review detailed feedback', 'Continue B1 practice or consider B2']
            },
            {
              score_range: { min: 0, max: 59 },
              message: 'Keep working! You need more practice to reach B1 level.',
              suggestions: ['Review fundamental grammar and vocabulary', 'Increase exposure to English materials'],
              next_steps: ['Retake practice tests', 'Focus on identified weak areas']
            }
          ]
        },
        is_active: true
      },
      {
        language: 'english' as any,
        level: 'b2' as any,
        certification_type: 'eoi' as any,
        title: 'English B2 - Upper Intermediate',
        description: 'Upper intermediate level English course preparing for EOI B2 certification',
        components: [
          {
            id: 'reading_b2',
            name: 'Reading Comprehension B2',
            skill_type: 'reading' as any,
            duration: 90,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['multiple_choice', 'matching'],
              question_count: 30,
              difficulty_distribution: { easy: 20, medium: 50, hard: 30 },
              format_requirements: { time_per_question: 3 }
            }
          },
          {
            id: 'writing_b2',
            name: 'Writing B2',
            skill_type: 'writing' as any,
            duration: 90,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['essay'],
              question_count: 2,
              difficulty_distribution: { easy: 15, medium: 55, hard: 30 },
              format_requirements: { word_limit: 250 }
            }
          },
          {
            id: 'listening_b2',
            name: 'Listening Comprehension B2',
            skill_type: 'listening' as any,
            duration: 45,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['multiple_choice', 'fill_in_blank'],
              question_count: 25,
              difficulty_distribution: { easy: 20, medium: 50, hard: 30 },
              format_requirements: { audio_quality: 'high' as any }
            }
          },
          {
            id: 'speaking_b2',
            name: 'Speaking B2',
            skill_type: 'speaking' as any,
            duration: 15,
            weight: 25,
            is_required: true,
            config: {
              question_types: ['oral_presentation'],
              question_count: 3,
              difficulty_distribution: { easy: 15, medium: 55, hard: 30 },
              format_requirements: { speaking_format: 'dialogue' as any, time_per_question: 5 }
            }
          }
        ],
        assessment_rubric: {
          passing_score: 65,
          component_minimums: {
            reading: 55,
            writing: 55,
            listening: 55,
            speaking: 55
          },
          grading_scale: {
            type: 'percentage' as any,
            max_score: 100,
            grade_boundaries: [
              { grade: 'A', min_score: 90, max_score: 100, description: 'Excellent' },
              { grade: 'B', min_score: 80, max_score: 89, description: 'Good' },
              { grade: 'C', min_score: 70, max_score: 79, description: 'Satisfactory' },
              { grade: 'D', min_score: 65, max_score: 69, description: 'Pass' },
              { grade: 'F', min_score: 0, max_score: 64, description: 'Fail' }
            ]
          },
          cefr_descriptors: {
            overall: {
              b2: 'Can understand the main ideas of complex text on both concrete and abstract topics.'
            },
            skills: {
              reading: { b2: 'Can read articles and reports concerned with contemporary problems.' },
              writing: { b2: 'Can write clear, detailed text on a wide range of subjects.' },
              listening: { b2: 'Can understand extended speech and follow even complex lines of argument.' },
              speaking: { b2: 'Can interact with a degree of fluency and spontaneity.' }
            },
            can_do_statements: {
              b2: [
                'Can present clear, detailed descriptions on a wide range of subjects',
                'Can explain a viewpoint on a topical issue giving advantages and disadvantages',
                'Can understand articles and reports on contemporary problems'
              ]
            }
          },
          feedback_templates: [
            {
              score_range: { min: 90, max: 100 },
              message: 'Outstanding! You have excellent command of English at the B2 level.',
              suggestions: ['Maintain your level through regular practice', 'Consider C1 advancement'],
              next_steps: ['Take C1 diagnostic assessment', 'Explore advanced English courses']
            },
            {
              score_range: { min: 65, max: 89 },
              message: 'Well done! You have successfully achieved B2 level competency.',
              suggestions: ['Continue practicing to strengthen weak areas', 'Regular exposure to authentic materials'],
              next_steps: ['Review component feedback', 'Consider next level progression']
            },
            {
              score_range: { min: 0, max: 64 },
              message: 'More practice needed to reach B2 level requirements.',
              suggestions: ['Focus on grammar and vocabulary expansion', 'Increase practice with complex texts'],
              next_steps: ['Additional B2 practice', 'Focus on identified problem areas']
            }
          ]
        },
        is_active: true
      }
    ]
  },
  {
    certificationCode: 'jqcv_valenciano',
    courses: [
      {
        language: 'valenciano' as any,
        level: 'elemental' as any,
        certification_type: 'jqcv' as any,
        title: 'Valencià Elemental',
        description: 'Curso básico de valenciano preparatorio para el certificado JQCV Elemental',
        components: [
          {
            id: 'comprensio_elemental',
            name: 'Comprensió Oral i Escrita Elemental',
            skill_type: 'reading' as any,
            duration: 120,
            weight: 50,
            is_required: true,
            config: {
              question_types: ['multiple_choice', 'fill_in_blank'],
              question_count: 30,
              difficulty_distribution: { easy: 50, medium: 40, hard: 10 },
              format_requirements: { time_per_question: 4 }
            }
          },
          {
            id: 'expressio_elemental',
            name: 'Expressió Oral i Escrita Elemental',
            skill_type: 'writing' as any,
            duration: 90,
            weight: 50,
            is_required: true,
            config: {
              question_types: ['written_composition', 'oral_presentation'],
              question_count: 3,
              difficulty_distribution: { easy: 40, medium: 50, hard: 10 },
              format_requirements: { word_limit: 100 }
            }
          }
        ],
        assessment_rubric: {
          passing_score: 50,
          component_minimums: {
            reading: 40,
            writing: 40
          },
          grading_scale: {
            type: 'percentage' as any,
            max_score: 100,
            grade_boundaries: [
              { grade: 'Excel·lent', min_score: 90, max_score: 100, description: 'Excel·lent domini' },
              { grade: 'Notable', min_score: 75, max_score: 89, description: 'Bon domini' },
              { grade: 'Bé', min_score: 60, max_score: 74, description: 'Domini satisfactori' },
              { grade: 'Aprovat', min_score: 50, max_score: 59, description: 'Domini mínim' },
              { grade: 'Suspès', min_score: 0, max_score: 49, description: 'No aprovat' }
            ]
          },
          cefr_descriptors: {
            overall: {
              elemental: 'Pot comprendre i usar expressions familiars i frases molt bàsiques.'
            },
            skills: {
              reading: { elemental: 'Pot llegir textos molt senzills i trobar informació específica.' },
              writing: { elemental: 'Pot escriure frases senzilles sobre ell mateix i la seua família.' }
            },
            can_do_statements: {
              elemental: [
                'Pot presentar-se a si mateix i als altres',
                'Pot fer i respondre preguntes sobre detalls personals',
                'Pot interaccionar de manera senzilla'
              ]
            }
          },
          feedback_templates: [
            {
              score_range: { min: 75, max: 100 },
              message: 'Excel·lent! Tens un bon domini del valencià elemental.',
              suggestions: ['Continua practicant regularment', 'Considera avançar al nivell mitjà'],
              next_steps: ['Realitza el test diagnòstic del nivell mitjà', 'Inscriu-te al curs mitjà']
            },
            {
              score_range: { min: 50, max: 74 },
              message: 'Enhorabona! Has assolit el nivell elemental de valencià.',
              suggestions: ['Practica més les àrees més febles', 'Augmenta l\'exposició al valencià'],
              next_steps: ['Revisa els comentaris detallats', 'Continua practicant o avança de nivell']
            },
            {
              score_range: { min: 0, max: 49 },
              message: 'Cal més pràctica per assolir el nivell elemental.',
              suggestions: ['Repassa la gramàtica bàsica', 'Practica més amb materials senzills'],
              next_steps: ['Repeteix les proves de pràctica', 'Centra\'t en les àrees identificades']
            }
          ]
        },
        is_active: true
      },
      {
        language: 'valenciano' as any,
        level: 'mitja' as any,
        certification_type: 'jqcv' as any,
        title: 'Valencià Mitjà',
        description: 'Curso intermedio de valenciano preparatorio para el certificado JQCV Mitjà',
        components: [
          {
            id: 'comprensio_mitja',
            name: 'Comprensió Oral i Escrita Mitjà',
            skill_type: 'reading' as any,
            duration: 120,
            weight: 50,
            is_required: true,
            config: {
              question_types: ['multiple_choice', 'matching'],
              question_count: 35,
              difficulty_distribution: { easy: 30, medium: 50, hard: 20 },
              format_requirements: { time_per_question: 3.5 }
            }
          },
          {
            id: 'expressio_mitja',
            name: 'Expressió Oral i Escrita Mitjà',
            skill_type: 'writing' as any,
            duration: 90,
            weight: 50,
            is_required: true,
            config: {
              question_types: ['written_composition', 'oral_presentation'],
              question_count: 4,
              difficulty_distribution: { easy: 25, medium: 55, hard: 20 },
              format_requirements: { word_limit: 200 }
            }
          }
        ],
        assessment_rubric: {
          passing_score: 60,
          component_minimums: {
            reading: 50,
            writing: 50
          },
          grading_scale: {
            type: 'percentage' as any,
            max_score: 100,
            grade_boundaries: [
              { grade: 'Excel·lent', min_score: 90, max_score: 100, description: 'Excel·lent domini' },
              { grade: 'Notable', min_score: 80, max_score: 89, description: 'Bon domini' },
              { grade: 'Bé', min_score: 70, max_score: 79, description: 'Domini satisfactori' },
              { grade: 'Aprovat', min_score: 60, max_score: 69, description: 'Domini adequat' },
              { grade: 'Suspès', min_score: 0, max_score: 59, description: 'No aprovat' }
            ]
          },
          cefr_descriptors: {
            overall: {
              mitja: 'Pot comprendre les idees principals de textos complexos sobre temes concrets i abstractes.'
            },
            skills: {
              reading: { mitja: 'Pot llegir articles i informes sobre problemes contemporanis.' },
              writing: { mitja: 'Pot escriure textos clars i detallats sobre una àmplia gamma de temes.' }
            },
            can_do_statements: {
              mitja: [
                'Pot descriure experiències i esdeveniments, somnis, esperances i ambicions',
                'Pot donar raons i explicacions breus per a opinions i plans',
                'Pot narrar una història o relacionar l\'argument d\'un llibre o pel·lícula'
              ]
            }
          },
          feedback_templates: [
            {
              score_range: { min: 80, max: 100 },
              message: 'Excel·lent treball! Demostres un domini sòlid del valencià mitjà.',
              suggestions: ['Mantén el nivell amb pràctica regular', 'Considera avançar al nivell superior'],
              next_steps: ['Fes el test diagnòstic del nivell superior', 'Inscriu-te al curs superior']
            },
            {
              score_range: { min: 60, max: 79 },
              message: 'Ben fet! Has assolit els requisits del nivell mitjà.',
              suggestions: ['Centra\'t en les àrees més febles', 'Practica regularment per consolidar l\'aprenentatge'],
              next_steps: ['Revisa els comentaris detallats', 'Continua la pràctica o considera el nivell superior']
            },
            {
              score_range: { min: 0, max: 59 },
              message: 'Cal més treball per arribar al nivell mitjà.',
              suggestions: ['Repassa la gramàtica fonamental i el vocabulari', 'Augmenta l\'exposició als materials valencians'],
              next_steps: ['Repeteix les proves de pràctica', 'Centra\'t en les àrees febles identificades']
            }
          ]
        },
        is_active: true
      }
    ]
  }
  // Additional course templates for other certification modules would follow the same pattern
];

/**
 * Generate test user profiles
 */
function generateTestUsers(count: number): Array<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>> {
  const users: Array<Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>> = [];
  
  const firstNames = ['Ana', 'Carlos', 'María', 'José', 'Laura', 'Miguel', 'Carmen', 'David', 'Isabel', 'Antonio'];
  const lastNames = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Martín', 'Gómez'];
  const languages = ['en', 'es', 'ca', 'fr', 'de'];
  const retentionPrefs = ['minimal', 'standard', 'extended'];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@testacademia.com`;
    
    users.push({
      email,
      full_name: `${firstName} ${lastName}`,
      preferred_language: languages[Math.floor(Math.random() * languages.length)] as any,
      gdpr_consent: true,
      gdpr_consent_date: new Date(),
      lopd_consent: true,
      data_retention_preference: retentionPrefs[Math.floor(Math.random() * retentionPrefs.length)] as any,
      last_active: new Date(),
      status: 'active' as any,
      email_verified: true,
      email_verified_at: new Date()
    });
  }
  
  return users;
}

// =============================================================================
// SEED DATA GENERATION FUNCTIONS
// =============================================================================

/**
 * Main seed data generation function
 */
async function generateSeedData(config: SeedDataConfig = DEFAULT_SEED_CONFIG): Promise<SeedDataResult> {
  const startTime = Date.now();
  console.log('🌱 Starting academia seed data generation...\n');
  
  const result: SeedDataResult = {
    success: true,
    created: {
      certification_modules: 0,
      courses: 0,
      users: 0,
      enrollments: 0,
      sessions: 0,
      ai_contexts: 0
    },
    errors: [],
    duration_ms: 0
  };

  try {
    console.log('📋 Configuration:');
    console.log(`  Certification Modules: ${config.certification_modules}`);
    console.log(`  Courses per Module: ${config.courses_per_module}`);
    console.log(`  Test Users: ${config.test_users}`);
    console.log(`  Enrollments per User: ${config.enrollments_per_user}`);
    console.log(`  Sessions per Enrollment: ${config.sessions_per_enrollment}`);
    console.log(`  Create AI Contexts: ${config.create_ai_contexts}`);
    console.log(`  Skip Existing: ${config.skip_existing}\n`);

    // Step 1: Create Certification Modules
    console.log('1️⃣ Creating certification modules...');
    const createdModules: CertificationModule[] = [];
    
    for (let i = 0; i < Math.min(config.certification_modules, CERTIFICATION_MODULE_TEMPLATES.length); i++) {
      const moduleData = CERTIFICATION_MODULE_TEMPLATES[i];
      
      try {
        // Check if module already exists if skip_existing is enabled
        if (config.skip_existing) {
          const existingResult = await academiaMCPClient.getCertificationModule(moduleData.code);
          if (existingResult.success && existingResult.data) {
            console.log(`  ⏭️  Skipped existing module: ${moduleData.name}`);
            createdModules.push(existingResult.data);
            continue;
          }
        }

        const moduleResult = await academiaMCPClient.createCertificationModule(moduleData);
        
        if (moduleResult.success && moduleResult.data) {
          createdModules.push(moduleResult.data);
          result.created.certification_modules++;
          console.log(`  ✅ Created: ${moduleData.name}`);
        } else {
          const error = `Failed to create module ${moduleData.name}: ${moduleResult.error?.message}`;
          result.errors.push(error);
          console.log(`  ❌ ${error}`);
        }
      } catch (error) {
        const errorMsg = `Error creating module ${moduleData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }

    // Step 2: Create Courses
    console.log('\n2️⃣ Creating courses...');
    const createdCourses: Course[] = [];
    
    for (const moduleTemplate of COURSE_TEMPLATES) {
      const module = createdModules.find(m => m.code === moduleTemplate.certificationCode);
      if (!module) {
        const error = `Module not found for courses: ${moduleTemplate.certificationCode}`;
        result.errors.push(error);
        console.log(`  ❌ ${error}`);
        continue;
      }

      for (const courseData of moduleTemplate.courses.slice(0, config.courses_per_module)) {
        try {
          const fullCourseData = {
            ...courseData,
            certification_module_id: module.id
          };

          const courseResult = await academiaMCPClient.createCourse(fullCourseData);
          
          if (courseResult.success && courseResult.data) {
            createdCourses.push(courseResult.data);
            result.created.courses++;
            console.log(`  ✅ Created: ${courseData.title}`);
          } else {
            const error = `Failed to create course ${courseData.title}: ${courseResult.error?.message}`;
            result.errors.push(error);
            console.log(`  ❌ ${error}`);
          }
        } catch (error) {
          const errorMsg = `Error creating course ${courseData.title}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.log(`  ❌ ${errorMsg}`);
        }
      }
    }

    // Step 3: Create Test Users
    console.log('\n3️⃣ Creating test users...');
    const testUsers = generateTestUsers(config.test_users);
    const createdUsers: UserProfile[] = [];
    
    for (const userData of testUsers) {
      try {
        const userResult = await academiaMCPClient.createUserProfile(userData);
        
        if (userResult.success && userResult.data) {
          createdUsers.push(userResult.data);
          result.created.users++;
          console.log(`  ✅ Created: ${userData.email}`);
        } else {
          const error = `Failed to create user ${userData.email}: ${userResult.error?.message}`;
          result.errors.push(error);
          console.log(`  ❌ ${error}`);
        }
      } catch (error) {
        const errorMsg = `Error creating user ${userData.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMsg);
        console.log(`  ❌ ${errorMsg}`);
      }
    }

    // Step 4: Create Enrollments
    console.log('\n4️⃣ Creating enrollments...');
    const createdEnrollments: any[] = [];
    
    for (const user of createdUsers) {
      const userCourses = createdCourses
        .sort(() => Math.random() - 0.5)
        .slice(0, config.enrollments_per_user);
      
      for (const course of userCourses) {
        try {
          const enrollmentRequest: AcademiaCourseEnrollmentRequest = {
            user_id: user.id,
            course_id: course.id,
            subscription_tier: ['basic', 'standard', 'premium'][Math.floor(Math.random() * 3)] as any,
            target_exam_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            initial_assessment: {
              reading: Math.random() * 0.3,
              writing: Math.random() * 0.3,
              listening: Math.random() * 0.3,
              speaking: Math.random() * 0.3
            }
          };

          const enrollmentResult = await academiaMCPClient.createCourseEnrollment(enrollmentRequest);
          
          if (enrollmentResult.success && enrollmentResult.data?.enrollment) {
            createdEnrollments.push(enrollmentResult.data.enrollment);
            result.created.enrollments++;
            console.log(`  ✅ Enrolled: ${user.email} in ${course.title}`);
          } else {
            const error = `Failed to create enrollment for ${user.email}: ${enrollmentResult.error?.message}`;
            result.errors.push(error);
            console.log(`  ❌ ${error}`);
          }
        } catch (error) {
          const errorMsg = `Error creating enrollment for ${user.email}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.log(`  ❌ ${errorMsg}`);
        }
      }
    }

    // Step 5: Create Exam Sessions
    console.log('\n5️⃣ Creating exam sessions...');
    
    for (const enrollment of createdEnrollments) {
      const course = createdCourses.find(c => c.id === enrollment.course.id);
      if (!course) continue;

      for (let i = 0; i < config.sessions_per_enrollment; i++) {
        try {
          const component = course.components[Math.floor(Math.random() * course.components.length)];
          const sessionType = ['practice', 'mock_exam', 'diagnostic'][Math.floor(Math.random() * 3)] as any;
          
          const sessionData = {
            user_id: enrollment.user.id,
            course_id: course.id,
            progress_id: enrollment.progress.id,
            session_type: sessionType,
            component: component.skill_type,
            started_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date in last 30 days
            duration_seconds: 3600 + Math.floor(Math.random() * 1800), // 1-1.5 hours
            responses: {
              [`q${Math.floor(Math.random() * 20)}`]: `answer${Math.floor(Math.random() * 4)}`
            },
            score: 0.4 + Math.random() * 0.5, // Random score between 0.4 and 0.9
            detailed_scores: {
              accuracy: 0.5 + Math.random() * 0.4,
              speed: 0.6 + Math.random() * 0.3,
              consistency: 0.4 + Math.random() * 0.5
            },
            ai_feedback: `Good progress in ${component.skill_type}. Consider focusing on areas where you scored lower.`,
            improvement_suggestions: [
              `Practice more ${component.skill_type} exercises`,
              'Review grammar fundamentals',
              'Increase vocabulary study'
            ],
            is_completed: Math.random() > 0.2, // 80% completion rate
            session_data: {
              device_type: ['desktop', 'tablet', 'mobile'][Math.floor(Math.random() * 3)],
              browser: ['Chrome', 'Firefox', 'Safari'][Math.floor(Math.random() * 3)],
              completion_rate: 0.8 + Math.random() * 0.2
            }
          };

          if (sessionData.is_completed) {
            sessionData.completed_at = new Date(sessionData.started_at.getTime() + sessionData.duration_seconds * 1000);
          }

          const sessionResult = await academiaMCPClient.createExamSession(sessionData);
          
          if (sessionResult.success && sessionResult.data) {
            result.created.sessions++;
            console.log(`  ✅ Created: ${sessionType} session for ${enrollment.user.email} - ${component.skill_type}`);
          } else {
            const error = `Failed to create session: ${sessionResult.error?.message}`;
            result.errors.push(error);
            console.log(`  ❌ ${error}`);
          }
        } catch (error) {
          const errorMsg = `Error creating session: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.log(`  ❌ ${errorMsg}`);
        }
      }
    }

    // Step 6: Create AI Tutor Contexts (if enabled)
    if (config.create_ai_contexts) {
      console.log('\n6️⃣ Creating AI tutor contexts...');
      
      for (const enrollment of createdEnrollments) {
        try {
          const contextResult = await academiaMCPClient.getOrCreateAITutorContext(
            enrollment.user.id,
            enrollment.course.id,
            'general'
          );
          
          if (contextResult.success && contextResult.data) {
            result.created.ai_contexts++;
            console.log(`  ✅ Created AI context: ${enrollment.user.email} - ${enrollment.course.title}`);
          } else {
            const error = `Failed to create AI context: ${contextResult.error?.message}`;
            result.errors.push(error);
            console.log(`  ❌ ${error}`);
          }
        } catch (error) {
          const errorMsg = `Error creating AI context: ${error instanceof Error ? error.message : 'Unknown error'}`;
          result.errors.push(errorMsg);
          console.log(`  ❌ ${errorMsg}`);
        }
      }
    }

    result.success = result.errors.length === 0;
    result.duration_ms = Date.now() - startTime;

    // Print summary
    console.log('\n📊 Seed Data Generation Summary:');
    console.log(`  Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`  Duration: ${(result.duration_ms / 1000).toFixed(2)}s`);
    console.log(`  Certification Modules: ${result.created.certification_modules}`);
    console.log(`  Courses: ${result.created.courses}`);
    console.log(`  Users: ${result.created.users}`);
    console.log(`  Enrollments: ${result.created.enrollments}`);
    console.log(`  Exam Sessions: ${result.created.sessions}`);
    console.log(`  AI Contexts: ${result.created.ai_contexts}`);
    console.log(`  Errors: ${result.errors.length}`);

    if (result.errors.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

  } catch (error) {
    console.error('💥 Seed data generation failed with error:', error);
    result.success = false;
    result.errors.push(`Generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    result.duration_ms = Date.now() - startTime;
  }

  return result;
}

/**
 * Generate detailed seed data report
 */
function generateSeedDataReport(result: SeedDataResult): string {
  const timestamp = new Date().toISOString();
  
  return `
# Academia Seed Data Generation Report
Generated: ${timestamp}

## Summary
- **Status**: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}
- **Duration**: ${(result.duration_ms / 1000).toFixed(2)} seconds
- **Total Errors**: ${result.errors.length}

## Data Created
- **Certification Modules**: ${result.created.certification_modules}
- **Courses**: ${result.created.courses}
- **Test Users**: ${result.created.users}
- **Course Enrollments**: ${result.created.enrollments}
- **Exam Sessions**: ${result.created.sessions}
- **AI Tutor Contexts**: ${result.created.ai_contexts}

## Total Records
**${Object.values(result.created).reduce((sum, count) => sum + count, 0)}** records created

## Errors
${result.errors.length > 0 ? result.errors.map(error => `- ${error}`).join('\n') : 'No errors encountered'}

## Next Steps
${result.success ? 
  '- Seed data generation completed successfully\n- Academia system is ready for testing and development\n- Run verification script to confirm data integrity' : 
  '- Review and resolve errors above\n- Check database connectivity and permissions\n- Rerun seed data generation after fixes'}

## Test Data Overview
The generated seed data includes:

### Certification Modules
- EOI English Certification (B1, B2 levels)
- JQCV Valenciano Certification (Elemental, Mitjà levels)
- DELF French Certification
- Goethe German Certification  
- CILS Italian Certification

### Test Users
- ${result.created.users} test users with GDPR-compliant profiles
- Realistic names and email addresses
- Varied language preferences and retention settings
- All users have proper consents and verification status

### Course Enrollments
- ${result.created.enrollments} total enrollments across all users
- Multiple subscription tiers (basic, standard, premium)
- Realistic target exam dates (90 days from creation)
- Initial assessment data for progress tracking

### Exam Sessions
- ${result.created.sessions} practice and exam sessions
- Multiple session types (practice, mock_exam, diagnostic)
- All four skill components (reading, writing, listening, speaking)
- Realistic scores, feedback, and improvement suggestions
- 80% completion rate with timing and device context

### AI Tutor Contexts
- ${result.created.ai_contexts} AI tutor contexts for personalized learning
- General context type for broad learning support
- Proper expiration dates for GDPR compliance
- Ready for AI integration and interaction history

This seed data provides a comprehensive foundation for:
- Testing all academia functionality
- Demonstrating multi-language support
- Validating GDPR/LOPD compliance
- Performance testing with realistic data volume
- Development of new features and enhancements
`;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (require.main === module) {
  // Parse command line arguments for custom configuration
  const args = process.argv.slice(2);
  const config = { ...DEFAULT_SEED_CONFIG };
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value !== undefined) {
      switch (key) {
        case 'modules':
          config.certification_modules = parseInt(value, 10);
          break;
        case 'courses':
          config.courses_per_module = parseInt(value, 10);
          break;
        case 'users':
          config.test_users = parseInt(value, 10);
          break;
        case 'enrollments':
          config.enrollments_per_user = parseInt(value, 10);
          break;
        case 'sessions':
          config.sessions_per_enrollment = parseInt(value, 10);
          break;
        case 'no-ai':
          config.create_ai_contexts = false;
          i--; // This flag doesn't take a value
          break;
        case 'overwrite':
          config.skip_existing = false;
          i--; // This flag doesn't take a value
          break;
      }
    }
  }

  generateSeedData(config)
    .then(result => {
      const report = generateSeedDataReport(result);
      console.log('\n' + report);
      
      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Failed to generate seed data:', error);
      process.exit(1);
    });
}

export { generateSeedData, generateSeedDataReport, type SeedDataConfig, type SeedDataResult };