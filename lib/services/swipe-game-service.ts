/**
 * Swipe Game Service
 *
 * Business logic layer for swipe game operations including:
 * - Game session management
 * - Scoring and ELO calculations
 * - Deck generation and balancing
 * - Performance analysis and recommendations
 */

import { SwipeItemModel } from '@/lib/models/swipe-item';
import { SwipeSessionModel } from '@/lib/models/swipe-session';
import { SwipeAnswerModel } from '@/lib/models/swipe-answer';
import { SCORING_CONFIG, ELO_CONFIG, GAME_CONFIG } from '@/lib/config/swipe-config';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SwipeSession,
  SwipeAnswer,
  SwipeItem,
  CreateSessionParams,
  SubmitAnswerParams,
  SessionSummary,
  GameRecommendations,
  PerformanceAnalysis,
  DeckGenerationParams,
  DeckGenerationResult,
  UserChoice,
  Language,
  Level,
  ExamProvider,
  Skill
} from '@/lib/types/swipe-game';

export class SwipeGameService {
  private itemModel: SwipeItemModel;
  private sessionModel: SwipeSessionModel;
  private answerModel: SwipeAnswerModel;

  constructor(supabase: SupabaseClient) {
    this.itemModel = new SwipeItemModel(supabase);
    this.sessionModel = new SwipeSessionModel(supabase);
    this.answerModel = new SwipeAnswerModel(supabase);
  }

  /**
   * Start a new game session
   */
  async startSession(params: CreateSessionParams): Promise<{
    session: SwipeSession;
    session_id: string;
    deck_size: number;
    estimated_difficulty: number;
  }> {
    // Validate session parameters
    this.validateSessionParams(params);

    // Check for existing active sessions
    const activeSessions = await this.sessionModel.getActiveSessions(params.user_id);
    if (activeSessions.length > 0) {
      // Auto-abandon old sessions
      for (const session of activeSessions) {
        await this.sessionModel.abandon(session.id);
      }
    }

    // Create the session
    const session = await this.sessionModel.create(params);

    // Generate initial deck to get size estimate
    const deckResult = await this.generateDeck({
      lang: params.lang,
      level: params.level,
      exam: params.exam,
      skill: params.skill,
      size: Math.min(params.duration_s / 3, 40), // Estimate based on duration
      user_id: params.user_id
    });

    return {
      session,
      session_id: session.id,
      deck_size: deckResult.session_suggested_size,
      estimated_difficulty: deckResult.estimated_difficulty
    };
  }

  /**
   * Generate a balanced deck for the session
   */
  async generateDeck(params: DeckGenerationParams): Promise<DeckGenerationResult> {
    // Get user's skill level for difficulty targeting
    const userSkillLevel = await this.getUserSkillLevel(
      params.user_id || '',
      params.lang,
      params.level,
      params.exam,
      params.skill
    );

    // Adjust target difficulty based on user skill
    const targetDifficulty = params.difficulty_target || this.calculateTargetDifficulty(userSkillLevel);

    const deckParams = {
      ...params,
      difficulty_target: targetDifficulty,
      size: Math.max(Math.min(params.size, GAME_CONFIG.MAX_DECK_SIZE), GAME_CONFIG.MIN_DECK_SIZE)
    };

    return await this.itemModel.generateDeck(deckParams);
  }

