/**
 * Integration Tests for Scoring Engine API
 * Tests the complete flow from API requests to database operations
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createSupabaseClient } from '@/utils/supabase/client';
import { createScoringDbClient } from '@/lib/scoring/db/client';
import type { CreateScoringAttempt, ScoreRequest } from '@/lib/scoring/schemas';

// Test configuration
const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';
const TEST_TENANT_ID = 'test-tenant';

// Mock data
const TEST_WRITING_PAYLOAD = {
  text: `The advantages and disadvantages of social media have been widely debated in recent years.

On one hand, social media platforms offer numerous benefits. They connect people across geographical boundaries, allowing us to maintain relationships with friends and family members who live far away. Additionally, these platforms serve as powerful tools for sharing information quickly and efficiently. For instance, during natural disasters or emergencies, social media can be invaluable for coordinating rescue efforts and keeping people informed about safety measures.

Furthermore, social media has democratized access to information and given voice to previously marginalized groups. Small businesses can now reach global audiences without significant marketing budgets, and individuals can build personal brands and pursue entrepreneurial opportunities that were previously unavailable to them.

However, there are significant drawbacks to consider. The spread of misinformation has become a major concern, as false information can go viral just as quickly as factual content. This has led to the erosion of trust in traditional media sources and has contributed to political polarization in many countries.

Privacy concerns also plague social media platforms. Users often sacrifice personal data in exchange for free services, and this data can be used in ways that individuals may not fully understand or consent to. Additionally, the addictive nature of social media can lead to mental health issues, particularly among young people who may develop unrealistic expectations based on the curated content they see online.

In conclusion, while social media has revolutionized communication and created new opportunities, we must be mindful of its potential negative impacts and work to mitigate them through education, regulation, and responsible usage practices.`,
  prompt: 'Write an essay discussing the advantages and disadvantages of social media. Your essay should be approximately 300 words and include specific examples to support your arguments.',
  task_type: 'essay' as const,
  word_limit: 300
};

const TEST_SCORE_REQUEST: ScoreRequest = {
  provider: 'EOI',
  level: 'B2',
  task: 'writing',
  payload: TEST_WRITING_PAYLOAD,
  user_id: TEST_USER_ID
};

describe('Scoring Engine API Integration Tests', () => {
  let supabase: ReturnType<typeof createSupabaseClient>;
  let scoringDb: ReturnType<typeof createScoringDbClient>;

  beforeAll(async () => {
    // Initialize clients
    supabase = createSupabaseClient();
    scoringDb = createScoringDbClient();

    // Verify test environment
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.warn('No authenticated user - some tests may fail');
    }
  });

  beforeEach(async () => {
    // Clean up any test data before each test
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up after all tests
    await cleanupTestData();
  });

  async function cleanupTestData() {
    try {
      // Delete test attempts (this will cascade to events)
      const { error } = await supabase
        .from('scoring_attempts')
        .delete()
        .eq('tenant_id', TEST_TENANT_ID);

      if (error && !error.message.includes('0 rows')) {
        console.warn('Cleanup warning:', error.message);
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  describe('Database Operations', () => {
    it('should retrieve active rubrics', async () => {
      const result = await scoringDb.rubrics.getActiveRubric('EOI', 'B2', 'writing');

      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.provider).toBe('EOI');
        expect(result.data!.level).toBe('B2');
        expect(result.data!.task).toBe('writing');
        expect(result.data!.is_active).toBe(true);
      } else {
        console.warn('No active rubric found - this may indicate missing seed data');
      }
    });

    it('should create a scoring attempt', async () => {
      const attemptData: CreateScoringAttempt = {
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        provider: 'EOI',
        level: 'B2',
        task: 'writing',
        payload: TEST_WRITING_PAYLOAD
      };

      const result = await scoringDb.attempts.createAttempt(attemptData);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.id).toBeDefined();
        expect(result.data!.status).toBe('queued');
        expect(result.data!.tenant_id).toBe(TEST_TENANT_ID);
        expect(result.data!.provider).toBe('EOI');
      }
    });

    it('should retrieve scoring attempts by filters', async () => {
      // First create a test attempt
      const attemptData: CreateScoringAttempt = {
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        provider: 'EOI',
        level: 'B2',
        task: 'writing',
        payload: TEST_WRITING_PAYLOAD
      };

      const createResult = await scoringDb.attempts.createAttempt(attemptData);
      expect(createResult.success).toBe(true);

      // Now retrieve with filters
      const result = await scoringDb.attempts.getAttempts({
        provider: 'EOI',
        level: 'B2',
        task: 'writing',
        user_id: TEST_USER_ID
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.length).toBeGreaterThan(0);
        expect(result.data![0].provider).toBe('EOI');
      }
    });

    it('should update attempt status', async () => {
      // Create attempt
      const attemptData: CreateScoringAttempt = {
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        provider: 'EOI',
        level: 'B2',
        task: 'writing',
        payload: TEST_WRITING_PAYLOAD
      };

      const createResult = await scoringDb.attempts.createAttempt(attemptData);
      expect(createResult.success).toBe(true);

      const attemptId = createResult.data!.id;

      // Update status
      const updateResult = await scoringDb.attempts.updateAttemptStatus(
        attemptId,
        'processing'
      );

      expect(updateResult.success).toBe(true);
      if (updateResult.success) {
        expect(updateResult.data!.status).toBe('processing');
      }
    });

    it('should retrieve attempt events', async () => {
      // Create attempt (this should automatically create a 'created' event)
      const attemptData: CreateScoringAttempt = {
        tenant_id: TEST_TENANT_ID,
        user_id: TEST_USER_ID,
        provider: 'EOI',
        level: 'B2',
        task: 'writing',
        payload: TEST_WRITING_PAYLOAD
      };

      const createResult = await scoringDb.attempts.createAttempt(attemptData);
      expect(createResult.success).toBe(true);

      const attemptId = createResult.data!.id;

      // Retrieve events
      const eventsResult = await scoringDb.events.getAttemptEvents(attemptId);

      expect(eventsResult.success).toBe(true);
      if (eventsResult.success) {
        expect(eventsResult.data).toBeDefined();
        expect(eventsResult.data!.length).toBeGreaterThan(0);
        expect(eventsResult.data![0].type).toBe('created');
      }
    });
  });

  describe('Scoring Settings', () => {
    it('should retrieve tenant settings', async () => {
      const result = await scoringDb.settings.getSettings(TEST_TENANT_ID);

      // Settings might not exist for test tenant, which is okay
      if (result.success) {
        expect(result.data).toBeDefined();
        expect(result.data!.tenant_id).toBe(TEST_TENANT_ID);
      } else {
        expect(result.error).toContain('not found');
      }
    });

    it('should create/update tenant settings', async () => {
      const testSettings = {
        defaults: {
          model_name: 'gpt-4o-mini',
          timeout: 60000,
          retries: 2,
          quality_threshold: 0.8
        },
        weights: {
          EOI: { writing: 1.0, speaking: 1.0 }
        },
        equivalences: {
          test_scale: { min: 0, max: 100 }
        }
      };

      const result = await scoringDb.settings.updateSettings(TEST_TENANT_ID, testSettings);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data!.tenant_id).toBe(TEST_TENANT_ID);
        expect(result.data!.defaults.model_name).toBe('gpt-4o-mini');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid rubric requests gracefully', async () => {
      const result = await scoringDb.rubrics.getActiveRubric('INVALID' as any, 'B2', 'writing');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle attempt creation with invalid data', async () => {
      const invalidData: any = {
        tenant_id: TEST_TENANT_ID,
        provider: 'INVALID',
        level: 'B2',
        task: 'writing',
        payload: {}
      };

      const result = await scoringDb.attempts.createAttempt(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-existent attempt retrieval', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000999';
      const result = await scoringDb.attempts.getAttempt(fakeId);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('Validation', () => {
    it('should validate scoring request schema', async () => {
      const { validateScoreRequest } = await import('@/lib/scoring/schemas');

      const validRequest = TEST_SCORE_REQUEST;
      const validResult = validateScoreRequest(validRequest);
      expect(validResult.success).toBe(true);

      const invalidRequest = { ...TEST_SCORE_REQUEST, provider: 'INVALID' };
      const invalidResult = validateScoreRequest(invalidRequest);
      expect(invalidResult.success).toBe(false);
    });

    it('should validate rubric JSON schema', async () => {
      const { validateRubric } = await import('@/lib/scoring/schemas');

      const validRubric = {
        version: 'TEST-v1',
        provider: 'EOI',
        level: 'B2',
        task: 'writing',
        criteria: [
          {
            id: 'content',
            name: 'Content',
            description: 'Quality of content',
            weight: 1.0,
            bands: [
              { score: 1, descriptor: 'Basic' },
              { score: 2, descriptor: 'Good' }
            ]
          }
        ],
        total_score: { min: 1, max: 2 }
      };

      const result = validateRubric(validRubric);
      expect(result.success).toBe(true);
    });
  });
});

// Utility function to check if database is accessible
export async function isDatabaseAccessible(): Promise<boolean> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from('scoring_rubrics').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
}

// Utility function to check if scoring engine is healthy
export async function isScoringEngineHealthy(): Promise<boolean> {
  try {
    const response = await fetch('/api/v1/score/health', { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}