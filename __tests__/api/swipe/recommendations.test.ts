/**
 * Contract Test: GET /api/swipe/recommendations/next-pack
 *
 * Tests the recommendations endpoint that provides personalized
 * next practice pack suggestions and mini-writing prompts.
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoint implementation will be created in Phase 3.3
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/swipe/recommendations/next-pack/route';
import { RecommendationsResponse } from '@/lib/types/swipe-game';

describe('GET /api/swipe/recommendations/next-pack', () => {
  beforeEach(() => {
    // Reset any test state
  });

  afterEach(() => {
    // Cleanup after each test
  });

  test('should return recommendations for user with activity', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B2');
    url.searchParams.set('exam', 'EOI');
    url.searchParams.set('skill', 'W');

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
      items: expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          term: expect.any(String),
          difficulty_elo: expect.any(Number),
          tags: expect.any(Array)
        })
      ]),
      recommendation: expect.objectContaining({
        next_pack_tags: expect.any(Array),
        deadline_suggested_days: expect.any(Number),
        rationale: expect.any(String)
      }),
      estimated_difficulty: expect.any(Number)
    });

    // Validate recommendation structure
    expect(data.recommendation.next_pack_tags.length).toBeGreaterThan(0);
    expect(data.recommendation.deadline_suggested_days).toBeGreaterThan(0);
    expect(data.recommendation.deadline_suggested_days).toBeLessThanOrEqual(30);
    expect(data.recommendation.rationale.length).toBeGreaterThan(10);
    expect(data.estimated_difficulty).toBeGreaterThan(0);
  });

  test('should include mini-writing prompt when appropriate', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-writing-focus');
    url.searchParams.set('lang', 'val');
    url.searchParams.set('level', 'C1');
    url.searchParams.set('exam', 'JQCV');
    url.searchParams.set('skill', 'W'); // Writing skill

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
    expect(data.recommendation).toMatchObject({
      next_pack_tags: expect.any(Array),
      mini_writing_prompt: expect.any(String),
      deadline_suggested_days: expect.any(Number),
      rationale: expect.any(String)
    });

    // Validate mini-writing prompt
    expect(data.recommendation.mini_writing_prompt!.length).toBeGreaterThan(20);
    expect(data.recommendation.mini_writing_prompt).toMatch(/\w+/); // Contains words
  });

  test('should return 400 for missing required parameters', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B2');
    // Missing user_id, exam, skill

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
      error: expect.stringMatching(/user_id|exam|skill/i)
    });
  });

  test('should return 400 for invalid language', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('lang', 'invalid');
    url.searchParams.set('level', 'B2');
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
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data).toMatchObject({
      success: false,
      error: expect.stringMatching(/lang|language/i)
    });
  });

  test('should return 401 for unauthenticated requests', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-123');
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

  test('should adapt recommendations based on user performance', async () => {
    // Arrange - user with poor grammar performance
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-poor-grammar');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('level', 'B1');
    url.searchParams.set('exam', 'Cambridge');
    url.searchParams.set('skill', 'W');

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

    // Should recommend grammar-focused practice
    expect(data.recommendation.next_pack_tags).toContain('grammar');
    expect(data.recommendation.rationale).toMatch(/grammar|grammatical/i);

    // Should suggest longer practice period for weak areas
    expect(data.recommendation.deadline_suggested_days).toBeGreaterThanOrEqual(7);
  });

  test('should recommend advanced content for high performers', async () => {
    // Arrange - user with excellent performance
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-excellent-performer');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'C2');
    url.searchParams.set('exam', 'DELE');
    url.searchParams.set('skill', 'R');

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

    // Should recommend challenging content
    expect(data.estimated_difficulty).toBeGreaterThan(1600); // High ELO rating

    // Should suggest shorter practice periods for strong performers
    expect(data.recommendation.deadline_suggested_days).toBeLessThanOrEqual(7);

    // Should focus on advanced or specialized tags
    const advancedTags = ['academic', 'literary', 'formal', 'specialized'];
    const hasAdvancedTag = data.recommendation.next_pack_tags.some(tag =>
      advancedTags.some(advTag => tag.toLowerCase().includes(advTag))
    );
    expect(hasAdvancedTag).toBe(true);
  });

  test('should handle new users with no history', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'new-user-no-history');
    url.searchParams.set('lang', 'val');
    url.searchParams.set('level', 'A2');
    url.searchParams.set('exam', 'JQCV');
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

    // Should provide beginner-friendly recommendations
    expect(data.estimated_difficulty).toBeLessThan(1600); // Default or below-average difficulty
    expect(data.recommendation.deadline_suggested_days).toBeGreaterThanOrEqual(5);

    // Should include basic/fundamental tags
    const basicTags = ['basic', 'fundamental', 'vocabulary', 'common'];
    const hasBasicTag = data.recommendation.next_pack_tags.some(tag =>
      basicTags.some(basicTag => tag.toLowerCase().includes(basicTag))
    );
    expect(hasBasicTag).toBe(true);

    // Rationale should mention beginner focus
    expect(data.recommendation.rationale).toMatch(/beginner|start|basic|foundation/i);
  });

  test('should prioritize skill-specific content', async () => {
    // Test different skills
    const skills = ['W', 'R', 'Med', 'S'];

    for (const skill of skills) {
      // Arrange
      const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
      url.searchParams.set('user_id', `user-skill-${skill}`);
      url.searchParams.set('lang', 'es');
      url.searchParams.set('level', 'B2');
      url.searchParams.set('exam', 'EOI');
      url.searchParams.set('skill', skill);

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

      // Should mention skill-specific focus in rationale
      const skillNames = {
        'W': 'writing',
        'R': 'reading',
        'Med': 'mediation',
        'S': 'speaking'
      };

      expect(data.recommendation.rationale.toLowerCase()).toMatch(
        new RegExp(skillNames[skill as keyof typeof skillNames], 'i')
      );
    }
  });

  test('should validate items structure', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('lang', 'en');
    url.searchParams.set('level', 'C1');
    url.searchParams.set('exam', 'Cambridge');
    url.searchParams.set('skill', 'S');

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
    expect(data.items.length).toBeGreaterThan(0);
    expect(data.items.length).toBeLessThanOrEqual(50); // Reasonable pack size

    // Validate each item structure
    for (const item of data.items) {
      expect(item).toMatchObject({
        id: expect.any(String),
        term: expect.any(String),
        difficulty_elo: expect.any(Number),
        tags: expect.any(Array)
      });

      expect(item.id).toMatch(/^[a-f0-9-]+$/); // UUID format
      expect(item.term.length).toBeGreaterThan(0);
      expect(item.difficulty_elo).toBeGreaterThan(0);
      expect(Array.isArray(item.tags)).toBe(true);

      if (item.example) {
        expect(item.example).toEqual(expect.any(String));
        expect(item.example.length).toBeGreaterThan(0);
      }
    }
  });

  test('should return 403 for unauthorized user access', async () => {
    // Arrange - trying to get recommendations for another user
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'other-user-456');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B2');
    url.searchParams.set('exam', 'EOI');
    url.searchParams.set('skill', 'W');

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

  test('should handle all supported languages and exams', async () => {
    const testCases = [
      { lang: 'es', exam: 'EOI' },
      { lang: 'es', exam: 'DELE' },
      { lang: 'val', exam: 'JQCV' },
      { lang: 'en', exam: 'Cambridge' }
    ];

    for (const testCase of testCases) {
      // Arrange
      const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
      url.searchParams.set('user_id', `user-${testCase.lang}-${testCase.exam}`);
      url.searchParams.set('lang', testCase.lang);
      url.searchParams.set('level', 'B2');
      url.searchParams.set('exam', testCase.exam);
      url.searchParams.set('skill', 'W');

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
      expect(data.items.length).toBeGreaterThan(0);
      expect(data.recommendation.next_pack_tags.length).toBeGreaterThan(0);
    }
  });

  test('should include proper response headers', async () => {
    // Arrange
    const url = new URL('http://localhost:3000/api/swipe/recommendations/next-pack');
    url.searchParams.set('user_id', 'user-123');
    url.searchParams.set('lang', 'es');
    url.searchParams.set('level', 'B2');
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
    expect(response.status).toBe(200);
  });
});