  /**
   * Submit an answer and update scoring
   */
  async submitAnswer(params: SubmitAnswerParams): Promise<{
    success: boolean;
    score_delta: number;
    new_total_score: number;
    correct: boolean;
    explanation?: string;
    suggested_improvement?: string;
  }> {
    // Validate answer parameters
    this.validateAnswerParams(params);

    // Get the session and item
    const session = await this.sessionModel.getById(params.session_id);
    if (!session || session.status !== 'active') {
      throw new Error('Session not found or not active');
    }

    const item = await this.itemModel.getById(params.item_id);
    if (!item) {
      throw new Error('Item not found');
    }

    // Calculate if answer is correct
    const correct = this.isAnswerCorrect(params.user_choice, item.exam_safe);

    // Calculate score delta
    const scoreDelta = this.calculateScoreDelta(correct, params.latency_ms);

    // Detect suspicious behavior
    const suspicious = this.detectSuspiciousBehavior(params, correct);

    // Create answer record
    const answer: Omit<SwipeAnswer, 'id' | 'created_at'> = {
      answer_id: params.answer_id,
      session_id: params.session_id,
      user_id: params.user_id,
      item_id: params.item_id,
      lang: params.lang,
      level: params.level,
      exam: params.exam,
      skill: params.skill,
      tags: params.tags,
      user_choice: params.user_choice,
      correct,
      score_delta: scoreDelta,
      shown_at: params.shown_at,
      answered_at: params.answered_at,
      latency_ms: params.latency_ms,
      input_method: params.input_method,
      item_difficulty: params.item_difficulty,
      content_version: params.content_version,
      app_version: params.app_version,
      suspicious
    };

    // Submit answer
    await this.answerModel.submit(answer);

    // Update session progress
    const currentAnswers = await this.answerModel.getBySession(params.session_id);
    const newTotalScore = currentAnswers.reduce((sum, ans) => sum + ans.score_delta, 0);

    await this.sessionModel.updateProgress(params.session_id, {
      answers_count: currentAnswers.length,
      current_score: newTotalScore
    });

    // Update item difficulty (ELO)
    const userElo = await this.getUserElo(params.user_id, params.lang, params.level, params.exam, params.skill);
    await this.itemModel.updateDifficulty(params.item_id, correct, userElo);

    // Update item statistics
    await this.itemModel.updateItemStats(params.item_id, correct, params.latency_ms, params.user_id);

    // Generate feedback
    const feedback = await this.generateFeedback(item, correct, params.user_choice);

    return {
      success: true,
      score_delta: scoreDelta,
      new_total_score: newTotalScore,
      correct,
      explanation: feedback.explanation,
      suggested_improvement: feedback.suggested_improvement
    };
  }

