/**
 * Admin Authentication Utilities
 * Provides role-based access control for admin operations
 */

import { createSupabaseClient } from '@/utils/supabase/client';

/**
 * Check if a user has admin privileges
 */
export async function isValidAdmin(userId: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();

    // Get user profile with role information
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    // Check if user has admin or super_admin role
    return profile.role === 'admin' || profile.role === 'super_admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Check if a user has specific permissions
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();

    // Get user profile with permissions
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role, permissions')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return false;
    }

    // Super admin has all permissions
    if (profile.role === 'super_admin') {
      return true;
    }

    // Admin has most permissions
    if (profile.role === 'admin') {
      const restrictedPermissions = ['super_admin_only', 'delete_all_data'];
      return !restrictedPermissions.includes(permission);
    }

    // Check specific permissions array
    if (profile.permissions && Array.isArray(profile.permissions)) {
      return profile.permissions.includes(permission);
    }

    return false;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
}

/**
 * Get user role information
 */
export async function getUserRole(userId: string): Promise<string | null> {
  try {
    const supabase = createSupabaseClient();

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return null;
    }

    return profile.role;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
}