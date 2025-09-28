/**
 * Utility Functions for Admin User Management System
 * 
 * This module provides comprehensive utility functions for user management,
 * including permission checking, data formatting, validation, export functionality,
 * and filter utilities. All functions are optimized for TypeScript with proper
 * error handling and JSDoc documentation.
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import {
  User,
  UserRole,
  UserStatus,
  Permission,
  CreateUserForm,
  UpdateUserForm,
  FilterOptions,
  ValidationError,
  ValidationResult,
  DEFAULT_PERMISSIONS,
  ROLE_HIERARCHY
} from './types'

// =============================================================================
// PERMISSION CHECKING UTILITIES
// =============================================================================

/**
 * Check if a user role has a specific permission
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns Whether the role has the permission
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  try {
    const rolePermissions = DEFAULT_PERMISSIONS[userRole]
    if (!rolePermissions) {
      console.warn(`Unknown user role: ${userRole}`)
      return false
    }

    return rolePermissions[permission] === true
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Check if current user can edit target user based on role hierarchy
 * @param currentUserRole - The current user's role
 * @param targetUserRole - The target user's role to edit
 * @returns Whether the current user can edit the target user
 */
export function canEditUser(currentUserRole: UserRole, targetUserRole: UserRole): boolean {
  try {
    // Super admin can edit anyone
    if (currentUserRole === UserRole.SUPER_ADMIN) {
      return true
    }

    // Users cannot edit users with equal or higher roles
    const currentHierarchy = ROLE_HIERARCHY[currentUserRole] || []
    return currentHierarchy.includes(targetUserRole)
  } catch (error) {
    console.error('Error checking edit permission:', error)
    return false
  }
}

/**
 * Get all permissions for a specific role
 * @param role - The user role
 * @returns Object containing all permissions for the role
 */
export function getRolePermissions(role: UserRole): Record<string, boolean> {
  try {
    const permissions = DEFAULT_PERMISSIONS[role]
    if (!permissions) {
      console.warn(`Unknown role: ${role}`)
      return {}
    }

    return { ...permissions }
  } catch (error) {
    console.error('Error getting role permissions:', error)
    return {}
  }
}

/**
 * Check if a role can assign another role
 * @param assignerRole - Role of the user doing the assignment
 * @param targetRole - Role being assigned
 * @returns Whether the assignment is allowed
 */
export function canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
  try {
    // Super admin can assign any role
    if (assignerRole === UserRole.SUPER_ADMIN) {
      return true
    }

    // Admin can assign course manager and support roles
    if (assignerRole === UserRole.ADMIN) {
      return [UserRole.COURSE_MANAGER, UserRole.SUPPORT].includes(targetRole)
    }

    // Other roles cannot assign roles
    return false
  } catch (error) {
    console.error('Error checking role assignment permission:', error)
    return false
  }
}

// =============================================================================
// DATA FORMATTING UTILITIES
// =============================================================================

/**
 * Format user status for display
 * @param user - User object
 * @returns Formatted status object with label, color, and icon
 */
export function formatUserStatus(user: User): {
  status: UserStatus
  label: string
  color: 'green' | 'yellow' | 'red' | 'gray'
  icon: string
} {
  try {
    // Determine status based on user properties
    let status: UserStatus = UserStatus.ACTIVE

    if (!user.email_confirmed_at) {
      status = UserStatus.UNCONFIRMED
    } else if (user.app_metadata?.suspended === true) {
      status = UserStatus.SUSPENDED
    } else if (user.app_metadata?.active === false) {
      status = UserStatus.INACTIVE
    }

    const statusConfig = {
      [UserStatus.ACTIVE]: {
        label: 'Active',
        color: 'green' as const,
        icon: '✓'
      },
      [UserStatus.INACTIVE]: {
        label: 'Inactive',
        color: 'gray' as const,
        icon: '○'
      },
      [UserStatus.UNCONFIRMED]: {
        label: 'Unconfirmed',
        color: 'yellow' as const,
        icon: '⚠'
      },
      [UserStatus.SUSPENDED]: {
        label: 'Suspended',
        color: 'red' as const,
        icon: '⚫'
      }
    }

    return {
      status,
      ...statusConfig[status]
    }
  } catch (error) {
    console.error('Error formatting user status:', error)
    return {
      status: UserStatus.INACTIVE,
      label: 'Unknown',
      color: 'gray',
      icon: '?'
    }
  }
}

