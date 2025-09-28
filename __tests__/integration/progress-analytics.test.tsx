/**
 * T019 [P] Integration Test: Progress Analytics Journey
 * 
 * Tests the complete workflow of progress analytics and reporting:
 * 1. Analytics dashboard initialization and data loading
 * 2. Multi-dimensional progress visualization
 * 3. Performance trend analysis and predictions
 * 4. Weakness identification and recommendations
 * 5. Comparative analysis and benchmarking
 * 6. Goal setting and tracking
 * 7. Export and sharing capabilities
 * 8. Real-time analytics updates
 * 9. Accessibility for data visualization
 * 10. Performance optimization for large datasets
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Router } from 'next/router';
import { act } from 'react-dom/test-utils';
import { mockRouter, MockSupabaseProvider } from '../utils/test-utils';
import { ProgressAnalytics } from '../../components/dashboard/progress-analytics';
import { AnalyticsEngine } from '../../lib/exam-engine/core/analytics-engine';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

jest.mock('../../utils/supabase/client');
jest.mock('../../lib/exam-engine/core/analytics-engine');

// Mock Chart.js for data visualization
jest.mock('react-chartjs-2', () => ({
  Line: ({ data, options }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Bar: ({ data, options }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Radar: ({ data, options }) => (
    <div data-testid="radar-chart" data-chart-data={JSON.stringify(data)} />
  ),
  Doughnut: ({ data, options }) => (
    <div data-testid="doughnut-chart" data-chart-data={JSON.stringify(data)} />
  ),
}));

// Mock date-fns for date handling
jest.mock('date-fns', () => ({
  format: (date, formatStr) => date.toISOString().split('T')[0],
  subDays: (date, days) => new Date(date.getTime() - days * 24 * 60 * 60 * 1000),
  isAfter: (date1, date2) => date1 > date2,
  differenceInDays: (date1, date2) => Math.floor((date1 - date2) / (24 * 60 * 60 * 1000)),
}));

describe('Integration: Progress Analytics Journey', () => {
  const user = userEvent.setup();
  const mockUserData = {
    id: 'user-123',
    email: 'test@example.com',
    selectedCourse: {
      language: 'english',
      level: 'b1',
      provider: 'eoi'
    },
  };

  const mockAnalyticsData = {
    overallProgress: {
      completionRate: 68,
      averageScore: 82,
      totalStudyTime: 4320, // minutes
      examsCompleted: 15,
      totalExams: 22,
      currentStreak: 12,
      longestStreak: 18,
    },
    skillBreakdown: {
      reading: { score: 88, progress: 75, recentTrend: 'improving' },
      listening: { score: 76, progress: 62, recentTrend: 'stable' },
      writing: { score: 79, progress: 58, recentTrend: 'declining' },
      speaking: { score: 85, progress: 71, recentTrend: 'improving' },
      grammar: { score: 91, progress: 82, recentTrend: 'stable' },
      vocabulary: { score: 83, progress: 69, recentTrend: 'improving' },
    },
    timeSeriesData: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      score: Math.floor(Math.random() * 30) + 70,
      studyTime: Math.floor(Math.random() * 120) + 30,
      section: ['reading', 'listening', 'writing', 'speaking'][i % 4],
    })),
    weaknessAnalysis: {
      identifiedWeaknesses: [
        {
          area: 'listening-comprehension',
          severity: 'high',
          description: 'Difficulty with fast speech and accents',
          recommendations: [
            'Practice with native speaker recordings',
            'Use slower speech initially, then increase speed',
            'Focus on British and American accent differences',
          ],
          estimatedImprovementTime: 6, // weeks
        },
        {
          area: 'written-expression',
          severity: 'medium',
          description: 'Grammar errors in complex sentences',
          recommendations: [
            'Review complex sentence structures',
            'Practice with conditional sentences',
            'Use grammar checking tools for feedback',
          ],
          estimatedImprovementTime: 4, // weeks
        },
      ],
      strengths: [
        'Excellent reading comprehension',
        'Strong vocabulary knowledge',
        'Consistent study habits',
      ],
    },
    comparativeData: {
      peerAverage: {
        score: 75,
        completionRate: 58,
        studyTime: 3200,
      },
      levelBenchmark: {
        b1Entry: 65,
        b1Exit: 85,
        b2Ready: 90,
      },
    },
    predictions: {
      estimatedB2Readiness: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
      probabilityOfSuccess: 0.87,
      recommendedStudyPace: 'current', // current, increase, decrease
      criticalAreas: ['listening', 'writing'],
    },
    goals: [
      {
        id: 'goal-1',
        title: 'Reach 90% average score',
        currentValue: 82,
        targetValue: 90,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        progress: 0.75,
        status: 'on-track',
      },
      {
        id: 'goal-2',
        title: 'Complete all B1 exams',
        currentValue: 15,
        targetValue: 22,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        progress: 0.68,
        status: 'at-risk',
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();
    mockRouter.pathname = '/dashboard/english/b1';
    
    // Mock AnalyticsEngine
    AnalyticsEngine.prototype.generateProgressReport = jest.fn().mockResolvedValue(mockAnalyticsData);
    AnalyticsEngine.prototype.updateGoals = jest.fn().mockResolvedValue(true);
    AnalyticsEngine.prototype.exportData = jest.fn().mockResolvedValue({
      format: 'json',
      data: mockAnalyticsData,
      exportDate: new Date().toISOString(),
    });

    // Mock performance API
    Object.defineProperty(window, 'performance', {
      value: {
        now: () => Date.now(),
        mark: jest.fn(),
        measure: jest.fn(),
        getEntriesByType: () => [],
      },
      writable: true,
    });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Analytics Dashboard Initialization', () => {
    it('should load analytics dashboard with comprehensive data', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      // Verify loading state
      expect(screen.getByTestId('analytics-loading')).toBeInTheDocument();
      expect(screen.getByText('Cargando análisis de progreso...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      // Verify main dashboard components
      expect(screen.getByTestId('overview-metrics')).toBeInTheDocument();
      expect(screen.getByTestId('skill-breakdown')).toBeInTheDocument();
      expect(screen.getByTestId('progress-charts')).toBeInTheDocument();
      expect(screen.getByTestId('goals-section')).toBeInTheDocument();
      expect(screen.getByTestId('weakness-analysis')).toBeInTheDocument();

      // Verify overview metrics
      expect(screen.getByText('68% completado')).toBeInTheDocument();
      expect(screen.getByText('Puntuación media: 82%')).toBeInTheDocument();
      expect(screen.getByText('72 horas estudiadas')).toBeInTheDocument();
      expect(screen.getByText('Racha actual: 12 días')).toBeInTheDocument();

      // Verify AnalyticsEngine was called
      expect(AnalyticsEngine.prototype.generateProgressReport).toHaveBeenCalledWith({
        userId: 'user-123',
        courseId: 'english-b1-eoi',
        timeRange: 'last-30-days',
      });
    });

    it('should handle analytics data loading errors gracefully', async () => {
      // Mock analytics service error
      AnalyticsEngine.prototype.generateProgressReport = jest.fn().mockRejectedValue(
        new Error('Analytics service unavailable')
      );

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('analytics-error')).toBeInTheDocument();
        expect(screen.getByText('Error al cargar análisis de progreso')).toBeInTheDocument();
      });

      // Verify retry functionality
      const retryButton = screen.getByTestId('retry-analytics-button');
      expect(retryButton).toBeInTheDocument();

      // Mock successful retry
      AnalyticsEngine.prototype.generateProgressReport = jest.fn().mockResolvedValue(mockAnalyticsData);
      
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });
    });

    it('should provide customizable time range selection', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      // Test time range selector
      const timeRangeSelector = screen.getByTestId('time-range-selector');
      expect(timeRangeSelector).toHaveValue('last-30-days');

      // Change to last 7 days
      await user.selectOptions(timeRangeSelector, 'last-7-days');

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.generateProgressReport).toHaveBeenLastCalledWith({
          userId: 'user-123',
          courseId: 'english-b1-eoi',
          timeRange: 'last-7-days',
        });
      });

      // Test custom date range
      await user.selectOptions(timeRangeSelector, 'custom');

      await waitFor(() => {
        expect(screen.getByTestId('custom-date-picker')).toBeInTheDocument();
      });

      const startDatePicker = screen.getByTestId('start-date-picker');
      const endDatePicker = screen.getByTestId('end-date-picker');

      await user.type(startDatePicker, '2024-01-01');
      await user.type(endDatePicker, '2024-01-31');

      const applyRangeButton = screen.getByTestId('apply-date-range-button');
      await user.click(applyRangeButton);

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.generateProgressReport).toHaveBeenLastCalledWith({
          userId: 'user-123',
          courseId: 'english-b1-eoi',
          timeRange: 'custom',
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        });
      });
    });
  });

  describe('Multi-dimensional Progress Visualization', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });
    });

    it('should display skill breakdown with detailed metrics', async () => {
      const skillBreakdown = screen.getByTestId('skill-breakdown');
      expect(skillBreakdown).toBeInTheDocument();

      // Verify skill cards
      expect(within(skillBreakdown).getByTestId('skill-reading')).toBeInTheDocument();
      expect(within(skillBreakdown).getByTestId('skill-listening')).toBeInTheDocument();
      expect(within(skillBreakdown).getByTestId('skill-writing')).toBeInTheDocument();
      expect(within(skillBreakdown).getByTestId('skill-speaking')).toBeInTheDocument();

      // Verify skill metrics
      const readingSkill = within(skillBreakdown).getByTestId('skill-reading');
      expect(within(readingSkill).getByText('88%')).toBeInTheDocument(); // score
      expect(within(readingSkill).getByText('75% progreso')).toBeInTheDocument();
      expect(within(readingSkill).getByTestId('trend-improving')).toBeInTheDocument();

      const listeningSkill = within(skillBreakdown).getByTestId('skill-listening');
      expect(within(listeningSkill).getByText('76%')).toBeInTheDocument();
      expect(within(listeningSkill).getByTestId('trend-stable')).toBeInTheDocument();

      const writingSkill = within(skillBreakdown).getByTestId('skill-writing');
      expect(within(writingSkill).getByTestId('trend-declining')).toBeInTheDocument();

      // Test skill detail modal
      await user.click(readingSkill);

      await waitFor(() => {
        expect(screen.getByTestId('skill-detail-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('skill-detail-modal');
      expect(within(modal).getByText('Comprensión Lectora - Detalle')).toBeInTheDocument();
      expect(within(modal).getByTestId('skill-history-chart')).toBeInTheDocument();
      expect(within(modal).getByTestId('skill-recommendations')).toBeInTheDocument();
    });

    it('should render interactive progress charts', async () => {
      const progressCharts = screen.getByTestId('progress-charts');
      expect(progressCharts).toBeInTheDocument();

      // Verify chart types
      expect(within(progressCharts).getByTestId('line-chart')).toBeInTheDocument(); // Progress over time
      expect(within(progressCharts).getByTestId('radar-chart')).toBeInTheDocument(); // Skill comparison
      expect(within(progressCharts).getByTestId('bar-chart')).toBeInTheDocument(); // Score distribution

      // Test chart interaction
      const chartTabs = screen.getByTestId('chart-tabs');
      expect(within(chartTabs).getByText('Progreso temporal')).toBeInTheDocument();
      expect(within(chartTabs).getByText('Comparación de habilidades')).toBeInTheDocument();
      expect(within(chartTabs).getByText('Distribución de puntuaciones')).toBeInTheDocument();

      // Switch chart types
      await user.click(within(chartTabs).getByText('Comparación de habilidades'));

      await waitFor(() => {
        expect(screen.getByTestId('radar-chart')).toBeVisible();
      });

      // Verify chart data
      const radarChart = screen.getByTestId('radar-chart');
      const chartData = JSON.parse(radarChart.getAttribute('data-chart-data'));
      expect(chartData.labels).toContain('Reading');
      expect(chartData.labels).toContain('Listening');
      expect(chartData.datasets[0].data).toContain(88); // Reading score
    });

    it('should provide comparative analysis with benchmarks', async () => {
      const comparativeSection = screen.getByTestId('comparative-analysis');
      expect(comparativeSection).toBeInTheDocument();

      // Verify benchmark comparisons
      expect(within(comparativeSection).getByText('Tu puntuación: 82%')).toBeInTheDocument();
      expect(within(comparativeSection).getByText('Media de estudiantes: 75%')).toBeInTheDocument();
      expect(within(comparativeSection).getByText('Nivel B1 mínimo: 65%')).toBeInTheDocument();
      expect(within(comparativeSection).getByText('Nivel B2 requerido: 90%')).toBeInTheDocument();

      // Verify performance indicators
      expect(within(comparativeSection).getByTestId('above-average-indicator')).toBeInTheDocument();
      expect(within(comparativeSection).getByTestId('b1-mastered-indicator')).toBeInTheDocument();
      expect(within(comparativeSection).getByTestId('b2-progress-indicator')).toBeInTheDocument();

      // Test detailed comparison modal
      const compareButton = within(comparativeSection).getByTestId('detailed-comparison-button');
      await user.click(compareButton);

      await waitFor(() => {
        expect(screen.getByTestId('detailed-comparison-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('detailed-comparison-modal');
      expect(within(modal).getByTestId('percentile-chart')).toBeInTheDocument();
      expect(within(modal).getByText('Estás en el percentil 78')).toBeInTheDocument();
    });
  });

  describe('Weakness Analysis and Recommendations', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });
    });

    it('should identify and display weakness patterns', async () => {
      const weaknessAnalysis = screen.getByTestId('weakness-analysis');
      expect(weaknessAnalysis).toBeInTheDocument();

      // Verify identified weaknesses
      expect(within(weaknessAnalysis).getByText('Áreas de mejora identificadas')).toBeInTheDocument();

      const listeningWeakness = within(weaknessAnalysis).getByTestId('weakness-listening-comprehension');
      expect(listeningWeakness).toBeInTheDocument();
      expect(within(listeningWeakness).getByText('Comprensión Auditiva')).toBeInTheDocument();
      expect(within(listeningWeakness).getByTestId('severity-high')).toBeInTheDocument();
      expect(within(listeningWeakness).getByText('Dificultad con habla rápida y acentos')).toBeInTheDocument();

      const writingWeakness = within(weaknessAnalysis).getByTestId('weakness-written-expression');
      expect(writingWeakness).toBeInTheDocument();
      expect(within(writingWeakness).getByTestId('severity-medium')).toBeInTheDocument();

      // Verify strengths section
      const strengthsSection = within(weaknessAnalysis).getByTestId('strengths-section');
      expect(within(strengthsSection).getByText('Tus fortalezas')).toBeInTheDocument();
      expect(within(strengthsSection).getByText('Excelente comprensión lectora')).toBeInTheDocument();
      expect(within(strengthsSection).getByText('Vocabulario sólido')).toBeInTheDocument();
    });

    it('should provide actionable recommendations', async () => {
      const weaknessAnalysis = screen.getByTestId('weakness-analysis');
      const listeningWeakness = within(weaknessAnalysis).getByTestId('weakness-listening-comprehension');

      // Expand recommendations
      const expandButton = within(listeningWeakness).getByTestId('expand-recommendations');
      await user.click(expandButton);

      await waitFor(() => {
        expect(within(listeningWeakness).getByTestId('recommendations-list')).toBeInTheDocument();
      });

      const recommendationsList = within(listeningWeakness).getByTestId('recommendations-list');
      expect(within(recommendationsList).getByText('Practica con grabaciones de hablantes nativos')).toBeInTheDocument();
      expect(within(recommendationsList).getByText('Usa habla lenta inicialmente, luego aumenta velocidad')).toBeInTheDocument();

      // Test recommendation interaction
      const recommendation1 = within(recommendationsList).getByTestId('recommendation-1');
      const practiceButton = within(recommendation1).getByTestId('start-practice-button');
      
      await user.click(practiceButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard/english/b1/practice/listening-native-speakers');

      // Verify improvement time estimate
      expect(within(listeningWeakness).getByText('Tiempo estimado: 6 semanas')).toBeInTheDocument();
    });

    it('should track recommendation implementation progress', async () => {
      // Mock recommendation progress data
      const progressData = {
        'recommendation-1': { completed: 3, total: 10, status: 'in-progress' },
        'recommendation-2': { completed: 0, total: 8, status: 'not-started' },
      };

      localStorage.getItem.mockReturnValue(JSON.stringify(progressData));

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      const weaknessAnalysis = screen.getByTestId('weakness-analysis');
      const listeningWeakness = within(weaknessAnalysis).getByTestId('weakness-listening-comprehension');

      // Expand recommendations to see progress
      await user.click(within(listeningWeakness).getByTestId('expand-recommendations'));

      const recommendation1 = within(listeningWeakness).getByTestId('recommendation-1');
      expect(within(recommendation1).getByText('3/10 completado')).toBeInTheDocument();
      expect(within(recommendation1).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
    });
  });

  describe('Goal Setting and Tracking', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });
    });

    it('should display and manage learning goals', async () => {
      const goalsSection = screen.getByTestId('goals-section');
      expect(goalsSection).toBeInTheDocument();

      // Verify existing goals
      const goal1 = within(goalsSection).getByTestId('goal-goal-1');
      expect(within(goal1).getByText('Alcanzar 90% de puntuación media')).toBeInTheDocument();
      expect(within(goal1).getByText('82/90')).toBeInTheDocument();
      expect(within(goal1).getByTestId('status-on-track')).toBeInTheDocument();

      const goal2 = within(goalsSection).getByTestId('goal-goal-2');
      expect(within(goal2).getByText('Completar todos los exámenes B1')).toBeInTheDocument();
      expect(within(goal2).getByText('15/22')).toBeInTheDocument();
      expect(within(goal2).getByTestId('status-at-risk')).toBeInTheDocument();

      // Verify progress bars
      const progressBar1 = within(goal1).getByRole('progressbar');
      expect(progressBar1).toHaveAttribute('aria-valuenow', '75');

      // Test goal details
      await user.click(goal1);

      await waitFor(() => {
        expect(screen.getByTestId('goal-detail-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('goal-detail-modal');
      expect(within(modal).getByTestId('goal-progress-chart')).toBeInTheDocument();
      expect(within(modal).getByTestId('goal-timeline')).toBeInTheDocument();
    });

    it('should allow creating new goals', async () => {
      const goalsSection = screen.getByTestId('goals-section');
      const addGoalButton = within(goalsSection).getByTestId('add-goal-button');
      
      await user.click(addGoalButton);

      await waitFor(() => {
        expect(screen.getByTestId('create-goal-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('create-goal-modal');

      // Fill goal form
      const titleInput = within(modal).getByTestId('goal-title-input');
      await user.type(titleInput, 'Improve listening to 85%');

      const targetInput = within(modal).getByTestId('goal-target-input');
      await user.type(targetInput, '85');

      const deadlineInput = within(modal).getByTestId('goal-deadline-input');
      await user.type(deadlineInput, '2024-04-01');

      const categorySelect = within(modal).getByTestId('goal-category-select');
      await user.selectOptions(categorySelect, 'listening');

      // Submit goal
      const submitButton = within(modal).getByTestId('submit-goal-button');
      await user.click(submitButton);

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.updateGoals).toHaveBeenCalledWith({
          userId: 'user-123',
          newGoal: {
            title: 'Improve listening to 85%',
            targetValue: 85,
            deadline: '2024-04-01',
            category: 'listening',
          },
        });
      });

      // Verify goal was added
      await waitFor(() => {
        expect(screen.queryByTestId('create-goal-modal')).not.toBeInTheDocument();
      });
    });

    it('should provide goal achievement predictions', async () => {
      const predictionsSection = screen.getByTestId('predictions-section');
      expect(predictionsSection).toBeInTheDocument();

      // Verify B2 readiness prediction
      expect(within(predictionsSection).getByText('Preparado para B2 en 3 meses')).toBeInTheDocument();
      expect(within(predictionsSection).getByText('Probabilidad de éxito: 87%')).toBeInTheDocument();

      // Verify study pace recommendation
      expect(within(predictionsSection).getByText('Ritmo actual recomendado')).toBeInTheDocument();

      // Verify critical areas
      const criticalAreas = within(predictionsSection).getByTestId('critical-areas');
      expect(within(criticalAreas).getByText('Listening')).toBeInTheDocument();
      expect(within(criticalAreas).getByText('Writing')).toBeInTheDocument();

      // Test prediction details
      const detailsButton = within(predictionsSection).getByTestId('prediction-details-button');
      await user.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByTestId('prediction-details-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('prediction-details-modal');
      expect(within(modal).getByTestId('prediction-model-explanation')).toBeInTheDocument();
      expect(within(modal).getByTestId('prediction-confidence-chart')).toBeInTheDocument();
    });
  });

  describe('Export and Sharing Capabilities', () => {
    beforeEach(async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });
    });

    it('should export progress data in multiple formats', async () => {
      const exportButton = screen.getByTestId('export-data-button');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByTestId('export-options-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('export-options-modal');

      // Test JSON export
      const jsonExportButton = within(modal).getByTestId('export-json-button');
      await user.click(jsonExportButton);

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.exportData).toHaveBeenCalledWith({
          userId: 'user-123',
          format: 'json',
          includeRawData: true,
        });
      });

      // Test PDF report export
      const pdfExportButton = within(modal).getByTestId('export-pdf-button');
      await user.click(pdfExportButton);

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.exportData).toHaveBeenCalledWith({
          userId: 'user-123',
          format: 'pdf',
          includeCharts: true,
        });
      });

      // Test CSV export
      const csvExportButton = within(modal).getByTestId('export-csv-button');
      await user.click(csvExportButton);

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.exportData).toHaveBeenCalledWith({
          userId: 'user-123',
          format: 'csv',
          timeRange: 'all',
        });
      });
    });

    it('should generate shareable progress reports', async () => {
      const shareButton = screen.getByTestId('share-progress-button');
      await user.click(shareButton);

      await waitFor(() => {
        expect(screen.getByTestId('share-options-modal')).toBeInTheDocument();
      });

      const modal = screen.getByTestId('share-options-modal');

      // Test public link generation
      const generateLinkButton = within(modal).getByTestId('generate-public-link-button');
      await user.click(generateLinkButton);

      await waitFor(() => {
        expect(screen.getByTestId('public-link-display')).toBeInTheDocument();
      });

      const linkDisplay = screen.getByTestId('public-link-display');
      const shareLink = within(linkDisplay).getByTestId('share-link-input');
      expect(shareLink).toHaveValue(expect.stringContaining('/shared-progress/'));

      // Test copy link functionality
      const copyButton = within(linkDisplay).getByTestId('copy-link-button');
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/shared-progress/')
      );
    });

    it('should handle teacher/tutor sharing with privacy controls', async () => {
      const shareButton = screen.getByTestId('share-progress-button');
      await user.click(shareButton);

      const modal = screen.getByTestId('share-options-modal');

      // Test teacher sharing
      const teacherTab = within(modal).getByTestId('teacher-sharing-tab');
      await user.click(teacherTab);

      await waitFor(() => {
        expect(within(modal).getByTestId('teacher-sharing-form')).toBeInTheDocument();
      });

      const form = within(modal).getByTestId('teacher-sharing-form');

      // Fill teacher email
      const emailInput = within(form).getByTestId('teacher-email-input');
      await user.type(emailInput, 'teacher@school.edu');

      // Configure privacy settings
      const includeDetailedScores = within(form).getByTestId('include-detailed-scores-checkbox');
      const includeWeaknesses = within(form).getByTestId('include-weaknesses-checkbox');
      const includeStudyTime = within(form).getByTestId('include-study-time-checkbox');

      expect(includeDetailedScores).toBeChecked();
      expect(includeWeaknesses).toBeChecked();
      expect(includeStudyTime).not.toBeChecked(); // Privacy default

      // Send to teacher
      const sendButton = within(form).getByTestId('send-to-teacher-button');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('sharing-confirmation')).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Analytics Updates', () => {
    it('should update analytics when new data is available', async () => {
      const mockRealtimeChannel = {
        on: jest.fn(),
        subscribe: jest.fn(),
        unsubscribe: jest.fn(),
      };

      const mockSupabase = {
        auth: {
          getSession: () => Promise.resolve({ data: { session: { user: mockUserData } } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              subscribe: () => mockRealtimeChannel,
            }),
          }),
        }),
        channel: () => mockRealtimeChannel,
      };

      render(
        <MockSupabaseProvider mockClient={mockSupabase} initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      // Simulate real-time update
      const newExamData = {
        examId: 'new-exam-456',
        score: 95,
        section: 'listening',
        completedAt: new Date().toISOString(),
      };

      // Mock callback and trigger update
      const updateCallback = mockRealtimeChannel.on.mock.calls[0][1];
      act(() => {
        updateCallback({ new: newExamData });
      });

      // Mock updated analytics data
      const updatedAnalyticsData = {
        ...mockAnalyticsData,
        overallProgress: {
          ...mockAnalyticsData.overallProgress,
          averageScore: 84,
          examsCompleted: 16,
        },
        skillBreakdown: {
          ...mockAnalyticsData.skillBreakdown,
          listening: { score: 85, progress: 71, recentTrend: 'improving' },
        },
      };

      AnalyticsEngine.prototype.generateProgressReport = jest.fn().mockResolvedValue(updatedAnalyticsData);

      await waitFor(() => {
        expect(screen.getByText('Puntuación media: 84%')).toBeInTheDocument();
        expect(screen.getByText('16/22 exámenes completados')).toBeInTheDocument();
      });

      // Verify update notification
      expect(screen.getByTestId('analytics-updated-notification')).toBeInTheDocument();
      expect(screen.getByText('Progreso actualizado con nuevo examen')).toBeInTheDocument();
    });

    it('should handle concurrent user sessions gracefully', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      // Simulate concurrent session update
      const concurrentUpdate = {
        type: 'concurrent-progress-update',
        userId: 'user-123',
        sessionId: 'other-session',
        changes: { newGoal: true },
      };

      act(() => {
        fireEvent(window, new CustomEvent('concurrent-session-update', {
          detail: concurrentUpdate
        }));
      });

      await waitFor(() => {
        expect(screen.getByTestId('concurrent-update-notification')).toBeInTheDocument();
      });

      // User should be able to refresh data
      const refreshButton = screen.getByTestId('refresh-data-button');
      await user.click(refreshButton);

      await waitFor(() => {
        expect(AnalyticsEngine.prototype.generateProgressReport).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Performance and Accessibility', () => {
    it('should handle large datasets efficiently', async () => {
      // Mock large dataset
      const largeDataset = {
        ...mockAnalyticsData,
        timeSeriesData: Array.from({ length: 1000 }, (_, i) => ({
          date: new Date(Date.now() - (999 - i) * 24 * 60 * 60 * 1000),
          score: Math.floor(Math.random() * 30) + 70,
          studyTime: Math.floor(Math.random() * 120) + 30,
          section: ['reading', 'listening', 'writing', 'speaking'][i % 4],
        })),
      };

      AnalyticsEngine.prototype.generateProgressReport = jest.fn().mockResolvedValue(largeDataset);

      const startTime = performance.now();

      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // Should handle large datasets in <3s

      // Verify data virtualization
      const timeSeriesChart = screen.getByTestId('line-chart');
      expect(timeSeriesChart).toBeInTheDocument();

      // Should not render all 1000 data points at once
      const chartData = JSON.parse(timeSeriesChart.getAttribute('data-chart-data'));
      expect(chartData.datasets[0].data.length).toBeLessThanOrEqual(100); // Sampled data
    });

    it('should be fully accessible for data visualization', async () => {
      render(
        <MockSupabaseProvider initialUser={mockUserData}>
          <ProgressAnalytics />
        </MockSupabaseProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('progress-analytics')).toBeInTheDocument();
      });

      // Test keyboard navigation
      const firstChart = screen.getByTestId('line-chart');
      firstChart.focus();
      expect(document.activeElement).toBe(firstChart);

      // Test ARIA labels for charts
      expect(firstChart).toHaveAttribute('role', 'img');
      expect(firstChart).toHaveAttribute('aria-label', expect.stringContaining('Progreso temporal'));

      // Test data table alternative
      const dataTableToggle = screen.getByTestId('show-data-table-button');
      await user.click(dataTableToggle);

      await waitFor(() => {
        expect(screen.getByTestId('progress-data-table')).toBeInTheDocument();
      });

      const dataTable = screen.getByTestId('progress-data-table');
      expect(dataTable).toHaveAttribute('role', 'table');

      // Verify table headers
      expect(screen.getByRole('columnheader', { name: 'Fecha' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Puntuación' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Sección' })).toBeInTheDocument();

      // Test high contrast mode
      document.documentElement.setAttribute('data-theme', 'high-contrast');

      const charts = screen.getAllByTestId(/-chart$/);
      charts.forEach(chart => {
        const styles = window.getComputedStyle(chart);
        expect(styles.border).toBeTruthy(); // High contrast borders
      });

      // Test reduced motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addListener: jest.fn(),
          removeListener: jest.fn(),
        })),
      });

      // Charts should disable animations
      const animatedElements = screen.getAllByTestId(/chart-animation/);
      animatedElements.forEach(element => {
        expect(element).toHaveClass('reduce-motion');
      });
    });
  });
});