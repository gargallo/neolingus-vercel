/**
 * Component Test: SwipeCard UI Component
 *
 * Tests the main swipe card component that displays language items
 * and handles user interactions (swipe gestures, keyboard input):
 * 1. Basic rendering and display
 * 2. Swipe gesture handling
 * 3. Keyboard shortcuts
 * 4. Accessibility features
 * 5. Feedback display
 * 6. Loading and error states
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The SwipeCard component will be implemented in Phase 3.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { SwipeCard } from '@/components/swipe/swipe-card';

const mockSwipeItem = {
  id: 'test-item-1',
  term: 'utilizar correctamente',
  example: 'Es importante utilizar correctamente las normas gramaticales.',
  difficulty_elo: 1550,
  tags: ['grammar', 'verbs']
};

describe('SwipeCard Component', () => {
  let mockOnSwipe: jest.MockedFunction<any>;
  const user = userEvent.setup();

  beforeEach(() => {
    mockOnSwipe = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders item information correctly', () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    // Should display the term
    expect(screen.getByText('utilizar correctamente')).toBeInTheDocument();

    // Should display the example if provided
    expect(screen.getByText(/Es importante utilizar correctamente/)).toBeInTheDocument();

    // Should show difficulty indicator
    expect(screen.getByTestId('difficulty-indicator')).toBeInTheDocument();

    // Should display tags
    expect(screen.getByText('grammar')).toBeInTheDocument();
    expect(screen.getByText('verbs')).toBeInTheDocument();
  });

  test('renders without example gracefully', () => {
    const itemWithoutExample = {
      ...mockSwipeItem,
      example: undefined
    };

    render(
      <SwipeCard
        item={itemWithoutExample}
        onSwipe={mockOnSwipe}
      />
    );

    expect(screen.getByText('utilizar correctamente')).toBeInTheDocument();
    expect(screen.queryByTestId('example-text')).not.toBeInTheDocument();
  });

  test('handles swipe left (no_apta) interaction', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Simulate swipe left gesture
    fireEvent.touchStart(card, {
      touches: [{ clientX: 200, clientY: 100 }]
    });

    fireEvent.touchMove(card, {
      touches: [{ clientX: 50, clientY: 100 }]
    });

    fireEvent.touchEnd(card, {
      changedTouches: [{ clientX: 50, clientY: 100 }]
    });

    await waitFor(() => {
      expect(mockOnSwipe).toHaveBeenCalledWith('no_apta');
    });
  });

  test('handles swipe right (apta) interaction', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Simulate swipe right gesture
    fireEvent.touchStart(card, {
      touches: [{ clientX: 50, clientY: 100 }]
    });

    fireEvent.touchMove(card, {
      touches: [{ clientX: 200, clientY: 100 }]
    });

    fireEvent.touchEnd(card, {
      changedTouches: [{ clientX: 200, clientY: 100 }]
    });

    await waitFor(() => {
      expect(mockOnSwipe).toHaveBeenCalledWith('apta');
    });
  });

  test('handles keyboard shortcuts', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');
    card.focus();

    // Test arrow key shortcuts
    await user.keyboard('{ArrowLeft}');
    expect(mockOnSwipe).toHaveBeenCalledWith('no_apta');

    await user.keyboard('{ArrowRight}');
    expect(mockOnSwipe).toHaveBeenCalledWith('apta');

    // Test letter shortcuts
    await user.keyboard('a');
    expect(mockOnSwipe).toHaveBeenCalledWith('apta');

    await user.keyboard('n');
    expect(mockOnSwipe).toHaveBeenCalledWith('no_apta');
  });

  test('shows feedback when enabled', () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
        showFeedback={true}
        correctAnswer={true}
        explanation="This is correct because it follows formal grammar rules."
        suggested="Consider: 'emplear correctamente' as an alternative."
      />
    );

    // Should show feedback overlay
    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();

    // Should indicate correct answer
    expect(screen.getByTestId('feedback-correct')).toBeInTheDocument();
    expect(screen.getByText(/correcto/i)).toBeInTheDocument();

    // Should show explanation
    expect(screen.getByText(/follows formal grammar rules/)).toBeInTheDocument();

    // Should show suggestion
    expect(screen.getByText(/emplear correctamente/)).toBeInTheDocument();
  });

  test('shows incorrect feedback appropriately', () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
        showFeedback={true}
        correctAnswer={false}
        explanation="This is incorrect for formal exam contexts."
      />
    );

    // Should show feedback overlay
    expect(screen.getByTestId('feedback-overlay')).toBeInTheDocument();

    // Should indicate incorrect answer
    expect(screen.getByTestId('feedback-incorrect')).toBeInTheDocument();
    expect(screen.getByText(/incorrecto/i)).toBeInTheDocument();

    // Should show explanation
    expect(screen.getByText(/incorrect for formal exam contexts/)).toBeInTheDocument();
  });

  test('is disabled when specified', () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
        disabled={true}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Card should have disabled appearance
    expect(card).toHaveClass('disabled');

    // Interactions should not trigger callbacks
    fireEvent.click(card);
    expect(mockOnSwipe).not.toHaveBeenCalled();
  });

  test('has proper accessibility attributes', () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Should be focusable
    expect(card).toHaveAttribute('tabIndex', '0');

    // Should have role
    expect(card).toHaveAttribute('role', 'button');

    // Should have aria-label
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('utilizar correctamente'));

    // Should have keyboard instructions
    expect(screen.getByText(/Presiona flecha derecha/i)).toBeInTheDocument();
    expect(screen.getByText(/Presiona flecha izquierda/i)).toBeInTheDocument();
  });

  test('prevents short swipes from triggering actions', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Simulate very short swipe
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    fireEvent.touchMove(card, {
      touches: [{ clientX: 110, clientY: 100 }] // Only 10px movement
    });

    fireEvent.touchEnd(card, {
      changedTouches: [{ clientX: 110, clientY: 100 }]
    });

    // Should not trigger swipe action for short distance
    await waitFor(() => {
      expect(mockOnSwipe).not.toHaveBeenCalled();
    });
  });

  test('shows visual feedback during swipe', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Start swipe
    fireEvent.touchStart(card, {
      touches: [{ clientX: 100, clientY: 100 }]
    });

    // Move significantly right
    fireEvent.touchMove(card, {
      touches: [{ clientX: 150, clientY: 100 }]
    });

    // Should show visual feedback for right swipe
    expect(card).toHaveClass('swiping-right');

    // Move significantly left
    fireEvent.touchMove(card, {
      touches: [{ clientX: 50, clientY: 100 }]
    });

    // Should show visual feedback for left swipe
    expect(card).toHaveClass('swiping-left');
  });

  test('handles mouse interactions for desktop users', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const aptaButton = screen.getByTestId('apta-button');
    const noAptaButton = screen.getByTestId('no-apta-button');

    // Test button clicks
    await user.click(aptaButton);
    expect(mockOnSwipe).toHaveBeenCalledWith('apta');

    await user.click(noAptaButton);
    expect(mockOnSwipe).toHaveBeenCalledWith('no_apta');
  });

  test('displays difficulty indicator correctly', () => {
    const highDifficultyItem = {
      ...mockSwipeItem,
      difficulty_elo: 1800
    };

    const lowDifficultyItem = {
      ...mockSwipeItem,
      difficulty_elo: 1200
    };

    // Test high difficulty
    const { rerender } = render(
      <SwipeCard
        item={highDifficultyItem}
        onSwipe={mockOnSwipe}
      />
    );

    expect(screen.getByTestId('difficulty-high')).toBeInTheDocument();

    // Test low difficulty
    rerender(
      <SwipeCard
        item={lowDifficultyItem}
        onSwipe={mockOnSwipe}
      />
    );

    expect(screen.getByTestId('difficulty-low')).toBeInTheDocument();
  });

  test('handles rapid successive interactions', async () => {
    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');
    card.focus();

    // Rapid keyboard presses
    await user.keyboard('{ArrowRight}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowRight}');

    // Should only register the first interaction to prevent spam
    expect(mockOnSwipe).toHaveBeenCalledTimes(1);
    expect(mockOnSwipe).toHaveBeenCalledWith('apta');
  });

  test('cleans up event listeners on unmount', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    // Should add event listeners
    expect(addEventListenerSpy).toHaveBeenCalled();

    unmount();

    // Should remove event listeners
    expect(removeEventListenerSpy).toHaveBeenCalled();
  });

  test('respects reduced motion preferences', () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <SwipeCard
        item={mockSwipeItem}
        onSwipe={mockOnSwipe}
      />
    );

    const card = screen.getByTestId('swipe-card');

    // Should have reduced motion class
    expect(card).toHaveClass('reduced-motion');
  });
});