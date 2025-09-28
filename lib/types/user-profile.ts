/**
 * TypeScript Type System for User Profile Management
 * 
 * Comprehensive type definitions for UserProfile entity with GDPR/LOPD compliance,
 * validation rules, and data model specifications.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { User as SupabaseUser } from '@supabase/auth-js';

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

/**
 * Supported languages for the platform
 */
export enum PreferredLanguage {
  EN = 'en',
  ES = 'es',
  CA = 'ca',
  FR = 'fr',
  DE = 'de',
  IT = 'it',
  PT = 'pt'
}

/**
 * Data retention preferences following GDPR guidelines
 */
export enum DataRetentionPreference {
  /** Minimal data retention - only essential data */
  MINIMAL = 'minimal',
  /** Standard retention - 2 years after last activity */
  STANDARD = 'standard',
  /** Extended retention - 5 years for research/analytics */
  EXTENDED = 'extended'
}

/**
 * GDPR consent types for granular consent management
 */
export enum ConsentType {
  /** Required consent for service functionality */
  GDPR_REQUIRED = 'gdpr_required',
  /** Optional consent for marketing communications */
  MARKETING = 'marketing',
  /** Optional consent for analytics and usage tracking */
  ANALYTICS = 'analytics',
  /** Optional consent for personalized content */
  PERSONALIZATION = 'personalization',
  /** Optional consent for third-party integrations */
  THIRD_PARTY = 'third_party'
}

/**
 * LOPD (Spanish Data Protection Law) specific consent categories
 */
export enum LOPDConsentCategory {
  /** Basic personal data processing */
  BASIC_PROCESSING = 'basic_processing',
  /** Academic progress tracking */
  ACADEMIC_TRACKING = 'academic_tracking',
  /** Communication preferences */
  COMMUNICATIONS = 'communications',
  /** Quality improvement and research */
  RESEARCH = 'research'
}

/**
 * User profile status states
 */
export enum UserProfileStatus {
  /** Profile is active and fully functional */
  ACTIVE = 'active',
  /** Profile is inactive (user request or inactivity) */
  INACTIVE = 'inactive',
  /** Profile is pending email verification */
  PENDING_VERIFICATION = 'pending_verification',
  /** Profile is suspended (violation or admin action) */
  SUSPENDED = 'suspended',
  /** Profile is marked for deletion (GDPR right to be forgotten) */
  PENDING_DELETION = 'pending_deletion'
}

// =============================================================================
// CORE USER PROFILE TYPES
// =============================================================================

/**
 * Core UserProfile entity based on data model specification
 * 
 * Represents a complete user profile with GDPR/LOPD compliance,
 * authentication integration, and comprehensive consent management.
 */
export interface UserProfile {
  /** Primary key - UUID referencing auth.users */
  id: string;
  
  /** Email address from Supabase Auth (required, unique, verified) */
  email: string;
  
  /** User's full display name */
  full_name: string;
  
  /** Preferred language for UI and communications */
  preferred_language: PreferredLanguage;
  
  /** GDPR consent status (required before course access) */
  gdpr_consent: boolean;
  
  /** Timestamp when GDPR consent was given */
  gdpr_consent_date: Date;
  
  /** LOPD consent status (required for Spanish users) */
  lopd_consent: boolean;
  
  /** Data retention preference affecting session storage */
  data_retention_preference: DataRetentionPreference;
  
  /** Profile creation timestamp */
  created_at: Date;
  
  /** Last activity timestamp for retention policies */
  last_active: Date;
  
  /** Profile status for lifecycle management */
  status: UserProfileStatus;
  
  /** Email verification status */
  email_verified: boolean;
  
  /** Email verification timestamp */
  email_verified_at?: Date | null;
  
  /** Last profile update timestamp */
  updated_at: Date;
}

/**
 * Extended user profile with granular consent management
 */
export interface UserProfileWithConsents extends UserProfile {
  /** Detailed consent records for granular GDPR compliance */
  consents: ConsentRecord[];
  
