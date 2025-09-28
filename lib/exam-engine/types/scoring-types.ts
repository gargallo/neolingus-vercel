export interface ScoringContext {
  language: string;
  culturalContext: string[];
  scoringAdjustments: ScoringAdjustments;
}

export interface ScoringAdjustments {
  culturalBonus: number;
  languageVariant: string;
  dialectSupport: boolean;
}

export interface TimerCallback {
  (timeRemaining: number): void;
}

export interface TimeWarning {
  triggerTime: number;
  message: string;
  triggered: boolean;
}