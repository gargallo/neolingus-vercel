"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  Pause,
  Play,
  AlertTriangle,
  Timer
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  duration: number; // Total duration in seconds
  isRunning: boolean;
  onTimeUp: () => void;
  onTimeUpdate: (timeLeft: number) => void;
  allowPause?: boolean;
  showWarnings?: boolean;
  warningThresholds?: number[]; // Seconds remaining for warnings
}

export function ExamTimer({
  duration,
  isRunning,
  onTimeUp,
  onTimeUpdate,
  allowPause = true,
  showWarnings = true,
  warningThresholds = [300, 60] // 5 minutes, 1 minute
}: ExamTimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [hasShownWarnings, setHasShownWarnings] = useState<Set<number>>(new Set());

  // Update time left when duration changes
  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  // Main timer logic
  useEffect(() => {
    if (!isRunning || isPaused) return;

    const interval = setInterval(() => {
      setTimeLeft(prevTime => {
        const newTime = Math.max(0, prevTime - 1);

        // Update parent component
        onTimeUpdate(newTime);

        // Check for warnings
        if (showWarnings) {
          warningThresholds.forEach(threshold => {
            if (newTime === threshold && !hasShownWarnings.has(threshold)) {
              setHasShownWarnings(prev => new Set([...prev, threshold]));
              // Could add toast notification here
            }
          });
        }

        // Time's up
        if (newTime === 0) {
          onTimeUp();
        }

        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isPaused, onTimeUp, onTimeUpdate, showWarnings, warningThresholds, hasShownWarnings]);

  // Format time for display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;

  // Determine warning state
  const isWarning = warningThresholds.some(threshold => timeLeft <= threshold && timeLeft > 0);
  const isCritical = timeLeft <= warningThresholds[warningThresholds.length - 1] && timeLeft > 0;
  const isExpired = timeLeft === 0;

  // Toggle pause
  const handlePauseToggle = () => {
    if (allowPause && !isExpired) {
      setIsPaused(!isPaused);
    }
  };

  // Get timer style based on state
  const getTimerStyle = () => {
    if (isExpired) {
      return "bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300";
    }
    if (isCritical) {
      return "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400";
    }
    if (isWarning) {
      return "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-400";
    }
    return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-400";
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="w-3 h-3" />
          Tiempo agotado
        </Badge>
      );
    }
    if (isPaused) {
      return (
        <Badge variant="secondary" className="gap-1">
          <Pause className="w-3 h-3" />
          Pausado
        </Badge>
      );
    }
    if (isRunning) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <Timer className="w-3 h-3" />
          En curso
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="gap-1">
        <Clock className="w-3 h-3" />
        Detenido
      </Badge>
    );
  };

  return (
    <Card className={cn("border-2 transition-all duration-300", getTimerStyle())}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Tiempo de examen</span>
            </div>
            {getStatusBadge()}
          </div>

          {/* Time Display */}
          <div className="text-center">
            <div className={cn(
              "text-3xl font-mono font-bold transition-all duration-300",
              isCritical && "animate-pulse"
            )}>
              {formatTime(timeLeft)}
            </div>
            {duration > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                de {formatTime(duration)}
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={cn(
                  "h-2 rounded-full transition-all duration-1000",
                  isExpired ? "bg-red-500" :
                  isCritical ? "bg-red-400" :
                  isWarning ? "bg-yellow-400" : "bg-blue-500"
                )}
                style={{ width: `${Math.min(100, progressPercentage)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Progreso: {Math.round(progressPercentage)}%</span>
              <span>Restante: {formatTime(timeLeft)}</span>
            </div>
          </div>

          {/* Controls */}
          {allowPause && !isExpired && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePauseToggle}
                className="gap-2"
                disabled={!isRunning}
              >
                {isPaused ? (
                  <>
                    <Play className="w-3 h-3" />
                    Reanudar
                  </>
                ) : (
                  <>
                    <Pause className="w-3 h-3" />
                    Pausar
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Warning Messages */}
          {showWarnings && isWarning && !isExpired && (
            <div className={cn(
              "text-center text-xs p-2 rounded",
              isCritical ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300" :
              "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
            )}>
              {isCritical ? (
                <>
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  ¡Último minuto! Revisa tus respuestas.
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 inline mr-1" />
                  Quedan pocos minutos. Administra tu tiempo.
                </>
              )}
            </div>
          )}

          {/* Time expired message */}
          {isExpired && (
            <div className="text-center text-sm p-3 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded-lg">
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              El tiempo del examen ha terminado. Las respuestas se enviarán automáticamente.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}