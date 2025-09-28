/**
 * Swipe de la Norma Game - Configuration Constants
 *
 * Centralized configuration for the swipe-based language normalization game.
 * Contains all game rules, thresholds, and constants from the specification.
 */

import type {
  Language,
  Level,
  ExamProvider,
  Skill,
  SessionDuration,
  AccessibilityConfig
} from '@/lib/types/swipe-game';

// =============================================================================
// GAME MECHANICS CONFIGURATION
// =============================================================================

/** Core scoring configuration */
const SCORING_CONFIG = {
  /** Points awarded for correct answers */
  CORRECT_POINTS: 1,

  /** Points deducted for incorrect answers (allows negative scores) */
  INCORRECT_POINTS: -1.33,

  /** Minimum threshold to detect suspicious activity (milliseconds) */
  SUSPICIOUS_LATENCY_THRESHOLD_MS: 250,

  /** Maximum reasonable response time (milliseconds) */
  MAX_REASONABLE_LATENCY_MS: 10000,

  /** Multiplier for streak bonus calculation */
  STREAK_BONUS_MULTIPLIER: 0.1
} as const;

/** Session duration options in seconds */
const SESSION_DURATIONS: readonly SessionDuration[] = [20, 30, 60, 120] as const;

/** Default session configuration */
const DEFAULT_SESSION_CONFIG = {
  /** Default session duration */
  DURATION_S: 60 as SessionDuration,

  /** Default deck size for a session */
  DECK_SIZE: 50,

  /** Minimum deck size */
  MIN_DECK_SIZE: 10,

  /** Maximum deck size */
  MAX_DECK_SIZE: 100
} as const;

/** Game configuration and constraints */
const GAME_CONFIG = {
  /** Minimum deck size */
  MIN_DECK_SIZE: DEFAULT_SESSION_CONFIG.MIN_DECK_SIZE,

  /** Maximum deck size */
  MAX_DECK_SIZE: DEFAULT_SESSION_CONFIG.MAX_DECK_SIZE,

  /** Supported languages */
  SUPPORTED_LANGUAGES: ['es', 'val', 'en'] as const,

  /** Supported CEFR levels */
  SUPPORTED_LEVELS: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const,

  /** Supported exam providers */
  SUPPORTED_EXAMS: ['EOI', 'JQCV', 'Cambridge', 'DELE', 'SIELE'] as const,

  /** Supported skill areas */
  SUPPORTED_SKILLS: ['reading', 'writing', 'listening', 'speaking', 'vocabulary', 'grammar'] as const,

  /** Minimum session duration in seconds */
  MIN_SESSION_DURATION: 20,

  /** Maximum session duration in seconds */
  MAX_SESSION_DURATION: 120
} as const;

// =============================================================================
// ELO RATING SYSTEM CONFIGURATION
// =============================================================================

/** ELO rating system parameters */
const ELO_CONFIG = {
  /** Default starting rating for new users and items */
  DEFAULT_RATING: 1500,

  /** Minimum possible rating */
  MIN_RATING: 800,

  /** Maximum possible rating */
  MAX_RATING: 2400,

  /** K-factor for rating calculations (higher = more volatile) */
  K_FACTOR: {
    /** K-factor for new players (high volatility) */
    NEW_PLAYER: 24,
    /** K-factor for established players */
    ESTABLISHED: 20,
    /** K-factor for expert players (low volatility) */
    EXPERT: 16
  },

  /** Rating deviation for uncertainty measurement */
  RATING_DEVIATION: {
    /** Default RD for new players */
    DEFAULT: 350,
    /** Minimum RD (high certainty) */
    MIN: 50,
    /** Maximum RD (high uncertainty) */
    MAX: 500
  },

  /** Thresholds for player categories */
  PLAYER_THRESHOLDS: {
    /** Threshold for expert level */
    EXPERT: 1800,
    /** Threshold for advanced level */
    ADVANCED: 1600,
    /** Threshold for intermediate level */
    INTERMEDIATE: 1400,
    /** Threshold for beginner level */
    BEGINNER: 1200
  }
} as const;

/** Adaptive difficulty configuration */
const ADAPTIVE_DIFFICULTY_CONFIG = {
  /** Percentage of items in user's skill range */
  IN_RANGE_PERCENTAGE: 0.6,

  /** Percentage of easier items */
  EASIER_PERCENTAGE: 0.2,

  /** Percentage of harder items */
  HARDER_PERCENTAGE: 0.2,

  /** Rating range around user's skill level */
  SKILL_RANGE_SPREAD: 200,

  /** Rating difference for "easier" items */
  EASIER_RATING_OFFSET: -300,

  /** Rating difference for "harder" items */
  HARDER_RATING_OFFSET: 300
} as const;

