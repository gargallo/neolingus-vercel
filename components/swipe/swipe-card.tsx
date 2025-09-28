'use client';

/**
 * SwipeCard Component
 *
 * Main interactive card component for the swipe game that displays language items
 * and handles user interactions through swipe gestures, keyboard shortcuts, and button clicks.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SwipeItem, UserChoice } from '@/lib/types/swipe-game';

interface SwipeCardProps {
  item: SwipeItem;
  onSwipe: (choice: UserChoice) => void;
  disabled?: boolean;
  showFeedback?: boolean;
  correctAnswer?: boolean;
  explanation?: string;
  suggested?: string;
  className?: string;
}

export function SwipeCard({
  item,
  onSwipe,
  disabled = false,
  showFeedback = false,
  correctAnswer,
  explanation,
  suggested,
  className
}: SwipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [hasResponded, setHasResponded] = useState(false);

  // Touch/mouse interaction state
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Prevent rapid successive interactions
  const handleChoice = useCallback((choice: UserChoice) => {
    if (disabled || hasResponded) return;

    setHasResponded(true);
    onSwipe(choice);

    // Reset after a short delay to prevent spam
    setTimeout(() => setHasResponded(false), 1000);
  }, [disabled, hasResponded, onSwipe]);

  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (disabled || hasResponded) return;

      const target = event.target as HTMLElement;
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isInputFocused) return;

      switch (event.key.toLowerCase()) {
        case 'arrowleft':
        case 'n':
          event.preventDefault();
          handleChoice('no_apta');
          break;
        case 'arrowright':
        case 'a':
          event.preventDefault();
          handleChoice('apta');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleChoice, disabled, hasResponded]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled || hasResponded) return;

    const touch = event.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
    setIsInteracting(true);
  }, [disabled, hasResponded]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isDragging || disabled || hasResponded) return;

    const touch = event.touches[0];
    setCurrentX(touch.clientX);

    const deltaX = touch.clientX - startX;
    const threshold = 30; // Minimum movement to show visual feedback

    if (Math.abs(deltaX) > threshold) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  }, [isDragging, startX, disabled, hasResponded]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!isDragging || disabled || hasResponded) return;

    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const minSwipeDistance = 80; // Minimum distance for a valid swipe

    setIsDragging(false);
    setIsInteracting(false);
    setSwipeDirection(null);

    if (Math.abs(deltaX) >= minSwipeDistance) {
      handleChoice(deltaX > 0 ? 'apta' : 'no_apta');
    }
  }, [isDragging, startX, handleChoice, disabled, hasResponded]);

  // Mouse event handlers (for desktop)
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled || hasResponded) return;

    setStartX(event.clientX);
    setCurrentX(event.clientX);
    setIsDragging(true);
    setIsInteracting(true);
  }, [disabled, hasResponded]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || disabled || hasResponded) return;

    setCurrentX(event.clientX);

    const deltaX = event.clientX - startX;
    const threshold = 30;

    if (Math.abs(deltaX) > threshold) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  }, [isDragging, startX, disabled, hasResponded]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    if (!isDragging || disabled || hasResponded) return;

    const deltaX = event.clientX - startX;
    const minSwipeDistance = 80;

    setIsDragging(false);
    setIsInteracting(false);
    setSwipeDirection(null);

    if (Math.abs(deltaX) >= minSwipeDistance) {
      handleChoice(deltaX > 0 ? 'apta' : 'no_apta');
    }
  }, [isDragging, startX, handleChoice, disabled, hasResponded]);

  // Determine difficulty level for styling
  const getDifficultyLevel = (elo: number) => {
    if (elo >= 1700) return 'high';
    if (elo >= 1300) return 'medium';
    return 'low';
  };

  const difficultyLevel = getDifficultyLevel(item.difficulty_elo);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div className="flex flex-col items-center space-y-6 p-4">
      {/* Main Card */}
      <div
        ref={cardRef}
        data-testid="swipe-card"
        role="button"
        tabIndex={0}
        aria-label={`¿Es "${item.term}" apropiado para exámenes formales? Presiona flecha derecha o 'A' para Apta, flecha izquierda o 'N' para No Apta`}
        className={cn(
          'relative w-full max-w-md mx-auto',
          'bg-white dark:bg-gray-800 rounded-2xl shadow-lg',
          'border border-gray-200 dark:border-gray-700',
          'transition-all duration-200 ease-out',
          'cursor-grab active:cursor-grabbing',
          disabled && 'disabled opacity-50 cursor-not-allowed',
          prefersReducedMotion && 'reduced-motion',
          swipeDirection === 'right' && 'swiping-right',
          swipeDirection === 'left' && 'swiping-left',
          className
        )}
        style={{
          transform: isDragging ? `translateX(${(currentX - startX) * 0.3}px)` : 'translateX(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            cardRef.current?.focus();
          }
        }}
      >
        {/* Difficulty Indicator */}
        <div
          data-testid="difficulty-indicator"
          className={cn(
            'absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium',
            difficultyLevel === 'high' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            difficultyLevel === 'medium' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
            difficultyLevel === 'low' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
          )}
        >
          <span data-testid={`difficulty-${difficultyLevel}`}>
            {difficultyLevel === 'high' ? 'Difícil' : difficultyLevel === 'medium' ? 'Medio' : 'Fácil'}
          </span>
        </div>

        {/* Card Content */}
        <div className="p-8 text-center">
          {/* Term */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {item.term}
          </h2>

          {/* Example */}
          {item.example && (
            <div
              data-testid="example-text"
              className="text-gray-600 dark:text-gray-300 italic mb-6 text-sm leading-relaxed"
            >
              "{item.example}"
            </div>
          )}

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {item.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>Presiona flecha derecha o 'A' para <strong>Apta</strong></p>
            <p>Presiona flecha izquierda o 'N' para <strong>No Apta</strong></p>
          </div>
        </div>

        {/* Swipe Visual Feedback */}
        {swipeDirection && (
          <div className={cn(
            'absolute inset-0 flex items-center justify-center',
            'text-6xl font-bold opacity-50 pointer-events-none',
            'transition-opacity duration-200',
            swipeDirection === 'right' ? 'text-green-500' : 'text-red-500'
          )}>
            {swipeDirection === 'right' ? '✓' : '✗'}
          </div>
        )}

        {/* Feedback Overlay */}
        {showFeedback && (
          <div
            data-testid="feedback-overlay"
            className="absolute inset-0 bg-white/95 dark:bg-gray-800/95 rounded-2xl flex items-center justify-center p-6"
          >
            <div className="text-center space-y-4">
              {/* Correct/Incorrect Indicator */}
              <div className={cn(
                'text-4xl font-bold mb-2',
                correctAnswer ? 'text-green-500' : 'text-red-500'
              )}>
                {correctAnswer ? (
                  <div data-testid="feedback-correct">
                    ✓<br />
                    <span className="text-lg">¡Correcto!</span>
                  </div>
                ) : (
                  <div data-testid="feedback-incorrect">
                    ✗<br />
                    <span className="text-lg">Incorrecto</span>
                  </div>
                )}
              </div>

              {/* Explanation */}
              {explanation && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {explanation}
                </p>
              )}

              {/* Suggestion */}
              {suggested && (
                <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                  {suggested}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Action Buttons */}
      <div className="flex space-x-4 md:hidden lg:flex">
        <button
          data-testid="no-apta-button"
          onClick={() => handleChoice('no_apta')}
          disabled={disabled || hasResponded}
          className={cn(
            'px-6 py-3 rounded-lg font-semibold transition-colors',
            'bg-red-500 hover:bg-red-600 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          )}
        >
          No Apta
        </button>

        <button
          data-testid="apta-button"
          onClick={() => handleChoice('apta')}
          disabled={disabled || hasResponded}
          className={cn(
            'px-6 py-3 rounded-lg font-semibold transition-colors',
            'bg-green-500 hover:bg-green-600 text-white',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
          )}
        >
          Apta
        </button>
      </div>
    </div>
  );
}