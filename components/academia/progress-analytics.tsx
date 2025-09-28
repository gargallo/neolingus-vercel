"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

// Mock Chart.js components for server-side rendering and testing
const LineChart = ({ data, options, ...props }: any) => (
  <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} {...props} />
);

const BarChart = ({ data, options, ...props }: any) => (
  <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} {...props} />
);

const DoughnutChart = ({ data, options, ...props }: any) => (
  <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} {...props} />
);

const RadarChart = ({ data, options, ...props }: any) => (
  <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)} {...props} />
);

// Analytics data interface
interface AnalyticsData {
  userId: string;
  courseId: string;
  timeRange: string;
  overallMetrics: {
    totalExams: number;
    averageScore: number;
    improvementRate: number;
    studyTime: number;
    streak: number;
  };
  progressTimeline: Array<{
    date: string;
    score: number;
    exam: string;
  }>;
  skillBreakdown: {
    reading: { score: number; improvement: number };
    listening: { score: number; improvement: number };
    writing: { score: number; improvement: number };
    speaking: { score: number; improvement: number };
    grammar: { score: number; improvement: number };
    vocabulary: { score: number; improvement: number };
  };
  weeklyActivity: Array<{
    week: string;
    sessions: number;
    hours: number;
  }>;
  insights: Array<{
    type: string;
    skill: string;
    message: string;
    confidence: number;
  }>;
}

interface ProgressAnalyticsProps {
  analyticsData: AnalyticsData | null;
  courseId: string;
  isLoading?: boolean;
  error?: string | null;
  onTimeRangeChange?: (timeRange: string) => void;
  onExportData?: (data: AnalyticsData, format: string) => void;
  onRefresh?: () => void;
  useAnalyticsHook?: (courseId: string) => {
    data: AnalyticsData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
  };
}

