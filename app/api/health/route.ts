import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest } from "next/server";
import {
  checkDatabaseSetup,
  checkFunctionExists,
  testDatabaseConnection,
  testFunctionExecution
} from "@/utils/database/migration-checker";

export const runtime = 'nodejs';
export const maxDuration = 30;

// Cache health data for 30 seconds to reduce database load
let healthCache: { data: any; timestamp: number } | null = null;
const CACHE_DURATION = 30 * 1000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Check cache first
    if (healthCache && (Date.now() - healthCache.timestamp) < CACHE_DURATION) {
      return Response.json(healthCache.data, { 
        status: healthCache.data.status === 'healthy' ? 200 : 503,
        headers: {
          'Cache-Control': 'public, max-age=30',
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Check database connectivity using admin client
    const supabase = createAdminClient();

    // Check database connectivity
    const { connected, error: dbConnErr } = await testDatabaseConnection();
    const dbConnected = connected;

    // Check database setup status
    const setupResult = dbConnected ? await checkDatabaseSetup() : null;
    const functionTest = dbConnected ? await testFunctionExecution('get_user_dashboard_data') : null;
    
    // Build system health response
    const isHealthy = dbConnected && setupResult?.overall_status === 'healthy';
    const hasSetupIssues = setupResult?.overall_status === 'unhealthy' || setupResult?.overall_status === 'partial';

    const systemHealth = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      components: {
        database: {
          status: dbConnected ? (setupResult?.overall_status === 'healthy' ? 'healthy' : 'warning') : 'error',
          connected: dbConnected,
          error: dbConnErr,
          overall_status: setupResult?.overall_status || 'unknown',
          function_status: setupResult?.function_status || { exists: false },
          table_status: setupResult?.table_status || { exists: false, missing: [] },
          function_test: functionTest
        },
        migrations: {
          status: setupResult?.missing_migrations?.length === 0 ? 'complete' : 'incomplete',
          missing_items: setupResult?.missing_migrations || []
        }
      },
      setup_required: hasSetupIssues,
      setup_instructions: hasSetupIssues ? {
        message: 'Database setup incomplete - run migration script',
        steps: [
          'chmod +x scripts/setup-database-complete.sh',
          './scripts/setup-database-complete.sh',
          'curl http://localhost:3000/api/health'
        ],
        documentation: 'See DATABASE_SETUP_GUIDE.md for troubleshooting'
      } : null
    };

    // Set 503 status when critical functions are missing
    const isCriticalFunctionMissing = !setupResult?.function_status?.exists || !functionTest?.success;

    const httpStatus = systemHealth.status === 'healthy' ? 200 :
                      isCriticalFunctionMissing ? 503 :
                      502; // Other degraded states
    
    // Update cache
    healthCache = {
      data: systemHealth,
      timestamp: Date.now()
    };
    
    return Response.json(systemHealth, { 
      status: httpStatus,
      headers: {
        'Cache-Control': 'public, max-age=30',
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Health check failed:', error);
    
    return Response.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      components: {
        database: { status: 'error' },
        agents: { status: 'error' },
        performance: { status: 'error' }
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json'
      }
    });
  }
}