/**
 * Format user role for display
 * @param role - User role
 * @returns Formatted role object with label and color
 */
export function formatUserRole(role: UserRole): {
  role: UserRole
  label: string
  color: 'blue' | 'purple' | 'green' | 'orange'
  priority: number
} {
  const roleConfig = {
    [UserRole.SUPER_ADMIN]: {
      label: 'Super Admin',
      color: 'purple' as const,
      priority: 1
    },
    [UserRole.ADMIN]: {
      label: 'Admin',
      color: 'blue' as const,
      priority: 2
    },
    [UserRole.COURSE_MANAGER]: {
      label: 'Course Manager',
      color: 'green' as const,
      priority: 3
    },
    [UserRole.SUPPORT]: {
      label: 'Support',
      color: 'orange' as const,
      priority: 4
    }
  }

  return {
    role,
    ...roleConfig[role]
  }
}

/**
 * Get user initials from name or email
 * @param name - User's full name (optional)
 * @param email - User's email address
 * @returns Two-letter initials
 */
export function getUserInitials(name: string = '', email: string): string {
  try {
    if (name && name.trim().length > 0) {
      const nameParts = name.trim().split(/\s+/)
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase()
      } else {
        return (nameParts[0][0] + nameParts[0][1] || '').toUpperCase()
      }
    }

    // Fallback to email
    if (email && email.includes('@')) {
      const emailPrefix = email.split('@')[0]
      return (emailPrefix[0] + (emailPrefix[1] || '')).toUpperCase()
    }

    return 'U?'
  } catch (error) {
    console.error('Error generating user initials:', error)
    return 'U?'
  }
}

/**
 * Format date for display
 * @param date - Date string or Date object
 * @param options - Formatting options
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date | null | undefined,
  options: {
    style?: 'short' | 'medium' | 'long' | 'relative'
    includeTime?: boolean
    timezone?: string
  } = {}
): string {
  try {
    if (!date) return 'Never'

    const dateObj = typeof date === 'string' ? new Date(date) : date
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }

    const { style = 'medium', includeTime = false, timezone } = options

    if (style === 'relative') {
      return getRelativeTime(dateObj)
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: timezone
    }

    switch (style) {
      case 'short':
        formatOptions.dateStyle = 'short'
        break
      case 'long':
        formatOptions.dateStyle = 'full'
        break
      default:
        formatOptions.dateStyle = 'medium'
    }

    if (includeTime) {
      formatOptions.timeStyle = 'short'
    }

    return new Intl.DateTimeFormat('en-US', formatOptions).format(dateObj)
  } catch (error) {
    console.error('Error formatting date:', error)
    return 'Invalid date'
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 * @param date - Date object
 * @returns Relative time string
 */
function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minutes ago`
  if (diffHour < 24) return `${diffHour} hours ago`
  if (diffDay < 7) return `${diffDay} days ago`
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} weeks ago`
  if (diffDay < 365) return `${Math.floor(diffDay / 30)} months ago`
  return `${Math.floor(diffDay / 365)} years ago`
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