// =============================================================================
// CONTENT MANAGEMENT CONFIGURATION
// =============================================================================

/** Supported languages with their metadata */
const LANGUAGE_CONFIG: Record<Language, {
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}> = {
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    direction: 'ltr'
  },
  val: {
    name: 'Valencian',
    nativeName: 'Valencià',
    flag: '🏴󠁥󠁳󠁶󠁣󠁿',
    direction: 'ltr'
  },
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    direction: 'ltr'
  }
} as const;

/** CEFR levels with their descriptions */
const LEVEL_CONFIG: Record<Level, {
  name: string;
  description: string;
  color: string;
}> = {
  A1: {
    name: 'Beginner',
    description: 'Can understand and use familiar everyday expressions',
    color: '#10B981' // green-500
  },
  A2: {
    name: 'Elementary',
    description: 'Can communicate in simple routine tasks',
    color: '#84CC16' // lime-500
  },
  B1: {
    name: 'Intermediate',
    description: 'Can deal with most situations in the target language area',
    color: '#F59E0B' // amber-500
  },
  B2: {
    name: 'Upper Intermediate',
    description: 'Can interact with fluency and spontaneity',
    color: '#EF4444' // red-500
  },
  C1: {
    name: 'Advanced',
    description: 'Can use language flexibly and effectively',
    color: '#8B5CF6' // violet-500
  },
  C2: {
    name: 'Proficient',
    description: 'Can understand virtually everything heard or read',
    color: '#EC4899' // pink-500
  }
} as const;

/** Exam providers with their metadata */
const EXAM_PROVIDER_CONFIG: Record<ExamProvider, {
  name: string;
  fullName: string;
  website: string;
  logo?: string;
  description: string;
}> = {
  EOI: {
    name: 'EOI',
    fullName: 'Escuelas Oficiales de Idiomas',
    website: 'https://www.educacion.gob.es',
    description: 'Official Language Schools certification'
  },
  Cambridge: {
    name: 'Cambridge',
    fullName: 'Cambridge English Qualifications',
    website: 'https://www.cambridgeenglish.org',
    description: 'Cambridge University English assessment'
  },
  DELE: {
    name: 'DELE',
    fullName: 'Diploma de Español como Lengua Extranjera',
    website: 'https://dele.cervantes.es',
    description: 'Spanish proficiency certification by Instituto Cervantes'
  },
  JQCV: {
    name: 'JQCV',
    fullName: 'Junta Qualificadora de Coneixements de Valencià',
    website: 'https://www.gva.es',
    description: 'Valencian language proficiency certification'
  }
} as const;

/** Skills with their metadata */
const SKILL_CONFIG: Record<Skill, {
  name: string;
  description: string;
  icon: string;
  color: string;
}> = {
  W: {
    name: 'Writing',
    description: 'Written expression and production',
    icon: '✏️',
    color: '#3B82F6' // blue-500
  },
  R: {
    name: 'Reading',
    description: 'Reading comprehension',
    icon: '📖',
    color: '#10B981' // emerald-500
  },
  Med: {
    name: 'Mediation',
    description: 'Cross-linguistic mediation',
    icon: '🔄',
    color: '#8B5CF6' // violet-500
  },
  S: {
    name: 'Speaking',
    description: 'Oral expression and interaction',
    icon: '🗣️',
    color: '#F59E0B' // amber-500
  }
} as const;

/** Common language learning tags with metadata */
const TAG_CONFIG = {
  // Register and formality
  formal: { color: '#1F2937', description: 'Formal register' },
  neutral: { color: '#6B7280', description: 'Neutral register' },
  informal: { color: '#9CA3AF', description: 'Informal register' },

  // Spanish specific
  'coloq.': { color: '#EF4444', description: 'Coloquial (informal)' },
  'vulg.': { color: '#DC2626', description: 'Vulgar expression' },
  'desus.': { color: '#7C2D12', description: 'Obsolete/archaic' },
  'malson.': { color: '#991B1B', description: 'Harsh/offensive' },

  // Valencian specific
  'col·loquial': { color: '#EF4444', description: 'Col·loquial (informal)' },
  castellanisme: { color: '#DC2626', description: 'Castellanism (Spanish influence)' },
  anglicisme: { color: '#B91C1C', description: 'Anglicism (English influence)' },
  vulgarisme: { color: '#991B1B', description: 'Vulgar expression' },
  arcaic: { color: '#7C2D12', description: 'Archaic term' },

  // English specific
  slang: { color: '#EF4444', description: 'Slang expression' },
  regional: { color: '#F97316', description: 'Regional variant' },
  academic: { color: '#059669', description: 'Academic register' },

  // Functional categories
  registro: { color: '#8B5CF6', description: 'Register-related' },
  conectores: { color: '#3B82F6', description: 'Connectors/linking words' },
  falsos_amigos: { color: '#DC2626', description: 'False friends' },
  muletillas: { color: '#F59E0B', description: 'Filler words' },
  ortografía: { color: '#10B981', description: 'Spelling/orthography' }
} as const;

