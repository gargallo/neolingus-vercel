/**
 * AI Tutor Client for Educational Interactions
 * Neolingus Academy - Direct AI SDK Integration
 * 
 * Uses Anthropic Claude for educational tutoring with course-specific context
 */

import { anthropic } from "@ai-sdk/anthropic";
import { generateText, streamText } from "ai";
import { createSupabaseClient } from "@/utils/supabase/client";

// AI Tutor Configuration Interface
export interface AITutorConfig {
  provider: "anthropic" | "openai" | "google";
  model: string;
  maxTokens: number;
  temperature: number;
  enableLogging: boolean;
  timeoutMs: number;
  sessionTimeoutMinutes: number;
}

// AI Tutor Session Interface
export interface AITutorSession {
  id: string;
  userId: string;
  courseId: string;
  topic?: string;
  status: "active" | "completed" | "expired";
  aiSessionMetadata: {
    provider: string;
    model: string;
    conversationTokens: number;
    lastInteraction: string;
  };
  createdAt: string;
  updatedAt: string;
}

// AI Tutor Message Interface
export interface AITutorMessage {
  id: string;
  sessionId: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
}

// AI Tutor Response Interface
export interface AITutorResponse {
  message: string;
  suggestions: string[];
  resources: Array<{
    title: string;
    url?: string;
    type: "exercise" | "explanation" | "tip" | "resource";
  }>;
  sessionId: string;
  metadata: {
    model: string;
    tokensUsed: number;
    responseTime: number;
  };
}

// Default AI Configuration
const defaultAIConfig: AITutorConfig = {
  provider: "anthropic",
  model: "claude-3-sonnet-20240229",
  maxTokens: 500,
  temperature: 0.7,
  enableLogging: true,
  timeoutMs: 15000,
  sessionTimeoutMinutes: 60,
};

// Environment-based AI Configuration
export const aiTutorConfig: AITutorConfig = {
  provider: (typeof window === 'undefined' ? process.env.AI_PROVIDER : "anthropic") as any || "anthropic",
  model: (typeof window === 'undefined' ? process.env.AI_MODEL : null) || defaultAIConfig.model,
  ...defaultAIConfig,
};

// Validate AI Configuration (server-side only)
function validateAIConfig(config: AITutorConfig): void {
  // Skip validation on client side - will be validated on server
  if (typeof window !== 'undefined') {
    return;
  }
  
  if (!process.env.ANTHROPIC_API_KEY && config.provider === "anthropic") {
    throw new Error("ANTHROPIC_API_KEY is required for AI tutoring");
  }
}

// AI Tutor Client
export class AITutorClient {
  private config: AITutorConfig;
  private static instance: AITutorClient;
  private supabase: any;

  constructor(config: AITutorConfig = aiTutorConfig) {
    validateAIConfig(config);
    this.config = config;
    this.initializeSupabase();
  }

  private initializeSupabase() {
    this.supabase = createSupabaseClient();
  }

  // Singleton pattern
  static getInstance(): AITutorClient {
    if (!AITutorClient.instance) {
      AITutorClient.instance = new AITutorClient();
    }
    return AITutorClient.instance;
  }

  /**
   * Create new AI tutoring session
   */
  async createSession(params: {
    userId: string;
    courseId: string;
    topic?: string;
  }): Promise<AITutorSession> {
    const { userId, courseId, topic } = params;
    
    if (!this.supabase) {
      await this.initializeSupabase();
    }

    const sessionData = {
      user_id: userId,
      course_id: courseId,
      topic: topic || "General tutoring",
      ai_session_metadata: {
        provider: this.config.provider,
        model: this.config.model,
        conversationTokens: 0,
        lastInteraction: new Date().toISOString(),
      },
      status: "active" as const,
    };

    const { data: session, error } = await this.supabase
      .from("ai_tutor_sessions")
      .insert([sessionData])
      .select()
      .single();

    if (error) {
      console.error("Error creating AI session:", error);
      throw new Error("Failed to create AI tutoring session");
    }

    return {
      id: session.id,
      userId: session.user_id,
      courseId: session.course_id,
      topic: session.topic,
      status: session.status,
      aiSessionMetadata: session.ai_session_metadata,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    };
  }

