/**
 * Supabase Client Utilities for Scoring Engine
 * Provides database operations with proper error handling and type safety
 */

import { createSupabaseClient } from '@/utils/supabase/client';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import type {
  ScoringRubric,
  CreateRubric,
  ScoringAttempt,
  CreateScoringAttempt,
  ScoringCorrector,
  CreateCorrector,
  ScoringWebhook,
  CreateWebhook,
  ScoringSettings,
  ScoringAttemptEvent,
  ScoringProvider,
  CEFRLevel,
  TaskType,
  AttemptStatus
} from '../schemas';

// Database operation result type
export type DbResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Pagination parameters
export type PaginationParams = {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
};

// Filter parameters for attempts
export type AttemptFilters = {
  provider?: ScoringProvider;
  level?: CEFRLevel;
  task?: TaskType;
  status?: AttemptStatus;
  user_id?: string;
  exam_session_id?: string;
  created_after?: Date;
  created_before?: Date;
};

/**
 * Scoring Rubrics Database Operations
 */
export class ScoringRubricsDb {
  constructor(private supabase: ReturnType<typeof createSupabaseClient>) {}

  async getActiveRubric(
    provider: ScoringProvider,
    level: CEFRLevel,
    task: TaskType
  ): Promise<DbResult<ScoringRubric>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_rubrics')
        .select('*')
        .eq('provider', provider)
        .eq('level', level)
        .eq('task', task)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringRubric };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting active rubric'
      };
    }
  }

  async getAllRubrics(
    filters?: { provider?: ScoringProvider; level?: CEFRLevel; task?: TaskType; active_only?: boolean },
    pagination?: PaginationParams
  ): Promise<DbResult<ScoringRubric[]>> {
    try {
      let query = this.supabase.from('scoring_rubrics').select('*');

      // Apply filters
      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.task) {
        query = query.eq('task', filters.task);
      }
      if (filters?.active_only !== false) {
        query = query.eq('is_active', true);
      }

      // Apply pagination and sorting
      if (pagination?.sort_by) {
        query = query.order(pagination.sort_by, {
          ascending: pagination.sort_order !== 'desc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (pagination?.page && pagination?.limit) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringRubric[] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting rubrics'
      };
    }
  }

  async createRubric(rubric: CreateRubric): Promise<DbResult<ScoringRubric>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_rubrics')
        .insert(rubric)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringRubric };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error creating rubric'
      };
    }
  }

  async updateRubric(id: string, updates: Partial<CreateRubric>): Promise<DbResult<ScoringRubric>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_rubrics')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringRubric };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error updating rubric'
      };
    }
  }

  async archiveRubric(id: string): Promise<DbResult<boolean>> {
    try {
      const { error } = await this.supabase
        .from('scoring_rubrics')
        .update({
          is_active: false,
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error archiving rubric'
      };
    }
  }
}

/**
 * Scoring Attempts Database Operations
 */
export class ScoringAttemptsDb {
  constructor(private supabase: ReturnType<typeof createSupabaseClient>) {}

  async createAttempt(attempt: CreateScoringAttempt): Promise<DbResult<ScoringAttempt>> {
    try {
      // Get active rubric first
      const rubricsDb = new ScoringRubricsDb(this.supabase);
      const rubricResult = await rubricsDb.getActiveRubric(
        attempt.provider,
        attempt.level,
        attempt.task
      );

      if (!rubricResult.success || !rubricResult.data) {
        return {
          success: false,
          error: `No active rubric found for ${attempt.provider}-${attempt.level}-${attempt.task}`
        };
      }

      // Create attempt with rubric reference
      const { data, error } = await this.supabase
        .from('scoring_attempts')
        .insert({
          ...attempt,
          rubric_id: rubricResult.data.id,
          rubric_ver: rubricResult.data.version,
          status: 'queued'
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringAttempt };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error creating attempt'
      };
    }
  }

