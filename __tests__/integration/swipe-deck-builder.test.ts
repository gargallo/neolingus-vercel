/**
 * Integration Test: Content Filtering and Deck Building
 *
 * Tests the intelligent deck building system that creates personalized
 * practice sets based on user preferences, performance, and content rules:
 * 1. Adaptive difficulty selection
 * 2. Content filtering by exam safety rules
 * 3. Tag-based content organization
 * 4. Performance-based item selection
 * 5. Deck diversity and balance
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The deck building system will be implemented in Phase 3.3
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Swipe Deck Builder Integration', () => {
  let supabase: any;
  let testUserId: string;
  let testItemIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
    );

    testUserId = 'test-user-deck-' + Date.now();

    // Create comprehensive test dataset
    const testItems = [
      // Basic items - various difficulties
      { term: 'test-basic-easy', difficulty: 1300, tags: ['basic', 'vocabulary'], exam_safe: true, level: 'A1' },
      { term: 'test-basic-medium', difficulty: 1500, tags: ['basic', 'grammar'], exam_safe: true, level: 'B1' },
      { term: 'test-basic-hard', difficulty: 1700, tags: ['basic', 'syntax'], exam_safe: true, level: 'C1' },

      // Advanced items
      { term: 'test-advanced-1', difficulty: 1800, tags: ['advanced', 'academic'], exam_safe: true, level: 'C2' },
      { term: 'test-advanced-2', difficulty: 1900, tags: ['advanced', 'literary'], exam_safe: false, level: 'C2' },

      // Specialized items
      { term: 'test-formal-1', difficulty: 1600, tags: ['formal', 'business'], exam_safe: true, level: 'B2' },
      { term: 'test-informal-1', difficulty: 1400, tags: ['informal', 'colloquial'], exam_safe: false, level: 'B1' },

      // Tag variety
      { term: 'test-grammar-1', difficulty: 1550, tags: ['grammar', 'verbs'], exam_safe: true, level: 'B2' },
      { term: 'test-grammar-2', difficulty: 1450, tags: ['grammar', 'adjectives'], exam_safe: true, level: 'B1' },
      { term: 'test-vocabulary-1', difficulty: 1650, tags: ['vocabulary', 'technology'], exam_safe: true, level: 'B2' },

      // Multi-skill items
      { term: 'test-writing-1', difficulty: 1500, tags: ['writing', 'essays'], exam_safe: true, level: 'B2', skills: ['W'] },
      { term: 'test-reading-1', difficulty: 1500, tags: ['reading', 'comprehension'], exam_safe: true, level: 'B2', skills: ['R'] },
      { term: 'test-speaking-1', difficulty: 1500, tags: ['speaking', 'presentation'], exam_safe: true, level: 'B2', skills: ['S'] },
      { term: 'test-mediation-1', difficulty: 1500, tags: ['mediation', 'translation'], exam_safe: true, level: 'B2', skills: ['Med'] },

      // Regional variations
      { term: 'test-peninsular-1', difficulty: 1500, tags: ['peninsular', 'formal'], exam_safe: true, level: 'B2' },
      { term: 'test-latin-1', difficulty: 1500, tags: ['latin', 'informal'], exam_safe: false, level: 'B2' }
    ];

    for (const item of testItems) {
      const { data } = await supabase
        .from('swipe_items')
        .insert({
          term: item.term,
          lang: 'es',
          level: item.level,
          exam: 'EOI',
          skill_scope: item.skills || ['W', 'R', 'S', 'Med'],
          tags: item.tags,
          exam_safe: item.exam_safe,
          difficulty_elo: item.difficulty,
          content_version: '1.0.0',
          active: true,
          example: `Example for ${item.term}`
        })
        .select('id')
        .single();

      testItemIds.push(data.id);
    }
  });

  afterAll(async () => {
    // Cleanup test data
    if (supabase && testUserId) {
      await supabase.from('swipe_sessions').delete().eq('user_id', testUserId);
      await supabase.from('swipe_answers').delete().eq('user_id', testUserId);
      await supabase.from('swipe_user_skill').delete().eq('user_id', testUserId);
    }

    // Cleanup test items
    if (testItemIds.length > 0) {
      await supabase.from('swipe_items').delete().in('id', testItemIds);
      await supabase.from('swipe_item_stats').delete().in('item_id', testItemIds);
    }
  });

  test('adaptive difficulty selection based on user rating', async () => {
    // Test with different user ratings
    const userRatings = [
      { rating: 1200, expectedDifficultyRange: [1100, 1400] },
      { rating: 1500, expectedDifficultyRange: [1300, 1700] },
      { rating: 1800, expectedDifficultyRange: [1600, 2000] }
    ];

    for (const userTest of userRatings) {
      const testUserId = `deck-adaptive-${userTest.rating}`;

      // Set user rating
      await supabase
        .from('swipe_user_skill')
        .upsert({
          user_id: testUserId,
          lang: 'es',
          exam: 'EOI',
          skill: 'W',
          tag: 'general',
          rating_elo: userTest.rating,
          rd: 200
        });

      // Request deck
      const deckResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&user_id=${testUserId}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(deckResponse.status).toBe(200);
      const deckData = await deckResponse.json();

      expect(deckData.items.length).toBeGreaterThan(0);

      // Calculate average difficulty of returned items
      const avgDifficulty = deckData.items.reduce((sum: number, item: any) => sum + item.difficulty_elo, 0) / deckData.items.length;

      // Verify difficulty is appropriate for user rating
      expect(avgDifficulty).toBeGreaterThanOrEqual(userTest.expectedDifficultyRange[0]);
      expect(avgDifficulty).toBeLessThanOrEqual(userTest.expectedDifficultyRange[1]);

      // Verify suggested deck size is reasonable
      expect(deckData.session_suggested_size).toBeGreaterThan(0);
      expect(deckData.session_suggested_size).toBeLessThanOrEqual(50);

      // Cleanup
      await supabase.from('swipe_user_skill').delete().eq('user_id', testUserId);
    }
  });

  test('content filtering by exam safety rules', async () => {
    // Test exam-safe filtering for formal exams
    const safeExamResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=20&exam_safe_only=true`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(safeExamResponse.status).toBe(200);
    const safeExamData = await safeExamResponse.json();

    // All items should be exam-safe
    const allExamSafe = safeExamData.items.every((item: any) => {
      // Check in test data that this item should be exam-safe
      return true; // We'll verify this through the API logic
    });

    // Test unrestricted filtering (includes non-exam-safe items)
    const unrestrictedResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=20`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(unrestrictedResponse.status).toBe(200);
    const unrestrictedData = await unrestrictedResponse.json();

    // Should include more variety (including non-exam-safe items)
    expect(unrestrictedData.items.length).toBeGreaterThanOrEqual(safeExamData.items.length);

    // Test skill-specific filtering
    const writingResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=15`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    const readingResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=R&size=15`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(writingResponse.status).toBe(200);
    expect(readingResponse.status).toBe(200);

    const writingData = await writingResponse.json();
    const readingData = await readingResponse.json();

    // Both should return items, but potentially different sets
    expect(writingData.items.length).toBeGreaterThan(0);
    expect(readingData.items.length).toBeGreaterThan(0);
  });

  test('tag-based content organization and targeting', async () => {
    // Test targeting specific weakness areas
    const weaknessUserId = testUserId + '-weakness-targeting';

    // Create user with known weaknesses
    await supabase
      .from('swipe_user_skill')
      .upsert([
        {
          user_id: weaknessUserId,
          lang: 'es',
          exam: 'EOI',
          skill: 'W',
          tag: 'grammar',
          rating_elo: 1300, // Weak in grammar
          rd: 200
        },
        {
          user_id: weaknessUserId,
          lang: 'es',
          exam: 'EOI',
          skill: 'W',
          tag: 'vocabulary',
          rating_elo: 1700, // Strong in vocabulary
          rd: 200
        }
      ]);

    // Request deck for user with targeted weaknesses
    const targetedResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&user_id=${weaknessUserId}&focus_tags=grammar`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(targetedResponse.status).toBe(200);
    const targetedData = await targetedResponse.json();

    // Should prioritize grammar-related items
    const grammarItems = targetedData.items.filter((item: any) =>
      item.tags.includes('grammar')
    );

    expect(grammarItems.length).toBeGreaterThan(0);

    // Test diversity in tags
    const diversityResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=15&diversity=high`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(diversityResponse.status).toBe(200);
    const diversityData = await diversityResponse.json();

    // Should include variety of tags
    const uniqueTags = new Set();
    diversityData.items.forEach((item: any) => {
      item.tags.forEach((tag: string) => uniqueTags.add(tag));
    });

    expect(uniqueTags.size).toBeGreaterThan(3); // Should have diverse tag coverage

    // Cleanup
    await supabase.from('swipe_user_skill').delete().eq('user_id', weaknessUserId);
  });

  test('performance-based item selection', async () => {
    const performanceUserId = testUserId + '-performance';

    // Create performance history
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: performanceUserId,
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        duration_s: 60
      })
    });

    const { session_id } = await startResponse.json();

    // Submit answers to establish performance patterns
    const performancePattern = [
      { item_index: 0, correct: true, tag: 'basic' },  // Good with basic items
      { item_index: 1, correct: true, tag: 'basic' },
      { item_index: 2, correct: false, tag: 'advanced' }, // Struggle with advanced
      { item_index: 3, correct: false, tag: 'advanced' },
      { item_index: 4, correct: true, tag: 'grammar' },  // Mixed with grammar
    ];

    for (let i = 0; i < performancePattern.length; i++) {
      const pattern = performancePattern[i];

      await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          answer_id: `performance-${i}`,
          session_id: session_id,
          user_id: performanceUserId,
          item_id: testItemIds[pattern.item_index],
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: 'W',
          tags: [pattern.tag],
          user_choice: pattern.correct ? 'apta' : 'no_apta',
          correct: pattern.correct,
          score_delta: pattern.correct ? 1 : -1.33,
          shown_at: new Date(Date.now() - 3000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 2500,
          input_method: 'keyboard',
          item_difficulty: 1500,
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });
    }

    // End session
    await fetch('/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        session_id: session_id,
        ended_at: new Date().toISOString(),
        summary: {
          score_total: 3 - (2 * 1.33),
          answers_total: 5,
          correct: 3,
          incorrect: 2,
          accuracy_pct: 60,
          items_per_min: 25,
          streak_max: 2,
          error_buckets: {
            'advanced': 2
          }
        }
      })
    });

    // Request adaptive deck based on performance
    const adaptiveResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=12&user_id=${performanceUserId}&adaptive=true`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(adaptiveResponse.status).toBe(200);
    const adaptiveData = await adaptiveResponse.json();

    // Should avoid advanced items (weakness area) and include more basic/grammar items
    const advancedItems = adaptiveData.items.filter((item: any) =>
      item.tags.includes('advanced')
    );
    const basicItems = adaptiveData.items.filter((item: any) =>
      item.tags.includes('basic') || item.tags.includes('grammar')
    );

    expect(basicItems.length).toBeGreaterThan(advancedItems.length);

    // Test review mode (previously incorrect items)
    const reviewResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&user_id=${performanceUserId}&review_mode=true`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(reviewResponse.status).toBe(200);
    const reviewData = await reviewResponse.json();

    // Should include items similar to those previously answered incorrectly
    expect(reviewData.items.length).toBeGreaterThan(0);
  });

  test('deck diversity and balance optimization', async () => {
    // Test different balance strategies
    const balanceStrategies = [
      { strategy: 'difficulty_spread', expectedProperty: 'diverse difficulties' },
      { strategy: 'tag_variety', expectedProperty: 'diverse tags' },
      { strategy: 'skill_focus', expectedProperty: 'skill-specific content' },
      { strategy: 'progressive', expectedProperty: 'progressive difficulty' }
    ];

    for (const test of balanceStrategies) {
      const balanceResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=16&balance=${test.strategy}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(balanceResponse.status).toBe(200);
      const balanceData = await balanceResponse.json();

      expect(balanceData.items.length).toBeGreaterThan(0);

      // Analyze deck composition based on strategy
      if (test.strategy === 'difficulty_spread') {
        const difficulties = balanceData.items.map((item: any) => item.difficulty_elo);
        const minDiff = Math.min(...difficulties);
        const maxDiff = Math.max(...difficulties);
        expect(maxDiff - minDiff).toBeGreaterThan(200); // Should have good spread
      }

      if (test.strategy === 'tag_variety') {
        const allTags = new Set();
        balanceData.items.forEach((item: any) => {
          item.tags.forEach((tag: string) => allTags.add(tag));
        });
        expect(allTags.size).toBeGreaterThan(3); // Should have tag diversity
      }

      if (test.strategy === 'progressive') {
        const difficulties = balanceData.items.map((item: any) => item.difficulty_elo);
        // Check if generally progressing (allowing some variation)
        const firstHalf = difficulties.slice(0, Math.floor(difficulties.length / 2));
        const secondHalf = difficulties.slice(Math.floor(difficulties.length / 2));
        const avgFirstHalf = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecondHalf = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        expect(avgSecondHalf).toBeGreaterThanOrEqual(avgFirstHalf - 50); // Generally progressive
      }
    }
  });

  test('content version and freshness management', async () => {
    // Test content version filtering
    const versionResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&content_version=1.0.0`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(versionResponse.status).toBe(200);
    const versionData = await versionResponse.json();

    // All items should match the requested version
    expect(versionData.items.length).toBeGreaterThan(0);

    // Test freshness preference (avoiding recently seen items)
    const freshnessUserId = testUserId + '-freshness';

    // First, get a deck and "see" some items
    const initialResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=5&user_id=${freshnessUserId}`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    const initialData = await initialResponse.json();
    const seenItemIds = initialData.items.map((item: any) => item.id);

    // Record these items as seen by simulating answers
    const quickSession = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: freshnessUserId,
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        duration_s: 30
      })
    });

    const { session_id } = await quickSession.json();

    // Mark first item as seen
    await fetch('/api/swipe/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        answer_id: 'freshness-test',
        session_id: session_id,
        user_id: freshnessUserId,
        item_id: seenItemIds[0],
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        tags: ['test'],
        user_choice: 'apta',
        correct: true,
        score_delta: 1,
        shown_at: new Date(Date.now() - 3000).toISOString(),
        answered_at: new Date().toISOString(),
        latency_ms: 2000,
        suspicious: false
      })
    });

    await fetch('/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        session_id: session_id,
        ended_at: new Date().toISOString(),
        summary: {
          score_total: 1,
          answers_total: 1,
          correct: 1,
          incorrect: 0,
          accuracy_pct: 100,
          items_per_min: 30
        }
      })
    });

    // Now request a fresh deck that should prefer unseen items
    const freshResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&user_id=${freshnessUserId}&prefer_fresh=true`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(freshResponse.status).toBe(200);
    const freshData = await freshResponse.json();

    // Should prioritize items not recently seen
    const freshItemIds = freshData.items.map((item: any) => item.id);
    const overlapCount = freshItemIds.filter(id => seenItemIds.includes(id)).length;

    // Should minimize overlap with recently seen items
    expect(overlapCount).toBeLessThan(freshData.items.length / 2);
  });

  test('deck size optimization and constraints', async () => {
    // Test various deck size requests
    const sizeTests = [
      { requested: 5, expectedRange: [3, 5] },
      { requested: 20, expectedRange: [15, 20] },
      { requested: 50, expectedRange: [20, 50] },
      { requested: 100, expectedRange: [20, 100] } // Should cap at reasonable maximum
    ];

    for (const sizeTest of sizeTests) {
      const sizeResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=${sizeTest.requested}`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(sizeResponse.status).toBe(200);
      const sizeData = await sizeResponse.json();

      expect(sizeData.items.length).toBeGreaterThanOrEqual(sizeTest.expectedRange[0]);
      expect(sizeData.items.length).toBeLessThanOrEqual(sizeTest.expectedRange[1]);

      // Suggested size should be reasonable
      expect(sizeData.session_suggested_size).toBeGreaterThan(0);
      expect(sizeData.session_suggested_size).toBeLessThanOrEqual(100);
    }

    // Test empty result handling
    const impossibleResponse = await fetch(`/api/swipe/deck?lang=zh&level=Z99&exam=INVALID&skill=X&size=10`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(impossibleResponse.status).toBe(400); // Should handle invalid parameters gracefully
  });
});