  /** Data processing log for audit trails */
  data_processing_log: DataProcessingRecord[];
  
  /** User preferences for personalization */
  preferences: UserPreferences;
}

/**
 * Granular consent record for GDPR compliance
 */
export interface ConsentRecord {
  /** Consent record unique identifier */
  id: string;
  
  /** Reference to user profile */
  user_id: string;
  
  /** Type of consent */
  consent_type: ConsentType;
  
  /** Whether consent is granted */
  granted: boolean;
  
  /** Timestamp when consent was given/withdrawn */
  granted_at: Date;
  
  /** IP address when consent was recorded */
  ip_address?: string | null;
  
  /** User agent when consent was recorded */
  user_agent?: string | null;
  
  /** Version of privacy policy at consent time */
  privacy_policy_version: string;
  
  /** Consent expiration date (if applicable) */
  expires_at?: Date | null;
  
  /** Whether consent was withdrawn */
  withdrawn: boolean;
  
  /** Timestamp when consent was withdrawn */
  withdrawn_at?: Date | null;
  
  /** Reason for consent withdrawal */
  withdrawal_reason?: string | null;
  
  /** Legal basis for processing (GDPR Article 6) */
  legal_basis: LegalBasis;
  
  /** Creation timestamp */
  created_at: Date;
  
  /** Last update timestamp */
  updated_at: Date;
}

/**
 * Legal basis for data processing under GDPR Article 6
 */
export enum LegalBasis {
  /** User has given explicit consent */
  CONSENT = 'consent',
  /** Processing necessary for contract performance */
  CONTRACT = 'contract',
  /** Processing necessary for legal obligation compliance */
  LEGAL_OBLIGATION = 'legal_obligation',
  /** Processing necessary to protect vital interests */
  VITAL_INTERESTS = 'vital_interests',
  /** Processing necessary for public interest tasks */
  PUBLIC_TASK = 'public_task',
  /** Processing necessary for legitimate interests */
  LEGITIMATE_INTERESTS = 'legitimate_interests'
}

/**
 * Data processing record for audit trails
 */
export interface DataProcessingRecord {
  /** Processing record unique identifier */
  id: string;
  
  /** Reference to user profile */
  user_id: string;
  
  /** Type of data processing activity */
  activity_type: DataProcessingActivity;
  
  /** Description of processing activity */
  description: string;
  
  /** Data categories processed */
  data_categories: string[];
  
  /** Purpose of processing */
  purpose: string;
  
  /** Legal basis for processing */
  legal_basis: LegalBasis;
  
  /** Data retention period */
  retention_period: string;
  
  /** Third parties involved (if any) */
  third_parties?: string[] | null;
  
  /** Processing timestamp */
  processed_at: Date;
  
  /** Data subject rights exercised */
  rights_exercised?: DataSubjectRight[] | null;
  
  /** Creation timestamp */
  created_at: Date;
}

/**
 * Types of data processing activities
 */
export enum DataProcessingActivity {
  /** Account creation and registration */
  REGISTRATION = 'registration',
  /** Authentication and login */
  AUTHENTICATION = 'authentication',
  /** Course enrollment and progress tracking */
  ACADEMIC_TRACKING = 'academic_tracking',
  /** Communication and notifications */
  COMMUNICATIONS = 'communications',
  /** Analytics and usage tracking */
  ANALYTICS = 'analytics',
  /** Support and customer service */
  SUPPORT = 'support',
  /** Marketing and promotional activities */
  MARKETING = 'marketing',
  /** Data backup and archival */
  BACKUP = 'backup',
  /** Data deletion and anonymization */
  DELETION = 'deletion'
}

/**
 * Data subject rights under GDPR
 */
