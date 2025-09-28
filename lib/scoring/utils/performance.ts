/**
 * Performance Monitoring Utilities for Scoring Engine
 * Tracks and analyzes performance metrics for optimization
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 10000; // Keep last 10k metrics
  private timers = new Map<string, number>();

  /**
   * Start timing an operation
   */
  startTimer(operationId: string): void {
    this.timers.set(operationId, performance.now());
  }

  /**
   * End timing and record metric
   */
  endTimer(operationId: string, name: string, metadata?: Record<string, any>): number {
    const startTime = this.timers.get(operationId);
    if (!startTime) {
      console.warn(`No start timer found for operation: ${operationId}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(operationId);

    this.recordMetric(name, duration, metadata);
    return duration;
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, duration: number, metadata?: Record<string, any>): void {
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata
    });

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get performance statistics for a specific operation
   */
  getStats(name: string, timeWindow?: number): PerformanceStats | null {
    const cutoff = timeWindow ? Date.now() - timeWindow : 0;
    const filteredMetrics = this.metrics
      .filter(m => m.name === name && m.timestamp >= cutoff)
      .map(m => m.duration)
      .sort((a, b) => a - b);

    if (filteredMetrics.length === 0) {
      return null;
    }

    const count = filteredMetrics.length;
    const totalDuration = filteredMetrics.reduce((sum, d) => sum + d, 0);
    const averageDuration = totalDuration / count;

    return {
      count,
      totalDuration,
      averageDuration,
      minDuration: filteredMetrics[0],
      maxDuration: filteredMetrics[count - 1],
      p50: filteredMetrics[Math.floor(count * 0.5)],
      p95: filteredMetrics[Math.floor(count * 0.95)],
      p99: filteredMetrics[Math.floor(count * 0.99)]
    };
  }

  /**
   * Get all available operation names
   */
  getOperationNames(): string[] {
    return [...new Set(this.metrics.map(m => m.name))];
  }

  /**
   * Get recent metrics for analysis
   */
  getRecentMetrics(name?: string, limit = 100): PerformanceMetric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    return filtered.slice(-limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Generate performance report
   */
  generateReport(timeWindow = 24 * 60 * 60 * 1000): Record<string, PerformanceStats> {
    const operations = this.getOperationNames();
    const report: Record<string, PerformanceStats> = {};

    operations.forEach(operation => {
      const stats = this.getStats(operation, timeWindow);
      if (stats) {
        report[operation] = stats;
      }
    });

    return report;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper decorator for timing functions
export function timed(operationName: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
      performanceMonitor.startTimer(operationId);

      try {
        const result = await method.apply(this, args);
        performanceMonitor.endTimer(operationId, operationName, {
          success: true,
          args: args.length
        });
        return result;
      } catch (error) {
        performanceMonitor.endTimer(operationId, operationName, {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          args: args.length
        });
        throw error;
      }
    };

    return descriptor;
  };
}

// Helper function for manual timing
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const operationId = `${operationName}-${Date.now()}-${Math.random()}`;
  performanceMonitor.startTimer(operationId);

  try {
    const result = await operation();
    performanceMonitor.endTimer(operationId, operationName, {
      ...metadata,
      success: true
    });
    return result;
  } catch (error) {
    performanceMonitor.endTimer(operationId, operationName, {
      ...metadata,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Utility functions for common operations
export const performanceUtils = {
  /**
   * Measure database query performance
   */
  measureQuery: async <T>(
    queryName: string,
    query: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(`db-query-${queryName}`, query);
  },

  /**
   * Measure AI model call performance
   */
  measureModelCall: async <T>(
    modelName: string,
    call: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(`ai-model-${modelName}`, call);
  },

  /**
   * Measure API endpoint performance
   */
  measureEndpoint: async <T>(
    endpointName: string,
    handler: () => Promise<T>
  ): Promise<T> => {
    return measureAsync(`api-${endpointName}`, handler);
  },

  /**
   * Get performance dashboard data
   */
  getDashboardData: (timeWindow = 24 * 60 * 60 * 1000) => {
    const report = performanceMonitor.generateReport(timeWindow);
    const operations = Object.keys(report);

    return {
      summary: {
        total_operations: operations.length,
        total_calls: Object.values(report).reduce((sum, stats) => sum + stats.count, 0),
        avg_duration: Object.values(report).reduce((sum, stats) => sum + stats.averageDuration, 0) / operations.length,
        slowest_operation: operations.reduce((slowest, op) =>
          report[op].p95 > (report[slowest]?.p95 || 0) ? op : slowest, operations[0]
        )
      },
      operations: report,
      alerts: operations.filter(op => {
        const stats = report[op];
        return stats.p95 > 10000 || // Over 10 seconds
               stats.averageDuration > 5000; // Over 5 seconds average
      })
    };
  },

  /**
   * Log performance metrics to console (development)
   */
  logStats: (operationName?: string) => {
    if (process.env.NODE_ENV === 'development') {
      if (operationName) {
        const stats = performanceMonitor.getStats(operationName);
        console.log(`Performance Stats for ${operationName}:`, stats);
      } else {
        const report = performanceMonitor.generateReport();
        console.log('Performance Report:', report);
      }
    }
  },

  /**
   * Export metrics for external monitoring
   */
  exportMetrics: (format: 'json' | 'csv' = 'json') => {
    const metrics = performanceMonitor.getRecentMetrics(undefined, 1000);

    if (format === 'csv') {
      const csvHeader = 'name,duration,timestamp,metadata\n';
      const csvData = metrics.map(m =>
        `${m.name},${m.duration},${m.timestamp},"${JSON.stringify(m.metadata || {})}"`
      ).join('\n');
      return csvHeader + csvData;
    }

    return JSON.stringify(metrics, null, 2);
  }
};

// Auto-cleanup old metrics every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // Keep 24 hours
    performanceMonitor['metrics'] = performanceMonitor['metrics'].filter(
      m => m.timestamp >= cutoff
    );
  }, 60 * 60 * 1000); // Every hour
}