/**
 * Study Recommendations Engine
 * Neolingus Academy Analytics System
 * 
 * Advanced recommendation engine that generates personalized study plans
 * based on performance analytics, weakness detection, and learning patterns
 */

import {
  UserProgress,
  ProgressAnalytics,
  ComponentAnalysis,
  ExamSession,
  Component,
  Level,
  QuestionType,
} from "@/lib/exam-engine/types";
import { WeaknessAnalysis, WeaknessDetail } from "./weakness-detection";
import { ReadinessAssessment } from "./readiness-score";

// Recommendation types
export type RecommendationType =
  | "study_plan"
  | "practice_session"
  | "skill_focus"
  | "resource"
  | "time_management"
  | "motivation"
  | "exam_strategy"
  | "review_session";

export type RecommendationPriority = "critical" | "high" | "medium" | "low";
export type RecommendationDifficulty = "beginner" | "intermediate" | "advanced" | "adaptive";

// Individual recommendation
export interface StudyRecommendation {
  id: string;
  type: RecommendationType;
  priority: RecommendationPriority;
  title: string;
  description: string;
  rationale: string; // Why this recommendation was made
  actionItems: RecommendationAction[];
  resources: StudyResource[];
  timeEstimate: TimeEstimate;
  expectedOutcomes: ExpectedOutcome[];
  prerequisites: string[];
  targetComponents: Component[];
  difficulty: RecommendationDifficulty;
  confidence: number; // 0.0 to 1.0
  tags: string[];
  createdAt: Date;
  validUntil: Date;
  metadata: RecommendationMetadata;
}

export interface RecommendationAction {
  action: string;
  description: string;
  timeRequired: number; // minutes
  frequency: string; // "daily", "weekly", "once"
  order: number;
  isOptional: boolean;
  successCriteria: string[];
}

export interface StudyResource {
  type: "exercise" | "tutorial" | "reference" | "assessment" | "tool" | "video" | "article";
  title: string;
  description: string;
  url?: string;
  estimatedTime: number; // minutes
  difficulty: RecommendationDifficulty;
  component: Component;
  skills: string[];
  isInteractive: boolean;
  cost: "free" | "premium";
  rating?: number; // 1-5 stars
  provider?: string;
}

export interface TimeEstimate {
  minimum: number; // hours
  maximum: number; // hours
  optimal: number; // hours
  frequency: string; // "daily", "weekly", "biweekly"
  duration: string; // "1-2 weeks", "ongoing"
}

export interface ExpectedOutcome {
  metric: string;
  improvement: number; // expected points improvement
  timeframe: string; // "1 week", "2-3 weeks"
  confidence: number; // 0.0 to 1.0
  description: string;
}

export interface RecommendationMetadata {
  basedOn: string[]; // What data this recommendation is based on
  algorithmVersion: string;
  personalizationFactors: string[];
  adaptabilityScore: number; // How well this can adapt to user progress
  relevanceScore: number; // 0.0 to 1.0
  evidenceStrength: number; // 0.0 to 1.0
}

// Comprehensive recommendations result
export interface StudyRecommendations {
  summary: RecommendationSummary;
  immediate: StudyRecommendation[];
  shortTerm: StudyRecommendation[];
  longTerm: StudyRecommendation[];
  studyPlan: PersonalizedStudyPlan;
  adaptiveSchedule: AdaptiveSchedule;
  resources: CuratedResources;
  motivationalInsights: MotivationalInsight[];
  progress: ProgressPrediction;
  metadata: RecommendationsMetadata;
}

export interface RecommendationSummary {
  totalRecommendations: number;
  criticalActions: number;
  estimatedWeeklyHours: number;
  focusAreas: string[];
  primaryGoal: string;
  confidenceLevel: number;
  timeToGoal: string;
}

export interface PersonalizedStudyPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // weeks
  phases: StudyPhase[];
  milestones: StudyMilestone[];
  adaptationRules: AdaptationRule[];
  successMetrics: PlanMetric[];
}

export interface StudyPhase {
  phase: number;
  name: string;
  description: string;
  duration: number; // weeks
  focusComponents: Component[];
  weeklyGoals: WeeklyGoal[];
  dailySchedule: DailyActivity[];
  assessments: PhaseAssessment[];
}

export interface WeeklyGoal {
  week: number;
  description: string;
  targetScores: Record<Component, number>;
  practiceHours: number;
  activities: string[];
  successCriteria: string[];
}

export interface DailyActivity {
  day: string;
  activities: ActivitySlot[];
  totalTime: number;
  primaryFocus: Component;
}

export interface ActivitySlot {
  time: string; // "09:00", "14:30"
  duration: number; // minutes
  activity: string;
  component: Component;
  type: "practice" | "review" | "assessment" | "break";
  difficulty: RecommendationDifficulty;
  resources: string[];
}

export interface StudyMilestone {
  week: number;
  title: string;
  description: string;
  targetMetrics: Record<string, number>;
  assessmentType: string;
  successCriteria: string[];
  rewards: string[];
}

export interface PhaseAssessment {
  week: number;
  type: "diagnostic" | "progress" | "mock_exam";
  components: Component[];
  duration: number; // minutes
  passingScore: number;
  purpose: string;
}

export interface AdaptationRule {
  condition: string;
  action: string;
  priority: number;
  description: string;
}

export interface PlanMetric {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  importance: number; // 0.0 to 1.0
}

export interface AdaptiveSchedule {
  preferredTimes: string[];
  sessionLength: number; // minutes
  frequency: number; // sessions per week
  flexibility: number; // 0.0 to 1.0
  adaptations: ScheduleAdaptation[];
}

export interface ScheduleAdaptation {
  trigger: string;
  adjustment: string;
  description: string;
}

export interface CuratedResources {
  essential: StudyResource[];
  supplementary: StudyResource[];
  advanced: StudyResource[];
  categoryBreakdown: Record<string, StudyResource[]>;
}

export interface MotivationalInsight {
  type: "achievement" | "progress" | "encouragement" | "challenge";
  title: string;
  message: string;
  evidence: string[];
  actionSuggestion?: string;
}

