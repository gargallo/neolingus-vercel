/**
 * Readiness Score Calculation Engine
 * Neolingus Academy Analytics System
 * 
 * Calculates exam readiness based on multiple performance factors
 * using weighted scoring algorithms and statistical analysis
 */

import {
  UserProgress,
  ProgressAnalytics,
  ComponentAnalysis,
  ExamSession,
  Component,
  Level,
} from "@/lib/exam-engine/types";

// Readiness calculation configuration
export interface ReadinessConfig {
  componentWeights: Record<Component, number>;
  factorWeights: {
    overallScore: number;
    consistency: number;
    improvement: number;
    sessionFrequency: number;
    weaknessRecovery: number;
    timeManagement: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  minimumSessions: number;
  timeDecayFactor: number; // How much older sessions matter less
}

// Default configuration for readiness calculation
export const DEFAULT_READINESS_CONFIG: ReadinessConfig = {
  componentWeights: {
    reading: 0.25,
    writing: 0.25,
    listening: 0.25,
    speaking: 0.25,
  },
  factorWeights: {
    overallScore: 0.35,
    consistency: 0.20,
    improvement: 0.15,
    sessionFrequency: 0.10,
    weaknessRecovery: 0.10,
    timeManagement: 0.10,
  },
  thresholds: {
    excellent: 0.85, // 85%+ readiness
    good: 0.70,      // 70-84% readiness
    fair: 0.55,      // 55-69% readiness
    poor: 0.0,       // <55% readiness
  },
  minimumSessions: 5,
  timeDecayFactor: 0.95, // Sessions lose 5% weight per week
};

// Readiness assessment result
export interface ReadinessAssessment {
  overallScore: number; // 0.0 to 1.0
  confidence: number; // 0.0 to 1.0, based on data quality
  level: "excellent" | "good" | "fair" | "poor";
  factors: {
    overallScore: number;
    consistency: number;
    improvement: number;
    sessionFrequency: number;
    weaknessRecovery: number;
    timeManagement: number;
  };
  componentReadiness: Record<Component, number>;
  recommendations: ReadinessRecommendation[];
  estimatedExamScore: number;
  studyHoursRecommended: number;
  nextMilestones: Milestone[];
  dataQuality: DataQualityMetrics;
}

export interface ReadinessRecommendation {
  type: "component_focus" | "study_time" | "practice_frequency" | "weakness_recovery";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  actionItems: string[];
  estimatedImpact: number; // Expected score improvement (0.0 to 1.0)
}

export interface Milestone {
  title: string;
  description: string;
  targetScore: number;
  estimatedWeeks: number;
  actions: string[];
}

export interface DataQualityMetrics {
  sessionCount: number;
  timeSpan: number; // days
  componentCoverage: number; // 0.0 to 1.0
  consistencyScore: number; // 0.0 to 1.0
  recentActivityScore: number; // 0.0 to 1.0
}

/**
 * Main readiness score calculation engine
 */
export class ReadinessScoreEngine {
  private config: ReadinessConfig;

