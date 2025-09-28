/**
 * StudyPlannerService - Intelligent study planning and scheduling for Neolingus Academy
 * Generates personalized study schedules based on user progress, goals, and availability
 */

import {
  CourseComponent,
  ProgressState,
  ProgressValue,
  SkillArea,
  UserCourseProgress,
  UUID
} from '@/lib/types/user-course-progress';
import {
  ExamSession,
  ExamSessionState,
  ExamSessionType,
  ExamComponent,
  ImprovementSuggestion
} from '@/lib/types/exam-session';
import { Course, CourseLevel, CertificationType } from '@/lib/types/course';
import { progressService } from './progress-service';


// Study session types and priorities
export type StudySessionType =
  | 'concept_learning'   // New concept introduction
  | 'skill_practice'     // Targeted skill improvement
  | 'review'            // Revision of learned material
  | 'mock_exam'         // Full exam simulation
  | 'weakness_focus'    // Targeted weakness improvement
  | 'maintenance';      // Retention practice

export type StudyPriority = 'critical' | 'high' | 'medium' | 'low';
export type StudyDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive';
export type StudyIntensity = 'light' | 'moderate' | 'intensive' | 'exam_prep';

// User availability and preferences
export interface UserAvailability {
  // Weekly schedule (0 = Sunday, 6 = Saturday)
  weekly_schedule: {
    [day: number]: {
      available: boolean;
      time_slots: Array<{
        start_hour: number; // 0-23
        end_hour: number;   // 0-23
        intensity_preference: StudyIntensity;
      }>;
    };
  };

  // Total study hours per week
  target_hours_per_week: number;

  // Session preferences
  preferred_session_duration: number; // minutes
  max_session_duration: number;       // minutes
  min_break_duration: number;         // minutes

  // Learning preferences
  learning_style: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  difficulty_preference: 'challenging' | 'gradual' | 'adaptive';
  feedback_frequency: 'immediate' | 'end_of_session' | 'daily';

  // Timezone and locale
  timezone: string;
  locale: string;
}

// Study plan configuration
export interface StudyPlanConfig {
  // Target and timeline
  target_exam_date?: Date;
  target_proficiency_level: ProgressValue;
  weekly_commitment_hours: number;

  // Plan characteristics
  plan_duration_weeks: number;
  adaptive_scheduling: boolean;
  include_mock_exams: boolean;
  weakness_focus_ratio: number; // 0.0-1.0
  review_frequency_days: number;

  // Intensity and pacing
  study_intensity: StudyIntensity;
  progressive_difficulty: boolean;
  spaced_repetition: boolean;

  // Exam preparation
  mock_exam_frequency_weeks: number;
  exam_prep_weeks_before: number;
  skills_balance_strategy: 'balanced' | 'weakness_focused' | 'strength_based';
}

// Individual study session
export interface StudySession {
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  progress_id: UUID;

  // Session scheduling
  scheduled_date: Date;
  scheduled_duration_minutes: number;
  estimated_duration_minutes: number;

  // Session content
  session_type: StudySessionType;
  primary_component: CourseComponent;
  secondary_components?: CourseComponent[];

  // Session characteristics
  priority: StudyPriority;
  difficulty: StudyDifficulty;
  intensity: StudyIntensity;

  // Learning objectives
  learning_objectives: string[];
  success_criteria: Array<{
    metric: string;
    target_value: number;
    weight: number;
  }>;

  // Content and resources
  recommended_activities: Array<{
    activity_type: 'reading' | 'listening' | 'writing' | 'speaking' | 'quiz' | 'exercise';
    description: string;
    duration_minutes: number;
    difficulty: StudyDifficulty;
    resources?: string[];
  }>;

  // Dependencies and prerequisites
  prerequisite_sessions?: UUID[];
  blocks_future_sessions?: UUID[];

  // Tracking
  completion_status: 'scheduled' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  actual_start_time?: Date;
  actual_end_time?: Date;
  actual_duration_minutes?: number;

  // Results
  completion_score?: ProgressValue;
  engagement_score?: ProgressValue;
  learning_effectiveness?: ProgressValue;
  user_satisfaction?: number; // 1-5 rating

  // AI feedback and adaptation
  ai_feedback?: string;
  next_session_recommendations?: string[];

  // Metadata
  created_at: Date;
  updated_at: Date;
}

// Complete study plan
export interface StudyPlan {
  id: UUID;
  user_id: UUID;
  course_id: UUID;
  progress_id: UUID;

  // Plan overview
  plan_name: string;
  plan_description: string;
  plan_config: StudyPlanConfig;
  user_availability: UserAvailability;

  // Timeline
  start_date: Date;
  target_completion_date: Date;
  estimated_completion_date: Date;

  // Sessions
  study_sessions: StudySession[];
  total_planned_hours: number;
  completed_hours: number;

