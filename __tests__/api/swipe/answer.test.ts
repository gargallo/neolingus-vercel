/**
 * Contract Test: POST /api/swipe/answer
 *
 * Tests the answer submission endpoint that records user answers,
 * calculates scores, and updates ELO ratings.
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoint implementation will be created in Phase 3.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/swipe/answer/route';
import { SubmitAnswerRequest } from '@/lib/types/swipe-game';

describe('POST /api/swipe/answer', () => {
  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should record correct answer successfully', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-123',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar', 'formal'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:05Z',
      latency_ms: 5000,
      input_method: 'keyboard',
      item_difficulty: 1500,
      content_version: '1.0.0',
      app_version: '1.0.0',
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      success: true,
      answer_id: 'answer-123',
      score_delta: 1,
      new_session_score: expect.any(Number),
      elo_updates: expect.objectContaining({
        user_rating_change: expect.any(Number),
        item_rating_change: expect.any(Number)
      })
    });
  });

  test('should record incorrect answer with negative score', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-124',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-def',
      lang: 'val',
      level: 'C1',
      exam: 'JQCV',
      skill: 'R',
      tags: ['vocabulary', 'regional'],
      user_choice: 'no_apta',
      correct: false,
      score_delta: -1.33,
      shown_at: '2024-09-24T10:01:00Z',
      answered_at: '2024-09-24T10:01:03Z',
      latency_ms: 3000,
      input_method: 'touch',
      item_difficulty: 1600,
      content_version: '1.0.0',
      app_version: '1.0.0',
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      success: true,
      answer_id: 'answer-124',
      score_delta: -1.33,
      new_session_score: expect.any(Number),
      elo_updates: expect.objectContaining({
        user_rating_change: expect.any(Number),
        item_rating_change: expect.any(Number)
      })
    });
  });

  test('should return 400 for missing required fields', async () => {
    // Arrange - missing answer_id
    const requestBody = {
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:05Z',
      latency_ms: 5000,
      suspicious: false
      // Missing answer_id
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
      error: expect.stringContaining('answer_id')
    });
  });

  test('should return 400 for invalid user_choice', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-125',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar'],
      user_choice: 'invalid_choice', // Invalid choice
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:05Z',
      latency_ms: 5000,
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
      error: expect.stringMatching(/choice|apta/i)
    });
  });

  test('should return 400 for invalid score_delta range', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-126',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar'],
      user_choice: 'apta',
      correct: true,
      score_delta: 5, // Invalid score delta (outside -2 to 2 range)
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:05Z',
      latency_ms: 5000,
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
      error: expect.stringMatching(/score_delta|range/i)
    });
  });

  test('should return 400 for negative latency', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-127',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:05Z',
      latency_ms: -100, // Negative latency
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
      error: expect.stringMatching(/latency/i)
    });
  });

  test('should detect suspicious activity for very fast answers', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-128',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:00.100Z', // 100ms response time
      latency_ms: 100,
      input_method: 'keyboard',
      item_difficulty: 1500,
      content_version: '1.0.0',
      app_version: '1.0.0',
      suspicious: true // Should be marked as suspicious
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      success: true,
      answer_id: 'answer-128',
      suspicious_activity_detected: true,
      score_delta: 0 // Should not award points for suspicious activity
    });
  });

  test('should return 401 for unauthenticated requests', async () => {
    // Arrange
    const requestBody = {
      answer_id: 'answer-129',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      tags: ['grammar'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:05Z',
      latency_ms: 5000,
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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

  test('should validate all input methods', async () => {
    const validInputMethods = ['keyboard', 'mouse', 'touch'];

    for (const inputMethod of validInputMethods) {
      // Arrange
      const requestBody = {
        answer_id: `answer-${inputMethod}`,
        session_id: 'session-456',
        user_id: 'user-789',
        item_id: 'item-abc',
        lang: 'en',
        level: 'A1',
        exam: 'Cambridge',
        skill: 'S',
        tags: ['vocabulary'],
        user_choice: 'no_apta',
        correct: false,
        score_delta: -1.33,
        shown_at: '2024-09-24T10:00:00Z',
        answered_at: '2024-09-24T10:00:04Z',
        latency_ms: 4000,
        input_method: inputMethod as any,
        item_difficulty: 1400,
        content_version: '1.0.0',
        app_version: '1.0.0',
        suspicious: false
      };

      const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
    }
  });

  test('should handle answers without optional fields', async () => {
    // Arrange - minimum required fields only
    const requestBody = {
      answer_id: 'answer-minimal',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'val',
      level: 'B1',
      exam: 'JQCV',
      skill: 'Med',
      tags: ['syntax'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:03Z',
      latency_ms: 3000,
      suspicious: false
      // Optional fields omitted: input_method, item_difficulty, content_version, app_version
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
    expect(response.status).toBe(201);
    expect(data).toMatchObject({
      success: true,
      answer_id: 'answer-minimal'
    });
  });

  test('should return 400 for malformed JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
    const requestBody = {
      answer_id: 'answer-headers',
      session_id: 'session-456',
      user_id: 'user-789',
      item_id: 'item-abc',
      lang: 'es',
      level: 'C2',
      exam: 'DELE',
      skill: 'W',
      tags: ['academic'],
      user_choice: 'apta',
      correct: true,
      score_delta: 1,
      shown_at: '2024-09-24T10:00:00Z',
      answered_at: '2024-09-24T10:00:07Z',
      latency_ms: 7000,
      suspicious: false
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/answer', {
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
    expect(response.status).toBe(201);
  });
});