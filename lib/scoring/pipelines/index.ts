/**
 * AI Scoring Pipelines
 * Implements the scoring logic for different task types using AI model committees
 */

// Note: AI SDK integration will be implemented with proper OpenAI client
import { performanceUtils, measureAsync } from '../utils/performance';
import { cacheHelpers } from '../utils/cache';
import type {
  ScoringAttempt,
  ScoringRubric,
  ScoreJson,
  QcJson,
  ModelConfig,
  CommitteeConfig,
  WritingPayload,
  SpeakingPayload,
  ReadingPayload,
  ListeningPayload,
  UseOfEnglishPayload,
  MediationPayload
} from '../schemas';

// AI Provider Configuration
const AI_PROVIDERS = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY
  },
  deepseek: {
    baseURL: 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    apiKey: process.env.ANTHROPIC_API_KEY
  }
};

// Scoring Pipeline Result
export interface ScoringResult {
  success: boolean;
  score?: ScoreJson;
  qc?: QcJson;
  error?: string;
}

// Model response interface
interface ModelResponse {
  model: string;
  provider: string;
  score: ScoreJson;
  processing_time: number;
  cost: number;
  confidence: number;
}

/**
 * Base Scoring Pipeline
 */
export abstract class BaseScoringPipeline {
  protected rubric: ScoringRubric;
  protected committee: CommitteeConfig;

  constructor(rubric: ScoringRubric, committee: CommitteeConfig) {
    this.rubric = rubric;
    this.committee = committee;
  }

  abstract generatePrompt(payload: any): string;
  abstract validatePayload(payload: any): boolean;