  async getAttempt(id: string): Promise<DbResult<ScoringAttempt>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_attempts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringAttempt };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting attempt'
      };
    }
  }

  async getAttempts(
    filters?: AttemptFilters,
    pagination?: PaginationParams
  ): Promise<DbResult<ScoringAttempt[]>> {
    try {
      let query = this.supabase.from('scoring_attempts').select('*');

      // Apply filters
      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.task) {
        query = query.eq('task', filters.task);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.exam_session_id) {
        query = query.eq('exam_session_id', filters.exam_session_id);
      }
      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after.toISOString());
      }
      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before.toISOString());
      }

      // Apply pagination and sorting
      if (pagination?.sort_by) {
        query = query.order(pagination.sort_by, {
          ascending: pagination.sort_order !== 'desc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      if (pagination?.page && pagination?.limit) {
        const offset = (pagination.page - 1) * pagination.limit;
        query = query.range(offset, offset + pagination.limit - 1);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringAttempt[] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting attempts'
      };
    }
  }

  async updateAttemptStatus(
    id: string,
    status: AttemptStatus,
    updates?: Partial<Pick<ScoringAttempt, 'score_json' | 'qc_json'>>
  ): Promise<DbResult<ScoringAttempt>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_attempts')
        .update({
          status,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringAttempt };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error updating attempt status'
      };
    }
  }

  async getAttemptsBySession(sessionId: string): Promise<DbResult<ScoringAttempt[]>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_attempts')
        .select('*')
        .eq('exam_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringAttempt[] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting session attempts'
      };
    }
  }
}

/**
 * Scoring Events Database Operations
 */
export class ScoringEventsDb {
  constructor(private supabase: ReturnType<typeof createSupabaseClient>) {}

  async getAttemptEvents(attemptId: string): Promise<DbResult<ScoringAttemptEvent[]>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_attempt_events')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('at', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringAttemptEvent[] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting attempt events'
      };
    }
  }
}

/**
 * Scoring Correctors Database Operations
 */
export class ScoringCorrectorsDb {
  constructor(private supabase: ReturnType<typeof createSupabaseClient>) {}

  async getActiveCorrector(
    provider: ScoringProvider,
    level: CEFRLevel,
    task: TaskType
  ): Promise<DbResult<ScoringCorrector>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_correctors')
        .select('*')
        .eq('provider', provider)
        .eq('level', level)
        .eq('task', task)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringCorrector };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting active corrector'
      };
    }
  }

  async getAllCorrectors(
    filters?: { provider?: ScoringProvider; level?: CEFRLevel; task?: TaskType; active_only?: boolean }
  ): Promise<DbResult<ScoringCorrector[]>> {
    try {
      let query = this.supabase.from('scoring_correctors').select('*');

      if (filters?.provider) {
        query = query.eq('provider', filters.provider);
      }
      if (filters?.level) {
        query = query.eq('level', filters.level);
      }
      if (filters?.task) {
        query = query.eq('task', filters.task);
      }
      if (filters?.active_only !== false) {
        query = query.eq('active', true);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringCorrector[] };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting correctors'
      };
    }
  }

  async createCorrector(corrector: CreateCorrector): Promise<DbResult<ScoringCorrector>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_correctors')
        .insert(corrector)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringCorrector };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error creating corrector'
      };
    }
  }
}

/**
 * Scoring Settings Database Operations
 */
export class ScoringSettingsDb {
  constructor(private supabase: ReturnType<typeof createSupabaseClient>) {}

  async getSettings(tenantId: string): Promise<DbResult<ScoringSettings>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringSettings };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error getting settings'
      };
    }
  }

  async updateSettings(tenantId: string, settings: Partial<ScoringSettings>): Promise<DbResult<ScoringSettings>> {
    try {
      const { data, error } = await this.supabase
        .from('scoring_settings')
        .upsert({
          tenant_id: tenantId,
          ...settings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data as ScoringSettings };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error updating settings'
      };
    }
  }
}

/**
 * Main Scoring Database Client
 * Provides unified access to all scoring database operations
 */
export class ScoringDb {
  public rubrics: ScoringRubricsDb;
  public attempts: ScoringAttemptsDb;
  public events: ScoringEventsDb;
  public correctors: ScoringCorrectorsDb;
  public settings: ScoringSettingsDb;

  constructor(supabase: ReturnType<typeof createSupabaseClient>) {
    this.rubrics = new ScoringRubricsDb(supabase);
    this.attempts = new ScoringAttemptsDb(supabase);
    this.events = new ScoringEventsDb(supabase);
    this.correctors = new ScoringCorrectorsDb(supabase);
    this.settings = new ScoringSettingsDb(supabase);
  }
}

// Factory functions for different contexts
export const createScoringDbClient = () => {
  return new ScoringDb(createSupabaseClient());
};

export const createScoringDbFromRequest = async (request: Request) => {
  const supabase = await createSupabaseClientFromRequest(request);
  return new ScoringDb(supabase);
};

// Helper function for RLS context setting
export const setTenantContext = async (
  supabase: ReturnType<typeof createSupabaseClient>,
  tenantId: string
) => {
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.current_tenant',
    setting_value: tenantId,
    is_local: true
  });

  if (error) {
    throw new Error(`Failed to set tenant context: ${error.message}`);
  }
};