export enum DataSubjectRight {
  /** Right to access personal data */
  ACCESS = 'access',
  /** Right to rectification of inaccurate data */
  RECTIFICATION = 'rectification',
  /** Right to erasure (right to be forgotten) */
  ERASURE = 'erasure',
  /** Right to restriction of processing */
  RESTRICTION = 'restriction',
  /** Right to data portability */
  PORTABILITY = 'portability',
  /** Right to object to processing */
  OBJECTION = 'objection',
  /** Right not to be subject to automated decision-making */
  AUTOMATED_DECISIONS = 'automated_decisions'
}

/**
 * User preferences for personalization and experience
 */
export interface UserPreferences {
  /** Notification preferences */
  notifications: NotificationPreferences;
  
  /** Privacy preferences */
  privacy: PrivacyPreferences;
  
  /** Accessibility preferences */
  accessibility: AccessibilityPreferences;
  
  /** Learning preferences */
  learning: LearningPreferences;
  
  /** Regional and cultural preferences */
  regional: RegionalPreferences;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  /** Email notifications enabled */
  email_enabled: boolean;
  
  /** Course progress notifications */
  course_progress: boolean;
  
  /** Exam reminders */
  exam_reminders: boolean;
  
  /** Weekly progress summaries */
  weekly_summaries: boolean;
  
  /** Platform updates and announcements */
  platform_updates: boolean;
  
  /** Marketing communications */
  marketing_emails: boolean;
  
  /** Notification frequency */
  frequency: NotificationFrequency;
}

/**
 * Notification frequency options
 */
export enum NotificationFrequency {
  /** Immediate notifications */
  IMMEDIATE = 'immediate',
  /** Daily digest */
  DAILY = 'daily',
  /** Weekly summary */
  WEEKLY = 'weekly',
  /** Monthly summary */
  MONTHLY = 'monthly',
  /** No notifications */
  DISABLED = 'disabled'
}

/**
 * Privacy preferences
 */
export interface PrivacyPreferences {
  /** Profile visibility to other users */
  profile_visibility: ProfileVisibility;
  
  /** Show progress in leaderboards */
  show_progress: boolean;
  
  /** Allow contact from other users */
  allow_contact: boolean;
  
  /** Share anonymous usage data for research */
  anonymous_analytics: boolean;
  
  /** Participate in educational research */
  research_participation: boolean;
}

/**
 * Profile visibility options
 */
export enum ProfileVisibility {
  /** Profile is public and searchable */
  PUBLIC = 'public',
  /** Profile visible to course participants only */
  COURSE_PARTICIPANTS = 'course_participants',
  /** Profile visible to platform users only */
  PLATFORM_USERS = 'platform_users',
  /** Profile is completely private */
  PRIVATE = 'private'
}

/**
 * Accessibility preferences
 */
export interface AccessibilityPreferences {
  /** High contrast mode enabled */
  high_contrast: boolean;
  
  /** Large text mode enabled */
  large_text: boolean;
  
  /** Screen reader compatibility mode */
  screen_reader: boolean;
  
  /** Reduced motion preferences */
  reduced_motion: boolean;
  
  /** Color blind assistance */
  color_blind_assistance: boolean;
  
  /** Keyboard navigation only */
  keyboard_only: boolean;
}

/**
 * Learning preferences
 */
export interface LearningPreferences {
  /** Preferred study time of day */
  preferred_study_time: StudyTime;
  
  /** Learning style preferences */
  learning_style: LearningStyle[];
  
  /** Difficulty progression preference */
  difficulty_progression: DifficultyProgression;
  
  /** Feedback frequency preference */
  feedback_frequency: FeedbackFrequency;
  
  /** Study reminder preferences */
  study_reminders: boolean;
  
  /** Gamification preferences */
  gamification_enabled: boolean;
}

/**
 * Preferred study time options
 */
export enum StudyTime {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening',
  NIGHT = 'night',
  FLEXIBLE = 'flexible'
}

/**
 * Learning style preferences
 */
export enum LearningStyle {
  VISUAL = 'visual',
  AUDITORY = 'auditory',
  KINESTHETIC = 'kinesthetic',
  READING_WRITING = 'reading_writing'
}

