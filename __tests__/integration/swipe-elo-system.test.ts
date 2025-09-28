/**
 * Integration Test: ELO Rating System
 *
 * Tests the ELO rating system that adapts difficulty based on user performance:
 * 1. User rating initialization and updates
 * 2. Item difficulty calibration
 * 3. Rating calculation accuracy
 * 4. Adaptive deck generation based on ratings
 * 5. Rating persistence and history
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The ELO system will be implemented in Phase 3.3
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Swipe ELO Rating System Integration', () => {
  let supabase: any;
  let testUserId: string;
  let testItemIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
    );

    testUserId = 'test-user-elo-' + Date.now();

    // Create test items with known difficulties
    for (let i = 0; i < 5; i++) {
      const { data } = await supabase
        .from('swipe_items')
        .insert({
          term: `test-elo-term-${i}`,
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill_scope: ['W'],
          tags: ['test-elo'],
          exam_safe: true,
          difficulty_elo: 1500 + (i * 100), // 1500, 1600, 1700, 1800, 1900
          content_version: '1.0.0',
          active: true
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

  test('user rating initialization and progression', async () => {
    // Start a session to initialize user rating
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId,
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        duration_s: 60
      })
    });

    expect(startResponse.status).toBe(201);
    const { session_id } = await startResponse.json();

    // Submit correct answers for easy items (should increase user rating)
    for (let i = 0; i < 3; i++) {
      const answerResponse = await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          answer_id: `elo-correct-${i}`,
          session_id: session_id,
          user_id: testUserId,
          item_id: testItemIds[i],
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: 'W',
          tags: ['test-elo'],
          user_choice: 'apta',
          correct: true,
          score_delta: 1,
          shown_at: new Date(Date.now() - 3000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 2000,
          item_difficulty: 1500 + (i * 100),
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });

      expect(answerResponse.status).toBe(201);
      const answerData = await answerResponse.json();
      expect(answerData.elo_updates).toBeDefined();
      expect(answerData.elo_updates.user_rating_change).toBeGreaterThan(0);
    }

    // Check user rating has increased from default (1500)
    const { data: userSkill } = await supabase
      .from('swipe_user_skill')
      .select('rating_elo')
      .eq('user_id', testUserId)
      .eq('lang', 'es')
      .eq('exam', 'EOI')
      .eq('skill', 'W')
      .single();

    expect(userSkill.rating_elo).toBeGreaterThan(1500);

    // Submit incorrect answers for difficult items (should decrease user rating)
    for (let i = 3; i < 5; i++) {
      const answerResponse = await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          answer_id: `elo-incorrect-${i}`,
          session_id: session_id,
          user_id: testUserId,
          item_id: testItemIds[i],
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: 'W',
          tags: ['test-elo'],
          user_choice: 'no_apta',
          correct: false,
          score_delta: -1.33,
          shown_at: new Date(Date.now() - 3000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 2000,
          item_difficulty: 1500 + (i * 100),
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });

      expect(answerResponse.status).toBe(201);
      const answerData = await answerResponse.json();
      expect(answerData.elo_updates.user_rating_change).toBeLessThan(0);
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
          items_per_min: 30
        }
      })
    });
  });

  test('item difficulty calibration', async () => {
    // Start a new session
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId + '-item-cal',
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        duration_s: 60
      })
    });

    const { session_id } = await startResponse.json();

    // Get initial item difficulty
    const { data: initialItem } = await supabase
      .from('swipe_items')
      .select('difficulty_elo')
      .eq('id', testItemIds[0])
      .single();

    const initialDifficulty = initialItem.difficulty_elo;

    // Multiple users answer this item incorrectly (should increase item difficulty)
    for (let userIndex = 0; userIndex < 3; userIndex++) {
      const answerResponse = await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          answer_id: `item-cal-${userIndex}`,
          session_id: session_id,
          user_id: testUserId + '-item-cal-' + userIndex,
          item_id: testItemIds[0],
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: 'W',
          tags: ['test-elo'],
          user_choice: 'apta',
          correct: false, // Wrong answer
          score_delta: -1.33,
          shown_at: new Date(Date.now() - 3000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 2000,
          item_difficulty: initialDifficulty,
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });

      expect(answerResponse.status).toBe(201);
      const answerData = await answerResponse.json();
      expect(answerData.elo_updates.item_rating_change).toBeGreaterThan(0);
    }

    // Check item difficulty has increased
    const { data: updatedItem } = await supabase
      .from('swipe_items')
      .select('difficulty_elo')
      .eq('id', testItemIds[0])
      .single();

    expect(updatedItem.difficulty_elo).toBeGreaterThan(initialDifficulty);

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
          score_total: -1.33,
          answers_total: 1,
          correct: 0,
          incorrect: 1,
          accuracy_pct: 0,
          items_per_min: 60
        }
      })
    });
  });

  test('adaptive deck generation based on ratings', async () => {
    // Create a user with high rating
    const highRatedUserId = testUserId + '-high-rated';

    // Initialize high user rating
    await supabase
      .from('swipe_user_skill')
      .insert({
        user_id: highRatedUserId,
        lang: 'es',
        exam: 'EOI',
        skill: 'W',
        tag: 'general',
        rating_elo: 1800, // High rating
        rd: 200
      });

    // Get deck for high-rated user
    const highRatedDeckResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&user_id=${highRatedUserId}`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(highRatedDeckResponse.status).toBe(200);
    const highRatedDeck = await highRatedDeckResponse.json();

    // Create a user with low rating
    const lowRatedUserId = testUserId + '-low-rated';

    await supabase
      .from('swipe_user_skill')
      .insert({
        user_id: lowRatedUserId,
        lang: 'es',
        exam: 'EOI',
        skill: 'W',
        tag: 'general',
        rating_elo: 1200, // Low rating
        rd: 200
      });

    // Get deck for low-rated user
    const lowRatedDeckResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10&user_id=${lowRatedUserId}`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(lowRatedDeckResponse.status).toBe(200);
    const lowRatedDeck = await lowRatedDeckResponse.json();

    // High-rated user should get more difficult items on average
    const avgHighDifficulty = highRatedDeck.items.reduce((sum: number, item: any) => sum + item.difficulty_elo, 0) / highRatedDeck.items.length;
    const avgLowDifficulty = lowRatedDeck.items.reduce((sum: number, item: any) => sum + item.difficulty_elo, 0) / lowRatedDeck.items.length;

    expect(avgHighDifficulty).toBeGreaterThan(avgLowDifficulty);

    // Cleanup
    await supabase.from('swipe_user_skill').delete().eq('user_id', highRatedUserId);
    await supabase.from('swipe_user_skill').delete().eq('user_id', lowRatedUserId);
  });

  test('ELO calculation accuracy', async () => {
    // Test the mathematical accuracy of ELO calculations
    const testUserRating = 1600;
    const testItemRating = 1500;
    const kFactor = 20;

    // Calculate expected score: 1 / (1 + 10^((Ra - Rb) / 400))
    const expectedScore = 1 / (1 + Math.pow(10, (testItemRating - testUserRating) / 400));

    // For a 1600 vs 1500 matchup, expected score should be ~0.64
    expect(expectedScore).toBeCloseTo(0.64, 1);

    // Start session to test actual ELO calculations
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId + '-elo-calc',
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        duration_s: 60
      })
    });

    const { session_id } = await startResponse.json();

    // Set up user with known rating
    await supabase
      .from('swipe_user_skill')
      .upsert({
        user_id: testUserId + '-elo-calc',
        lang: 'es',
        exam: 'EOI',
        skill: 'W',
        tag: 'general',
        rating_elo: testUserRating,
        rd: 200
      });

    // Submit correct answer
    const correctAnswerResponse = await fetch('/api/swipe/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        answer_id: 'elo-calc-correct',
        session_id: session_id,
        user_id: testUserId + '-elo-calc',
        item_id: testItemIds[1], // Known to have 1600 difficulty
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        tags: ['test-elo'],
        user_choice: 'apta',
        correct: true,
        score_delta: 1,
        shown_at: new Date(Date.now() - 3000).toISOString(),
        answered_at: new Date().toISOString(),
        latency_ms: 2000,
        item_difficulty: 1600,
        content_version: '1.0.0',
        app_version: '1.0.0',
        suspicious: false
      })
    });

    expect(correctAnswerResponse.status).toBe(201);
    const correctAnswerData = await correctAnswerResponse.json();

    // User rating should increase by approximately K * (1 - expectedScore)
    const expectedUserIncrease = kFactor * (1 - expectedScore);
    expect(Math.abs(correctAnswerData.elo_updates.user_rating_change - expectedUserIncrease)).toBeLessThan(2);

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
          score_total: 1,
          answers_total: 1,
          correct: 1,
          incorrect: 0,
          accuracy_pct: 100,
          items_per_min: 60
        }
      })
    });
  });

  test('rating persistence and history tracking', async () => {
    const historyUserId = testUserId + '-history';

    // Create multiple sessions over time to track rating progression
    const sessions = [];

    for (let sessionIndex = 0; sessionIndex < 3; sessionIndex++) {
      const startResponse = await fetch('/api/swipe/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          user_id: historyUserId,
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: 'W',
          duration_s: 30
        })
      });

      const { session_id } = await startResponse.json();
      sessions.push(session_id);

      // Submit answers with improving performance
      const correctAnswers = sessionIndex + 1; // 1, 2, 3 correct answers per session

      for (let answerIndex = 0; answerIndex < correctAnswers; answerIndex++) {
        await fetch('/api/swipe/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            answer_id: `history-${sessionIndex}-${answerIndex}`,
            session_id: session_id,
            user_id: historyUserId,
            item_id: testItemIds[answerIndex],
            lang: 'es',
            level: 'B2',
            exam: 'EOI',
            skill: 'W',
            tags: ['test-elo'],
            user_choice: 'apta',
            correct: true,
            score_delta: 1,
            shown_at: new Date(Date.now() - 3000).toISOString(),
            answered_at: new Date().toISOString(),
            latency_ms: 2000,
            item_difficulty: 1500 + (answerIndex * 100),
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
            score_total: correctAnswers,
            answers_total: correctAnswers,
            correct: correctAnswers,
            incorrect: 0,
            accuracy_pct: 100,
            items_per_min: correctAnswers * 2
          }
        })
      });

      // Small delay between sessions
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Check that user rating has progressively improved
    const { data: finalRating } = await supabase
      .from('swipe_user_skill')
      .select('rating_elo, last_update')
      .eq('user_id', historyUserId)
      .eq('lang', 'es')
      .eq('exam', 'EOI')
      .eq('skill', 'W')
      .single();

    expect(finalRating.rating_elo).toBeGreaterThan(1500); // Should be above default
    expect(new Date(finalRating.last_update)).toBeInstanceOf(Date);

    // Check answer history is preserved
    const { data: answerHistory } = await supabase
      .from('swipe_answers')
      .select('*')
      .eq('user_id', historyUserId)
      .order('created_at', { ascending: true });

    expect(answerHistory.length).toBe(6); // 1 + 2 + 3 answers
    expect(answerHistory.every((answer: any) => answer.correct)).toBe(true);

    // Cleanup
    await supabase.from('swipe_user_skill').delete().eq('user_id', historyUserId);
  });
});