  // Progress tracking
  plan_progress: ProgressValue;
  milestone_completion: Array<{
    milestone_name: string;
    target_date: Date;
    completion_date?: Date;
    completion_score?: ProgressValue;
    is_achieved: boolean;
  }>;

  // Adaptive elements
  effectiveness_score: ProgressValue;
  adherence_rate: ProgressValue;
  adaptation_history: Array<{
    date: Date;
    reason: string;
    changes_made: string[];
    impact_assessment: string;
  }>;

  // Status
  is_active: boolean;
  plan_status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

  // Metadata
  created_at: Date;
  updated_at: Date;
}

// Study planner analytics
export interface StudyPlanAnalytics {
  // Effectiveness metrics
  overall_effectiveness: ProgressValue;
  session_completion_rate: ProgressValue;
  learning_velocity: number; // progress per hour
  retention_rate: ProgressValue;

  // Component analysis
  component_progress: Record<CourseComponent, {
    progress: ProgressValue;
    time_invested: number;
    effectiveness: ProgressValue;
    projected_completion: Date;
  }>;

  // Time analysis
  total_study_time_hours: number;
  average_session_duration: number;
  optimal_session_duration: number;
  peak_performance_times: Array<{
    day_of_week: number;
    hour_of_day: number;
    effectiveness_score: ProgressValue;
  }>;

  // Adherence analysis
  schedule_adherence_rate: ProgressValue;
  missed_sessions_count: number;
  rescheduled_sessions_count: number;
  consistency_score: ProgressValue;

  // Predictive insights
  projected_exam_readiness: ProgressValue;
  recommended_adjustments: string[];
  risk_factors: Array<{
    factor: string;
    severity: 'low' | 'medium' | 'high';
    mitigation_strategy: string;
  }>;
}

/**
 * Main StudyPlannerService class
 * Provides intelligent study planning and scheduling capabilities
 */
export class StudyPlannerService {

  /**
   * Creates a personalized study plan based on user progress, goals, and availability
   */
  async createStudyPlan(
    userId: UUID,
    courseId: UUID,
    progressId: UUID,
    config: StudyPlanConfig,
    availability: UserAvailability,
    currentProgress: UserCourseProgress,
    recentSessions: ExamSession[]
  ): Promise<StudyPlan> {
    // Analyze current state
    const analysis = await this.analyzeCurrentState(currentProgress, recentSessions);

    // Calculate timeline and milestones
    const timeline = this.calculateOptimalTimeline(config, availability, analysis);

    // Generate study sessions
    const sessions = await this.generateStudySessions(
      config,
      availability,
      timeline,
      analysis,
      currentProgress
    );

    // Create plan structure
    const plan: StudyPlan = {
      id: crypto.randomUUID(),
      user_id: userId,
      course_id: courseId,
      progress_id: progressId,
      plan_name: this.generatePlanName(config, currentProgress),
      plan_description: this.generatePlanDescription(config, analysis),
      plan_config: config,
      user_availability: availability,
      start_date: new Date(),
      target_completion_date: config.target_exam_date || timeline.estimated_completion,
      estimated_completion_date: timeline.estimated_completion,
      study_sessions: sessions,
      total_planned_hours: sessions.reduce((sum, s) => sum + s.estimated_duration_minutes / 60, 0),
      completed_hours: 0,
      plan_progress: 0.0,
      milestone_completion: timeline.milestones,
      effectiveness_score: 0.8, // Default initial score
      adherence_rate: 1.0,      // Start optimistic
      adaptation_history: [],
      is_active: true,
      plan_status: 'draft',
      created_at: new Date(),
      updated_at: new Date()
    };

    return plan;
  }

  /**
   * Adapts an existing study plan based on progress and performance
   */
  async adaptStudyPlan(
    plan: StudyPlan,
    currentProgress: UserCourseProgress,
    recentSessions: ExamSession[],
    analytics: StudyPlanAnalytics
  ): Promise<StudyPlan> {
    // Analyze adaptation needs
    const adaptationNeeds = this.analyzeAdaptationNeeds(plan, currentProgress, analytics);

    if (adaptationNeeds.requires_major_revision) {
      return this.majorPlanRevision(plan, adaptationNeeds, currentProgress);
    } else {
      return this.minorPlanAdjustment(plan, adaptationNeeds, analytics);
    }
  }

  /**
   * Schedules the next optimal study session for a user
   */
  async scheduleNextSession(
    plan: StudyPlan,
    currentProgress: UserCourseProgress,
    completedSessions: StudySession[]
  ): Promise<StudySession | null> {
    // Find next unscheduled session
    const nextSession = plan.study_sessions.find(
      s => s.completion_status === 'scheduled' &&
           this.arePrerequisitesMet(s, completedSessions)
    );

    if (!nextSession) return null;

    // Optimize session timing
    const optimalTime = this.findOptimalSessionTime(
      nextSession,
      plan.user_availability,
      completedSessions
    );

    // Update session with optimal scheduling
    return {
      ...nextSession,
      scheduled_date: optimalTime.start_time,
      estimated_duration_minutes: optimalTime.duration_minutes,
      updated_at: new Date()
    };
  }

