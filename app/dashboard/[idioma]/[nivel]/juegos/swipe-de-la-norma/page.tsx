'use client';

/**
 * Swipe de la Norma Game Page
 *
 * Interactive language normalization game where students determine if terms
 * are appropriate for formal exam contexts.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SwipeCard } from '@/components/swipe/swipe-card';
import { GameTimer } from '@/components/swipe/game-timer';
import { ScoreDisplay } from '@/components/swipe/score-display';
import { GameResults } from '@/components/swipe/game-results';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Settings, Play, Pause, Home } from 'lucide-react';
import { createSupabaseClient } from '@/utils/supabase/client';
import type { SwipeItem, SwipeSession, SessionSummary, PerformanceAnalysis, GameRecommendations, UserChoice } from '@/lib/types/swipe-game';

interface GameState {
  phase: 'setup' | 'playing' | 'paused' | 'finished';
  session: SwipeSession | null;
  items: SwipeItem[];
  currentItemIndex: number;
  answers: Array<{
    item: SwipeItem;
    userChoice: UserChoice;
    correct: boolean;
    timeSpent: number;
  }>;
  score: number;
  timeRemaining: number;
}

export default function SwipeDeNormaGamePage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();

  const idioma = params?.idioma as string;
  const nivel = params?.nivel as string;

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    phase: 'setup',
    session: null,
    items: [],
    currentItemIndex: 0,
    answers: [],
    score: 0,
    timeRemaining: 60
  });

  // Session settings
  const [duration, setDuration] = useState<20 | 30 | 60 | 120>(60); // seconds
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results data
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<GameRecommendations | null>(null);

  // Start a new game session
  const startGame = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Start session
      const sessionResponse = await fetch('/api/swipe/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lang: idioma === 'espanol' ? 'es' : idioma === 'valenciano' ? 'val' : 'en',
          level: nivel.toUpperCase(),
          exam: 'EOI',
          skill: 'grammar',
          duration_s: duration
        })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to start session');
      }

      const sessionData = await sessionResponse.json();

      // Get deck of items
      const deckResponse = await fetch(`/api/swipe/deck?lang=${idioma === 'espanol' ? 'es' : idioma === 'valenciano' ? 'val' : 'en'}&level=${nivel.toUpperCase()}&exam=EOI&skill=grammar&size=${Math.min(duration / 3, 40)}`);

      if (!deckResponse.ok) {
        throw new Error('Failed to get deck');
      }

      const deckData = await deckResponse.json();

      setGameState({
        phase: 'playing',
        session: sessionData.session,
        items: deckData.items,
        currentItemIndex: 0,
        answers: [],
        score: 0,
        timeRemaining: duration
      });

    } catch (err) {
      console.error('Error starting game:', err);
      setError('No se pudo iniciar el juego. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [idioma, nivel, duration]);

  // Handle user swipe/choice
  const handleSwipe = useCallback(async (choice: UserChoice) => {
    const { items, currentItemIndex, session, answers } = gameState;
    const currentItem = items[currentItemIndex];

    if (!currentItem || !session) return;

    const isCorrect = (choice === 'apta') === currentItem.exam_safe;
    const scoreDelta = isCorrect ? 1 : -1.33;
    const timeSpent = 3; // Mock time spent

    const newAnswer = {
      item: currentItem,
      userChoice: choice,
      correct: isCorrect,
      timeSpent
    };

    try {
      // Submit answer to API
      await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          answer_id: `answer-${Date.now()}`,
          session_id: session.id,
          item_id: currentItem.id,
          lang: session.lang,
          level: session.level,
          exam: session.exam,
          skill: session.skill,
          tags: currentItem.tags,
          user_choice: choice,
          correct: isCorrect,
          score_delta: scoreDelta,
          shown_at: new Date(Date.now() - timeSpent * 1000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: timeSpent * 1000,
          input_method: 'touch',
          item_difficulty: currentItem.difficulty_elo,
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });
    } catch (err) {
      console.error('Error submitting answer:', err);
    }

    const newAnswers = [...answers, newAnswer];
    const newScore = gameState.score + scoreDelta;
    const nextIndex = currentItemIndex + 1;

    setGameState(prev => ({
      ...prev,
      answers: newAnswers,
      score: newScore,
      currentItemIndex: nextIndex
    }));

    // Check if game should end (no more items)
    if (nextIndex >= items.length) {
      endGame(newAnswers, newScore, session);
    }
  }, [gameState]);

  // End game and show results
  const endGame = useCallback(async (finalAnswers: any[], finalScore: number, session: SwipeSession) => {
    try {
      const correctAnswers = finalAnswers.filter(a => a.correct).length;
      const incorrectAnswers = finalAnswers.filter(a => !a.correct).length;
      const accuracy = finalAnswers.length > 0 ? (correctAnswers / finalAnswers.length) * 100 : 0;

      const summary: SessionSummary = {
        score_total: finalScore,
        answers_total: finalAnswers.length,
        correct: correctAnswers,
        incorrect: incorrectAnswers,
        accuracy_pct: accuracy,
        items_per_min: finalAnswers.length / (duration / 60),
        streak_max: calculateMaxStreak(finalAnswers),
        error_buckets: calculateErrorBuckets(finalAnswers)
      };

      // End session
      const endResponse = await fetch('/api/swipe/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: session.id,
          ended_at: new Date().toISOString(),
          summary
        })
      });

      if (endResponse.ok) {
        const endData = await endResponse.json();
        setSessionSummary(endData.final_summary);
        setPerformanceAnalysis(endData.performance_analysis);
        setRecommendations(endData.next_recommendations);
      } else {
        setSessionSummary(summary);
      }

      setGameState(prev => ({
        ...prev,
        phase: 'finished'
      }));

    } catch (err) {
      console.error('Error ending game:', err);
      // Show basic results even if API call fails
      setGameState(prev => ({
        ...prev,
        phase: 'finished'
      }));
    }
  }, [duration]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (gameState.session && gameState.phase === 'playing') {
      endGame(gameState.answers, gameState.score, gameState.session);
    }
  }, [gameState.session, gameState.answers, gameState.score, gameState.phase, endGame]);

  // Handle timer tick
  const handleTimerTick = useCallback((remaining: number) => {
    setGameState(prev => ({
      ...prev,
      timeRemaining: remaining
    }));
  }, []);

  // Helper functions
  const calculateMaxStreak = (answers: any[]) => {
    let maxStreak = 0;
    let currentStreak = 0;
    for (const answer of answers) {
      if (answer.correct) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  };

  const calculateErrorBuckets = (answers: any[]) => {
    const buckets: Record<string, number> = {};
    answers.filter(a => !a.correct).forEach(answer => {
      answer.item.tags.forEach((tag: string) => {
        buckets[tag] = (buckets[tag] || 0) + 1;
      });
    });
    return buckets;
  };

  // Navigate back
  const handleBack = () => {
    router.push(`/dashboard/${idioma}/${nivel}/juegos`);
  };

  // Play again
  const handlePlayAgain = () => {
    setGameState({
      phase: 'setup',
      session: null,
      items: [],
      currentItemIndex: 0,
      answers: [],
      score: 0,
      timeRemaining: duration
    });
    setSessionSummary(null);
    setPerformanceAnalysis(null);
    setRecommendations(null);
    setError(null);
  };

  // Current item
  const currentItem = gameState.items[gameState.currentItemIndex];
  const { answers, score } = gameState;
  const correctCount = answers.filter(a => a.correct).length;
  const incorrectCount = answers.filter(a => !a.correct).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Swipe de la Norma
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {idioma} · {nivel} · EOI
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1">
              Gramática
            </Badge>
            <Badge variant="outline" className="px-3 py-1">
              Normativa
            </Badge>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-red-800">{error}</p>
              <Button onClick={() => setError(null)} variant="outline" size="sm" className="mt-2">
                Cerrar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Game Setup Phase */}
        {gameState.phase === 'setup' && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Configurar Sesión de Juego</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Duración (segundos)
                  </label>
                  <div className="flex gap-2">
                    {([20, 30, 60, 120] as const).map(d => (
                      <Button
                        key={d}
                        variant={duration === d ? "default" : "outline"}
                        onClick={() => setDuration(d)}
                      >
                        {d}s
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                  <p><strong>Objetivo:</strong> Determina si términos y expresiones son apropiados para exámenes formales.</p>
                  <p><strong>Puntuación:</strong> +1 por respuesta correcta, -1.33 por incorrecta.</p>
                  <p><strong>Controles:</strong> Desliza → para "Apta", ← para "No Apta", o usa A/N en teclado.</p>
                </div>

                <Button
                  onClick={startGame}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Iniciando...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Comenzar Juego
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Game Playing Phase */}
        {gameState.phase === 'playing' && currentItem && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Game Info Sidebar */}
              <div className="space-y-4">
                <GameTimer
                  duration={duration}
                  isActive={gameState.phase === 'playing'}
                  onTimeUp={handleTimeUp}
                  onTick={handleTimerTick}
                  displayMode="full"
                  showProgress={true}
                />

                <ScoreDisplay
                  score={score}
                  correct={correctCount}
                  incorrect={incorrectCount}
                  total={answers.length}
                  showAccuracy={true}
                  decimalPlaces={2}
                />

                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Progreso
                      </p>
                      <div className="flex items-center justify-center space-x-2">
                        <span className="font-bold">
                          {gameState.currentItemIndex + 1}
                        </span>
                        <span className="text-gray-500">/</span>
                        <span className="text-gray-500">
                          {gameState.items.length}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${((gameState.currentItemIndex + 1) / gameState.items.length) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Main Game Area */}
              <div className="lg:col-span-2">
                <SwipeCard
                  item={currentItem}
                  onSwipe={handleSwipe}
                  disabled={gameState.phase !== 'playing'}
                />
              </div>
            </div>
          </div>
        )}

        {/* Game Finished Phase */}
        {gameState.phase === 'finished' && sessionSummary && (
          <div className="max-w-4xl mx-auto">
            <GameResults
              sessionSummary={sessionSummary}
              performanceAnalysis={performanceAnalysis}
              recommendations={recommendations}
              onPlayAgain={handlePlayAgain}
              onViewDetails={() => {}}
              displayMode="detailed"
              animated={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}