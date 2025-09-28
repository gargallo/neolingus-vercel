import { ExamConfiguration } from "../types/exam-config";

export interface ProgressUpdate {
  questionId: string;
  answered: boolean;
  timeSpent: number;
  percentage: number;
  nextQuestionId?: string;
  sectionComplete: boolean;
}

export interface SectionProgress {
  sectionId: string;
  totalQuestions: number;
  answeredQuestions: number;
  percentage: number;
}

// Define a proper type for callback functions
type ProgressCallback = (data?: unknown) => void;

export class ProgressEngine {
  private examConfig: ExamConfiguration;
  private answeredQuestions: Map<string, unknown> = new Map();
  private questionTimes: Map<string, number> = new Map();
  private callbacks: Map<string, ProgressCallback[]> = new Map();

  constructor(examConfig: ExamConfiguration) {
    this.examConfig = examConfig;
  }

  async recordAnswer(questionId: string, answer: unknown): Promise<ProgressUpdate> {
    const _previouslyAnswered = this.answeredQuestions.has(questionId);
    this.answeredQuestions.set(questionId, answer);

    // Calculate progress
    const totalQuestions = this.examConfig.metadata.totalQuestions;
    const answeredCount = this.answeredQuestions.size;
    const percentage = Math.round((answeredCount / totalQuestions) * 100);

    // Find current section and check if complete
    const currentSection = this.findQuestionSection(questionId);
    const sectionComplete = this.isSectionComplete(currentSection?.id || "");
    const nextQuestionId = this.getNextQuestionId(questionId);

    const update: ProgressUpdate = {
      questionId,
      answered: true,
      timeSpent: this.questionTimes.get(questionId) || 0,
      percentage,
      nextQuestionId,
      sectionComplete,
    };

    this.emit("progressUpdate", update);

    return update;
  }

  getSectionProgress(sectionId: string): SectionProgress {
    const section = this.examConfig.sections.find((s) => s.id === sectionId);
    if (!section) {
      throw new Error(`Section not found: ${sectionId}`);
    }

    // Count total questions in section
    const totalQuestions = section.parts.reduce(
      (sum, part) => sum + part.questionCount,
      0
    );

    // Count answered questions in section
    const answeredQuestions = this.getAnsweredQuestionsInSection(sectionId);

    return {
      sectionId,
      totalQuestions,
      answeredQuestions,
      percentage:
        totalQuestions > 0
          ? Math.round((answeredQuestions / totalQuestions) * 100)
          : 0,
    };
  }

  getAllProgress(): { [sectionId: string]: SectionProgress } {
    const progress: { [sectionId: string]: SectionProgress } = {};

    for (const section of this.examConfig.sections) {
      progress[section.id] = this.getSectionProgress(section.id);
    }

    return progress;
  }

  getOverallProgress(): {
    answeredQuestions: number;
    totalQuestions: number;
    percentage: number;
  } {
    const totalQuestions = this.examConfig.metadata.totalQuestions;
    const answeredQuestions = this.answeredQuestions.size;
    const percentage = Math.round((answeredQuestions / totalQuestions) * 100);

    return {
      answeredQuestions,
      totalQuestions,
      percentage,
    };
  }

  startQuestionTimer(questionId: string): void {
    this.questionTimes.set(questionId, Date.now());
  }

  stopQuestionTimer(questionId: string): number {
    const startTime = this.questionTimes.get(questionId);
    if (!startTime) return 0;

    const timeSpent = Math.round((Date.now() - startTime) / 1000); // seconds
    this.questionTimes.set(questionId, timeSpent);

    return timeSpent;
  }

  isComplete(): boolean {
    return (
      this.answeredQuestions.size >= this.examConfig.metadata.totalQuestions
    );
  }

  private findQuestionSection(questionId: string) {
    for (const section of this.examConfig.sections) {
      for (const part of section.parts) {
        if (part.questions.some((q) => q.id === questionId)) {
          return section;
        }
      }
    }
    return null;
  }

  private isSectionComplete(sectionId: string): boolean {
    const progress = this.getSectionProgress(sectionId);
    return progress.answeredQuestions >= progress.totalQuestions;
  }

  private getAnsweredQuestionsInSection(sectionId: string): number {
    const section = this.examConfig.sections.find((s) => s.id === sectionId);
    if (!section) return 0;

    let count = 0;
    for (const part of section.parts) {
      for (const question of part.questions) {
        if (this.answeredQuestions.has(question.id)) {
          count++;
        }
      }
    }
    return count;
  }

  private getNextQuestionId(currentQuestionId: string): string | undefined {
    // Find the next question in sequence
    for (const section of this.examConfig.sections) {
      for (const part of section.parts) {
        const currentIndex = part.questions.findIndex(
          (q) => q.id === currentQuestionId
        );
        if (currentIndex >= 0) {
          // Found current question, return next one
          if (currentIndex < part.questions.length - 1) {
            return part.questions[currentIndex + 1].id;
          }
        }
      }
    }
    return undefined;
  }

  // Event system
  on(event: string, callback: ProgressCallback): void {
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

  // Reset progress
  reset(): void {
    this.answeredQuestions.clear();
    this.questionTimes.clear();
    this.emit("progressReset");
  }

  // Export progress data for saving
  exportProgress(): unknown {
    return {
      answeredQuestions: Object.fromEntries(this.answeredQuestions),
      questionTimes: Object.fromEntries(this.questionTimes),
    };
  }

  // Import progress data
  importProgress(data: unknown): void {
    if (typeof data === 'object' && data !== null) {
      const progressData = data as { 
        answeredQuestions?: Record<string, unknown>;
        questionTimes?: Record<string, number>;
      };
      
      if (progressData.answeredQuestions) {
        this.answeredQuestions = new Map(Object.entries(progressData.answeredQuestions));
      }
      
      if (progressData.questionTimes) {
        this.questionTimes = new Map(Object.entries(progressData.questionTimes));
      }
    }
  }
}