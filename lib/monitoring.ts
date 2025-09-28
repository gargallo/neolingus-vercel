/**
 * Enhanced monitoring and error tracking for NeoLingus agents system
 */

export interface ErrorContext {
  userId?: string;
  agentId?: string;
  sessionId?: string;
  operation?: string;
  userAgent?: string;
  ip?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'tokens' | 'requests' | 'percentage' | 'count';
  context?: Record<string, unknown>;
  timestamp?: string;
}

class MonitoringService {
  private isDevelopment = process.env.NODE_ENV === 'development';
  
  /**
   * Log error with context and structure
   */
  logError(error: Error | unknown, context: ErrorContext = {}) {
    const errorData = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      context: {
        ...context,
        timestamp: context.timestamp || new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      }
    };

    if (this.isDevelopment) {
      console.error('🚨 Error occurred:', errorData);
    }

    // In production, this could send to external monitoring service
    // like Sentry, DataDog, or LogRocket
    this.sendToMonitoring('error', errorData);
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric: PerformanceMetric) {
    const perfData = {
      ...metric,
      timestamp: metric.timestamp || new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    if (this.isDevelopment && metric.name.includes('slow')) {
      console.warn('⚠️ Performance issue detected:', perfData);
    }

    this.sendToMonitoring('performance', perfData);
  }

  /**
   * Log agent interaction
   */
  logAgentInteraction(data: {
    agentId: string;
    agentName: string;
    inputLength: number;
    outputLength: number;
    processingTime: number;
    tokensUsed: number;
    confidenceScore: number;
    success: boolean;
    userId?: string;
    sessionId?: string;
  }) {
    const interactionData = {
      ...data,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    };

    if (this.isDevelopment) {
      const status = data.success ? '✅' : '❌';
      console.log(`${status} Agent ${data.agentName}: ${data.processingTime}ms, ${data.tokensUsed} tokens, ${data.confidenceScore}% confidence`);
    }

    this.sendToMonitoring('agent_interaction', interactionData);
  }

  /**
   * Create performance monitoring for async operations
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context: Record<string, unknown> = {}
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.logPerformance({
        name: `${operation}_duration`,
        value: duration,
        unit: 'ms',
        context: { ...context, success: true }
      });

      // Warn about slow operations
      if (duration > 5000) {
        this.logPerformance({
          name: `${operation}_slow_operation`,
          value: duration,
          unit: 'ms',
          context: { ...context, threshold: 5000 }
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.logError(error, {
        operation,
        metadata: { ...context, duration }
      });

      this.logPerformance({
        name: `${operation}_error_duration`,
        value: duration,
        unit: 'ms',
        context: { ...context, success: false }
      });

      throw error;
    }
  }

  /**
   * Send data to monitoring service
   * In production, integrate with external services
   */
  private sendToMonitoring(type: string, data: unknown) {
    // Store in console for development
    if (this.isDevelopment && process.env.AGENT_DEBUG_MODE === 'true') {
      console.log(`📊 Monitoring [${type}]:`, JSON.stringify(data, null, 2));
    }
    
    // In production, send to external monitoring service
    // Examples:
    // - await fetch('/api/monitoring', { method: 'POST', body: JSON.stringify({ type, data }) })
    // - sentry.captureEvent({ type, data })
    // - analytics.track(type, data)
  }

  /**
   * Check system health indicators
   */
  checkHealthIndicators() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Log memory usage if high
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8) {
      this.logPerformance({
        name: 'high_memory_usage',
        value: (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100,
        unit: 'percentage',
        context: { memoryUsage }
      });
    }

    // Log uptime metrics
    this.logPerformance({
      name: 'system_uptime',
      value: uptime,
      unit: 'ms',
      context: { memoryUsage }
    });

    return {
      memoryUsage,
      uptime,
      timestamp: new Date().toISOString()
    };
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

// Helper functions for easy usage
export const logError = (error: Error | unknown, context?: ErrorContext) => 
  monitoring.logError(error, context);

export const logPerformance = (metric: PerformanceMetric) => 
  monitoring.logPerformance(metric);

export const logAgentInteraction = (data: Parameters<typeof monitoring.logAgentInteraction>[0]) => 
  monitoring.logAgentInteraction(data);

export const measurePerformance = <T>(
  operation: string, 
  fn: () => Promise<T>, 
  context?: Record<string, unknown>
) => monitoring.measurePerformance(operation, fn, context);

// Types are already exported above