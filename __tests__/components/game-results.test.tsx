/**
 * Component Test: GameResults UI Component
 *
 * Tests the game results component that displays session summary and analysis:
 * 1. Basic results display and formatting
 * 2. Performance analysis and feedback
 * 3. Statistical breakdowns and insights
 * 4. Achievement indicators and badges
 * 5. Recommendations for improvement
 * 6. Social sharing functionality
 * 7. Navigation to next session or review
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The GameResults component will be implemented in Phase 3.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { GameResults } from '@/components/swipe/game-results';

const mockSessionSummary = {
  session_id: 'test-session-123',
  score_total: 7.34,
  answers_total: 15,
  correct: 11,
  incorrect: 4,
  accuracy_pct: 73.3,
  items_per_min: 18.5,
  streak_max: 6,
  duration_actual_s: 48,
  error_buckets: {
    'grammar': 2,
    'vocabulary': 1,
    'pronunciation': 1
  }
};

const mockPerformanceAnalysis = {
  level_assessment: 'good',
  strengths: ['Quick response time', 'Good grammar knowledge'],
  improvement_areas: ['Vocabulary precision', 'Complex sentence structures'],
  difficulty_trend: 'increasing',
  consistency_score: 0.78
};

const mockRecommendations = {
  next_session_difficulty: 'medium',
  recommended_tags: ['vocabulary', 'complex-grammar'],
  estimated_improvement_time: '2-3 sessions',
  suggested_focus: 'vocabulary building'
};

describe('GameResults Component', () => {
  let mockOnPlayAgain: jest.MockedFunction<any>;
  let mockOnViewDetails: jest.MockedFunction<any>;
  let mockOnShare: jest.MockedFunction<any>;
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnPlayAgain = jest.fn();
    mockOnViewDetails = jest.fn();
    mockOnShare = jest.fn();
  });

  test('renders session summary correctly', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    // Should display main metrics
    expect(screen.getByTestId('final-score')).toBeInTheDocument();
    expect(screen.getByText('7.34')).toBeInTheDocument();

    expect(screen.getByTestId('total-answers')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByTestId('accuracy-percentage')).toBeInTheDocument();
    expect(screen.getByText('73.3%')).toBeInTheDocument();

    expect(screen.getByTestId('max-streak')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();

    // Should display correct/incorrect breakdown
    expect(screen.getByTestId('correct-answers')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();

    expect(screen.getByTestId('incorrect-answers')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('displays performance analysis', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    // Should show performance level
    expect(screen.getByTestId('performance-level')).toBeInTheDocument();
    expect(screen.getByText(/buen/i)).toBeInTheDocument();

    // Should display strengths
    expect(screen.getByTestId('strengths-section')).toBeInTheDocument();
    expect(screen.getByText(/Quick response time/)).toBeInTheDocument();
    expect(screen.getByText(/Good grammar knowledge/)).toBeInTheDocument();

    // Should display improvement areas
    expect(screen.getByTestId('improvement-areas')).toBeInTheDocument();
    expect(screen.getByText(/Vocabulary precision/)).toBeInTheDocument();
    expect(screen.getByText(/Complex sentence structures/)).toBeInTheDocument();
  });

  test('shows error breakdown by category', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    expect(screen.getByTestId('error-breakdown')).toBeInTheDocument();

    // Should show each error category
    expect(screen.getByText(/grammar.*2/i)).toBeInTheDocument();
    expect(screen.getByText(/vocabulary.*1/i)).toBeInTheDocument();
    expect(screen.getByText(/pronunciation.*1/i)).toBeInTheDocument();
  });

  test('displays recommendations for next session', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    expect(screen.getByTestId('recommendations-section')).toBeInTheDocument();

    // Should show recommended difficulty
    expect(screen.getByText(/medium/i)).toBeInTheDocument();

    // Should show focus areas
    expect(screen.getByText(/vocabulary building/i)).toBeInTheDocument();

    // Should show improvement timeline
    expect(screen.getByText(/2-3 sessions/i)).toBeInTheDocument();
  });

  test('calculates and displays time-based metrics', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    // Should display session duration
    expect(screen.getByTestId('session-duration')).toBeInTheDocument();
    expect(screen.getByText(/48.*segundos/i)).toBeInTheDocument();

    // Should display speed metric
    expect(screen.getByTestId('response-speed')).toBeInTheDocument();
    expect(screen.getByText(/18.5.*por minuto/i)).toBeInTheDocument();

    // Should calculate average time per item
    expect(screen.getByTestId('avg-time-per-item')).toBeInTheDocument();
    expect(screen.getByText(/3.2.*segundos/i)).toBeInTheDocument(); // 48s / 15 items
  });

  test('shows different performance levels with appropriate styling', () => {
    const excellentAnalysis = {
      ...mockPerformanceAnalysis,
      level_assessment: 'excellent'
    };

    const { rerender } = render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={excellentAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    // Should show excellent performance styling
    expect(screen.getByTestId('performance-badge')).toHaveClass('excellent');
    expect(screen.getByText(/excelente/i)).toBeInTheDocument();

    const poorAnalysis = {
      ...mockPerformanceAnalysis,
      level_assessment: 'needs_improvement'
    };

    rerender(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={poorAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    // Should show needs improvement styling
    expect(screen.getByTestId('performance-badge')).toHaveClass('needs-improvement');
    expect(screen.getByText(/mejorar/i)).toBeInTheDocument();
  });

  test('displays achievements and badges', () => {
    const summaryWithAchievements = {
      ...mockSessionSummary,
      streak_max: 10,
      accuracy_pct: 95,
      items_per_min: 25
    };

    render(
      <GameResults
        sessionSummary={summaryWithAchievements}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    expect(screen.getByTestId('achievements-section')).toBeInTheDocument();

    // Should show streak achievement
    expect(screen.getByTestId('streak-achievement')).toBeInTheDocument();
    expect(screen.getByText(/racha de 10/i)).toBeInTheDocument();

    // Should show accuracy achievement
    expect(screen.getByTestId('accuracy-achievement')).toBeInTheDocument();
    expect(screen.getByText(/95%.*precisión/i)).toBeInTheDocument();

    // Should show speed achievement
    expect(screen.getByTestId('speed-achievement')).toBeInTheDocument();
    expect(screen.getByText(/25.*por minuto/i)).toBeInTheDocument();
  });

  test('handles action buttons correctly', async () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        onViewDetails={mockOnViewDetails}
        onShare={mockOnShare}
      />
    );

    // Test play again button
    const playAgainButton = screen.getByTestId('play-again-button');
    await user.click(playAgainButton);
    expect(mockOnPlayAgain).toHaveBeenCalledTimes(1);

    // Test view details button
    const viewDetailsButton = screen.getByTestId('view-details-button');
    await user.click(viewDetailsButton);
    expect(mockOnViewDetails).toHaveBeenCalledWith(mockSessionSummary.session_id);

    // Test share button
    const shareButton = screen.getByTestId('share-button');
    await user.click(shareButton);
    expect(mockOnShare).toHaveBeenCalledWith(expect.objectContaining({
      score: mockSessionSummary.score_total,
      accuracy: mockSessionSummary.accuracy_pct
    }));
  });

  test('displays progress comparison when previous results provided', () => {
    const previousResults = {
      score_total: 5.2,
      accuracy_pct: 65.0,
      streak_max: 3
    };

    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        previousResults={previousResults}
      />
    );

    expect(screen.getByTestId('progress-comparison')).toBeInTheDocument();

    // Should show score improvement
    expect(screen.getByTestId('score-improvement')).toBeInTheDocument();
    expect(screen.getByText(/\+2\.14/)).toBeInTheDocument(); // 7.34 - 5.2

    // Should show accuracy improvement
    expect(screen.getByTestId('accuracy-improvement')).toBeInTheDocument();
    expect(screen.getByText(/\+8\.3%/)).toBeInTheDocument(); // 73.3 - 65.0

    // Should show streak improvement
    expect(screen.getByTestId('streak-improvement')).toBeInTheDocument();
    expect(screen.getByText(/\+3/)).toBeInTheDocument(); // 6 - 3
  });

  test('shows different layouts based on display mode', () => {
    const { rerender } = render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        displayMode="compact"
      />
    );

    expect(screen.getByTestId('game-results')).toHaveClass('compact');

    rerender(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        displayMode="detailed"
      />
    );

    expect(screen.getByTestId('game-results')).toHaveClass('detailed');
    expect(screen.getByTestId('detailed-analysis')).toBeInTheDocument();
  });

  test('handles social sharing with different platforms', async () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        onShare={mockOnShare}
        enableSocialSharing={true}
      />
    );

    // Should show social sharing options
    expect(screen.getByTestId('social-sharing')).toBeInTheDocument();

    const twitterButton = screen.getByTestId('share-twitter');
    await user.click(twitterButton);
    expect(mockOnShare).toHaveBeenCalledWith(expect.objectContaining({
      platform: 'twitter'
    }));

    const facebookButton = screen.getByTestId('share-facebook');
    await user.click(facebookButton);
    expect(mockOnShare).toHaveBeenCalledWith(expect.objectContaining({
      platform: 'facebook'
    }));
  });

  test('displays loading state while generating analysis', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={null}
        recommendations={null}
        onPlayAgain={mockOnPlayAgain}
        isAnalyzing={true}
      />
    );

    expect(screen.getByTestId('analysis-loading')).toBeInTheDocument();
    expect(screen.getByText(/analizando rendimiento/i)).toBeInTheDocument();

    // Basic results should still be visible
    expect(screen.getByTestId('final-score')).toBeInTheDocument();

    // Analysis sections should show loading placeholders
    expect(screen.getByTestId('analysis-placeholder')).toBeInTheDocument();
  });

  test('handles error state gracefully', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={null}
        recommendations={null}
        onPlayAgain={mockOnPlayAgain}
        analysisError="Failed to generate analysis"
      />
    );

    expect(screen.getByTestId('analysis-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to generate analysis/)).toBeInTheDocument();

    // Should offer retry option
    expect(screen.getByTestId('retry-analysis-button')).toBeInTheDocument();
  });

  test('formats large numbers correctly', () => {
    const highScoreSummary = {
      ...mockSessionSummary,
      score_total: 1234.56,
      answers_total: 1500,
      items_per_min: 150.75
    };

    render(
      <GameResults
        sessionSummary={highScoreSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    // Should format large score with commas
    expect(screen.getByText('1,234.56')).toBeInTheDocument();

    // Should format large answer count
    expect(screen.getByText('1,500')).toBeInTheDocument();

    // Should format speed metric
    expect(screen.getByText('150.75')).toBeInTheDocument();
  });

  test('has proper accessibility attributes', () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
      />
    );

    const resultsContainer = screen.getByTestId('game-results');

    // Should have proper role and aria attributes
    expect(resultsContainer).toHaveAttribute('role', 'region');
    expect(resultsContainer).toHaveAttribute('aria-label', expect.stringContaining('resultados'));

    // Summary should be announced to screen readers
    expect(screen.getByTestId('results-summary')).toHaveAttribute('aria-live', 'polite');

    // Action buttons should be properly labeled
    expect(screen.getByTestId('play-again-button')).toHaveAttribute('aria-label', expect.stringContaining('jugar de nuevo'));

    // Performance level should be accessible
    expect(screen.getByTestId('performance-level')).toHaveAttribute('aria-label', expect.stringContaining('nivel de rendimiento'));
  });

  test('supports keyboard navigation', async () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        onViewDetails={mockOnViewDetails}
      />
    );

    // Should be able to tab through interactive elements
    await user.tab();
    expect(screen.getByTestId('play-again-button')).toHaveFocus();

    await user.tab();
    expect(screen.getByTestId('view-details-button')).toHaveFocus();

    // Should be able to activate with Enter key
    await user.keyboard('{Enter}');
    expect(mockOnViewDetails).toHaveBeenCalled();
  });

  test('animates results presentation', async () => {
    render(
      <GameResults
        sessionSummary={mockSessionSummary}
        performanceAnalysis={mockPerformanceAnalysis}
        recommendations={mockRecommendations}
        onPlayAgain={mockOnPlayAgain}
        animated={true}
      />
    );

    // Should start with animation classes
    expect(screen.getByTestId('score-animation')).toHaveClass('animate-in');
    expect(screen.getByTestId('stats-animation')).toHaveClass('animate-in');

    // Wait for animation to complete
    await waitFor(() => {
      expect(screen.getByTestId('score-animation')).toHaveClass('animation-complete');
    }, { timeout: 2000 });
  });
});