/**
 * Difficulty progression preferences
 */
export enum DifficultyProgression {
  /** Gradual increase in difficulty */
  GRADUAL = 'gradual',
  /** Adaptive difficulty based on performance */
  ADAPTIVE = 'adaptive',
  /** Challenging from the start */
  CHALLENGING = 'challenging',
  /** User-controlled progression */
  MANUAL = 'manual'
}

/**
 * Feedback frequency preferences
 */
export enum FeedbackFrequency {
  /** Immediate feedback after each question */
  IMMEDIATE = 'immediate',
  /** Feedback after each section */
  SECTION = 'section',
  /** Feedback at end of session */
  SESSION = 'session',
  /** Minimal feedback */
  MINIMAL = 'minimal'
}

/**
 * Regional and cultural preferences
 */
export interface RegionalPreferences {
  /** Time zone for scheduling */
  timezone: string;
  
  /** Date format preference */
  date_format: DateFormat;
  
  /** Number format preference */
  number_format: NumberFormat;
  
  /** Cultural context for examples */
  cultural_context: string[];
  
  /** Currency preference */
  currency: string;
}

/**
 * Date format preferences
 */
export enum DateFormat {
  /** DD/MM/YYYY */
  DMY = 'dmy',
  /** MM/DD/YYYY */
  MDY = 'mdy',
  /** YYYY-MM-DD */
  YMD = 'ymd',
  /** Localized format */
  LOCALIZED = 'localized'
}

/**
 * Number format preferences
 */
export enum NumberFormat {
  /** 1,234.56 (US/UK) */
  COMMA_DOT = 'comma_dot',
  /** 1.234,56 (European) */
  DOT_COMMA = 'dot_comma',
  /** 1 234,56 (French) */
  SPACE_COMMA = 'space_comma',
  /** Localized format */
  LOCALIZED = 'localized'
}

// =============================================================================
// VALIDATION TYPES AND RULES
// =============================================================================

/**
 * User profile validation rules
 */
export interface UserProfileValidationRules {
  /** Email validation requirements */
  email: EmailValidationRules;
  
  /** Full name validation requirements */
  full_name: NameValidationRules;
  
  /** GDPR consent validation requirements */
  gdpr_consent: ConsentValidationRules;
  
  /** LOPD consent validation requirements */
  lopd_consent: ConsentValidationRules;
  
  /** Data retention validation requirements */
  data_retention: RetentionValidationRules;
}

/**
 * Email validation rules
 */
export interface EmailValidationRules {
  /** Email must be valid format */
  valid_format: boolean;
  
  /** Email must be verified */
  must_be_verified: boolean;
  
  /** Maximum length allowed */
  max_length: number;
  
  /** Minimum length allowed */
  min_length: number;
  
  /** Allowed domains (empty array = all allowed) */
  allowed_domains: string[];
  
  /** Blocked domains */
  blocked_domains: string[];
  
  /** Require unique email across platform */
  unique_required: boolean;
}

/**
 * Name validation rules
 */
export interface NameValidationRules {
  /** Minimum length required */
  min_length: number;
  
  /** Maximum length allowed */
  max_length: number;
  
  /** Allowed characters pattern */
  allowed_pattern: string;
  
  /** Require both first and last name */
  require_full_name: boolean;
  
  /** Profanity filter enabled */
  profanity_filter: boolean;
}

/**
 * Consent validation rules
 */
export interface ConsentValidationRules {
  /** Consent is required before course access */
  required_for_access: boolean;
  
  /** Minimum age for consent */
  minimum_age: number;
  
  /** Require explicit consent (not pre-checked) */
  explicit_required: boolean;
  
  /** Record IP address and user agent */
  record_metadata: boolean;
  
  /** Consent expiration period (days) */
  expiration_days?: number | null;
}

/**
 * Data retention validation rules
 */
export interface RetentionValidationRules {
  /** Default retention preference */
  default_preference: DataRetentionPreference;
  