// =============================================================================
// PERFORMANCE AND ANALYTICS CONFIGURATION
// =============================================================================

/** Performance targets and thresholds */
const PERFORMANCE_CONFIG = {
  /** Target response time for game actions (milliseconds) */
  TARGET_RESPONSE_TIME_MS: 250,

  /** Target frame rate for animations */
  TARGET_FPS: 60,

  /** Target accuracy improvement over 7 days */
  ACCURACY_IMPROVEMENT_TARGET: 0.25, // 25%

  /** Target retention metrics */
  RETENTION_TARGETS: {
    /** Target number of swipes per day */
    DAILY_SWIPES: 30,
    /** Target number of consecutive days */
    CONSECUTIVE_DAYS: 5,
    /** Target session completion rate */
    COMPLETION_RATE: 0.8 // 80%
  },

  /** Performance monitoring thresholds */
  MONITORING_THRESHOLDS: {
    /** API response time alert threshold */
    API_RESPONSE_TIME_MS: 500,
    /** Database query time alert threshold */
    DB_QUERY_TIME_MS: 100,
    /** Client-side render time alert threshold */
    RENDER_TIME_MS: 16.67, // 60fps = 16.67ms per frame
    /** Error rate alert threshold */
    ERROR_RATE_PERCENTAGE: 1.0 // 1%
  }
} as const;

/** Analytics configuration */
const ANALYTICS_CONFIG = {
  /** Session timeout for analytics (minutes) */
  SESSION_TIMEOUT_MINUTES: 30,

  /** Batch size for analytics events */
  BATCH_SIZE: 100,

  /** Flush interval for analytics (seconds) */
  FLUSH_INTERVAL_SECONDS: 30,

  /** Data retention periods */
  RETENTION_PERIODS: {
    /** Raw events retention (days) */
    RAW_EVENTS: 90,
    /** Aggregated data retention (days) */
    AGGREGATED_DATA: 365,
    /** User progress retention (days) */
    USER_PROGRESS: 730 // 2 years
  }
} as const;

// =============================================================================
// UI/UX CONFIGURATION
// =============================================================================

/** Default accessibility configuration */
const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  high_contrast: false,
  reduce_motion: false,
  keyboard_navigation: true,
  screen_reader_support: true,
  font_size_multiplier: 1.0
} as const;

/** Animation configuration */
const ANIMATION_CONFIG = {
  /** Duration for card swipe animations (milliseconds) */
  SWIPE_DURATION_MS: 300,

  /** Duration for score updates (milliseconds) */
  SCORE_UPDATE_DURATION_MS: 200,

  /** Duration for timer transitions (milliseconds) */
  TIMER_TRANSITION_MS: 100,

  /** Easing function for animations */
  EASING: 'cubic-bezier(0.4, 0.0, 0.2, 1)',

  /** Spring configuration for swipe gestures */
  SPRING_CONFIG: {
    tension: 300,
    friction: 30
  }
} as const;

/** UI constants */
const UI_CONFIG = {
  /** Card dimensions */
  CARD: {
    WIDTH: 320,
    HEIGHT: 200,
    BORDER_RADIUS: 12
  },

  /** Timer configuration */
  TIMER: {
    /** Warning threshold (seconds remaining) */
    WARNING_THRESHOLD: 10,
    /** Critical threshold (seconds remaining) */
    CRITICAL_THRESHOLD: 5
  },

  /** Score display configuration */
  SCORE: {
    /** Decimal places for score display */
    DECIMAL_PLACES: 1,
    /** Animation threshold for score changes */
    ANIMATION_THRESHOLD: 0.5
  },

  /** Responsive breakpoints */
  BREAKPOINTS: {
    MOBILE: 640,
    TABLET: 768,
    DESKTOP: 1024
  }
} as const;

// =============================================================================
// KEYBOARD SHORTCUTS CONFIGURATION
// =============================================================================

/** Keyboard shortcuts for game controls */
const KEYBOARD_SHORTCUTS = {
  /** Left arrow or 'A' key for "no apta" */
  NO_APTA: ['ArrowLeft', 'KeyA'],

  /** Right arrow or 'D' key for "apta" */
  APTA: ['ArrowRight', 'KeyD'],

  /** Space or 'P' key for pause */
  PAUSE: ['Space', 'KeyP'],

  /** Escape key for menu/quit */
  MENU: ['Escape'],

  /** Enter key for confirm/continue */
  CONFIRM: ['Enter'],

  /** Help shortcuts */
  HELP: ['F1', 'KeyH'],

  /** Skip item (if enabled) */
  SKIP: ['KeyS']
} as const;

