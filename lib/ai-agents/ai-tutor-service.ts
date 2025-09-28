import { AITutorClient } from "@/utils/ai/ai-tutor-client";
import { Course } from "@/lib/types/course";
import {
  AITutorSession,
  TutorMessage,
  TutorResponse,
  ExamSession,
} from "@/lib/exam-engine/types";

export class AITutorService {
  private aiClient: AITutorClient;

  constructor() {
    this.aiClient = AITutorClient.getInstance();
  }

  /**
   * Start a new tutoring session
   */
  async createTutorSession(
    userId: string,
    courseId: string,
    topic: string
  ): Promise<AITutorSession> {
    try {
      // Create session using AI client
      const aiSession = await this.aiClient.createSession({
        userId,
        courseId,
        topic,
      });

      // Return session data
      return {
        id: aiSession.id,
        userId: aiSession.userId,
        courseId: aiSession.courseId,
        aiSessionMetadata: aiSession.aiSessionMetadata,
        topic: aiSession.topic,
        startedAt: new Date(aiSession.createdAt),
        status: aiSession.status,
        createdAt: aiSession.createdAt,
      };
    } catch (err) {
      console.error("Error starting tutoring session:", err);
      throw new Error("Failed to start tutoring session");
    }
  }

  /**
   * Send a message to the AI tutor and get response
   */
  async sendMessage(
    sessionId: string,
    message: string,
    courseContext?: any
  ): Promise<TutorResponse> {
    try {
      // Send message using AI client
      const response = await this.aiClient.sendMessage(
        sessionId,
        message,
        courseContext
      );

      return {
        id: `resp_${Date.now()}`,
        content: response.message,
        sessionId: response.sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Error sending message to tutor:", err);
      throw new Error("Failed to communicate with AI tutor");
    }
  }

  /**
   * End a tutoring session
   */
  async endTutoringSession(sessionId: string): Promise<boolean> {
    try {
      // End session using AI client
      const result = await this.aiClient.endSession(sessionId);
      return result.success;
    } catch (err) {
      console.error("Error ending tutoring session:", err);
      throw new Error("Failed to end tutoring session");
    }
  }

  /**
   * Provide exam-specific tutoring
   */
  async provideExamTutoring(
    sessionId: string,
    examSession: ExamSession,
    question: string,
    course: Course
  ): Promise<TutorResponse> {
    try {
      // Create exam-specific message
      const examMessage = `I'm preparing for a ${examSession.sessionType} exam in ${course.language} at ${course.level} level. The exam is from ${course.certification_type}. 

Question: ${question}

Please provide guidance that aligns with the official exam standards and assessment criteria. Focus on strategies, tips, and explanations that would help me improve my performance.`;

      // Send message with course context
      const response = await this.aiClient.sendMessage(
        sessionId,
        examMessage,
        course
      );

      return {
        id: `resp_${Date.now()}`,
        content: response.message,
        sessionId: response.sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Error providing exam tutoring:", err);
      throw new Error("Failed to provide exam-specific tutoring");
    }
  }

  /**
   * Provide progress-based recommendations
   */
  async provideProgressRecommendations(
    sessionId: string,
    progressData: any,
    courseContext?: any
  ): Promise<TutorResponse> {
    try {
      // Create progress-based message
      const progressMessage = `Based on my learning progress: Overall progress: ${progressData.overallProgress || 0}%, Component progress: ${JSON.stringify(progressData.componentProgress || {})}, Strengths: ${progressData.strengths?.join(", ") || "None identified"}, Weaknesses: ${progressData.weaknesses?.join(", ") || "None identified"}. 

Please provide personalized learning recommendations focusing on: 1. Areas that need improvement, 2. Strengths to build upon, 3. Specific study strategies, 4. Resources or practice activities.`;

      // Send message with course context
      const response = await this.aiClient.sendMessage(
        sessionId,
        progressMessage,
        courseContext
      );

      return {
        id: `resp_${Date.now()}`,
        content: response.message,
        sessionId: response.sessionId,
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.error("Error providing progress recommendations:", err);
      throw new Error("Failed to provide progress recommendations");
    }
  }

}

// Export a singleton instance
export const aiTutorService = new AITutorService();
