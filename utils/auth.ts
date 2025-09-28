import { createSupabaseClient } from "@/utils/supabase/server";

/**
 * Verifies a JWT token and returns the user if valid
 * @param token - JWT token to verify
 * @returns User object if valid, null otherwise
 */
export async function verifyToken(token: string) {
  try {
    // Create Supabase client
    const supabase = await createSupabaseClient();

    // Set the session with the provided token
    await supabase.auth.setSession({
      access_token: token,
      refresh_token: '', // We only have access token from header
    });

    // Get the user with the set session
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("Error verifying token:", err);
    return null;
  }
}

/**
 * Gets the current user from the request
 * @returns User object if authenticated, null otherwise
 */
export async function getCurrentUser() {
  try {
    // Create Supabase client
    const supabase = await createSupabaseClient();

    // Get the current user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("Error getting current user:", err);
    return null;
  }
}