  /**
   * Analyzes study plan effectiveness and provides recommendations
   */
  async analyzeStudyPlanEffectiveness(
    plan: StudyPlan,
    completedSessions: StudySession[],
    currentProgress: UserCourseProgress
  ): Promise<StudyPlanAnalytics> {
    // Calculate effectiveness metrics
    const effectiveness = this.calculateEffectivenessMetrics(
      plan,
      completedSessions,
      currentProgress
    );

    // Analyze component progress
    const componentAnalysis = this.analyzeComponentProgress(
      completedSessions,
      currentProgress
    );

    // Time analysis
    const timeAnalysis = this.analyzeTimeUtilization(completedSessions, plan);

    // Adherence analysis
    const adherenceAnalysis = this.analyzeScheduleAdherence(
      plan.study_sessions,
      completedSessions
    );

    // Generate predictive insights
    const insights = this.generatePredictiveInsights(
      plan,
      effectiveness,
      currentProgress
    );

    return {
      overall_effectiveness: effectiveness.overall,
      session_completion_rate: adherenceAnalysis.completion_rate,
      learning_velocity: effectiveness.learning_velocity,
      retention_rate: effectiveness.retention_rate,
      component_progress: componentAnalysis,
      total_study_time_hours: timeAnalysis.total_hours,
      average_session_duration: timeAnalysis.average_duration,
      optimal_session_duration: timeAnalysis.optimal_duration,
      peak_performance_times: timeAnalysis.peak_times,
      schedule_adherence_rate: adherenceAnalysis.adherence_rate,
      missed_sessions_count: adherenceAnalysis.missed_count,
      rescheduled_sessions_count: adherenceAnalysis.rescheduled_count,
      consistency_score: adherenceAnalysis.consistency,
      projected_exam_readiness: insights.exam_readiness,
      recommended_adjustments: insights.recommendations,
      risk_factors: insights.risk_factors
    };
  }

  /**
   * Integrates with existing progress tracking system
   */
  async syncWithProgressService(
    userId: UUID,
    courseId: UUID
  ): Promise<UserCourseProgress> {
    try {
      return await progressService.getUserProgress(userId, courseId);
    } catch (error) {
      console.error('Failed to sync with progress service:', error);
      throw new Error('Unable to sync with progress tracking system');
    }
  }

  /**
   * Updates progress after study session completion
   */
  async updateProgressAfterSession(
    session: StudySession,
    operatorUserId: string
  ): Promise<UserCourseProgress> {
    try {
      const progressUpdate = this.convertSessionToProgressUpdate(session);
      return await progressService.updateUserProgress(
        session.user_id,
        session.course_id,
        progressUpdate,
        operatorUserId
      );
    } catch (error) {
      console.error('Failed to update progress after session:', error);
      throw new Error('Unable to update progress tracking');
    }
  }

  /**
   * Generates study plan analytics using progress service
   */
  async generateStudyPlanWithProgressAnalytics(
    userId: UUID,
    courseId: UUID,
    config: StudyPlanConfig,
    availability: UserAvailability
  ): Promise<StudyPlan> {
    try {
      // Get current progress using progress service
      const currentProgress = await this.syncWithProgressService(userId, courseId);

      // Generate analytics
      const analytics = await progressService.generateProgressAnalytics({
        user_id: userId,
        course_id: courseId,
        analytics_type: 'comprehensive',
        include_benchmarks: true,
        include_recommendations: true
      });

      // Convert analytics to study plan format
      const recentSessions: ExamSession[] = []; // Would get from exam service

      return this.createStudyPlan(
        userId,
        courseId,
        currentProgress.id,
        config,
        availability,
        currentProgress,
        recentSessions
      );
    } catch (error) {
      console.error('Failed to generate study plan with analytics:', error);
      throw new Error('Unable to generate study plan with progress analytics');
    }
  }