/**
 * Validate email address
 * @param email - Email address to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  const errors: ValidationError[] = []

  if (!email || email.trim().length === 0) {
    errors.push({
      field: 'email',
      message: 'Email is required',
      code: 'EMAIL_REQUIRED'
    })
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      errors.push({
        field: 'email',
        message: 'Please enter a valid email address',
        code: 'EMAIL_INVALID'
      })
    }

    if (email.length > 254) {
      errors.push({
        field: 'email',
        message: 'Email address is too long (max 254 characters)',
        code: 'EMAIL_TOO_LONG'
      })
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Validation result with strength indicators
 */
export function validatePassword(password: string): ValidationResult & {
  strength: 'weak' | 'medium' | 'strong'
  score: number
} {
  const errors: ValidationError[] = []
  let score = 0

  if (!password) {
    errors.push({
      field: 'password',
      message: 'Password is required',
      code: 'PASSWORD_REQUIRED'
    })
    return { valid: false, errors, strength: 'weak', score: 0 }
  }

  // Length requirements
  if (password.length < 8) {
    errors.push({
      field: 'password',
      message: 'Password must be at least 8 characters long',
      code: 'PASSWORD_TOO_SHORT'
    })
  } else {
    score += 1
    if (password.length >= 12) score += 1
  }

  // Character type requirements
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSymbols = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasLower || !hasUpper) {
    errors.push({
      field: 'password',
      message: 'Password must contain both uppercase and lowercase letters',
      code: 'PASSWORD_MISSING_CASE'
    })
  } else {
    score += 1
  }

  if (!hasNumbers) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one number',
      code: 'PASSWORD_MISSING_NUMBER'
    })
  } else {
    score += 1
  }

  if (!hasSymbols) {
    errors.push({
      field: 'password',
      message: 'Password must contain at least one special character',
      code: 'PASSWORD_MISSING_SYMBOL'
    })
  } else {
    score += 1
  }

  // Common password check
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]
  
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push({
      field: 'password',
      message: 'Password is too common, please choose a stronger password',
      code: 'PASSWORD_TOO_COMMON'
    })
    score = Math.max(0, score - 2)
  }

  const strength: 'weak' | 'medium' | 'strong' = 
    score >= 4 ? 'strong' : score >= 2 ? 'medium' : 'weak'

  return {
    valid: errors.length === 0,
    errors,
    strength,
    score
  }
}

/**
 * Validate user form data
 * @param formData - Form data to validate
 * @returns Validation result
 */
