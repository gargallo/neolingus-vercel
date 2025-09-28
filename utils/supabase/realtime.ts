import { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import { UserProgress, ExamSession } from "@/lib/exam-engine/types";

// Create a singleton Supabase client for realtime subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Subscribe to user progress updates
 */
export function subscribeToProgressUpdates(
  userId: string,
  courseId: string,
  callback: (progress: UserProgress) => void
) {
  return supabase
    .channel(`progress:${userId}:${courseId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "user_course_progress",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as UserProgress);
      }
    )
    .subscribe();
}

/**
 * Subscribe to exam session updates
 */
export function subscribeToExamSessionUpdates(
  sessionId: string,
  callback: (session: ExamSession) => void
) {
  return supabase
    .channel(`exam-session:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "exam_sessions",
        filter: `id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new as ExamSession);
      }
    )
    .subscribe();
}

/**
 * Subscribe to AI tutor messages
 */
export function subscribeToTutorMessages(
  sessionId: string,
  callback: (message: any) => void
) {
  return supabase
    .channel(`tutor-messages:${sessionId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "ai_tutor_messages",
        filter: `session_id=eq.${sessionId}`,
      },
      (payload) => {
        callback(payload.new);
      }
    )
    .subscribe();
}

/**
 * Unsubscribe from all channels
 */
export function unsubscribeAll() {
  supabase.removeAllChannels();
}

export class RealtimeSubscriptionManager {
  private supabase: SupabaseClient;
  private subscriptions: Map<string, any> = new Map();

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Subscribe to progress updates for a specific course
   */
  subscribeToProgressUpdates(
    userId: string,
    courseId: string,
    callback: (progress: UserProgress) => void
  ) {
    const channelName = `progress:${userId}:${courseId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_course_progress",
          filter: `user_id=eq.${userId},course_id=eq.${courseId}`,
        },
        (payload) => {
          callback(payload.new as UserProgress);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channelName;
  }

  /**
   * Subscribe to exam session updates
   */
  subscribeToExamSessionUpdates(
    sessionId: string,
    callback: (session: ExamSession) => void
  ) {
    const channelName = `exam-session:${sessionId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "exam_sessions",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new as ExamSession);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channelName;
  }

  /**
   * Subscribe to AI tutor message updates
   */
  subscribeToTutorMessages(
    sessionId: string,
    callback: (message: any) => void
  ) {
    const channelName = `tutor-messages:${sessionId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_tutor_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channelName;
  }

  /**
   * Subscribe to user enrollment updates
   */
  subscribeToEnrollmentUpdates(
    userId: string,
    callback: (enrollment: any) => void
  ) {
    const channelName = `enrollments:${userId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_course_enrollments",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new);
        }
      )
      .subscribe();

    this.subscriptions.set(channelName, channel);
    return channelName;
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string) {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      this.supabase.removeChannel(channel);
      this.subscriptions.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    for (const [channelName, channel] of this.subscriptions) {
      this.supabase.removeChannel(channel);
    }
    this.subscriptions.clear();
  }

  /**
   * Subscribe to presence updates for collaborative features
   */
  subscribeToPresence(
    roomId: string,
    userId: string,
    userName: string,
    callback: (presence: any) => void
  ) {
    const channelName = `presence:${roomId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(channelName)) {
      this.unsubscribe(channelName);
    }

    const channel = this.supabase
      .channel(channelName)
      .on("presence", { event: "sync" }, () => {
        const presence = this.supabase.channel(channelName).presenceState();
        callback(presence);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await this.supabase.channel(channelName).track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    this.subscriptions.set(channelName, channel);
    return channelName;
  }
}

// Export a singleton instance
let realtimeManager: RealtimeSubscriptionManager | null = null;

export function getRealtimeManager(supabase: SupabaseClient) {
  if (!realtimeManager) {
    realtimeManager = new RealtimeSubscriptionManager(supabase);
  }
  return realtimeManager;
}

// Export types for convenience
export type ProgressUpdateCallback = (progress: UserProgress) => void;
export type ExamSessionUpdateCallback = (session: ExamSession) => void;
export type TutorMessageCallback = (message: any) => void;
export type EnrollmentUpdateCallback = (enrollment: any) => void;
export type PresenceUpdateCallback = (presence: any) => void;
