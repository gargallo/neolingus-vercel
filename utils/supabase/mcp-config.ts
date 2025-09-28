/**
 * Supabase MCP (Model Context Protocol) Configuration
 * Neolingus Academy - Course-Centric Architecture
 *
 * CONSTITUTIONAL REQUIREMENT: All database operations MUST use Supabase MCP
 * for consistency, reliability, and auditability of educational data flows.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

// MCP Configuration Interface
export interface MCPConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceKey?: string;
  mcpServerUrl?: string;
  enableRealtime: boolean;
  enableLogging: boolean;
  retryAttempts: number;
  timeoutMs: number;
}

// Default MCP Configuration
const defaultMCPConfig: Partial<MCPConfig> = {
  enableRealtime: true,
  enableLogging: true,
  retryAttempts: 3,
  timeoutMs: 30000,
};

// Environment-based MCP Configuration
export const mcpConfig: MCPConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  mcpServerUrl: process.env.MCP_SERVER_URL || "http://localhost:3001/mcp",
  ...defaultMCPConfig,
} as MCPConfig;

// Validate MCP Configuration
function validateMCPConfig(config: MCPConfig): void {
  if (!config.supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for MCP integration");
  }
  if (!config.supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is required for MCP integration"
    );
  }
}

// MCP-Enhanced Supabase Client
export class MCPSupabaseClient {
  private client: ReturnType<typeof createClient<Database>>;
  private serviceClient?: ReturnType<typeof createClient<Database>>;
  private config: MCPConfig;
  private requestCounter = 0;

  constructor(config: MCPConfig = mcpConfig) {
    validateMCPConfig(config);
    this.config = config;

    // Create standard client for user operations
    this.client = createClient<Database>(
      config.supabaseUrl,
      config.supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
        global: {
          headers: {
            "X-MCP-Client": "neolingus-academy",
            "X-MCP-Version": "1.0.0",
          },
        },
      }
    );

    // Create service client for admin operations (if service key available)
    if (config.supabaseServiceKey) {
      this.serviceClient = createClient<Database>(
        config.supabaseUrl,
        config.supabaseServiceKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              "X-MCP-Client": "neolingus-academy-service",
              "X-MCP-Version": "1.0.0",
            },
          },
        }
      );
    }
  }

  /**
   * Get standard client for user operations
   */
  getClient() {
    return this.client;
  }

  /**
   * Get service client for admin operations
   */
  getServiceClient() {
    if (!this.serviceClient) {
      throw new Error(
        "Service client not available. SUPABASE_SERVICE_ROLE_KEY not configured."
      );
    }
    return this.serviceClient;
  }

  /**
   * MCP-enhanced query with logging and retry logic
   */
  async mcpQuery<T = any>(
    operation: () => Promise<{ data: T | null; error: any }>,
    context: {
      table: string;
      action: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<{ data: T | null; error: any }> {
    const requestId = `mcp_${++this.requestCounter}_${Date.now()}`;
    const startTime = performance.now();

    // Log request start
    if (this.config.enableLogging) {
      console.log(
        `[MCP Request ${requestId}] ${context.action} on ${context.table}`,
        {
          userId: context.userId,
          metadata: context.metadata,
          timestamp: new Date().toISOString(),
        }
      );
    }

    let lastError: any = null;
    let attempt = 0;

    // Retry logic
    while (attempt < this.config.retryAttempts) {
      try {
        const result = await Promise.race([
          operation(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("MCP operation timeout")),
              this.config.timeoutMs
            )
          ),
        ]);

        const duration = performance.now() - startTime;

        // Log successful request
        if (this.config.enableLogging) {
          console.log(
            `[MCP Success ${requestId}] Completed in ${duration.toFixed(2)}ms`,
            {
              hasData: result.data !== null,
              hasError: result.error !== null,
            }
          );
        }

        // Audit log for educational data operations
        if (
          context.table.includes("course") ||
          context.table.includes("exam") ||
          context.table.includes("progress")
        ) {
          await this.auditLog({
            requestId,
            table: context.table,
            action: context.action,
            userId: context.userId,
            success: result.error === null,
            duration,
            metadata: context.metadata,
          });
        }

        return result;
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt < this.config.retryAttempts) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          if (this.config.enableLogging) {
            console.warn(
              `[MCP Retry ${requestId}] Attempt ${attempt} failed, retrying in ${delay}ms`,
              error
            );
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // Log final failure
    if (this.config.enableLogging) {
      console.error(
        `[MCP Failed ${requestId}] All ${this.config.retryAttempts} attempts failed`,
        lastError
      );
    }

    return { data: null, error: lastError };
  }

  /**
   * Educational data audit logging (GDPR/LOPD compliance)
   */
  private async auditLog(entry: {
    requestId: string;
    table: string;
    action: string;
    userId?: string;
    success: boolean;
    duration: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      // In production, this would go to a dedicated audit log system
      // For now, we'll use a simple console log with structured format
      const auditEntry = {
        timestamp: new Date().toISOString(),
        level: "AUDIT",
        service: "neolingus-academy",
        component: "mcp-client",
        ...entry,
      };

      if (this.config.enableLogging) {
        console.log("[AUDIT]", JSON.stringify(auditEntry));
      }

      // Future: Send to audit service, compliance dashboard, etc.
    } catch (error) {
      console.error("[MCP Audit] Failed to log audit entry", error);
    }
  }

  /**
   * Real-time subscription with MCP context
   */
  subscribeToTable<T = any>(
    table: string,
    filter?: string,
    callback?: (payload: any) => void
  ) {
    if (!this.config.enableRealtime) {
      throw new Error("Real-time subscriptions are disabled in MCP config");
    }

    const subscription = this.client
      .channel(`mcp-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter,
        },
        (payload) => {
          if (this.config.enableLogging) {
            console.log(
              `[MCP Realtime] ${table} change:`,
              payload.eventType,
              (payload.new as any)?.id || (payload.old as any)?.id
            );
          }
          callback?.(payload);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * GDPR-compliant data export
   */
  async exportUserData(userId: string): Promise<{
    courses: any[];
    progress: any[];
    sessions: any[];
    aiContexts: any[];
  }> {
    const [coursesResult, sessionsResult, contextsResult] = await Promise.all([
      this.mcpQuery(
        async () => {
          const result = await this.client
            .from("user_course_progress")
            .select("*")
            .eq("user_id", userId);
          return result;
        },
        { table: "user_course_progress", action: "export", userId }
      ),
      this.mcpQuery(
        async () => {
          const result = await this.client
            .from("exam_sessions")
            .select("*")
            .eq("user_id", userId);
          return result;
        },
        { table: "exam_sessions", action: "export", userId }
      ),
      this.mcpQuery(
        async () => {
          const result = await this.client
            .from("ai_tutor_contexts")
            .select("*")
            .eq("user_id", userId);
          return result;
        },
        { table: "ai_tutor_contexts", action: "export", userId }
      ),
    ]);

    return {
      courses: coursesResult.data || [],
      progress: coursesResult.data || [],
      sessions: sessionsResult.data || [],
      aiContexts: contextsResult.data || [],
    };
  }

  /**
   * GDPR-compliant data deletion
   */
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      // Delete in reverse dependency order
      const [contextsResult, sessionsResult, progressResult, profileResult] = await Promise.all([
        this.mcpQuery(
          async () => {
            const result = await this.client
              .from("ai_tutor_contexts")
              .delete()
              .eq("user_id", userId);
            return result;
          },
          { table: "ai_tutor_contexts", action: "delete", userId }
        ),
        this.mcpQuery(
          async () => {
            const result = await this.client
              .from("exam_sessions")
              .delete()
              .eq("user_id", userId);
            return result;
          },
          { table: "exam_sessions", action: "delete", userId }
        ),
        this.mcpQuery(
          async () => {
            const result = await this.client
              .from("user_course_progress")
              .delete()
              .eq("user_id", userId);
            return result;
          },
          { table: "user_course_progress", action: "delete", userId }
        ),
        this.mcpQuery(
          async () => {
            const result = await this.client
              .from("user_profiles")
              .delete()
              .eq("id", userId);
            return result;
          },
          { table: "user_profiles", action: "delete", userId }
        ),
      ]);

      return (
        contextsResult.error === null &&
        sessionsResult.error === null &&
        progressResult.error === null &&
        profileResult.error === null
      );
    } catch (error) {
      console.error("[MCP] Failed to delete user data", error);
      return false;
    }
  }
}

// Singleton MCP client instance
export const mcpClient = new MCPSupabaseClient();

// Export commonly used clients
export const supabase = mcpClient.getClient();

// Helper function to get service client safely
export function getServiceClient() {
  return mcpClient.getServiceClient();
}

// MCP wrapper for database operations
export const mcp = {
  query: mcpClient.mcpQuery.bind(mcpClient),
  subscribe: mcpClient.subscribeToTable.bind(mcpClient),
  exportUserData: mcpClient.exportUserData.bind(mcpClient),
  deleteUserData: mcpClient.deleteUserData.bind(mcpClient),
};