  /** Minimum retention period (days) */
  minimum_days: number;
  
  /** Maximum retention period (days) */
  maximum_days: number;
  
  /** Allow user to change preference */
  user_changeable: boolean;
  
  /** Automatic deletion after maximum period */
  auto_delete: boolean;
}

/**
 * Validation error types
 */
export interface UserProfileValidationError {
  /** Field that failed validation */
  field: keyof UserProfile | string;
  
  /** Error message */
  message: string;
  
  /** Error code for internationalization */
  code: UserProfileValidationErrorCode;
  
  /** Current field value */
  value?: unknown;
  
  /** Expected format or constraint */
  constraint?: string;
  
  /** Additional error context */
  context?: Record<string, unknown>;
}

/**
 * Validation error codes
 */
export enum UserProfileValidationErrorCode {
  // Required field errors
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  
  // Format errors
  INVALID_EMAIL_FORMAT = 'INVALID_EMAIL_FORMAT',
  INVALID_NAME_FORMAT = 'INVALID_NAME_FORMAT',
  INVALID_LANGUAGE_CODE = 'INVALID_LANGUAGE_CODE',
  
  // Length errors
  EMAIL_TOO_SHORT = 'EMAIL_TOO_SHORT',
  EMAIL_TOO_LONG = 'EMAIL_TOO_LONG',
  NAME_TOO_SHORT = 'NAME_TOO_SHORT',
  NAME_TOO_LONG = 'NAME_TOO_LONG',
  
  // Business rule errors
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  EMAIL_DOMAIN_BLOCKED = 'EMAIL_DOMAIN_BLOCKED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  GDPR_CONSENT_REQUIRED = 'GDPR_CONSENT_REQUIRED',
  LOPD_CONSENT_REQUIRED = 'LOPD_CONSENT_REQUIRED',
  MINIMUM_AGE_NOT_MET = 'MINIMUM_AGE_NOT_MET',
  
  // Security errors
  PROFANITY_DETECTED = 'PROFANITY_DETECTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // System errors
  DUPLICATE_PROFILE = 'DUPLICATE_PROFILE',
  INVALID_TIMESTAMP = 'INVALID_TIMESTAMP',
  DATA_CORRUPTION = 'DATA_CORRUPTION'
}

/**
 * Validation result
 */
export interface UserProfileValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Array of validation errors */
  errors: UserProfileValidationError[];
  
  /** Array of validation warnings */
  warnings: UserProfileValidationError[];
  
  /** Validated and sanitized data */
  sanitized_data?: Partial<UserProfile>;
  
  /** Validation timestamp */
  validated_at: Date;
  
  /** Validation context */
  context: ValidationContext;
}

/**
 * Validation context
 */
export interface ValidationContext {
  /** Validation trigger source */
  source: ValidationSource;
  
  /** User's IP address */
  ip_address?: string;
  
  /** User's user agent */
  user_agent?: string;
  
  /** Validation rules version */
  rules_version: string;
  
  /** Regional context for validation */
  region?: string;
  
  /** Language context for error messages */
  language: PreferredLanguage;
}

/**
 * Validation sources
 */
export enum ValidationSource {
  /** User registration form */
  REGISTRATION = 'registration',
  
  /** Profile update form */
  PROFILE_UPDATE = 'profile_update',
  
  /** Admin user creation */
  ADMIN_CREATE = 'admin_create',
  
  /** API endpoint */
  API = 'api',
  
  /** Data migration */
  MIGRATION = 'migration',
  
  /** System validation */
  SYSTEM = 'system'
}

// =============================================================================
// API CONTRACT TYPES
// =============================================================================

/**
 * Create user profile request
 */
export interface CreateUserProfileRequest {
  /** User's email address */
  email: string;
  
  /** User's full name */
  full_name: string;
  
  /** Preferred language */
  preferred_language: PreferredLanguage;
  
  /** GDPR consent acknowledgment */
  gdpr_consent: boolean;
  
