/**
 * Integration Test: Analytics and Recommendations System
 *
 * Tests the analytics engine and recommendation system:
 * 1. User performance tracking and aggregation
 * 2. Error pattern analysis and categorization
 * 3. Learning progress measurement
 * 4. Personalized recommendation generation
 * 5. Statistical insights and trends
 *
 * IMPORTANT: This test MUST FAIL initially (TDD Red phase)
 * The analytics system will be implemented in Phase 3.3
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { createClient } from '@supabase/supabase-js';

describe('Swipe Analytics and Recommendations Integration', () => {
  let supabase: any;
  let testUserId: string;
  let testItemIds: string[] = [];

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
      process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-key'
    );

    testUserId = 'test-user-analytics-' + Date.now();

    // Create test items with different tags for error analysis
    const testTags = ['grammar', 'vocabulary', 'syntax', 'punctuation', 'style'];

    for (let i = 0; i < testTags.length; i++) {
      const { data } = await supabase
        .from('swipe_items')
        .insert({
          term: `test-analytics-term-${testTags[i]}`,
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill_scope: ['W'],
          tags: [testTags[i]],
          exam_safe: i % 2 === 0, // Alternating safe/unsafe
          difficulty_elo: 1500 + (i * 50),
          content_version: '1.0.0',
          active: true,
          example: `Example for ${testTags[i]} testing`
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

  test('user performance tracking and aggregation', async () => {
    // Create multiple sessions with varying performance
    const sessions = [];

    for (let sessionIndex = 0; sessionIndex < 3; sessionIndex++) {
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
      sessions.push(session_id);

      // Simulate different performance patterns
      const correctAnswers = sessionIndex === 0 ? 2 : sessionIndex === 1 ? 3 : 4; // Improving performance
      const incorrectAnswers = 5 - correctAnswers;

      // Submit correct answers
      for (let i = 0; i < correctAnswers; i++) {
        await fetch('/api/swipe/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            answer_id: `analytics-correct-${sessionIndex}-${i}`,
            session_id: session_id,
            user_id: testUserId,
            item_id: testItemIds[i],
            lang: 'es',
            level: 'B2',
            exam: 'EOI',
            skill: 'W',
            tags: ['grammar', 'vocabulary', 'syntax', 'punctuation', 'style'][i],
            user_choice: 'apta',
            correct: true,
            score_delta: 1,
            shown_at: new Date(Date.now() - 3000).toISOString(),
            answered_at: new Date().toISOString(),
            latency_ms: 2000 + (i * 200), // Varying response times
            input_method: 'keyboard',
            item_difficulty: 1500 + (i * 50),
            content_version: '1.0.0',
            app_version: '1.0.0',
            suspicious: false
          })
        });
      }

      // Submit incorrect answers
      for (let i = 0; i < incorrectAnswers; i++) {
        const tagIndex = correctAnswers + i;
        await fetch('/api/swipe/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            answer_id: `analytics-incorrect-${sessionIndex}-${i}`,
            session_id: session_id,
            user_id: testUserId,
            item_id: testItemIds[tagIndex] || testItemIds[0],
            lang: 'es',
            level: 'B2',
            exam: 'EOI',
            skill: 'W',
            tags: [['grammar', 'vocabulary', 'syntax', 'punctuation', 'style'][tagIndex] || 'grammar'],
            user_choice: 'no_apta',
            correct: false,
            score_delta: -1.33,
            shown_at: new Date(Date.now() - 3000).toISOString(),
            answered_at: new Date().toISOString(),
            latency_ms: 1500 + (i * 300), // Faster but wrong answers
            input_method: 'keyboard',
            item_difficulty: 1500 + (tagIndex * 50),
            content_version: '1.0.0',
            app_version: '1.0.0',
            suspicious: false
          })
        });
      }

      // End session
      const accuracy = (correctAnswers / 5) * 100;
      const scoreTotal = correctAnswers - (incorrectAnswers * 1.33);

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
            score_total: scoreTotal,
            answers_total: 5,
            correct: correctAnswers,
            incorrect: incorrectAnswers,
            accuracy_pct: accuracy,
            items_per_min: 30,
            streak_max: correctAnswers,
            error_buckets: incorrectAnswers > 0 ? { 'grammar': incorrectAnswers } : {}
          }
        })
      });

      // Small delay between sessions
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test user statistics aggregation
    const statsResponse = await fetch(`/api/swipe/stats/user?user_id=${testUserId}&span=7d`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();

    // Verify aggregated statistics
    expect(statsData.total_sessions).toBe(3);
    expect(statsData.total_answers).toBe(15); // 3 sessions × 5 answers
    expect(statsData.correct).toBe(2 + 3 + 4); // 9 total correct
    expect(statsData.incorrect).toBe(3 + 2 + 1); // 6 total incorrect
    expect(statsData.overall_accuracy).toBeCloseTo(60, 0); // 9/15 = 60%

    // Check improvement trend (accuracy should be improving)
    expect(statsData.improvement_trend.accuracy_change).toBeGreaterThan(0);

    // Verify accuracy by tag tracking
    expect(statsData.accuracy_by_tag).toBeDefined();
    expect(Object.keys(statsData.accuracy_by_tag).length).toBeGreaterThan(0);
  });

  test('error pattern analysis and categorization', async () => {
    // Create a session focused on error analysis
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: testUserId + '-errors',
        lang: 'val',
        level: 'C1',
        exam: 'JQCV',
        skill: 'R',
        duration_s: 60
      })
    });

    const { session_id } = await startResponse.json();

    // Submit specific error patterns
    const errorPatterns = [
      { tag: 'grammar', userChoice: 'apta', correct: false, type: 'false_positive' },
      { tag: 'grammar', userChoice: 'no_apta', correct: false, type: 'false_negative' },
      { tag: 'vocabulary', userChoice: 'apta', correct: false, type: 'false_positive' },
      { tag: 'syntax', userChoice: 'no_apta', correct: false, type: 'false_negative' },
      { tag: 'punctuation', userChoice: 'apta', correct: true, type: 'correct' }
    ];

    for (let i = 0; i < errorPatterns.length; i++) {
      const pattern = errorPatterns[i];

      await fetch('/api/swipe/answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          answer_id: `error-pattern-${i}`,
          session_id: session_id,
          user_id: testUserId + '-errors',
          item_id: testItemIds[i],
          lang: 'val',
          level: 'C1',
          exam: 'JQCV',
          skill: 'R',
          tags: [pattern.tag],
          user_choice: pattern.userChoice,
          correct: pattern.correct,
          score_delta: pattern.correct ? 1 : -1.33,
          shown_at: new Date(Date.now() - 3000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 2500,
          input_method: 'touch',
          item_difficulty: 1600,
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });
    }

    // End session with error categorization
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
          score_total: 1 - (4 * 1.33),
          answers_total: 5,
          correct: 1,
          incorrect: 4,
          accuracy_pct: 20,
          items_per_min: 25,
          streak_max: 1,
          error_buckets: {
            'grammar': 2,
            'vocabulary': 1,
            'syntax': 1
          }
        }
      })
    });

    // Test error analysis in user stats
    const statsResponse = await fetch(`/api/swipe/stats/user?user_id=${testUserId}-errors&span=7d`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();

    // Verify error categorization
    expect(statsData.false_positives).toBe(2); // 'apta' when should be 'no_apta'
    expect(statsData.false_negatives).toBe(2); // 'no_apta' when should be 'apta'

    // Check error buckets are tracked
    expect(statsData.accuracy_by_tag['grammar']).toBeLessThan(statsData.accuracy_by_tag['punctuation']);
  });

  test('learning progress measurement', async () => {
    const progressUserId = testUserId + '-progress';

    // Simulate learning progress over multiple sessions
    const progressSessions = 5;
    const initialAccuracy = 40;
    const improvementPerSession = 10;

    for (let sessionIndex = 0; sessionIndex < progressSessions; sessionIndex++) {
      const startResponse = await fetch('/api/swipe/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          user_id: progressUserId,
          lang: 'en',
          level: 'B1',
          exam: 'Cambridge',
          skill: 'S',
          duration_s: 30
        })
      });

      const { session_id } = await startResponse.json();

      // Simulate improving accuracy over time
      const targetAccuracy = Math.min(90, initialAccuracy + (sessionIndex * improvementPerSession));
      const answersPerSession = 10;
      const correctAnswers = Math.floor((targetAccuracy / 100) * answersPerSession);
      const incorrectAnswers = answersPerSession - correctAnswers;

      // Submit answers with improving accuracy
      for (let i = 0; i < correctAnswers; i++) {
        await fetch('/api/swipe/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            answer_id: `progress-correct-${sessionIndex}-${i}`,
            session_id: session_id,
            user_id: progressUserId,
            item_id: testItemIds[i % testItemIds.length],
            lang: 'en',
            level: 'B1',
            exam: 'Cambridge',
            skill: 'S',
            tags: ['vocabulary'],
            user_choice: 'apta',
            correct: true,
            score_delta: 1,
            shown_at: new Date(Date.now() - 2000).toISOString(),
            answered_at: new Date().toISOString(),
            latency_ms: Math.max(1000, 3000 - (sessionIndex * 200)), // Getting faster
            input_method: 'keyboard',
            item_difficulty: 1500,
            content_version: '1.0.0',
            app_version: '1.0.0',
            suspicious: false
          })
        });
      }

      for (let i = 0; i < incorrectAnswers; i++) {
        await fetch('/api/swipe/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            answer_id: `progress-incorrect-${sessionIndex}-${i}`,
            session_id: session_id,
            user_id: progressUserId,
            item_id: testItemIds[i % testItemIds.length],
            lang: 'en',
            level: 'B1',
            exam: 'Cambridge',
            skill: 'S',
            tags: ['vocabulary'],
            user_choice: 'no_apta',
            correct: false,
            score_delta: -1.33,
            shown_at: new Date(Date.now() - 2000).toISOString(),
            answered_at: new Date().toISOString(),
            latency_ms: 2000,
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
            score_total: correctAnswers - (incorrectAnswers * 1.33),
            answers_total: answersPerSession,
            correct: correctAnswers,
            incorrect: incorrectAnswers,
            accuracy_pct: targetAccuracy,
            items_per_min: 20 + sessionIndex * 2, // Getting faster
            streak_max: Math.min(correctAnswers, 5 + sessionIndex),
            error_buckets: incorrectAnswers > 0 ? { 'vocabulary': incorrectAnswers } : {}
          }
        })
      });

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Test progress tracking
    const statsResponse = await fetch(`/api/swipe/stats/user?user_id=${progressUserId}&span=30d`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();

    // Verify learning progress indicators
    expect(statsData.total_sessions).toBe(progressSessions);
    expect(statsData.improvement_trend.accuracy_change).toBeGreaterThan(20); // Should show significant improvement
    expect(statsData.improvement_trend.speed_change).toBeGreaterThan(0); // Should be getting faster
    expect(statsData.streak_stats.max).toBeGreaterThan(statsData.streak_stats.average);
  });

  test('personalized recommendation generation', async () => {
    // Create user with specific weakness pattern
    const weaknessUserId = testUserId + '-weakness';

    // Start session
    const startResponse = await fetch('/api/swipe/session/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify({
        user_id: weaknessUserId,
        lang: 'es',
        level: 'C2',
        exam: 'DELE',
        skill: 'W',
        duration_s: 60
      })
    });

    const { session_id } = await startResponse.json();

    // Create performance pattern: strong in vocabulary, weak in grammar
    const performancePattern = [
      { tag: 'vocabulary', correct: true },
      { tag: 'vocabulary', correct: true },
      { tag: 'vocabulary', correct: true },
      { tag: 'grammar', correct: false },
      { tag: 'grammar', correct: false },
      { tag: 'syntax', correct: true },
      { tag: 'punctuation', correct: false }
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
          answer_id: `weakness-${i}`,
          session_id: session_id,
          user_id: weaknessUserId,
          item_id: testItemIds[i % testItemIds.length],
          lang: 'es',
          level: 'C2',
          exam: 'DELE',
          skill: 'W',
          tags: [pattern.tag],
          user_choice: pattern.correct ? 'apta' : 'no_apta',
          correct: pattern.correct,
          score_delta: pattern.correct ? 1 : -1.33,
          shown_at: new Date(Date.now() - 3000).toISOString(),
          answered_at: new Date().toISOString(),
          latency_ms: 2500,
          input_method: 'keyboard',
          item_difficulty: 1600,
          content_version: '1.0.0',
          app_version: '1.0.0',
          suspicious: false
        })
      });
    }

    // End session
    const correctCount = performancePattern.filter(p => p.correct).length;
    const incorrectCount = performancePattern.length - correctCount;

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
          score_total: correctCount - (incorrectCount * 1.33),
          answers_total: performancePattern.length,
          correct: correctCount,
          incorrect: incorrectCount,
          accuracy_pct: (correctCount / performancePattern.length) * 100,
          items_per_min: 25,
          streak_max: 3,
          error_buckets: {
            'grammar': 2,
            'punctuation': 1
          }
        }
      })
    });

    // Test personalized recommendations
    const recommendationsResponse = await fetch(`/api/swipe/recommendations/next-pack?user_id=${weaknessUserId}&lang=es&level=C2&exam=DELE&skill=W`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(recommendationsResponse.status).toBe(200);
    const recommendationsData = await recommendationsResponse.json();

    // Verify recommendations focus on weak areas
    expect(recommendationsData.recommendation.next_pack_tags).toContain('grammar');
    expect(recommendationsData.recommendation.rationale).toMatch(/grammar|gramática/i);

    // Should suggest appropriate difficulty and timeline
    expect(recommendationsData.estimated_difficulty).toBeGreaterThan(1500);
    expect(recommendationsData.recommendation.deadline_suggested_days).toBeGreaterThan(3);

    // For writing skill, should include mini-writing prompt
    expect(recommendationsData.recommendation.mini_writing_prompt).toBeDefined();
    expect(recommendationsData.recommendation.mini_writing_prompt.length).toBeGreaterThan(20);

    // Recommended items should include grammar-focused content
    const grammarItems = recommendationsData.items.filter((item: any) =>
      item.tags.includes('grammar')
    );
    expect(grammarItems.length).toBeGreaterThan(0);
  });

  test('statistical insights and trend analysis', async () => {
    const analyticsUserId = testUserId + '-analytics-detailed';

    // Create diverse session data for rich analytics
    const sessionTypes = [
      { duration: 30, skill: 'R', accuracy: 85, speed: 40 },
      { duration: 60, skill: 'W', accuracy: 70, speed: 25 },
      { duration: 120, skill: 'S', accuracy: 60, speed: 15 },
      { duration: 30, skill: 'Med', accuracy: 90, speed: 35 }
    ];

    for (let sessionIndex = 0; sessionIndex < sessionTypes.length; sessionIndex++) {
      const sessionType = sessionTypes[sessionIndex];

      const startResponse = await fetch('/api/swipe/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          user_id: analyticsUserId,
          lang: 'es',
          level: 'B2',
          exam: 'EOI',
          skill: sessionType.skill,
          duration_s: sessionType.duration
        })
      });

      const { session_id } = await startResponse.json();

      // Generate answers matching the session profile
      const answersCount = 8;
      const correctAnswers = Math.floor((sessionType.accuracy / 100) * answersCount);

      for (let i = 0; i < answersCount; i++) {
        const isCorrect = i < correctAnswers;

        await fetch('/api/swipe/answer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            answer_id: `analytics-detailed-${sessionIndex}-${i}`,
            session_id: session_id,
            user_id: analyticsUserId,
            item_id: testItemIds[i % testItemIds.length],
            lang: 'es',
            level: 'B2',
            exam: 'EOI',
            skill: sessionType.skill,
            tags: ['vocabulary'],
            user_choice: isCorrect ? 'apta' : 'no_apta',
            correct: isCorrect,
            score_delta: isCorrect ? 1 : -1.33,
            shown_at: new Date(Date.now() - 3000).toISOString(),
            answered_at: new Date().toISOString(),
            latency_ms: Math.floor(60000 / sessionType.speed), // Convert speed to latency
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
            score_total: correctAnswers - ((answersCount - correctAnswers) * 1.33),
            answers_total: answersCount,
            correct: correctAnswers,
            incorrect: answersCount - correctAnswers,
            accuracy_pct: sessionType.accuracy,
            items_per_min: sessionType.speed,
            streak_max: Math.min(correctAnswers, 5),
            error_buckets: answersCount > correctAnswers ? { 'vocabulary': answersCount - correctAnswers } : {}
          }
        })
      });

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Test detailed statistical insights
    const statsResponse = await fetch(`/api/swipe/stats/user?user_id=${analyticsUserId}&span=7d`, {
      headers: {
        'Authorization': 'Bearer test-token'
      }
    });

    expect(statsResponse.status).toBe(200);
    const statsData = await statsResponse.json();

    // Verify detailed analytics
    expect(statsData.total_sessions).toBe(4);
    expect(statsData.total_answers).toBe(32); // 4 sessions × 8 answers

    // Check items_per_min_by_duration breakdown
    expect(statsData.items_per_min_by_duration).toBeDefined();
    expect(statsData.items_per_min_by_duration[30]).toBeDefined();
    expect(statsData.items_per_min_by_duration[60]).toBeDefined();
    expect(statsData.items_per_min_by_duration[120]).toBeDefined();

    // Verify streak statistics
    expect(statsData.streak_stats.current).toBeGreaterThanOrEqual(0);
    expect(statsData.streak_stats.max).toBeGreaterThanOrEqual(statsData.streak_stats.current);
    expect(statsData.streak_stats.average).toBeGreaterThan(0);

    // Check overall accuracy reflects session performance
    const expectedAccuracy = sessionTypes.reduce((sum, session) => sum + session.accuracy, 0) / sessionTypes.length;
    expect(Math.abs(statsData.overall_accuracy - expectedAccuracy)).toBeLessThan(10);
  });
});