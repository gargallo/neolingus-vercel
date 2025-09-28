/**
 * TypeScript Type System for Admin User Management
 * 
 * This file contains comprehensive types for the admin user management system,
 * including database entities, API contracts, UI components, and form handling.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { User as SupabaseUser } from '@supabase/auth-js'

// =============================================================================
// ENUMS AND CONSTANTS
// =============================================================================

/**
 * Available user roles in the system
 */
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  COURSE_MANAGER = 'course_manager',
  SUPPORT = 'support'
}

/**
 * User account status
 */
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  UNCONFIRMED = 'unconfirmed',
  SUSPENDED = 'suspended'
}

/**
 * Subscription status for user courses
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

/**
 * Subscription tier levels
 */
export enum SubscriptionTier {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium'
}

/**
 * Payment transaction status
 */
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

/**
 * Available permission types
 */
export enum Permission {
  // User management
  USERS_VIEW = 'users.view',
  USERS_CREATE = 'users.create',
  USERS_UPDATE = 'users.update',
  USERS_DELETE = 'users.delete',
  
  // Course management
  COURSES_VIEW = 'courses.view',
  COURSES_MANAGE = 'courses.manage',
  
  // Admin management
  ADMINS_VIEW = 'admins.view',
  ADMINS_MANAGE = 'admins.manage',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_EXPORT = 'analytics.export',
  
  // System settings
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_MANAGE = 'settings.manage'
}

// =============================================================================
// DATABASE ENTITY TYPES
// =============================================================================

/**
 * User entity from auth.users table
 */
