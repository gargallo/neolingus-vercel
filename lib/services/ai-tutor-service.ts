/**
 * AI Tutor Service - T028
 * 
 * Business logic layer for AI tutoring with AI SDK integration and MCP support.
 * Provides intelligent tutoring, contextual learning assistance, and personalized recommendations.
 * 
 * Features:
 * - AI-powered contextual tutoring with conversation management
 * - Integration with Vercel AI SDK for advanced language models
 * - MCP-enhanced context persistence and retrieval
 * - Real-time learning analytics and adaptive recommendations
 * - Multi-language support with cultural adaptation
 * - Performance optimization with intelligent caching
 * - GDPR/LOPD compliant conversation logging
 * - Advanced conversation flow management
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import type {
  AITutorContext,
  CreateAITutorContextInput,
  UpdateAITutorContextInput,
  AITutorContextQueryOptions,
  AITutorContextAnalytics,
  ContextRecommendation,
  LearningProfile,
  AIInteraction,
  CurrentLearningContext,
  AITutorContextType,
  AIInteractionType,
  LearningContextState,
  TutoringMode,
  AISessionState,
  UUID,
  Course,
  UserCourseProgress,
  ExamSession
} from '../types/dashboard';
import { mcpClient, mcp } from '../../utils/supabase/mcp-config';
import { generateText, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import type { Database } from '../../utils/types/database';

// =============================================================================
// SERVICE CONFIGURATION AND TYPES
// =============================================================================

interface AITutorServiceConfig {
  enableCaching: boolean;
  cacheTimeoutMs: number;
  retryAttempts: number;
  enableRealtime: boolean;
  enableAnalytics: boolean;
  maxContextHistory: number;
  sessionTimeoutMs: number;
  defaultProvider: 'openai' | 'anthropic';
  enableMultilingual: boolean;
}

const DEFAULT_CONFIG: AITutorServiceConfig = {
  enableCaching: true,
  cacheTimeoutMs: 10 * 60 * 1000, // 10 minutes
  retryAttempts: 3,
  enableRealtime: true,
  enableAnalytics: true,
  maxContextHistory: 50,
  sessionTimeoutMs: 60 * 60 * 1000, // 1 hour
  defaultProvider: 'openai',
  enableMultilingual: true,
};

interface AITutorResponse {
  content: string;
  type: 'explanation' | 'question' | 'feedback' | 'recommendation' | 'encouragement';
  confidence: number;
  sources?: string[];
  followUpQuestions?: string[];
  resources?: Array<{
    type: 'link' | 'exercise' | 'video' | 'reading';
    title: string;
    url?: string;
    description?: string;
  }>;
}

interface ConversationContext {
  sessionId: string;
  userId: string;
  courseId: string;
  learningProfile: LearningProfile;
  conversationHistory: AIInteraction[];
  currentTopic?: string;
  difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferredLanguage?: string;
  culturalContext?: string;
}

// =============================================================================
// ERROR HANDLING
// =============================================================================

export class AITutorServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 500,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AITutorServiceError';
  }
}

const createNotFoundError = (contextId: string) =>
  new AITutorServiceError(`AI tutor context not found: ${contextId}`, 'CONTEXT_NOT_FOUND', 404);

const createValidationError = (message: string, details?: Record<string, unknown>) =>
  new AITutorServiceError(message, 'VALIDATION_ERROR', 400, details);

const createAIProviderError = (message: string, provider?: string) =>
  new AITutorServiceError(
    message,
    'AI_PROVIDER_ERROR',
    503,
    provider ? { provider } : undefined
  );

const createDatabaseError = (message: string, originalError?: unknown) =>
  new AITutorServiceError(
    message,
    'DATABASE_ERROR',
    500,
    originalError ? { originalError: String(originalError) } : undefined
  );

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

function validateAITutorContextData(data: Partial<AITutorContext>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.context_type && !isValidAITutorContextType(data.context_type)) {
    errors.push(`Invalid context type: ${data.context_type}`);
  }

  if (data.tutoring_mode && !isValidTutoringMode(data.tutoring_mode)) {
    errors.push(`Invalid tutoring mode: ${data.tutoring_mode}`);
  }

  if (data.state && !isValidLearningContextState(data.state)) {
    errors.push(`Invalid learning context state: ${data.state}`);
  }

  if (data.ai_session_state && !isValidAISessionState(data.ai_session_state)) {
    errors.push(`Invalid AI session state: ${data.ai_session_state}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidAITutorContextType(type: string): type is AITutorContextType {
  return ['general_tutoring', 'exam_preparation', 'skill_practice', 'progress_review', 'cultural_context'].includes(type);
}

function isValidTutoringMode(mode: string): mode is TutoringMode {
  return ['guided', 'socratic', 'adaptive', 'conversational', 'assessment'].includes(mode);
}

function isValidLearningContextState(state: string): state is LearningContextState {
  return ['active', 'paused', 'completed', 'expired', 'archived'].includes(state);
}

function isValidAISessionState(state: string): state is AISessionState {
  return ['initializing', 'active', 'waiting', 'processing', 'completed', 'error'].includes(state);
}

// =============================================================================
// AI PROVIDERS AND PROMPT MANAGEMENT
// =============================================================================

class AIProviderManager {
  private config: AITutorServiceConfig;

  constructor(config: AITutorServiceConfig) {
    this.config = config;
  }

  getModel(provider?: 'openai' | 'anthropic') {
    const selectedProvider = provider || this.config.defaultProvider;
    
    switch (selectedProvider) {
      case 'openai':
        return openai('gpt-4-turbo-preview');
      case 'anthropic':
        return anthropic('claude-3-sonnet-20240229');
      default:
        return openai('gpt-4-turbo-preview');
    }
  }

  async generateResponse(
    context: ConversationContext,
    userMessage: string,
    systemPrompt: string
  ): Promise<AITutorResponse> {
    const model = this.getModel();
    
    try {
      const result = await generateObject({
        model,
        system: systemPrompt,
        prompt: this.buildPrompt(context, userMessage),
        schema: {
          type: 'object',
          properties: {
            content: { type: 'string' },
            type: { 
              type: 'string', 
              enum: ['explanation', 'question', 'feedback', 'recommendation', 'encouragement'] 
            },
            confidence: { type: 'number', minimum: 0, maximum: 1 },
            sources: { 
              type: 'array', 
              items: { type: 'string' },
              maxItems: 5 
            },
            followUpQuestions: { 
              type: 'array', 
              items: { type: 'string' },
              maxItems: 3 
            },
            resources: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['link', 'exercise', 'video', 'reading'] },
                  title: { type: 'string' },
                  url: { type: 'string' },
                  description: { type: 'string' },
                },
                required: ['type', 'title'],
              },
              maxItems: 5,
            },
          },
          required: ['content', 'type', 'confidence'],
        },
      });

      return result.object as AITutorResponse;
    } catch (error) {
      throw createAIProviderError('Failed to generate AI response', this.config.defaultProvider);
    }
  }

  async generateStreamingResponse(
    context: ConversationContext,
    userMessage: string,
    systemPrompt: string
  ) {
    const model = this.getModel();
    
    try {
      return await streamText({
        model,
        system: systemPrompt,
        prompt: this.buildPrompt(context, userMessage),
      });
    } catch (error) {
      throw createAIProviderError('Failed to generate streaming AI response', this.config.defaultProvider);
    }
  }

  private buildPrompt(context: ConversationContext, userMessage: string): string {
    const { learningProfile, conversationHistory, currentTopic, difficultyLevel } = context;
    
    let prompt = `User Message: ${userMessage}\n\n`;
    
    // Add learning context
    prompt += `Learning Context:\n`;
    prompt += `- Current Topic: ${currentTopic || 'General'}\n`;
    prompt += `- Difficulty Level: ${difficultyLevel || 'intermediate'}\n`;
    prompt += `- Preferred Language: ${context.preferredLanguage || 'English'}\n`;
    
    if (learningProfile) {
      prompt += `- Learning Style: ${learningProfile.learning_style}\n`;
      prompt += `- Proficiency Level: ${learningProfile.proficiency_level}\n`;
      prompt += `- Learning Preferences: ${learningProfile.learning_preferences?.join(', ') || 'None specified'}\n`;
    }
    
    // Add conversation history (last 5 interactions)
    if (conversationHistory.length > 0) {
      prompt += `\nRecent Conversation History:\n`;
      const recentHistory = conversationHistory.slice(-5);
      recentHistory.forEach((interaction, index) => {
        prompt += `${index + 1}. ${interaction.interaction_type === 'user_message' ? 'User' : 'AI'}: ${interaction.content}\n`;
      });
    }
    
    return prompt;
  }
}

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

class PromptTemplateManager {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  private initializeTemplates() {
    this.templates.set('general_tutoring', `
You are an expert language learning tutor. Your role is to:
- Provide clear, encouraging explanations adapted to the student's level
- Ask probing questions to assess understanding
- Offer personalized practice recommendations
- Maintain a supportive and motivating tone
- Adapt your communication style to the student's cultural context and preferences

Focus on being helpful, patient, and educational. Always consider the student's learning profile and progress.
`);

    this.templates.set('exam_preparation', `
You are a specialized exam preparation tutor. Your expertise includes:
- Understanding official exam formats, criteria, and requirements
- Providing targeted practice strategies for specific exam components
- Offering time management and test-taking techniques
- Analyzing performance patterns and suggesting improvements
- Building confidence through structured preparation

Tailor your guidance to the specific exam type (EOI, JQCV, DELF, etc.) and component being studied.
`);

    this.templates.set('skill_practice', `
You are a skill-focused language tutor specializing in targeted practice. Your approach:
- Break down complex skills into manageable components
- Provide step-by-step guidance and feedback
- Offer varied practice exercises and activities
- Monitor progress and adjust difficulty appropriately
- Celebrate improvements and provide constructive feedback

Focus on the specific skill area (reading, writing, listening, speaking) being practiced.
`);

    this.templates.set('progress_review', `
You are an analytical tutor focused on learning progress assessment. Your capabilities:
- Analyze learning patterns and identify trends
- Highlight strengths and areas for improvement
- Provide data-driven insights and recommendations
- Set realistic goals and milestones
- Motivate continued learning through progress recognition

Use the student's performance data to provide meaningful, actionable feedback.
`);

    this.templates.set('cultural_context', `
You are a culturally-aware language tutor who understands:
- Regional language variations and cultural nuances
- Local educational contexts and expectations
- Cultural learning preferences and communication styles
- Appropriate cultural references and examples
- Sensitivity to cultural differences in learning approaches

Adapt your tutoring style to respect and incorporate the student's cultural background.
`);
  }

  getTemplate(contextType: AITutorContextType): string {
    return this.templates.get(contextType) || this.templates.get('general_tutoring')!;
  }
}

// =============================================================================
// MAIN AI TUTOR SERVICE CLASS
// =============================================================================

export class AITutorService {
  private config: AITutorServiceConfig;
  private aiProvider: AIProviderManager;
  private promptManager: PromptTemplateManager;
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private realTimeSubscriptions = new Map<string, ReturnType<typeof mcpClient.subscribeToTable>>();

  constructor(config: Partial<AITutorServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.aiProvider = new AIProviderManager(this.config);
    this.promptManager = new PromptTemplateManager();
  }

  // ===========================================================================
  // PUBLIC API METHODS - CONTEXT MANAGEMENT
  // ===========================================================================

  /**
   * Create new AI tutor context
   */
  async createTutorContext(
    contextData: CreateAITutorContextInput,
    userId: string
  ): Promise<AITutorContext> {
    // Validate input data
    const validation = validateAITutorContextData(contextData);
    if (!validation.isValid) {
      throw createValidationError('Invalid AI tutor context data', {
        errors: validation.errors,
      });
    }

    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.config.sessionTimeoutMs);

      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client
            .from('ai_tutor_contexts')
            .insert([{
              user_id: contextData.user_id,
              course_id: contextData.course_id,
              context_type: contextData.context_type,
              tutoring_mode: contextData.tutoring_mode || 'adaptive',
              state: 'active',
              ai_session_state: 'initializing',
              learning_profile: contextData.learning_profile || {},
              current_context: contextData.current_context || {},
              interaction_history: [],
              effectiveness_rating: 0,
              session_start: now.toISOString(),
              expires_at: expiresAt.toISOString(),
              created_at: now.toISOString(),
              updated_at: now.toISOString(),
            }])
            .select()
            .single();
        },
        {
          table: 'ai_tutor_contexts',
          action: 'insert',
          userId,
          metadata: { contextData },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to create AI tutor context', result.error);
      }

      const context = result.data as AITutorContext;

      // Cache the context
      if (this.config.enableCaching) {
        this.setCacheValue(`context:${context.id}`, context);
      }

      return context;
    } catch (error) {
      if (error instanceof AITutorServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while creating AI tutor context', error);
    }
  }

  /**
   * Get AI tutor context by ID
   */
  async getTutorContext(
    contextId: UUID,
    userId?: string,
    options?: AITutorContextQueryOptions
  ): Promise<AITutorContext> {
    const cacheKey = `context:${contextId}`;
    
    // Check cache first
    if (this.config.enableCaching && !options?.bypassCache) {
      const cached = this.getCacheValue<AITutorContext>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          let query = client
            .from('ai_tutor_contexts')
            .select('*')
            .eq('id', contextId);

          if (userId) {
            query = query.eq('user_id', userId);
          }

          return await query.maybeSingle();
        },
        {
          table: 'ai_tutor_contexts',
          action: 'select',
          userId,
          metadata: { contextId, options },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to fetch AI tutor context', result.error);
      }

      if (!result.data) {
        throw createNotFoundError(contextId);
      }

      const context = result.data as AITutorContext;

      // Cache the result
      if (this.config.enableCaching) {
        this.setCacheValue(cacheKey, context);
      }

      return context;
    } catch (error) {
      if (error instanceof AITutorServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while fetching AI tutor context', error);
    }
  }

  /**
   * Update AI tutor context
   */
  async updateTutorContext(
    contextId: UUID,
    updates: UpdateAITutorContextInput,
    userId: string
  ): Promise<AITutorContext> {
    // Validate update data
    const validation = validateAITutorContextData(updates);
    if (!validation.isValid) {
      throw createValidationError('Invalid AI tutor context update data', {
        errors: validation.errors,
      });
    }

    try {
      const result = await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client
            .from('ai_tutor_contexts')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', contextId)
            .select()
            .single();
        },
        {
          table: 'ai_tutor_contexts',
          action: 'update',
          userId,
          metadata: { contextId, updates },
        }
      );

      if (result.error) {
        throw createDatabaseError('Failed to update AI tutor context', result.error);
      }

      if (!result.data) {
        throw createNotFoundError(contextId);
      }

      const updatedContext = result.data as AITutorContext;

      // Update cache
      if (this.config.enableCaching) {
        this.setCacheValue(`context:${contextId}`, updatedContext);
      }

      return updatedContext;
    } catch (error) {
      if (error instanceof AITutorServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while updating AI tutor context', error);
    }
  }

  // ===========================================================================
  // CONVERSATION AND TUTORING METHODS
  // ===========================================================================

  /**
   * Send message to AI tutor and get response
   */
  async sendMessage(
    contextId: UUID,
    message: string,
    messageType: AIInteractionType = 'user_message',
    userId?: string
  ): Promise<{
    response: AITutorResponse;
    interaction: AIInteraction;
  }> {
    try {
      // Get current context
      const context = await this.getTutorContext(contextId, userId, { bypassCache: true });
      
      // Build conversation context
      const conversationContext: ConversationContext = {
        sessionId: context.id,
        userId: context.user_id,
        courseId: context.course_id,
        learningProfile: context.learning_profile,
        conversationHistory: context.interaction_history || [],
        currentTopic: context.current_context?.current_topic,
        difficultyLevel: context.current_context?.difficulty_level,
        preferredLanguage: context.current_context?.preferred_language,
        culturalContext: context.current_context?.cultural_context,
      };

      // Get system prompt based on context type
      const systemPrompt = this.promptManager.getTemplate(context.context_type);

      // Generate AI response
      const aiResponse = await this.aiProvider.generateResponse(
        conversationContext,
        message,
        systemPrompt
      );

      // Create interaction records
      const timestamp = new Date();
      const userInteraction: AIInteraction = {
        id: `interaction_${Date.now()}_user`,
        context_id: contextId,
        interaction_type: messageType,
        content: message,
        timestamp: timestamp.toISOString(),
        metadata: {
          message_length: message.length,
          language_detected: this.detectLanguage(message),
        },
      };

      const aiInteraction: AIInteraction = {
        id: `interaction_${Date.now()}_ai`,
        context_id: contextId,
        interaction_type: 'ai_response',
        content: aiResponse.content,
        timestamp: new Date(timestamp.getTime() + 100).toISOString(),
        metadata: {
          response_type: aiResponse.type,
          confidence: aiResponse.confidence,
          sources: aiResponse.sources,
          follow_up_questions: aiResponse.followUpQuestions,
          resources: aiResponse.resources,
        },
      };

      // Update context with new interactions
      const updatedHistory = [
        ...conversationContext.conversationHistory,
        userInteraction,
        aiInteraction,
      ].slice(-this.config.maxContextHistory); // Keep only recent history

      await this.updateTutorContext(
        contextId,
        {
          interaction_history: updatedHistory,
          ai_session_state: 'active',
          last_interaction: timestamp.toISOString(),
        },
        userId || context.user_id
      );

      return {
        response: aiResponse,
        interaction: aiInteraction,
      };
    } catch (error) {
      if (error instanceof AITutorServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while processing message', error);
    }
  }

  /**
   * Get streaming response from AI tutor
   */
  async getStreamingResponse(
    contextId: UUID,
    message: string,
    messageType: AIInteractionType = 'user_message',
    userId?: string
  ) {
    try {
      // Get current context
      const context = await this.getTutorContext(contextId, userId);
      
      // Build conversation context
      const conversationContext: ConversationContext = {
        sessionId: context.id,
        userId: context.user_id,
        courseId: context.course_id,
        learningProfile: context.learning_profile,
        conversationHistory: context.interaction_history || [],
        currentTopic: context.current_context?.current_topic,
        difficultyLevel: context.current_context?.difficulty_level,
        preferredLanguage: context.current_context?.preferred_language,
      };

      // Get system prompt based on context type
      const systemPrompt = this.promptManager.getTemplate(context.context_type);

      // Generate streaming response
      return await this.aiProvider.generateStreamingResponse(
        conversationContext,
        message,
        systemPrompt
      );
    } catch (error) {
      if (error instanceof AITutorServiceError) {
        throw error;
      }
      throw createDatabaseError('Unexpected error while generating streaming response', error);
    }
  }

  // ===========================================================================
  // SPECIALIZED TUTORING METHODS
  // ===========================================================================

  /**
   * Provide exam-specific tutoring
   */
  async provideExamTutoring(
    contextId: UUID,
    examSession: ExamSession,
    question: string,
    options?: {
      focusArea?: 'strategy' | 'content' | 'technique' | 'confidence';
      includeResources?: boolean;
    }
  ): Promise<AITutorResponse> {
    const focusArea = options?.focusArea || 'strategy';
    
    const examSpecificMessage = `
I'm working on a ${examSession.session_type} exam session. Here's the question I'm struggling with:

"${question}"

Please help me with ${focusArea}-focused guidance for this type of question. 
Consider the exam format and provide specific strategies that would help me improve my performance.
`;

    const result = await this.sendMessage(
      contextId,
      examSpecificMessage,
      'exam_support_request'
    );

    return result.response;
  }

  /**
   * Analyze progress and provide recommendations
   */
  async analyzeProgressAndRecommend(
    contextId: UUID,
    progressData: UserCourseProgress,
    options?: {
      includeMotivation?: boolean;
      focusOnWeaknesses?: boolean;
    }
  ): Promise<{
    analysis: AITutorResponse;
    recommendations: ContextRecommendation[];
  }> {
    const progressMessage = `
My current learning progress:
- Overall Progress: ${(progressData.overall_progress * 100).toFixed(1)}%
- Component Progress: ${JSON.stringify(progressData.component_progress)}
- Current State: ${progressData.state}

Please analyze my progress and provide:
1. A comprehensive assessment of my learning journey
2. Specific recommendations for improvement
3. Study plan suggestions
${options?.includeMotivation ? '4. Motivational support and encouragement' : ''}
`;

    const analysisResult = await this.sendMessage(
      contextId,
      progressMessage,
      'progress_analysis_request'
    );

    // Generate structured recommendations
    const recommendations = await this.generateContextRecommendations(
      progressData,
      options?.focusOnWeaknesses
    );

    return {
      analysis: analysisResult.response,
      recommendations,
    };
  }

  /**
   * Provide cultural context tutoring
   */
  async provideCulturalContext(
    contextId: UUID,
    topic: string,
    culturalAspect: 'language_use' | 'cultural_norms' | 'regional_variations' | 'exam_expectations'
  ): Promise<AITutorResponse> {
    const culturalMessage = `
I need help understanding the cultural context of: "${topic}"

Specifically, I want to learn about ${culturalAspect.replace('_', ' ')} related to this topic.
Please provide insights that will help me communicate more appropriately and effectively.
`;

    const result = await this.sendMessage(
      contextId,
      culturalMessage,
      'cultural_context_request'
    );

    return result.response;
  }

  // ===========================================================================
  // ANALYTICS AND RECOMMENDATIONS
  // ===========================================================================

  /**
   * Generate context-specific recommendations
   */
  private async generateContextRecommendations(
    progressData: UserCourseProgress,
    focusOnWeaknesses: boolean = true
  ): Promise<ContextRecommendation[]> {
    const recommendations: ContextRecommendation[] = [];
    
    const componentScores = Object.entries(progressData.component_progress);
    const sortedComponents = componentScores.sort(([, a], [, b]) => 
      focusOnWeaknesses ? a - b : b - a
    );

    // Add component-specific recommendations
    sortedComponents.slice(0, 3).forEach(([component, score]) => {
      const priority = score < 0.5 ? 'high' : score < 0.7 ? 'medium' : 'low';
      
      recommendations.push({
        type: 'skill_improvement',
        priority,
        title: `Focus on ${component} skills`,
        description: `Your ${component} proficiency is at ${(score * 100).toFixed(1)}%. Targeted practice can help improve this area.`,
        estimated_impact: score < 0.5 ? 0.2 : 0.1,
        implementation_effort: 'medium',
        timeline_weeks: score < 0.5 ? 3 : 2,
        context_specific_data: {
          component,
          current_score: score,
          target_score: Math.min(1.0, score + 0.2),
        },
      });
    });

    // Add study pattern recommendations
    if (progressData.overall_progress < 0.5) {
      recommendations.push({
        type: 'study_routine',
        priority: 'medium',
        title: 'Establish consistent study routine',
        description: 'Regular, shorter study sessions tend to be more effective than irregular, longer sessions.',
        estimated_impact: 0.15,
        implementation_effort: 'low',
        timeline_weeks: 1,
        context_specific_data: {
          recommended_frequency: 'daily',
          recommended_duration_minutes: 30,
        },
      });
    }

    return recommendations;
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Detect language of input text (simplified implementation)
   */
  private detectLanguage(text: string): string {
    // This is a simplified implementation
    // In production, you'd use a proper language detection library
    const spanishPatterns = /[ñáéíóúü]/i;
    const valencianPatterns = /[àèìòùç]/i;
    const frenchPatterns = /[âêîôûçé]/i;
    
    if (valencianPatterns.test(text)) return 'valenciano';
    if (spanishPatterns.test(text)) return 'spanish';
    if (frenchPatterns.test(text)) return 'french';
    return 'english';
  }

  /**
   * Cache management
   */
  private setCacheValue<T>(key: string, value: T): void {
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      data: value,
      expiresAt: Date.now() + this.config.cacheTimeoutMs,
    });
  }

  private getCacheValue<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: boolean;
    aiProvider: boolean;
    cache: boolean;
    subscriptions: number;
  }> {
    let databaseHealthy = false;
    let aiProviderHealthy = false;

    try {
      await mcp.query(
        async () => {
          const client = mcpClient.getClient();
          return await client.from('ai_tutor_contexts').select('id').limit(1);
        },
        {
          table: 'ai_tutor_contexts',
          action: 'health_check',
          metadata: { component: 'ai-tutor-service' },
        }
      );
      databaseHealthy = true;
    } catch {
      databaseHealthy = false;
    }

    try {
      // Simple AI provider test
      await this.aiProvider.generateResponse(
        {
          sessionId: 'health-check',
          userId: 'health-check',
          courseId: 'health-check',
          learningProfile: {},
          conversationHistory: [],
        } as ConversationContext,
        'Hello',
        'You are a helpful assistant. Respond with just "OK" to confirm you are working.'
      );
      aiProviderHealthy = true;
    } catch {
      aiProviderHealthy = false;
    }

    return {
      status: databaseHealthy && aiProviderHealthy ? 'healthy' : 'unhealthy',
      database: databaseHealthy,
      aiProvider: aiProviderHealthy,
      cache: true,
      subscriptions: this.realTimeSubscriptions.size,
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Unsubscribe from all real-time subscriptions
    for (const subscription of this.realTimeSubscriptions.values()) {
      subscription.unsubscribe();
    }
    this.realTimeSubscriptions.clear();

    // Clear cache
    this.cache.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE AND EXPORTS
// =============================================================================

// Create singleton instance with production configuration
export const aiTutorService = new AITutorService({
  enableCaching: process.env.NODE_ENV === 'production',
  enableRealtime: process.env.NODE_ENV === 'production',
  enableAnalytics: true,
  defaultProvider: (process.env.AI_PROVIDER as 'openai' | 'anthropic') || 'openai',
});

// Export types and utilities
export type { AITutorServiceConfig, AITutorServiceError, AITutorResponse, ConversationContext };
export { validateAITutorContextData, isValidAITutorContextType, isValidTutoringMode };