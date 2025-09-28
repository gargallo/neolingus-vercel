/**
 * Real-time Scoring Status Monitor
 * Provides live updates on scoring attempts using Supabase Realtime
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { createSupabaseClient } from '@/utils/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';

interface ScoringAttempt {
  id: string;
  user_id: string;
  provider: string;
  level: string;
  task: string;
  status: 'queued' | 'processing' | 'scored' | 'failed';
  created_at: string;
  updated_at: string;
  score_json?: {
    total_score: number;
    max_score: number;
    percentage: number;
    pass: boolean;
  };
}

interface ScoringStatusMonitorProps {
  attemptId?: string;
  userId?: string;
  showAllAttempts?: boolean;
  autoRefresh?: boolean;
  onStatusChange?: (attempt: ScoringAttempt) => void;
}

export default function ScoringStatusMonitor({
  attemptId,
  userId,
  showAllAttempts = false,
  autoRefresh = true,
  onStatusChange
}: ScoringStatusMonitorProps) {
  const [attempts, setAttempts] = useState<ScoringAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const supabase = createSupabaseClient();
  const channelRef = useRef<any>(null);

  // Fetch attempts data
  const fetchAttempts = async () => {
    try {
      setError(null);

      let url = '/api/v1/score/attempts?limit=10&sort_order=desc';

      if (attemptId) {
        // Fetch specific attempt
        const response = await fetch(`/api/v1/score/${attemptId}`);
        const result = await response.json();

        if (result.success && result.attempt) {
          setAttempts([result.attempt]);
        } else {
          setError(result.error || 'Failed to fetch attempt');
        }
      } else {
        // Fetch multiple attempts with filters
        if (userId) {
          url += `&user_id=${userId}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success) {
          setAttempts(result.attempts || []);
        } else {
          setError(result.error || 'Failed to fetch attempts');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial fetch
    fetchAttempts();

    // Set up Supabase Realtime subscription
    const channel = supabase
      .channel('scoring_attempts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scoring_attempts',
          ...(userId && { filter: `user_id=eq.${userId}` })
        },
        (payload) => {
          console.log('Scoring attempt update:', payload);

          if (payload.eventType === 'INSERT') {
            const newAttempt = payload.new as ScoringAttempt;
            setAttempts(prev => [newAttempt, ...prev.slice(0, 9)]);
            onStatusChange?.(newAttempt);
          } else if (payload.eventType === 'UPDATE') {
            const updatedAttempt = payload.new as ScoringAttempt;
            setAttempts(prev =>
              prev.map(attempt =>
                attempt.id === updatedAttempt.id ? updatedAttempt : attempt
              )
            );
            onStatusChange?.(updatedAttempt);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        if (status === 'CHANNEL_ERROR') {
          setError('Real-time connection failed');
        }
      });

    channelRef.current = channel;

    // Cleanup subscription
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [attemptId, userId, autoRefresh, onStatusChange]);

  // Manual refresh
  const handleRefresh = () => {
    setLoading(true);
    fetchAttempts();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scored':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'queued':
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scored':
        return 'bg-green-500';
      case 'processing':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      case 'queued':
      default:
        return 'bg-yellow-500';
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'queued':
        return 25;
      case 'processing':
        return 75;
      case 'scored':
        return 100;
      case 'failed':
        return 100;
      default:
        return 0;
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          variant="outline"
          size="sm"
          className="shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          Scoring Monitor ({attempts.filter(a => a.status === 'processing').length})
        </Button>
      </div>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-hidden shadow-lg z-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm">Scoring Status</CardTitle>
            <CardDescription className="text-xs">
              {isConnected ? (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live updates
                </span>
              ) : (
                'Disconnected'
              )}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              onClick={handleRefresh}
              disabled={loading}
              variant="ghost"
              size="sm"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              onClick={() => setIsMinimized(true)}
              variant="ghost"
              size="sm"
            >
              <EyeOff className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 max-h-64 overflow-y-auto">
        {error && (
          <Alert variant="destructive" className="mb-3">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {loading && attempts.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No scoring attempts found
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div key={attempt.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(attempt.status)}
                    <span className="text-sm font-medium">
                      {attempt.provider} {attempt.level} {attempt.task}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getStatusColor(attempt.status)} text-white`}
                  >
                    {attempt.status}
                  </Badge>
                </div>

                <Progress
                  value={getProgressValue(attempt.status)}
                  className="h-1"
                />

                {attempt.score_json && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Score: {attempt.score_json.total_score}/{attempt.score_json.max_score}
                    </span>
                    <span className={`font-medium ${attempt.score_json.pass ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.round(attempt.score_json.percentage)}%
                      {attempt.score_json.pass ? ' ✓' : ' ✗'}
                    </span>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  {new Date(attempt.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Simplified version for embedding in other components
export function ScoringStatusBadge({
  attemptId,
  className = ''
}: {
  attemptId: string;
  className?: string;
}) {
  const [attempt, setAttempt] = useState<ScoringAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const response = await fetch(`/api/v1/score/${attemptId}`);
        const result = await response.json();

        if (result.success && result.attempt) {
          setAttempt(result.attempt);
        }
      } catch (error) {
        console.error('Failed to fetch attempt:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();

    // Set up real-time updates
    const supabase = createSupabaseClient();
    const channel = supabase
      .channel(`attempt_${attemptId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'scoring_attempts',
          filter: `id=eq.${attemptId}`
        },
        (payload) => {
          setAttempt(payload.new as ScoringAttempt);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [attemptId]);

  if (loading) {
    return (
      <Badge variant="outline" className={className}>
        <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (!attempt) {
    return (
      <Badge variant="outline" className={className}>
        <AlertCircle className="h-3 w-3 mr-1" />
        Not found
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`${className} ${attempt.status === 'scored' ? 'border-green-500 text-green-700' :
        attempt.status === 'processing' ? 'border-blue-500 text-blue-700' :
        attempt.status === 'failed' ? 'border-red-500 text-red-700' :
        'border-yellow-500 text-yellow-700'}`}
    >
      {attempt.status === 'processing' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
      {attempt.status === 'scored' && <CheckCircle className="h-3 w-3 mr-1" />}
      {attempt.status === 'failed' && <AlertCircle className="h-3 w-3 mr-1" />}
      {attempt.status === 'queued' && <Clock className="h-3 w-3 mr-1" />}

      {attempt.status === 'scored' && attempt.score_json
        ? `${Math.round(attempt.score_json.percentage)}%`
        : attempt.status.charAt(0).toUpperCase() + attempt.status.slice(1)
      }
    </Badge>
  );
}