export interface User extends SupabaseUser {
  /** User's unique identifier */
  id: string
  /** User's email address */
  email?: string
  /** Phone number if provided */
  phone?: string
  /** Timestamp when email was confirmed */
  email_confirmed_at?: string | null
  /** Timestamp of last sign in */
  last_sign_in_at?: string | null
  /** User metadata object */
  user_metadata?: Record<string, unknown>
  /** App metadata object */
  app_metadata?: Record<string, unknown>
  /** Account creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at?: string
}

/**
 * Admin user entity from admin_users table
 */
export interface AdminUser {
  /** Admin record unique identifier */
  id: string
  /** Reference to auth.users.id */
  user_id: string
  /** Admin role */
  role: UserRole
  /** JSON object with specific permissions */
  permissions: Record<string, boolean>
  /** Whether the admin account is active */
  active: boolean
  /** Last login timestamp */
  last_login?: string | null
  /** Account creation timestamp */
  created_at: string
  /** Admin who created this account */
  created_by?: string | null
}

/**
 * Course entity from courses table
 */
export interface Course {
  /** Course unique identifier (UUID) */
  id: string
  /** Course identifier string (e.g., 'valenciano_c1') */
  course_id: string
  /** Human-readable course title */
  title: string
  /** Course language */
  language: string
  /** Course level (A1, A2, B1, B2, C1, C2) */
  level: string
  /** Institution name */
  institution: string
  /** Region/location */
  region: string
  /** Course description */
  description?: string | null
  /** Cultural context information */
  cultural_context?: string[] | null
  /** Course image URL */
  image_url?: string | null
  /** Whether course is available for enrollment */
  available: boolean
  /** Creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
}

/**
 * User course subscription from user_courses table
 */
export interface UserCourse {
  /** Subscription record ID */
  id: string
  /** Reference to auth.users.id */
  user_id: string
  /** Reference to courses.course_id */
  course_id: string
  /** Current subscription status */
  subscription_status: SubscriptionStatus
  /** When access expires (null for permanent access) */
  access_expires_at?: string | null
  /** Subscription tier level */
  subscription_tier: SubscriptionTier
  /** Subscription creation timestamp */
  created_at: string
  /** Last update timestamp */
  updated_at: string
}

/**
 * Payment transaction from payment_transactions table
 */
export interface PaymentTransaction {
  /** Transaction unique identifier */
  id: string
  /** Reference to auth.users.id */
  user_id: string
  /** External subscription ID */
  subscription_id?: string | null
  /** Payment provider name */
  payment_provider: string
  /** External payment ID */
  payment_id: string
  /** Transaction amount */
  amount: number
  /** Currency code */
  currency: string
  /** Transaction status */
  status: PaymentStatus
  /** Transaction description */
  description?: string | null
  /** Additional metadata */
  metadata: Record<string, unknown>
  /** Transaction creation timestamp */
  created_at: string
  /** Transaction processing timestamp */
  processed_at?: string | null
}

/**
 * Audit log entry from audit_logs table
 */
export interface AuditLog {
  /** Log entry unique identifier */
  id: string
  /** Reference to admin_users.id */
  admin_id?: string | null
  /** Action performed */
  action: string
  /** Resource type affected */
  resource_type: string
  /** Resource ID (if applicable) */
  resource_id?: string | null
  /** Previous data state */
  old_data?: Record<string, unknown> | null
  /** New data state */
  new_data?: Record<string, unknown> | null
  /** Client IP address */
  ip_address?: string | null
  /** Client user agent */
  user_agent?: string | null
  /** Action timestamp */
  created_at: string
}

// =============================================================================
// EXTENDED TYPES WITH RELATIONS
// =============================================================================

/**
 * User with related admin information
 */
export interface UserWithAdmin extends User {
  /** Admin information if user is an admin */
  admin_user?: AdminUser | null
}

/**
 * User with course subscriptions
 */
export interface UserWithCourses extends User {
  /** List of course subscriptions */
  user_courses: (UserCourse & {
    /** Course details */
    course?: Course
  })[]
}

/**
 * User with payment history
 */
export interface UserWithPayments extends User {
  /** Payment transaction history */
  payment_transactions: PaymentTransaction[]
}

/**
 * Complete user profile with all relations
 */
export interface UserProfile extends User {
  /** Admin information if applicable */
  admin_user?: AdminUser | null
  /** Course subscriptions */
  user_courses: (UserCourse & {
    /** Course details */
    course?: Course
  })[]
  /** Payment transaction history */
  payment_transactions: PaymentTransaction[]
  /** User statistics */
  statistics?: UserStatistics
}

/**
 * User statistics aggregated data
 */
export interface UserStatistics {
  /** Total number of courses enrolled */
  total_courses: number
  /** Active course subscriptions */
  active_subscriptions: number
  /** Total amount spent */
  total_spent: number
  /** Last activity timestamp */
  last_activity?: string | null
  /** Number of exams taken */
  exams_taken: number
  /** Average exam score */
  average_score?: number | null
  /** Account registration date */
  registered_days_ago: number
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  /** Response data */
  data?: T
  /** Error message if failed */
  error?: string
  /** Response success status */
  success: boolean
  /** Response timestamp */
  timestamp: string
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T = any> {
  /** Response data array */
  data: T[]
  /** Pagination information */
  pagination: PaginationInfo
  /** Total count (may differ from data.length due to filtering) */
  total: number
  /** Response success status */
  success: boolean
  /** Response timestamp */
  timestamp: string
}

/**
 * User list API response
 */
export interface UserListResponse extends PaginatedResponse<UserWithCourses> {
  /** List of users with course information */
  users: UserWithCourses[]
  /** Filter summary */
  filters?: {
    /** Applied search term */
    search?: string
    /** Applied status filter */
    status?: string
    /** Applied role filter */
    role?: string
    /** Applied course filter */
    course?: string
  }
}

/**
 * User detail API response
 */
export interface UserDetailResponse extends ApiResponse<UserProfile> {
  /** Complete user profile */
  user: UserProfile
}

/**
 * Create user request payload
 */
export interface CreateUserRequest {
  /** User email address */
  email: string
  /** User password */
  password: string
  /** Optional user metadata */
  metadata?: Record<string, any>
  /** Whether to automatically confirm email */
  email_confirm?: boolean
  /** Course subscriptions to create */
  courses?: {
    /** Course identifier */
    course_id: string
    /** Subscription tier */
    tier: SubscriptionTier
    /** Access expiration date */
    expires_at?: string | null
  }[]
  /** Admin role if creating admin user */
  admin_role?: UserRole
  /** Admin permissions if creating admin user */
  admin_permissions?: Record<string, boolean>
}

/**
 * Create user API response
 */
export interface CreateUserResponse extends ApiResponse<User> {
  /** Created user */
  user: User
  /** Temporary password for user notification */
  temporary_password?: string
}

/**
 * Update user request payload
 */
export interface UpdateUserRequest {
  /** Updated email address */
  email?: string
  /** Updated user metadata */
  metadata?: Record<string, any>
  /** Updated admin role (if admin) */
  admin_role?: UserRole
  /** Updated admin permissions (if admin) */
  admin_permissions?: Record<string, boolean>
  /** Admin account active status */
  admin_active?: boolean
  /** Course subscription updates */
  course_updates?: {
    /** Course identifier */
    course_id: string
    /** Updated subscription status */
    status?: SubscriptionStatus
    /** Updated subscription tier */
    tier?: SubscriptionTier
    /** Updated expiration date */
    expires_at?: string | null
  }[]
}

/**
 * Update user API response
 */
export interface UpdateUserResponse extends ApiResponse<UserProfile> {
  /** Updated user profile */
  user: UserProfile
  /** List of changes made */
  changes: string[]
}

/**
 * Delete user API response
 */
export interface DeleteUserResponse extends ApiResponse<null> {
  /** Confirmation message */
  message: string
  /** Cleanup summary */
  cleanup?: {
    /** Number of course subscriptions removed */
    courses_removed: number
    /** Number of payment records archived */
    payments_archived: number
    /** Whether admin record was removed */
    admin_removed: boolean
  }
}

// =============================================================================
// UI COMPONENT TYPES
// =============================================================================

/**
 * Table column definition for user list
 */
export interface UserTableColumn {
  /** Column identifier */
  key: keyof UserWithCourses | string
  /** Column display label */
  label: string
  /** Whether column is sortable */
  sortable: boolean
  /** Column width (CSS value) */
  width?: string
  /** Column alignment */
  align?: 'left' | 'center' | 'right'
  /** Custom render function */
  render?: (user: UserWithCourses) => React.ReactNode
  /** Whether column is visible by default */
  visible: boolean
  /** Column order/priority */
  order: number
}

/**
 * Filter options for user list
 */
export interface FilterOptions {
  /** Search term */
  search: string
  /** Status filter */
  status: UserStatus | 'all'
  /** Role filter */
  role: UserRole | 'all'
  /** Course filter */
  course: string | 'all'
  /** Subscription status filter */
  subscription: SubscriptionStatus | 'all'
  /** Registration date range */
  dateRange: {
    /** Start date (ISO string) */
    from?: string | null
    /** End date (ISO string) */
    to?: string | null
  }
  /** Sort configuration */
  sort: {
    /** Sort field */
    field: string
    /** Sort direction */
    direction: 'asc' | 'desc'
  }
}

/**
 * URL search parameters for user list
 */
export interface SearchParams {
  /** Current page number */
  page?: string
  /** Items per page */
  limit?: string
  /** Search query */
  search?: string
  /** Status filter */
  status?: string
  /** Role filter */
  role?: string
  /** Course filter */
  course?: string
  /** Subscription filter */
  subscription?: string
  /** Date range start */
  from?: string
  /** Date range end */
  to?: string
  /** Sort field */
  sort?: string
  /** Sort direction */
  dir?: string
}

/**
 * Pagination information
 */
export interface PaginationInfo {
  /** Current page number (1-based) */
  page: number
  /** Items per page */
  limit: number
  /** Total number of items */
  total: number
  /** Total number of pages */
  pages: number
  /** Whether there is a previous page */
  hasPrevious: boolean
  /** Whether there is a next page */
  hasNext: boolean
}

/**
 * Table state for user management
 */
export interface UserTableState {
  /** Current filter settings */
  filters: FilterOptions
  /** Loading state */
  loading: boolean
  /** Error state */
  error?: string | null
  /** Selected user IDs */
  selectedUsers: string[]
  /** Bulk action state */
  bulkAction?: {
    /** Action type */
    type: 'delete' | 'suspend' | 'activate' | 'export'
    /** Action progress */
    progress?: number
    /** Action status */
    status: 'idle' | 'running' | 'complete' | 'error'
  }
}

// =============================================================================
// FORM TYPES
// =============================================================================

/**
 * Create user form data
 */
export interface CreateUserForm {
  /** User email address */
  email: string
  /** User password */
  password: string
  /** Password confirmation */
  confirmPassword: string
  /** User's first name */
  firstName?: string
  /** User's last name */
  lastName?: string
  /** User's phone number */
  phone?: string
  /** Whether user should be created as admin */
  isAdmin: boolean
  /** Admin role (if admin) */
  adminRole?: UserRole
  /** Course subscriptions to create */
  courses: {
    /** Course identifier */
    courseId: string
    /** Subscription tier */
    tier: SubscriptionTier
    /** Access duration in days (null for permanent) */
    durationDays?: number | null
  }[]
  /** Whether to send welcome email */
  sendWelcomeEmail: boolean
  /** Additional notes */
  notes?: string
}

/**
 * Update user form data
 */
export interface UpdateUserForm {
  /** Updated email address */
  email?: string
  /** User's first name */
  firstName?: string
  /** User's last name */
  lastName?: string
  /** User's phone number */
  phone?: string
  /** Admin role (if admin user) */
  adminRole?: UserRole
  /** Admin active status */
  adminActive?: boolean
  /** Custom permissions (overrides role defaults) */
  customPermissions?: Record<string, boolean>
  /** Course subscription updates */
  courseUpdates: {
    /** Course identifier */
    courseId: string
    /** Updated subscription status */
    status: SubscriptionStatus
    /** Updated subscription tier */
    tier: SubscriptionTier
    /** Updated expiration date */
    expiresAt?: string | null
    /** Action type */
    action: 'update' | 'add' | 'remove'
  }[]
  /** Update notes */
  notes?: string
}

/**
 * Filter form data
 */
export interface FilterForm {
  /** Search term */
  search: string
  /** Status filter */
  status: string
  /** Role filter */
  role: string
  /** Course filter */
  course: string
  /** Subscription status filter */
  subscription: string
  /** Registration date from */
  dateFrom?: Date | null
  /** Registration date to */
  dateTo?: Date | null
}

/**
 * Bulk action form data
 */
export interface BulkActionForm {
  /** Selected user IDs */
  userIds: string[]
  /** Action to perform */
  action: 'delete' | 'suspend' | 'activate' | 'export' | 'update_course'
  /** Action parameters */
  parameters?: {
    /** Course ID for course-related actions */
    courseId?: string
    /** New subscription status */
    subscriptionStatus?: SubscriptionStatus
    /** New subscription tier */
    subscriptionTier?: SubscriptionTier
    /** Suspension reason */
    suspensionReason?: string
    /** Export format */
    exportFormat?: 'csv' | 'xlsx' | 'json'
  }
  /** Confirmation required for destructive actions */
  confirmed: boolean
}

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Form validation error
 */
export interface ValidationError {
  /** Field name */
  field: string
  /** Error message */
  message: string
  /** Error code for i18n */
  code?: string
}

/**
 * Form validation result
 */
export interface ValidationResult {
  /** Whether form is valid */
  valid: boolean
  /** Array of validation errors */
  errors: ValidationError[]
  /** Warnings (non-blocking) */
  warnings?: ValidationError[]
}

/**
 * Field validation rules
 */
export interface ValidationRule {
  /** Rule type */
  type: 'required' | 'email' | 'minLength' | 'maxLength' | 'pattern' | 'custom'
  /** Rule value (for min/max length, pattern) */
  value?: any
  /** Error message */
  message: string
  /** Custom validation function */
  validator?: (value: any, form?: any) => boolean
}

// =============================================================================
// UTILITY AND HELPER TYPES
// =============================================================================

/**
 * Permission check result
 */
export interface PermissionCheck {
  /** Whether permission is granted */
  granted: boolean
  /** Reason if denied */
  reason?: string
  /** Required role for access */
  requiredRole?: UserRole
}

/**
 * User activity summary
 */
export interface UserActivity {
  /** User identifier */
  userId: string
  /** Last login date */
  lastLogin?: Date | null
  /** Last activity date */
  lastActivity?: Date | null
  /** Total session time (minutes) */
  totalSessionTime: number
  /** Number of sessions */
  sessionCount: number
  /** Most used features */
  topFeatures: string[]
  /** Activity trend (increasing/decreasing/stable) */
  trend: 'increasing' | 'decreasing' | 'stable'
}

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Export format */
  format: 'csv' | 'xlsx' | 'json' | 'pdf'
  /** Fields to include */
  fields: string[]
  /** Filter applied */
  filters?: FilterOptions
  /** Include related data */
  includeRelated?: {
    /** Include course data */
    courses: boolean
    /** Include payment data */
    payments: boolean
    /** Include admin data */
    admin: boolean
  }
  /** Export filename */
  filename?: string
}

/**
 * System health check for user management
 */
export interface UserSystemHealth {
  /** Total users count */
  totalUsers: number
  /** Active users count */
  activeUsers: number
  /** Admin users count */
  adminUsers: number
  /** Users created today */
  usersToday: number
  /** System status */
  status: 'healthy' | 'warning' | 'error'
  /** Health issues */
  issues?: string[]
  /** Last health check timestamp */
  lastCheck: Date
}

// =============================================================================
// TYPE GUARDS AND UTILITIES
// =============================================================================

/**
 * Type guard to check if user is admin
 */
export function isAdminUser(user: User | UserWithAdmin): user is UserWithAdmin & { admin_user: AdminUser } {
  return 'admin_user' in user && user.admin_user !== null && user.admin_user !== undefined
}

/**
 * Type guard to check if user has specific role
 */
export function hasRole(user: UserWithAdmin, role: UserRole): boolean {
  return isAdminUser(user) && user.admin_user.role === role
}

/**
 * Type guard to check if user has permission
 */
export function hasPermission(user: UserWithAdmin, permission: Permission): boolean {
  if (!isAdminUser(user)) return false
  return user.admin_user.permissions[permission] === true
}

// =============================================================================
// DEFAULT VALUES AND CONSTANTS
// =============================================================================

/**
 * Default filter options
 */
export const DEFAULT_FILTERS: FilterOptions = {
  search: '',
  status: 'all' as const,
  role: 'all' as const,
  course: 'all' as const,
  subscription: 'all' as const,
  dateRange: {
    from: null,
    to: null
  },
  sort: {
    field: 'created_at',
    direction: 'desc'
  }
}

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20
}

/**
 * Role hierarchy for permission inheritance
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.SUPER_ADMIN]: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.COURSE_MANAGER, UserRole.SUPPORT],
  [UserRole.ADMIN]: [UserRole.ADMIN, UserRole.COURSE_MANAGER, UserRole.SUPPORT],
  [UserRole.COURSE_MANAGER]: [UserRole.COURSE_MANAGER, UserRole.SUPPORT],
  [UserRole.SUPPORT]: [UserRole.SUPPORT]
}

/**
 * Default permissions by role
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
  [UserRole.SUPER_ADMIN]: {
    [Permission.USERS_VIEW]: true,
    [Permission.USERS_CREATE]: true,
    [Permission.USERS_UPDATE]: true,
    [Permission.USERS_DELETE]: true,
    [Permission.COURSES_VIEW]: true,
    [Permission.COURSES_MANAGE]: true,
    [Permission.ADMINS_VIEW]: true,
    [Permission.ADMINS_MANAGE]: true,
    [Permission.ANALYTICS_VIEW]: true,
    [Permission.ANALYTICS_EXPORT]: true,
    [Permission.SETTINGS_VIEW]: true,
    [Permission.SETTINGS_MANAGE]: true
  },
  [UserRole.ADMIN]: {
    [Permission.USERS_VIEW]: true,
    [Permission.USERS_CREATE]: true,
    [Permission.USERS_UPDATE]: true,
    [Permission.USERS_DELETE]: false,
    [Permission.COURSES_VIEW]: true,
    [Permission.COURSES_MANAGE]: true,
    [Permission.ADMINS_VIEW]: true,
    [Permission.ADMINS_MANAGE]: false,
    [Permission.ANALYTICS_VIEW]: true,
    [Permission.ANALYTICS_EXPORT]: true,
    [Permission.SETTINGS_VIEW]: true,
    [Permission.SETTINGS_MANAGE]: false
  },
  [UserRole.COURSE_MANAGER]: {
    [Permission.USERS_VIEW]: true,
    [Permission.USERS_CREATE]: false,
    [Permission.USERS_UPDATE]: true,
    [Permission.USERS_DELETE]: false,
    [Permission.COURSES_VIEW]: true,
    [Permission.COURSES_MANAGE]: true,
    [Permission.ADMINS_VIEW]: false,
    [Permission.ADMINS_MANAGE]: false,
    [Permission.ANALYTICS_VIEW]: true,
    [Permission.ANALYTICS_EXPORT]: false,
    [Permission.SETTINGS_VIEW]: false,
    [Permission.SETTINGS_MANAGE]: false
  },
  [UserRole.SUPPORT]: {
    [Permission.USERS_VIEW]: true,
    [Permission.USERS_CREATE]: false,
    [Permission.USERS_UPDATE]: false,
    [Permission.USERS_DELETE]: false,
    [Permission.COURSES_VIEW]: true,
    [Permission.COURSES_MANAGE]: false,
    [Permission.ADMINS_VIEW]: false,
    [Permission.ADMINS_MANAGE]: false,
    [Permission.ANALYTICS_VIEW]: true,
    [Permission.ANALYTICS_EXPORT]: false,
    [Permission.SETTINGS_VIEW]: false,
    [Permission.SETTINGS_MANAGE]: false
  }
}

// Re-export commonly used types for convenience
export type {
  SupabaseUser
}