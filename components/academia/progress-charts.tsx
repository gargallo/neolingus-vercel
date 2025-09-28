"use client";

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Calendar,
  Clock,
  Award,
  Zap,
  Eye,
  EyeOff,
  Info,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

// Types for enhanced charts
interface SkillProgress {
  name: string;
  current: number;
  target: number;
  improvement: number;
  sessions: number;
  lastPracticed: Date | null;
  difficulty: 'easy' | 'medium' | 'hard';
  trend: 'up' | 'down' | 'stable';
}

interface TimeSeriesPoint {
  date: Date;
  value: number;
  label?: string;
  type?: 'practice' | 'exam' | 'milestone';
}

interface ChartTheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  danger: string;
  background: string;
  text: string;
  border: string;
}

interface ProgressChartsProps {
  skillsData: SkillProgress[];
  timeSeriesData: TimeSeriesPoint[];
  overallProgress: number;
  weeklyGoal?: number;
  weeklyCompleted?: number;
  className?: string;
  showDetailedView?: boolean;
  onSkillClick?: (skill: string) => void;
  onTimeRangeChange?: (range: string) => void;
}

// Circular Progress Chart Component
interface CircularProgressProps {
  value: number;
  max: number;
  size: number;
  strokeWidth: number;
  color: string;
  backgroundColor?: string;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  size,
  strokeWidth,
  color,
  backgroundColor = '#e5e7eb',
  label,
  showPercentage = true,
  animated = true,
  className = ''
}) => {
  const normalizedValue = Math.min(Math.max(value, 0), max);
  const percentage = (normalizedValue / max) * 100;

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * Math.PI * 2;
  const dash = (percentage * circumference) / 100;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="drop-shadow-sm"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? circumference : circumference - dash}
          strokeLinecap="round"
          className="drop-shadow-sm"
          animate={animated ? { strokeDashoffset: circumference - dash } : {}}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {showPercentage && (
          <motion.span
            className="text-lg font-bold text-gray-900 dark:text-white"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {Math.round(percentage)}%
          </motion.span>
        )}
        {label && (
          <span className="text-xs text-gray-600 dark:text-gray-400 max-w-[80%] leading-tight">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};

// Mini Bar Chart Component
interface MiniBarChartProps {
  data: number[];
  labels?: string[];
  color: string;
  height: number;
  animated?: boolean;
  className?: string;
}

const MiniBarChart: React.FC<MiniBarChartProps> = ({
  data,
  labels = [],
  color,
  height,
  animated = true,
  className = ''
}) => {
  const maxValue = Math.max(...data);
  const barWidth = 100 / data.length;

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div className="flex items-end justify-between h-full gap-1">
        {data.map((value, index) => {
          const barHeight = maxValue > 0 ? (value / maxValue) * 100 : 0;

          return (
            <div
              key={index}
              className="relative flex-1 flex flex-col items-center"
            >
              {/* Bar */}
              <motion.div
                className="w-full rounded-t-sm"
                style={{
                  backgroundColor: color,
                  height: animated ? `${barHeight}%` : `${barHeight}%`
                }}
                initial={{ height: 0 }}
                animate={{ height: `${barHeight}%` }}
                transition={{
                  delay: animated ? index * 0.1 : 0,
                  duration: 0.8,
                  ease: "easeOut"
                }}
              />

              {/* Label */}
              {labels[index] && (
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 absolute -bottom-6">
                  {labels[index]}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Line Chart Component
interface LineChartProps {
  data: TimeSeriesPoint[];
  width: number;
  height: number;
  color: string;
  animated?: boolean;
  showDots?: boolean;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  data,
  width,
  height,
  color,
  animated = true,
  showDots = true,
  className = ''
}) => {
  const padding = 20;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <p className="text-gray-500 text-sm">No data available</p>
      </div>
    );
  }

  const minValue = Math.min(...data.map(d => d.value));
  const maxValue = Math.max(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + chartHeight - ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, ...point };
  });

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className={className}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Grid lines */}
        <defs>
          <pattern
            id="grid"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 20 0 L 0 0 0 20"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="0.5"
              opacity="0.3"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        {/* Line path */}
        <motion.path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: animated ? 1 : 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
          className="drop-shadow-sm"
        />

        {/* Data points */}
        {showDots && points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={color}
            className="drop-shadow-sm cursor-pointer hover:r-6 transition-all"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              delay: animated ? index * 0.1 + 1 : 0,
              duration: 0.3
            }}
          >
            <title>{`${point.label || 'Value'}: ${point.value}`}</title>
          </motion.circle>
        ))}
      </svg>
    </div>
  );
};

