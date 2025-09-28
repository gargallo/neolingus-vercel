/**
 * GET /api/v1/score/reports
 * Generate detailed scoring reports (CSV, PDF, JSON)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClientFromRequest } from '@/utils/supabase/server';
import { createScoringDbFromRequest, setTenantContext } from '@/lib/scoring/db/client';
import { isValidAdmin } from '@/lib/auth/admin';

interface ReportQuery {
  format: 'json' | 'csv' | 'pdf';
  type: 'summary' | 'detailed' | 'performance' | 'quality' | 'user_progress';
  date_from?: string;
  date_to?: string;
  provider?: string;
  level?: string;
  task?: string;
  user_id?: string;
  include_failed?: boolean;
  include_metadata?: boolean;
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const query: ReportQuery = {
      format: (searchParams.get('format') as any) || 'json',
      type: (searchParams.get('type') as any) || 'summary',
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      provider: searchParams.get('provider') || undefined,
      level: searchParams.get('level') || undefined,
      task: searchParams.get('task') || undefined,
      user_id: searchParams.get('user_id') || undefined,
      include_failed: searchParams.get('include_failed') === 'true',
      include_metadata: searchParams.get('include_metadata') === 'true'
    };

    // Admin check for detailed reports and other users' data
    const isAdmin = await isValidAdmin(user.id);
    if (query.user_id && query.user_id !== user.id && !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Validate parameters
    if (!['json', 'csv', 'pdf'].includes(query.format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Use json, csv, or pdf' },
        { status: 400 }
      );
    }

    if (!['summary', 'detailed', 'performance', 'quality', 'user_progress'].includes(query.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Set default date range (last 30 days)
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

    // Generate report data
    const reportData = await generateReport(scoringDb, query, dateFrom, dateTo, isAdmin, user.id);

    // Return appropriate format
    switch (query.format) {
      case 'csv':
        return generateCSVResponse(reportData, query.type);
      case 'pdf':
        return generatePDFResponse(reportData, query.type);
      default: // json
        return NextResponse.json({
          success: true,
          report: reportData,
          meta: {
            generated_at: new Date().toISOString(),
            report_type: query.type,
            date_range: {
              from: dateFrom.toISOString(),
              to: dateTo.toISOString()
            },
            filters: {
              provider: query.provider,
              level: query.level,
              task: query.task,
              user_id: query.user_id
            }
          }
        });
    }

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateReport(
  scoringDb: any,
  query: ReportQuery,
  dateFrom: Date,
  dateTo: Date,
  isAdmin: boolean,
  userId: string
) {
  const supabase = scoringDb.client;

  // Build base query
  let baseQuery = supabase
    .from('scoring_attempts')
    .select(`
      id,
      created_at,
      updated_at,
      user_id,
      exam_session_id,
      provider,
      level,
      task,
      status,
      score_json,
      processing_time_ms,
      quality_metrics,
      payload,
      error_details
    `)
    .gte('created_at', dateFrom.toISOString())
    .lte('created_at', dateTo.toISOString());

  // Apply filters
  if (query.provider) baseQuery = baseQuery.eq('provider', query.provider);
  if (query.level) baseQuery = baseQuery.eq('level', query.level);
  if (query.task) baseQuery = baseQuery.eq('task', query.task);
  if (query.user_id) {
    baseQuery = baseQuery.eq('user_id', query.user_id);
  } else if (!isAdmin) {
    // Non-admin users can only see their own data
    baseQuery = baseQuery.eq('user_id', userId);
  }

  // Include/exclude failed attempts
  if (!query.include_failed) {
    baseQuery = baseQuery.neq('status', 'failed');
  }

  const { data: attempts, error } = await baseQuery.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Report query failed: ${error.message}`);
  }

  // Generate report based on type
  switch (query.type) {
    case 'summary':
      return generateSummaryReport(attempts || []);
    case 'detailed':
      return generateDetailedReport(attempts || [], query.include_metadata);
    case 'performance':
      return generatePerformanceReport(attempts || []);
    case 'quality':
      return generateQualityReport(attempts || []);
    case 'user_progress':
      return generateUserProgressReport(attempts || [], isAdmin);
    default:
      throw new Error('Invalid report type');
  }
}

function generateSummaryReport(attempts: any[]) {
  const scored = attempts.filter(a => a.status === 'scored' && a.score_json);
  const failed = attempts.filter(a => a.status === 'failed');

  // Group by provider
  const byProvider = new Map();
  attempts.forEach(attempt => {
    const provider = attempt.provider;
    if (!byProvider.has(provider)) {
      byProvider.set(provider, []);
    }
    byProvider.get(provider).push(attempt);
  });

  // Group by level
  const byLevel = new Map();
  attempts.forEach(attempt => {
    const level = attempt.level;
    if (!byLevel.has(level)) {
      byLevel.set(level, []);
    }
    byLevel.get(level).push(attempt);
  });

  return {
    overview: {
      total_attempts: attempts.length,
      scored_attempts: scored.length,
      failed_attempts: failed.length,
      success_rate: attempts.length > 0 ? (scored.length / attempts.length) * 100 : 0,
      date_range: {
        first_attempt: attempts.length > 0 ? attempts[attempts.length - 1].created_at : null,
        last_attempt: attempts.length > 0 ? attempts[0].created_at : null
      }
    },
    performance: {
      avg_score: scored.length > 0
        ? scored.reduce((sum, a) => sum + (a.score_json?.percentage || 0), 0) / scored.length
        : 0,
      pass_rate: scored.length > 0
        ? (scored.filter(a => a.score_json?.pass).length / scored.length) * 100
        : 0,
      avg_processing_time: attempts
        .filter(a => a.processing_time_ms)
        .reduce((sum, a, _, arr) => sum + a.processing_time_ms / arr.length, 0)
    },
    breakdowns: {
      by_provider: Array.from(byProvider.entries()).map(([provider, providerAttempts]) => ({
        provider,
        count: providerAttempts.length,
        success_rate: providerAttempts.length > 0
          ? (providerAttempts.filter((a: any) => a.status === 'scored').length / providerAttempts.length) * 100
          : 0
      })),
      by_level: Array.from(byLevel.entries()).map(([level, levelAttempts]) => ({
        level,
        count: levelAttempts.length,
        success_rate: levelAttempts.length > 0
          ? (levelAttempts.filter((a: any) => a.status === 'scored').length / levelAttempts.length) * 100
          : 0
      }))
    }
  };
}

function generateDetailedReport(attempts: any[], includeMetadata: boolean) {
  return {
    attempts: attempts.map(attempt => {
      const base = {
        id: attempt.id,
        created_at: attempt.created_at,
        updated_at: attempt.updated_at,
        user_id: attempt.user_id,
        provider: attempt.provider,
        level: attempt.level,
        task: attempt.task,
        status: attempt.status,
        processing_time_ms: attempt.processing_time_ms,
        score: attempt.score_json ? {
          total_score: attempt.score_json.total_score,
          max_score: attempt.score_json.max_score,
          percentage: attempt.score_json.percentage,
          pass: attempt.score_json.pass
        } : null
      };

      if (includeMetadata) {
        return {
          ...base,
          exam_session_id: attempt.exam_session_id,
          quality_metrics: attempt.quality_metrics,
          detailed_scores: attempt.score_json?.detailed_scores,
          feedback: attempt.score_json?.feedback,
          error_details: attempt.error_details
        };
      }

      return base;
    }),
    total_count: attempts.length
  };
}

function generatePerformanceReport(attempts: any[]) {
  const processingTimes = attempts
    .filter(a => a.processing_time_ms && a.processing_time_ms > 0)
    .map(a => a.processing_time_ms)
    .sort((a, b) => a - b);

  const timesByHour = new Map();
  attempts.forEach(attempt => {
    const hour = new Date(attempt.created_at).getUTCHours();
    if (!timesByHour.has(hour)) {
      timesByHour.set(hour, []);
    }
    if (attempt.processing_time_ms) {
      timesByHour.get(hour).push(attempt.processing_time_ms);
    }
  });

  return {
    processing_times: {
      count: processingTimes.length,
      avg: processingTimes.length > 0 ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length : 0,
      median: processingTimes.length > 0 ? processingTimes[Math.floor(processingTimes.length / 2)] : 0,
      p95: processingTimes.length > 0 ? processingTimes[Math.floor(processingTimes.length * 0.95)] : 0,
      p99: processingTimes.length > 0 ? processingTimes[Math.floor(processingTimes.length * 0.99)] : 0,
      min: processingTimes.length > 0 ? Math.min(...processingTimes) : 0,
      max: processingTimes.length > 0 ? Math.max(...processingTimes) : 0
    },
    hourly_distribution: Array.from(timesByHour.entries()).map(([hour, times]) => ({
      hour,
      attempt_count: times.length,
      avg_processing_time: times.length > 0 ? times.reduce((a: number, b: number) => a + b, 0) / times.length : 0
    })).sort((a, b) => a.hour - b.hour),
    status_distribution: {
      queued: attempts.filter(a => a.status === 'queued').length,
      processing: attempts.filter(a => a.status === 'processing').length,
      scored: attempts.filter(a => a.status === 'scored').length,
      failed: attempts.filter(a => a.status === 'failed').length
    }
  };
}

function generateQualityReport(attempts: any[]) {
  const scored = attempts.filter(a => a.status === 'scored' && a.score_json);
  const withQualityMetrics = scored.filter(a => a.quality_metrics);

  const confidenceScores = withQualityMetrics
    .map(a => a.quality_metrics?.confidence || 0)
    .filter(c => c > 0);

  const modelAgreements = withQualityMetrics
    .map(a => a.quality_metrics?.model_agreement || 0)
    .filter(a => a > 0);

  return {
    quality_overview: {
      total_scored: scored.length,
      with_quality_metrics: withQualityMetrics.length,
      avg_confidence: confidenceScores.length > 0
        ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length
        : 0,
      avg_model_agreement: modelAgreements.length > 0
        ? modelAgreements.reduce((a, b) => a + b, 0) / modelAgreements.length
        : 0
    },
    flags_summary: withQualityMetrics.reduce((summary, attempt) => {
      const flags = attempt.quality_metrics?.flags || [];
      flags.forEach((flag: string) => {
        summary[flag] = (summary[flag] || 0) + 1;
      });
      return summary;
    }, {} as Record<string, number>),
    score_distribution: {
      high_scores: scored.filter(a => a.score_json.percentage >= 80).length,
      medium_scores: scored.filter(a => a.score_json.percentage >= 60 && a.score_json.percentage < 80).length,
      low_scores: scored.filter(a => a.score_json.percentage < 60).length,
      passing: scored.filter(a => a.score_json.pass).length,
      failing: scored.filter(a => !a.score_json.pass).length
    }
  };
}

function generateUserProgressReport(attempts: any[], isAdmin: boolean) {
  if (!isAdmin) {
    // Non-admin users get their own progress only
    return generateUserProgressSummary(attempts);
  }

  // Admin users get aggregated user progress
  const userMap = new Map();
  attempts.forEach(attempt => {
    const userId = attempt.user_id;
    if (!userMap.has(userId)) {
      userMap.set(userId, []);
    }
    userMap.get(userId).push(attempt);
  });

  return {
    user_summaries: Array.from(userMap.entries()).map(([userId, userAttempts]) => ({
      user_id: userId,
      ...generateUserProgressSummary(userAttempts)
    })),
    total_users: userMap.size
  };
}

function generateUserProgressSummary(attempts: any[]) {
  const scored = attempts.filter(a => a.status === 'scored' && a.score_json);
  const scores = scored.map(a => a.score_json.percentage);

  return {
    total_attempts: attempts.length,
    scored_attempts: scored.length,
    avg_score: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    best_score: scores.length > 0 ? Math.max(...scores) : 0,
    recent_score: scored.length > 0 ? scored[0].score_json.percentage : 0,
    improvement_trend: scores.length >= 2 ? scores[0] - scores[scores.length - 1] : 0,
    providers_used: [...new Set(attempts.map(a => a.provider))],
    levels_attempted: [...new Set(attempts.map(a => a.level))],
    tasks_completed: [...new Set(attempts.map(a => a.task))]
  };
}

function generateCSVResponse(reportData: any, reportType: string) {
  let csvContent = '';
  let headers: string[] = [];
  let rows: any[][] = [];

  switch (reportType) {
    case 'detailed':
      headers = ['ID', 'Created At', 'User ID', 'Provider', 'Level', 'Task', 'Status', 'Score %', 'Pass', 'Processing Time (ms)'];
      rows = reportData.attempts.map((attempt: any) => [
        attempt.id,
        attempt.created_at,
        attempt.user_id,
        attempt.provider,
        attempt.level,
        attempt.task,
        attempt.status,
        attempt.score?.percentage || '',
        attempt.score?.pass || '',
        attempt.processing_time_ms || ''
      ]);
      break;

    case 'summary':
      headers = ['Provider', 'Attempts', 'Success Rate %'];
      rows = reportData.breakdowns.by_provider.map((item: any) => [
        item.provider,
        item.count,
        item.success_rate.toFixed(1)
      ]);
      break;

    default:
      throw new Error('CSV format not supported for this report type');
  }

  csvContent = headers.join(',') + '\n';
  csvContent += rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="scoring-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv"`
    }
  });
}

function generatePDFResponse(reportData: any, reportType: string) {
  // For now, return a simple text representation
  // In a full implementation, you would use a PDF library like puppeteer or jsPDF
  const textContent = `Scoring Report - ${reportType.toUpperCase()}\n\n${JSON.stringify(reportData, null, 2)}`;

  return new NextResponse(textContent, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="scoring-report-${reportType}-${new Date().toISOString().split('T')[0]}.pdf"`
    }
  });
}