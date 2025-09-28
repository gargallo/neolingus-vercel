'use client';

/**
 * GameResults Component
 *
 * Comprehensive results display showing session summary, performance analysis,
 * achievements, and next steps after completing a swipe game session.
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import type { SessionSummary, PerformanceAnalysis, GameRecommendations } from '@/lib/types/swipe-game';

interface GameResultsProps {
  sessionSummary: SessionSummary;
  performanceAnalysis: PerformanceAnalysis | null;
  recommendations: GameRecommendations | null;
  onPlayAgain: () => void;
  onViewDetails?: (sessionId: string) => void;
  onShare?: (data: { score: number; accuracy: number; platform?: string }) => void;
  previousResults?: Partial<SessionSummary>;
  displayMode?: 'compact' | 'detailed';
  enableSocialSharing?: boolean;
  isAnalyzing?: boolean;
  analysisError?: string;
  animated?: boolean;
  className?: string;
}

export function GameResults({
  sessionSummary,
  performanceAnalysis,
  recommendations,
  onPlayAgain,
  onViewDetails,
  onShare,
  previousResults,
  displayMode = 'detailed',
  enableSocialSharing = false,
  isAnalyzing = false,
  analysisError,
  animated = true,
  className
}: GameResultsProps) {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);

  // Calculate derived metrics
  const sessionDurationMinutes = sessionSummary.duration_actual_s ?
    Math.round(sessionSummary.duration_actual_s / 60 * 10) / 10 : 0;
  const avgTimePerItem = sessionSummary.answers_total > 0 ?
    (sessionSummary.duration_actual_s || 0) / sessionSummary.answers_total : 0;

  // Determine achievements
  const achievements = [];
  if (sessionSummary.streak_max >= 10) {
    achievements.push({ type: 'streak', value: sessionSummary.streak_max });
  }
  if (sessionSummary.accuracy_pct >= 95) {
    achievements.push({ type: 'accuracy', value: sessionSummary.accuracy_pct });
  }
  if (sessionSummary.items_per_min >= 25) {
    achievements.push({ type: 'speed', value: sessionSummary.items_per_min });
  }

  // Calculate improvements vs previous
  const improvements = previousResults ? {
    score: sessionSummary.score_total - (previousResults.score_total || 0),
    accuracy: sessionSummary.accuracy_pct - (previousResults.accuracy_pct || 0),
    speed: sessionSummary.items_per_min - (previousResults.items_per_min || 0),
    streak: sessionSummary.streak_max - (previousResults.streak_max || 0)
  } : null;

  const getPerformanceBadgeClass = (level: string) => {
    switch (level) {
      case 'excellent': return 'excellent bg-green-100 text-green-800 border-green-200';
      case 'good': return 'good bg-blue-100 text-blue-800 border-blue-200';
      case 'needs_improvement': return 'needs-improvement bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num * 100) / 100);
  };

  if (displayMode === 'compact') {
    return (
      <div
        data-testid="game-results"
        className={cn('compact bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg', className)}
      >
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">¡Sesión completada!</h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div data-testid="final-score" className="text-2xl font-bold text-blue-600">
                {formatNumber(sessionSummary.score_total)}
              </div>
              <div>Puntuación</div>
            </div>
            <div>
              <div data-testid="accuracy-percentage" className="text-2xl font-bold text-green-600">
                {sessionSummary.accuracy_pct.toFixed(1)}%
              </div>
              <div>Precisión</div>
            </div>
          </div>

          <button
            data-testid="play-again-button"
            onClick={onPlayAgain}
            aria-label="Jugar de nuevo"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Jugar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="game-results"
      role="region"
      aria-label="Resultados de la sesión de juego"
      className={cn('detailed space-y-6', animated && 'animate-in', className)}
    >
      {/* Main Results Header */}
      <div className="text-center space-y-4">
        <div data-testid="score-animation" className={cn('space-y-2', animated && 'animate-in')}>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            ¡Sesión completada!
          </h1>
          <div data-testid="final-score" className="text-5xl font-bold text-blue-600">
            {formatNumber(sessionSummary.score_total)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Puntuación final</div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div data-testid="stats-animation" className={cn('grid grid-cols-2 md:grid-cols-4 gap-4', animated && 'animate-in')}>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm">
          <div data-testid="total-answers" className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatNumber(sessionSummary.answers_total)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Respuestas</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm">
          <div data-testid="accuracy-percentage" className="text-2xl font-bold text-green-600">
            {sessionSummary.accuracy_pct.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Precisión</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm">
          <div data-testid="max-streak" className="text-2xl font-bold text-purple-600">
            {formatNumber(sessionSummary.streak_max)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Mejor racha</div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg text-center shadow-sm">
          <div data-testid="response-speed" className="text-2xl font-bold text-orange-600">
            {sessionSummary.items_per_min.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Por minuto</div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Answer Breakdown */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Desglose de respuestas</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Correctas</span>
              <span data-testid="correct-answers" className="font-semibold text-green-600">
                {formatNumber(sessionSummary.correct)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Incorrectas</span>
              <span data-testid="incorrect-answers" className="font-semibold text-red-600">
                {formatNumber(sessionSummary.incorrect)}
              </span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span>Total</span>
              <span className="font-semibold">{formatNumber(sessionSummary.answers_total)}</span>
            </div>
          </div>
        </div>

        {/* Time Metrics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Métricas de tiempo</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Duración</span>
              <span data-testid="session-duration">
                {sessionDurationMinutes} {sessionDurationMinutes === 1 ? 'minuto' : 'minutos'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tiempo promedio</span>
              <span data-testid="avg-time-per-item">
                {avgTimePerItem.toFixed(1)} segundos
              </span>
            </div>
            <div className="flex justify-between">
              <span>Velocidad</span>
              <span>{sessionSummary.items_per_min.toFixed(1)} por minuto</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Analysis */}
      {isAnalyzing ? (
        <div data-testid="analysis-loading" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm text-center">
          <div className="animate-pulse">
            <div className="text-gray-600 dark:text-gray-400">Analizando rendimiento...</div>
            <div data-testid="analysis-placeholder" className="mt-4 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      ) : analysisError ? (
        <div data-testid="analysis-error" className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <div className="text-red-800 dark:text-red-200">
            {analysisError}
          </div>
          <button data-testid="retry-analysis-button" className="mt-2 text-red-600 hover:text-red-800 text-sm underline">
            Reintentar análisis
          </button>
        </div>
      ) : performanceAnalysis && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Análisis de rendimiento</h3>

          {/* Performance Level */}
          <div className="mb-4 text-center">
            <div
              data-testid="performance-badge"
              className={cn(
                'inline-block px-4 py-2 rounded-full font-medium border',
                getPerformanceBadgeClass(performanceAnalysis.level_assessment)
              )}
            >
              <span data-testid="performance-level" aria-label={`Nivel de rendimiento: ${performanceAnalysis.level_assessment}`}>
                {performanceAnalysis.level_assessment === 'excellent' && 'Excelente'}
                {performanceAnalysis.level_assessment === 'good' && 'Buen rendimiento'}
                {performanceAnalysis.level_assessment === 'needs_improvement' && 'Necesita mejorar'}
              </span>
            </div>
          </div>

          {/* Strengths and Improvements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {performanceAnalysis.strengths.length > 0 && (
              <div data-testid="strengths-section">
                <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">Fortalezas</h4>
                <ul className="text-sm space-y-1">
                  {performanceAnalysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-2">✓</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {performanceAnalysis.improvement_areas.length > 0 && (
              <div data-testid="improvement-areas">
                <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">Áreas de mejora</h4>
                <ul className="text-sm space-y-1">
                  {performanceAnalysis.improvement_areas.map((area, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2">→</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Breakdown */}
      {Object.keys(sessionSummary.error_buckets).length > 0 && (
        <div data-testid="error-breakdown" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Errores por categoría</h3>
          <div className="space-y-2">
            {Object.entries(sessionSummary.error_buckets).map(([category, count]) => (
              <div key={category} className="flex justify-between">
                <span className="capitalize">{category}</span>
                <span className="font-semibold text-red-600">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <div data-testid="achievements-section" className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg">
          <h3 className="font-semibold mb-4 text-yellow-800 dark:text-yellow-200">🏆 ¡Logros desbloqueados!</h3>
          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <div key={index} data-testid={`${achievement.type}-achievement`} className="flex items-center space-x-3">
                {achievement.type === 'streak' && (
                  <>
                    <span className="text-2xl">🔥</span>
                    <span>¡Racha de {achievement.value} respuestas correctas!</span>
                  </>
                )}
                {achievement.type === 'accuracy' && (
                  <>
                    <span className="text-2xl">🎯</span>
                    <span>¡{achievement.value}% de precisión!</span>
                  </>
                )}
                {achievement.type === 'speed' && (
                  <>
                    <span className="text-2xl">⚡</span>
                    <span>¡{achievement.value} respuestas por minuto!</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress Comparison */}
      {improvements && (
        <div data-testid="progress-comparison" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">Comparación con sesión anterior</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(improvements).map(([key, value]) => (
              <div key={key}>
                <div className={cn(
                  'text-sm font-medium',
                  value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600'
                )}>
                  <span data-testid={`${key}-improvement`}>
                    {value > 0 ? '+' : ''}{typeof value === 'number' ? value.toFixed(key === 'accuracy' ? 1 : 2) : value}
                    {key === 'accuracy' && '%'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && (
        <div data-testid="recommendations-section" className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h3 className="font-semibold mb-4 text-blue-800 dark:text-blue-200">📚 Recomendaciones</h3>
          <div className="space-y-3 text-sm">
            <div>
              <strong>Próxima sesión:</strong> Dificultad {recommendations.next_session_difficulty}
            </div>
            <div>
              <strong>Enfoque sugerido:</strong> {recommendations.recommended_focus.join(', ')}
            </div>
            <div>
              <strong>Tiempo estimado para mejorar:</strong> {recommendations.estimated_improvement_time}
            </div>
            <div>
              <strong>Frecuencia recomendada:</strong> {recommendations.practice_frequency}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          data-testid="play-again-button"
          onClick={onPlayAgain}
          aria-label="Jugar de nuevo"
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Jugar de nuevo
        </button>

        {onViewDetails && (
          <button
            data-testid="view-details-button"
            onClick={() => onViewDetails('session-id')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Ver detalles
          </button>
        )}

        {onShare && (
          <button
            data-testid="share-button"
            onClick={() => onShare({ score: sessionSummary.score_total, accuracy: sessionSummary.accuracy_pct })}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Compartir
          </button>
        )}
      </div>

      {/* Social Sharing */}
      {enableSocialSharing && (
        <div data-testid="social-sharing" className="text-center space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Compartir en redes sociales</div>
          <div className="flex justify-center space-x-4">
            <button
              data-testid="share-twitter"
              onClick={() => onShare?.({ score: sessionSummary.score_total, accuracy: sessionSummary.accuracy_pct, platform: 'twitter' })}
              className="text-blue-500 hover:text-blue-700"
            >
              Twitter
            </button>
            <button
              data-testid="share-facebook"
              onClick={() => onShare?.({ score: sessionSummary.score_total, accuracy: sessionSummary.accuracy_pct, platform: 'facebook' })}
              className="text-blue-600 hover:text-blue-800"
            >
              Facebook
            </button>
          </div>
        </div>
      )}

      {/* Detailed Analysis Toggle */}
      {performanceAnalysis && (
        <div data-testid="detailed-analysis" className="text-center">
          <button
            onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showDetailedAnalysis ? 'Ocultar análisis detallado' : 'Ver análisis detallado'}
          </button>
        </div>
      )}

      {/* Screen Reader Summary */}
      <div
        data-testid="results-summary"
        aria-live="polite"
        className="sr-only"
      >
        Sesión completada con {sessionSummary.score_total} puntos,
        {sessionSummary.accuracy_pct.toFixed(1)}% de precisión,
        {sessionSummary.correct} respuestas correctas de {sessionSummary.answers_total} total.
      </div>
    </div>
  );
}