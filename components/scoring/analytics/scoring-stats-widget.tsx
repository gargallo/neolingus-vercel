/**
 * Scoring Stats Widget
 * Compact analytics widget for embedding in dashboards
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  RefreshCw,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface ScoringStats {
  total_attempts: number;
  success_rate: number;
  avg_score: number;
  avg_processing_time: number;
  recent_trend: 'up' | 'down' | 'stable';
  change_percent: number;
}

interface ScoringStatsWidgetProps {
  userId?: string;
  className?: string;
  showDetailsLink?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
}

export default function ScoringStatsWidget({
  userId,
  className = '',
  showDetailsLink = true,
  autoRefresh = true,
  refreshInterval = 60
}: ScoringStatsWidgetProps) {
  const [stats, setStats] = useState<ScoringStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);

      // Use a shorter date range for the widget (last 7 days)
      const params = new URLSearchParams({
        date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        date_to: new Date().toISOString(),
        group_by: 'day',
        metric: 'count'
      });

      if (userId) {
        params.append('user_id', userId);
      }

      const response = await fetch(`/api/v1/score/analytics?${params}`);
      const result = await response.json();

      if (result.success) {
        const analytics = result.analytics;

        // Determine trend
        let recentTrend: 'up' | 'down' | 'stable' = 'stable';
        let changePercent = 0;

        if (analytics.trends && analytics.trends.trend !== 'insufficient_data') {
          if (analytics.trends.trend === 'increasing') {
            recentTrend = 'up';
          } else if (analytics.trends.trend === 'decreasing') {
            recentTrend = 'down';
          }
          changePercent = analytics.trends.change_percent || 0;
        }

        setStats({
          total_attempts: analytics.summary.total_attempts,
          success_rate: analytics.summary.success_rate,
          avg_score: analytics.summary.avg_score,
          avg_processing_time: analytics.summary.avg_processing_time,
          recent_trend: recentTrend,
          change_percent: changePercent
        });

        setLastUpdate(new Date());
      } else {
        setError(result.error || 'Failed to fetch stats');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    // Set up auto-refresh
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [userId, autoRefresh, refreshInterval]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-500" />;
      default:
        return <div className="h-3 w-3" />;
    }
  };

  const getSuccessRateBadgeVariant = (rate: number) => {
    if (rate >= 95) return 'default';
    if (rate >= 85) return 'secondary';
    return 'destructive';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20">
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm text-muted-foreground">Loading stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-20 text-red-500">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">Failed to load stats</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="text-center text-sm text-muted-foreground">
            No scoring data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Scoring Stats</CardTitle>
            <CardDescription className="text-xs">
              Last 7 days • {lastUpdate && new Date(lastUpdate).toLocaleTimeString()}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              onClick={fetchStats}
              disabled={loading}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {showDetailsLink && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => window.open('/admin/scoring?tab=analytics', '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {/* Total Attempts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Attempts</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm font-medium">{stats.total_attempts}</span>
            {getTrendIcon(stats.recent_trend)}
            {stats.change_percent !== 0 && (
              <span className="text-xs text-muted-foreground">
                {stats.change_percent > 0 ? '+' : ''}{stats.change_percent.toFixed(0)}%
              </span>
            )}
          </div>
        </div>

        {/* Success Rate */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Success Rate</span>
          </div>
          <Badge variant={getSuccessRateBadgeVariant(stats.success_rate)} className="text-xs">
            {stats.success_rate.toFixed(1)}%
          </Badge>
        </div>

        {/* Average Score */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Avg Score</span>
          </div>
          <Badge variant={getScoreBadgeVariant(stats.avg_score)} className="text-xs">
            {stats.avg_score.toFixed(1)}%
          </Badge>
        </div>

        {/* Processing Time */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Avg Time</span>
          </div>
          <span className="font-mono text-xs">
            {formatDuration(stats.avg_processing_time)}
          </span>
        </div>

        {/* Quick Stats Summary */}
        {stats.total_attempts === 0 && (
          <div className="text-center text-xs text-muted-foreground py-2 border-t">
            No scoring attempts in the last 7 days
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for smaller spaces
export function ScoringStatsCompact({
  userId,
  className = ''
}: {
  userId?: string;
  className?: string;
}) {
  const [stats, setStats] = useState<ScoringStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          date_to: new Date().toISOString()
        });

        if (userId) {
          params.append('user_id', userId);
        }

        const response = await fetch(`/api/v1/score/analytics?${params}`);
        const result = await response.json();

        if (result.success) {
          setStats({
            total_attempts: result.analytics.summary.total_attempts,
            success_rate: result.analytics.summary.success_rate,
            avg_score: result.analytics.summary.avg_score,
            avg_processing_time: result.analytics.summary.avg_processing_time,
            recent_trend: 'stable',
            change_percent: 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch compact stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId]);

  if (loading || !stats) {
    return (
      <div className={`text-xs text-muted-foreground ${className}`}>
        Loading stats...
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 text-xs ${className}`}>
      <span>
        <span className="font-medium">{stats.total_attempts}</span> attempts
      </span>
      <span>
        <span className="font-medium">{stats.success_rate.toFixed(0)}%</span> success
      </span>
      <span>
        <span className="font-medium">{stats.avg_score.toFixed(0)}%</span> avg
      </span>
    </div>
  );
}