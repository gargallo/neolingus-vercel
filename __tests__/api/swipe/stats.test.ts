/**
 * Contract Test: GET /api/swipe/stats/user
 *
 * Tests the user statistics endpoint that provides aggregated
 * performance analytics and learning insights.
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoint implementation will be created in Phase 3.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/swipe/stats/user/route';
import { UserStats } from '@/lib/types/swipe-game';

describe('GET /api/swipe/stats/user', () => {
  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should return user stats for 7-day span', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('span', '7d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      total_sessions: expect.any(Number),
      total_answers: expect.any(Number),
      overall_accuracy: expect.any(Number),
      accuracy_by_tag: expect.any(Object),
      false_positives: expect.any(Number),
      false_negatives: expect.any(Number),
      items_per_min_by_duration: expect.any(Object),
      streak_stats: expect.objectContaining({
        current: expect.any(Number),
        max: expect.any(Number),
        average: expect.any(Number)
      }),
      improvement_trend: expect.objectContaining({
        accuracy_change: expect.any(Number),
        speed_change: expect.any(Number)
      })
    });

    // Validate constraints
    expect(data.total_sessions).toBeGreaterThanOrEqual(0);
    expect(data.total_answers).toBeGreaterThanOrEqual(0);
    expect(data.overall_accuracy).toBeGreaterThanOrEqual(0);
    expect(data.overall_accuracy).toBeLessThanOrEqual(100);
    expect(data.false_positives).toBeGreaterThanOrEqual(0);
    expect(data.false_negatives).toBeGreaterThanOrEqual(0);
  });

  test('should return user stats for 30-day span', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('span', '30d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      total_sessions: expect.any(Number),
      total_answers: expect.any(Number),
      overall_accuracy: expect.any(Number),
      accuracy_by_tag: expect.any(Object),
      false_positives: expect.any(Number),
      false_negatives: expect.any(Number),
      items_per_min_by_duration: expect.any(Object),
      streak_stats: expect.objectContaining({
        current: expect.any(Number),
        max: expect.any(Number),
        average: expect.any(Number)
      }),
      improvement_trend: expect.objectContaining({
        accuracy_change: expect.any(Number),
        speed_change: expect.any(Number)
      })
    });
  });

  test('should return 400 for missing user_id', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('span', '7d');
    // Missing user_id

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining('user_id')
    });
  });

  test('should return 400 for invalid span', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('span', 'invalid');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/span|7d|30d/i)
    });
  });

  test('should return 401 for unauthenticated requests', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('span', '7d');

    const request = new NextRequest(url, {
      method: 'GET'
      // No Authorization header
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/unauthorized|authentication/i)
    });
  });

  test('should validate accuracy_by_tag structure', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-with-tags');
    url.searchParams.set('span', '7d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);

    // Validate accuracy_by_tag structure
    const accuracyByTag = data.accuracy_by_tag;
    expect(accuracyByTag).toEqual(expect.any(Object));

    // If there are entries, validate their format
    for (const [tag, accuracy] of Object.entries(accuracyByTag)) {
      expect(tag).toEqual(expect.any(String));
      expect(accuracy).toEqual(expect.any(Number));
      expect(accuracy).toBeGreaterThanOrEqual(0);
      expect(accuracy).toBeLessThanOrEqual(100);
    }
  });

  test('should validate items_per_min_by_duration structure', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-with-sessions');
    url.searchParams.set('span', '30d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);

    // Validate items_per_min_by_duration structure
    const itemsPerMinByDuration = data.items_per_min_by_duration;
    expect(itemsPerMinByDuration).toEqual(expect.any(Object));

    // Valid session durations: 20, 30, 60, 120
    const validDurations = [20, 30, 60, 120];
    for (const [duration, itemsPerMin] of Object.entries(itemsPerMinByDuration)) {
      const durationNum = parseInt(duration);
      expect(validDurations).toContain(durationNum);
      expect(itemsPerMin).toEqual(expect.any(Number));
      expect(itemsPerMin).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle user with no activity', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'new-user-no-activity');
    url.searchParams.set('span', '7d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      total_sessions: 0,
      total_answers: 0,
      overall_accuracy: 0,
      accuracy_by_tag: {},
      false_positives: 0,
      false_negatives: 0,
      items_per_min_by_duration: {},
      streak_stats: {
        current: 0,
        max: 0,
        average: 0
      },
      improvement_trend: {
        accuracy_change: 0,
        speed_change: 0
      }
    });
  });

  test('should validate streak_stats values', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-with-streaks');
    url.searchParams.set('span', '30d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);

    const streakStats = data.streak_stats;
    expect(streakStats.current).toBeGreaterThanOrEqual(0);
    expect(streakStats.max).toBeGreaterThanOrEqual(0);
    expect(streakStats.average).toBeGreaterThanOrEqual(0);

    // Logical constraints
    expect(streakStats.current).toBeLessThanOrEqual(streakStats.max);
    expect(streakStats.average).toBeLessThanOrEqual(streakStats.max);
  });

  test('should validate improvement_trend values', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-with-trends');
    url.searchParams.set('span', '30d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);

    const improvementTrend = data.improvement_trend;
    expect(improvementTrend.accuracy_change).toEqual(expect.any(Number));
    expect(improvementTrend.speed_change).toEqual(expect.any(Number));

    // Improvement trends can be positive, negative, or zero
    expect(Math.abs(improvementTrend.accuracy_change)).toBeLessThanOrEqual(100);
    expect(Math.abs(improvementTrend.speed_change)).toBeLessThanOrEqual(1000); // Reasonable speed change limit
  });

  test('should handle large datasets efficiently', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'power-user-many-sessions');
    url.searchParams.set('span', '30d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    const startTime = Date.now();

    // Act
    const response = await GET(request);
    const data = await response.json();

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Assert
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds

    // Validate that large datasets are properly aggregated
    expect(data.total_sessions).toEqual(expect.any(Number));
    expect(data.total_answers).toEqual(expect.any(Number));
  });

  test('should return 403 for unauthorized user access', async () => {
    // Arrange - trying to access another user's stats
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'other-user-123');
    url.searchParams.set('span', '7d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token-different-user'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(403);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/forbidden|access denied/i)
    });
  });

  test('should include proper response headers', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('span', '7d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);

    // Assert
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.status).toBe(200);
  });

  test('should validate false positive/negative counts', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/stats/user');
    url.searchParams.set('user_id', 'user-with-errors');
    url.searchParams.set('span', '30d');

    const request = new NextRequest(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer mock-jwt-token'
      }
    });

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);

    // False positives and negatives should be reasonable
    expect(data.false_positives).toBeGreaterThanOrEqual(0);
    expect(data.false_negatives).toBeGreaterThanOrEqual(0);

    // They shouldn't exceed total answers
    const totalErrors = data.false_positives + data.false_negatives;
    expect(totalErrors).toBeLessThanOrEqual(data.total_answers);
  });
});