export function ProgressAnalytics({
  analyticsData,
  courseId,
  isLoading = false,
  error = null,
  onTimeRangeChange,
  onExportData,
  onRefresh,
  useAnalyticsHook,
}: ProgressAnalyticsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = createClient();

  // Hook integration if provided
  const hookData = useAnalyticsHook?.(courseId);
  const effectiveData = hookData?.data || analyticsData;
  const effectiveLoading = hookData?.isLoading ?? isLoading;
  const effectiveError = hookData?.error ?? error;

  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== 'undefined') {
        setIsMobile(window.innerWidth < 768);
      }
    };
    
    checkMobile();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  // Handle time range changes
  const handleTimeRangeChange = useCallback((timeRange: string) => {
    setSelectedTimeRange(timeRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(timeRange);
    }
  }, [onTimeRangeChange]);

  // Handle chart type switching
  const handleChartTypeChange = useCallback((type: 'line' | 'bar') => {
    setChartType(type);
  }, []);

  // Handle skill detail expansion
  const handleSkillExpansion = useCallback((skill: string) => {
    setExpandedSkill(expandedSkill === skill ? null : skill);
  }, [expandedSkill]);

  // Handle export functionality
  const handleExport = useCallback((format: 'pdf' | 'csv' = 'pdf') => {
    if (effectiveData && onExportData) {
      onExportData(effectiveData, format);
    }
  }, [effectiveData, onExportData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    if (hookData?.refetch) {
      hookData.refetch();
    } else if (onRefresh) {
      onRefresh();
    }
  }, [hookData, onRefresh]);

  // Memoized chart data processing
  const chartData = useMemo(() => {
    if (!effectiveData) return null;

    // Progress timeline chart data
    const timelineData = {
      labels: effectiveData.progressTimeline.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [{
        label: 'Score Progress',
        data: effectiveData.progressTimeline.map(item => item.score),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };

    // Skill breakdown radar data
    const skillData = {
      labels: Object.keys(effectiveData.skillBreakdown).map(skill => 
        skill.charAt(0).toUpperCase() + skill.slice(1)
      ),
      datasets: [{
        label: 'Skill Levels',
        data: Object.values(effectiveData.skillBreakdown).map(skill => skill.score),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2
      }]
    };

    // Weekly activity bar data
    const activityData = {
      labels: effectiveData.weeklyActivity.map(week => week.week),
      datasets: [{
        label: 'Sessions',
        data: effectiveData.weeklyActivity.map(week => week.sessions),
        backgroundColor: 'rgba(34, 197, 94, 0.8)'
      }, {
        label: 'Hours',
        data: effectiveData.weeklyActivity.map(week => week.hours),
        backgroundColor: 'rgba(168, 85, 247, 0.8)'
      }]
    };

    return {
      timeline: timelineData,
      skills: skillData,
      activity: activityData
    };
  }, [effectiveData]);

  // Skeleton loading components
  const SkeletonChart = () => (
    <div className="animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg" data-testid="skeleton"></div>
    </div>
  );

  const SkeletonMetrics = () => (
    <div className="animate-pulse">
      <div className="h-20 bg-gray-200 rounded-lg" data-testid="skeleton"></div>
    </div>
  );

  // Loading state
  if (effectiveLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8" role="status" aria-live="polite">
        <div className="mb-8 space-y-4">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="animate-pulse h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonMetrics key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
            <SkeletonChart />
          </div>
        </div>
        <p className="sr-only">Loading analytics data...</p>
      </div>
    );
  }

  // Error state
  if (effectiveError) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6" role="alert">
          <h3 className="text-red-800 font-medium">Error loading analytics</h3>
          <p className="text-red-600 mt-1">{effectiveError}</p>
          <div className="mt-4 flex space-x-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              aria-label="Retry loading analytics data"
            >
              Retry
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!effectiveData || !effectiveData.progressTimeline.length || effectiveData.overallMetrics.totalExams === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h2 className="text-xl font-medium text-gray-900 mb-2">No analytics data available</h2>
            <p className="text-gray-600 mb-6">Start taking exams to see your progress analytics.</p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/dashboard/${courseId}/exams`;
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start Taking Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Partial data handling
  const hasSkillBreakdown = effectiveData.skillBreakdown && Object.keys(effectiveData.skillBreakdown).length > 0;
  const hasInsights = effectiveData.insights && effectiveData.insights.length > 0;

  // Screen reader text for charts
  const progressTrendText = effectiveData.progressTimeline.length > 0 
    ? `Progress trend from ${effectiveData.progressTimeline[0].score} to ${effectiveData.progressTimeline[effectiveData.progressTimeline.length - 1].score} points`
    : 'No progress data available';

  const highestSkill = hasSkillBreakdown 
    ? Object.entries(effectiveData.skillBreakdown).reduce((highest, [skill, data]) => 
        data.score > highest.score ? { skill, score: data.score } : highest, 
        { skill: '', score: 0 }
      )
    : null;

  return (
    <main className={`max-w-6xl mx-auto px-4 py-8 ${isMobile ? 'mobile-layout' : ''}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2" role="heading" aria-level={1}>
              Progress Analytics
            </h1>
            <p className="text-gray-600">Performance Overview and Insights</p>
          </div>
          <div className="flex space-x-3">
            <select
              value={selectedTimeRange}
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              aria-label="Time range selection"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <button
              onClick={() => handleExport('pdf')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              aria-label="Export analytics data as PDF"
            >
              Export
            </button>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label="Refresh analytics data"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Overall Metrics */}
      <div className={`grid gap-4 mb-8 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-5'}`} data-testid="metrics-grid">
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-blue-600">{effectiveData.overallMetrics.totalExams}</div>
          <div className="text-sm text-gray-600 mt-1">Total Exams</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-green-600">{effectiveData.overallMetrics.averageScore.toFixed(1)}</div>
          <div className="text-sm text-gray-600 mt-1">Average Score</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-purple-600">+{effectiveData.overallMetrics.improvementRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600 mt-1">Improvement</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-orange-600">{Math.round(effectiveData.overallMetrics.studyTime / 60)}h</div>
          <div className="text-sm text-gray-600 mt-1">Study Time</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="text-3xl font-bold text-red-600">{effectiveData.overallMetrics.streak} days</div>
          <div className="text-sm text-gray-600 mt-1">Current Streak</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Progress Timeline */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900" role="heading" aria-level={2}>Progress Timeline</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => handleChartTypeChange('line')}
                className={`px-3 py-1 text-sm rounded ${chartType === 'line' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Line
              </button>
              <button
                onClick={() => handleChartTypeChange('bar')}
                className={`px-3 py-1 text-sm rounded ${chartType === 'bar' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                aria-label="Switch to bar chart view"
              >
                Bar Chart
              </button>
            </div>
          </div>
          <div className="aspect-video md:aspect-[4/3]" data-testid="chart-container">
            {chartType === 'line' && chartData ? (
              <LineChart 
                data={chartData.timeline}
                aria-label="Progress timeline showing score improvements over time"
              />
            ) : chartData ? (
              <BarChart 
                data={chartData.timeline}
                aria-label="Progress timeline showing score improvements over time"
              />
            ) : null}
          </div>
          <p className="sr-only">{progressTrendText}</p>
        </div>

        {/* Skill Breakdown */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" role="heading" aria-level={2}>Skill Breakdown</h2>
          {hasSkillBreakdown ? (
            <>
              <div className="aspect-video md:aspect-[4/3]" data-testid="chart-container">
                <RadarChart 
                  data={chartData?.skills}
                  aria-label="Skill breakdown showing performance across different language skills"
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(effectiveData.skillBreakdown).map(([skill, data]) => (
                  <div key={skill} className="flex justify-between items-center">
                    <button
                      onClick={() => handleSkillExpansion(skill)}
                      className="text-gray-700 hover:text-blue-600 transition-colors"
                      aria-label={`${skill} details`}
                    >
                      {skill.charAt(0).toUpperCase() + skill.slice(1)}: {data.score}
                    </button>
                    {expandedSkill === skill && (
                      <div className="text-xs text-gray-500 ml-2">
                        Detailed {skill} analysis available
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {highestSkill && (
                <p className="sr-only">Highest skill: {highestSkill.skill} at {highestSkill.score} points</p>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Skill analysis unavailable</p>
              <p className="text-sm mt-2">Complete more exams to see skill breakdown</p>
            </div>
          )}
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" role="heading" aria-level={2}>Weekly Activity</h2>
          <div className="aspect-video md:aspect-[4/3]" data-testid="chart-container">
            <BarChart 
              data={chartData?.activity}
              aria-label="Weekly activity showing study sessions and hours"
            />
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-sm p-6 border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4" role="heading" aria-level={2}>AI Insights</h2>
          {hasInsights ? (
            <div className="space-y-4">
              {effectiveData.insights.map((insight, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-lg border-l-4 ${
                    insight.type === 'strength' 
                      ? 'bg-green-50 border-green-400' 
                      : insight.type === 'improvement_area'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 capitalize">{insight.skill}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                    </div>
                    <div className="text-xs text-gray-500 ml-2">
                      {Math.round(insight.confidence * 100)}% confidence
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No insights available</p>
              <p className="text-sm mt-2">Complete more exams to generate insights</p>
            </div>
          )}
        </div>
      </div>

      {/* Status for dynamic updates */}
      <div role="status" aria-live="polite" className="sr-only">
        {effectiveData ? 'Analytics updated' : 'No analytics available'}
      </div>
    </main>
  );
}