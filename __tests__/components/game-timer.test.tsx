/**
 * Component Test: GameTimer UI Component
 *
 * Tests the timer component that displays countdown and handles time-based game logic:
 * 1. Basic rendering and time display
 * 2. Countdown functionality and progression
 * 3. Time format display (minutes:seconds)
 * 4. Warning states (low time remaining)
 * 5. Timer completion callbacks
 * 6. Pause/resume functionality
 * 7. Visual states and indicators
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The GameTimer component will be implemented in Phase 3.3
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { GameTimer } from '@/components/swipe/game-timer';

describe('GameTimer Component', () => {
  let mockOnTimeUp: jest.MockedFunction<any>;
  let mockOnTick: jest.MockedFunction<any>;

  beforeEach(() => {
    mockOnTimeUp = jest.fn();
    mockOnTick = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test('renders with initial time correctly', () => {
    render(
      <GameTimer
        duration={60}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    // Should display the initial time in MM:SS format
    expect(screen.getByText('1:00')).toBeInTheDocument();
    expect(screen.getByTestId('game-timer')).toBeInTheDocument();
    expect(screen.getByTestId('timer-display')).toBeInTheDocument();
  });

  test('formats time display correctly', () => {
    const { rerender } = render(
      <GameTimer
        duration={125}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    // Should display 2:05 for 125 seconds
    expect(screen.getByText('2:05')).toBeInTheDocument();

    // Test with different durations
    rerender(
      <GameTimer
        duration={9}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    // Should display 0:09 for 9 seconds
    expect(screen.getByText('0:09')).toBeInTheDocument();

    rerender(
      <GameTimer
        duration={600}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    // Should display 10:00 for 600 seconds
    expect(screen.getByText('10:00')).toBeInTheDocument();
  });

  test('counts down correctly', async () => {
    render(
      <GameTimer
        duration={5}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Initial state
    expect(screen.getByText('0:05')).toBeInTheDocument();

    // Advance timer by 1 second
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByText('0:04')).toBeInTheDocument();
    });

    // Advance timer by another 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('0:02')).toBeInTheDocument();
    });

    // Should call onTick for each second
    expect(mockOnTick).toHaveBeenCalledTimes(3);
  });

  test('calls onTimeUp when countdown reaches zero', async () => {
    render(
      <GameTimer
        duration={3}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Advance timer to completion
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(mockOnTimeUp).toHaveBeenCalledTimes(1);
    });

    // Should display 0:00 at completion
    expect(screen.getByText('0:00')).toBeInTheDocument();
  });

  test('shows warning state when time is low', async () => {
    render(
      <GameTimer
        duration={15}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
        warningThreshold={10}
      />
    );

    // Should not have warning class initially
    const timer = screen.getByTestId('game-timer');
    expect(timer).not.toHaveClass('warning');

    // Advance to warning threshold
    act(() => {
      jest.advanceTimersByTime(6000); // 9 seconds remaining
    });

    await waitFor(() => {
      expect(timer).toHaveClass('warning');
    });

    // Should display warning indicator
    expect(screen.getByTestId('timer-warning')).toBeInTheDocument();
    expect(screen.getByText('0:09')).toBeInTheDocument();
  });

  test('shows critical state when time is very low', async () => {
    render(
      <GameTimer
        duration={8}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
        warningThreshold={5}
        criticalThreshold={3}
      />
    );

    const timer = screen.getByTestId('game-timer');

    // Advance to critical threshold
    act(() => {
      jest.advanceTimersByTime(6000); // 2 seconds remaining
    });

    await waitFor(() => {
      expect(timer).toHaveClass('critical');
    });

    // Should display critical indicator
    expect(screen.getByTestId('timer-critical')).toBeInTheDocument();
    expect(screen.getByText('0:02')).toBeInTheDocument();
  });

  test('pauses and resumes correctly', async () => {
    const { rerender } = render(
      <GameTimer
        duration={10}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Advance timer by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('0:08')).toBeInTheDocument();
    });

    // Pause the timer
    rerender(
      <GameTimer
        duration={10}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={false}
      />
    );

    // Advance timer while paused
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    // Time should not have changed while paused
    expect(screen.getByText('0:08')).toBeInTheDocument();

    // Resume the timer
    rerender(
      <GameTimer
        duration={10}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Advance timer after resume
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      expect(screen.getByText('0:06')).toBeInTheDocument();
    });
  });

  test('displays paused state correctly', () => {
    render(
      <GameTimer
        duration={30}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={false}
      />
    );

    const timer = screen.getByTestId('game-timer');
    expect(timer).toHaveClass('paused');

    // Should show pause indicator
    expect(screen.getByTestId('timer-paused')).toBeInTheDocument();
    expect(screen.getByText(/pausado/i)).toBeInTheDocument();
  });

  test('shows progress indicator', async () => {
    render(
      <GameTimer
        duration={10}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
        showProgress={true}
      />
    );

    const progressBar = screen.getByTestId('timer-progress');
    expect(progressBar).toBeInTheDocument();

    // Initial progress should be 100%
    expect(progressBar).toHaveStyle('width: 100%');

    // Advance timer by half the duration
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      // Progress should be approximately 50%
      expect(progressBar).toHaveStyle('width: 50%');
    });
  });

  test('handles different display modes', () => {
    const { rerender } = render(
      <GameTimer
        duration={90}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        displayMode="compact"
      />
    );

    // Compact mode should show different layout
    expect(screen.getByTestId('timer-compact')).toBeInTheDocument();

    rerender(
      <GameTimer
        duration={90}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        displayMode="full"
      />
    );

    // Full mode should show expanded layout
    expect(screen.getByTestId('timer-full')).toBeInTheDocument();
    expect(screen.getByText(/tiempo restante/i)).toBeInTheDocument();
  });

  test('provides tick callback with current time', async () => {
    render(
      <GameTimer
        duration={5}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Advance by 2 seconds
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(() => {
      // Should call onTick with remaining time
      expect(mockOnTick).toHaveBeenLastCalledWith(3);
    });
  });

  test('cleans up timer on unmount', () => {
    const { unmount } = render(
      <GameTimer
        duration={30}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Unmount component
    unmount();

    // Advance timer after unmount
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    // Callbacks should not be called after unmount
    expect(mockOnTick).toHaveBeenCalledTimes(1); // Only the first tick
    expect(mockOnTimeUp).not.toHaveBeenCalled();
  });

  test('has proper accessibility attributes', () => {
    render(
      <GameTimer
        duration={60}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    const timer = screen.getByTestId('game-timer');

    // Should have proper role and aria attributes
    expect(timer).toHaveAttribute('role', 'timer');
    expect(timer).toHaveAttribute('aria-label', expect.stringContaining('tiempo'));
    expect(timer).toHaveAttribute('aria-live', 'polite');

    // Timer display should be readable by screen readers
    const display = screen.getByTestId('timer-display');
    expect(display).toHaveAttribute('aria-label', expect.stringContaining('1:00'));
  });

  test('handles zero duration gracefully', () => {
    render(
      <GameTimer
        duration={0}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    // Should display 0:00
    expect(screen.getByText('0:00')).toBeInTheDocument();

    // Should immediately call onTimeUp
    expect(mockOnTimeUp).toHaveBeenCalledTimes(1);
  });

  test('handles very large durations', () => {
    render(
      <GameTimer
        duration={7200} // 2 hours
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
      />
    );

    // Should display correctly formatted time
    expect(screen.getByText('120:00')).toBeInTheDocument();
  });

  test('updates when duration prop changes', async () => {
    const { rerender } = render(
      <GameTimer
        duration={30}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Initial time
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Advance timer
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('0:25')).toBeInTheDocument();
    });

    // Change duration
    rerender(
      <GameTimer
        duration={60}
        onTimeUp={mockOnTimeUp}
        onTick={mockOnTick}
        isActive={true}
      />
    );

    // Should reset to new duration
    expect(screen.getByText('1:00')).toBeInTheDocument();
  });
});