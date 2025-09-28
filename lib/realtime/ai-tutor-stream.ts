/**
 * AI Tutor Streaming Responses - T052
 * 
 * Real-time AI tutor with streaming responses using AI SDK for natural
 * conversation flow with comprehensive streaming management.
 * 
 * Features:
 * - Streaming AI responses with natural conversation flow
 * - Multi-provider support (OpenAI, Anthropic, Google)
 * - Real-time typing indicators and response streaming
 * - Context-aware tutoring with session persistence
 * - Error handling and retry mechanisms
 * - Rate limiting and usage monitoring
 * - Conversation history and analytics
 * - Multi-language support
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { 
  generateText, 
  streamText, 
  type StreamTextResult,
  type LanguageModel,
  type CoreMessage,
  type GenerateTextResult
} from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AiTutorContext,
  TutorMessage,
  TutorSession,
  ConversationTurn,
  TutorPersonality,
  UUID
} from '../types/ai-tutor-context';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface StreamingMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  streaming: boolean;
  completed: boolean;
  metadata?: {
    model?: string;
    provider?: string;
    tokens_used?: number;
    response_time_ms?: number;
    confidence_score?: number;
    language?: string;
    session_id?: string;
  };
}

export interface StreamingCallback {
  onStart?: (messageId: string) => void;
  onToken?: (token: string, messageId: string) => void;
  onComplete?: (message: StreamingMessage) => void;
  onError?: (error: Error, messageId: string) => void;
  onTypingStart?: () => void;
  onTypingStop?: () => void;
}

export interface TutorStreamOptions {
  provider?: 'openai' | 'anthropic' | 'google';
  model?: string;
  temperature?: number;
  max_tokens?: number;
  streaming?: boolean;
  language?: string;
  personality?: TutorPersonality;
  context_window?: number;
  rate_limit_rpm?: number;
  enable_analytics?: boolean;
  enable_context_persistence?: boolean;
  enable_retry?: boolean;
  retry_attempts?: number;
  timeout_ms?: number;
}

export interface ConversationContext {
  session_id: UUID;
  user_id: UUID;
  course_id: UUID;
  language: string;
  difficulty_level: string;
  learning_objectives: string[];
  conversation_history: ConversationTurn[];
  current_topic?: string;
  user_profile?: {
    learning_style: string;
    proficiency_level: string;
    preferred_explanations: string;
    cultural_context: string;
  };
}

export interface StreamingStats {
  messages_streamed: number;
  total_tokens_used: number;
  average_response_time: number;
  error_rate: number;
  active_streams: number;
  provider_usage: Record<string, number>;
}

export interface RateLimitState {
  requests_made: number;
  window_start: Date;
  blocked_until?: Date;
  provider: string;
}

// =============================================================================
// AI TUTOR STREAMING MANAGER
// =============================================================================

export class AiTutorStreamManager {
  private supabase: SupabaseClient;
  private options: Required<TutorStreamOptions>;
  private activeStreams: Map<string, AbortController> = new Map();
  private conversationContexts: Map<string, ConversationContext> = new Map();
  private rateLimitStates: Map<string, RateLimitState> = new Map();
  private streamingStats: StreamingStats;
  private messageQueue: Map<string, StreamingMessage[]> = new Map();
  private retryQueue: Array<{
    messageId: string;
    context: ConversationContext;
    userMessage: string;
    attempts: number;
  }> = [];

  // Default configuration
  private static readonly DEFAULT_OPTIONS: Required<TutorStreamOptions> = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    max_tokens: 1000,
    streaming: true,
    language: 'en',
    personality: 'friendly',
    context_window: 10,
    rate_limit_rpm: 60,
    enable_analytics: true,
    enable_context_persistence: true,
    enable_retry: true,
    retry_attempts: 3,
    timeout_ms: 30000
  };

  // Model configurations by provider
  private static readonly MODEL_CONFIGS = {
    openai: {
      'gpt-4o': { max_tokens: 4096, cost_per_1k: 0.03 },
      'gpt-4o-mini': { max_tokens: 16384, cost_per_1k: 0.0015 },
      'gpt-3.5-turbo': { max_tokens: 4096, cost_per_1k: 0.002 }
    },
    anthropic: {
      'claude-3-5-sonnet-20241022': { max_tokens: 8192, cost_per_1k: 0.015 },
      'claude-3-haiku-20240307': { max_tokens: 4096, cost_per_1k: 0.0025 }
    },
    google: {
      'gemini-1.5-pro': { max_tokens: 8192, cost_per_1k: 0.01 },
      'gemini-1.5-flash': { max_tokens: 8192, cost_per_1k: 0.0075 }
    }
  };

  constructor(supabase: SupabaseClient, options: Partial<TutorStreamOptions> = {}) {
    this.supabase = supabase;
    this.options = { ...AiTutorStreamManager.DEFAULT_OPTIONS, ...options };
    this.streamingStats = {
      messages_streamed: 0,
      total_tokens_used: 0,
      average_response_time: 0,
      error_rate: 0,
      active_streams: 0,
      provider_usage: {}
    };

    this.initializeRateLimiting();
    this.initializeRetryProcessor();
    this.initializeContextPersistence();
  }

  // =============================================================================
  // STREAMING CONVERSATION METHODS
  // =============================================================================

  /**
   * Start a streaming conversation with the AI tutor
   */
  async startStreamingConversation(
    context: ConversationContext,
    userMessage: string,
    callbacks: StreamingCallback = {}
  ): Promise<string> {
    const messageId = this.generateMessageId();

    try {
      // Check rate limits
      if (!this.checkRateLimit(this.options.provider)) {
        throw new Error(`Rate limit exceeded for provider: ${this.options.provider}`);
      }

      // Store conversation context
      this.conversationContexts.set(messageId, context);

      // Create abort controller for stream management
      const abortController = new AbortController();
      this.activeStreams.set(messageId, abortController);

      // Prepare streaming message
      const streamingMessage: StreamingMessage = {
        id: messageId,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        streaming: true,
        completed: false,
        metadata: {
          model: this.options.model,
          provider: this.options.provider,
          language: this.options.language,
          session_id: context.session_id
        }
      };

      // Start typing indicator
      callbacks.onTypingStart?.();
      callbacks.onStart?.(messageId);

      // Begin streaming
      await this.performStreamingGeneration(
        context,
        userMessage,
        streamingMessage,
        callbacks,
        abortController.signal
      );

      return messageId;
    } catch (error) {
      this.handleStreamingError(error as Error, messageId, callbacks);
      throw error;
    }
  }

  /**
   * Continue an existing conversation with streaming
   */
  async continueConversation(
    sessionId: UUID,
    userMessage: string,
    callbacks: StreamingCallback = {}
  ): Promise<string> {
    try {
      // Load conversation context
      const context = await this.loadConversationContext(sessionId);
      if (!context) {
        throw new Error(`No conversation context found for session: ${sessionId}`);
      }

      // Add user message to history
      const userTurn: ConversationTurn = {
        id: this.generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        metadata: {
          session_id: sessionId,
          language: this.options.language
        }
      };

      context.conversation_history.push(userTurn);

      // Start streaming response
      return await this.startStreamingConversation(context, userMessage, callbacks);
    } catch (error) {
      this.handleError('continue_conversation_failed', error as Error, { sessionId });
      throw error;
    }
  }

  // =============================================================================
  // CORE STREAMING LOGIC
  // =============================================================================

  private async performStreamingGeneration(
    context: ConversationContext,
    userMessage: string,
    streamingMessage: StreamingMessage,
    callbacks: StreamingCallback,
    signal: AbortSignal
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Get language model
      const model = this.getLanguageModel();

      // Prepare system prompt
      const systemPrompt = this.buildSystemPrompt(context);

      // Prepare conversation messages
      const messages = this.buildConversationMessages(context, systemPrompt, userMessage);

      // Configure streaming options
      const streamOptions = {
        model,
        messages,
        temperature: this.options.temperature,
        maxTokens: this.options.max_tokens,
        abortSignal: signal
      };

      // Start streaming
      let fullContent = '';
      let tokenCount = 0;

      if (this.options.streaming) {
        const result: StreamTextResult = await streamText(streamOptions);

        // Stream tokens
        for await (const delta of result.textStream) {
          if (signal.aborted) break;

          fullContent += delta;
          tokenCount++;
          streamingMessage.content = fullContent;
          
          // Invoke token callback
          callbacks.onToken?.(delta, streamingMessage.id);

          // Update streaming stats
          this.streamingStats.active_streams = this.activeStreams.size;
        }

        // Get final usage data
        const usage = await result.usage;
        tokenCount = usage?.totalTokens || tokenCount;
      } else {
        // Non-streaming generation
        const result: GenerateTextResult = await generateText(streamOptions);
        fullContent = result.text;
        tokenCount = result.usage?.totalTokens || 0;
        
        streamingMessage.content = fullContent;
        callbacks.onToken?.(fullContent, streamingMessage.id);
      }

      // Complete the message
      const responseTime = Date.now() - startTime;
      streamingMessage.streaming = false;
      streamingMessage.completed = true;
      streamingMessage.metadata = {
        ...streamingMessage.metadata,
        tokens_used: tokenCount,
        response_time_ms: responseTime,
        confidence_score: this.calculateConfidenceScore(fullContent)
      };

      // Stop typing indicator
      callbacks.onTypingStop?.();

      // Save conversation turn
      await this.saveConversationTurn(context, streamingMessage, userMessage);

      // Update stats
      this.updateStreamingStats(responseTime, tokenCount, true);

      // Complete callback
      callbacks.onComplete?.(streamingMessage);

      this.logActivity('streaming_completed', {
        messageId: streamingMessage.id,
        sessionId: context.session_id,
        responseTime,
        tokenCount
      });

    } catch (error) {
      // Handle streaming error
      streamingMessage.streaming = false;
      streamingMessage.completed = false;
      
      callbacks.onTypingStop?.();
      this.updateStreamingStats(Date.now() - startTime, 0, false);
      
      // Add to retry queue if retries enabled
      if (this.options.enable_retry) {
        this.addToRetryQueue(streamingMessage.id, context, userMessage);
      }

      throw error;
    } finally {
      // Cleanup
      this.activeStreams.delete(streamingMessage.id);
      this.updateRateLimit(this.options.provider);
    }
  }

  // =============================================================================
  // MODEL AND MESSAGE PREPARATION
  // =============================================================================

  private getLanguageModel(): LanguageModel {
    const { provider, model } = this.options;

    switch (provider) {
      case 'openai':
        return openai(model);
      case 'anthropic':
        return anthropic(model);
      case 'google':
        return google(model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const { personality, language } = this.options;
    const { difficulty_level, learning_objectives, user_profile } = context;

    let prompt = `You are an AI language tutor with a ${personality} personality. `;
    
    if (language !== 'en') {
      prompt += `Communicate primarily in ${language}. `;
    }

    prompt += `
Your role:
- Help students learn ${language} at ${difficulty_level} level
- Provide clear, encouraging, and constructive feedback
- Adapt explanations to the student's learning style
- Use interactive teaching methods

Student profile:
${user_profile ? `
- Learning style: ${user_profile.learning_style}
- Proficiency level: ${user_profile.proficiency_level}
- Preferred explanations: ${user_profile.preferred_explanations}
- Cultural context: ${user_profile.cultural_context}
` : 'Profile information not available.'}

Learning objectives:
${learning_objectives.map(obj => `- ${obj}`).join('\n')}

Guidelines:
1. Keep responses conversational and engaging
2. Provide examples and practice opportunities
3. Correct mistakes gently with explanations
4. Ask follow-up questions to ensure understanding
5. Celebrate progress and encourage continued learning
6. Break down complex concepts into manageable parts
7. Use relevant cultural references when appropriate

Current topic: ${context.current_topic || 'General language learning'}
`;

    return prompt.trim();
  }

  private buildConversationMessages(
    context: ConversationContext,
    systemPrompt: string,
    currentUserMessage: string
  ): CoreMessage[] {
    const messages: CoreMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history (limited by context window)
    const recentHistory = context.conversation_history
      .slice(-this.options.context_window)
      .filter(turn => turn.role === 'user' || turn.role === 'assistant');

    for (const turn of recentHistory) {
      messages.push({
        role: turn.role,
        content: turn.content
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: currentUserMessage
    });

    return messages;
  }

  private calculateConfidenceScore(content: string): number {
    // Simple heuristic for confidence scoring
    // In a real implementation, this could use more sophisticated methods
    const length = content.length;
    const hasQuestions = content.includes('?');
    const hasExamples = content.toLowerCase().includes('example') || content.toLowerCase().includes('for instance');
    
    let score = 0.7; // Base confidence

    if (length > 100) score += 0.1;
    if (hasQuestions) score += 0.1;
    if (hasExamples) score += 0.1;

    return Math.min(score, 1.0);
  }

  // =============================================================================
  // CONVERSATION PERSISTENCE
  // =============================================================================

  private async saveConversationTurn(
    context: ConversationContext,
    assistantMessage: StreamingMessage,
    userMessage: string
  ): Promise<void> {
    if (!this.options.enable_context_persistence) return;

    try {
      // Save user message
      const userTurn: ConversationTurn = {
        id: this.generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
        metadata: {
          session_id: context.session_id,
          language: this.options.language
        }
      };

      // Save assistant message
      const assistantTurn: ConversationTurn = {
        id: assistantMessage.id,
        role: 'assistant',
        content: assistantMessage.content,
        timestamp: assistantMessage.timestamp,
        metadata: {
          ...assistantMessage.metadata,
          tokens_used: assistantMessage.metadata?.tokens_used,
          response_time_ms: assistantMessage.metadata?.response_time_ms,
          confidence_score: assistantMessage.metadata?.confidence_score
        }
      };

      // Update conversation history in context
      context.conversation_history.push(userTurn, assistantTurn);

      // Save to database
      await this.persistConversationTurns(context.session_id, [userTurn, assistantTurn]);

      this.logActivity('conversation_turn_saved', {
        sessionId: context.session_id,
        userMessageLength: userMessage.length,
        assistantMessageLength: assistantMessage.content.length
      });

    } catch (error) {
      this.handleError('save_conversation_turn_failed', error as Error, {
        sessionId: context.session_id
      });
    }
  }

  private async persistConversationTurns(
    sessionId: UUID,
    turns: ConversationTurn[]
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_tutor_messages')
        .upsert(
          turns.map(turn => ({
            id: turn.id,
            session_id: sessionId,
            role: turn.role,
            content: turn.content,
            timestamp: turn.timestamp,
            metadata: turn.metadata
          }))
        );

      if (error) throw error;

    } catch (error) {
      this.handleError('persist_conversation_turns_failed', error as Error, { sessionId });
    }
  }

  private async loadConversationContext(sessionId: UUID): Promise<ConversationContext | null> {
    try {
      // Load from cache first
      const cachedContext = Array.from(this.conversationContexts.values())
        .find(ctx => ctx.session_id === sessionId);

      if (cachedContext) {
        return cachedContext;
      }

      // Load from database
      const { data: session, error: sessionError } = await this.supabase
        .from('ai_tutor_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      const { data: messages, error: messagesError } = await this.supabase
        .from('ai_tutor_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true });

      if (messagesError) throw messagesError;

      // Build context
      const context: ConversationContext = {
        session_id: sessionId,
        user_id: session.user_id,
        course_id: session.course_id,
        language: session.language || this.options.language,
        difficulty_level: session.difficulty_level || 'intermediate',
        learning_objectives: session.learning_objectives || [],
        conversation_history: messages?.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata
        })) || [],
        current_topic: session.current_topic,
        user_profile: session.user_profile
      };

      // Cache context
      this.conversationContexts.set(`temp_${sessionId}`, context);

      return context;

    } catch (error) {
      this.handleError('load_conversation_context_failed', error as Error, { sessionId });
      return null;
    }
  }

  // =============================================================================
  // RATE LIMITING AND RETRY LOGIC
  // =============================================================================

  private initializeRateLimiting(): void {
    // Reset rate limits every minute
    setInterval(() => {
      const now = new Date();
      for (const [provider, state] of this.rateLimitStates.entries()) {
        const minutesSinceWindowStart = (now.getTime() - state.window_start.getTime()) / (1000 * 60);
        
        if (minutesSinceWindowStart >= 1) {
          state.requests_made = 0;
          state.window_start = now;
          state.blocked_until = undefined;
        }
      }
    }, 60000);
  }

  private checkRateLimit(provider: string): boolean {
    const state = this.rateLimitStates.get(provider);
    if (!state) {
      this.rateLimitStates.set(provider, {
        requests_made: 0,
        window_start: new Date(),
        provider
      });
      return true;
    }

    // Check if we're blocked
    if (state.blocked_until && new Date() < state.blocked_until) {
      return false;
    }

    // Check requests per minute
    return state.requests_made < this.options.rate_limit_rpm;
  }

  private updateRateLimit(provider: string): void {
    const state = this.rateLimitStates.get(provider);
    if (state) {
      state.requests_made++;
      
      // Block if limit exceeded
      if (state.requests_made >= this.options.rate_limit_rpm) {
        state.blocked_until = new Date(Date.now() + 60000); // Block for 1 minute
      }
    }
  }

  private initializeRetryProcessor(): void {
    if (!this.options.enable_retry) return;

    // Process retry queue every 30 seconds
    setInterval(() => {
      this.processRetryQueue();
    }, 30000);
  }

  private addToRetryQueue(
    messageId: string,
    context: ConversationContext,
    userMessage: string
  ): void {
    this.retryQueue.push({
      messageId,
      context,
      userMessage,
      attempts: 0
    });

    this.logActivity('message_added_to_retry_queue', {
      messageId,
      sessionId: context.session_id,
      queueSize: this.retryQueue.length
    });
  }

  private async processRetryQueue(): Promise<void> {
    if (this.retryQueue.length === 0) return;

    const item = this.retryQueue.shift();
    if (!item) return;

    try {
      if (item.attempts >= this.options.retry_attempts) {
        this.logActivity('retry_attempts_exhausted', {
          messageId: item.messageId,
          attempts: item.attempts
        });
        return;
      }

      item.attempts++;

      // Retry the streaming generation
      await this.startStreamingConversation(item.context, item.userMessage);
      
      this.logActivity('retry_successful', {
        messageId: item.messageId,
        attempts: item.attempts
      });

    } catch (error) {
      // Put back in queue for next retry
      this.retryQueue.push(item);
      
      this.handleError('retry_failed', error as Error, {
        messageId: item.messageId,
        attempts: item.attempts
      });
    }
  }

  private initializeContextPersistence(): void {
    if (!this.options.enable_context_persistence) return;

    // Periodic context cleanup
    setInterval(() => {
      this.cleanupOldContexts();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupOldContexts(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [key, context] of this.conversationContexts.entries()) {
      const lastActivity = Math.max(
        ...context.conversation_history.map(turn => turn.timestamp.getTime())
      );
      
      if (lastActivity < oneHourAgo) {
        this.conversationContexts.delete(key);
      }
    }

    this.logActivity('context_cleanup_completed', {
      remainingContexts: this.conversationContexts.size
    });
  }

  // =============================================================================
  // STREAM MANAGEMENT
  // =============================================================================

  /**
   * Cancel an active stream
   */
  async cancelStream(messageId: string): Promise<void> {
    const controller = this.activeStreams.get(messageId);
    if (controller) {
      controller.abort();
      this.activeStreams.delete(messageId);
      
      this.logActivity('stream_cancelled', { messageId });
    }
  }

  /**
   * Cancel all active streams
   */
  async cancelAllStreams(): Promise<void> {
    const messageIds = Array.from(this.activeStreams.keys());
    
    for (const messageId of messageIds) {
      await this.cancelStream(messageId);
    }

    this.logActivity('all_streams_cancelled', { count: messageIds.length });
  }

  /**
   * Get active stream information
   */
  getActiveStreams(): Array<{ messageId: string; startTime: Date }> {
    return Array.from(this.activeStreams.keys()).map(messageId => ({
      messageId,
      startTime: new Date() // In real implementation, track start times
    }));
  }

  // =============================================================================
  // ANALYTICS AND MONITORING
  // =============================================================================

  private updateStreamingStats(responseTime: number, tokenCount: number, success: boolean): void {
    this.streamingStats.messages_streamed++;
    this.streamingStats.total_tokens_used += tokenCount;
    
    // Update average response time
    this.streamingStats.average_response_time = 
      (this.streamingStats.average_response_time * (this.streamingStats.messages_streamed - 1) + responseTime) / 
      this.streamingStats.messages_streamed;

    // Update error rate
    if (!success) {
      this.streamingStats.error_rate = 
        (this.streamingStats.error_rate * (this.streamingStats.messages_streamed - 1) + 1) / 
        this.streamingStats.messages_streamed;
    } else {
      this.streamingStats.error_rate = 
        (this.streamingStats.error_rate * (this.streamingStats.messages_streamed - 1)) / 
        this.streamingStats.messages_streamed;
    }

    // Update provider usage
    this.streamingStats.provider_usage[this.options.provider] = 
      (this.streamingStats.provider_usage[this.options.provider] || 0) + 1;

    this.streamingStats.active_streams = this.activeStreams.size;
  }

  /**
   * Get streaming statistics
   */
  getStreamingStats(): StreamingStats {
    return { ...this.streamingStats };
  }

  /**
   * Get rate limit status for all providers
   */
  getRateLimitStatus(): Record<string, RateLimitState> {
    const status: Record<string, RateLimitState> = {};
    
    for (const [provider, state] of this.rateLimitStates.entries()) {
      status[provider] = { ...state };
    }

    return status;
  }

  /**
   * Health check for monitoring
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: StreamingStats;
    rate_limits: Record<string, RateLimitState>;
    diagnostics: Record<string, any>;
    issues: string[];
  }> {
    const issues: string[] = [];
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Check error rate
    if (this.streamingStats.error_rate > 0.1) {
      issues.push(`High error rate: ${(this.streamingStats.error_rate * 100).toFixed(2)}%`);
      status = 'degraded';
    }

    // Check response times
    if (this.streamingStats.average_response_time > 10000) {
      issues.push(`High response times: ${this.streamingStats.average_response_time}ms`);
      status = status === 'healthy' ? 'degraded' : 'unhealthy';
    }

    // Check rate limits
    const rateLimits = this.getRateLimitStatus();
    for (const [provider, state] of Object.entries(rateLimits)) {
      if (state.blocked_until && new Date() < state.blocked_until) {
        issues.push(`Rate limited: ${provider}`);
        status = status === 'healthy' ? 'degraded' : 'unhealthy';
      }
    }

    // Check retry queue size
    if (this.retryQueue.length > 10) {
      issues.push(`Large retry queue: ${this.retryQueue.length} items`);
      status = status === 'healthy' ? 'degraded' : 'unhealthy';
    }

    return {
      status,
      metrics: this.streamingStats,
      rate_limits: rateLimits,
      diagnostics: {
        active_streams: this.activeStreams.size,
        cached_contexts: this.conversationContexts.size,
        retry_queue_size: this.retryQueue.length,
        provider: this.options.provider,
        model: this.options.model,
        streaming_enabled: this.options.streaming
      },
      issues
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleStreamingError(error: Error, messageId: string, callbacks: StreamingCallback): void {
    this.handleError('streaming_error', error, { messageId });
    callbacks.onError?.(error, messageId);
    callbacks.onTypingStop?.();
  }

  private logActivity(event: string, data?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.console) {
      console.log(`[AiTutorStreamManager] ${event}`, data);
    }
  }

  private handleError(context: string, error: Error, data?: Record<string, any>): void {
    if (typeof window !== 'undefined' && window.console) {
      console.error(`[AiTutorStreamManager] ${context}:`, error, data);
    }
  }

  // =============================================================================
  // CLEANUP
  // =============================================================================

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    // Cancel all active streams
    await this.cancelAllStreams();

    // Clear all state
    this.conversationContexts.clear();
    this.rateLimitStates.clear();
    this.messageQueue.clear();
    this.retryQueue = [];

    this.logActivity('ai_tutor_stream_manager_destroyed');
  }
}

// =============================================================================
// SINGLETON INSTANCE AND FACTORY
// =============================================================================

let tutorStreamManager: AiTutorStreamManager | null = null;

/**
 * Get singleton instance of AiTutorStreamManager
 */
export function getTutorStreamManager(
  supabase: SupabaseClient,
  options?: Partial<TutorStreamOptions>
): AiTutorStreamManager {
  if (!tutorStreamManager) {
    tutorStreamManager = new AiTutorStreamManager(supabase, options);
  }
  return tutorStreamManager;
}

/**
 * Create new instance of AiTutorStreamManager
 */
export function createTutorStreamManager(
  supabase: SupabaseClient,
  options?: Partial<TutorStreamOptions>
): AiTutorStreamManager {
  return new AiTutorStreamManager(supabase, options);
}

// =============================================================================
// REACT HOOKS INTEGRATION
// =============================================================================

export interface UseTutorStreamOptions extends Partial<TutorStreamOptions> {
  sessionId?: UUID;
  autoStart?: boolean;
  onMessageStream?: StreamingCallback;
}

/**
 * React hook for AI tutor streaming (usage example)
 */
export function createTutorStreamHook() {
  return function useTutorStream(
    supabase: SupabaseClient,
    options: UseTutorStreamOptions = {}
  ) {
    // This would be implemented as a proper React hook
    // For now, just return the manager setup
    const manager = getTutorStreamManager(supabase, options);
    
    return {
      manager,
      sendMessage: (message: string, callbacks?: StreamingCallback) => {
        if (options.sessionId) {
          return manager.continueConversation(options.sessionId, message, {
            ...options.onMessageStream,
            ...callbacks
          });
        }
        throw new Error('Session ID required for sending messages');
      },
      cancelStream: manager.cancelStream.bind(manager),
      getStats: manager.getStreamingStats.bind(manager)
    };
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default AiTutorStreamManager;

export {
  type StreamingMessage,
  type StreamingCallback,
  type TutorStreamOptions,
  type ConversationContext,
  type StreamingStats,
  type RateLimitState
};