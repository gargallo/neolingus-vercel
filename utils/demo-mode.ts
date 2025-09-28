/**
 * Demo Mode Detection Utility
 * 
 * Provides utilities to detect when the application is running in demo mode,
 * allowing users to test functionality without authentication setup.
 */

/**
 * Checks if the application is running in demo mode
 * Demo mode can be enabled through:
 * 1. DEMO_MODE=true environment variable
 * 2. ?demo=true URL parameter
 * 3. demo=true in localStorage (for persistent demo mode in browser)
 */
export function isDemoMode(searchParams?: URLSearchParams): boolean {
  // Check environment variable first
  if (process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return true;
  }
  
  // Check URL parameter (server-side safe)
  if (searchParams?.get('demo') === 'true') {
    return true;
  }
  
  // Check localStorage (client-side only)
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('demo_mode') === 'true';
    } catch (e) {
      // Ignore localStorage errors
    }
  }
  
  return false;
}

/**
 * Server-side demo mode detection for middleware
 * Only checks environment variables and URL parameters
 */
export function isServerSideDemoMode(url?: string): boolean {
  // Check environment variable
  if (process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true') {
    return true;
  }
  
  // Check URL parameter if URL is provided
  if (url) {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get('demo') === 'true';
    } catch (e) {
      // Invalid URL, ignore
    }
  }
  
  return false;
}

/**
 * Enable demo mode in localStorage (client-side only)
 */
export function enableDemoMode(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('demo_mode', 'true');
    } catch (e) {
      console.warn('Could not enable demo mode in localStorage:', e);
    }
  }
}

/**
 * Disable demo mode in localStorage (client-side only)
 */
export function disableDemoMode(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('demo_mode');
    } catch (e) {
      console.warn('Could not disable demo mode in localStorage:', e);
    }
  }
}

/**
 * Get demo mode configuration
 */
export function getDemoModeInfo() {
  const envEnabled = process.env.DEMO_MODE === 'true' || process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const localStorageEnabled = typeof window !== 'undefined' ? 
    localStorage.getItem('demo_mode') === 'true' : false;
  
  return {
    envEnabled,
    localStorageEnabled,
    isActive: envEnabled || localStorageEnabled
  };
}