import { CourseConfiguration } from "../types/course-config";
import { ExamConfiguration } from "../types/exam-config";
import { TimerEngine } from "./timer-engine";
import { ProgressEngine } from "./progress-engine";
import { SessionEngine } from "./session-engine";
import { ScoringEngine } from "./scoring-engine";
import { AnalyticsEngine } from "./analytics-engine";

// Define a proper type for callback functions
type EngineCallback = (data?: unknown) => void;

export interface ExamEngineOptions {
  courseConfig: CourseConfiguration;
  examId: string;
  userId: string;
  sessionId?: string;
}

export interface EngineState {
  isInitialized: boolean;
  isPaused: boolean;
  isComplete: boolean;
  currentSection: string;
  currentQuestion: string;
  timeRemaining: number;
  progress: {
    answeredQuestions: number;
    totalQuestions: number;
    sectionProgress: { [sectionId: string]: number };
    percentage: number;
  };
}

export class UniversalExamEngine {
  private courseConfig: CourseConfiguration;
  private examConfig: ExamConfiguration;
  private timer: TimerEngine;
  private progress: ProgressEngine;
  private session: SessionEngine;
  private scoring: ScoringEngine;
  private analytics: AnalyticsEngine;

  private state: EngineState;
  private callbacks: Map<string, EngineCallback[]> = new Map();

  constructor(options: ExamEngineOptions) {
    this.courseConfig = options.courseConfig;
    this.examConfig = options.courseConfig.examConfigs[options.examId];

    if (!this.examConfig) {
      throw new Error(`Exam configuration not found: ${options.examId}`);
    }

    // Initialize engines
    this.timer = new TimerEngine(this.examConfig.settings);
    this.progress = new ProgressEngine(this.examConfig);
    this.session = new SessionEngine(options.userId, options.sessionId);
    this.scoring = new ScoringEngine(this.examConfig.scoring);
    this.analytics = new AnalyticsEngine(options.userId, options.examId);

    // Initialize state
    this.state = {
      isInitialized: false,
      isPaused: false,
      isComplete: false,
      currentSection: "",
      currentQuestion: "",
      timeRemaining: this.examConfig.metadata.duration * 60,
      progress: {
        answeredQuestions: 0,
        totalQuestions: this.examConfig.metadata.totalQuestions,
        sectionProgress: {},
        percentage: 0,
      },
    };

    this.setupEventHandlers();
  }

  // ✅ UNIVERSAL: Timer management
  async startExam(): Promise<void> {
    try {
      await this.session.initialize();
      await this.analytics.trackEvent("exam_started");

      this.state.currentSection = this.examConfig.sections[0].id;
      this.state.isInitialized = true;

      this.timer.start(this.examConfig.metadata.duration);
      this.emit("examStarted", this.state);
    } catch (error) {
      console.error("Failed to start exam:", error);
      throw error;
    }
  }

  // ✅ UNIVERSAL: Answer submission with course-specific scoring
  async submitAnswer(questionId: string, answer: unknown): Promise<void> {
    try {
      // Record answer
      const result = await this.progress.recordAnswer(questionId, answer);

      // Score answer using course-specific criteria
      const score = await this.scoring.scoreAnswer(questionId, answer, {
        language: this.courseConfig.metadata.language,
        culturalContext: this.courseConfig.metadata.culturalContext,
        scoringAdjustments: this.courseConfig.scoringAdjustments,
      });

      // Update state
      this.state.progress = result;

      // Auto-save
      if (this.examConfig.settings.autoSave) {
        await this.session.saveProgress({
          questionId,
          answer,
          score,
          timestamp: Date.now(),
        });
      }

      // Analytics
      await this.analytics.trackEvent("answer_submitted", {
        questionId,
        timeSpent: this.getTimeSpentOnQuestion(questionId),
        correct: score.isCorrect,
      });

      this.emit("answerSubmitted", {
        questionId,
        answer,
        score,
        progress: this.state.progress,
      });
    } catch (error) {
      console.error("Failed to submit answer:", error);
      throw error;
    }
  }

  // ✅ UNIVERSAL: Navigation with course-specific sections
  async navigateToSection(sectionId: string): Promise<void> {
    const section = this.examConfig.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    this.state.currentSection = sectionId;
    this.state.currentQuestion = section.parts[0]?.questions[0]?.id || "";

    await this.analytics.trackEvent("section_changed", {
      fromSection: this.state.currentSection,
      toSection: sectionId,
    });

    this.emit("sectionChanged", { sectionId, section });
  }

  // ✅ UNIVERSAL: Pause/Resume functionality
  pauseExam(): void {
    if (this.examConfig.settings.allowPause) {
      this.timer.pause();
      this.state.isPaused = true;
      this.emit("examPaused", this.state);
    }
  }

  resumeExam(): void {
    this.timer.resume();
    this.state.isPaused = false;
    this.emit("examResumed", this.state);
  }

  // ✅ UNIVERSAL: Exam completion
  async finishExam(): Promise<{ resultId: string; score: number }> {
    try {
      this.timer.stop();
      this.state.isComplete = true;

      // Calculate final score
      const finalResult = await this.scoring.calculateFinalScore(
        this.session.getAllAnswers(),
        this.courseConfig.scoringAdjustments
      );

      // Save result
      const resultId = await this.session.finishExam(finalResult);

      // Analytics
      await this.analytics.trackEvent("exam_completed", {
        finalScore: finalResult.totalScore,
        timeUsed:
          this.examConfig.metadata.duration * 60 - this.state.timeRemaining,
        questionsAnswered: this.state.progress.answeredQuestions,
      });

      this.emit("examFinished", { resultId, score: finalResult.totalScore });

      return { resultId, score: finalResult.totalScore };
    } catch (error) {
      console.error("Failed to finish exam:", error);
      throw error;
    }
  }

  // Event system
  on(event: string, callback: EngineCallback): void {
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

  private setupEventHandlers(): void {
    // Setup timer events
    this.timer.on("warning", (minutes: unknown) => {
      this.emit("timeWarning", minutes);
    });

    this.timer.on("expired", () => {
      this.emit("timeExpired");
      this.finishExam().catch(console.error);
    });

    // Setup progress events
    this.progress.on("progressUpdate", (update: unknown) => {
      this.emit("progressUpdate", update);
    });

    // Setup session events
    this.session.on("sessionPaused", () => {
      this.state.isPaused = true;
    });

    this.session.on("sessionResumed", () => {
      this.state.isPaused = false;
    });
  }

  private getTimeSpentOnQuestion(_questionId: string): number {
    // Implementation would go here
    return 0;
  }
}