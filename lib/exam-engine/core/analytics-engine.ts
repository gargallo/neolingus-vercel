// Define types for analytics data
type AnalyticsEventData = Record<string, unknown>;

export interface AnalyticsEvent {
  eventType: string;
  eventData: AnalyticsEventData;
  timestamp: number;
  sessionId?: string;
  userId?: string;
}

// Define a proper type for callback functions
type AnalyticsCallback = (data?: unknown) => void;

// Define the ProgressReport interface
interface ProgressReport {
  userId: string;
  courseId: string;
  overallProgress: number;
  componentProgress: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  lastUpdated: string;
}

// Define the ExamAnalytics interface
interface ExamAnalytics {
  sessionId: string;
  accuracyRate: number;
  timePerQuestion: number;
  skillBreakdown: Record<string, number>;
  improvementAreas: string[];
  lastUpdated: string;
}

export class AnalyticsEngine {
  private userId: string;
  private examId: string;
  private events: AnalyticsEvent[] = [];
  private callbacks: Map<string, AnalyticsCallback[]> = new Map();

  constructor(userId: string, examId: string) {
    this.userId = userId;
    this.examId = examId;
  }

  async trackEvent(eventType: string, eventData?: AnalyticsEventData): Promise<void> {
    const event: AnalyticsEvent = {
      eventType,
      eventData: eventData || {},
      timestamp: Date.now(),
      userId: this.userId,
    };

    this.events.push(event);

    // In a real implementation, this would send to analytics service
    // For now, we'll just log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log("Analytics Event:", event);
    }

    this.emit("eventTracked", event);
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getEventsByType(eventType: string): AnalyticsEvent[] {
    return this.events.filter((event) => event.eventType === eventType);
  }

  // Common event tracking methods
  async trackExamStarted(): Promise<void> {
    await this.trackEvent("exam_started", {
      examId: this.examId,
      timestamp: Date.now(),
    });
  }

  async trackAnswerSubmitted(
    questionId: string,
    timeSpent: number,
    correct: boolean
  ): Promise<void> {
    await this.trackEvent("answer_submitted", {
      questionId,
      timeSpent,
      correct,
      examId: this.examId,
    });
  }

  async trackSectionChanged(
    fromSection: string,
    toSection: string
  ): Promise<void> {
    await this.trackEvent("section_changed", {
      fromSection,
      toSection,
      examId: this.examId,
    });
  }

  async trackExamCompleted(
    finalScore: number,
    timeUsed: number
  ): Promise<void> {
    await this.trackEvent("exam_completed", {
      examId: this.examId,
      finalScore,
      timeUsed,
      completedAt: Date.now(),
    });
  }

  async trackTimeWarning(minutesRemaining: number): Promise<void> {
    await this.trackEvent("time_warning", {
      minutesRemaining,
      examId: this.examId,
    });
  }

  async trackExamPaused(): Promise<void> {
    await this.trackEvent("exam_paused", {
      examId: this.examId,
      pausedAt: Date.now(),
    });
  }

  async trackExamResumed(): Promise<void> {
    await this.trackEvent("exam_resumed", {
      examId: this.examId,
      resumedAt: Date.now(),
    });
  }

  // Generate progress report
  async generateProgressReport(
    userId: string,
    courseId: string,
    _options: unknown
  ): Promise<ProgressReport> {
    // Implementation would go here
    return {
      userId,
      courseId,
      overallProgress: 0,
      componentProgress: {},
      strengths: [],
      weaknesses: [],
      recommendations: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Generate exam performance analytics
   */
  async generateExamAnalytics(
    sessionId: string,
    _detailedResults: unknown
  ): Promise<ExamAnalytics> {
    // Implementation would go here
    return {
      sessionId,
      accuracyRate: 0,
      timePerQuestion: 0,
      skillBreakdown: {},
      improvementAreas: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  // Event system
  on(event: string, callback: AnalyticsCallback): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  private emit(event: string, data?: unknown): void {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  // Export analytics data
  exportData(): unknown {
    return {
      userId: this.userId,
      examId: this.examId,
      events: this.events,
      summary: {
        totalEvents: this.events.length,
        eventTypes: [...new Set(this.events.map((e) => e.eventType))],
        timeSpan: {
          start: Math.min(...this.events.map((e) => e.timestamp)),
          end: Math.max(...this.events.map((e) => e.timestamp)),
        },
      },
    };
  }
}