export function validateUserForm(
  formData: CreateUserForm | UpdateUserForm
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Email validation (required for create, optional for update)
  if ('email' in formData && formData.email !== undefined) {
    const emailValidation = validateEmail(formData.email)
    errors.push(...emailValidation.errors)
  } else if ('password' in formData) {
    // Creating user, email is required
    errors.push({
      field: 'email',
      message: 'Email is required when creating a user',
      code: 'EMAIL_REQUIRED'
    })
  }

  // Password validation (only for create form)
  if ('password' in formData) {
    const createForm = formData as CreateUserForm
    
    const passwordValidation = validatePassword(createForm.password)
    errors.push(...passwordValidation.errors)

    // Confirm password
    if (createForm.password !== createForm.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        message: 'Passwords do not match',
        code: 'PASSWORD_MISMATCH'
      })
    }

    // Warn about password strength
    if (passwordValidation.strength === 'weak') {
      warnings.push({
        field: 'password',
        message: 'Consider using a stronger password',
        code: 'PASSWORD_WEAK'
      })
    }
  }

  // Name validation (if provided)
  if ('firstName' in formData && formData.firstName) {
    if (formData.firstName.length > 50) {
      errors.push({
        field: 'firstName',
        message: 'First name is too long (max 50 characters)',
        code: 'FIRSTNAME_TOO_LONG'
      })
    }
  }

  if ('lastName' in formData && formData.lastName) {
    if (formData.lastName.length > 50) {
      errors.push({
        field: 'lastName',
        message: 'Last name is too long (max 50 characters)',
        code: 'LASTNAME_TOO_LONG'
      })
    }
  }

  // Phone validation (if provided)
  if ('phone' in formData && formData.phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    if (!phoneRegex.test(formData.phone)) {
      errors.push({
        field: 'phone',
        message: 'Please enter a valid phone number',
        code: 'PHONE_INVALID'
      })
    }
  }

  // Admin role validation
  if ('isAdmin' in formData && formData.isAdmin && !formData.adminRole) {
    errors.push({
      field: 'adminRole',
      message: 'Admin role is required when creating admin user',
      code: 'ADMIN_ROLE_REQUIRED'
    })
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Export users to CSV format
 * @param users - Array of users to export
 * @param options - Export options
 * @returns CSV string
 */
export function exportUsersToCSV(
  users: User[],
  options: {
    includeHeaders?: boolean
    fields?: string[]
    delimiter?: string
  } = {}
): string {
  try {
    const {
      includeHeaders = true,
      fields = ['email', 'created_at', 'last_sign_in_at', 'email_confirmed_at'],
      delimiter = ','
    } = options

    const lines: string[] = []

    // Add headers
    if (includeHeaders) {
      lines.push(fields.join(delimiter))
    }

    // Add data rows
    users.forEach(user => {
      const row = fields.map(field => {
        const value = getNestedValue(user, field)
        
        // Handle special formatting
        if (field.includes('_at') && value) {
          return formatDate(value as string, { style: 'short', includeTime: true })
        }

        // Escape CSV values
        const stringValue = String(value || '')
        if (stringValue.includes(delimiter) || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        
        return stringValue
      })
      
      lines.push(row.join(delimiter))
    })

    return lines.join('\n')
  } catch (error) {
    console.error('Error exporting users to CSV:', error)
    throw new Error('Failed to export users to CSV')
  }
}

/**
 * Export users to Excel format (returns data structure for xlsx library)
 * @param users - Array of users to export
 * @param options - Export options
 * @returns Data structure for Excel export
 */
export function exportUsersToExcel(
  users: User[],
  options: {
    sheetName?: string
    fields?: string[]
    includeHeaders?: boolean
  } = {}
): {
  sheetName: string
  data: unknown[][]
} {
  try {
    const {
      sheetName = 'Users',
      fields = ['email', 'created_at', 'last_sign_in_at', 'email_confirmed_at'],
      includeHeaders = true
    } = options

    const data: unknown[][] = []

    // Add headers
    if (includeHeaders) {
      const headers = fields.map(field => {
        return field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      })
      data.push(headers)
    }

    // Add data rows
    users.forEach(user => {
      const row = fields.map(field => {
        const value = getNestedValue(user, field)
        
        // Handle date formatting for Excel
        if (field.includes('_at') && value) {
          return new Date(value as string)
        }

        return value || ''
      })
      
      data.push(row)
    })

    return {
      sheetName,
      data
    }
  } catch (_error) {
    console.error('Error preparing users for Excel export')
    throw new Error('Failed to prepare users for Excel export')
  }
}

// =============================================================================
// FILTER UTILITIES
// =============================================================================

/**
 * Build filter query parameters from filter options
 * @param filters - Filter options object
 * @returns Query parameters object
 */
export function buildFilterQuery(filters: FilterOptions): Record<string, string> {
  try {
    const params: Record<string, string> = {}

    // Search term
    if (filters.search && filters.search.trim() !== '') {
      params.search = filters.search.trim()
    }

    // Status filter
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status
    }

    // Role filter
    if (filters.role && filters.role !== 'all') {
      params.role = filters.role
    }

    // Course filter
    if (filters.course && filters.course !== 'all') {
      params.course = filters.course
    }

    // Subscription filter
    if (filters.subscription && filters.subscription !== 'all') {
      params.subscription = filters.subscription
    }

    // Date range
    if (filters.dateRange.from) {
      params.from = filters.dateRange.from
    }
    if (filters.dateRange.to) {
      params.to = filters.dateRange.to
    }

    // Sort
    if (filters.sort.field && filters.sort.field !== 'created_at') {
      params.sort = filters.sort.field
    }
    if (filters.sort.direction && filters.sort.direction !== 'desc') {
      params.dir = filters.sort.direction
    }

    return params
  } catch (error) {
    console.error('Error building filter query:', error)
    return {}
  }
}

/**
 * Parse URL search parameters into filter options
 * @param searchParams - URLSearchParams object
 * @returns Filter options object
 */
export function parseSearchParams(searchParams: URLSearchParams): Partial<FilterOptions> {
  try {
    const filters: Partial<FilterOptions> = {}

    // Search term
    const search = searchParams.get('search')
    if (search) {
      filters.search = search
    }

    // Status filter
    const status = searchParams.get('status')
    if (status && ['active', 'inactive', 'unconfirmed', 'suspended'].includes(status)) {
      filters.status = status as 'active' | 'inactive' | 'unconfirmed' | 'suspended'
    }

    // Role filter
    const role = searchParams.get('role')
    if (role && Object.values(UserRole).includes(role as UserRole)) {
      filters.role = role as UserRole
    }

    // Course filter
    const course = searchParams.get('course')
    if (course) {
      filters.course = course
    }

    // Subscription filter
    const subscription = searchParams.get('subscription')
    if (subscription && ['active', 'expired', 'cancelled'].includes(subscription)) {
      filters.subscription = subscription as 'active' | 'expired' | 'cancelled'
    }

    // Date range
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    if (from || to) {
      filters.dateRange = {
        from: from || null,
        to: to || null
      }
    }

    // Sort
    const sort = searchParams.get('sort')
    const dir = searchParams.get('dir')
    if (sort || dir) {
      filters.sort = {
        field: sort || 'created_at',
        direction: (dir as 'asc' | 'desc') || 'desc'
      }
    }

    return filters
  } catch (_error) {
    console.error('Error parsing search parameters')
    return {}
  }
}

/**
 * Generate search query string from filters
 * @param filters - Filter options
 * @returns URL search string
 */
export function filtersToSearchString(filters: Partial<FilterOptions>): string {
  try {
    const params = new URLSearchParams()

    Object.entries(buildFilterQuery(filters as FilterOptions)).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value)
      }
    })

    const searchString = params.toString()
    return searchString ? `?${searchString}` : ''
  } catch (error) {
    console.error('Error converting filters to search string:', error)
    return ''
  }
}

