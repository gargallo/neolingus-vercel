'use client';

/**
 * ScoreDisplay Component
 *
 * Real-time score display with animations, statistics, and performance indicators.
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ScoreDisplayProps {
  score: number;
  correct: number;
  incorrect: number;
  total: number;
  streak?: number;
  showAccuracy?: boolean;
  showStreak?: boolean;
  showChange?: boolean;
  lastChange?: number;
  decimalPlaces?: number;
  theme?: 'default' | 'compact' | 'minimal';
  showPerformance?: boolean;
  showBreakdown?: boolean;
  targetScore?: number;
  showProgress?: boolean;
  animated?: boolean;
  layout?: 'default' | 'compact';
  className?: string;
}

export function ScoreDisplay({
  score,
  correct,
  incorrect,
  total,
  streak,
  showAccuracy = false,
  showStreak = false,
  showChange = false,
  lastChange,
  decimalPlaces = 2,
  theme = 'default',
  showPerformance = false,
  showBreakdown = false,
  targetScore,
  showProgress = false,
  animated = false,
  layout = 'default',
  className
}: ScoreDisplayProps) {
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  const isNegativeScore = score < 0;
  
  const getPerformanceLevel = (acc: number) => {
    if (acc >= 90) return 'excellent';
    if (acc >= 70) return 'good';
    return 'needs-improvement';
  };

  const performanceLevel = getPerformanceLevel(accuracy);
  const hasStreakAchievement = (streak || 0) >= 10;

  return (
    <div
      data-testid="score-display"
      role="region"
      aria-label={`Puntuación actual: ${score.toFixed(decimalPlaces)}, Precisión: ${accuracy.toFixed(1)}%`}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700',
        `theme-${theme}`,
        `layout-${layout}`,
        isNegativeScore && 'negative-score',
        className
      )}
    >
      {layout === 'compact' ? (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div data-testid="current-score" aria-label={`Puntuación: ${score.toFixed(decimalPlaces)}`}>
              <span className="font-bold text-lg">{score.toFixed(decimalPlaces)}</span>
            </div>
            <div className="text-xs space-x-2">
              <span>C: {correct}</span>
              <span>I: {incorrect}</span>
            </div>
          </div>
          {showAccuracy && (
            <div data-testid="accuracy-percentage" aria-label={`Precisión: ${accuracy.toFixed(1)}%`}>
              {accuracy.toFixed(1)}%
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Main Score */}
          <div className="text-center">
            <div
              data-testid="current-score"
              aria-label={`Puntuación actual: ${score.toFixed(decimalPlaces)}`}
              className={cn(
                'text-3xl font-bold',
                animated && 'score-updating transition-all duration-300',
                isNegativeScore ? 'text-red-600' : 'text-blue-600'
              )}
            >
              {score.toFixed(decimalPlaces)}
              {showChange && lastChange !== undefined && (
                <span
                  data-testid={lastChange > 0 ? 'score-change-positive' : 'score-change-negative'}
                  className={cn(
                    'ml-2 text-lg',
                    lastChange > 0 ? 'text-green-500' : 'text-red-500'
                  )}
                >
                  {lastChange > 0 ? '+' : ''}{lastChange.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div data-testid="correct-count" className="font-semibold text-green-600">
                {correct}
              </div>
              <div className="text-gray-500">Correctas</div>
            </div>
            <div>
              <div data-testid="incorrect-count" className="font-semibold text-red-600">
                {incorrect}
              </div>
              <div className="text-gray-500">Incorrectas</div>
            </div>
            <div>
              <div data-testid="total-answers" className="font-semibold text-gray-700 dark:text-gray-300">
                {total}
              </div>
              <div className="text-gray-500">Total</div>
            </div>
          </div>

          {/* Accuracy */}
          {showAccuracy && (
            <div className="text-center">
              <div
                data-testid="accuracy-percentage"
                aria-label={`Precisión: ${accuracy.toFixed(1)}%`}
                className="text-xl font-semibold text-blue-600"
              >
                {accuracy.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-500">Precisión</div>
            </div>
          )}

          {/* Streak */}
          {showStreak && streak !== undefined && (
            <div className="text-center">
              <div
                data-testid="current-streak"
                aria-label={`Racha actual: ${streak}`}
                className={cn(
                  'text-lg font-semibold',
                  hasStreakAchievement ? 'text-yellow-600' : 'text-purple-600'
                )}
              >
                {streak}
                {hasStreakAchievement && (
                  <span data-testid="streak-achievement" className="ml-2">🔥</span>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Racha actual
                {hasStreakAchievement && (
                  <div className="text-xs text-yellow-600 font-medium">¡Racha increíble!</div>
                )}
              </div>
            </div>
          )}

          {/* Performance Level */}
          {showPerformance && (
            <div className="text-center">
              <div
                data-testid={`performance-${performanceLevel}`}
                className={cn(
                  'inline-block px-3 py-1 rounded-full text-sm font-medium',
                  performanceLevel === 'excellent' && 'bg-green-100 text-green-800',
                  performanceLevel === 'good' && 'bg-blue-100 text-blue-800',
                  performanceLevel === 'needs-improvement' && 'bg-yellow-100 text-yellow-800'
                )}
              >
                {performanceLevel === 'excellent' && 'Excelente'}
                {performanceLevel === 'good' && 'Bien'}
                {performanceLevel === 'needs-improvement' && 'Puede mejorar'}
              </div>
            </div>
          )}

          {/* Score Breakdown */}
          {showBreakdown && (
            <div data-testid="score-breakdown" className="text-xs space-y-1 bg-gray-50 dark:bg-gray-700 p-3 rounded">
              <div className="font-medium mb-2">Desglose de puntuación:</div>
              <div className="text-green-600">Correctas: {correct} × 1.0 = {(correct * 1.0).toFixed(2)}</div>
              <div className="text-red-600">Incorrectas: {incorrect} × -1.33 = {(incorrect * -1.33).toFixed(2)}</div>
              <div className="font-medium border-t pt-1">Total: {(correct * 1.0).toFixed(2)} - {Math.abs(incorrect * -1.33).toFixed(2)} = {((correct * 1.0) + (incorrect * -1.33)).toFixed(2)}</div>
            </div>
          )}

          {/* Progress to Target */}
          {showProgress && targetScore && (
            <div data-testid="score-progress" className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progreso</span>
                <span>Objetivo: {targetScore}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  data-testid="progress-bar"
                  className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (score / targetScore) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Screen Reader Announcements */}
      <div
        data-testid="score-announcement"
        aria-live="polite"
        className="sr-only"
      >
        {lastChange && `Puntuación cambió en ${lastChange > 0 ? '+' : ''}${lastChange.toFixed(2)} puntos`}
      </div>
    </div>
  );
}