// Skill Radar Chart Component
interface RadarChartProps {
  skills: SkillProgress[];
  size: number;
  animated?: boolean;
  className?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({
  skills,
  size,
  animated = true,
  className = ''
}) => {
  const center = size / 2;
  const radius = center - 40;
  const angleStep = (2 * Math.PI) / skills.length;

  const getPoint = (value: number, index: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const distance = (value / 100) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle)
    };
  };

  const pathData = skills
    .map((skill, index) => {
      const point = getPoint(skill.current, index);
      return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
    })
    .join(' ') + ' Z';

  return (
    <div className={className}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid circles */}
        {[20, 40, 60, 80, 100].map(percentage => (
          <circle
            key={percentage}
            cx={center}
            cy={center}
            r={(percentage / 100) * radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Grid lines */}
        {skills.map((_, index) => {
          const point = getPoint(100, index);
          return (
            <line
              key={index}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="#e5e7eb"
              strokeWidth="1"
              opacity="0.3"
            />
          );
        })}

        {/* Data area */}
        <motion.path
          d={pathData}
          fill="rgba(59, 130, 246, 0.2)"
          stroke="#3b82f6"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: animated ? 1 : 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Skill labels */}
        {skills.map((skill, index) => {
          const labelPoint = getPoint(110, index);
          return (
            <text
              key={index}
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              className="text-xs fill-gray-700 dark:fill-gray-300 font-medium"
              dy="0.3em"
            >
              {skill.name}
            </text>
          );
        })}

        {/* Data points */}
        {skills.map((skill, index) => {
          const point = getPoint(skill.current, index);
          return (
            <motion.circle
              key={index}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="#3b82f6"
              className="drop-shadow-sm"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: animated ? index * 0.1 + 0.5 : 0,
                duration: 0.3
              }}
            >
              <title>{`${skill.name}: ${skill.current}%`}</title>
            </motion.circle>
          );
        })}
      </svg>
    </div>
  );
};

