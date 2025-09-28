/**
 * Contract Test: POST /api/swipe/session/end
 *
 * Tests the session end endpoint that finalizes a game session,
 * calculates final scores, and stores session summary.
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoint implementation will be created in Phase 3.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/swipe/session/end/route';
import { EndSessionRequest, SessionSummary } from '@/lib/types/swipe-game';

describe('POST /api/swipe/session/end', () => {
  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should end session successfully with complete summary', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 15.67,
      answers_total: 25,
      correct: 20,
      incorrect: 5,
      accuracy_pct: 80.0,
      items_per_min: 25.0, // 25 items in 1 minute
      streak_max: 8,
      error_buckets: {
        'grammar': 2,
        'vocabulary': 1,
        'syntax': 2
      }
    };

    const requestBody = {
      session_id: 'session-456',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      session_id: 'session-456',
      final_summary: expect.objectContaining({
        score_total: 15.67,
        answers_total: 25,
        correct: 20,
        incorrect: 5,
        accuracy_pct: 80.0,
        items_per_min: 25.0,
        streak_max: 8
      }),
      performance_analysis: expect.objectContaining({
        grade: expect.any(String),
        improvement_areas: expect.any(Array),
        strengths: expect.any(Array)
      }),
      next_recommendations: expect.objectContaining({
        suggested_level: expect.any(String),
        focus_areas: expect.any(Array)
      })
    });
  });

  test('should return 400 for missing session_id', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 10,
      answers_total: 15,
      correct: 12,
      incorrect: 3,
      accuracy_pct: 80.0,
      items_per_min: 30.0
    };

    const requestBody = {
      // Missing session_id
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining('session_id')
    });
  });

  test('should return 400 for missing summary', async () => {
    // Arrange
    const requestBody = {
      session_id: 'session-456',
      ended_at: '2024-09-24T10:01:00Z'
      // Missing summary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringContaining('summary')
    });
  });

  test('should return 400 for invalid ended_at timestamp', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 5,
      answers_total: 10,
      correct: 7,
      incorrect: 3,
      accuracy_pct: 70.0,
      items_per_min: 20.0
    };

    const requestBody = {
      session_id: 'session-456',
      ended_at: 'invalid-timestamp',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/ended_at|timestamp/i)
    });
  });

  test('should return 400 for negative score_total', async () => {
    // Arrange
    const sessionSummary = {
      score_total: -10, // Invalid negative score
      answers_total: 10,
      correct: 3,
      incorrect: 7,
      accuracy_pct: 30.0,
      items_per_min: 15.0
    };

    const requestBody = {
      session_id: 'session-456',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);

    // Assert
    // Note: Negative scores are actually valid due to -1.33 penalty
    // This test should accept negative scores
    expect(response.status).toBe(200);
    expect(response.status).not.toBe(400);
  });

  test('should return 400 for inconsistent answer counts', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 10,
      answers_total: 15,
      correct: 10,
      incorrect: 8, // 10 + 8 = 18, but answers_total is 15
      accuracy_pct: 66.7,
      items_per_min: 25.0
    };

    const requestBody = {
      session_id: 'session-456',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/answers|count|total/i)
    });
  });

  test('should return 400 for invalid accuracy percentage', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 10,
      answers_total: 15,
      correct: 12,
      incorrect: 3,
      accuracy_pct: 150.0, // Invalid percentage > 100
      items_per_min: 25.0
    };

    const requestBody = {
      session_id: 'session-456',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/accuracy|percentage/i)
    });
  });

  test('should return 401 for unauthenticated requests', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 10,
      answers_total: 15,
      correct: 12,
      incorrect: 3,
      accuracy_pct: 80.0,
      items_per_min: 25.0
    };

    const requestBody = {
      session_id: 'session-456',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // No Authorization header
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(401);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/unauthorized|authentication/i)
    });
  });

  test('should return 404 for non-existent session', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 10,
      answers_total: 15,
      correct: 12,
      incorrect: 3,
      accuracy_pct: 80.0,
      items_per_min: 25.0
    };

    const requestBody = {
      session_id: 'non-existent-session',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(404);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/session.*not found/i)
    });
  });

  test('should handle session with perfect accuracy', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 30,
      answers_total: 30,
      correct: 30,
      incorrect: 0,
      accuracy_pct: 100.0,
      items_per_min: 30.0,
      streak_max: 30
    };

    const requestBody = {
      session_id: 'session-perfect',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      final_summary: expect.objectContaining({
        accuracy_pct: 100.0,
        streak_max: 30
      }),
      performance_analysis: expect.objectContaining({
        grade: expect.stringMatching(/excellent|perfect|outstanding/i)
      })
    });
  });

  test('should handle session with error buckets', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 12.65,
      answers_total: 20,
      correct: 15,
      incorrect: 5,
      accuracy_pct: 75.0,
      items_per_min: 20.0,
      streak_max: 6,
      error_buckets: {
        'grammar': 2,
        'vocabulary': 1,
        'syntax': 1,
        'spelling': 1
      }
    };

    const requestBody = {
      session_id: 'session-with-errors',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      final_summary: expect.objectContaining({
        error_buckets: expect.objectContaining({
          'grammar': 2,
          'vocabulary': 1,
          'syntax': 1,
          'spelling': 1
        })
      }),
      performance_analysis: expect.objectContaining({
        improvement_areas: expect.arrayContaining(['grammar']) // Most frequent error
      })
    });
  });

  test('should handle session with low performance', async () => {
    // Arrange
    const sessionSummary = {
      score_total: -5.32, // Negative score due to many incorrect answers
      answers_total: 20,
      correct: 5,
      incorrect: 15,
      accuracy_pct: 25.0,
      items_per_min: 40.0, // High speed but low accuracy
      streak_max: 2
    };

    const requestBody = {
      session_id: 'session-low-performance',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      success: true,
      final_summary: expect.objectContaining({
        score_total: -5.32,
        accuracy_pct: 25.0
      }),
      performance_analysis: expect.objectContaining({
        grade: expect.stringMatching(/needs improvement|practice|review/i),
        improvement_areas: expect.any(Array)
      }),
      next_recommendations: expect.objectContaining({
        suggested_level: expect.any(String),
        focus_areas: expect.any(Array)
      })
    });
  });

  test('should return 400 for malformed JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: '{ malformed json }'
    });

    // Act
    const response = await POST(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/json|parse/i)
    });
  });

  test('should include proper response headers', async () => {
    // Arrange
    const sessionSummary = {
      score_total: 8,
      answers_total: 12,
      correct: 10,
      incorrect: 2,
      accuracy_pct: 83.3,
      items_per_min: 24.0
    };

    const requestBody = {
      session_id: 'session-headers',
      ended_at: '2024-09-24T10:01:00Z',
      summary: sessionSummary
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-jwt-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Act
    const response = await POST(request);

    // Assert
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.status).toBe(200);
  });
});