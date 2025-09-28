/**
 * Component Test: ScoreDisplay UI Component
 *
 * Tests the score display component that shows current game scores and statistics:
 * 1. Basic rendering and score display
 * 2. Score formatting and display modes
 * 3. Real-time score updates and animations
 * 4. Statistics display (correct/incorrect counts)
 * 5. Accuracy percentage calculations
 * 6. Score change animations and visual feedback
 * 7. Streak indicators and achievements
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The ScoreDisplay component will be implemented in Phase 3.3
 */

import { render, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { ScoreDisplay } from '@/components/swipe/score-display';

const mockScoreData = {
  current: 5.67,
  correct: 8,
  incorrect: 3,
  total: 11,
  streak: 4,
  accuracy: 72.7
};

describe('ScoreDisplay Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders basic score information correctly', () => {
    render(
      <ScoreDisplay
        score={mockScoreData.current}
        correct={mockScoreData.correct}
        incorrect={mockScoreData.incorrect}
        total={mockScoreData.total}
      />
    );

    // Should display current score
    expect(screen.getByTestId('current-score')).toBeInTheDocument();
    expect(screen.getByText('5.67')).toBeInTheDocument();

    // Should display correct/incorrect counts
    expect(screen.getByTestId('correct-count')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByTestId('incorrect-count')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Should display total answers
    expect(screen.getByTestId('total-answers')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  test('calculates and displays accuracy percentage', () => {
    render(
      <ScoreDisplay
        score={10}
        correct={8}
        incorrect={2}
        total={10}
        showAccuracy={true}
      />
    );

    // Should calculate accuracy as 80%
    expect(screen.getByTestId('accuracy-percentage')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  test('handles zero total gracefully', () => {
    render(
      <ScoreDisplay
        score={0}
        correct={0}
        incorrect={0}
        total={0}
        showAccuracy={true}
      />
    );

    // Should show 0% accuracy for zero total
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('displays streak information when provided', () => {
    render(
      <ScoreDisplay
        score={15}
        correct={10}
        incorrect={2}
        total={12}
        streak={5}
        showStreak={true}
      />
    );

    expect(screen.getByTestId('current-streak')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/racha actual/i)).toBeInTheDocument();
  });

  test('shows streak achievements for high streaks', () => {
    render(
      <ScoreDisplay
        score={20}
        correct={15}
        incorrect={0}
        total={15}
        streak={10}
        showStreak={true}
      />
    );

    // Should show achievement indicator for streak >= 10
    expect(screen.getByTestId('streak-achievement')).toBeInTheDocument();
    expect(screen.getByText(/¡Racha increíble!/i)).toBeInTheDocument();
  });

  test('formats score with different decimal places', () => {
    const { rerender } = render(
      <ScoreDisplay
        score={7.333333}
        correct={5}
        incorrect={2}
        total={7}
        decimalPlaces={2}
      />
    );

    // Should round to 2 decimal places
    expect(screen.getByText('7.33')).toBeInTheDocument();

    rerender(
      <ScoreDisplay
        score={7.333333}
        correct={5}
        incorrect={2}
        total={7}
        decimalPlaces={1}
      />
    );

    // Should round to 1 decimal place
    expect(screen.getByText('7.3')).toBeInTheDocument();

    rerender(
      <ScoreDisplay
        score={7.333333}
        correct={5}
        incorrect={2}
        total={7}
        decimalPlaces={0}
      />
    );

    // Should round to whole number
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('shows positive and negative score changes', async () => {
    const { rerender } = render(
      <ScoreDisplay
        score={5}
        correct={3}
        incorrect={2}
        total={5}
        showChange={true}
      />
    );

    // Update with positive change
    rerender(
      <ScoreDisplay
        score={6}
        correct={4}
        incorrect={2}
        total={6}
        showChange={true}
        lastChange={1}
      />
    );

    expect(screen.getByTestId('score-change-positive')).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();

    // Update with negative change
    rerender(
      <ScoreDisplay
        score={4.67}
        correct={4}
        incorrect={3}
        total={7}
        showChange={true}
        lastChange={-1.33}
      />
    );

    expect(screen.getByTestId('score-change-negative')).toBeInTheDocument();
    expect(screen.getByText('-1.33')).toBeInTheDocument();
  });

  test('displays different visual themes', () => {
    const { rerender } = render(
      <ScoreDisplay
        score={10}
        correct={8}
        incorrect={2}
        total={10}
        theme="default"
      />
    );

    expect(screen.getByTestId('score-display')).toHaveClass('theme-default');

    rerender(
      <ScoreDisplay
        score={10}
        correct={8}
        incorrect={2}
        total={10}
        theme="compact"
      />
    );

    expect(screen.getByTestId('score-display')).toHaveClass('theme-compact');

    rerender(
      <ScoreDisplay
        score={10}
        correct={8}
        incorrect={2}
        total={10}
        theme="minimal"
      />
    );

    expect(screen.getByTestId('score-display')).toHaveClass('theme-minimal');
  });

  test('shows performance indicators based on accuracy', () => {
    const { rerender } = render(
      <ScoreDisplay
        score={15}
        correct={9}
        incorrect={1}
        total={10}
        showPerformance={true}
      />
    );

    // 90% accuracy should show excellent performance
    expect(screen.getByTestId('performance-excellent')).toBeInTheDocument();
    expect(screen.getByText(/excelente/i)).toBeInTheDocument();

    rerender(
      <ScoreDisplay
        score={8}
        correct={7}
        incorrect={3}
        total={10}
        showPerformance={true}
      />
    );

    // 70% accuracy should show good performance
    expect(screen.getByTestId('performance-good')).toBeInTheDocument();
    expect(screen.getByText(/bien/i)).toBeInTheDocument();

    rerender(
      <ScoreDisplay
        score={3}
        correct={5}
        incorrect={5}
        total={10}
        showPerformance={true}
      />
    );

    // 50% accuracy should show needs improvement
    expect(screen.getByTestId('performance-needs-improvement')).toBeInTheDocument();
    expect(screen.getByText(/mejorar/i)).toBeInTheDocument();
  });

  test('displays score breakdown when enabled', () => {
    render(
      <ScoreDisplay
        score={8.34}
        correct={10}
        incorrect={3}
        total={13}
        showBreakdown={true}
      />
    );

    expect(screen.getByTestId('score-breakdown')).toBeInTheDocument();

    // Should show positive points calculation
    expect(screen.getByText(/10 × 1.0 = 10.0/)).toBeInTheDocument();

    // Should show negative points calculation
    expect(screen.getByText(/3 × -1.33 = -3.99/)).toBeInTheDocument();

    // Should show net calculation
    expect(screen.getByText(/Total: 10.0 - 3.99 = 6.01/)).toBeInTheDocument();
  });

  test('animates score changes', async () => {
    const { rerender } = render(
      <ScoreDisplay
        score={5}
        correct={3}
        incorrect={2}
        total={5}
        animated={true}
      />
    );

    const scoreElement = screen.getByTestId('current-score');

    // Update score
    rerender(
      <ScoreDisplay
        score={6}
        correct={4}
        incorrect={2}
        total={6}
        animated={true}
        lastChange={1}
      />
    );

    // Should have animation class during update
    expect(scoreElement).toHaveClass('score-updating');

    // Wait for animation to complete
    await waitFor(() => {
      expect(scoreElement).not.toHaveClass('score-updating');
    }, { timeout: 1000 });
  });

  test('shows progress towards goals', () => {
    render(
      <ScoreDisplay
        score={7.5}
        correct={8}
        incorrect={2}
        total={10}
        targetScore={10}
        showProgress={true}
      />
    );

    expect(screen.getByTestId('score-progress')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toBeInTheDocument();

    // Should show 75% progress (7.5/10)
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toHaveStyle('width: 75%');

    // Should show target score
    expect(screen.getByText(/Objetivo: 10/)).toBeInTheDocument();
  });

  test('handles negative scores correctly', () => {
    render(
      <ScoreDisplay
        score={-2.66}
        correct={2}
        incorrect={4}
        total={6}
      />
    );

    expect(screen.getByTestId('current-score')).toBeInTheDocument();
    expect(screen.getByText('-2.66')).toBeInTheDocument();

    // Should have negative score styling
    expect(screen.getByTestId('score-display')).toHaveClass('negative-score');
  });

  test('has proper accessibility attributes', () => {
    render(
      <ScoreDisplay
        score={8.5}
        correct={7}
        incorrect={2}
        total={9}
        streak={3}
        showAccuracy={true}
        showStreak={true}
      />
    );

    const scoreDisplay = screen.getByTestId('score-display');

    // Should have proper role and aria attributes
    expect(scoreDisplay).toHaveAttribute('role', 'region');
    expect(scoreDisplay).toHaveAttribute('aria-label', expect.stringContaining('puntuación'));

    // Individual elements should be labeled
    expect(screen.getByTestId('current-score')).toHaveAttribute('aria-label', expect.stringContaining('8.5'));
    expect(screen.getByTestId('accuracy-percentage')).toHaveAttribute('aria-label', expect.stringContaining('77.8%'));
    expect(screen.getByTestId('current-streak')).toHaveAttribute('aria-label', expect.stringContaining('3'));
  });

  test('updates live regions for screen readers', async () => {
    const { rerender } = render(
      <ScoreDisplay
        score={5}
        correct={3}
        incorrect={2}
        total={5}
      />
    );

    // Update score
    rerender(
      <ScoreDisplay
        score={6}
        correct={4}
        incorrect={2}
        total={6}
        lastChange={1}
      />
    );

    // Should announce change to screen readers
    expect(screen.getByTestId('score-announcement')).toBeInTheDocument();
    expect(screen.getByTestId('score-announcement')).toHaveAttribute('aria-live', 'polite');
  });

  test('shows compact layout when specified', () => {
    render(
      <ScoreDisplay
        score={12}
        correct={10}
        incorrect={3}
        total={13}
        layout="compact"
      />
    );

    expect(screen.getByTestId('score-display')).toHaveClass('layout-compact');

    // In compact mode, should show abbreviated labels
    expect(screen.getByText(/C:/)).toBeInTheDocument(); // Correct
    expect(screen.getByText(/I:/)).toBeInTheDocument(); // Incorrect
  });

  test('handles rapid score updates gracefully', async () => {
    const { rerender } = render(
      <ScoreDisplay
        score={0}
        correct={0}
        incorrect={0}
        total={0}
        animated={true}
      />
    );

    // Rapidly update scores
    for (let i = 1; i <= 5; i++) {
      rerender(
        <ScoreDisplay
          score={i}
          correct={i}
          incorrect={0}
          total={i}
          animated={true}
          lastChange={1}
        />
      );
    }

    // Should handle updates without errors
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByTestId('current-score')).toBeInTheDocument();
  });
});