// =============================================================================
// CONTENT SEEDING CONFIGURATION
// =============================================================================

/** Content seeding configuration for initial data */
const CONTENT_SEEDING_CONFIG = {
  /** Initial number of items per language */
  ITEMS_PER_LANGUAGE: 50,

  /** Content version format */
  VERSION_FORMAT: '{lang}_{year}.{month}',

  /** Sample content structure */
  SAMPLE_CONTENT: {
    es: {
      count: 50,
      examples: ['asín→así', 'haiga→haya', 'naide→nadie', 'a nivel de→en cuanto a']
    },
    val: {
      count: 50,
      examples: ['aixina→així', 'vore→veure', 'lo→el', 'anem a vore→vegem']
    },
    en: {
      count: 50,
      examples: ['gonna→going to', 'innit→isn\'t it', 'kinda→kind of', 'reckon→consider']
    }
  }
} as const;

// =============================================================================
// API CONFIGURATION
// =============================================================================

/** API configuration constants */
const API_CONFIG = {
  /** Base API path */
  BASE_PATH: '/api/swipe',

  /** API version */
  VERSION: 'v1',

  /** Request timeout (milliseconds) */
  TIMEOUT_MS: 10000,

  /** Retry configuration */
  RETRY: {
    /** Maximum number of retries */
    MAX_ATTEMPTS: 3,
    /** Retry delay multiplier */
    DELAY_MULTIPLIER: 1000,
    /** Maximum retry delay */
    MAX_DELAY_MS: 5000
  },

  /** Rate limiting */
  RATE_LIMITS: {
    /** Requests per minute for authenticated users */
    AUTHENTICATED_RPM: 300,
    /** Requests per minute for anonymous users */
    ANONYMOUS_RPM: 60,
    /** Burst allowance */
    BURST_SIZE: 10
  }
} as const;

// =============================================================================
// SECURITY CONFIGURATION
// =============================================================================

/** Security configuration */
const SECURITY_CONFIG = {
  /** CORS configuration */
  CORS: {
    /** Allowed origins */
    ALLOWED_ORIGINS: [
      'http://localhost:3000',
      'https://neolingus.com'
    ],
    /** Allowed methods */
    ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE'],
    /** Allowed headers */
    ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  /** Content Security Policy */
  CSP: {
    /** Default source */
    DEFAULT_SRC: ["'self'"],
    /** Script source */
    SCRIPT_SRC: ["'self'", "'unsafe-inline'"],
    /** Style source */
    STYLE_SRC: ["'self'", "'unsafe-inline'"],
    /** Image source */
    IMG_SRC: ["'self'", 'data:', 'https:'],
    /** Connect source */
    CONNECT_SRC: ["'self'", 'https://api.supabase.co']
  }
} as const;

// =============================================================================
// ENVIRONMENT CONFIGURATION
// =============================================================================

/** Environment-specific configuration */
const ENVIRONMENT_CONFIG = {
  /** Development environment settings */
  DEVELOPMENT: {
    DEBUG_MODE: true,
    LOG_LEVEL: 'debug',
    ANALYTICS_ENABLED: false,
    MOCK_API_DELAY_MS: 100
  },

  /** Production environment settings */
  PRODUCTION: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'error',
    ANALYTICS_ENABLED: true,
    MOCK_API_DELAY_MS: 0
  },

  /** Test environment settings */
  TEST: {
    DEBUG_MODE: false,
    LOG_LEVEL: 'silent',
    ANALYTICS_ENABLED: false,
    MOCK_API_DELAY_MS: 0
  }
} as const;

// =============================================================================
// EXPORTS
// =============================================================================

export {
  // Game mechanics
  SCORING_CONFIG,
  SESSION_DURATIONS,
  DEFAULT_SESSION_CONFIG,
  GAME_CONFIG,

  // ELO system
  ELO_CONFIG,
  ADAPTIVE_DIFFICULTY_CONFIG,

  // Content configuration
  LANGUAGE_CONFIG,
  LEVEL_CONFIG,
  EXAM_PROVIDER_CONFIG,
  SKILL_CONFIG,
  TAG_CONFIG,

  // Performance and analytics
  PERFORMANCE_CONFIG,
  ANALYTICS_CONFIG,

  // UI/UX
  DEFAULT_ACCESSIBILITY_CONFIG,
  ANIMATION_CONFIG,
  UI_CONFIG,
  KEYBOARD_SHORTCUTS,

  // Content seeding
  CONTENT_SEEDING_CONFIG,

  // API and security
  API_CONFIG,
  SECURITY_CONFIG,
  ENVIRONMENT_CONFIG
};