  constructor(config: ReadinessConfig = DEFAULT_READINESS_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate comprehensive readiness assessment
   */
  async calculateReadiness(
    progress: UserProgress,
    examSessions: ExamSession[],
    targetLevel?: Level
  ): Promise<ReadinessAssessment> {
    const completedSessions = examSessions
      .filter(session => session.isCompleted)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    // Validate data quality
    const dataQuality = this.assessDataQuality(progress, completedSessions);
    
    // Calculate individual factors
    const factors = {
      overallScore: this.calculateOverallScoreFactor(progress.analytics),
      consistency: this.calculateConsistencyFactor(progress.analytics),
      improvement: this.calculateImprovementFactor(completedSessions),
      sessionFrequency: this.calculateSessionFrequencyFactor(completedSessions),
      weaknessRecovery: this.calculateWeaknessRecoveryFactor(progress, completedSessions),
      timeManagement: this.calculateTimeManagementFactor(completedSessions),
    };

    // Calculate component readiness
    const componentReadiness = this.calculateComponentReadiness(
      progress.analytics.componentAnalysis
    );

    // Calculate weighted overall score
    const overallScore = this.calculateWeightedScore(factors);

    // Adjust for data quality (lower confidence reduces readiness)
    const confidenceAdjustedScore = overallScore * (0.5 + (dataQuality.consistencyScore * 0.5));

    // Determine readiness level
    const level = this.determineReadinessLevel(confidenceAdjustedScore);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      factors,
      componentReadiness,
      progress,
      level
    );

    // Estimate exam score and study time
    const estimatedExamScore = this.estimateExamScore(overallScore, dataQuality);
    const studyHoursRecommended = this.calculateRecommendedStudyHours(
      overallScore,
      targetLevel,
      progress.analytics
    );

    // Generate milestones
    const nextMilestones = this.generateMilestones(
      overallScore,
      componentReadiness,
      estimatedExamScore
    );

    return {
      overallScore: Math.round(confidenceAdjustedScore * 100) / 100,
      confidence: dataQuality.consistencyScore,
      level,
      factors,
      componentReadiness,
      recommendations,
      estimatedExamScore: Math.round(estimatedExamScore),
      studyHoursRecommended: Math.round(studyHoursRecommended),
      nextMilestones,
      dataQuality,
    };
  }

