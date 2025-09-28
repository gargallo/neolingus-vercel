import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Achievements } from '@/components/academia/achievements';

// Mock Supabase client
vi.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  })
}));

describe('Simple Achievements Test', () => {
  it('renders without crashing with minimal props', () => {
    expect(() => {
      render(<Achievements userId="test-user" />);
    }).not.toThrow();
  });

  it('shows loading state', () => {
    render(<Achievements userId="test-user" isLoading={true} />);
    // Loading state shows skeleton elements
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<Achievements userId="test-user" error="Test error" />);
    expect(screen.getByText('Error loading achievements')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('handles empty achievements gracefully', () => {
    render(<Achievements userId="test-user" achievements={[]} />);
    // When no achievements are provided, it shows mock achievements instead
    expect(screen.getByText('First Steps')).toBeInTheDocument();
  });

  it('handles achievements with missing progress property', () => {
    const achievementWithoutProgress = {
      id: 'test-achievement',
      title: 'Test Achievement',
      description: 'A test achievement',
      type: 'bronze' as const
      // No progress property - this was causing the original runtime error
    };

    expect(() => {
      render(<Achievements userId="test-user" achievements={[achievementWithoutProgress]} />);
    }).not.toThrow();

    expect(screen.getByText('Test Achievement')).toBeInTheDocument();
  });

  it('handles achievements from API format with earned_at', () => {
    const apiAchievement = {
      id: 'api-achievement',
      title: 'API Achievement',
      description: 'From API',
      type: 'silver' as const,
      earned_at: '2024-01-15T10:30:00.000Z'
      // Missing other properties that should be normalized
    };

    expect(() => {
      render(<Achievements userId="test-user" achievements={[apiAchievement as any]} />);
    }).not.toThrow();

    expect(screen.getByText('API Achievement')).toBeInTheDocument();
  });
});