/**
 * Performance Monitoring Hook
 *
 * Tracks component performance metrics, memory usage, and user interactions
 * for dashboard optimization and debugging.
 */

import { useEffect, useRef, useCallback, useState } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  memoryUsage?: number;
  interactions: number;
  lastInteraction: number;
}

interface PerformanceConfig {
  enabled?: boolean;
  trackMemory?: boolean;
  trackInteractions?: boolean;
  reportThreshold?: number; // Report if render time exceeds this (ms)
}

interface PerformanceReport {
  metrics: PerformanceMetrics;
  warnings: string[];
  recommendations: string[];
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetrics>();
  private observers: PerformanceObserver[] = [];
  private enabled = true;

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            console.warn(`Long task detected: ${entry.duration}ms`, entry);
          }
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Observe layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as any).value > 0.1) {
            console.warn(`Layout shift detected: ${(entry as any).value}`, entry);
          }
        }
      });
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(layoutShiftObserver);

    } catch (error) {
      console.warn('Performance observers not supported:', error);
    }
  }

  startMeasurement(componentName: string): string {
    if (!this.enabled) return '';

    const measureId = `${componentName}-${Date.now()}`;
    performance.mark(`${measureId}-start`);
    return measureId;
  }

  endMeasurement(measureId: string, componentName: string): number {
    if (!this.enabled || !measureId) return 0;

    try {
      performance.mark(`${measureId}-end`);
      performance.measure(measureId, `${measureId}-start`, `${measureId}-end`);

      const measure = performance.getEntriesByName(measureId)[0];
      const duration = measure?.duration || 0;

      // Update metrics
      const existing = this.metrics.get(componentName);
      if (existing) {
        existing.renderTime = duration;
        existing.lastInteraction = Date.now();
      } else {
        this.metrics.set(componentName, {
          componentName,
          renderTime: duration,
          mountTime: Date.now(),
          interactions: 0,
          lastInteraction: Date.now()
        });
      }

      // Clean up performance entries
      performance.clearMarks(`${measureId}-start`);
      performance.clearMarks(`${measureId}-end`);
      performance.clearMeasures(measureId);

      return duration;
    } catch (error) {
      console.warn('Performance measurement failed:', error);
      return 0;
    }
  }

  recordInteraction(componentName: string): void {
    if (!this.enabled) return;

    const metrics = this.metrics.get(componentName);
    if (metrics) {
      metrics.interactions++;
      metrics.lastInteraction = Date.now();
    }
  }

  getMetrics(componentName: string): PerformanceMetrics | null {
    return this.metrics.get(componentName) || null;
  }

  getAllMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  generateReport(componentName: string): PerformanceReport | null {
    const metrics = this.metrics.get(componentName);
    if (!metrics) return null;

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze render time
    if (metrics.renderTime > 100) {
      warnings.push(`Slow render time: ${metrics.renderTime.toFixed(2)}ms`);
      recommendations.push('Consider using React.memo() or useMemo() for expensive calculations');
    }

    if (metrics.renderTime > 50) {
      recommendations.push('Monitor component dependencies and avoid unnecessary re-renders');
    }

    // Analyze interaction frequency
    const hoursSinceMount = (Date.now() - metrics.mountTime) / (1000 * 60 * 60);
    const interactionsPerHour = metrics.interactions / Math.max(hoursSinceMount, 0.1);

    if (interactionsPerHour > 100) {
      warnings.push(`High interaction frequency: ${interactionsPerHour.toFixed(1)}/hour`);
      recommendations.push('Consider debouncing or throttling user interactions');
    }

    return { metrics, warnings, recommendations };
  }

  clearMetrics(componentName?: string): void {
    if (componentName) {
      this.metrics.delete(componentName);
    } else {
      this.metrics.clear();
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

const globalMonitor = new PerformanceMonitor();

export function usePerformanceMonitor(
  componentName: string,
  config: PerformanceConfig = {}
) {
  const {
    enabled = process.env.NODE_ENV === 'development',
    trackMemory = false,
    trackInteractions = true,
    reportThreshold = 50
  } = config;

  const measureIdRef = useRef<string>('');
  const mountTimeRef = useRef<number>(0);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);

  // Start measurement on component mount
  useEffect(() => {
    if (!enabled) return;

    mountTimeRef.current = Date.now();
    measureIdRef.current = globalMonitor.startMeasurement(componentName);

    return () => {
      // End measurement on unmount
      if (measureIdRef.current) {
        const duration = globalMonitor.endMeasurement(measureIdRef.current, componentName);

        if (duration > reportThreshold) {
          console.warn(`${componentName} render time: ${duration.toFixed(2)}ms`);
        }
      }
    };
  }, [componentName, enabled, reportThreshold]);

  // Update metrics periodically
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const currentMetrics = globalMonitor.getMetrics(componentName);
      if (currentMetrics && trackMemory && 'memory' in performance) {
        currentMetrics.memoryUsage = (performance as any).memory?.usedJSHeapSize;
      }
      setMetrics(currentMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, [componentName, enabled, trackMemory]);

  // Track interactions
  const recordInteraction = useCallback((interactionType?: string) => {
    if (enabled && trackInteractions) {
      globalMonitor.recordInteraction(componentName);

      if (interactionType && measureIdRef.current) {
        const interactionMeasureId = globalMonitor.startMeasurement(`${componentName}-${interactionType}`);
        // End measurement after a short delay to capture interaction processing time
        setTimeout(() => {
          globalMonitor.endMeasurement(interactionMeasureId, `${componentName}-${interactionType}`);
        }, 0);
      }
    }
  }, [componentName, enabled, trackInteractions]);

  // Get performance report
  const getReport = useCallback(() => {
    return globalMonitor.generateReport(componentName);
  }, [componentName]);

  // Get current metrics
  const getCurrentMetrics = useCallback(() => {
    return globalMonitor.getMetrics(componentName);
  }, [componentName]);

  // Force metrics update
  const updateMetrics = useCallback(() => {
    const currentMetrics = globalMonitor.getMetrics(componentName);
    setMetrics(currentMetrics);
  }, [componentName]);

  return {
    metrics,
    recordInteraction,
    getReport,
    getCurrentMetrics,
    updateMetrics,
    enabled
  };
}

// Hook for monitoring dashboard-specific performance
export function useDashboardPerformance(dashboardId: string) {
  const [loadTime, setLoadTime] = useState<number>(0);
  const [cacheHitRate, setCacheHitRate] = useState<number>(0);
  const [totalRenderTime, setTotalRenderTime] = useState<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  const { recordInteraction, getReport } = usePerformanceMonitor(`dashboard-${dashboardId}`);

  // Track dashboard load time
  useEffect(() => {
    const endTime = Date.now();
    const loadDuration = endTime - startTimeRef.current;
    setLoadTime(loadDuration);

    if (loadDuration > 2000) {
      console.warn(`Dashboard ${dashboardId} slow load: ${loadDuration}ms`);
    }
  }, [dashboardId]);

  // Track component render times
  const trackComponentRender = useCallback((componentName: string, renderTime: number) => {
    setTotalRenderTime(prev => prev + renderTime);

    if (renderTime > 100) {
      console.warn(`Slow component render in dashboard ${dashboardId}: ${componentName} took ${renderTime}ms`);
    }
  }, [dashboardId]);

  // Calculate performance score (0-100)
  const getPerformanceScore = useCallback(() => {
    let score = 100;

    // Deduct points for slow load time
    if (loadTime > 3000) score -= 30;
    else if (loadTime > 2000) score -= 20;
    else if (loadTime > 1000) score -= 10;

    // Deduct points for high total render time
    if (totalRenderTime > 500) score -= 20;
    else if (totalRenderTime > 300) score -= 10;

    // Add points for good cache hit rate
    if (cacheHitRate > 0.8) score += 5;
    else if (cacheHitRate < 0.3) score -= 10;

    return Math.max(0, Math.min(100, score));
  }, [loadTime, totalRenderTime, cacheHitRate]);

  // Generate performance recommendations
  const getRecommendations = useCallback(() => {
    const recommendations: string[] = [];

    if (loadTime > 2000) {
      recommendations.push('Consider implementing code splitting or lazy loading');
    }

    if (totalRenderTime > 300) {
      recommendations.push('Optimize component rendering with memoization');
    }

    if (cacheHitRate < 0.5) {
      recommendations.push('Improve caching strategy for frequently accessed data');
    }

    return recommendations;
  }, [loadTime, totalRenderTime, cacheHitRate]);

  return {
    loadTime,
    totalRenderTime,
    cacheHitRate,
    setCacheHitRate,
    recordInteraction,
    trackComponentRender,
    getPerformanceScore,
    getRecommendations,
    getReport
  };
}

// Utility for measuring async operations
export function measureAsync<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();

  return operation().then(result => {
    const duration = performance.now() - startTime;

    if (duration > 1000) {
      console.warn(`Slow async operation: ${operationName} took ${duration.toFixed(2)}ms`);
    }

    return { result, duration };
  });
}

// Export global monitor for advanced usage
export { globalMonitor as performanceMonitor };