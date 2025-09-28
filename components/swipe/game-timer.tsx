'use client';

/**
 * GameTimer Component
 *
 * Countdown timer component for swipe game sessions with visual indicators,
 * warning states, and accessibility features.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface GameTimerProps {
  duration: number; // Total duration in seconds
  isActive?: boolean;
  onTimeUp: () => void;
  onTick?: (remainingTime: number) => void;
  warningThreshold?: number; // Seconds remaining to show warning
  criticalThreshold?: number; // Seconds remaining to show critical state
  showProgress?: boolean;
  displayMode?: 'compact' | 'full';
  className?: string;
}

export function GameTimer({
  duration,
  isActive = false,
  onTimeUp,
  onTick,
  warningThreshold = 10,
  criticalThreshold = 5,
  showProgress = false,
  displayMode = 'compact',
  className
}: GameTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(isActive);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(duration);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = ((timeRemaining / duration) * 100);

  // Determine timer state
  const isWarning = timeRemaining <= warningThreshold && timeRemaining > criticalThreshold;
  const isCritical = timeRemaining <= criticalThreshold;
  const isExpired = timeRemaining <= 0;

  // Timer logic
  useEffect(() => {
    if (isActive && !isExpired) {
      setIsRunning(true);
      startTimeRef.current = Date.now();
    } else {
      setIsRunning(false);
    }
  }, [isActive, isExpired]);

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = Math.max(0, prev - 1);

          // Call onTick callback
          if (onTick) {
            onTick(newTime);
          }

          // Check if time is up
          if (newTime === 0) {
            onTimeUp();
            setIsRunning(false);
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeRemaining, onTimeUp, onTick]);

  // Update time remaining when duration changes
  useEffect(() => {
    setTimeRemaining(duration);
    pausedTimeRef.current = duration;
  }, [duration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const timerClasses = cn(
    'inline-flex items-center justify-center',
    'font-mono font-bold text-gray-900 dark:text-white',
    'transition-colors duration-200',
    isWarning && 'warning text-yellow-600 dark:text-yellow-400',
    isCritical && 'critical text-red-600 dark:text-red-400',
    !isActive && 'paused text-gray-500 dark:text-gray-400',
    className
  );

  if (displayMode === 'compact') {
    return (
      <div
        data-testid="game-timer"
        role="timer"
        aria-label={`Tiempo restante: ${formatTime(timeRemaining)}`}
        aria-live="polite"
        className={timerClasses}
      >
        <div data-testid="timer-compact" className="flex items-center space-x-2">
          <div
            data-testid="timer-display"
            aria-label={formatTime(timeRemaining)}
            className="text-2xl"
          >
            {formatTime(timeRemaining)}
          </div>

          {isWarning && (
            <div data-testid="timer-warning" className="text-yellow-500">
              ⚠️
            </div>
          )}

          {isCritical && (
            <div data-testid="timer-critical" className="text-red-500 animate-pulse">
              🔥
            </div>
          )}

          {!isActive && (
            <div data-testid="timer-paused" className="text-gray-500">
              ⏸️
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="game-timer"
      role="timer"
      aria-label={`Tiempo restante: ${formatTime(timeRemaining)}`}
      aria-live="polite"
      className={cn(timerClasses, 'flex-col space-y-2')}
    >
      <div data-testid="timer-full" className="text-center">
        {/* Timer Label */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Tiempo restante
        </div>

        {/* Main Timer Display */}
        <div
          data-testid="timer-display"
          aria-label={formatTime(timeRemaining)}
          className="text-4xl font-bold"
        >
          {formatTime(timeRemaining)}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center space-x-2 mt-2">
          {isWarning && (
            <div data-testid="timer-warning" className="flex items-center text-yellow-500 text-sm">
              <span className="mr-1">⚠️</span>
              <span>Poco tiempo</span>
            </div>
          )}

          {isCritical && (
            <div data-testid="timer-critical" className="flex items-center text-red-500 text-sm animate-pulse">
              <span className="mr-1">🔥</span>
              <span>¡Tiempo crítico!</span>
            </div>
          )}

          {!isActive && timeRemaining > 0 && (
            <div data-testid="timer-paused" className="flex items-center text-gray-500 text-sm">
              <span className="mr-1">⏸️</span>
              <span>Pausado</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                data-testid="timer-progress"
                className={cn(
                  'h-2 rounded-full transition-all duration-1000 ease-linear',
                  isCritical ? 'bg-red-500' :
                  isWarning ? 'bg-yellow-500' :
                  'bg-green-500'
                )}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {Math.round(progressPercentage)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}