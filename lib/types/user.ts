/**
 * Simplified User Types for Authentication Context
 */

export interface User {
  id: string;
  email: string;
  displayName?: string;
  full_name?: string;
  preferred_language?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
  last_active?: string;
  email_verified?: boolean;
  
  // Optional profile data
  profile?: {
    gdpr_consent?: boolean;
    lopd_consent?: boolean;
    data_retention_preference?: string;
    status?: string;
  };
}

export interface AuthUser extends User {
  isAuthenticated: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface UserSession {
  user: User;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Auth state types
export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName: string;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface UpdatePasswordCredentials {
  password: string;
  newPassword: string;
}