  /** LOPD consent acknowledgment (required for Spanish users) */
  lopd_consent: boolean;
  
  /** Data retention preference */
  data_retention_preference: DataRetentionPreference;
  
  /** Initial consent records */
  initial_consents?: Partial<ConsentRecord>[];
  
  /** Initial user preferences */
  preferences?: Partial<UserPreferences>;
  
  /** Creation metadata */
  metadata?: {
    /** IP address for consent recording */
    ip_address?: string;
    
    /** User agent for consent recording */
    user_agent?: string;
    
    /** Registration source */
    source?: string;
    
    /** Referral information */
    referral?: string;
  };
}

/**
 * Update user profile request
 */
export interface UpdateUserProfileRequest {
  /** Updated full name */
  full_name?: string;
  
  /** Updated preferred language */
  preferred_language?: PreferredLanguage;
  
  /** Updated data retention preference */
  data_retention_preference?: DataRetentionPreference;
  
  /** Updated user preferences */
  preferences?: Partial<UserPreferences>;
  
  /** Consent updates */
  consent_updates?: {
    /** Consent type to update */
    consent_type: ConsentType;
    
    /** New consent status */
    granted: boolean;
    
    /** Reason for change */
    reason?: string;
  }[];
  
  /** Update metadata */
  metadata?: {
    /** IP address for audit trail */
    ip_address?: string;
    
    /** User agent for audit trail */
    user_agent?: string;
    
    /** Update reason */
    reason?: string;
  };
}

/**
 * User profile response
 */
export interface UserProfileResponse {
  /** User profile data */
  profile: UserProfile;
  
  /** Whether profile has required consents */
  has_required_consents: boolean;
  
  /** Course access permissions */
  course_access_granted: boolean;
  
  /** Data processing summary */
  data_processing_summary: {
    /** Active consent types */
    active_consents: ConsentType[];
    
    /** Last consent update */
    last_consent_update?: Date;
    
    /** Data retention end date */
    retention_end_date?: Date;
    
    /** Next required consent review */
    next_consent_review?: Date;
  };
  
  /** Response metadata */
  metadata: {
    /** Response timestamp */
    timestamp: Date;
    
    /** Data version */
    version: string;
    
    /** Regional compliance context */
    region: string;
  };
}

/**
 * GDPR data export request
 */
export interface GDPRDataExportRequest {
  /** User ID requesting export */
  user_id: string;
  
  /** Data categories to include */
  categories: DataCategory[];
  
  /** Export format */
  format: ExportFormat;
  
  /** Date range for export */
  date_range?: {
    from: Date;
    to: Date;
  };
  
  /** Request verification */
  verification: {
    /** Verification method used */
    method: VerificationMethod;
    
    /** Verification token */
    token: string;
    
    /** Requester IP address */
    ip_address: string;
  };
}

/**
 * Data categories for GDPR export
 */
export enum DataCategory {
  /** Basic profile information */
  PROFILE = 'profile',
  
  /** Authentication and login data */
  AUTHENTICATION = 'authentication',
  
  /** Course enrollment and progress */
  ACADEMIC = 'academic',
  
  /** Communication history */
  COMMUNICATIONS = 'communications',
  
  /** Payment and billing data */
  FINANCIAL = 'financial',
  
  /** Consent and privacy settings */
  CONSENT = 'consent',
  
  /** System logs and analytics */
  SYSTEM_LOGS = 'system_logs',
  
  /** Support interactions */
  SUPPORT = 'support'
}

/**
 * Export formats
 */
export enum ExportFormat {
  /** JSON format */
  JSON = 'json',
  
  /** CSV format */
  CSV = 'csv',
  
  /** PDF format */
  PDF = 'pdf',
  
  /** XML format */
  XML = 'xml'
}

/**
 * Verification methods for sensitive operations
 */
export enum VerificationMethod {
  /** Email verification link */
  EMAIL = 'email',
  