  /**
   * Generates spaced repetition schedule for learned content
   */
  generateSpacedRepetitionSchedule(
    completedSessions: StudySession[],
    currentProgress: UserCourseProgress
  ): StudySession[] {
    const repetitionSessions: StudySession[] = [];

    // Analyze content that needs reinforcement
    const contentToReview = this.identifyContentForReview(
      completedSessions,
      currentProgress
    );

    // Generate spaced repetition intervals (1 day, 3 days, 7 days, 14 days, 30 days)
    const intervals = [1, 3, 7, 14, 30];

    contentToReview.forEach(content => {
      intervals.forEach((dayInterval, index) => {
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + dayInterval);

        const reviewSession: StudySession = {
          id: crypto.randomUUID(),
          user_id: content.user_id,
          course_id: content.course_id,
          progress_id: content.progress_id,
          scheduled_date: scheduledDate,
          scheduled_duration_minutes: Math.max(15, content.original_duration * 0.3),
          estimated_duration_minutes: Math.max(15, content.original_duration * 0.3),
          session_type: 'review',
          primary_component: content.component,
          priority: this.calculateReviewPriority(content, index),
          difficulty: 'easy', // Reviews should be easier
          intensity: 'light',
          learning_objectives: [`Review ${content.topic}`, `Reinforce understanding`],
          success_criteria: [{
            metric: 'retention_accuracy',
            target_value: 0.85,
            weight: 1.0
          }],
          recommended_activities: [{
            activity_type: 'quiz',
            description: `Quick review quiz: ${content.topic}`,
            duration_minutes: Math.max(10, content.original_duration * 0.2),
            difficulty: 'easy'
          }],
          completion_status: 'scheduled',
          created_at: new Date(),
          updated_at: new Date()
        };

        repetitionSessions.push(reviewSession);
      });
    });

