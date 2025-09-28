/**
 * Contract Test: GET /api/swipe/deck
 *
 * Tests the deck endpoint that provides a collection of swipe items
 * for a specific language, level, exam, and skill configuration.
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoint implementation will be created in Phase 3.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/swipe/deck/route';
import { DeckResponse } from '@/lib/types/swipe-game';

describe('GET /api/swipe/deck', () => {
  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should return deck for valid parameters', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B2');
    url.searchParams.set('exam', 'EOI');
    url.searchParams.set('skill', 'W');
    url.searchParams.set('size', '20');

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
      session_suggested_size: expect.any(Number),
      items: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          term: expect.any(String),
          difficulty_elo: expect.any(Number),
          tags: expect.any(Array)
        })
      ])
    });
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.length).toBeLessThanOrEqual(20);
    expect(data.session_suggested_size).toBeGreaterThan(0);
  });

  test('should return 400 for missing required parameters', async () => {
    // Arrange - missing required parameters
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'es');
    // Missing level, exam, skill

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
      error: expect.stringContaining('validation')
    });
  });

  test('should return 400 for invalid parameter values', async () => {
    // Arrange - invalid values
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'invalid');
    url.searchParams.set('level', 'Z99');
    url.searchParams.set('exam', 'INVALID');
    url.searchParams.set('skill', 'X');

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
      error: expect.any(String)
    });
  });

  test('should return 401 for unauthenticated requests', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B2');
    url.searchParams.set('exam', 'EOI');
    url.searchParams.set('skill', 'W');

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

  test('should respect size parameter within limits', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'val');
    url.searchParams.set('level', 'C1');
    url.searchParams.set('exam', 'JQCV');
    url.searchParams.set('skill', 'R');
    url.searchParams.set('size', '5');

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
    expect(data.items.length).toBeLessThanOrEqual(5);
  });

  test('should handle empty deck gracefully', async () => {
    // Arrange - parameters that might result in no items
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('level', 'C2');
    url.searchParams.set('exam', 'Cambridge');
    url.searchParams.set('skill', 'S');
    url.searchParams.set('size', '50');

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
      session_suggested_size: expect.any(Number),
      items: expect.any(Array)
    });
    // Should handle empty results gracefully
    expect(data.session_suggested_size).toBeGreaterThanOrEqual(0);
  });

  test('should validate item structure in response', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'A2');
    url.searchParams.set('exam', 'DELE');
    url.searchParams.set('skill', 'Med');

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

    if (data.items.length > 0) {
      const item = data.items[0];
      expect(item).toMatchObject({
        id: expect.any(String),
        term: expect.any(String),
        difficulty_elo: expect.any(Number),
        tags: expect.any(Array)
      });

      // Optional fields
      if (item.example) {
        expect(item.example).toEqual(expect.any(String));
      }

      // Validate constraints
      expect(item.difficulty_elo).toBeGreaterThan(0);
      expect(item.id).toMatch(/^[a-f0-9-]+$/); // UUID format
      expect(item.term.length).toBeGreaterThan(0);
    }
  });

  test('should return appropriate content-type header', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/deck');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B1');
    url.searchParams.set('exam', 'EOI');
    url.searchParams.set('skill', 'W');

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
  });
});