  /**
   * End a session and generate final summary
   */
  async endSession(
    sessionId: string,
    endedAt: string,
    partialSummary?: Partial<SessionSummary>
  ): Promise<{
    success: boolean;
    final_summary: SessionSummary;
    performance_analysis: PerformanceAnalysis;
    next_recommendations: GameRecommendations;
  }> {
    const session = await this.sessionModel.getById(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    const answers = await this.answerModel.getBySession(sessionId);

    // Calculate session summary
    const summary = await this.calculateSessionSummary(session, answers, partialSummary);

    // Complete the session
    await this.sessionModel.complete(sessionId, summary);

    // Update user skill level
    await this.updateUserSkillLevel(session.user_id, session.lang, session.level, session.exam, session.skill, summary);

    // Generate performance analysis
    const performanceAnalysis = await this.generatePerformanceAnalysis(session.user_id, summary, answers);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(session.user_id, session, summary, performanceAnalysis);

    return {
      success: true,
      final_summary: summary,
      performance_analysis: performanceAnalysis,
      next_recommendations: recommendations
    };
  }

  /**
   * Get user statistics and progress
   */
  async getUserStats(userId: string, timespan: '7d' | '30d' | '90d' = '30d'): Promise<{
    total_sessions: number;
    total_answers: number;
    overall_accuracy: number;
    avg_score: number;
    best_session: SessionSummary | null;
    recent_performance: Array<{
      date: string;
      accuracy: number;
      score: number;
    }>;
    skill_levels: Record<string, number>;
  }> {
    const [sessionAnalytics, answerAnalytics, skillLevels] = await Promise.all([
      this.sessionModel.getUserAnalytics(userId, timespan),
      this.answerModel.getUserAnalytics(userId, timespan),
      this.getUserAllSkillLevels(userId)
    ]);

    // Get best session
    const sessions = await this.sessionModel.getUserSessions(userId, {}, 100);
    const completedSessions = sessions.filter(s => s.status === 'completed' && s.summary);
    const bestSession = completedSessions.reduce((best, current) => {
      if (!best || !current.summary || !best.summary) return current;
      return current.summary.score_total > best.summary.score_total ? current : best;
    }, completedSessions[0]);

    return {
      total_sessions: sessionAnalytics.total_sessions,
      total_answers: answerAnalytics.total_answers,
      overall_accuracy: answerAnalytics.accuracy_percentage,
      avg_score: sessionAnalytics.avg_score,
      best_session: bestSession?.summary || null,
      recent_performance: sessionAnalytics.score_trend.map(point => ({
        date: point.date,
        accuracy: point.accuracy || 0,
        score: point.score
      })),
      skill_levels: skillLevels
    };
  }

  /**
   * Get personalized recommendations for next practice session
   */
  async getNextPackRecommendations(
    userId: string,
    lang: Language,
    level: Level,
    exam: ExamProvider,
    skill: Skill
  ): Promise<{
    items: SwipeItem[];
    recommendation: {
      focus_area: string;
      difficulty_level: 'easy' | 'medium' | 'hard';
      estimated_duration: number;
      next_pack_tags: string[];
      rationale: string;
    };
    estimated_difficulty: number;
  }> {
    // Get user's recent performance
    const userStats = await this.getUserStats(userId, '30d');
    const learningInsights = await this.answerModel.getLearningInsights(userId);
    const mistakePatterns = await this.answerModel.getMistakePatterns(userId);

    // Determine focus area
    const focusArea = this.determineFocusArea(learningInsights, mistakePatterns);

    // Determine difficulty level
    const difficultyLevel = this.determineDifficultyLevel(userStats.overall_accuracy, learningInsights.difficulty_trend);

    // Get recommended tags
    const recommendedTags = this.getRecommendedTags(focusArea, learningInsights, mistakePatterns);

    // Generate deck with recommendations
    const deckResult = await this.generateDeck({
      lang,
      level,
      exam,
      skill,
      size: 20,
      user_id: userId,
      tags: recommendedTags,
      difficulty_target: this.getDifficultyTarget(difficultyLevel)
    });

    return {
      items: deckResult.items,
      recommendation: {
        focus_area: focusArea,
        difficulty_level: difficultyLevel,
        estimated_duration: Math.ceil(deckResult.items.length * 3), // 3 seconds per item estimate
        next_pack_tags: recommendedTags,
        rationale: this.generateRecommendationRationale(focusArea, difficultyLevel, learningInsights)
      },
      estimated_difficulty: deckResult.estimated_difficulty
    };
  }

  // Private helper methods

  private validateSessionParams(params: CreateSessionParams): void {
    if (!params.user_id || params.user_id.trim() === '') {
      throw new Error('User ID is required');
    }
    if (!GAME_CONFIG.SUPPORTED_LANGUAGES.includes(params.lang)) {
      throw new Error('Invalid language');
    }
    if (!GAME_CONFIG.SUPPORTED_LEVELS.includes(params.level)) {
      throw new Error('Invalid level');
    }
    if (!GAME_CONFIG.SUPPORTED_EXAMS.includes(params.exam)) {
      throw new Error('Invalid exam provider');
    }
    if (!GAME_CONFIG.SUPPORTED_SKILLS.includes(params.skill)) {
      throw new Error('Invalid skill');
    }
    if (params.duration_s < GAME_CONFIG.MIN_SESSION_DURATION || params.duration_s > GAME_CONFIG.MAX_SESSION_DURATION) {
      throw new Error('Invalid session duration');
    }
  }

  private validateAnswerParams(params: SubmitAnswerParams): void {
    if (!params.session_id || !params.user_id || !params.item_id) {
      throw new Error('Missing required answer parameters');
    }
    if (!['apta', 'no_apta'].includes(params.user_choice)) {
      throw new Error('Invalid user choice');
    }
    if (params.latency_ms < 0 || params.latency_ms > 300000) { // 5 minutes max
      throw new Error('Invalid latency value');
    }
  }

  private isAnswerCorrect(userChoice: UserChoice, examSafe: boolean): boolean {
    return (userChoice === 'apta') === examSafe;
  }

  private calculateScoreDelta(correct: boolean, latencyMs: number): number {
    if (correct) {
      return SCORING_CONFIG.CORRECT_POINTS;
    } else {
      return SCORING_CONFIG.INCORRECT_POINTS;
    }
  }

  private detectSuspiciousBehavior(params: SubmitAnswerParams, correct: boolean): boolean {
    // Check for suspiciously fast responses
    if (params.latency_ms < SCORING_CONFIG.SUSPICIOUS_LATENCY_THRESHOLD_MS) {
      return true;
    }

    // Check for patterns that might indicate cheating
    // This would be expanded with more sophisticated detection logic
    return false;
  }

  private async getUserSkillLevel(
    userId: string,
    lang: Language,
    level: Level,
    exam: ExamProvider,
    skill: Skill
  ): Promise<number> {
    // Implementation would fetch from user_skill table or calculate from recent performance
    return ELO_CONFIG.DEFAULT_ELO;
  }

  private calculateTargetDifficulty(userSkillLevel: number): number {
    // Target difficulty slightly above user's current skill level for optimal challenge
    return userSkillLevel + 50;
  }

  private async getUserElo(
    userId: string,
    lang: Language,
    level: Level,
    exam: ExamProvider,
    skill: Skill
  ): Promise<number> {
    return ELO_CONFIG.DEFAULT_ELO; // Simplified for now
  }

  private async generateFeedback(
    item: SwipeItem,
    correct: boolean,
    userChoice: UserChoice
  ): Promise<{
    explanation: string;
    suggested_improvement?: string;
  }> {
    // Generate contextual feedback based on the item and user's choice
    if (correct) {
      return {
        explanation: `¡Correcto! "${item.term}" ${item.exam_safe ? 'es apropiado' : 'no es apropiado'} para contextos de examen formal.`
      };
    } else {
      return {
        explanation: `Incorrecto. "${item.term}" ${item.exam_safe ? 'es apropiado' : 'no es apropiado'} para contextos de examen formal.`,
        suggested_improvement: item.example ? `Considera este ejemplo: ${item.example}` : undefined
      };
    }
  }

  private async calculateSessionSummary(
    session: SwipeSession,
    answers: SwipeAnswer[],
    partialSummary?: Partial<SessionSummary>
  ): Promise<SessionSummary> {
    const correctAnswers = answers.filter(a => a.correct).length;
    const incorrectAnswers = answers.filter(a => !a.correct).length;
    const totalScore = answers.reduce((sum, a) => sum + a.score_delta, 0);
    const accuracy = answers.length > 0 ? (correctAnswers / answers.length) * 100 : 0;

    // Calculate streak
    let maxStreak = 0;
    let currentStreak = 0;
    for (const answer of answers) {
      if (answer.correct) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Calculate error buckets
    const errorBuckets: Record<string, number> = {};
    answers.filter(a => !a.correct).forEach(answer => {
      answer.tags.forEach(tag => {
        errorBuckets[tag] = (errorBuckets[tag] || 0) + 1;
      });
    });

    // Calculate items per minute
    const durationMinutes = answers.length > 0 ?
      (new Date(answers[answers.length - 1].answered_at).getTime() -
       new Date(answers[0].answered_at).getTime()) / (1000 * 60) : 1;
    const itemsPerMin = answers.length / durationMinutes;

    return {
      score_total: totalScore,
      answers_total: answers.length,
      correct: correctAnswers,
      incorrect: incorrectAnswers,
      accuracy_pct: accuracy,
      items_per_min: itemsPerMin,
      streak_max: maxStreak,
      error_buckets: errorBuckets,
      ...partialSummary
    };
  }

  private async generatePerformanceAnalysis(
    userId: string,
    summary: SessionSummary,
    answers: SwipeAnswer[]
  ): Promise<PerformanceAnalysis> {
    // Get user's historical data for comparison
    const userStats = await this.getUserStats(userId, '30d');

    // Determine performance level
    let levelAssessment: 'excellent' | 'good' | 'needs_improvement';
    if (summary.accuracy_pct >= 85) {
      levelAssessment = 'excellent';
    } else if (summary.accuracy_pct >= 70) {
      levelAssessment = 'good';
    } else {
      levelAssessment = 'needs_improvement';
    }

    // Analyze strengths and weaknesses
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    if (summary.accuracy_pct > userStats.overall_accuracy) {
      strengths.push('Improved accuracy compared to recent performance');
    }
    if (summary.items_per_min > 15) {
      strengths.push('Good response speed');
    }
    if (summary.streak_max >= 5) {
      strengths.push('Strong consistency in correct answers');
    }

    if (summary.accuracy_pct < 70) {
      improvementAreas.push('Focus on accuracy over speed');
    }
    if (Object.keys(summary.error_buckets).length > 0) {
      const topError = Object.entries(summary.error_buckets)
        .sort(([,a], [,b]) => b - a)[0];
      improvementAreas.push(`Review ${topError[0]} concepts`);
    }

    return {
      level_assessment: levelAssessment,
      strengths,
      improvement_areas: improvementAreas,
      difficulty_trend: summary.accuracy_pct > userStats.overall_accuracy ? 'increasing' : 'stable',
      consistency_score: summary.streak_max / Math.max(summary.answers_total, 1)
    };
  }

  private async generateRecommendations(
    userId: string,
    session: SwipeSession,
    summary: SessionSummary,
    analysis: PerformanceAnalysis
  ): Promise<GameRecommendations> {
    const recommendedTags = Object.keys(summary.error_buckets)
      .sort((a, b) => summary.error_buckets[b] - summary.error_buckets[a])
      .slice(0, 3);

    return {
      next_session_difficulty: analysis.level_assessment === 'excellent' ? 'hard' :
                              analysis.level_assessment === 'good' ? 'medium' : 'easy',
      recommended_focus: recommendedTags,
      estimated_improvement_time: '3-5 sessions',
      practice_frequency: 'daily',
      specific_areas: analysis.improvement_areas
    };
  }

  private async updateUserSkillLevel(
    userId: string,
    lang: Language,
    level: Level,
    exam: ExamProvider,
    skill: Skill,
    summary: SessionSummary
  ): Promise<void> {
    // Implementation would update the user_skill table
    // This is a placeholder for the ELO update logic
  }

  private async getUserAllSkillLevels(userId: string): Promise<Record<string, number>> {
    // Implementation would fetch all skill levels for the user
    return {};
  }

  private determineFocusArea(insights: any, mistakes: any[]): string {
    if (mistakes.length > 0) {
      return mistakes[0].pattern_type === 'systematic' ? 'systematic_errors' : 'recent_mistakes';
    }
    return 'general_practice';
  }

  private determineDifficultyLevel(accuracy: number, trend: string): 'easy' | 'medium' | 'hard' {
    if (accuracy >= 85 && trend === 'increasing') return 'hard';
    if (accuracy >= 70) return 'medium';
    return 'easy';
  }

  private getRecommendedTags(focusArea: string, insights: any, mistakes: any[]): string[] {
    if (mistakes.length > 0) {
      return mistakes.slice(0, 3).map(m => m.term);
    }
    return insights.recommended_focus || ['grammar', 'vocabulary'];
  }

  private getDifficultyTarget(level: 'easy' | 'medium' | 'hard'): number {
    switch (level) {
      case 'easy': return 1300;
      case 'medium': return 1500;
      case 'hard': return 1700;
    }
  }

  private generateRecommendationRationale(focusArea: string, difficulty: string, insights: any): string {
    return `Based on your recent performance, focusing on ${focusArea} at ${difficulty} level will help improve your understanding.`;
  }
}