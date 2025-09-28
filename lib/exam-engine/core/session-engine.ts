// Define types for session data
interface AnswerData {
  answer: unknown;
  score?: unknown;
  timestamp: number;
}

interface SessionProgress {
  [key: string]: unknown;
}

export interface SessionData {
  sessionId: string;
  userId: string;
  examId: string;
  startTime: number;
  lastActivity: number;
  answers: Map<string, AnswerData>;
  progress: SessionProgress;
  state: "active" | "paused" | "completed" | "abandoned";
}

// Define a proper type for callback functions
type SessionCallback = (data?: unknown) => void;

// Define the ExamSession interface
interface ExamSession {
  id: string;
  userId: string;
  courseId: string;
  progressId: string;
  status: "active" | "completed" | "abandoned";
  startedAt: string;
  finishedAt?: string;
  timeRemaining?: number;
  currentQuestionIndex?: number;
  answers: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export class SessionEngine {
  private sessionData: SessionData;
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private callbacks: Map<string, SessionCallback[]> = new Map();

  constructor(userId: string, sessionId?: string) {
    this.sessionData = {
      sessionId: sessionId || this.generateSessionId(),
      userId,
      examId: "",
      startTime: Date.now(),
      lastActivity: Date.now(),
      answers: new Map(),
      progress: {},
      state: "active",
    };
  }

  async initialize(): Promise<void> {
    // Initialize session
    this.startAutoSave();
    this.emit("sessionInitialized", this.sessionData);
  }

  async saveProgress(answerData: {
    questionId: string;
    answer: unknown;
    score?: unknown;
    timestamp: number;
  }): Promise<void> {
    // Update session data
    this.sessionData.answers.set(answerData.questionId, {
      answer: answerData.answer,
      score: answerData.score,
      timestamp: answerData.timestamp,
    });

    this.sessionData.lastActivity = Date.now();

    // In a real implementation, this would save to the database
    // For now, we'll use localStorage as a fallback
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `session_${this.sessionData.sessionId}`,
        JSON.stringify(this.exportData())
      );
    }

    this.emit("progressSaved", answerData);
  }

  async autoSave(): Promise<void> {
    // Auto-save current state
    if (typeof window !== "undefined") {
      localStorage.setItem(
        `session_${this.sessionData.sessionId}`,
        JSON.stringify(this.exportData())
      );
    }

    this.emit("autoSave", this.sessionData);
  }

  async finishExam(finalResult: unknown): Promise<string> {
    this.sessionData.state = "completed";

    // Stop auto-save
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    // In a real implementation, this would save final results to database
    const resultId = this.generateResultId();

    this.emit("examFinished", { resultId, finalResult });

    return resultId;
  }

  pause(): void {
    this.sessionData.state = "paused";
    this.emit("sessionPaused", this.sessionData);
  }

  resume(): void {
    this.sessionData.state = "active";
    this.sessionData.lastActivity = Date.now();
    this.emit("sessionResumed", this.sessionData);
  }

  abandon(): void {
    this.sessionData.state = "abandoned";

    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.emit("sessionAbandoned", this.sessionData);
  }

  getAllAnswers(): Map<string, AnswerData> {
    return new Map(this.sessionData.answers);
  }

  getSessionId(): string {
    return this.sessionData.sessionId;
  }

  getSessionState(): "active" | "paused" | "completed" | "abandoned" {
    return this.sessionData.state;
  }

  getLastActivity(): number {
    return this.sessionData.lastActivity;
  }

  getDuration(): number {
    return Date.now() - this.sessionData.startTime;
  }

  // Export session data for persistence
  exportData(): unknown {
    return {
      sessionId: this.sessionData.sessionId,
      userId: this.sessionData.userId,
      examId: this.sessionData.examId,
      startTime: this.sessionData.startTime,
      lastActivity: this.sessionData.lastActivity,
      answers: Object.fromEntries(this.sessionData.answers),
      progress: this.sessionData.progress,
      state: this.sessionData.state,
    };
  }

  // Import session data from persistence
  importData(data: unknown): void {
    if (typeof data === 'object' && data !== null) {
      const sessionData = data as Partial<SessionData>;
      this.sessionData = {
        sessionId: sessionData.sessionId || this.generateSessionId(),
        userId: sessionData.userId || "",
        examId: sessionData.examId || "",
        startTime: sessionData.startTime || Date.now(),
        lastActivity: sessionData.lastActivity || Date.now(),
        answers: new Map(Object.entries(sessionData.answers || {})),
        progress: sessionData.progress || {},
        state: sessionData.state || "active",
      };
    }

    this.emit("sessionImported", data);
  }

  // Event system
  on(event: string, callback: SessionCallback): void {
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

  private startAutoSave(): void {
    // Auto-save every 60 seconds
    this.autoSaveInterval = setInterval(() => {
      this.autoSave();
    }, 60000);
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateResultId(): string {
    return `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