export interface ProgressPrediction {
  currentTrajectory: TrajectoryPoint[];
  optimizedTrajectory: TrajectoryPoint[];
  confidenceIntervals: ConfidenceInterval[];
  keyFactors: InfluenceFactor[];
  riskAssessment: RiskFactor[];
}

export interface TrajectoryPoint {
  week: number;
  predictedScore: number;
  readinessLevel: number;
  confidence: number;
}

export interface ConfidenceInterval {
  week: number;
  lower: number;
  upper: number;
  confidence: number; // e.g., 0.95 for 95%
}

export interface InfluenceFactor {
  factor: string;
  impact: number; // -1.0 to 1.0
  description: string;
  controllable: boolean;
}

export interface RiskFactor {
  risk: string;
  probability: number; // 0.0 to 1.0
  impact: number; // 0.0 to 1.0
  mitigation: string[];
}

export interface RecommendationsMetadata {
  generatedAt: Date;
  basedOnSessions: number;
  dataQuality: number;
  algorithmVersion: string;
  personalizationLevel: number;
  refreshRecommended: Date;
}

// Configuration for the recommendation engine
export interface RecommendationConfig {
  maxRecommendations: number;
  priorityWeights: Record<RecommendationPriority, number>;
  componentWeights: Record<Component, number>;
  timeHorizon: {
    immediate: number; // days
    shortTerm: number; // days
    longTerm: number; // days
  };
  confidenceThreshold: number;
  adaptationSensitivity: number;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  maxRecommendations: 15,
  priorityWeights: {
    critical: 1.0,
    high: 0.8,
    medium: 0.6,
    low: 0.4,
  },
  componentWeights: {
    reading: 0.25,
    writing: 0.25,
    listening: 0.25,
    speaking: 0.25,
  },
  timeHorizon: {
    immediate: 7,   // 1 week
    shortTerm: 28,  // 4 weeks
    longTerm: 84,   // 12 weeks
  },
  confidenceThreshold: 0.6,
  adaptationSensitivity: 0.7,
};

/**
 * Main study recommendations engine
 */
export class StudyRecommendationEngine {
  private config: RecommendationConfig;

  constructor(config: RecommendationConfig = DEFAULT_RECOMMENDATION_CONFIG) {
    this.config = config;
  }

  /**
   * Generate comprehensive study recommendations
   */
  async generateRecommendations(
    progress: UserProgress,
    examSessions: ExamSession[],
    weaknessAnalysis: WeaknessAnalysis,
    readinessAssessment: ReadinessAssessment,
    userPreferences?: UserPreferences
  ): Promise<StudyRecommendations> {
    // Generate individual recommendations
    const allRecommendations = await this.createRecommendations(
      progress,
      examSessions,
      weaknessAnalysis,
      readinessAssessment,
      userPreferences
    );

    // Categorize by time horizon
    const categorized = this.categorizeRecommendations(allRecommendations);

    // Generate personalized study plan
    const studyPlan = await this.generateStudyPlan(
      progress,
      weaknessAnalysis,
      readinessAssessment,
      categorized.immediate.concat(categorized.shortTerm)
    );

    // Create adaptive schedule
    const adaptiveSchedule = this.createAdaptiveSchedule(
      progress,
      userPreferences,
      studyPlan
    );

    // Curate resources
    const resources = this.curateResources(
      allRecommendations,
      progress.analytics.componentAnalysis
    );

    // Generate motivational insights
    const motivationalInsights = this.generateMotivationalInsights(
      progress,
      examSessions,
      readinessAssessment
    );

    // Create progress predictions
    const progressPrediction = this.predictProgress(
      progress,
      examSessions,
      studyPlan
    );

    // Generate summary
    const summary = this.generateSummary(
      categorized,
      studyPlan,
      readinessAssessment
    );

    return {
      summary,
      immediate: categorized.immediate,
      shortTerm: categorized.shortTerm,
      longTerm: categorized.longTerm,
      studyPlan,
      adaptiveSchedule,
      resources,
      motivationalInsights,
      progress: progressPrediction,
      metadata: {
        generatedAt: new Date(),
        basedOnSessions: examSessions.length,
        dataQuality: readinessAssessment.confidence,
        algorithmVersion: "2.1.0",
        personalizationLevel: userPreferences ? 0.9 : 0.6,
        refreshRecommended: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      },
    };
  }

  /**
   * Create individual recommendations based on analysis
   */
  private async createRecommendations(
    progress: UserProgress,
    examSessions: ExamSession[],
    weaknessAnalysis: WeaknessAnalysis,
    readinessAssessment: ReadinessAssessment,
    userPreferences?: UserPreferences
  ): Promise<StudyRecommendation[]> {
    const recommendations: StudyRecommendation[] = [];

    // Weakness-based recommendations
    recommendations.push(...this.createWeaknessRecommendations(weaknessAnalysis));

    // Readiness-based recommendations
    recommendations.push(...this.createReadinessRecommendations(readinessAssessment));

    // Component-specific recommendations
    recommendations.push(...this.createComponentRecommendations(progress.analytics));

    // Time management recommendations
    recommendations.push(...this.createTimeManagementRecommendations(examSessions));

    // Practice frequency recommendations
    recommendations.push(...this.createPracticeFrequencyRecommendations(
      examSessions,
      progress.lastActivity
    ));

    // Motivation and engagement recommendations
    recommendations.push(...this.createMotivationRecommendations(
      progress,
      examSessions,
      readinessAssessment
    ));

    // Resource recommendations
    recommendations.push(...this.createResourceRecommendations(
      weaknessAnalysis,
      progress.analytics.componentAnalysis
    ));

    // Filter and rank recommendations
    return this.filterAndRankRecommendations(recommendations, userPreferences);
  }