  /**
   * Send message to AI tutor and get response
   */
  async sendMessage(
    sessionId: string,
    userMessage: string,
    courseContext?: any
  ): Promise<AITutorResponse> {
    const startTime = performance.now();

    if (!this.supabase) {
      await this.initializeSupabase();
    }

    // Get session details
    const { data: session, error: sessionError } = await this.supabase
      .from("ai_tutor_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error(`AI tutoring session ${sessionId} not found`);
    }

    // Get recent conversation history
    const { data: recentMessages } = await this.supabase
      .from("ai_tutor_messages")
      .select("sender, content")
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: false })
      .limit(10);

    // Build conversation context
    const conversationHistory = (recentMessages || [])
      .reverse()
      .map(m => `${m.sender === "user" ? "Human" : "Assistant"}: ${m.content}`)
      .join("\n");

    // Create educational prompt
    const systemPrompt = this.buildEducationalPrompt(
      courseContext,
      conversationHistory,
      userMessage
    );

    try {
      // Generate AI response
      const { text: aiResponse } = await generateText({
        model: anthropic(this.config.model),
        prompt: systemPrompt,
        maxTokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      // Save user message
      await this.supabase.from("ai_tutor_messages").insert([{
        session_id: sessionId,
        sender: "user",
        content: userMessage,
      }]);

      // Save AI response
      await this.supabase.from("ai_tutor_messages").insert([{
        session_id: sessionId,
        sender: "ai",
        content: aiResponse,
      }]);

      // Update session metadata
      const updatedMetadata = {
        ...session.ai_session_metadata,
        conversationTokens: (session.ai_session_metadata.conversationTokens || 0) + 100, // Estimate
        lastInteraction: new Date().toISOString(),
      };

      await this.supabase
        .from("ai_tutor_sessions")
        .update({
          ai_session_metadata: updatedMetadata,
          updated_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      const duration = performance.now() - startTime;

      if (this.config.enableLogging) {
        console.log(`[AI Tutor] Response generated for session ${sessionId} in ${duration.toFixed(2)}ms`);
      }

      return {
        message: aiResponse,
        suggestions: this.extractSuggestions(aiResponse),
        resources: this.generateResources(courseContext),
        sessionId,
        metadata: {
          model: this.config.model,
          tokensUsed: 100, // Estimate - can be improved with actual token counting
          responseTime: duration,
        },
      };

    } catch (error) {
      console.error(`[AI Tutor] Error generating response:`, error);
      throw new Error("Failed to generate AI response");
    }
  }

  /**
   * End AI tutoring session
   */
  async endSession(sessionId: string): Promise<{ success: boolean }> {
    if (!this.supabase) {
      await this.initializeSupabase();
    }

    const { error } = await this.supabase
      .from("ai_tutor_sessions")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Error ending AI session:", error);
      return { success: false };
    }

    if (this.config.enableLogging) {
      console.log(`[AI Tutor] Ended session ${sessionId}`);
    }

    return { success: true };
  }

  /**
   * Build educational prompt for AI tutor
   */
  private buildEducationalPrompt(
    courseContext: any,
    conversationHistory: string,
    userMessage: string
  ): string {
    const course = courseContext || {};
    
    return `You are an AI tutor for ${course.title || "language learning"} (${course.language || ""} ${course.level || ""}).
You help students prepare for ${(course.certification_type || "").toUpperCase()} certification exams.

Course components: ${course.components ? JSON.parse(course.components).join(", ") : "reading, writing, listening, speaking"}

Guidelines:
- Provide clear, educational explanations
- Focus on exam preparation strategies  
- Give specific examples relevant to ${(course.certification_type || "").toUpperCase()} format
- Keep responses concise but helpful (max 500 words)
- Encourage the student's learning journey
- Be supportive and constructive

Recent conversation:
${conversationHistory}

Current student message: ${userMessage}

Respond as a helpful, encouraging tutor:`;
  }

  /**
   * Extract suggestions from AI response
   */
  private extractSuggestions(aiResponse: string): string[] {
    // Simple extraction - can be improved with more sophisticated parsing
    const suggestions: string[] = [];
    
    if (aiResponse.includes("practice")) {
      suggestions.push("Continue practicing this concept");
    }
    if (aiResponse.includes("review")) {
      suggestions.push("Review related material");
    }
    if (aiResponse.includes("example")) {
      suggestions.push("Try more examples");
    }
    
    return suggestions.slice(0, 3); // Max 3 suggestions
  }

  /**
   * Generate educational resources
   */
  private generateResources(courseContext: any): Array<{
    title: string;
    url?: string;
    type: "exercise" | "explanation" | "tip" | "resource";
  }> {
    const course = courseContext || {};
    const resources = [];

    if (course.certification_type === "eoi") {
      resources.push({
        title: "EOI Official Exam Format",
        type: "explanation" as const,
      });
    }

    if (course.certification_type === "jqcv") {
      resources.push({
        title: "JQCV Valenciano Guidelines",
        type: "explanation" as const,
      });
    }

    resources.push({
      title: "Practice Exercise",
      type: "exercise" as const,
    });

    return resources.slice(0, 3); // Max 3 resources
  }
}

// Singleton AI Tutor instance
export const aiTutorClient = AITutorClient.getInstance();

// Helper functions for easy access
export const aiTutor = {
  createSession: aiTutorClient.createSession.bind(aiTutorClient),
  sendMessage: aiTutorClient.sendMessage.bind(aiTutorClient),
  endSession: aiTutorClient.endSession.bind(aiTutorClient),
};

export default aiTutorClient;