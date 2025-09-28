/**
 * Integration Test: Complete Swipe Game Session Flow
 *
 * Tests the end-to-end workflow of a complete swipe game session:
 * 1. Session initialization and deck retrieval
 * 2. Answer submission and scoring
 * 3. Session completion and summary
 * 4. User statistics updates
 * 5. Next practice recommendations
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The endpoints and services will be implemented in Phase 3.3
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Swipe Game Flow Integration', () => {
  let supabase: any;
  let testUserId: string;
  let testSessionId: string;

  beforeAll(async () => {
    // Initialize test database connection
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
    );

    // Create test user
    testUserId = 'test-user-integration-' + Date.now();
  });

  afterAll(async () => {
    // Cleanup test data
    if (supabase && testUserId) {
      await supabase.from('swipe_sessions').delete().eq('user_id', testUserId);
      await supabase.from('swipe_answers').delete().eq('user_id', testUserId);
      await supabase.from('swipe_user_skill').delete().eq('user_id', testUserId);
    }
  });

  beforeEach(() => {
    testSessionId = '';
  });

  test('complete game session workflow', async () => {
    // Step 1: Start a new session
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
    const startData = await startResponse.json();
    expect(startData.session_id).toBeDefined();
    expect(startData.deck_size).toBeGreaterThan(0);

    testSessionId = startData.session_id;

    // Step 2: Get deck of items
    const deckResponse = await fetch(`/api/swipe/deck?lang=es&level=B2&exam=EOI&skill=W&size=10`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(deckResponse.status).toBe(200);
    const deckData = await deckResponse.json();
    expect(deckData.items.length).toBeGreaterThan(0);
    expect(deckData.session_suggested_size).toBeGreaterThan(0);

    const testItems = deckData.items.slice(0, 5); // Test with 5 items

    // Step 3: Submit answers for multiple items
    let totalScore = 0;
    const answers = [];

    for (let i = 0; i < testItems.length; i++) {
      const item = testItems[i];
      const isCorrect = i % 2 === 0; // Alternate correct/incorrect
      const userChoice = isCorrect ? 'apta' : 'no_apta';
      const scoreDelta = isCorrect ? 1 : -1.33;

      const answerResponse = await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          answer_id: `answer-${i}`,
          session_id: testSessionId,
          user_id: testUserId,
          item_id: item.id,
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: 'W',
          tags: item.tags,
          user_choice: userChoice,
          correct: isCorrect,
          score_delta: scoreDelta,
          shown_at: new Date(Date.now() - 5000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 3000 + (i * 500),
          input_method: 'keyboard',
          item_difficulty: item.difficulty_elo,
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });

      expect(answerResponse.status).toBe(201);
      const answerData = await answerResponse.json();
      expect(answerData.success).toBe(true);
      expect(answerData.score_delta).toBe(scoreDelta);

      totalScore += scoreDelta;
      answers.push({
        correct: isCorrect,
        score_delta: scoreDelta
      });
    }

    // Step 4: End the session
    const correctAnswers = answers.filter(a => a.correct).length;
    const incorrectAnswers = answers.filter(a => !a.correct).length;
    const accuracy = (correctAnswers / answers.length) * 100;

    const endResponse = await fetch('/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        session_id: testSessionId,
        ended_at: new Date().toISOString(),
        summary: {
          score_total: totalScore,
          answers_total: answers.length,
          correct: correctAnswers,
          incorrect: incorrectAnswers,
          accuracy_pct: accuracy,
          items_per_min: (answers.length / 1) * 60, // 1 minute estimated
          streak_max: 2,
          error_buckets: {
            'grammar': incorrectAnswers
          }
        }
      })
    });

    expect(endResponse.status).toBe(200);
    const endData = await endResponse.json();
    expect(endData.success).toBe(true);
    expect(endData.final_summary.score_total).toBe(totalScore);
    expect(endData.final_summary.accuracy_pct).toBe(accuracy);
    expect(endData.performance_analysis).toBeDefined();
    expect(endData.next_recommendations).toBeDefined();

    // Step 5: Verify user statistics updated
    const statsResponse = await fetch(`/api/swipe/stats/user?user_id=${testUserId}&span=7d`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();
    expect(statsData.total_sessions).toBeGreaterThanOrEqual(1);
    expect(statsData.total_answers).toBeGreaterThanOrEqual(answers.length);
    expect(statsData.overall_accuracy).toBeGreaterThan(0);

    // Step 6: Get recommendations for next practice
    const recommendationsResponse = await fetch(`/api/swipe/recommendations/next-pack?user_id=${testUserId}&lang=es&level=B2&exam=EOI&skill=W`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(recommendationsResponse.status).toBe(200);
    const recommendationsData = await recommendationsResponse.json();
    expect(recommendationsData.items.length).toBeGreaterThan(0);
    expect(recommendationsData.recommendation.next_pack_tags.length).toBeGreaterThan(0);
    expect(recommendationsData.recommendation.rationale).toBeDefined();
    expect(recommendationsData.estimated_difficulty).toBeGreaterThan(0);
  });

  test('session persistence and recovery', async () => {
    // Start a session
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId,
        lang: 'val',
        level: 'C1',
        exam: 'JQCV',
        skill: 'R',
        duration_s: 120
      })
    });

    expect(startResponse.status).toBe(201);
    const startData = await startResponse.json();
    testSessionId = startData.session_id;

    // Submit one answer
    const answerResponse = await fetch('/api/swipe/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        answer_id: 'recovery-answer-1',
        session_id: testSessionId,
        user_id: testUserId,
        item_id: 'test-item-recovery',
        lang: 'val',
        level: 'C1',
        exam: 'JQCV',
        skill: 'R',
        tags: ['vocabulary'],
        user_choice: 'apta',
        correct: true,
        score_delta: 1,
        shown_at: new Date(Date.now() - 3000).toISOString(),
        answered_at: new Date().toISOString(),
        latency_ms: 2500,
        suspicious: false
      })
    });

    expect(answerResponse.status).toBe(201);

    // Verify session can be retrieved and has the answer
    const { data: sessionData } = await supabase
      .from('swipe_sessions')
      .select('*')
      .eq('id', testSessionId)
      .single();

    expect(sessionData).toBeDefined();
    expect(sessionData.user_id).toBe(testUserId);
    expect(sessionData.duration_s).toBe(120);

    const { data: answersData } = await supabase
      .from('swipe_answers')
      .select('*')
      .eq('session_id', testSessionId);

    expect(answersData.length).toBe(1);
    expect(answersData[0].correct).toBe(true);
    expect(answersData[0].score_delta).toBe(1);
  });

  test('error handling and validation', async () => {
    // Test invalid session start
    const invalidStartResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId,
        lang: 'invalid',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        duration_s: 60
      })
    });

    expect(invalidStartResponse.status).toBe(400);

    // Test answer submission without session
    const invalidAnswerResponse = await fetch('/api/swipe/answer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        answer_id: 'invalid-answer',
        session_id: 'non-existent-session',
        user_id: testUserId,
        item_id: 'test-item',
        lang: 'es',
        level: 'B2',
        exam: 'EOI',
        skill: 'W',
        tags: ['test'],
        user_choice: 'apta',
        correct: true,
        score_delta: 1,
        shown_at: new Date().toISOString(),
        answered_at: new Date().toISOString(),
        latency_ms: 3000,
        suspicious: false
      })
    });

    expect(invalidAnswerResponse.status).toBe(404); // Session not found

    // Test ending non-existent session
    const invalidEndResponse = await fetch('/api/swipe/session/end', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        session_id: 'non-existent-session',
        ended_at: new Date().toISOString(),
        summary: {
          score_total: 0,
          answers_total: 0,
          correct: 0,
          incorrect: 0,
          accuracy_pct: 0,
          items_per_min: 0
        }
      })
    });

    expect(invalidEndResponse.status).toBe(404);
  });

  test('concurrent session handling', async () => {
    // Start multiple sessions for the same user
    const session1Promise = fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId,
        lang: 'es',
        level: 'A1',
        exam: 'DELE',
        skill: 'S',
        duration_s: 30
      })
    });

    const session2Promise = fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId,
        lang: 'en',
        level: 'B1',
        exam: 'Cambridge',
        skill: 'W',
        duration_s: 30
      })
    });

    const [session1Response, session2Response] = await Promise.all([
      session1Promise,
      session2Promise
    ]);

    expect(session1Response.status).toBe(201);
    expect(session2Response.status).toBe(201);

    const session1Data = await session1Response.json();
    const session2Data = await session2Response.json();

    // Both sessions should be created successfully
    expect(session1Data.session_id).toBeDefined();
    expect(session2Data.session_id).toBeDefined();
    expect(session1Data.session_id).not.toBe(session2Data.session_id);

    // Cleanup
    await Promise.all([
      fetch('/api/swipe/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          session_id: session1Data.session_id,
          ended_at: new Date().toISOString(),
          summary: {
            score_total: 0,
            answers_total: 0,
            correct: 0,
            incorrect: 0,
            accuracy_pct: 0,
            items_per_min: 0
          }
        })
      }),
      fetch('/api/swipe/session/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          session_id: session2Data.session_id,
          ended_at: new Date().toISOString(),
          summary: {
            score_total: 0,
            answers_total: 0,
            correct: 0,
            incorrect: 0,
            accuracy_pct: 0,
            items_per_min: 0
          }
        })
      })
    ]);
  });
});