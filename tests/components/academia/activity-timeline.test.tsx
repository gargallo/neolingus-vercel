import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ActivityTimeline } from '../../../components/dashboard/activity-timeline';
import { mockActivityData, createMockActivity, ActivityType } from './mock-data';
import { renderWithProviders, mockSupabaseClient } from './test-utils';

expect.extend(toHaveNoViolations);

// Mock Supabase client
vi.mock('../../../utils/supabase/client', () => ({
  createSupabaseClient: () => mockSupabaseClient,
}));

// Mock date formatting utilities
vi.mock('../../../utils/date-formatting', () => ({
  formatRelativeTime: (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  },
  formatDuration: (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }
}));

describe('ActivityTimeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering Tests', () => {
    it('displays activities in timeline format with proper chronological order', async () => {
      const activities = [
        createMockActivity({
          type: 'exam_completed',
          created_at: '2024-01-15T10:00:00Z',
          metadata: { score: 85, exam_name: 'Grammar Test' }
        }),
        createMockActivity({
          type: 'session_started',
          created_at: '2024-01-16T14:00:00Z',
          metadata: { lesson_name: 'Present Perfect' }
        }),
        createMockActivity({
          type: 'achievement_earned',
          created_at: '2024-01-14T09:00:00Z',
          metadata: { achievement_name: 'First Exam', badge_type: 'bronze' }
        })
      ];

      render(
        <ActivityTimeline
          activities={activities}
          maxItems={5}
          showTimestamps={true}
        />
      );

      // Should display activities in chronological order (newest first)
      const timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems).toHaveLength(3);

      // Verify order by checking dates or content
      expect(timelineItems[0]).toHaveTextContent('Present Perfect');
      expect(timelineItems[1]).toHaveTextContent('Grammar Test');
      expect(timelineItems[2]).toHaveTextContent('First Exam');
    });

    it('shows activity icons, titles, scores, dates, duration', async () => {
      const activity = createMockActivity({
        type: 'exam_completed',
        created_at: '2024-01-15T10:00:00Z',
        metadata: {
          score: 92,
          exam_name: 'Advanced Grammar',
          duration_seconds: 1800 // 30 minutes
        }
      });

      render(<ActivityTimeline activities={[activity]} />);

      // Check for activity icon
      expect(screen.getByLabelText(/exam completed/i)).toBeInTheDocument();

      // Check for title
      expect(screen.getByText('Advanced Grammar')).toBeInTheDocument();

      // Check for score badge
      expect(screen.getByText('92%')).toBeInTheDocument();

      // Check for formatted date
      expect(screen.getByText(/ago/)).toBeInTheDocument();

      // Check for duration
      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('renders empty state when no activities', () => {
      render(<ActivityTimeline activities={[]} />);

      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
      expect(screen.getByText(/start learning to see your progress/i)).toBeInTheDocument();

      // Should show empty state illustration or icon
      expect(screen.getByLabelText(/empty timeline/i)).toBeInTheDocument();
    });

    it('displays "Show more" functionality when activities > maxItems', () => {
      const activities = Array.from({ length: 8 }, (_, index) =>
        createMockActivity({
          type: 'session_started',
          created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { lesson_name: `Lesson ${index + 1}` }
        })
      );

      render(<ActivityTimeline activities={activities} maxItems={5} />);

      // Should show only 5 items initially
      const timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems).toHaveLength(5);

      // Should show "Show more" button
      const showMoreButton = screen.getByRole('button', { name: /show more/i });
      expect(showMoreButton).toBeInTheDocument();
      expect(showMoreButton).toHaveTextContent('Show 3 more');
    });

    it('expands to show all activities when "Show more" is clicked', async () => {
      const activities = Array.from({ length: 8 }, (_, index) =>
        createMockActivity({
          type: 'session_started',
          created_at: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { lesson_name: `Lesson ${index + 1}` }
        })
      );

      render(<ActivityTimeline activities={activities} maxItems={5} />);

      const showMoreButton = screen.getByRole('button', { name: /show more/i });
      fireEvent.click(showMoreButton);

      await waitFor(() => {
        const timelineItems = screen.getAllByRole('listitem');
        expect(timelineItems).toHaveLength(8);
      });

      // Show more button should be replaced with "Show less"
      expect(screen.getByRole('button', { name: /show less/i })).toBeInTheDocument();
    });
  });

  describe('Data Processing Tests', () => {
    it('sorts activities by date (newest first)', () => {
      const activities = [
        createMockActivity({
          type: 'exam_completed',
          created_at: '2024-01-10T10:00:00Z',
          metadata: { exam_name: 'Old Exam' }
        }),
        createMockActivity({
          type: 'session_started',
          created_at: '2024-01-15T14:00:00Z',
          metadata: { lesson_name: 'Recent Lesson' }
        }),
        createMockActivity({
          type: 'achievement_earned',
          created_at: '2024-01-12T09:00:00Z',
          metadata: { achievement_name: 'Middle Achievement' }
        })
      ];

      render(<ActivityTimeline activities={activities} />);

      const timelineItems = screen.getAllByRole('listitem');

      // Should be sorted newest first
      expect(timelineItems[0]).toHaveTextContent('Recent Lesson');
      expect(timelineItems[1]).toHaveTextContent('Middle Achievement');
      expect(timelineItems[2]).toHaveTextContent('Old Exam');
    });

    it('limits display to maxItems (default: 5)', () => {
      const activities = Array.from({ length: 10 }, (_, index) =>
        createMockActivity({
          type: 'session_started',
          metadata: { lesson_name: `Lesson ${index + 1}` }
        })
      );

      // Test with default maxItems (should be 5)
      render(<ActivityTimeline activities={activities} />);

      let timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems).toHaveLength(5);

      // Test with custom maxItems
      render(<ActivityTimeline activities={activities} maxItems={3} />);

      timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems).toHaveLength(3);
    });

    it('formats dates and durations correctly', () => {
      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      const activity = createMockActivity({
        type: 'exam_completed',
        created_at: twoHoursAgo.toISOString(),
        metadata: {
          exam_name: 'Test Exam',
          duration_seconds: 3665 // 1h 1m 5s
        }
      });

      render(<ActivityTimeline activities={[activity]} showTimestamps={true} />);

      // Check relative time formatting
      expect(screen.getByText('2h ago')).toBeInTheDocument();

      // Check duration formatting (should round to nearest minute)
      expect(screen.getByText('1h 1m')).toBeInTheDocument();
    });

    it('handles different activity types with correct formatting', () => {
      const activities = [
        createMockActivity({
          type: 'exam_completed',
          metadata: {
            score: 88,
            exam_name: 'Grammar Test',
            duration_seconds: 1200
          }
        }),
        createMockActivity({
          type: 'session_started',
          metadata: {
            lesson_name: 'Vocabulary Lesson',
            course_name: 'English B2'
          }
        }),
        createMockActivity({
          type: 'achievement_earned',
          metadata: {
            achievement_name: 'Perfect Score',
            badge_type: 'gold',
            description: 'Scored 100% on an exam'
          }
        })
      ];

      render(<ActivityTimeline activities={activities} />);

      // Exam completed should show score and duration
      expect(screen.getByText('88%')).toBeInTheDocument();
      expect(screen.getByText('20m')).toBeInTheDocument();

      // Session started should show course info
      expect(screen.getByText('English B2')).toBeInTheDocument();

      // Achievement should show badge type
      expect(screen.getByText('Perfect Score')).toBeInTheDocument();
      expect(screen.getByLabelText(/gold badge/i)).toBeInTheDocument();
    });
  });

  describe('Visual Tests', () => {
    it('renders timeline layout with connecting lines', () => {
      const activities = Array.from({ length: 3 }, (_, index) =>
        createMockActivity({
          type: 'session_started',
          metadata: { lesson_name: `Lesson ${index + 1}` }
        })
      );

      render(<ActivityTimeline activities={activities} />);

      // Check for timeline container
      expect(screen.getByRole('list')).toHaveClass('timeline');

      // Check for timeline connector lines (should be decorative elements)
      const connectors = screen.getAllByLabelText(/timeline connector/i);
      expect(connectors).toHaveLength(2); // n-1 connectors for n items
    });

    it('displays activity type icons and colors correctly', () => {
      const activities = [
        createMockActivity({
          type: 'exam_completed',
          metadata: { exam_name: 'Test' }
        }),
        createMockActivity({
          type: 'session_started',
          metadata: { lesson_name: 'Lesson' }
        }),
        createMockActivity({
          type: 'achievement_earned',
          metadata: { achievement_name: 'Badge' }
        })
      ];

      render(<ActivityTimeline activities={activities} />);

      // Check for different activity type icons
      expect(screen.getByLabelText(/exam completed/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/session started/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/achievement earned/i)).toBeInTheDocument();

      // Check for appropriate color classes or styles
      const examIcon = screen.getByLabelText(/exam completed/i);
      expect(examIcon).toHaveClass('text-green-600'); // Success color for completed exams

      const sessionIcon = screen.getByLabelText(/session started/i);
      expect(sessionIcon).toHaveClass('text-blue-600'); // Info color for sessions

      const achievementIcon = screen.getByLabelText(/achievement earned/i);
      expect(achievementIcon).toHaveClass('text-yellow-600'); // Warning/badge color
    });

    it('shows score badges and metadata display', () => {
      const activity = createMockActivity({
        type: 'exam_completed',
        metadata: {
          score: 95,
          exam_name: 'Final Test',
          total_questions: 50,
          correct_answers: 47
        }
      });

      render(<ActivityTimeline activities={[activity]} />);

      // Score badge
      const scoreBadge = screen.getByText('95%');
      expect(scoreBadge).toHaveClass('badge', 'badge-success');

      // Metadata display
      expect(screen.getByText('47/50 correct')).toBeInTheDocument();
    });

    it('displays loading states with skeleton placeholders', () => {
      render(<ActivityTimeline activities={[]} isLoading={true} />);

      // Should show skeleton placeholders
      const skeletons = screen.getAllByLabelText(/loading activity/i);
      expect(skeletons).toHaveLength(3); // Default skeleton count

      // Each skeleton should have animated loading class
      skeletons.forEach(skeleton => {
        expect(skeleton).toHaveClass('animate-pulse');
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper timeline semantics and ARIA labels', async () => {
      const activities = [
        createMockActivity({
          type: 'exam_completed',
          metadata: { exam_name: 'Grammar Test', score: 85 }
        })
      ];

      const { container } = render(<ActivityTimeline activities={activities} />);

      // Timeline should be a list with proper role
      const timeline = screen.getByRole('list');
      expect(timeline).toHaveAttribute('aria-label', 'Activity timeline');

      // Each activity should be a listitem with descriptive label
      const activity = screen.getByRole('listitem');
      expect(activity).toHaveAttribute('aria-label', expect.stringContaining('Exam completed'));

      // Icons should have accessible labels
      const icon = screen.getByLabelText(/exam completed/i);
      expect(icon).toHaveAttribute('aria-hidden', 'false');

      // Check for no accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('supports keyboard navigation through activities', () => {
      const activities = Array.from({ length: 3 }, (_, index) =>
        createMockActivity({
          type: 'session_started',
          metadata: { lesson_name: `Lesson ${index + 1}` }
        })
      );

      render(<ActivityTimeline activities={activities} />);

      const timelineItems = screen.getAllByRole('listitem');

      // Each timeline item should be keyboard accessible
      timelineItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0');
      });

      // Should support arrow key navigation
      timelineItems[0].focus();
      expect(timelineItems[0]).toHaveFocus();

      fireEvent.keyDown(timelineItems[0], { key: 'ArrowDown' });
      expect(timelineItems[1]).toHaveFocus();

      fireEvent.keyDown(timelineItems[1], { key: 'ArrowUp' });
      expect(timelineItems[0]).toHaveFocus();
    });

    it('provides screen reader announcements for activity details', () => {
      const activity = createMockActivity({
        type: 'exam_completed',
        created_at: '2024-01-15T10:00:00Z',
        metadata: {
          exam_name: 'Advanced Grammar',
          score: 92,
          duration_seconds: 1800
        }
      });

      render(<ActivityTimeline activities={[activity]} />);

      // Activity should have comprehensive screen reader description
      const activityItem = screen.getByRole('listitem');
      const description = activityItem.getAttribute('aria-describedby');

      if (description) {
        const descriptionElement = document.getElementById(description);
        expect(descriptionElement).toHaveTextContent(
          expect.stringMatching(/exam completed.*advanced grammar.*92%.*30 minutes/i)
        );
      }
    });

    it('manages focus for interactive elements', async () => {
      const activities = Array.from({ length: 8 }, (_, index) =>
        createMockActivity({
          type: 'session_started',
          metadata: { lesson_name: `Lesson ${index + 1}` }
        })
      );

      render(<ActivityTimeline activities={activities} maxItems={5} />);

      const showMoreButton = screen.getByRole('button', { name: /show more/i });

      // Focus should move appropriately when expanding
      showMoreButton.focus();
      expect(showMoreButton).toHaveFocus();

      fireEvent.click(showMoreButton);

      await waitFor(() => {
        // Focus should remain on the now "Show less" button
        const showLessButton = screen.getByRole('button', { name: /show less/i });
        expect(showLessButton).toHaveFocus();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty activities array gracefully', () => {
      render(<ActivityTimeline activities={[]} />);

      // Should not crash and show appropriate empty state
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();
      expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    });

    it('handles activities with missing data fields', () => {
      const incompleteActivities = [
        {
          id: '1',
          user_id: 'user1',
          type: 'exam_completed' as ActivityType,
          created_at: '2024-01-15T10:00:00Z',
          metadata: {} // Missing expected fields
        },
        {
          id: '2',
          user_id: 'user1',
          type: 'session_started' as ActivityType,
          created_at: '2024-01-14T10:00:00Z',
          metadata: null as any // Null metadata
        }
      ];

      render(<ActivityTimeline activities={incompleteActivities} />);

      // Should still render without crashing
      const timelineItems = screen.getAllByRole('listitem');
      expect(timelineItems).toHaveLength(2);

      // Should show fallback content for missing data
      expect(screen.getByText(/exam completed/i)).toBeInTheDocument();
      expect(screen.getByText(/session started/i)).toBeInTheDocument();
    });

    it('handles very long activity titles and descriptions', () => {
      const longTitleActivity = createMockActivity({
        type: 'exam_completed',
        metadata: {
          exam_name: 'This is an extremely long exam title that should be truncated properly to maintain layout integrity and user experience',
          description: 'This is a very long description that contains a lot of detail about the exam completion including scores, timing, and other metadata that might overflow the container'
        }
      });

      render(<ActivityTimeline activities={[longTitleActivity]} />);

      const activityItem = screen.getByRole('listitem');

      // Long content should be properly contained
      expect(activityItem).toHaveClass('break-words'); // or similar overflow handling

      // Title should be truncated with ellipsis
      const titleElement = screen.getByText(/this is an extremely long exam title/i);
      expect(titleElement).toHaveClass('truncate');
    });

    it('handles activities with null scores or durations', () => {
      const activitiesWithNulls = [
        createMockActivity({
          type: 'exam_completed',
          metadata: {
            exam_name: 'Incomplete Exam',
            score: null,
            duration_seconds: null
          }
        }),
        createMockActivity({
          type: 'session_started',
          metadata: {
            lesson_name: 'Interrupted Session',
            duration_seconds: undefined
          }
        })
      ];

      render(<ActivityTimeline activities={activitiesWithNulls} />);

      // Should render without scores/durations
      expect(screen.getByText('Incomplete Exam')).toBeInTheDocument();
      expect(screen.getByText('Interrupted Session')).toBeInTheDocument();

      // Should not show null/undefined values
      expect(screen.queryByText('null%')).not.toBeInTheDocument();
      expect(screen.queryByText('undefined')).not.toBeInTheDocument();
    });

    it('handles invalid date formats gracefully', () => {
      const invalidDateActivity = createMockActivity({
        type: 'session_started',
        created_at: 'invalid-date-string',
        metadata: { lesson_name: 'Test Lesson' }
      });

      render(<ActivityTimeline activities={[invalidDateActivity]} />);

      // Should still render the activity
      expect(screen.getByText('Test Lesson')).toBeInTheDocument();

      // Should show fallback for invalid date
      expect(screen.getByText(/unknown time/i)).toBeInTheDocument();
    });

    it('handles real-time updates to activities list', async () => {
      const { rerender } = render(<ActivityTimeline activities={[]} />);

      // Start with empty list
      expect(screen.getByText(/no recent activity/i)).toBeInTheDocument();

      // Add an activity
      const newActivity = createMockActivity({
        type: 'exam_completed',
        metadata: { exam_name: 'New Exam', score: 95 }
      });

      rerender(<ActivityTimeline activities={[newActivity]} />);

      await waitFor(() => {
        expect(screen.getByText('New Exam')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
      });

      // Should handle smooth transitions
      expect(screen.queryByText(/no recent activity/i)).not.toBeInTheDocument();
    });
  });
});