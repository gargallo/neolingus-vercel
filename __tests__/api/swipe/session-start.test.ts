/**
 * Contract Test: POST /api/swipe/session/start
 *
 * Tests the session start endpoint that creates a new game session
 * and returns session metadata including deck information.
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoint implementation will be created in Phase 3.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/swipe/session/start/route';
import { StartSessionRequest, StartSessionResponse } from '@/lib/types/swipe-game';

describe('POST /api/swipe/session/start', () => {
  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should create session with valid request', async () => {
    // Arrange
    const requestBody = {
      user_id: 'test-user-123',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      duration_s: 60
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      session_id: expect.any(String),
      deck_size: expect.any(Number),
      started_at: expect.any(String)
    });

    // Validate session_id format (UUID)
    expect(data.session_id).toMatch(/^[a-f0-9-]+$/);

    // Validate deck_size is reasonable
    expect(data.deck_size).toBeGreaterThan(0);
    expect(data.deck_size).toBeLessThanOrEqual(100);

    // Validate started_at is valid ISO timestamp
    expect(new Date(data.started_at)).toBeInstanceOf(Date);
    expect(new Date(data.started_at).getTime()).toBeGreaterThan(Date.now() - 5000); // Within 5 seconds
  });

  test('should return 400 for missing required fields', async () => {
    // Arrange - missing user_id
    const requestBody = {
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      duration_s: 60
      // Missing user_id
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      error: expect.stringContaining('user_id')
    });
  });

  test('should return 400 for invalid language', async () => {
    // Arrange
    const requestBody: Partial<StartSessionRequest> = {
      user_id: 'test-user-123',
      lang: 'invalid' as any,
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      duration_s: 60
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      error: expect.stringMatching(/lang|language/i)
    });
  });

  test('should return 400 for invalid level', async () => {
    // Arrange
    const requestBody: Partial<StartSessionRequest> = {
      user_id: 'test-user-123',
      lang: 'es',
      level: 'Z99' as any,
      exam: 'EOI',
      skill: 'W',
      duration_s: 60
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      error: expect.stringMatching(/level/i)
    });
  });

  test('should return 400 for invalid exam provider', async () => {
    // Arrange
    const requestBody: Partial<StartSessionRequest> = {
      user_id: 'test-user-123',
      lang: 'es',
      level: 'B2',
      exam: 'INVALID' as any,
      skill: 'W',
      duration_s: 60
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      error: expect.stringMatching(/exam/i)
    });
  });

  test('should return 400 for invalid skill', async () => {
    // Arrange
    const requestBody: Partial<StartSessionRequest> = {
      user_id: 'test-user-123',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'INVALID' as any,
      duration_s: 60
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      error: expect.stringMatching(/skill/i)
    });
  });

  test('should return 400 for invalid duration', async () => {
    // Arrange
    const requestBody: Partial<StartSessionRequest> = {
      user_id: 'test-user-123',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      duration_s: 999 as any // Invalid duration
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      error: expect.stringMatching(/duration/i)
    });
  });

  test('should return 401 for unauthenticated requests', async () => {
    // Arrange
    const requestBody = {
      user_id: 'test-user-123',
      lang: 'es',
      level: 'B2',
      exam: 'EOI',
      skill: 'W',
      duration_s: 60
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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

  test('should handle all valid duration options', async () => {
    // Test all valid duration values
    const validDurations = [20, 30, 60, 120];

    for (const duration of validDurations) {
      // Arrange
      const requestBody = {
        user_id: 'test-user-123',
        lang: 'val',
        level: 'C1',
        exam: 'JQCV',
        skill: 'R',
        duration_s: duration
      };

      const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
        session_id: expect.any(String),
        deck_size: expect.any(Number),
        started_at: expect.any(String)
      });
    }
  });

  test('should return 400 for malformed JSON', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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

  test('should validate all supported languages', async () => {
    const validLanguages = ['es', 'val', 'en'];

    for (const lang of validLanguages) {
      // Arrange
      const requestBody = {
        user_id: 'test-user-123',
        lang: lang as any,
        level: 'B1',
        exam: 'EOI',
        skill: 'Med',
        duration_s: 30
      };

      const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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
      expect(data.session_id).toBeDefined();
    }
  });

  test('should include proper response headers', async () => {
    // Arrange
    const requestBody = {
      user_id: 'test-user-123',
      lang: 'en',
      level: 'A1',
      exam: 'Cambridge',
      skill: 'S',
      duration_s: 120
    };

    const request = new NextRequest('http://localhost:3000/api/swipe/session/start', {
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