// =============================================================================
// HELPER UTILITIES
// =============================================================================

/**
 * Get nested value from object using dot notation
 * @param obj - Object to search
 * @param path - Dot notation path (e.g., 'user.admin_user.role')
 * @returns Value at path or undefined
 */
function getNestedValue(obj: any, path: string): any {
  try {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  } catch (error) {
    return undefined
  }
}

/**
 * Sanitize string for CSV export
 * @param value - Value to sanitize
 * @returns Sanitized string
 */
export function sanitizeForCSV(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const stringValue = String(value)
  
  // Remove or replace potentially problematic characters
  return stringValue
    .replace(/[\r\n]+/g, ' ') // Replace line breaks with spaces
    .replace(/"/g, '""') // Escape quotes
    .trim()
}

/**
 * Debounce function for search inputs
 * @param func - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Generate a secure random password
 * @param length - Password length (default: 12)
 * @returns Generated password
 */
export function generateSecurePassword(length: number = 12): string {
  try {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    
    // Ensure at least one character from each required set
    const required = [
      'abcdefghijklmnopqrstuvwxyz',
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      '0123456789',
      '!@#$%^&*'
    ]
    
    required.forEach(set => {
      password += set.charAt(Math.floor(Math.random() * set.length))
    })
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  } catch (error) {
    console.error('Error generating secure password:', error)
    // Fallback password generation
    return Math.random().toString(36).slice(-12) + 'A1!'
  }
}