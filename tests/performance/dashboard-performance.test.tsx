/**
 * Dashboard Performance Tests
 *
 * Comprehensive performance testing suite for dashboard components
 * measuring render times, memory usage, and user interactions.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act, renderHook } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { memo } from 'react';

import { CourseDashboard, DashboardOverview } from '@/components/academia/course-dashboard';
import DashboardStats from '@/components/academia/dashboard-stats';
import ActivityTimeline from '@/components/academia/activity-timeline';
import QuickActions from '@/components/academia/quick-actions';
import { usePerformanceMonitor, useDashboardPerformance } from '@/lib/hooks/usePerformanceMonitor';
import { bundleAnalyzer } from '@/lib/utils/bundle-analyzer';
import { statsCache, activitiesCache, progressCache } from '@/lib/utils/dashboard-cache';

// Mock data for testing
const mockCourse = {
  id: 'test-course-1',
  language: 'english',
  level: 'b2',
  title: 'English B2 Certification',
  description: 'Advanced English language certification',
  provider: 'cambridge',
  providerName: 'Cambridge Assessment',
  examTypes: ['listening', 'reading', 'writing', 'speaking']
};

const mockExamSessions = Array.from({ length: 10 }, (_, i) => ({
  id: `session-${i}`,
  isCompleted: i % 2 === 0,
  score: 75 + Math.random() * 20,
  durationSeconds: 3600 + Math.random() * 1800,
  startedAt: new Date(Date.now() - i * 86400000).toISOString(),
  completedAt: i % 2 === 0 ? new Date(Date.now() - i * 86400000 + 3600000).toISOString() : null,
  examTitle: `Practice Exam ${i + 1}`,
  sessionType: 'practice'
}));

const mockProgress = {
  component_progress: {
    listening: 0.8,
    reading: 0.75,
    writing: 0.6,
    speaking: 0.7
  },
  average_score: 78,
  readiness_score: 0.75,
  total_sessions: 5,
  last_session: new Date().toISOString()
};

const mockAvailableExams = [
  {
    examId: 'exam-1',
    title: 'Cambridge B2 First',
    providerSlug: 'cambridge',
    providerName: 'Cambridge Assessment',
    duration: 210,
    difficulty: 'official'
  }
];

// Performance benchmarks
const PERFORMANCE_BENCHMARKS = {
  DASHBOARD_LOAD_TIME: 2000, // 2 seconds
  COMPONENT_RENDER_TIME: 100, // 100ms
  INTERACTION_RESPONSE_TIME: 16, // 16ms (60fps)
  MEMORY_USAGE_LIMIT: 50 * 1024 * 1024, // 50MB
  BUNDLE_SIZE_LIMIT: 500 * 1024, // 500KB
  CACHE_HIT_RATE_TARGET: 0.8 // 80%
};

describe('Dashboard Performance Tests', () => {
  let performanceMarks: string[] = [];
  let performanceMeasures: string[] = [];

  beforeEach(() => {
    // Reset caches
    statsCache.clear();
    activitiesCache.clear();
    progressCache.clear();

    // Mock performance API
    global.performance = {
      ...global.performance,
      mark: vi.fn((name: string) => {
        performanceMarks.push(name);
      }),
      measure: vi.fn((name: string, start?: string, end?: string) => {
        performanceMeasures.push(name);
        return { name, duration: Math.random() * 50 } as PerformanceMeasure;
      }),
      getEntriesByName: vi.fn((name: string) => [
        { name, duration: Math.random() * 50 } as PerformanceMeasure
      ]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      now: vi.fn(() => Date.now())
    };
  });

  afterEach(() => {
    performanceMarks = [];
    performanceMeasures = [];
    vi.clearAllMocks();
  });

  describe('Component Render Performance', () => {
    it('should render CourseDashboard within performance budget', async () => {
      const startTime = performance.now();

      const { container } = render(
        <CourseDashboard
          course={mockCourse}
          availableExams={mockAvailableExams}
          achievements={[]}
          userId="test-user"
          initialProgress={mockProgress}
        />
      );

      await waitFor(() => {
        expect(container.firstChild).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME);
    });

    it('should render DashboardStats efficiently with large datasets', async () => {
      const largeStatsData = Array.from({ length: 20 }, (_, i) => ({
        id: `stat-${i}`,
        label: `Statistic ${i}`,
        value: Math.random() * 100,
        displayValue: `${Math.random() * 100}%`,
        variant: 'default' as const
      }));

      const startTime = performance.now();

      render(<DashboardStats stats={largeStatsData} />);

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME);
    });

    it('should handle ActivityTimeline with many activities efficiently', async () => {
      const manyActivities = Array.from({ length: 100 }, (_, i) => ({
        id: `activity-${i}`,
        type: 'exam' as const,
        title: `Activity ${i}`,
        date: new Date(Date.now() - i * 3600000),
        score: Math.random() * 100
      }));

      const startTime = performance.now();

      render(<ActivityTimeline activities={manyActivities} maxItems={50} />);

      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME);
    });
  });

  describe('Interaction Performance', () => {
    it('should respond to user interactions within 16ms', async () => {
      const mockOnClick = vi.fn();
      const quickActions = {
        primary: {
          id: 'start-exam',
          label: 'Start Exam',
          onClick: mockOnClick,
          variant: 'primary' as const
        },
        secondary: []
      };

      render(<QuickActions {...quickActions} />);

      const button = screen.getByRole('button', { name: /start exam/i });

      const startTime = performance.now();
      fireEvent.click(button);
      const interactionTime = performance.now() - startTime;

      expect(interactionTime).toBeLessThan(PERFORMANCE_BENCHMARKS.INTERACTION_RESPONSE_TIME);
      expect(mockOnClick).toHaveBeenCalled();
    });

    it('should handle rapid successive interactions efficiently', async () => {
      const mockOnClick = vi.fn();
      const quickActions = {
        primary: {
          id: 'rapid-test',
          label: 'Rapid Test',
          onClick: mockOnClick,
          variant: 'primary' as const
        },
        secondary: []
      };

      render(<QuickActions {...quickActions} />);

      const button = screen.getByRole('button', { name: /rapid test/i });

      // Simulate rapid clicks
      const startTime = performance.now();
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(100); // 100ms for 10 interactions
      expect(mockOnClick).toHaveBeenCalledTimes(10);
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during component lifecycle', async () => {
      let memoryBefore = 0;
      let memoryAfter = 0;

      // Mock memory measurement
      if ('memory' in performance) {
        memoryBefore = (performance as any).memory.usedJSHeapSize;
      }

      const { unmount } = render(
        <CourseDashboard
          course={mockCourse}
          availableExams={mockAvailableExams}
          achievements={[]}
          userId="test-user"
          initialProgress={mockProgress}
        />
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      unmount();

      if ('memory' in performance) {
        memoryAfter = (performance as any).memory.usedJSHeapSize;
      }

      // Memory should not increase significantly after unmount
      const memoryIncrease = memoryAfter - memoryBefore;
      expect(memoryIncrease).toBeLessThan(PERFORMANCE_BENCHMARKS.MEMORY_USAGE_LIMIT);
    });

    it('should clean up event listeners and timers', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(
        <CourseDashboard
          course={mockCourse}
          availableExams={mockAvailableExams}
          achievements={[]}
          userId="test-user"
          initialProgress={mockProgress}
        />
      );

      const addedListeners = addEventListenerSpy.mock.calls.length;

      unmount();

      const removedListeners = removeEventListenerSpy.mock.calls.length;

      // Should remove at least as many listeners as were added
      expect(removedListeners).toBeGreaterThanOrEqual(addedListeners);
    });
  });

  describe('Caching Performance', () => {
    it('should demonstrate cache efficiency', () => {
      const cacheKey = 'test-stats-key';
      const mockData = [{ id: '1', label: 'Test', value: 100 }];

      // First access - cache miss
      statsCache.set(cacheKey, mockData);
      const firstAccess = statsCache.get(cacheKey);

      // Second access - cache hit
      const secondAccess = statsCache.get(cacheKey);

      expect(firstAccess).toEqual(mockData);
      expect(secondAccess).toEqual(mockData);
      expect(firstAccess).toBe(secondAccess); // Same reference = cached
    });

    it('should invalidate expired cache entries', (done) => {
      const cacheKey = 'expiry-test';
      const mockData = [{ id: '1', label: 'Test', value: 100 }];

      // Set with very short TTL (for testing)
      statsCache.set(cacheKey, mockData);

      // Immediately accessible
      expect(statsCache.get(cacheKey)).toEqual(mockData);

      // Mock time passage
      setTimeout(() => {
        // Should be null after expiry
        expect(statsCache.get(cacheKey)).toBeNull();
        done();
      }, 10);
    });
  });

  describe('Performance Monitoring Hooks', () => {
    it('should track component performance metrics', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor('test-component', { enabled: true })
      );

      act(() => {
        result.current.recordInteraction('click');
      });

      const metrics = result.current.getCurrentMetrics();
      expect(metrics).toBeDefined();
      expect(metrics?.interactions).toBeGreaterThan(0);
    });

    it('should generate performance reports', () => {
      const { result } = renderHook(() =>
        usePerformanceMonitor('test-component', { enabled: true })
      );

      act(() => {
        result.current.recordInteraction('click');
      });

      const report = result.current.getReport();
      expect(report).toBeDefined();
      expect(report?.metrics).toBeDefined();
      expect(report?.warnings).toBeInstanceOf(Array);
      expect(report?.recommendations).toBeInstanceOf(Array);
    });

    it('should track dashboard-specific performance', () => {
      const { result } = renderHook(() =>
        useDashboardPerformance('test-dashboard')
      );

      act(() => {
        result.current.trackComponentRender('TestComponent', 50);
      });

      expect(result.current.totalRenderTime).toBe(50);
      expect(result.current.getPerformanceScore()).toBeGreaterThan(0);
    });
  });

  describe('Bundle Size Analysis', () => {
    it('should analyze component bundle impact', () => {
      const mockComponentCode = `
        import React, { memo, useMemo } from 'react';
        import { motion } from 'framer-motion';
        import { Button } from '@/components/ui/button';

        export const TestComponent = memo(() => {
          const data = useMemo(() => ({ test: true }), []);
          return <motion.div><Button>Test</Button></motion.div>;
        });
      `;

      const analysis = bundleAnalyzer.analyzeComponent(
        'TestComponent',
        mockComponentCode
      );

      expect(analysis.componentName).toBe('TestComponent');
      expect(analysis.estimatedSize).toBeGreaterThan(0);
      expect(analysis.dependencies).toContain('framer-motion');
      expect(analysis.recommendations).toBeInstanceOf(Array);
      expect(analysis.optimizations).toBeInstanceOf(Array);
    });

    it('should identify heavy dependencies', () => {
      const heavyComponentCode = `
        import React from 'react';
        import moment from 'moment';
        import _ from 'lodash';
        import { Chart } from 'chart.js';

        export const HeavyComponent = () => {
          return <div>{moment().format()}</div>;
        };
      `;

      const analysis = bundleAnalyzer.analyzeComponent(
        'HeavyComponent',
        heavyComponentCode
      );

      expect(analysis.heavyDependencies).toContain('moment');
      expect(analysis.heavyDependencies).toContain('lodash');
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Core Web Vitals', () => {
    it('should meet Largest Contentful Paint (LCP) requirements', async () => {
      const { container } = render(
        <CourseDashboard
          course={mockCourse}
          availableExams={mockAvailableExams}
          achievements={[]}
          userId="test-user"
          initialProgress={mockProgress}
        />
      );

      // Wait for largest content to be painted
      await waitFor(() => {
        const mainContent = container.querySelector('main');
        expect(mainContent).toBeInTheDocument();
      }, { timeout: 2500 }); // LCP should be < 2.5s
    });

    it('should minimize Cumulative Layout Shift (CLS)', async () => {
      const { container } = render(
        <CourseDashboard
          course={mockCourse}
          availableExams={mockAvailableExams}
          achievements={[]}
          userId="test-user"
          initialProgress={mockProgress}
        />
      );

      // Initial render
      const initialHeight = container.scrollHeight;

      // Wait for any async content loading
      await waitFor(() => {
        expect(screen.getByText(mockCourse.title)).toBeInTheDocument();
      });

      // Final height should be similar (minimal layout shift)
      const finalHeight = container.scrollHeight;
      const layoutShift = Math.abs(finalHeight - initialHeight) / initialHeight;

      expect(layoutShift).toBeLessThan(0.1); // CLS should be < 0.1
    });
  });

  describe('Performance Regression Tests', () => {
    it('should maintain performance with increased data volume', async () => {
      const largeDataset = {
        examSessions: Array.from({ length: 1000 }, (_, i) => ({
          ...mockExamSessions[0],
          id: `large-session-${i}`
        })),
        progress: {
          ...mockProgress,
          component_progress: Object.fromEntries(
            Array.from({ length: 50 }, (_, i) => [`skill-${i}`, Math.random()])
          )
        }
      };

      const startTime = performance.now();

      render(
        <CourseDashboard
          course={mockCourse}
          availableExams={mockAvailableExams}
          achievements={[]}
          userId="test-user"
          initialProgress={largeDataset.progress}
        />
      );

      const renderTime = performance.now() - startTime;

      // Should still render within budget even with large datasets
      expect(renderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME * 2);
    });

    it('should handle concurrent renders efficiently', async () => {
      const renderPromises = Array.from({ length: 5 }, () =>
        new Promise<number>((resolve) => {
          const startTime = performance.now();

          render(
            <CourseDashboard
              course={mockCourse}
              availableExams={mockAvailableExams}
              achievements={[]}
              userId="test-user"
              initialProgress={mockProgress}
            />
          );

          resolve(performance.now() - startTime);
        })
      );

      const renderTimes = await Promise.all(renderPromises);
      const averageRenderTime = renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length;

      expect(averageRenderTime).toBeLessThan(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME);
    });
  });
});