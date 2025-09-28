export interface UserSession {
  id: string;
  userId: string;
  examId: string;
  courseId: string;
  startTime: number;
  lastActivity: number;
  state: 'active' | 'paused' | 'completed' | 'abandoned';
  answers: Map<string, unknown>;
  progress: SessionProgress;
  browserInfo?: Record<string, unknown>;
  ipAddress?: string;
}

export interface SessionProgress {
  currentSection: string;
  currentQuestion: string;
  answeredQuestions: number;
  totalQuestions: number;
  percentage: number;
  sectionProgress: { [sectionId: string]: number };
}

export interface SessionAnswer {
  questionId: string;
  answer: unknown;
  timestamp: number;
  timeSpent: number;
  attempts: number;
  score?: number;
}