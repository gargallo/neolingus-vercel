/**
 * GET /api/v1/score/analytics
 * Scoring analytics and reporting endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import { isValidAdmin } from '@/lib/auth/admin';

interface AnalyticsQuery {
  date_from?: string;
  date_to?: string;
  provider?: string;
  level?: string;
  task?: string;
  user_id?: string;
  group_by?: 'day' | 'week' | 'month' | 'provider' | 'level' | 'task';
  metric?: 'count' | 'avg_score' | 'success_rate' | 'processing_time';
}

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const supabase = await createSupabaseClientFromRequest(request);
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Admin check for detailed analytics
    const isAdmin = await isValidAdmin(user.id);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query: AnalyticsQuery = {
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      provider: searchParams.get('provider') || undefined,
      level: searchParams.get('level') || undefined,
      task: searchParams.get('task') || undefined,
      user_id: searchParams.get('user_id') || (isAdmin ? undefined : user.id),
      group_by: (searchParams.get('group_by') as any) || 'day',
      metric: (searchParams.get('metric') as any) || 'count'
    };

    // Validate date range
    const dateFrom = query.date_from ? new Date(query.date_from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = query.date_to ? new Date(query.date_to) : new Date();

    if (dateFrom > dateTo) {
      return NextResponse.json(
        { success: false, error: 'Invalid date range' },
        { status: 400 }
      );
    }

    // Set tenant context and create scoring client
    const tenantId = user.user_metadata?.tenant_id || 'neolingus';
    await setTenantContext(supabase, tenantId);
    const scoringDb = await createScoringDbFromRequest(request);

    // Build analytics query
    const analytics = await generateAnalytics(scoringDb, query, dateFrom, dateTo, isAdmin);

    return NextResponse.json({
      success: true,
      analytics,
      query: {
        ...query,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString()
      },
      meta: {
        is_admin: isAdmin,
        total_records: analytics.summary?.total_attempts || 0
      }
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateAnalytics(
  scoringDb: any,
  query: AnalyticsQuery,
  dateFrom: Date,
  dateTo: Date,
  isAdmin: boolean
) {
  const supabase = scoringDb.client;

  // Base query for attempts in date range
  let baseQuery = supabase
    .from('scoring_attempts')
    .select(`
      id,
      created_at,
      updated_at,
      provider,
      level,
      task,
      status,
      score_json,
      user_id,
      processing_time_ms
    `)
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  // Apply filters
  if (query.provider) baseQuery = baseQuery.eq('provider', query.provider);
  if (query.level) baseQuery = baseQuery.eq('level', query.level);
  if (query.task) baseQuery = baseQuery.eq('task', query.task);
  if (query.user_id) baseQuery = baseQuery.eq('user_id', query.user_id);

  const { data: attempts, error } = await baseQuery.order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Analytics query failed: ${error.message}`);
  }

  // Generate summary statistics
  const summary = generateSummary(attempts || []);

  // Generate time series data
  const timeSeries = generateTimeSeries(attempts || [], query.group_by || 'day', query.metric || 'count');

  // Generate breakdowns
  const breakdowns = {
    by_provider: generateBreakdown(attempts || [], 'provider'),
    by_level: generateBreakdown(attempts || [], 'level'),
    by_task: generateBreakdown(attempts || [], 'task'),
    by_status: generateBreakdown(attempts || [], 'status')
  };

  // Generate performance metrics
  const performance = generatePerformanceMetrics(attempts || []);

  // Generate quality metrics
  const quality = generateQualityMetrics(attempts || []);

  return {
    summary,
    time_series: timeSeries,
    breakdowns,
    performance,
    quality,
    trends: generateTrends(timeSeries, breakdowns)
  };
}

function generateSummary(attempts: any[]) {
  const scored = attempts.filter(a => a.status === 'scored' && a.score_json);
  const failed = attempts.filter(a => a.status === 'failed');

  const scores = scored.map(a => a.score_json?.percentage || 0);
  const processingTimes = attempts
    .filter(a => a.processing_time_ms)
    .map(a => a.processing_time_ms);

  return {
    total_attempts: attempts.length,
    scored_attempts: scored.length,
    failed_attempts: failed.length,
    success_rate: attempts.length > 0 ? (scored.length / attempts.length) * 100 : 0,
    avg_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    avg_processing_time: processingTimes.length > 0
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length
      : 0,
    pass_rate: scored.length > 0
      ? (scored.filter(a => a.score_json?.pass).length / scored.length) * 100
      : 0
  };
}

function generateTimeSeries(attempts: any[], groupBy: string, metric: string) {
  const grouped = new Map();

  attempts.forEach(attempt => {
    const date = new Date(attempt.created_at);
    let key: string;

    switch (groupBy) {
      case 'day':
        key = date.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = attempt[groupBy] || 'unknown';
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(attempt);
  });

  return Array.from(grouped.entries()).map(([period, periodAttempts]) => {
    let value: number;

    switch (metric) {
      case 'avg_score':
        const scores = periodAttempts
          .filter((a: any) => a.score_json?.percentage)
          .map((a: any) => a.score_json.percentage);
        value = scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0;
        break;
      case 'success_rate':
        const scored = periodAttempts.filter((a: any) => a.status === 'scored');
        value = periodAttempts.length > 0 ? (scored.length / periodAttempts.length) * 100 : 0;
        break;
      case 'processing_time':
        const times = periodAttempts
          .filter((a: any) => a.processing_time_ms)
          .map((a: any) => a.processing_time_ms);
        value = times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0;
        break;
      default: // count
        value = periodAttempts.length;
    }

    return { period, value, count: periodAttempts.length };
  }).sort((a, b) => a.period.localeCompare(b.period));
}

function generateBreakdown(attempts: any[], dimension: string) {
  const grouped = new Map();

  attempts.forEach(attempt => {
    const key = attempt[dimension] || 'unknown';
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key).push(attempt);
  });

  return Array.from(grouped.entries()).map(([category, categoryAttempts]) => {
    const scored = categoryAttempts.filter((a: any) => a.status === 'scored' && a.score_json);
    const scores = scored.map((a: any) => a.score_json?.percentage || 0);

    return {
      category,
      count: categoryAttempts.length,
      scored_count: scored.length,
      success_rate: categoryAttempts.length > 0 ? (scored.length / categoryAttempts.length) * 100 : 0,
      avg_score: scores.length > 0 ? scores.reduce((a: number, b: number) => a + b, 0) / scores.length : 0,
      pass_rate: scored.length > 0
        ? (scored.filter((a: any) => a.score_json?.pass).length / scored.length) * 100
        : 0
    };
  }).sort((a, b) => b.count - a.count);
}

function generatePerformanceMetrics(attempts: any[]) {
  const processingTimes = attempts
    .filter(a => a.processing_time_ms && a.processing_time_ms > 0)
    .map(a => a.processing_time_ms)
    .sort((a, b) => a - b);

  if (processingTimes.length === 0) {
    return {
      avg_processing_time: 0,
      median_processing_time: 0,
      p95_processing_time: 0,
      p99_processing_time: 0
    };
  }

  const avg = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
  const median = processingTimes[Math.floor(processingTimes.length / 2)];
  const p95 = processingTimes[Math.floor(processingTimes.length * 0.95)];
  const p99 = processingTimes[Math.floor(processingTimes.length * 0.99)];

  return {
    avg_processing_time: Math.round(avg),
    median_processing_time: median,
    p95_processing_time: p95,
    p99_processing_time: p99
  };
}

function generateQualityMetrics(attempts: any[]) {
  const scored = attempts.filter(a => a.status === 'scored' && a.score_json);

  if (scored.length === 0) {
    return {
      avg_confidence: 0,
      quality_flags: 0,
      model_agreement_rate: 0
    };
  }

  const qualityMetrics = scored
    .filter(a => a.score_json?.quality_metrics)
    .map(a => a.score_json.quality_metrics);

  const avgConfidence = qualityMetrics.length > 0
    ? qualityMetrics.reduce((sum, m) => sum + (m.confidence || 0), 0) / qualityMetrics.length
    : 0;

  const qualityFlags = qualityMetrics.reduce((sum, m) => sum + (m.flags?.length || 0), 0);

  const agreementRates = qualityMetrics
    .filter(m => m.model_agreement !== undefined)
    .map(m => m.model_agreement);

  const modelAgreementRate = agreementRates.length > 0
    ? agreementRates.reduce((a, b) => a + b, 0) / agreementRates.length
    : 0;

  return {
    avg_confidence: Math.round(avgConfidence * 100) / 100,
    quality_flags: qualityFlags,
    model_agreement_rate: Math.round(modelAgreementRate * 100) / 100
  };
}

function generateTrends(timeSeries: any[], breakdowns: any) {
  if (timeSeries.length < 2) {
    return { trend: 'insufficient_data', change_percent: 0 };
  }

  const recent = timeSeries.slice(-7); // Last 7 periods
  const previous = timeSeries.slice(-14, -7); // Previous 7 periods

  if (previous.length === 0) {
    return { trend: 'insufficient_data', change_percent: 0 };
  }

  const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
  const previousAvg = previous.reduce((sum, item) => sum + item.value, 0) / previous.length;

  const changePercent = previousAvg !== 0
    ? ((recentAvg - previousAvg) / previousAvg) * 100
    : 0;

  let trend = 'stable';
  if (Math.abs(changePercent) > 5) {
    trend = changePercent > 0 ? 'increasing' : 'decreasing';
  }

  return {
    trend,
    change_percent: Math.round(changePercent * 100) / 100,
    recent_avg: Math.round(recentAvg * 100) / 100,
    previous_avg: Math.round(previousAvg * 100) / 100
  };
}