    return repetitionSessions.sort((a, b) =>
      a.scheduled_date.getTime() - b.scheduled_date.getTime()
    );
  }

  // Private helper methods

  /**
   * Converts study session results to progress update format
   */
  private convertSessionToProgressUpdate(session: StudySession) {
    const componentProgress: Record<string, number> = {};

    // Update primary component progress based on session completion
    if (session.completion_score !== undefined) {
      componentProgress[session.primary_component] = session.completion_score;
    }

    // Include secondary components if applicable
    if (session.secondary_components && session.completion_score !== undefined) {
      session.secondary_components.forEach(component => {
        componentProgress[component] = session.completion_score! * 0.8; // Slightly lower for secondary
      });
    }

    return {
      component_progress: componentProgress,
      last_activity: session.actual_end_time || new Date()
    };
  }

  private async analyzeCurrentState(
    progress: UserCourseProgress,
    recentSessions: ExamSession[]
  ) {
    return {
      overall_proficiency: progress.overall_progress,
      component_strengths: progress.strengths,
      component_weaknesses: progress.weaknesses,
      learning_velocity: this.calculateLearningVelocity(recentSessions),
      engagement_pattern: this.analyzeEngagementPattern(recentSessions),
      difficulty_tolerance: this.assessDifficultyTolerance(recentSessions)
    };
  }

  private calculateOptimalTimeline(
    config: StudyPlanConfig,
    availability: UserAvailability,
    analysis: any
  ) {
    const weeksAvailable = config.target_exam_date ?
      Math.ceil((config.target_exam_date.getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)) :
      config.plan_duration_weeks;

    const totalHoursNeeded = this.estimateTotalHoursNeeded(config, analysis);
    const weeklyHours = Math.min(
      config.weekly_commitment_hours,
      availability.target_hours_per_week
    );

    const estimatedWeeks = Math.ceil(totalHoursNeeded / weeklyHours);
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + estimatedWeeks * 7);

    return {
      estimated_completion: estimatedCompletion,
      total_hours_needed: totalHoursNeeded,
      weekly_hours: weeklyHours,
      milestones: this.generateMilestones(weeksAvailable, config)
    };
  }

  private async generateStudySessions(
    config: StudyPlanConfig,
    availability: UserAvailability,
    timeline: any,
    analysis: any,
    progress: UserCourseProgress
  ): Promise<StudySession[]> {
    const sessions: StudySession[] = [];
    const components = Object.keys(progress.component_progress) as CourseComponent[];

    // Generate session distribution based on weaknesses and goals
    const sessionDistribution = this.calculateSessionDistribution(
      components,
      progress,
      config
    );

    let currentDate = new Date();

    // Generate sessions for each week
    for (let week = 0; week < timeline.estimated_completion.getTime() / (7 * 24 * 60 * 60 * 1000); week++) {
      const weekSessions = this.generateWeekSessions(
        sessionDistribution,
        availability,
        currentDate,
        config,
        analysis
      );

      sessions.push(...weekSessions);
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return sessions;
  }

  private generatePlanName(config: StudyPlanConfig, progress: UserCourseProgress): string {
    const intensity = config.study_intensity;
    const weeks = config.plan_duration_weeks;
    return `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} Study Plan - ${weeks} weeks`;
  }

  private generatePlanDescription(config: StudyPlanConfig, analysis: any): string {
    const targetLevel = Math.round(config.target_proficiency_level * 100);
    const hoursPerWeek = config.weekly_commitment_hours;

    return `Personalized study plan targeting ${targetLevel}% proficiency with ${hoursPerWeek} hours per week. ` +
           `Focus areas: ${analysis.component_weaknesses.map((w: SkillArea) => w.component).join(', ')}.`;
  }

  private calculateLearningVelocity(sessions: ExamSession[]): number {
    if (sessions.length < 2) return 0.5; // Default moderate velocity

    const recentSessions = sessions.slice(-5); // Last 5 sessions
    const scores = recentSessions.map(s => s.score);

    // Calculate trend in scores over time
    let velocitySum = 0;
    for (let i = 1; i < scores.length; i++) {
      velocitySum += scores[i] - scores[i - 1];
    }

    return Math.max(0.1, Math.min(1.0, 0.5 + velocitySum / (scores.length - 1)));
  }

  private analyzeEngagementPattern(sessions: ExamSession[]): 'high' | 'medium' | 'low' {
    if (sessions.length === 0) return 'medium';

    const avgDuration = sessions.reduce((sum, s) => sum + s.duration_seconds, 0) / sessions.length;
    const avgScore = sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;

    if (avgDuration > 3600 && avgScore > 0.7) return 'high';
    if (avgDuration > 1800 && avgScore > 0.5) return 'medium';
    return 'low';
  }

  private assessDifficultyTolerance(sessions: ExamSession[]): StudyDifficulty {
    if (sessions.length === 0) return 'medium';

    const avgScore = sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length;
    const completionRate = sessions.filter(s => s.current_state === 'completed').length / sessions.length;

    if (avgScore > 0.8 && completionRate > 0.9) return 'hard';
    if (avgScore > 0.6 && completionRate > 0.8) return 'medium';
    return 'easy';
  }

  private estimateTotalHoursNeeded(config: StudyPlanConfig, analysis: any): number {
    const baseHours = 120; // Base hours for typical language course
    const proficiencyMultiplier = config.target_proficiency_level;
    const weaknessMultiplier = 1 + (analysis.component_weaknesses.length * 0.1);

    return baseHours * proficiencyMultiplier * weaknessMultiplier;
  }

  private generateMilestones(weeks: number, config: StudyPlanConfig) {
    const milestones = [];
    const quarterPoints = [0.25, 0.5, 0.75, 1.0];

    quarterPoints.forEach((progress, index) => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + Math.floor(weeks * 7 * progress));

      milestones.push({
        milestone_name: `Milestone ${index + 1}`,
        target_date: targetDate,
        completion_score: progress * config.target_proficiency_level,
        is_achieved: false
      });
    });

    return milestones;
  }

  private calculateSessionDistribution(
    components: CourseComponent[],
    progress: UserCourseProgress,
    config: StudyPlanConfig
  ) {
    const distribution: Record<CourseComponent, number> = {} as Record<CourseComponent, number>;
    const weaknessRatio = config.weakness_focus_ratio;

    components.forEach(component => {
      const currentProgress = progress.component_progress[component] || 0;
      const isWeak = progress.weaknesses.some(w => w.component === component);

      // Base allocation
      let allocation = 1.0 / components.length;

      // Increase allocation for weak areas
      if (isWeak) {
        allocation *= (1 + weaknessRatio);
      }

      // Decrease allocation for strong areas
      if (currentProgress > 0.8) {
        allocation *= 0.7;
      }

      distribution[component] = allocation;
    });

    return distribution;
  }

  private generateWeekSessions(
    distribution: Record<CourseComponent, number>,
    availability: UserAvailability,
    weekStartDate: Date,
    config: StudyPlanConfig,
    analysis: any
  ): StudySession[] {
    const sessions: StudySession[] = [];
    const totalWeeklyHours = config.weekly_commitment_hours;

    Object.entries(distribution).forEach(([component, ratio]) => {
      const componentHours = totalWeeklyHours * ratio;
      const sessionCount = Math.ceil(componentHours / (availability.preferred_session_duration / 60));

      for (let i = 0; i < sessionCount; i++) {
        const sessionDate = new Date(weekStartDate);
        sessionDate.setDate(sessionDate.getDate() + i * 2); // Spread across week

        const session: StudySession = {
          id: crypto.randomUUID(),
          user_id: '', // Will be set by caller
          course_id: '', // Will be set by caller
          progress_id: '', // Will be set by caller
          scheduled_date: sessionDate,
          scheduled_duration_minutes: availability.preferred_session_duration,
          estimated_duration_minutes: availability.preferred_session_duration,
          session_type: this.determineSessionType(component as CourseComponent, analysis),
          primary_component: component as CourseComponent,
          priority: this.determineSessionPriority(component as CourseComponent, analysis),
          difficulty: this.determineSessionDifficulty(component as CourseComponent, analysis),
          intensity: config.study_intensity,
          learning_objectives: this.generateLearningObjectives(component as CourseComponent),
          success_criteria: this.generateSuccessCriteria(component as CourseComponent),
          recommended_activities: this.generateRecommendedActivities(component as CourseComponent),
          completion_status: 'scheduled',
          created_at: new Date(),
          updated_at: new Date()
        };

        sessions.push(session);
      }
    });

    return sessions;
  }

  private determineSessionType(component: CourseComponent, analysis: any): StudySessionType {
    const isWeak = analysis.component_weaknesses.some((w: SkillArea) => w.component === component);

    if (isWeak) return 'weakness_focus';
    if (Math.random() > 0.7) return 'mock_exam'; // 30% chance for variety
    return 'skill_practice';
  }

  private determineSessionPriority(component: CourseComponent, analysis: any): StudyPriority {
    const isWeak = analysis.component_weaknesses.some((w: SkillArea) => w.component === component);
    const isStrong = analysis.component_strengths.some((s: SkillArea) => s.component === component);

    if (isWeak) return 'high';
    if (isStrong) return 'low';
    return 'medium';
  }

  private determineSessionDifficulty(component: CourseComponent, analysis: any): StudyDifficulty {
    return analysis.difficulty_tolerance || 'medium';
  }

  private generateLearningObjectives(component: CourseComponent): string[] {
    const objectives: Record<CourseComponent, string[]> = {
      reading: ['Improve reading comprehension', 'Increase vocabulary'],
      writing: ['Enhance written expression', 'Improve grammar accuracy'],
      listening: ['Better audio comprehension', 'Recognize speech patterns'],
      speaking: ['Improve fluency', 'Enhance pronunciation'],
      grammar: ['Master grammar rules', 'Apply structures correctly'],
      vocabulary: ['Expand vocabulary range', 'Improve word usage'],
      pronunciation: ['Correct sound production', 'Improve intonation'],
      comprehension: ['Better overall understanding', 'Integrate skills']
    };

    return objectives[component] || ['General skill improvement'];
  }

  private generateSuccessCriteria(component: CourseComponent): Array<{ metric: string; target_value: number; weight: number; }> {
    return [{
      metric: `${component}_accuracy`,
      target_value: 0.75,
      weight: 1.0
    }];
  }

  private generateRecommendedActivities(component: CourseComponent) {
    const activities: Record<CourseComponent, any[]> = {
      reading: [{ activity_type: 'reading', description: 'Reading comprehension practice', duration_minutes: 30, difficulty: 'medium' }],
      writing: [{ activity_type: 'writing', description: 'Writing exercise', duration_minutes: 45, difficulty: 'medium' }],
      listening: [{ activity_type: 'listening', description: 'Audio comprehension', duration_minutes: 25, difficulty: 'medium' }],
      speaking: [{ activity_type: 'speaking', description: 'Speaking practice', duration_minutes: 20, difficulty: 'medium' }],
      grammar: [{ activity_type: 'quiz', description: 'Grammar exercises', duration_minutes: 30, difficulty: 'medium' }],
      vocabulary: [{ activity_type: 'quiz', description: 'Vocabulary building', duration_minutes: 20, difficulty: 'medium' }],
      pronunciation: [{ activity_type: 'speaking', description: 'Pronunciation drills', duration_minutes: 15, difficulty: 'medium' }],
      comprehension: [{ activity_type: 'exercise', description: 'Mixed skills practice', duration_minutes: 40, difficulty: 'medium' }]
    };

    return activities[component] || [{ activity_type: 'exercise', description: 'General practice', duration_minutes: 30, difficulty: 'medium' }];
  }

  private analyzeAdaptationNeeds(
    plan: StudyPlan,
    currentProgress: UserCourseProgress,
    analytics: StudyPlanAnalytics
  ) {
    const requiresMajorRevision =
      analytics.schedule_adherence_rate < 0.6 ||
      analytics.overall_effectiveness < 0.5 ||
      analytics.projected_exam_readiness < 0.7;

    return {
      requires_major_revision: requiresMajorRevision,
      adherence_issues: analytics.schedule_adherence_rate < 0.8,
      effectiveness_issues: analytics.overall_effectiveness < 0.7,
      pace_issues: analytics.learning_velocity < 0.3
    };
  }

  private async majorPlanRevision(
    plan: StudyPlan,
    adaptationNeeds: any,
    currentProgress: UserCourseProgress
  ): Promise<StudyPlan> {
    // Create a new plan with adjusted parameters
    const revisedConfig = { ...plan.plan_config };

    if (adaptationNeeds.pace_issues) {
      revisedConfig.weekly_commitment_hours *= 1.2; // Increase study time
      revisedConfig.study_intensity = 'intensive';
    }

    if (adaptationNeeds.effectiveness_issues) {
      revisedConfig.weakness_focus_ratio = 0.7; // Focus more on weaknesses
      revisedConfig.difficulty_preference = 'adaptive';
    }

    return this.createStudyPlan(
      plan.user_id,
      plan.course_id,
      plan.progress_id,
      revisedConfig,
      plan.user_availability,
      currentProgress,
      []
    );
  }

  private minorPlanAdjustment(
    plan: StudyPlan,
    adaptationNeeds: any,
    analytics: StudyPlanAnalytics
  ): StudyPlan {
    const adjustedPlan = { ...plan };

    // Adjust upcoming sessions based on performance
    adjustedPlan.study_sessions = plan.study_sessions.map(session => {
      if (session.completion_status === 'scheduled') {
        // Adjust difficulty based on recent performance
        if (analytics.overall_effectiveness > 0.8) {
          session.difficulty = 'hard';
        } else if (analytics.overall_effectiveness < 0.6) {
          session.difficulty = 'easy';
        }

        // Adjust session length based on engagement
        if (analytics.average_session_duration > session.scheduled_duration_minutes * 1.2) {
          session.estimated_duration_minutes *= 1.1;
        }
      }

      return session;
    });

    adjustedPlan.updated_at = new Date();
    return adjustedPlan;
  }

  private arePrerequisitesMet(session: StudySession, completedSessions: StudySession[]): boolean {
    if (!session.prerequisite_sessions || session.prerequisite_sessions.length === 0) {
      return true;
    }

    const completedIds = new Set(completedSessions.map(s => s.id));
    return session.prerequisite_sessions.every(prereqId => completedIds.has(prereqId));
  }

  private findOptimalSessionTime(
    session: StudySession,
    availability: UserAvailability,
    completedSessions: StudySession[]
  ) {
    // Find the best time slot based on historical performance and availability
    const dayOfWeek = session.scheduled_date.getDay();
    const daySchedule = availability.weekly_schedule[dayOfWeek];

    if (!daySchedule || !daySchedule.available) {
      // Find next available day
      for (let i = 1; i <= 7; i++) {
        const nextDay = (dayOfWeek + i) % 7;
        if (availability.weekly_schedule[nextDay]?.available) {
          const nextDate = new Date(session.scheduled_date);
          nextDate.setDate(nextDate.getDate() + i);

          return {
            start_time: nextDate,
            duration_minutes: session.estimated_duration_minutes
          };
        }
      }
    }

    // Use the scheduled time if day is available
    return {
      start_time: session.scheduled_date,
      duration_minutes: session.estimated_duration_minutes
    };
  }

  private calculateEffectivenessMetrics(
    plan: StudyPlan,
    completedSessions: StudySession[],
    currentProgress: UserCourseProgress
  ) {
    const totalSessions = completedSessions.length;
    if (totalSessions === 0) {
      return {
        overall: 0.5,
        learning_velocity: 0.5,
        retention_rate: 0.8
      };
    }

    const avgCompletionScore = completedSessions.reduce((sum, s) =>
      sum + (s.completion_score || 0), 0) / totalSessions;

    const avgEngagement = completedSessions.reduce((sum, s) =>
      sum + (s.engagement_score || 0), 0) / totalSessions;

    return {
      overall: (avgCompletionScore + avgEngagement) / 2,
      learning_velocity: this.calculateLearningVelocity([]), // Would need exam sessions
      retention_rate: avgCompletionScore * 1.1 // Estimate retention from completion
    };
  }

  private analyzeComponentProgress(
    completedSessions: StudySession[],
    currentProgress: UserCourseProgress
  ) {
    const componentAnalysis: Record<CourseComponent, any> = {} as Record<CourseComponent, any>;

    Object.keys(currentProgress.component_progress).forEach(component => {
      const componentSessions = completedSessions.filter(s =>
        s.primary_component === component as CourseComponent
      );

      const timeInvested = componentSessions.reduce((sum, s) =>
        sum + (s.actual_duration_minutes || s.estimated_duration_minutes), 0) / 60;

      const avgEffectiveness = componentSessions.length > 0 ?
        componentSessions.reduce((sum, s) => sum + (s.learning_effectiveness || 0.7), 0) / componentSessions.length :
        0.7;

      componentAnalysis[component as CourseComponent] = {
        progress: currentProgress.component_progress[component as CourseComponent],
        time_invested: timeInvested,
        effectiveness: avgEffectiveness,
        projected_completion: new Date() // Would calculate based on velocity
      };
    });

    return componentAnalysis;
  }

  private analyzeTimeUtilization(completedSessions: StudySession[], plan: StudyPlan) {
    const totalHours = completedSessions.reduce((sum, s) =>
      sum + (s.actual_duration_minutes || s.estimated_duration_minutes), 0) / 60;

    const avgDuration = completedSessions.length > 0 ?
      completedSessions.reduce((sum, s) =>
        sum + (s.actual_duration_minutes || s.estimated_duration_minutes), 0) / completedSessions.length :
      plan.user_availability.preferred_session_duration;

    return {
      total_hours: totalHours,
      average_duration: avgDuration,
      optimal_duration: plan.user_availability.preferred_session_duration,
      peak_times: [] // Would analyze performance by time of day
    };
  }

  private analyzeScheduleAdherence(
    plannedSessions: StudySession[],
    completedSessions: StudySession[]
  ) {
    const totalPlanned = plannedSessions.length;
    const totalCompleted = completedSessions.length;
    const missed = plannedSessions.filter(s => s.completion_status === 'skipped').length;
    const rescheduled = plannedSessions.filter(s => s.completion_status === 'rescheduled').length;

    return {
      completion_rate: totalPlanned > 0 ? totalCompleted / totalPlanned : 0,
      adherence_rate: totalPlanned > 0 ? (totalCompleted + rescheduled) / totalPlanned : 0,
      missed_count: missed,
      rescheduled_count: rescheduled,
      consistency: Math.max(0, 1 - (missed + rescheduled * 0.5) / totalPlanned)
    };
  }

  private generatePredictiveInsights(
    plan: StudyPlan,
    effectiveness: any,
    currentProgress: UserCourseProgress
  ) {
    const examReadiness = Math.min(1.0,
      currentProgress.overall_progress * effectiveness.overall * 1.2
    );

    const recommendations = [];
    if (effectiveness.overall < 0.7) {
      recommendations.push('Consider reducing session difficulty');
    }
    if (currentProgress.overall_progress < 0.5) {
      recommendations.push('Increase study time for weak components');
    }

    return {
      exam_readiness: examReadiness,
      recommendations,
      risk_factors: examReadiness < 0.8 ? [{
        factor: 'Low exam readiness',
        severity: 'high' as const,
        mitigation_strategy: 'Increase study intensity and focus on weak areas'
      }] : []
    };
  }

  private identifyContentForReview(
    completedSessions: StudySession[],
    currentProgress: UserCourseProgress
  ) {
    return completedSessions
      .filter(s => s.completion_score && s.completion_score > 0.7) // Only review successful sessions
      .map(s => ({
        user_id: s.user_id,
        course_id: s.course_id,
        progress_id: s.progress_id,
        component: s.primary_component,
        topic: s.learning_objectives[0] || 'General review',
        original_duration: s.actual_duration_minutes || s.estimated_duration_minutes,
        completion_date: s.actual_end_time || s.created_at
      }))
      .slice(-10); // Last 10 successful sessions
  }

  private calculateReviewPriority(content: any, intervalIndex: number): StudyPriority {
    if (intervalIndex === 0) return 'high';    // 1 day - high priority
    if (intervalIndex === 1) return 'medium';  // 3 days - medium priority
    return 'low';                              // 7+ days - low priority
  }
}

