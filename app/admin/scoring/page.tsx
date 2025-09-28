/**
 * Admin Scoring Management Dashboard
 * Provides comprehensive scoring engine management interface
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  RefreshCw,
  Play,
  Pause,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Settings,
  Database,
  Activity,
  BarChart3
} from 'lucide-react';
import ScoringAnalyticsDashboard from '@/components/scoring/analytics/scoring-analytics-dashboard';
import ScoringStatsWidget from '@/components/scoring/analytics/scoring-stats-widget';

// Types
interface QueueStats {
  queued: number;
  processing: number;
  scored_today: number;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  response_time_ms: number;
  version: string;
  checks: Record<string, {
    status: 'ok' | 'error';
    response_time?: number;
    error?: string;
  }>;
}

interface ScoringAttempt {
  id: string;
  user_id: string;
  provider: string;
  level: string;
  task: string;
  status: 'queued' | 'processing' | 'scored' | 'failed';
  created_at: string;
  updated_at: string;
  score_json?: any;
}

export default function ScoringAdminPage() {
  const [queueStats, setQueueStats] = useState<QueueStats>({ queued: 0, processing: 0, scored_today: 0 });
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [recentAttempts, setRecentAttempts] = useState<ScoringAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch queue stats
      const queueResponse = await fetch('/api/v1/score/process');
      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        if (queueData.success) {
          setQueueStats(queueData.queue_stats);
        }
      }

      // Fetch health status
      const healthResponse = await fetch('/api/v1/score/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setHealthStatus(healthData);
      }

      // Fetch recent attempts
      const attemptsResponse = await fetch('/api/v1/score/attempts?limit=20');
      if (attemptsResponse.ok) {
        const attemptsData = await attemptsResponse.json();
        if (attemptsData.success) {
          setRecentAttempts(attemptsData.attempts);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Process queued attempts
  const processQueuedAttempts = async () => {
    try {
      setProcessing(true);
      setError(null);

      const response = await fetch('/api/v1/score/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ process_all_queued: true })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert(`Successfully processed ${result.processed} attempts`);
        await fetchData(); // Refresh data
      } else {
        throw new Error(result.error || 'Processing failed');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process queue');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
      case 'scored':
        return 'bg-green-500';
      case 'degraded':
      case 'processing':
        return 'bg-yellow-500';
      case 'unhealthy':
      case 'error':
      case 'failed':
        return 'bg-red-500';
      case 'queued':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'ok':
      case 'scored':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'unhealthy':
      case 'error':
      case 'failed':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading && !healthStatus) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading scoring dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scoring Engine Management</h1>
          <p className="text-muted-foreground">Monitor and manage the AI scoring system</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={processQueuedAttempts}
            disabled={processing || queueStats.queued === 0}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Process Queue ({queueStats.queued})
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            {healthStatus && getStatusIcon(healthStatus.status)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {healthStatus?.status || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground">
              Response: {healthStatus?.response_time_ms || 0}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.queued}</div>
            <p className="text-xs text-muted-foreground">
              {queueStats.processing} processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scored Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.scored_today}</div>
            <p className="text-xs text-muted-foreground">
              Completed attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(recentAttempts.map(a => a.user_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Recent activity
            </p>
          </CardContent>
        </Card>

        {/* Analytics Widget */}
        <div className="md:col-span-2 lg:col-span-1">
          <ScoringStatsWidget
            className="h-full"
            showDetailsLink={false}
            autoRefresh={true}
            refreshInterval={30}
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="queue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="queue">Queue Management</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="attempts">Recent Attempts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Queue Management */}
        <TabsContent value="queue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Queue Status</CardTitle>
              <CardDescription>
                Monitor and manage the scoring queue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{queueStats.queued}</div>
                  <div className="text-sm text-muted-foreground">Queued</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{queueStats.processing}</div>
                  <div className="text-sm text-muted-foreground">Processing</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{queueStats.scored_today}</div>
                  <div className="text-sm text-muted-foreground">Completed Today</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={processQueuedAttempts}
                  disabled={processing || queueStats.queued === 0}
                  className="flex-1"
                >
                  {processing ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Process All Queued
                </Button>
                <Button variant="outline" disabled>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Queue
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Health */}
        <TabsContent value="health" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Health Checks</CardTitle>
              <CardDescription>
                Detailed health status of all scoring components
              </CardDescription>
            </CardHeader>
            <CardContent>
              {healthStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Overall Status</span>
                    <Badge className={getStatusColor(healthStatus.status)}>
                      {healthStatus.status}
                    </Badge>
                  </div>

                  {Object.entries(healthStatus.checks).map(([check, result]) => (
                    <div key={check} className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm">{check.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        {result.response_time && (
                          <span className="text-xs text-muted-foreground">
                            {result.response_time}ms
                          </span>
                        )}
                        <Badge
                          variant={result.status === 'ok' ? 'default' : 'destructive'}
                          className={getStatusColor(result.status)}
                        >
                          {getStatusIcon(result.status)}
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  <div className="text-xs text-muted-foreground pt-2">
                    Last updated: {new Date(healthStatus.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Health data unavailable
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Attempts */}
        <TabsContent value="attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Scoring Attempts</CardTitle>
              <CardDescription>
                Latest scoring attempts across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentAttempts.length > 0 ? (
                <div className="space-y-2">
                  {recentAttempts.map((attempt) => (
                    <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <div className="font-medium">
                          {attempt.provider} {attempt.level} {attempt.task}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          User: {attempt.user_id.slice(0, 8)}... • {new Date(attempt.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {attempt.score_json && (
                          <span className="text-sm text-green-600">
                            Score: {Math.round(attempt.score_json.percentage)}%
                          </span>
                        )}
                        <Badge className={getStatusColor(attempt.status)}>
                          {attempt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No recent attempts found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <ScoringAnalyticsDashboard isAdmin={true} />
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Scoring engine settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Configuration management is coming soon. Currently managing rubrics, correctors, and settings via API.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16">
                    <Database className="h-6 w-6 mr-2" />
                    Manage Rubrics
                  </Button>
                  <Button variant="outline" className="h-16">
                    <Settings className="h-6 w-6 mr-2" />
                    AI Models Config
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}