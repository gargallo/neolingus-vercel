/**
 * Scoring Analytics Dashboard
 * Comprehensive analytics visualization for scoring engine performance
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    total_attempts: number;
    scored_attempts: number;
    failed_attempts: number;
    success_rate: number;
    avg_score: number;
    avg_processing_time: number;
    pass_rate: number;
  };
  time_series: Array<{
    period: string;
    value: number;
    count: number;
  }>;
  breakdowns: {
    by_provider: Array<{
      category: string;
      count: number;
      success_rate: number;
      avg_score: number;
      pass_rate: number;
    }>;
    by_level: Array<{
      category: string;
      count: number;
      success_rate: number;
      avg_score: number;
      pass_rate: number;
    }>;
    by_task: Array<{
      category: string;
      count: number;
      success_rate: number;
      avg_score: number;
      pass_rate: number;
    }>;
    by_status: Array<{
      category: string;
      count: number;
    }>;
  };
  performance: {
    avg_processing_time: number;
    median_processing_time: number;
    p95_processing_time: number;
    p99_processing_time: number;
  };
  quality: {
    avg_confidence: number;
    quality_flags: number;
    model_agreement_rate: number;
  };
  trends: {
    trend: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data';
    change_percent: number;
    recent_avg: number;
    previous_avg: number;
  };
}

interface ScoringAnalyticsDashboardProps {
  isAdmin?: boolean;
  userId?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function ScoringAnalyticsDashboard({
  isAdmin = false,
  userId
}: ScoringAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [groupBy, setGroupBy] = useState('day');
  const [metric, setMetric] = useState('count');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        group_by: groupBy,
        metric: metric
      });

      // Set date range
      const now = new Date();
      let dateFrom: Date;
      switch (dateRange) {
        case '7d':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      params.append('date_from', dateFrom.toISOString());
      params.append('date_to', now.toISOString());

      if (userId && !isAdmin) {
        params.append('user_id', userId);
      }

      const response = await fetch(`/api/v1/score/analytics?${params}`);
      const result = await response.json();

      if (result.success) {
        setAnalytics(result.analytics);
      } else {
        setError(result.error || 'Failed to fetch analytics');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, groupBy, metric, userId, isAdmin]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getTrendIcon = (trend: string, changePercent: number) => {
    if (trend === 'increasing') {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (trend === 'decreasing') {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <div className="h-4 w-4" />;
  };

  if (loading && !analytics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          No analytics data available
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Scoring Analytics</h2>
          <p className="text-muted-foreground">
            {isAdmin ? 'System-wide scoring analytics' : 'Your scoring performance'}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} disabled={loading} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.total_attempts}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(analytics.trends.trend, analytics.trends.change_percent)}
              <span className="ml-1">
                {analytics.trends.change_percent > 0 ? '+' : ''}{analytics.trends.change_percent}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.success_rate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.scored_attempts} of {analytics.summary.total_attempts} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.avg_score.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Pass rate: {analytics.summary.pass_rate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(analytics.summary.avg_processing_time)}
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {formatDuration(analytics.performance.p95_processing_time)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdowns">Breakdowns</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="quality">Quality</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Select value={groupBy} onValueChange={setGroupBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">By Day</SelectItem>
                <SelectItem value="week">By Week</SelectItem>
                <SelectItem value="month">By Month</SelectItem>
              </SelectContent>
            </Select>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Metric" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Count</SelectItem>
                <SelectItem value="avg_score">Avg Score</SelectItem>
                <SelectItem value="success_rate">Success Rate</SelectItem>
                <SelectItem value="processing_time">Processing Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scoring Trends</CardTitle>
              <CardDescription>
                {metric.replace('_', ' ')} over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.time_series}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdowns Tab */}
        <TabsContent value="breakdowns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>By Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={analytics.breakdowns.by_provider}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Level</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics.breakdowns.by_level}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, count }) => `${category}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {analytics.breakdowns.by_level.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Task Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.breakdowns.by_task.map((task, index) => (
                    <div key={task.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="font-medium">{task.category}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{task.count}</div>
                        <div className="text-xs text-muted-foreground">
                          {task.avg_score.toFixed(1)}% avg
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {analytics.breakdowns.by_status.map((status, index) => (
                    <div key={status.category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={status.category === 'scored' ? 'default' :
                                   status.category === 'failed' ? 'destructive' : 'secondary'}
                        >
                          {status.category}
                        </Badge>
                      </div>
                      <div className="font-bold">{status.count}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Time Distribution</CardTitle>
                <CardDescription>Performance metrics for scoring operations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Average:</span>
                    <span className="font-mono">{formatDuration(analytics.performance.avg_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median (P50):</span>
                    <span className="font-mono">{formatDuration(analytics.performance.median_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>95th Percentile:</span>
                    <span className="font-mono">{formatDuration(analytics.performance.p95_processing_time)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>99th Percentile:</span>
                    <span className="font-mono">{formatDuration(analytics.performance.p99_processing_time)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall system performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Success Rate:</span>
                    <Badge
                      variant={analytics.summary.success_rate > 95 ? 'default' :
                               analytics.summary.success_rate > 85 ? 'secondary' : 'destructive'}
                    >
                      {analytics.summary.success_rate.toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Failed Attempts:</span>
                    <span className="font-mono">{analytics.summary.failed_attempts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Avg Response Time:</span>
                    <Badge
                      variant={analytics.performance.avg_processing_time < 5000 ? 'default' :
                               analytics.performance.avg_processing_time < 15000 ? 'secondary' : 'destructive'}
                    >
                      {formatDuration(analytics.performance.avg_processing_time)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>AI Model Confidence</CardTitle>
                <CardDescription>Average confidence in scoring results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  {(analytics.quality.avg_confidence * 100).toFixed(1)}%
                </div>
                <div className="text-center text-muted-foreground">
                  Model confidence score
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Agreement</CardTitle>
                <CardDescription>Agreement between AI models</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center">
                  {(analytics.quality.model_agreement_rate * 100).toFixed(1)}%
                </div>
                <div className="text-center text-muted-foreground">
                  Inter-model agreement
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Flags</CardTitle>
                <CardDescription>Total quality control alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-center text-orange-600">
                  {analytics.quality.quality_flags}
                </div>
                <div className="text-center text-muted-foreground">
                  Flagged for review
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}