  /** SMS verification code */
  SMS = 'sms',
  
  /** Two-factor authentication */
  TWO_FACTOR = 'two_factor',
  
  /** Admin verification */
  ADMIN = 'admin'
}

// =============================================================================
// UTILITY TYPES AND HELPERS
// =============================================================================

/**
 * Type for creating a new user profile (omits auto-generated fields)
 */
export type CreateUserProfileData = Omit<UserProfile, 
  'id' | 'created_at' | 'updated_at' | 'last_active' | 'email_verified_at'
>;

/**
 * Type for updating an existing user profile (all fields optional except id)
 */
export type UpdateUserProfileData = Partial<Omit<UserProfile, 
  'id' | 'created_at' | 'email' | 'gdpr_consent_date'
>> & {
  id: string;
};

/**
 * User profile with Supabase Auth integration
 */
export interface UserProfileWithAuth extends UserProfile {
  /** Supabase Auth user data */
  auth_user: SupabaseUser;
  
  /** Authentication metadata */
  auth_metadata: {
    /** Last sign in timestamp */
    last_sign_in_at?: Date;
    
    /** Email confirmation status */
    email_confirmed_at?: Date;
    
    /** Phone confirmation status */
    phone_confirmed_at?: Date;
    
    /** MFA enabled status */
    mfa_enabled: boolean;
    
    /** Authentication provider */
    provider: string;
  };
}

/**
 * User profile summary for lists and search results
 */
export interface UserProfileSummary {
  /** User ID */
  id: string;
  
  /** Email address */
  email: string;
  
  /** Full name */
  full_name: string;
  
  /** Profile status */
  status: UserProfileStatus;
  
  /** Last activity timestamp */
  last_active: Date;
  
  /** Has required consents */
  has_required_consents: boolean;
  
  /** Course access status */
  course_access_granted: boolean;
  
  /** Account creation date */
  created_at: Date;
}

// =============================================================================
// DEFAULT VALUES AND CONSTANTS
// =============================================================================

/**
 * Default user profile validation rules
 */
export const DEFAULT_USER_PROFILE_VALIDATION_RULES: UserProfileValidationRules = {
  email: {
    valid_format: true,
    must_be_verified: true,
    max_length: 254,
    min_length: 5,
    allowed_domains: [],
    blocked_domains: ['temp-mail.org', '10minutemail.com', 'guerrillamail.com'],
    unique_required: true
  },
  full_name: {
    min_length: 2,
    max_length: 100,
    allowed_pattern: '^[a-zA-ZÀ-ÿ\\u0100-\\u017F\\u0400-\\u04FF\\s\\.\'-]+$',
    require_full_name: true,
    profanity_filter: true
  },
  gdpr_consent: {
    required_for_access: true,
    minimum_age: 16,
    explicit_required: true,
    record_metadata: true,
    expiration_days: null
  },
  lopd_consent: {
    required_for_access: true,
    minimum_age: 14,
    explicit_required: true,
    record_metadata: true,
    expiration_days: null
  },
  data_retention: {
    default_preference: DataRetentionPreference.STANDARD,
    minimum_days: 30,
    maximum_days: 2555, // 7 years
    user_changeable: true,
    auto_delete: true
  }
};

/**
 * Default user preferences
 */
export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  notifications: {
    email_enabled: true,
    course_progress: true,
    exam_reminders: true,
    weekly_summaries: true,
    platform_updates: true,
    marketing_emails: false,
    frequency: NotificationFrequency.WEEKLY
  },
  privacy: {
    profile_visibility: ProfileVisibility.COURSE_PARTICIPANTS,
    show_progress: true,
    allow_contact: false,
    anonymous_analytics: true,
    research_participation: false
  },
  accessibility: {
    high_contrast: false,
    large_text: false,
    screen_reader: false,
    reduced_motion: false,
    color_blind_assistance: false,
    keyboard_only: false
  },
  learning: {
    preferred_study_time: StudyTime.FLEXIBLE,
    learning_style: [LearningStyle.VISUAL, LearningStyle.READING_WRITING],
    difficulty_progression: DifficultyProgression.ADAPTIVE,
    feedback_frequency: FeedbackFrequency.SECTION,
    study_reminders: true,
    gamification_enabled: true
  },
  regional: {
    timezone: 'UTC',
    date_format: DateFormat.LOCALIZED,
    number_format: NumberFormat.LOCALIZED,
    cultural_context: [],
    currency: 'EUR'
  }
};

