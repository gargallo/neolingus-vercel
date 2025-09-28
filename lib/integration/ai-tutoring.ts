import { SupabaseClient } from "@supabase/supabase-js";
import { AITutorService } from "@/lib/ai-agents/services/ai-tutor-service";

export class AITutoringIntegration {
  private supabase: SupabaseClient;
  private aiTutorService: AITutorService;

  constructor(supabaseClient: SupabaseClient, aiTutorService: AITutorService) {
    this.supabase = supabaseClient;
    this.aiTutorService = aiTutorService;
  }

  async startTutoringSession(sessionData: {
    userId: string;
    courseId: string;
    topic: string;
  }) {
    try {
      // Create session with AI Tutor Service
      const aiSession = await this.aiTutorService.createSession({
        userId: sessionData.userId,
        courseId: sessionData.courseId,
        topic: sessionData.topic,
      });

      // Store session in our database with AI metadata
      const { data, error } = await this.supabase
        .from("ai_tutor_sessions")
        .insert([
          {
            user_id: sessionData.userId,
            course_id: sessionData.courseId,
            ai_session_metadata: {
              session_id: aiSession.id,
              provider: 'anthropic',
              model: 'claude-3-sonnet-20240229',
              created_at: new Date().toISOString(),
            },
            topic: sessionData.topic,
            started_at: new Date().toISOString(),
            status: "active",
          },
        ])
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async sendTutorMessage(messageData: {
    sessionId: string;
    aiSessionId: string;
    userId: string;
    courseId: string;
    message: string;
  }) {
    try {
      // Save user message
      const { data: userMessage, error: userMessageError } = await this.supabase
        .from("ai_tutor_messages")
        .insert([
          {
            session_id: messageData.sessionId,
            sender: "user",
            content: messageData.message,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (userMessageError) {
        return {
          success: false,
          error: userMessageError.message,
        };
      }

      // Send message to AI Tutor Service
      const aiResponse = await this.aiTutorService.sendMessage(
        messageData.aiSessionId,
        messageData.message
      );

      // Save AI response
      const { data: aiMessage, error: aiMessageError } = await this.supabase
        .from("ai_tutor_messages")
        .insert([
          {
            session_id: messageData.sessionId,
            sender: "ai",
            content: aiResponse.content,
            timestamp: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (aiMessageError) {
        return {
          success: false,
          error: aiMessageError.message,
        };
      }

      return {
        success: true,
        data: {
          userMessage,
          reply: aiMessage,
          aiResponse,
        },
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async getConversationHistory(sessionId: string) {
    try {
      const { data, error } = await this.supabase
        .from("ai_tutor_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("timestamp", { ascending: true });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async endTutoringSession(sessionId: string, aiSessionId: string) {
    try {
      // End session in AI Tutor Service
      await this.aiTutorService.endSession(aiSessionId);

      // Update session status in our database
      const { data, error } = await this.supabase
        .from("ai_tutor_sessions")
        .update({
          ended_at: new Date().toISOString(),
          status: "completed",
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }

  async getTutoringSessionHistory(userId: string, courseId: string) {
    try {
      const { data, error } = await this.supabase
        .from("ai_tutor_sessions")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .order("started_at", { ascending: false });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data || [],
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error occurred",
      };
    }
  }
}