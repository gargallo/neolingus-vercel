// Migration checker utility for validating database setup
// Validates critical functions and tables for Neolingus Academy

import { createSupabaseClient } from '@/utils/supabase/server';

interface MigrationStatus {
  status: 'complete' | 'incomplete' | 'error';
  missing_items: string[];
  error_details?: string;
}

interface FunctionCheckResult {
  exists: boolean;
  error?: string;
}

interface TableCheckResult {
  exists: boolean;
  missing: string[];
}

interface DatabaseSetupResult {
  overall_status: 'healthy' | 'partial' | 'unhealthy';
  function_status: FunctionCheckResult;
  table_status: TableCheckResult;
  missing_migrations: string[];
}

/**
 * Check if the critical get_user_dashboard_data function exists
 * @param functionName - The name of the function to check (defaults to 'get_user_dashboard_data')
 * @returns Promise<FunctionCheckResult>
 */
export async function checkFunctionExists(functionName: string = 'get_user_dashboard_data'): Promise<FunctionCheckResult> {
  try {
    const supabase = await createSupabaseClient();

    // Comment 3: Use the new fn_exists introspection function
    const { data: fnData, error: fnError } = await supabase.rpc('fn_exists', { p_name: functionName });

    if (fnError) {
      // Fallback to original method if introspection function isn't available
      console.warn('Introspection function not available, falling back to direct function call');

      const { data, error } = await supabase.rpc(functionName, {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });

      if (error) {
        if (error.code === 'PGRST202' || error.message.includes('Could not find the function')) {
          return { exists: false, error: 'Function not found (PGRST202)' };
        }
        return { exists: true, error: error.message };
      }

      return { exists: true };
    }

    // Function existence check using introspection
    return { exists: !!fnData };
  } catch (error) {
    console.error(`Exception checking function ${functionName}:`, error);
    return {
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if critical database tables exist using introspection function
 * @param tableNames - Array of table names to check
 * @returns Promise<TableCheckResult>
 */
export async function checkTablesExist(tableNames: string[] = [
  'user_analytics',
  'dashboard_widgets',
  'courses',
  'user_course_enrollments',
  'plans'
]): Promise<TableCheckResult> {
  try {
    const supabase = await createSupabaseClient();

    // Comment 3: Use the new missing_tables introspection function
    const { data: missing, error } = await supabase.rpc('missing_tables', { p_names: tableNames });

    if (error) {
      // Fallback to original method if introspection function isn't available
      console.warn('Introspection function not available, falling back to direct queries');
      const missingTables: string[] = [];

      for (const tableName of tableNames) {
        try {
          const { error } = await supabase
            .from(tableName)
            .select('id', { count: 'exact', head: true })
            .limit(1);

          if (error && (error.code === 'PGRST106' || error.message.includes('does not exist'))) {
            missingTables.push(tableName);
          }
        } catch (error) {
          missingTables.push(tableName);
        }
      }

      return {
        exists: missingTables.length === 0,
        missing: missingTables
      };
    }

    const missingTableNames = (missing || []).map((item: any) => item.name);

    return {
      exists: missingTableNames.length === 0,
      missing: missingTableNames
    };
  } catch (error) {
    console.error('Error checking tables exist:', error);
    return {
      exists: false,
      missing: tableNames // Assume all missing on error
    };
  }
}

/**
 * Perform comprehensive database setup check
 * @returns Promise<DatabaseSetupResult>
 */
export async function checkDatabaseSetup(): Promise<DatabaseSetupResult> {
  try {
    // Check the critical function
    const functionStatus = await checkFunctionExists('get_user_dashboard_data');

    // Check critical tables
    const tableStatus = await checkTablesExist();

    // Determine missing migrations
    const missing_migrations: string[] = [];

    if (!functionStatus.exists) {
      missing_migrations.push('get_user_dashboard_data');
    }

    if (!tableStatus.exists) {
      missing_migrations.push(...tableStatus.missing);
    }

    // Determine overall status
    let overall_status: 'healthy' | 'partial' | 'unhealthy';

    if (functionStatus.exists && tableStatus.exists) {
      overall_status = 'healthy';
    } else if (functionStatus.exists || tableStatus.missing.length < tableStatus.missing.length) {
      overall_status = 'partial';
    } else {
      overall_status = 'unhealthy';
    }

    return {
      overall_status,
      function_status: functionStatus,
      table_status: tableStatus,
      missing_migrations
    };
  } catch (error) {
    return {
      overall_status: 'unhealthy',
      function_status: {
        exists: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      table_status: { exists: false, missing: [] },
      missing_migrations: ['database_connection_failed']
    };
  }
}

/**
 * Test connection to Supabase database
 * @returns Promise<{ connected: boolean, error?: string }>
 */
export async function testDatabaseConnection(): Promise<{ connected: boolean, error?: string }> {
  try {
    const supabase = await createSupabaseClient();

    // Try a simple query that should always work
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
      return { connected: false, error: error.message };
    }

    return { connected: true };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

/**
 * Legacy function compatibility - returns simple migration status
 * @returns Promise<MigrationStatus>
 */
export async function checkMigrationStatus(): Promise<MigrationStatus> {
  try {
    const setupResult = await checkDatabaseSetup();

    let status: 'complete' | 'incomplete' | 'error';

    if (setupResult.overall_status === 'healthy') {
      status = 'complete';
    } else if (setupResult.overall_status === 'partial') {
      status = 'incomplete';
    } else {
      status = 'error';
    }

    return {
      status,
      missing_items: setupResult.missing_migrations,
      error_details: setupResult.function_status.error
    };
  } catch (error) {
    return {
      status: 'error',
      missing_items: ['database_check_failed'],
      error_details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test specific function execution
 * @param functionName - Name of function to test
 * @returns Promise<{ success: boolean, error?: string }>
 */
export async function testFunctionExecution(functionName: string = 'get_user_dashboard_data'): Promise<{ success: boolean, error?: string }> {
  const result = await checkFunctionExists(functionName);

  if (!result.exists) {
    return { success: false, error: result.error || 'Function does not exist' };
  }

  if (result.error) {
    return { success: false, error: result.error };
  }

  return { success: true };
}