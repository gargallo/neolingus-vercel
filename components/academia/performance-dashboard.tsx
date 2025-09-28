/**
 * Performance Dashboard Component
 *
 * Development-only component for monitoring dashboard performance metrics,
 * bundle sizes, cache hit rates, and optimization recommendations.
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Monitor,
  Zap,
  Database,
  Package,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X
} from 'lucide-react';
import { useDashboardPerformance } from '@/lib/hooks/usePerformanceMonitor';
import { getCacheStats, cleanupCaches } from '@/lib/utils/dashboard-cache';
import { bundleAnalyzer } from '@/lib/utils/bundle-analyzer';

interface PerformanceMetric {
  label: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'critical';
}

interface PerformanceDashboardProps {
  dashboardId: string;
  onClose?: () => void;
}

export function PerformanceDashboard({ dashboardId, onClose }: PerformanceDashboardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const {
    loadTime,
    totalRenderTime,
    cacheHitRate,
    getPerformanceScore,
    getRecommendations
  } = useDashboardPerformance(dashboardId);

  const [cacheStats, setCacheStats] = useState(getCacheStats());

  // Only show in development and when explicitly enabled
  useEffect(() => {
    setIsVisible(false); // Temporarily disabled to reduce OAuth calls
    // setIsVisible(process.env.NODE_ENV === 'development');
  }, []);

  // Refresh cache stats periodically - DISABLED to reduce requests
  useEffect(() => {
    // const interval = setInterval(() => {
    //   setCacheStats(getCacheStats());
    // }, 2000);

    // return () => clearInterval(interval);
  }, []);

  const performanceMetrics = useMemo((): PerformanceMetric[] => [
    {
      label: 'Load Time',
      value: loadTime,
      unit: 'ms',
      threshold: 2000,
      status: loadTime > 2000 ? 'critical' : loadTime > 1000 ? 'warning' : 'good'
    },
    {
      label: 'Total Render Time',
      value: totalRenderTime,
      unit: 'ms',
      threshold: 300,
      status: totalRenderTime > 500 ? 'critical' : totalRenderTime > 300 ? 'warning' : 'good'
    },
    {
      label: 'Cache Hit Rate',
      value: cacheHitRate * 100,
      unit: '%',
      threshold: 80,
      status: cacheHitRate < 0.5 ? 'critical' : cacheHitRate < 0.8 ? 'warning' : 'good'
    }
  ], [loadTime, totalRenderTime, cacheHitRate]);

  const performanceScore = getPerformanceScore();
  const recommendations = getRecommendations();

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
    setCacheStats(getCacheStats());
  };

  const handleCleanupCaches = () => {
    cleanupCaches();
    setCacheStats(getCacheStats());
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
      <Card className="p-4 bg-white/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-sm">Performance Monitor</h3>
            <Badge variant="secondary" className="text-xs">
              DEV
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
            {onClose && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Performance Score */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Performance Score</span>
            <span className={`text-sm font-bold ${
              performanceScore >= 90 ? 'text-green-600' :
              performanceScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {performanceScore}/100
            </span>
          </div>
          <Progress
            value={performanceScore}
            className="h-2"
          />
        </div>

        {/* Metrics */}
        <div className="space-y-3 mb-4">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={getStatusColor(metric.status)}>
                  {getStatusIcon(metric.status)}
                </div>
                <span className="text-sm">{metric.label}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-sm font-mono ${getStatusColor(metric.status)}`}>
                  {metric.value.toFixed(metric.unit === '%' ? 1 : 0)}{metric.unit}
                </span>
                {metric.status !== 'good' && (
                  <div className="text-xs text-gray-500">
                    / {metric.threshold}{metric.unit}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Cache Statistics */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium">Cache Status</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-mono font-bold text-blue-600">
                {cacheStats.stats.size}
              </div>
              <div className="text-gray-600">Stats</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-mono font-bold text-green-600">
                {cacheStats.activities.size}
              </div>
              <div className="text-gray-600">Activities</div>
            </div>
            <div className="text-center p-2 bg-orange-50 rounded">
              <div className="font-mono font-bold text-orange-600">
                {cacheStats.progress.size}
              </div>
              <div className="text-gray-600">Progress</div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCleanupCaches}
            className="w-full mt-2 text-xs"
          >
            Cleanup Caches
          </Button>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium">Recommendations</span>
            </div>
            <div className="space-y-1">
              {recommendations.slice(0, 3).map((rec, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-yellow-50 border border-yellow-200 rounded"
                >
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Web Vitals */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Dashboard ID:</span>
            <span className="font-mono">{dashboardId}</span>
          </div>
          <div className="flex justify-between">
            <span>Refreshes:</span>
            <span className="font-mono">{refreshCount}</span>
          </div>
          {typeof window !== 'undefined' && 'memory' in performance && (
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="font-mono">
                {Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB
              </span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// Hook for easy integration
export function usePerformanceDashboard(dashboardId: string) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show performance dashboard in development with Ctrl+Shift+P
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    if (process.env.NODE_ENV === 'development') {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);

  const PerformanceOverlay = () => {
    if (!isVisible) return null;

    return (
      <PerformanceDashboard
        dashboardId={dashboardId}
        onClose={() => setIsVisible(false)}
      />
    );
  };

  return {
    isVisible,
    setIsVisible,
    PerformanceOverlay
  };
}