  /**
   * Create recommendations based on identified weaknesses
   */
  private createWeaknessRecommendations(analysis: WeaknessAnalysis): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];

    // Critical weaknesses - immediate action required
    analysis.criticalWeaknesses.forEach(weakness => {
      recommendations.push({
        id: `weakness_critical_${weakness.id}`,
        type: "skill_focus",
        priority: "critical",
        title: `Address Critical ${weakness.component} Weakness`,
        description: `Immediate focus needed on ${weakness.specificArea}`,
        rationale: `Critical weakness identified: ${weakness.description}`,
        actionItems: [
          {
            action: "Complete diagnostic assessment",
            description: `Take detailed ${weakness.component} assessment to identify specific gaps`,
            timeRequired: 30,
            frequency: "once",
            order: 1,
            isOptional: false,
            successCriteria: ["Complete assessment", "Identify specific problem areas"],
          },
          {
            action: "Daily targeted practice",
            description: `30-minute daily sessions focused on ${weakness.specificArea}`,
            timeRequired: 30,
            frequency: "daily",
            order: 2,
            isOptional: false,
            successCriteria: ["Complete daily sessions", "Show measurable improvement"],
          },
        ],
        resources: this.getResourcesForWeakness(weakness),
        timeEstimate: {
          minimum: 8,
          maximum: 15,
          optimal: 12,
          frequency: "weekly",
          duration: "2-4 weeks",
        },
        expectedOutcomes: [
          {
            metric: `${weakness.component}_score`,
            improvement: 15,
            timeframe: "2 weeks",
            confidence: 0.8,
            description: `Expected 15-point improvement in ${weakness.component}`,
          },
        ],
        prerequisites: [],
        targetComponents: [weakness.component],
        difficulty: "intermediate",
        confidence: weakness.confidence,
        tags: ["weakness", "critical", weakness.component, weakness.specificArea],
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
        metadata: {
          basedOn: ["weakness_analysis", "performance_data"],
          algorithmVersion: "2.1.0",
          personalizationFactors: [weakness.type, weakness.component],
          adaptabilityScore: 0.8,
          relevanceScore: 0.95,
          evidenceStrength: weakness.confidence,
        },
      });
    });

    // Moderate weaknesses - structured improvement plan
    analysis.moderateWeaknesses.forEach((weakness, index) => {
      if (index < 3) { // Limit to top 3 moderate weaknesses
        recommendations.push({
          id: `weakness_moderate_${weakness.id}`,
          type: "study_plan",
          priority: "high",
          title: `Improve ${weakness.component} Performance`,
          description: `Structured plan to address ${weakness.specificArea} difficulties`,
          rationale: `Moderate weakness affecting overall performance: ${weakness.description}`,
          actionItems: [
            {
              action: "Weekly practice sessions",
              description: `3 focused sessions per week on ${weakness.specificArea}`,
              timeRequired: 45,
              frequency: "weekly",
              order: 1,
              isOptional: false,
              successCriteria: ["Complete weekly sessions", "Track performance metrics"],
            },
            {
              action: "Progress assessment",
              description: "Weekly mini-assessments to track improvement",
              timeRequired: 20,
              frequency: "weekly",
              order: 2,
              isOptional: false,
              successCriteria: ["Show consistent improvement", "Meet weekly targets"],
            },
          ],
          resources: this.getResourcesForWeakness(weakness),
          timeEstimate: {
            minimum: 5,
            maximum: 8,
            optimal: 6,
            frequency: "weekly",
            duration: "3-6 weeks",
          },
          expectedOutcomes: [
            {
              metric: `${weakness.component}_score`,
              improvement: 10,
              timeframe: "4 weeks",
              confidence: 0.7,
              description: `Expected 10-point improvement in ${weakness.component}`,
            },
          ],
          prerequisites: [],
          targetComponents: [weakness.component],
          difficulty: "intermediate",
          confidence: weakness.confidence,
          tags: ["weakness", "moderate", weakness.component],
          createdAt: new Date(),
          validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks
          metadata: {
            basedOn: ["weakness_analysis"],
            algorithmVersion: "2.1.0",
            personalizationFactors: [weakness.type],
            adaptabilityScore: 0.7,
            relevanceScore: 0.8,
            evidenceStrength: weakness.confidence,
          },
        });
      }
    });

    return recommendations;
  }

  /**
   * Create recommendations based on readiness assessment
   */
  private createReadinessRecommendations(assessment: ReadinessAssessment): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];

    if (assessment.level === "poor" || assessment.level === "fair") {
      recommendations.push({
        id: `readiness_foundation_${Date.now()}`,
        type: "study_plan",
        priority: "critical",
        title: "Build Exam Foundation",
        description: "Comprehensive foundation building to improve exam readiness",
        rationale: `Current readiness level (${assessment.level}) requires intensive preparation`,
        actionItems: [
          {
            action: "Diagnostic assessment",
            description: "Complete comprehensive diagnostic to identify all gaps",
            timeRequired: 60,
            frequency: "once",
            order: 1,
            isOptional: false,
            successCriteria: ["Identify all weakness areas", "Create baseline metrics"],
          },
          {
            action: "Foundation study plan",
            description: "Follow structured 8-week foundation building program",
            timeRequired: 10 * 60, // 10 hours per week
            frequency: "weekly",
            order: 2,
            isOptional: false,
            successCriteria: ["Complete weekly milestones", "Show consistent improvement"],
          },
        ],
        resources: this.getFoundationResources(),
        timeEstimate: {
          minimum: 60,
          maximum: 80,
          optimal: 70,
          frequency: "total",
          duration: "8-10 weeks",
        },
        expectedOutcomes: [
          {
            metric: "readiness_score",
            improvement: 30,
            timeframe: "8 weeks",
            confidence: 0.8,
            description: "Expected to reach 'good' readiness level",
          },
        ],
        prerequisites: [],
        targetComponents: ["reading", "writing", "listening", "speaking"],
        difficulty: "beginner",
        confidence: 0.9,
        tags: ["readiness", "foundation", "comprehensive"],
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: {
          basedOn: ["readiness_assessment"],
          algorithmVersion: "2.1.0",
          personalizationFactors: ["readiness_level", "overall_score"],
          adaptabilityScore: 0.6,
          relevanceScore: 0.95,
          evidenceStrength: assessment.confidence,
        },
      });
    }

    // Add specific recommendations from readiness assessment
    assessment.recommendations.forEach((rec, index) => {
      recommendations.push({
        id: `readiness_rec_${index}_${Date.now()}`,
        type: this.mapRecommendationType(rec.type),
        priority: rec.priority as RecommendationPriority,
        title: rec.title,
        description: rec.description,
        rationale: "Based on comprehensive readiness analysis",
        actionItems: rec.actionItems.map((action, actionIndex) => ({
          action,
          description: action,
          timeRequired: 30,
          frequency: "daily",
          order: actionIndex + 1,
          isOptional: false,
          successCriteria: ["Complete action", "Track progress"],
        })),
        resources: [],
        timeEstimate: {
          minimum: 3,
          maximum: 8,
          optimal: 5,
          frequency: "weekly",
          duration: "2-4 weeks",
        },
        expectedOutcomes: [
          {
            metric: "overall_improvement",
            improvement: rec.estimatedImpact * 100,
            timeframe: "3 weeks",
            confidence: 0.7,
            description: `Expected ${Math.round(rec.estimatedImpact * 100)}-point improvement`,
          },
        ],
        prerequisites: [],
        targetComponents: ["reading", "writing", "listening", "speaking"], // Default to all
        difficulty: "intermediate",
        confidence: 0.8,
        tags: ["readiness", rec.type],
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        metadata: {
          basedOn: ["readiness_assessment"],
          algorithmVersion: "2.1.0",
          personalizationFactors: [rec.type],
          adaptabilityScore: 0.7,
          relevanceScore: 0.8,
          evidenceStrength: 0.8,
        },
      });
    });

    return recommendations;
  }

  // Additional helper methods for creating other types of recommendations
  private createComponentRecommendations(analytics: ProgressAnalytics): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];
    
    Object.entries(analytics.componentAnalysis).forEach(([component, analysis]) => {
      const typedAnalysis = analysis as ComponentAnalysis;
      
      if (typedAnalysis.averageScore < 70) {
        recommendations.push({
          id: `component_${component}_${Date.now()}`,
          type: "skill_focus",
          priority: "medium",
          title: `Strengthen ${component.charAt(0).toUpperCase() + component.slice(1)} Skills`,
          description: `Focused improvement plan for ${component} component`,
          rationale: `Component score (${typedAnalysis.averageScore.toFixed(1)}) below target`,
          actionItems: [
            {
              action: "Daily practice",
              description: `30-minute daily ${component} practice sessions`,
              timeRequired: 30,
              frequency: "daily",
              order: 1,
              isOptional: false,
              successCriteria: ["Complete daily sessions", "Improve weekly scores"],
            },
          ],
          resources: [],
          timeEstimate: {
            minimum: 3.5,
            maximum: 7,
            optimal: 5,
            frequency: "weekly",
            duration: "4-6 weeks",
          },
          expectedOutcomes: [
            {
              metric: `${component}_score`,
              improvement: 15,
              timeframe: "4 weeks",
              confidence: 0.75,
              description: `Expected 15-point improvement in ${component}`,
            },
          ],
          prerequisites: [],
          targetComponents: [component as Component],
          difficulty: "intermediate",
          confidence: 0.8,
          tags: [component, "component_improvement"],
          createdAt: new Date(),
          validUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
          metadata: {
            basedOn: ["component_analysis"],
            algorithmVersion: "2.1.0",
            personalizationFactors: [component],
            adaptabilityScore: 0.7,
            relevanceScore: 0.8,
            evidenceStrength: 0.8,
          },
        });
      }
    });
    
    return recommendations;
  }

  private createTimeManagementRecommendations(sessions: ExamSession[]): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];
    
    if (sessions.length >= 3) {
      const durations = sessions.map(s => s.durationSeconds / 60);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const cv = this.calculateCoefficiientOfVariation(durations);
      
      if (cv > 0.3) { // High time inconsistency
        recommendations.push({
          id: `time_management_${Date.now()}`,
          type: "time_management",
          priority: "medium",
          title: "Improve Time Management",
          description: "Develop consistent timing and pacing strategies",
          rationale: "Inconsistent session timing affects performance reliability",
          actionItems: [
            {
              action: "Timed practice sessions",
              description: "Practice with strict time limits to build consistency",
              timeRequired: 45,
              frequency: "daily",
              order: 1,
              isOptional: false,
              successCriteria: ["Complete sessions within time limit", "Improve time consistency"],
            },
          ],
          resources: [],
          timeEstimate: {
            minimum: 5,
            maximum: 10,
            optimal: 7,
            frequency: "weekly",
            duration: "3-4 weeks",
          },
          expectedOutcomes: [
            {
              metric: "time_consistency",
              improvement: 20,
              timeframe: "3 weeks",
              confidence: 0.7,
              description: "Expected improvement in time management consistency",
            },
          ],
          prerequisites: [],
          targetComponents: ["reading", "writing", "listening", "speaking"],
          difficulty: "intermediate",
          confidence: 0.8,
          tags: ["time_management", "consistency"],
          createdAt: new Date(),
          validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          metadata: {
            basedOn: ["session_analysis"],
            algorithmVersion: "2.1.0",
            personalizationFactors: ["time_patterns"],
            adaptabilityScore: 0.6,
            relevanceScore: 0.7,
            evidenceStrength: 0.8,
          },
        });
      }
    }
    
    return recommendations;
  }

  private createPracticeFrequencyRecommendations(
    sessions: ExamSession[],
    lastActivity: Date
  ): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];
    
    const daysSinceLastActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysSinceLastActivity > 7) {
      recommendations.push({
        id: `frequency_${Date.now()}`,
        type: "practice_session",
        priority: "high",
        title: "Increase Practice Frequency",
        description: "Regular practice is essential for maintaining and improving performance",
        rationale: `${Math.round(daysSinceLastActivity)} days since last activity - consistency is key`,
        actionItems: [
          {
            action: "Resume regular practice",
            description: "Start with 30-minute sessions every other day",
            timeRequired: 30,
            frequency: "daily",
            order: 1,
            isOptional: false,
            successCriteria: ["Complete 4 sessions this week", "Establish routine"],
          },
        ],
        resources: [],
        timeEstimate: {
          minimum: 2,
          maximum: 4,
          optimal: 3,
          frequency: "weekly",
          duration: "ongoing",
        },
        expectedOutcomes: [
          {
            metric: "consistency_score",
            improvement: 25,
            timeframe: "2 weeks",
            confidence: 0.8,
            description: "Expected improvement in study consistency",
          },
        ],
        prerequisites: [],
        targetComponents: ["reading", "writing", "listening", "speaking"],
        difficulty: "beginner",
        confidence: 0.9,
        tags: ["frequency", "consistency", "routine"],
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        metadata: {
          basedOn: ["activity_patterns"],
          algorithmVersion: "2.1.0",
          personalizationFactors: ["last_activity"],
          adaptabilityScore: 0.8,
          relevanceScore: 0.9,
          evidenceStrength: 0.9,
        },
      });
    }
    
    return recommendations;
  }

  private createMotivationRecommendations(
    progress: UserProgress,
    sessions: ExamSession[],
    readiness: ReadinessAssessment
  ): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];
    
    // Check for declining performance or low engagement
    const recentSessions = sessions.slice(-5);
    const isDecining = recentSessions.length >= 3 && 
      recentSessions[recentSessions.length - 1].score! < recentSessions[0].score!;
    
    if (isDecining || readiness.level === "poor") {
      recommendations.push({
        id: `motivation_${Date.now()}`,
        type: "motivation",
        priority: "medium",
        title: "Build Learning Momentum",
        description: "Strategies to maintain motivation and engagement",
        rationale: "Recent performance patterns suggest need for motivational support",
        actionItems: [
          {
            action: "Set small achievable goals",
            description: "Break larger goals into manageable weekly targets",
            timeRequired: 15,
            frequency: "weekly",
            order: 1,
            isOptional: false,
            successCriteria: ["Set weekly goals", "Achieve at least 80% of goals"],
          },
        ],
        resources: [],
        timeEstimate: {
          minimum: 1,
          maximum: 2,
          optimal: 1,
          frequency: "weekly",
          duration: "ongoing",
        },
        expectedOutcomes: [
          {
            metric: "engagement_score",
            improvement: 15,
            timeframe: "2 weeks",
            confidence: 0.6,
            description: "Expected improvement in study engagement",
          },
        ],
        prerequisites: [],
        targetComponents: ["reading", "writing", "listening", "speaking"],
        difficulty: "beginner",
        confidence: 0.7,
        tags: ["motivation", "engagement", "goals"],
        createdAt: new Date(),
        validUntil: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000),
        metadata: {
          basedOn: ["performance_trends"],
          algorithmVersion: "2.1.0",
          personalizationFactors: ["motivation_level"],
          adaptabilityScore: 0.5,
          relevanceScore: 0.6,
          evidenceStrength: 0.6,
        },
      });
    }
    
    return recommendations;
  }

  private createResourceRecommendations(
    weaknessAnalysis: WeaknessAnalysis,
    componentAnalysis: Record<Component, ComponentAnalysis>
  ): StudyRecommendation[] {
    const recommendations: StudyRecommendation[] = [];
    
    // Add resource recommendation for each weak component
    Object.entries(componentAnalysis).forEach(([component, analysis]) => {
      const typedAnalysis = analysis as ComponentAnalysis;
      if (typedAnalysis.averageScore < 75) {
        recommendations.push({
          id: `resource_${component}_${Date.now()}`,
          type: "resource",
          priority: "low",
          title: `${component.charAt(0).toUpperCase() + component.slice(1)} Study Resources`,
          description: `Curated resources to improve ${component} performance`,
          rationale: `Additional resources needed for ${component} improvement`,
          actionItems: [
            {
              action: "Use recommended resources",
              description: `Utilize curated ${component} learning materials`,
              timeRequired: 60,
              frequency: "weekly",
              order: 1,
              isOptional: true,
              successCriteria: ["Complete resource activities", "Apply learned techniques"],
            },
          ],
          resources: this.getComponentResources(component as Component),
          timeEstimate: {
            minimum: 3,
            maximum: 6,
            optimal: 4,
            frequency: "weekly",
            duration: "ongoing",
          },
          expectedOutcomes: [
            {
              metric: `${component}_resources_utilized`,
              improvement: 10,
              timeframe: "4 weeks",
              confidence: 0.5,
              description: "Expected benefit from additional resources",
            },
          ],
          prerequisites: [],
          targetComponents: [component as Component],
          difficulty: "adaptive",
          confidence: 0.6,
          tags: ["resources", component],
          createdAt: new Date(),
          validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          metadata: {
            basedOn: ["component_analysis"],
            algorithmVersion: "2.1.0",
            personalizationFactors: [component],
            adaptabilityScore: 0.4,
            relevanceScore: 0.6,
            evidenceStrength: 0.5,
          },
        });
      }
    });
    
    return recommendations;
  }

  // Helper methods for utility functions
  
  private filterAndRankRecommendations(
    recommendations: StudyRecommendation[],
    userPreferences?: UserPreferences
  ): StudyRecommendation[] {
    // Filter by confidence threshold
    let filtered = recommendations.filter(rec => 
      rec.confidence >= this.config.confidenceThreshold
    );

    // Apply user preferences if available
    if (userPreferences) {
      filtered = this.applyUserPreferences(filtered, userPreferences);
    }

    // Sort by priority and relevance
    filtered.sort((a, b) => {
      const aPriority = this.config.priorityWeights[a.priority];
      const bPriority = this.config.priorityWeights[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      return b.metadata.relevanceScore - a.metadata.relevanceScore;
    });

    // Limit to max recommendations
    return filtered.slice(0, this.config.maxRecommendations);
  }

  private categorizeRecommendations(recommendations: StudyRecommendation[]): {
    immediate: StudyRecommendation[];
    shortTerm: StudyRecommendation[];
    longTerm: StudyRecommendation[];
  } {
    const now = Date.now();
    const immediate = this.config.timeHorizon.immediate * 24 * 60 * 60 * 1000;
    const shortTerm = this.config.timeHorizon.shortTerm * 24 * 60 * 60 * 1000;

    return {
      immediate: recommendations.filter(rec => 
        rec.priority === "critical" || 
        (rec.validUntil.getTime() - now) <= immediate
      ),
      shortTerm: recommendations.filter(rec => 
        rec.priority === "high" && 
        (rec.validUntil.getTime() - now) > immediate &&
        (rec.validUntil.getTime() - now) <= shortTerm
      ),
      longTerm: recommendations.filter(rec => 
        rec.priority === "medium" || rec.priority === "low" ||
        (rec.validUntil.getTime() - now) > shortTerm
      ),
    };
  }

  private async generateStudyPlan(
    progress: UserProgress,
    weaknessAnalysis: WeaknessAnalysis,
    readinessAssessment: ReadinessAssessment,
    recommendations: StudyRecommendation[]
  ): Promise<PersonalizedStudyPlan> {
    const planDuration = readinessAssessment.level === "poor" ? 12 :
                        readinessAssessment.level === "fair" ? 8 :
                        readinessAssessment.level === "good" ? 6 : 4;

    // Create phases based on duration
    const phases: StudyPhase[] = [];
    const phaseCount = Math.min(3, Math.ceil(planDuration / 4));
    
    for (let i = 0; i < phaseCount; i++) {
      const phaseWeeks = Math.ceil(planDuration / phaseCount);
      phases.push({
        phase: i + 1,
        name: i === 0 ? "Foundation" : i === 1 ? "Development" : "Mastery",
        description: `Phase ${i + 1} of ${phaseCount}: Focus on building core skills`,
        duration: phaseWeeks,
        focusComponents: this.getPhaseFocusComponents(i, weaknessAnalysis),
        weeklyGoals: this.generateWeeklyGoals(phaseWeeks, i),
        dailySchedule: this.generateDailySchedule(),
        assessments: this.generatePhaseAssessments(phaseWeeks),
      });
    }

    return {
      id: `plan_${Date.now()}`,
      name: "Personalized Study Plan",
      description: "AI-generated study plan based on your performance analysis",
      duration: planDuration,
      phases,
      milestones: this.generateStudyMilestones(planDuration, readinessAssessment),
      adaptationRules: this.generateAdaptationRules(),
      successMetrics: this.generateSuccessMetrics(progress.analytics),
    };
  }

  private createAdaptiveSchedule(
    progress: UserProgress,
    userPreferences?: UserPreferences,
    studyPlan?: PersonalizedStudyPlan
  ): AdaptiveSchedule {
    return {
      preferredTimes: userPreferences?.preferredTimes || ["09:00", "14:00", "19:00"],
      sessionLength: userPreferences?.sessionLength || 45,
      frequency: userPreferences?.frequency || 4,
      flexibility: userPreferences?.flexibility || 0.7,
      adaptations: [
        {
          trigger: "low_performance",
          adjustment: "increase_frequency",
          description: "Increase session frequency when performance drops",
        },
        {
          trigger: "high_consistency",
          adjustment: "increase_difficulty",
          description: "Increase difficulty when showing consistent progress",
        },
      ],
    };
  }

  private curateResources(
    recommendations: StudyRecommendation[],
    componentAnalysis: Record<Component, ComponentAnalysis>
  ): CuratedResources {
    const essential: StudyResource[] = [];
    const supplementary: StudyResource[] = [];
    const advanced: StudyResource[] = [];

    // Extract resources from recommendations
    recommendations.forEach(rec => {
      rec.resources.forEach(resource => {
        if (rec.priority === "critical" || rec.priority === "high") {
          essential.push(resource);
        } else if (resource.difficulty === "advanced") {
          advanced.push(resource);
        } else {
          supplementary.push(resource);
        }
      });
    });

    // Add default resources for each component
    Object.entries(componentAnalysis).forEach(([component, analysis]) => {
      const componentResources = this.getComponentResources(component as Component);
      supplementary.push(...componentResources);
    });

    return {
      essential: this.deduplicateResources(essential),
      supplementary: this.deduplicateResources(supplementary),
      advanced: this.deduplicateResources(advanced),
      categoryBreakdown: {
        reading: essential.concat(supplementary, advanced).filter(r => r.component === "reading"),
        writing: essential.concat(supplementary, advanced).filter(r => r.component === "writing"),
        listening: essential.concat(supplementary, advanced).filter(r => r.component === "listening"),
        speaking: essential.concat(supplementary, advanced).filter(r => r.component === "speaking"),
      },
    };
  }

  private generateMotivationalInsights(
    progress: UserProgress,
    sessions: ExamSession[],
    readiness: ReadinessAssessment
  ): MotivationalInsight[] {
    const insights: MotivationalInsight[] = [];

    // Progress achievement insights
    if (progress.overallProgress > 0.3) {
      insights.push({
        type: "achievement",
        title: "Great Progress!",
        message: `You've completed ${Math.round(progress.overallProgress * 100)}% of your learning journey.`,
        evidence: [`${sessions.length} practice sessions completed`, `Current readiness: ${readiness.level}`],
        actionSuggestion: "Keep up the consistent effort!",
      });
    }

    // Improvement insights
    const recentScores = sessions.slice(-5).map(s => s.score || 0);
    if (recentScores.length >= 3) {
      const improvement = recentScores[recentScores.length - 1] - recentScores[0];
      if (improvement > 5) {
        insights.push({
          type: "progress",
          title: "Upward Trend!",
          message: `Your scores have improved by ${improvement.toFixed(1)} points recently.`,
          evidence: [`Recent improvement: +${improvement.toFixed(1)} points`],
          actionSuggestion: "This momentum is excellent - maintain your current approach!",
        });
      }
    }

    return insights;
  }

  private predictProgress(
    progress: UserProgress,
    sessions: ExamSession[],
    studyPlan: PersonalizedStudyPlan
  ): ProgressPrediction {
    const currentScore = progress.analytics.averageScore;
    const improvementRate = progress.analytics.improvementRate || 2; // points per week
    
    const currentTrajectory: TrajectoryPoint[] = [];
    const optimizedTrajectory: TrajectoryPoint[] = [];
    
    for (let week = 1; week <= studyPlan.duration; week++) {
      // Current trajectory (if no changes)
      const currentPrediction = Math.min(100, currentScore + (improvementRate * week));
      currentTrajectory.push({
        week,
        predictedScore: currentPrediction,
        readinessLevel: currentPrediction / 100,
        confidence: Math.max(0.3, 0.9 - (week * 0.05)), // Confidence decreases over time
      });

      // Optimized trajectory (following study plan)
      const optimizedRate = improvementRate * 1.5; // 50% improvement with plan
      const optimizedPrediction = Math.min(100, currentScore + (optimizedRate * week));
      optimizedTrajectory.push({
        week,
        predictedScore: optimizedPrediction,
        readinessLevel: optimizedPrediction / 100,
        confidence: Math.max(0.5, 0.95 - (week * 0.03)),
      });
    }

    return {
      currentTrajectory,
      optimizedTrajectory,
      confidenceIntervals: this.generateConfidenceIntervals(optimizedTrajectory),
      keyFactors: this.identifyInfluenceFactors(),
      riskAssessment: this.assessRisks(progress, sessions),
    };
  }

  private generateSummary(
    categorized: {
      immediate: StudyRecommendation[];
      shortTerm: StudyRecommendation[];
      longTerm: StudyRecommendation[];
    },
    studyPlan: PersonalizedStudyPlan,
    readiness: ReadinessAssessment
  ): RecommendationSummary {
    const totalRecs = categorized.immediate.length + 
                     categorized.shortTerm.length + 
                     categorized.longTerm.length;
    
    const criticalActions = categorized.immediate.filter(rec => 
      rec.priority === "critical"
    ).length;
    
    const estimatedWeeklyHours = studyPlan.phases.reduce((sum, phase) => {
      return sum + phase.weeklyGoals.reduce((weekSum, goal) => 
        weekSum + goal.practiceHours, 0
      ) / phase.weeklyGoals.length;
    }, 0) / studyPlan.phases.length;

    const focusAreas = Array.from(new Set(
      [...categorized.immediate, ...categorized.shortTerm]
        .flatMap(rec => rec.tags)
        .filter(tag => !["critical", "high", "medium", "low"].includes(tag))
    )).slice(0, 5);

    return {
      totalRecommendations: totalRecs,
      criticalActions,
      estimatedWeeklyHours: Math.round(estimatedWeeklyHours),
      focusAreas,
      primaryGoal: readiness.level === "poor" ? "Build foundation" : 
                  readiness.level === "fair" ? "Improve consistency" :
                  readiness.level === "good" ? "Achieve mastery" : "Maintain excellence",
      confidenceLevel: readiness.confidence,
      timeToGoal: `${studyPlan.duration} weeks`,
    };
  }

  // Additional helper methods (simplified implementations)
  
  private mapRecommendationType(type: string): RecommendationType {
    const mapping: Record<string, RecommendationType> = {
      "component_focus": "skill_focus",
      "study_time": "study_plan",
      "practice_frequency": "practice_session",
      "weakness_recovery": "skill_focus",
    };
    return mapping[type] || "study_plan";
  }

  private getResourcesForWeakness(weakness: WeaknessDetail): StudyResource[] {
    // Simplified - would return actual resources based on weakness type
    return [
      {
        type: "exercise",
        title: `${weakness.component} Practice Exercises`,
        description: `Targeted exercises for ${weakness.specificArea}`,
        estimatedTime: 30,
        difficulty: "intermediate",
        component: weakness.component,
        skills: [weakness.specificArea],
        isInteractive: true,
        cost: "free",
        rating: 4,
      },
    ];
  }

  private getFoundationResources(): StudyResource[] {
    return [
      {
        type: "tutorial",
        title: "Foundation Building Course",
        description: "Comprehensive foundation course covering all components",
        estimatedTime: 480, // 8 hours
        difficulty: "beginner",
        component: "reading", // Primary component
        skills: ["fundamentals", "basics"],
        isInteractive: true,
        cost: "free",
        rating: 5,
      },
    ];
  }

  private getComponentResources(component: Component): StudyResource[] {
    return [
      {
        type: "exercise",
        title: `${component.charAt(0).toUpperCase() + component.slice(1)} Exercises`,
        description: `Practice exercises for ${component} skills`,
        estimatedTime: 45,
        difficulty: "intermediate",
        component,
        skills: [`${component}_skills`],
        isInteractive: true,
        cost: "free",
        rating: 4,
      },
    ];
  }

  private calculateCoefficiientOfVariation(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return mean === 0 ? 0 : stdDev / mean;
  }

  private applyUserPreferences(
    recommendations: StudyRecommendation[],
    preferences: UserPreferences
  ): StudyRecommendation[] {
    // Apply user preferences to filter recommendations
    return recommendations.filter(rec => {
      // Example preference filtering
      if (preferences.maxWeeklyHours && rec.timeEstimate.optimal > preferences.maxWeeklyHours) {
        return false;
      }
      return true;
    });
  }

  private getPhaseFocusComponents(phase: number, weaknessAnalysis: WeaknessAnalysis): Component[] {
    if (phase === 0) {
      // Foundation phase - focus on critical weaknesses
      return Array.from(new Set(weaknessAnalysis.criticalWeaknesses.map(w => w.component)));
    } else if (phase === 1) {
      // Development phase - moderate weaknesses
      return Array.from(new Set(weaknessAnalysis.moderateWeaknesses.map(w => w.component)));
    } else {
      // Mastery phase - all components
      return ["reading", "writing", "listening", "speaking"];
    }
  }

  private generateWeeklyGoals(phaseWeeks: number, phase: number): WeeklyGoal[] {
    const goals: WeeklyGoal[] = [];
    
    for (let week = 1; week <= phaseWeeks; week++) {
      goals.push({
        week,
        description: `Week ${week} goals for phase ${phase + 1}`,
        targetScores: {
          reading: 70 + (phase * 10) + (week * 2),
          writing: 70 + (phase * 10) + (week * 2),
          listening: 70 + (phase * 10) + (week * 2),
          speaking: 70 + (phase * 10) + (week * 2),
        },
        practiceHours: 8 + (phase * 2),
        activities: ["Daily practice", "Weekly assessment", "Review sessions"],
        successCriteria: ["Meet target scores", "Complete all activities"],
      });
    }
    
    return goals;
  }

  private generateDailySchedule(): DailyActivity[] {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    return days.map(day => ({
      day,
      activities: [
        {
          time: "09:00",
          duration: 30,
          activity: "Reading Practice",
          component: "reading" as Component,
          type: "practice" as const,
          difficulty: "intermediate" as RecommendationDifficulty,
          resources: ["reading_exercises"],
        },
        {
          time: "14:00",
          duration: 30,
          activity: "Writing Practice",
          component: "writing" as Component,
          type: "practice" as const,
          difficulty: "intermediate" as RecommendationDifficulty,
          resources: ["writing_exercises"],
        },
      ],
      totalTime: 60,
      primaryFocus: "reading" as Component,
    }));
  }

  private generatePhaseAssessments(phaseWeeks: number): PhaseAssessment[] {
    return [
      {
        week: Math.ceil(phaseWeeks / 2),
        type: "progress",
        components: ["reading", "writing", "listening", "speaking"],
        duration: 60,
        passingScore: 70,
        purpose: "Mid-phase progress check",
      },
      {
        week: phaseWeeks,
        type: "mock_exam",
        components: ["reading", "writing", "listening", "speaking"],
        duration: 120,
        passingScore: 75,
        purpose: "Phase completion assessment",
      },
    ];
  }

  private generateStudyMilestones(
    duration: number,
    readiness: ReadinessAssessment
  ): StudyMilestone[] {
    const milestones: StudyMilestone[] = [];
    const currentScore = readiness.estimatedExamScore;
    const targetImprovement = 30; // Target 30-point improvement
    
    for (let i = 1; i <= 3; i++) {
      const week = Math.ceil((duration * i) / 3);
      const targetScore = currentScore + ((targetImprovement * i) / 3);
      
      milestones.push({
        week,
        title: `Milestone ${i}`,
        description: `Achieve ${targetScore.toFixed(0)}% proficiency`,
        targetMetrics: {
          overall_score: targetScore,
          consistency: 0.7 + (i * 0.1),
        },
        assessmentType: i === 3 ? "mock_exam" : "progress_test",
        successCriteria: [
          `Score ${targetScore.toFixed(0)}% or higher`,
          "Demonstrate improved consistency",
        ],
        rewards: ["Progress certificate", "Unlock next phase"],
      });
    }
    
    return milestones;
  }

  private generateAdaptationRules(): AdaptationRule[] {
    return [
      {
        condition: "score_decline_3_sessions",
        action: "increase_practice_frequency",
        priority: 1,
        description: "Increase practice frequency if scores decline for 3 consecutive sessions",
      },
      {
        condition: "consistency_below_60%",
        action: "focus_time_management",
        priority: 2,
        description: "Add time management exercises if consistency drops below 60%",
      },
    ];
  }

  private generateSuccessMetrics(analytics: ProgressAnalytics): PlanMetric[] {
    return [
      {
        name: "Overall Score",
        currentValue: analytics.averageScore,
        targetValue: analytics.averageScore + 25,
        unit: "points",
        importance: 1.0,
      },
      {
        name: "Consistency Score",
        currentValue: analytics.consistencyScore * 100,
        targetValue: 85,
        unit: "percentage",
        importance: 0.8,
      },
    ];
  }

  private generateConfidenceIntervals(trajectory: TrajectoryPoint[]): ConfidenceInterval[] {
    return trajectory.map(point => ({
      week: point.week,
      lower: point.predictedScore * 0.85,
      upper: point.predictedScore * 1.15,
      confidence: 0.95,
    }));
  }

  private identifyInfluenceFactors(): InfluenceFactor[] {
    return [
      {
        factor: "Study Consistency",
        impact: 0.4,
        description: "Regular study habits have the highest impact on success",
        controllable: true,
      },
      {
        factor: "Time Management",
        impact: 0.3,
        description: "Effective time management significantly affects performance",
        controllable: true,
      },
    ];
  }

  private assessRisks(progress: UserProgress, sessions: ExamSession[]): RiskFactor[] {
    const risks: RiskFactor[] = [];
    
    // Check for consistency risk
    if (progress.analytics.consistencyScore < 0.6) {
      risks.push({
        risk: "Performance Inconsistency",
        probability: 0.7,
        impact: 0.6,
        mitigation: [
          "Establish regular study routine",
          "Focus on time management",
          "Practice under exam conditions",
        ],
      });
    }
    
    return risks;
  }

  private deduplicateResources(resources: StudyResource[]): StudyResource[] {
    const seen = new Set<string>();
    return resources.filter(resource => {
      const key = `${resource.title}_${resource.component}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<RecommendationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): RecommendationConfig {
    return { ...this.config };
  }
}

// User preferences interface for personalization
export interface UserPreferences {
  preferredTimes: string[];
  sessionLength: number;
  frequency: number;
  maxWeeklyHours?: number;
  flexibility: number;
  difficultyPreference?: RecommendationDifficulty;
  componentPreferences?: Partial<Record<Component, number>>;
  learningStyle?: "visual" | "auditory" | "kinesthetic" | "mixed";
  motivationalFactors?: string[];
}