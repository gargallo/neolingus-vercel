"use client";

import { useState, useEffect, useMemo } from "react";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
} from "chart.js";
import { UserProgress, ComponentAnalysis, ExamSession } from "@/lib/exam-engine/types";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale
);

interface AnalyticsDashboardProps {
  userId: string;
  courseId: string;
  progress?: UserProgress;
  examSessions?: ExamSession[];
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

interface PerformanceMetrics {
  overallScore: number;
  readinessScore: number;
  improvementRate: number;
  consistencyScore: number;
  studyHours: number;
  sessionsCompleted: number;
  averageSessionTime: number;
  strongestSkill: string;
  weakestSkill: string;
  predictedExamScore?: number;
}

interface ChartData {
  progressOverTime: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      tension: number;
    }>;
  };
  componentBreakdown: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }>;
  };
  skillsRadar: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      pointBackgroundColor: string;
      pointBorderColor: string;
      pointHoverBackgroundColor: string;
      pointHoverBorderColor: string;
    }>;
  };
  sessionActivity: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
    }>;
  };
}

export default function AnalyticsDashboard({
  userId,
  courseId,
  progress,
  examSessions = [],
  onRefresh,
  isLoading = false,
  error = null,
  className = "",
}: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState<"week" | "month" | "quarter" | "all">("month");
  const [selectedMetric, setSelectedMetric] = useState<"score" | "time" | "improvement">("score");
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: "index" as const,
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: { size: 11 },
        },
      },
      y: {
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: { size: 11 },
        },
      },
    },
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgba(255, 255, 255, 0.2)",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      r: {
        angleLines: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        pointLabels: {
          font: { size: 11 },
        },
        ticks: {
          beginAtZero: true,
          max: 100,
          stepSize: 20,
          font: { size: 10 },
        },
      },
    },
  };

  // Calculate performance metrics
  const performanceMetrics = useMemo<PerformanceMetrics>(() => {
    if (!progress) {
      return {
        overallScore: 0,
        readinessScore: 0,
        improvementRate: 0,
        consistencyScore: 0,
        studyHours: 0,
        sessionsCompleted: 0,
        averageSessionTime: 0,
        strongestSkill: "N/A",
        weakestSkill: "N/A",
      };
    }

    const analytics = progress.analytics;
    const completedSessions = examSessions.filter(s => s.isCompleted);
    
    // Calculate component scores
    const componentScores = Object.entries(analytics.componentAnalysis || {}).map(
      ([component, analysis]) => ({
        component,
        score: (analysis as ComponentAnalysis).averageScore,
      })
    );

    const strongestSkill = componentScores.reduce((prev, curr) =>
      curr.score > prev.score ? curr : prev
    ).component || "N/A";

    const weakestSkill = componentScores.reduce((prev, curr) =>
      curr.score < prev.score ? curr : prev
    ).component || "N/A";

    const totalSessionTime = completedSessions.reduce(
      (sum, session) => sum + session.durationSeconds, 0
    ) / 3600; // Convert to hours

    const averageSessionTime = completedSessions.length > 0 
      ? totalSessionTime / completedSessions.length * 60 // Convert to minutes
      : 0;

    return {
      overallScore: Math.round(analytics.averageScore || 0),
      readinessScore: Math.round((progress.readinessScore || 0) * 100),
      improvementRate: Math.round((analytics.improvementRate || 0) * 100),
      consistencyScore: Math.round((analytics.consistencyScore || 0) * 100),
      studyHours: Math.round(totalSessionTime * 10) / 10,
      sessionsCompleted: completedSessions.length,
      averageSessionTime: Math.round(averageSessionTime),
      strongestSkill: strongestSkill.charAt(0).toUpperCase() + strongestSkill.slice(1),
      weakestSkill: weakestSkill.charAt(0).toUpperCase() + weakestSkill.slice(1),
      predictedExamScore: analytics.predictedExamScore,
    };
  }, [progress, examSessions]);

  // Generate chart data
  const chartData = useMemo<ChartData>(() => {
    const completedSessions = examSessions
      .filter(s => s.isCompleted)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    // Progress over time
    const progressLabels = completedSessions.slice(-10).map(session => 
      new Date(session.startedAt).toLocaleDateString()
    );
    const progressScores = completedSessions.slice(-10).map(session => 
      session.score || 0
    );

    // Component breakdown
    const componentData = progress?.analytics?.componentAnalysis || {};
    const componentLabels = Object.keys(componentData).map(comp => 
      comp.charAt(0).toUpperCase() + comp.slice(1)
    );
    const componentScores = Object.values(componentData).map(analysis => 
      (analysis as ComponentAnalysis).averageScore
    );

    // Skills radar
    const skillsData = progress?.analytics?.componentAnalysis || {};
    const skillLabels = Object.keys(skillsData);
    const skillScores = Object.values(skillsData).map(analysis => 
      (analysis as ComponentAnalysis).averageScore
    );

    // Session activity
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return date;
    });

    const sessionCounts = last30Days.map(date => {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      return completedSessions.filter(session => {
        const sessionDate = new Date(session.startedAt);
        return sessionDate >= dayStart && sessionDate <= dayEnd;
      }).length;
    });

    return {
      progressOverTime: {
        labels: progressLabels,
        datasets: [{
          label: "Score Progress",
          data: progressScores,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
        }],
      },
      componentBreakdown: {
        labels: componentLabels,
        datasets: [{
          label: "Component Scores",
          data: componentScores,
          backgroundColor: [
            "rgba(239, 68, 68, 0.8)",
            "rgba(245, 158, 11, 0.8)",
            "rgba(34, 197, 94, 0.8)",
            "rgba(168, 85, 247, 0.8)",
          ],
          borderColor: [
            "rgba(239, 68, 68, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(34, 197, 94, 1)",
            "rgba(168, 85, 247, 1)",
          ],
          borderWidth: 2,
        }],
      },
      skillsRadar: {
        labels: skillLabels.map(label => 
          label.charAt(0).toUpperCase() + label.slice(1)
        ),
        datasets: [{
          label: "Current Level",
          data: skillScores,
          borderColor: "rgba(59, 130, 246, 1)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          pointBackgroundColor: "rgba(59, 130, 246, 1)",
          pointBorderColor: "#fff",
          pointHoverBackgroundColor: "#fff",
          pointHoverBorderColor: "rgba(59, 130, 246, 1)",
        }],
      },
      sessionActivity: {
        labels: last30Days.map(date => 
          date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        ),
        datasets: [{
          label: "Sessions Completed",
          data: sessionCounts,
          backgroundColor: "rgba(34, 197, 94, 0.6)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        }],
      },
    };
  }, [progress, examSessions]);

  const toggleDetails = (section: string) => {
    setShowDetails(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-md p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error loading analytics</h3>
          <p className="text-red-600 mt-1">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-md ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-gray-600 mt-1">
              Detailed insights into your learning progress and performance
            </p>
          </div>
          <div className="flex space-x-2">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as typeof timeframe)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Select timeframe"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last 3 Months</option>
              <option value="all">All Time</option>
            </select>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Refresh analytics"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Overall Score</p>
                <p className="text-2xl font-bold text-blue-900">
                  {performanceMetrics.overallScore}%
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Readiness Score</p>
                <p className="text-2xl font-bold text-green-900">
                  {performanceMetrics.readinessScore}%
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Study Hours</p>
                <p className="text-2xl font-bold text-purple-900">
                  {performanceMetrics.studyHours}h
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Sessions</p>
                <p className="text-2xl font-bold text-orange-900">
                  {performanceMetrics.sessionsCompleted}
                </p>
              </div>
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Chart */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Progress Over Time</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMetric("score")}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedMetric === "score"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Score
              </button>
              <button
                onClick={() => setSelectedMetric("time")}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedMetric === "time"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setSelectedMetric("improvement")}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedMetric === "improvement"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Improvement
              </button>
            </div>
          </div>
          <div className="h-64 bg-gray-50 rounded-lg p-4">
            <Line data={chartData.progressOverTime} options={chartOptions} />
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Component Breakdown */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Component Breakdown</h3>
              <button
                onClick={() => toggleDetails("components")}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showDetails.components ? "Hide Details" : "View Details"}
              </button>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg p-4">
              <Doughnut data={chartData.componentBreakdown} options={chartOptions} />
            </div>
            {showDetails.components && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Strongest:</strong> {performanceMetrics.strongestSkill} •{" "}
                  <strong>Needs work:</strong> {performanceMetrics.weakestSkill}
                </p>
              </div>
            )}
          </div>

          {/* Skills Radar */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Skills Overview</h3>
              <button
                onClick={() => toggleDetails("skills")}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showDetails.skills ? "Hide Details" : "View Details"}
              </button>
            </div>
            <div className="h-64 bg-gray-50 rounded-lg p-4">
              <Radar data={chartData.skillsRadar} options={radarOptions} />
            </div>
            {showDetails.skills && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Consistency Score:</strong> {performanceMetrics.consistencyScore}% •{" "}
                  <strong>Improvement Rate:</strong> {performanceMetrics.improvementRate}%
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="h-48 bg-gray-50 rounded-lg p-4">
            <Bar data={chartData.sessionActivity} options={chartOptions} />
          </div>
        </div>

        {/* Performance Insights */}
        {performanceMetrics.predictedExamScore && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Prediction</h3>
            <p className="text-gray-700">
              Based on your current performance, you have a{" "}
              <strong className="text-blue-700">
                {Math.round(performanceMetrics.predictedExamScore)}%
              </strong>{" "}
              predicted exam score.
            </p>
            <div className="mt-4 flex items-center space-x-4">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">Confidence Level</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${performanceMetrics.consistencyScore}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {performanceMetrics.consistencyScore > 80 ? "High" :
                 performanceMetrics.consistencyScore > 60 ? "Medium" : "Low"} Confidence
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}