// Main Progress Charts Component
export function ProgressCharts({
  skillsData = [],
  timeSeriesData = [],
  overallProgress = 0,
  weeklyGoal = 100,
  weeklyCompleted = 0,
  className = '',
  showDetailedView = false,
  onSkillClick,
  onTimeRangeChange
}: ProgressChartsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [visibleCharts, setVisibleCharts] = useState({
    overview: true,
    skills: true,
    timeline: true,
    weekly: true
  });

  // Chart theme based on current design system
  const theme: ChartTheme = {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#f8fafc',
    text: '#1f2937',
    border: '#e5e7eb'
  };

  // Process skills data for different chart types
  const processedSkills = useMemo(() => {
    return skillsData.map(skill => ({
      ...skill,
      color: skill.trend === 'up' ? theme.success :
             skill.trend === 'down' ? theme.danger :
             theme.primary
    }));
  }, [skillsData, theme]);

  // Weekly progress data
  const weeklyProgress = useMemo(() => {
    const percentage = weeklyGoal > 0 ? (weeklyCompleted / weeklyGoal) * 100 : 0;
    return Math.min(percentage, 100);
  }, [weeklyCompleted, weeklyGoal]);

  // Recent performance trend (last 7 data points)
  const recentTrend = useMemo(() => {
    if (timeSeriesData.length < 2) return 'stable';

    const recent = timeSeriesData.slice(-7);
    const first = recent[0]?.value || 0;
    const last = recent[recent.length - 1]?.value || 0;
    const change = ((last - first) / first) * 100;

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }, [timeSeriesData]);

  const handleTimeRangeChange = useCallback((range: string) => {
    setSelectedTimeRange(range);
    onTimeRangeChange?.(range);
  }, [onTimeRangeChange]);

  const toggleChartVisibility = useCallback((chartId: string) => {
    setVisibleCharts(prev => ({
      ...prev,
      [chartId]: !prev[chartId as keyof typeof prev]
    }));
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-600" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Progress Analytics
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your learning journey with detailed insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-label="Select time range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 3 months</option>
            <option value="1y">Last year</option>
          </select>

          {/* View toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpandedChart(expandedChart ? null : 'overview')}
            className="flex items-center gap-2"
          >
            {expandedChart ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {expandedChart ? 'Compact' : 'Detailed'}
          </Button>
        </div>
      </div>

      {/* Overall Progress Overview */}
      <AnimatePresence>
        {visibleCharts.overview && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-gray-900 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Overall Progress
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your learning journey overview
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getTrendIcon(recentTrend)}
                  <Badge variant={recentTrend === 'up' ? 'default' : recentTrend === 'down' ? 'destructive' : 'secondary'}>
                    {recentTrend === 'up' ? 'Improving' : recentTrend === 'down' ? 'Declining' : 'Stable'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Progress Circle */}
                <div className="flex flex-col items-center">
                  <CircularProgress
                    value={overallProgress}
                    max={100}
                    size={120}
                    strokeWidth={8}
                    color={theme.primary}
                    label="Overall"
                    animated={true}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Course completion
                  </p>
                </div>

                {/* Weekly Goal Progress */}
                <div className="flex flex-col items-center">
                  <CircularProgress
                    value={weeklyCompleted}
                    max={weeklyGoal}
                    size={120}
                    strokeWidth={8}
                    color={theme.success}
                    label="Weekly"
                    animated={true}
                  />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    {weeklyCompleted}h / {weeklyGoal}h this week
                  </p>
                </div>

                {/* Study Streak */}
                <div className="flex flex-col items-center">
                  <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 flex flex-col items-center justify-center border-4 border-orange-300 dark:border-orange-700">
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {Math.floor(Math.random() * 15) + 1}
                    </div>
                    <div className="text-xs text-orange-600 dark:text-orange-400">
                      day streak
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                    Keep it going!
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skills Breakdown */}
      <AnimatePresence>
        {visibleCharts.skills && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Skills Radar Chart */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <PieChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Skills Overview
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Performance across all areas
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleChartVisibility('skills')}
                >
                  <Info className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex justify-center">
                <RadarChart
                  skills={processedSkills}
                  size={280}
                  animated={true}
                />
              </div>
            </Card>

            {/* Individual Skills Progress */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Individual Skills
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Detailed progress breakdown
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {processedSkills.map((skill, index) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 p-3 rounded-lg transition-colors"
                    onClick={() => onSkillClick?.(skill.name)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {skill.name}
                          </span>
                          {getTrendIcon(skill.trend)}
                        </div>
                        <Badge
                          variant={skill.difficulty === 'hard' ? 'destructive' : skill.difficulty === 'medium' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {skill.difficulty}
                        </Badge>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {skill.current}%
                        </div>
                        <div className={`text-xs ${getTrendColor(skill.trend)}`}>
                          {skill.improvement > 0 ? '+' : ''}{skill.improvement}%
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Progress
                        value={skill.current}
                        className="flex-1"
                      />
                      <CircularProgress
                        value={skill.current}
                        max={100}
                        size={32}
                        strokeWidth={3}
                        color={skill.color}
                        showPercentage={false}
                        animated={false}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{skill.sessions} sessions</span>
                      <span>
                        {skill.lastPracticed
                          ? `Last: ${skill.lastPracticed.toLocaleDateString()}`
                          : 'Never practiced'
                        }
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Timeline */}
      <AnimatePresence>
        {visibleCharts.timeline && timeSeriesData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Progress Timeline
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your learning journey over time
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {timeSeriesData.length} data points
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedChart(expandedChart === 'timeline' ? null : 'timeline')}
                  >
                    {expandedChart === 'timeline' ? 'Compact' : 'Expand'}
                  </Button>
                </div>
              </div>

              <div className="mb-4">
                <LineChart
                  data={timeSeriesData}
                  width={800}
                  height={expandedChart === 'timeline' ? 400 : 300}
                  color={theme.primary}
                  animated={true}
                  showDots={true}
                  className="w-full"
                />
              </div>

              {/* Timeline insights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {timeSeriesData[0]?.value.toFixed(1) || '0'}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Starting score</div>
                </div>

                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {timeSeriesData[timeSeriesData.length - 1]?.value.toFixed(1) || '0'}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current score</div>
                </div>

                <div className="text-center">
                  <div className={`text-lg font-semibold ${getTrendColor(recentTrend)}`}>
                    {recentTrend === 'up' ? '+' : recentTrend === 'down' ? '-' : ''}
                    {Math.abs(
                      ((timeSeriesData[timeSeriesData.length - 1]?.value || 0) -
                       (timeSeriesData[0]?.value || 0))
                    ).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total improvement</div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly Activity */}
      <AnimatePresence>
        {visibleCharts.weekly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Weekly Activity
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Study sessions this week
                    </p>
                  </div>
                </div>

                <Badge
                  variant={weeklyProgress >= 100 ? 'default' : weeklyProgress >= 70 ? 'secondary' : 'outline'}
                  className="text-xs"
                >
                  {weeklyProgress.toFixed(0)}% of goal
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Weekly goal progress */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Weekly Goal Progress
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {weeklyCompleted}h / {weeklyGoal}h
                    </span>
                  </div>

                  <Progress
                    value={weeklyProgress}
                    className="h-3"
                  />

                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      {weeklyGoal - weeklyCompleted > 0
                        ? `${(weeklyGoal - weeklyCompleted).toFixed(1)}h remaining`
                        : 'Goal achieved!'
                      }
                    </span>
                  </div>
                </div>

                {/* Daily activity bars */}
                <div className="space-y-4">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    Daily Sessions
                  </span>

                  <MiniBarChart
                    data={[2, 1, 3, 0, 2, 1, 4]} // Mock daily data
                    labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                    color={theme.success}
                    height={80}
                    animated={true}
                  />

                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Best day: Sunday (4 sessions)
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accessibility status indicator */}
      <div className="sr-only" role="status" aria-live="polite">
        Progress charts loaded. Overall progress: {overallProgress}%.
        {skillsData.length} skills tracked.
        {timeSeriesData.length} progress data points available.
        Weekly goal: {weeklyProgress.toFixed(0)}% complete.
      </div>
    </div>
  );
}

export default ProgressCharts;