  /**
   * Score an attempt using the model committee
   */
  async score(attempt: ScoringAttempt): Promise<ScoringResult> {
    const startTime = Date.now();

    try {
      // Validate payload
      if (!this.validatePayload(attempt.payload)) {
        return {
          success: false,
          error: 'Invalid payload for task type'
        };
      }

      // Generate scoring prompt
      const prompt = this.generatePrompt(attempt.payload);

      // Score with each model in the committee
      const modelResponses: ModelResponse[] = [];
      const errors: string[] = [];

      for (const modelConfig of this.committee) {
        try {
          const response = await this.scoreWithModel(prompt, modelConfig, attempt);
          modelResponses.push(response);
        } catch (error) {
          errors.push(`${modelConfig.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      if (modelResponses.length === 0) {
        return {
          success: false,
          error: `All models failed: ${errors.join(', ')}`
        };
      }

      // Aggregate results using committee consensus
      const aggregatedScore = this.aggregateScores(modelResponses);
      const qc = this.generateQualityControl(modelResponses, attempt, Date.now() - startTime);

      return {
        success: true,
        score: aggregatedScore,
        qc
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown scoring error'
      };
    }
  }

  /**
   * Score with individual model
   */
  private async scoreWithModel(
    prompt: string,
    modelConfig: ModelConfig,
    attempt: ScoringAttempt
  ): Promise<ModelResponse> {
    const startTime = Date.now();

    // Prepare the messages
    const messages = [
      {
        role: 'system' as const,
        content: this.getSystemPrompt()
      },
      {
        role: 'user' as const,
        content: prompt
      }
    ];

    // Get provider configuration
    const providerConfig = AI_PROVIDERS[modelConfig.provider as keyof typeof AI_PROVIDERS];
    if (!providerConfig) {
      throw new Error(`Unsupported AI provider: ${modelConfig.provider}`);
    }

    // Call the AI model (simplified - in production would use proper AI SDK)
    const response = await fetch(`${providerConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: modelConfig.name,
        messages,
        temperature: modelConfig.temperature,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        seed: modelConfig.seed
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response content from AI model');
    }

    // Parse JSON response
    let scoreData;
    try {
      scoreData = JSON.parse(content);
    } catch (error) {
      throw new Error('Invalid JSON response from AI model');
    }

    // Transform to ScoreJson format
    const score: ScoreJson = {
      attempt_id: attempt.id,
      total_score: scoreData.total_score,
      max_score: scoreData.max_score,
      percentage: (scoreData.total_score / scoreData.max_score) * 100,
      pass: scoreData.total_score >= (this.rubric.json.total_score.pass_threshold || 0),
      criteria_scores: scoreData.criteria_scores,
      overall_feedback: scoreData.overall_feedback,
      improvement_areas: scoreData.improvement_areas,
      strengths: scoreData.strengths,
      timestamp: new Date().toISOString()
    };

    return {
      model: modelConfig.name,
      provider: modelConfig.provider,
      score,
      processing_time: Date.now() - startTime,
      cost: this.estimateCost(modelConfig, prompt.length),
      confidence: scoreData.confidence || 0.8
    };
  }

  /**
   * Aggregate scores from multiple models using committee consensus
   */
  private aggregateScores(responses: ModelResponse[]): ScoreJson {
    if (responses.length === 1) {
      return responses[0].score;
    }

    // Calculate weighted average for each criterion
    const aggregatedCriteria = this.rubric.json.criteria.map(criterion => {
      const criterionScores = responses.map(r => {
        const criterionScore = r.score.criteria_scores.find(cs => cs.criterion_id === criterion.id);
        return {
          score: criterionScore?.score || 0,
          weight: this.committee.find(m => m.name === r.model)?.weight || 1
        };
      });

      const weightedSum = criterionScores.reduce((sum, cs) => sum + (cs.score * cs.weight), 0);
      const totalWeight = criterionScores.reduce((sum, cs) => sum + cs.weight, 0);
      const averageScore = weightedSum / totalWeight;

      // Find the most common evidence and feedback
      const allEvidence = responses.flatMap(r =>
        r.score.criteria_scores.find(cs => cs.criterion_id === criterion.id)?.evidence || []
      );
      const uniqueEvidence = [...new Set(allEvidence)];

      return {
        criterion_id: criterion.id,
        score: Math.round(averageScore * 100) / 100,
        max_score: criterion.bands[criterion.bands.length - 1].score,
        band: Math.round(averageScore),
        evidence: uniqueEvidence.slice(0, 5), // Top 5 evidence items
        confidence: this.calculateConfidence(criterionScores.map(cs => cs.score))
      };
    });

    // Calculate total score
    const totalScore = aggregatedCriteria.reduce((sum, cs) => sum + cs.score, 0);
    const maxScore = aggregatedCriteria.reduce((sum, cs) => sum + cs.max_score, 0);

    // Aggregate feedback
    const allFeedback = responses.map(r => r.score.overall_feedback).filter(Boolean);
    const allStrengths = responses.flatMap(r => r.score.strengths || []);
    const allImprovements = responses.flatMap(r => r.score.improvement_areas || []);

    return {
      attempt_id: responses[0].score.attempt_id,
      total_score: Math.round(totalScore * 100) / 100,
      max_score: maxScore,
      percentage: Math.round((totalScore / maxScore) * 10000) / 100,
      pass: totalScore >= (this.rubric.json.total_score.pass_threshold || 0),
      criteria_scores: aggregatedCriteria,
      overall_feedback: allFeedback[0] || undefined, // Use first model's feedback
      strengths: [...new Set(allStrengths)].slice(0, 3),
      improvement_areas: [...new Set(allImprovements)].slice(0, 3),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate quality control metrics
   */
  private generateQualityControl(
    responses: ModelResponse[],
    attempt: ScoringAttempt,
    totalTime: number
  ): QcJson {
    const scores = responses.map(r => r.score.total_score);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const disagreementScore = Math.sqrt(variance) / mean;

    const modelCosts = responses.reduce((costs, r) => {
      costs[r.model] = r.cost;
      return costs;
    }, {} as Record<string, number>);

    const confidenceIntervals = this.rubric.json.criteria.reduce((intervals, criterion) => {
      const criterionScores = responses.map(r =>
        r.score.criteria_scores.find(cs => cs.criterion_id === criterion.id)?.score || 0
      );
      const sortedScores = criterionScores.sort((a, b) => a - b);
      intervals[criterion.id] = [sortedScores[0], sortedScores[sortedScores.length - 1]];
      return intervals;
    }, {} as Record<string, [number, number]>);

    const qualityFlags: string[] = [];
    if (disagreementScore > 0.2) qualityFlags.push('high_disagreement');
    if (responses.length < this.committee.length) qualityFlags.push('incomplete_committee');
    if (totalTime > 30000) qualityFlags.push('slow_processing');

    return {
      attempt_id: attempt.id,
      processing_time_ms: totalTime,
      model_costs: modelCosts,
      disagreement_score: Math.round(disagreementScore * 1000) / 1000,
      confidence_intervals: confidenceIntervals,
      feature_extraction: this.extractFeatures(attempt.payload),
      quality_flags: qualityFlags,
      committee_consensus: {
        unanimous: disagreementScore < 0.1,
        majority_threshold: 0.6,
        outlier_scores: scores.filter(score => Math.abs(score - mean) > 2 * Math.sqrt(variance))
          .map(score => score.toString())
      }
    };
  }

  /**
   * Calculate confidence score based on score distribution
   */
  private calculateConfidence(scores: number[]): number {
    if (scores.length <= 1) return 0.8;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Lower standard deviation = higher confidence
    const normalizedStdDev = standardDeviation / mean;
    return Math.max(0.1, Math.min(1.0, 1 - normalizedStdDev));
  }

  /**
   * Estimate cost based on model and input length
   */
  private estimateCost(modelConfig: ModelConfig, inputLength: number): number {
    const costs = {
      'gpt-4o-mini': 0.00015, // per 1K tokens
      'gpt-4o': 0.005,
      'claude-3-haiku': 0.00025,
      'deepseek-chat': 0.0001
    };

    const costPerToken = costs[modelConfig.name as keyof typeof costs] || 0.0001;
    const estimatedTokens = Math.ceil(inputLength / 4) + 500; // rough estimation
    return Math.round(costPerToken * estimatedTokens * 100000) / 100000; // 5 decimal places
  }

  /**
   * Extract features from payload for QC analysis
   */
  protected extractFeatures(payload: any): QcJson['feature_extraction'] {
    const features: QcJson['feature_extraction'] = {};

    if (payload.text || payload.output) {
      const text = payload.text || payload.output;
      features.word_count = text.split(/\s+/).length;
      features.readability_score = this.calculateReadabilityScore(text);
    }

    return features;
  }

  /**
   * Simple readability score calculation
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;

    // Simple Flesch-like score (0-100)
    return Math.max(0, Math.min(100, 100 - (avgWordsPerSentence * 2)));
  }

  /**
   * Get system prompt for the model
   */
  protected getSystemPrompt(): string {
    return `You are an expert language assessor for ${this.rubric.json.provider} ${this.rubric.json.level} ${this.rubric.json.task} tasks.

Your task is to score student responses according to the provided rubric with complete objectivity and consistency.

CRITICAL REQUIREMENTS:
1. Follow the rubric exactly - do not deviate from the criteria or scoring bands
2. Provide specific evidence for each score
3. Be fair and consistent across all responses
4. Return only valid JSON in the specified format
5. Always include confidence scores

Your response MUST be valid JSON with this exact structure:
{
  "total_score": number,
  "max_score": number,
  "criteria_scores": [
    {
      "criterion_id": "string",
      "score": number,
      "max_score": number,
      "band": number,
      "evidence": ["string"],
      "confidence": number
    }
  ],
  "overall_feedback": "string",
  "strengths": ["string"],
  "improvement_areas": ["string"],
  "confidence": number
}`;
  }
}

/**
 * Writing Task Scoring Pipeline
 */
export class WritingScoringPipeline extends BaseScoringPipeline {
  validatePayload(payload: any): boolean {
    return payload.text && typeof payload.text === 'string' && payload.text.length >= 50;
  }

  generatePrompt(payload: WritingPayload): string {
    const rubricJson = JSON.stringify(this.rubric.json, null, 2);

    return `Please score this ${this.rubric.json.level} writing response according to the ${this.rubric.json.provider} rubric.

RUBRIC:
${rubricJson}

WRITING PROMPT:
${payload.prompt}

STUDENT RESPONSE:
${payload.text}

TASK TYPE: ${payload.task_type || 'essay'}
WORD LIMIT: ${payload.word_limit || 'Not specified'}

Please evaluate the response against each criterion in the rubric and provide a detailed assessment with specific evidence.`;
  }
}

/**
 * Speaking Task Scoring Pipeline
 */
export class SpeakingScoringPipeline extends BaseScoringPipeline {
  validatePayload(payload: any): boolean {
    return payload.audio_url || (payload.transcript && payload.transcript.length >= 20);
  }

  generatePrompt(payload: SpeakingPayload): string {
    const rubricJson = JSON.stringify(this.rubric.json, null, 2);

    return `Please score this ${this.rubric.json.level} speaking response according to the ${this.rubric.json.provider} rubric.

RUBRIC:
${rubricJson}

SPEAKING PROMPT:
${payload.prompt}

TRANSCRIPT:
${payload.transcript || '[Audio transcript not available - scoring based on audio analysis]'}

DURATION: ${payload.duration_seconds} seconds
TASK TYPE: ${payload.task_type || 'monologue'}

Please evaluate the response against each criterion in the rubric. If transcript is not available, focus on audio analysis for pronunciation, fluency, and intonation.`;
  }
}

/**
 * Pipeline Factory
 */
export class ScoringPipelineFactory {
  static createPipeline(
    rubric: ScoringRubric,
    committee: CommitteeConfig
  ): BaseScoringPipeline {
    switch (rubric.task) {
      case 'writing':
        return new WritingScoringPipeline(rubric, committee);
      case 'speaking':
        return new SpeakingScoringPipeline(rubric, committee);
      default:
        throw new Error(`Unsupported task type: ${rubric.task}`);
    }
  }
}

/**
 * Main scoring function
 */
export async function scoreAttempt(
  attempt: ScoringAttempt,
  rubric: ScoringRubric,
  committee: CommitteeConfig
): Promise<ScoringResult> {
  return measureAsync(
    `score-attempt-${attempt.provider}-${attempt.level}-${attempt.task}`,
    async () => {
      try {
        const pipeline = ScoringPipelineFactory.createPipeline(rubric, committee);
        return await pipeline.score(attempt);
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown scoring error'
        };
      }
    },
    {
      attempt_id: attempt.id,
      provider: attempt.provider,
      level: attempt.level,
      task: attempt.task
    }
  );
}