// Export additional utility functions
export function createDefaultUserAvailability(): UserAvailability {
  return {
    weekly_schedule: {
      0: { available: false, time_slots: [] }, // Sunday
      1: { available: true, time_slots: [{ start_hour: 18, end_hour: 20, intensity_preference: 'moderate' }] }, // Monday
      2: { available: true, time_slots: [{ start_hour: 18, end_hour: 20, intensity_preference: 'moderate' }] }, // Tuesday
      3: { available: true, time_slots: [{ start_hour: 18, end_hour: 20, intensity_preference: 'moderate' }] }, // Wednesday
      4: { available: true, time_slots: [{ start_hour: 18, end_hour: 20, intensity_preference: 'moderate' }] }, // Thursday
      5: { available: true, time_slots: [{ start_hour: 18, end_hour: 20, intensity_preference: 'moderate' }] }, // Friday
      6: { available: true, time_slots: [{ start_hour: 9, end_hour: 12, intensity_preference: 'intensive' }] }   // Saturday
    },
    target_hours_per_week: 8,
    preferred_session_duration: 60, // 1 hour
    max_session_duration: 120,      // 2 hours
    min_break_duration: 15,         // 15 minutes
    learning_style: 'mixed',
    difficulty_preference: 'adaptive',
    feedback_frequency: 'immediate',
    timezone: 'Europe/Madrid',
    locale: 'es-ES'
  };
}

export function createDefaultStudyPlanConfig(): StudyPlanConfig {
  return {
    target_proficiency_level: 0.8,
    weekly_commitment_hours: 8,
    plan_duration_weeks: 12,
    adaptive_scheduling: true,
    include_mock_exams: true,
    weakness_focus_ratio: 0.4,
    review_frequency_days: 7,
    study_intensity: 'moderate',
    progressive_difficulty: true,
    spaced_repetition: true,
    mock_exam_frequency_weeks: 2,
    exam_prep_weeks_before: 4,
    skills_balance_strategy: 'weakness_focused'
  };
}