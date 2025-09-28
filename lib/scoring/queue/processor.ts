/**
 * Scoring Queue Processor
 * Handles asynchronous processing of scoring attempts
 */

import { scoreAttempt } from '../pipelines';
import { createScoringDbClient } from '../db/client';
import type { ScoringAttempt } from '../schemas';

// Queue job interface
export interface ScoringJob {
  attempt_id: string;
  priority: 'low' | 'normal' | 'high';
  tenant_id: string;
  webhook_url?: string;
  retry_count?: number;
  scheduled_at?: Date;
}

// Processing result
export interface ProcessingResult {
  success: boolean;
  attempt_id: string;
  processing_time: number;
  error?: string;
}

/**
 * Scoring Queue Processor
 * Handles the actual scoring logic and database updates
 */
export class ScoringQueueProcessor {
  private scoringDb = createScoringDbClient();
  private maxRetries = 3;
  private retryDelays = [5000, 15000, 45000]; // 5s, 15s, 45s

  /**
   * Process a single scoring job
   */
  async processJob(job: ScoringJob): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(`Processing scoring job: ${job.attempt_id}`);

      // Get the scoring attempt
      const attemptResult = await this.scoringDb.attempts.getAttempt(job.attempt_id);
      if (!attemptResult.success || !attemptResult.data) {
        throw new Error(`Attempt not found: ${job.attempt_id}`);
      }

      const attempt = attemptResult.data;

      // Validate attempt is in correct status
      if (attempt.status !== 'queued') {
        console.log(`Attempt ${job.attempt_id} is not queued (status: ${attempt.status}), skipping`);
        return {
          success: true,
          attempt_id: job.attempt_id,
          processing_time: Date.now() - startTime
        };
      }

      // Update status to processing
      await this.scoringDb.attempts.updateAttemptStatus(job.attempt_id, 'processing');

      // Get the rubric
      const rubricResult = await this.scoringDb.rubrics.getActiveRubric(
        attempt.provider,
        attempt.level,
        attempt.task
      );

      if (!rubricResult.success || !rubricResult.data) {
        throw new Error(`No active rubric found for ${attempt.provider}-${attempt.level}-${attempt.task}`);
      }

      const rubric = rubricResult.data;

      // Get the corrector configuration
      const correctorResult = await this.scoringDb.correctors.getActiveCorrector(
        attempt.provider,
        attempt.level,
        attempt.task
      );

      let committee = attempt.committee;
      if (correctorResult.success && correctorResult.data) {
        committee = correctorResult.data.committee;
      }

      // Fallback to default committee if none configured
      if (!committee || committee.length === 0) {
        committee = [
          {
            provider: 'openai',
            name: 'gpt-4o-mini',
            temperature: 0,
            seed: 42,
            weight: 1
          }
        ];
      }

      // Score the attempt
      const scoringResult = await scoreAttempt(attempt, rubric, committee);

      if (!scoringResult.success) {
        throw new Error(scoringResult.error || 'Scoring failed');
      }

      // Update attempt with results
      await this.scoringDb.attempts.updateAttemptStatus(
        job.attempt_id,
        'scored',
        {
          score_json: scoringResult.score!,
          qc_json: scoringResult.qc!
        }
      );

      // Send webhook notification if configured
      if (job.webhook_url) {
        await this.sendWebhookNotification(job.webhook_url, attempt, scoringResult.score!);
      }

      const processingTime = Date.now() - startTime;
      console.log(`Successfully processed scoring job: ${job.attempt_id} in ${processingTime}ms`);

      return {
        success: true,
        attempt_id: job.attempt_id,
        processing_time: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      console.error(`Error processing scoring job ${job.attempt_id}:`, errorMessage);

      // Update attempt status to failed
      try {
        await this.scoringDb.attempts.updateAttemptStatus(job.attempt_id, 'failed');
      } catch (updateError) {
        console.error(`Failed to update attempt status to failed:`, updateError);
      }

      // Determine if we should retry
      const retryCount = job.retry_count || 0;
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.log(`Scheduling retry ${retryCount + 1}/${this.maxRetries} for attempt ${job.attempt_id}`);
        await this.scheduleRetry(job, retryCount + 1);
      }

      return {
        success: false,
        attempt_id: job.attempt_id,
        processing_time: processingTime,
        error: errorMessage
      };
    }
  }

  /**
   * Determine if an error is retryable
   */
  private shouldRetry(error: unknown): boolean {
    if (!(error instanceof Error)) return false;

    const retryableErrors = [
      'timeout',
      'network',
      'rate limit',
      'service unavailable',
      'temporary',
      'ECONNRESET',
      'ETIMEDOUT'
    ];

    return retryableErrors.some(pattern =>
      error.message.toLowerCase().includes(pattern)
    );
  }

  /**
   * Schedule a retry for a failed job
   */
  private async scheduleRetry(job: ScoringJob, retryCount: number): Promise<void> {
    const delay = this.retryDelays[Math.min(retryCount - 1, this.retryDelays.length - 1)];
    const scheduledAt = new Date(Date.now() + delay);

    const retryJob: ScoringJob = {
      ...job,
      retry_count: retryCount,
      scheduled_at: scheduledAt
    };

    // In a real implementation, this would add the job back to the queue
    // For now, we'll just log it
    console.log(`Retry job scheduled for ${scheduledAt.toISOString()}:`, retryJob);
  }

  /**
   * Send webhook notification for completed scoring
   */
  private async sendWebhookNotification(
    webhookUrl: string,
    attempt: ScoringAttempt,
    score: any
  ): Promise<void> {
    try {
      const payload = {
        event: 'attempt.scored',
        attempt_id: attempt.id,
        tenant_id: attempt.tenant_id,
        user_id: attempt.user_id,
        exam_session_id: attempt.exam_session_id,
        provider: attempt.provider,
        level: attempt.level,
        task: attempt.task,
        score: score,
        timestamp: new Date().toISOString()
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NeoLingus-Scoring/1.0'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log(`Webhook notification sent successfully to ${webhookUrl}`);

    } catch (error) {
      console.error(`Failed to send webhook notification to ${webhookUrl}:`, error);
      // Don't throw - webhook failures shouldn't fail the scoring job
    }
  }

  /**
   * Process multiple jobs in batch
   */
  async processBatch(jobs: ScoringJob[]): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];

    // Process jobs in parallel with concurrency limit
    const concurrencyLimit = 3;
    const chunks = this.chunkArray(jobs, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(job => this.processJob(job))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  /**
   * Utility function to chunk array
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Export singleton instance
export const scoringQueueProcessor = new ScoringQueueProcessor();

/**
 * Process a single scoring job (convenience function)
 */
export async function processScoringJob(job: ScoringJob): Promise<ProcessingResult> {
  return scoringQueueProcessor.processJob(job);
}

/**
 * Helper function to create a scoring job from an attempt
 */
export function createScoringJob(
  attempt: ScoringAttempt,
  priority: 'low' | 'normal' | 'high' = 'normal',
  webhookUrl?: string
): ScoringJob {
  return {
    attempt_id: attempt.id,
    priority,
    tenant_id: attempt.tenant_id,
    webhook_url: webhookUrl,
    retry_count: 0
  };
}