  /**
   * Assess the quality and reliability of the available data
   */
  private assessDataQuality(
    progress: UserProgress,
    sessions: ExamSession[]
  ): DataQualityMetrics {
    const sessionCount = sessions.length;
    
    // Calculate time span
    const timeSpan = sessions.length > 1
      ? (new Date(sessions[sessions.length - 1].startedAt).getTime() - 
         new Date(sessions[0].startedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // Component coverage (how many components have been practiced)
    const componentsWithSessions = new Set(sessions.map(s => s.component));
    const totalComponents = Object.keys(this.config.componentWeights).length;
    const componentCoverage = componentsWithSessions.size / totalComponents;

    // Consistency score based on regular activity
    const consistencyScore = Math.min(1, sessionCount / this.config.minimumSessions);

    // Recent activity score (more recent = higher quality)
    const daysSinceLastActivity = (Date.now() - progress.lastActivity.getTime()) / (1000 * 60 * 60 * 24);
    const recentActivityScore = Math.max(0, 1 - (daysSinceLastActivity / 14)); // 14 days decay

    return {
      sessionCount,
      timeSpan,
      componentCoverage,
      consistencyScore,
      recentActivityScore,
    };
  }

  /**
   * Calculate overall score factor
   */
  private calculateOverallScoreFactor(analytics: ProgressAnalytics): number {
    // Normalize average score to 0-1 range
    return Math.min(1, analytics.averageScore / 100);
  }

  /**
   * Calculate consistency factor
   */
  private calculateConsistencyFactor(analytics: ProgressAnalytics): number {
    return analytics.consistencyScore || 0;
  }

  /**
   * Calculate improvement trend factor
   */
  private calculateImprovementFactor(sessions: ExamSession[]): number {
    if (sessions.length < 3) return 0.5; // Neutral if insufficient data

    // Calculate improvement trend using linear regression
    const scores = sessions.map(s => s.score || 0);
    const n = scores.length;
    const xMean = (n - 1) / 2;
    const yMean = scores.reduce((sum, score) => sum + score, 0) / n;
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = scores[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    
    // Normalize slope to 0-1 range (assuming max improvement of 10 points per session)
    return Math.max(0, Math.min(1, (slope + 10) / 20));
  }

  /**
   * Calculate session frequency factor
   */
  private calculateSessionFrequencyFactor(sessions: ExamSession[]): number {
    if (sessions.length < 2) return 0;

    // Calculate average days between sessions
    const intervals = [];
    for (let i = 1; i < sessions.length; i++) {
      const daysDiff = (new Date(sessions[i].startedAt).getTime() - 
                       new Date(sessions[i - 1].startedAt).getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(daysDiff);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    // Optimal frequency is 2-3 days between sessions
    const optimalInterval = 2.5;
    const deviation = Math.abs(avgInterval - optimalInterval);
    
    // Score decreases with deviation from optimal
    return Math.max(0, 1 - (deviation / 7)); // 7 days max penalty
  }

  /**
   * Calculate weakness recovery factor
   */
  private calculateWeaknessRecoveryFactor(
    progress: UserProgress,
    sessions: ExamSession[]
  ): number {
    const componentAnalysis = progress.analytics.componentAnalysis;
    let recoveryScore = 0;
    let componentsChecked = 0;

    // Check each component for improvement
    Object.entries(componentAnalysis).forEach(([component, analysis]) => {
      const componentSessions = sessions.filter(s => s.component === component as Component);
      
      if (componentSessions.length >= 3) {
        const recentScores = componentSessions.slice(-3).map(s => s.score || 0);
        const improvement = recentScores[2] - recentScores[0];
        
        // Weight improvement based on how weak the component was
        const weaknessWeight = 1 - ((analysis as ComponentAnalysis).averageScore / 100);
        recoveryScore += Math.max(0, improvement / 100) * weaknessWeight;
        componentsChecked++;
      }
    });

    return componentsChecked > 0 ? recoveryScore / componentsChecked : 0.5;
  }

  /**
   * Calculate time management factor
   */
  private calculateTimeManagementFactor(sessions: ExamSession[]): number {
    if (sessions.length === 0) return 0.5;

    // Calculate consistency of session durations
    const durations = sessions.map(s => s.durationSeconds / 60); // Convert to minutes
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    
    // Calculate coefficient of variation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / avgDuration;
    
    // Lower variation = better time management (max score at CV < 0.2)
    return Math.max(0, Math.min(1, 1 - coefficientOfVariation / 0.5));
  }

  /**
   * Calculate component readiness scores
   */
  private calculateComponentReadiness(
    componentAnalysis: Record<Component, ComponentAnalysis>
  ): Record<Component, number> {
    const readiness: Record<string, number> = {};

    Object.entries(componentAnalysis).forEach(([component, analysis]) => {
      const typedAnalysis = analysis as ComponentAnalysis;
      
      // Base score from average performance
      const baseScore = typedAnalysis.averageScore / 100;
      
      // Adjust for trend
      const trendAdjustment = typedAnalysis.improvementTrend === "improving" ? 0.1 :
                             typedAnalysis.improvementTrend === "declining" ? -0.1 : 0;
      
      // Adjust for session count (more sessions = higher confidence)
      const sessionAdjustment = Math.min(0.1, typedAnalysis.sessionsCompleted / 20);
      
      readiness[component] = Math.max(0, Math.min(1, 
        baseScore + trendAdjustment + sessionAdjustment
      ));
    });

    return readiness as Record<Component, number>;
  }

  /**
   * Calculate weighted overall score
   */
  private calculateWeightedScore(factors: Record<string, number>): number {
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(this.config.factorWeights).forEach(([factor, weight]) => {
      if (factors[factor] !== undefined) {
        weightedSum += factors[factor] * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Determine readiness level based on score
   */
  private determineReadinessLevel(score: number): "excellent" | "good" | "fair" | "poor" {
    if (score >= this.config.thresholds.excellent) return "excellent";
    if (score >= this.config.thresholds.good) return "good";
    if (score >= this.config.thresholds.fair) return "fair";
    return "poor";
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    factors: Record<string, number>,
    componentReadiness: Record<Component, number>,
    progress: UserProgress,
    level: string
  ): ReadinessRecommendation[] {
    const recommendations: ReadinessRecommendation[] = [];

    // Component-specific recommendations
    Object.entries(componentReadiness).forEach(([component, readiness]) => {
      if (readiness < 0.6) {
        recommendations.push({
          type: "component_focus",
          priority: "high",
          title: `Improve ${component.charAt(0).toUpperCase() + component.slice(1)} Skills`,
          description: `Your ${component} performance is below target. Focus additional practice here.`,
          actionItems: [
            `Complete 2-3 ${component} practice sessions this week`,
            `Review your mistakes in previous ${component} exercises`,
            `Study specific ${component} strategies and techniques`,
          ],
          estimatedImpact: 0.15,
        });
      }
    });

    // Frequency recommendations
    if (factors.sessionFrequency < 0.5) {
      recommendations.push({
        type: "practice_frequency",
        priority: "medium",
        title: "Increase Practice Frequency",
        description: "Regular practice sessions will improve retention and performance.",
        actionItems: [
          "Aim for 3-4 practice sessions per week",
          "Set up a consistent study schedule",
          "Use shorter, more frequent sessions rather than long cramming",
        ],
        estimatedImpact: 0.10,
      });
    }

    // Consistency recommendations
    if (factors.consistency < 0.6) {
      recommendations.push({
        type: "weakness_recovery",
        priority: "high",
        title: "Address Performance Inconsistency",
        description: "Your scores vary significantly. Focus on building consistent performance.",
        actionItems: [
          "Review and practice your weakest topics regularly",
          "Take practice tests under exam conditions",
          "Develop pre-exam routines to reduce anxiety",
        ],
        estimatedImpact: 0.12,
      });
    }

    // Study time recommendations
    if (level === "poor" || level === "fair") {
      recommendations.push({
        type: "study_time",
        priority: "high",
        title: "Increase Study Time",
        description: "Additional focused study time is needed to reach exam readiness.",
        actionItems: [
          "Dedicate at least 1 hour per day to targeted practice",
          "Use spaced repetition for vocabulary and grammar",
          "Join study groups or find a study partner",
        ],
        estimatedImpact: 0.20,
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Estimate likely exam score
   */
  private estimateExamScore(readinessScore: number, dataQuality: DataQualityMetrics): number {
    // Base prediction from readiness score
    let estimatedScore = readinessScore * 100;

    // Adjust for data quality confidence
    const confidenceMultiplier = 0.8 + (dataQuality.consistencyScore * 0.2);
    estimatedScore *= confidenceMultiplier;

    // Add some conservative adjustment (real exams are typically harder)
    estimatedScore *= 0.85;

    return Math.max(0, Math.min(100, estimatedScore));
  }

  /**
   * Calculate recommended study hours
   */
  private calculateRecommendedStudyHours(
    readinessScore: number,
    targetLevel: Level | undefined,
    analytics: ProgressAnalytics
  ): number {
    const targetReadiness = targetLevel === "c2" ? 0.95 :
                           targetLevel === "c1" ? 0.90 :
                           targetLevel === "b2" ? 0.85 :
                           targetLevel === "b1" ? 0.75 :
                           targetLevel === "a2" ? 0.65 : 0.55;

    const readinessGap = Math.max(0, targetReadiness - readinessScore);
    
    // Estimate hours needed based on learning velocity
    const learningVelocity = analytics.learningVelocity || 0.05; // Default improvement per hour
    
    return readinessGap / learningVelocity;
  }

  /**
   * Generate milestone recommendations
   */
  private generateMilestones(
    currentReadiness: number,
    componentReadiness: Record<Component, number>,
    estimatedExamScore: number
  ): Milestone[] {
    const milestones: Milestone[] = [];

    // Short-term milestone
    if (currentReadiness < 0.7) {
      milestones.push({
        title: "Build Foundation",
        description: "Establish consistent performance across all components",
        targetScore: 70,
        estimatedWeeks: 4,
        actions: [
          "Complete daily practice sessions",
          "Focus on weakest components",
          "Take weekly assessment tests",
        ],
      });
    }

    // Medium-term milestone
    if (currentReadiness < 0.85) {
      milestones.push({
        title: "Achieve Proficiency",
        description: "Reach consistent high performance across all skills",
        targetScore: 80,
        estimatedWeeks: 8,
        actions: [
          "Take full-length practice exams weekly",
          "Work with native speakers or tutors",
          "Focus on time management strategies",
        ],
      });
    }

    // Long-term milestone
    milestones.push({
      title: "Exam Ready",
      description: "Full exam readiness with confidence",
      targetScore: 90,
      estimatedWeeks: 12,
      actions: [
        "Take mock exams under real conditions",
        "Fine-tune weak areas with targeted practice",
        "Develop pre-exam routines",
      ],
    });

    return milestones;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<ReadinessConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): ReadinessConfig {
    return { ...this.config };
  }
}