/**
 * GDPR consent retention periods (in days)
 */
export const GDPR_RETENTION_PERIODS: Record<DataRetentionPreference, number> = {
  [DataRetentionPreference.MINIMAL]: 365,      // 1 year
  [DataRetentionPreference.STANDARD]: 730,     // 2 years
  [DataRetentionPreference.EXTENDED]: 1825     // 5 years
};

/**
 * Required consent types for platform access
 */
export const REQUIRED_CONSENT_TYPES: ConsentType[] = [
  ConsentType.GDPR_REQUIRED
];

/**
 * Regional consent requirements
 */
export const REGIONAL_CONSENT_REQUIREMENTS: Record<string, ConsentType[]> = {
  'ES': [ConsentType.GDPR_REQUIRED], // Spain - LOPD handled separately
  'EU': [ConsentType.GDPR_REQUIRED], // European Union
  'US': [], // United States - no specific requirements
  'CA': [ConsentType.GDPR_REQUIRED], // Canada - similar to GDPR
  'DEFAULT': [ConsentType.GDPR_REQUIRED]
};

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if user profile has required consents
 */
export function hasRequiredConsents(
  profile: UserProfile,
  region: string = 'DEFAULT'
): boolean {
  const requiredConsents = REGIONAL_CONSENT_REQUIREMENTS[region] || 
                          REGIONAL_CONSENT_REQUIREMENTS.DEFAULT;
  
  // Basic GDPR consent check
  if (!profile.gdpr_consent) {
    return false;
  }
  
  // LOPD consent check for Spanish users
  if (region === 'ES' && !profile.lopd_consent) {
    return false;
  }
  
  return true;
}

/**
 * Type guard to check if user profile can access courses
 */
export function canAccessCourses(profile: UserProfile, region?: string): boolean {
  return profile.status === UserProfileStatus.ACTIVE &&
         profile.email_verified &&
         hasRequiredConsents(profile, region);
}

/**
 * Type guard to check if email is verified
 */
export function isEmailVerified(profile: UserProfile): boolean {
  return profile.email_verified && 
         profile.email_verified_at !== null &&
         profile.email_verified_at !== undefined;
}

/**
 * Utility function to calculate data retention end date
 */
export function calculateRetentionEndDate(
  profile: UserProfile
): Date {
  const retentionDays = GDPR_RETENTION_PERIODS[profile.data_retention_preference];
  const endDate = new Date(profile.last_active);
  endDate.setDate(endDate.getDate() + retentionDays);
  return endDate;
}

/**
 * Utility function to check if profile is subject to deletion
 */
export function isSubjectToAutoDeletion(profile: UserProfile): boolean {
  const retentionEndDate = calculateRetentionEndDate(profile);
  return new Date() > retentionEndDate;
}

/**
 * Utility function to get supported languages list
 */
export function getSupportedLanguages(): PreferredLanguage[] {
  return Object.values(PreferredLanguage);
}

/**
 * Utility function to validate preferred language
 */
export function isValidPreferredLanguage(lang: string): lang is PreferredLanguage {
  return Object.values(PreferredLanguage).includes(lang as PreferredLanguage);
}

/**
 * Utility function to validate data retention preference
 */
export function isValidDataRetentionPreference(
  preference: string
): preference is DataRetentionPreference {
  return Object.values(DataRetentionPreference).includes(
    preference as DataRetentionPreference
  );
}

// Re-export commonly used types for convenience
export type { SupabaseUser };