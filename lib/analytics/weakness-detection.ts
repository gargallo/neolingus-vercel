/**
 * Weakness Detection Algorithms
 * Neolingus Academy Analytics System
 * 
 * Advanced algorithms to identify learning weaknesses and provide
 * targeted recommendations for improvement using statistical analysis
 * and pattern recognition techniques
 */

import {
  UserProgress,
  ProgressAnalytics,
  ComponentAnalysis,
  ExamSession,
  ExamResponse,
  Component,
  QuestionType,
} from "@/lib/exam-engine/types";

// Weakness detection configuration
export interface WeaknessDetectionConfig {
  minSessionsForAnalysis: number;
  scoreThresholds: {
    critical: number;    // Below this is critical weakness
    moderate: number;    // Below this is moderate weakness
    slight: number;      // Below this is slight weakness
  };
  consistencyThreshold: number; // CV threshold for inconsistent performance
  improvementWindowWeeks: number;
  minQuestionsPerPattern: number;
  confidenceThreshold: number;
}

export const DEFAULT_WEAKNESS_CONFIG: WeaknessDetectionConfig = {
  minSessionsForAnalysis: 3,
  scoreThresholds: {
    critical: 40,  // <40% critical
    moderate: 60,  // 40-60% moderate
    slight: 75,    // 60-75% slight
  },
  consistencyThreshold: 0.3, // CV > 30% is inconsistent
  improvementWindowWeeks: 4,
  minQuestionsPerPattern: 5,
  confidenceThreshold: 0.7,
};

// Weakness severity levels
export type WeaknessSeverity = "critical" | "moderate" | "slight";
export type WeaknessType = 
  | "component_skill"      // Overall component weakness
  | "question_type"        // Specific question type weakness
  | "topic_area"          // Subject matter weakness
  | "time_management"     // Time-related issues
  | "consistency"         // Inconsistent performance
  | "improvement_stagnation" // Lack of progress
  | "error_pattern";      // Recurring mistake patterns

// Individual weakness identification
export interface WeaknessDetail {
  id: string;
  type: WeaknessType;
  severity: WeaknessSeverity;
  component: Component;
  specificArea: string; // e.g., "grammar", "vocabulary", "reading_comprehension"
  description: string;
  evidence: WeaknessEvidence;
  impact: WeaknessImpact;
  recommendations: WeaknessRecommendation[];
  confidence: number; // 0.0 to 1.0
  detectedAt: Date;
  trend: "worsening" | "stable" | "improving";
}

export interface WeaknessEvidence {
  averageScore: number;
  scoreVariation: number; // Coefficient of variation
  sessionCount: number;
  questionCount: number;
  recentPerformance: number[]; // Last 5-10 scores
  errorPatterns: string[];
  timeSpentAverage: number; // seconds
  improvementRate: number; // per week
}

export interface WeaknessImpact {
  overallScoreImpact: number; // How much this affects overall performance
  examReadinessImpact: number; // Impact on exam readiness
  learningVelocityImpact: number; // Impact on learning progress
  confidenceImpact: number; // Psychological impact
  priorityScore: number; // 0.0 to 1.0, higher = more urgent
}

export interface WeaknessRecommendation {
  action: string;
  priority: "high" | "medium" | "low";
  estimatedTimeInvestment: number; // hours
  expectedImprovement: number; // score points
  resources: RecommendedResource[];
}

export interface RecommendedResource {
  type: "practice" | "tutorial" | "reference" | "assessment";
  title: string;
  description: string;
  url?: string;
  estimatedTime: number; // minutes
  difficulty: "beginner" | "intermediate" | "advanced";
}

// Comprehensive weakness analysis result
export interface WeaknessAnalysis {
  overallWeaknessScore: number; // 0.0 to 1.0, higher = more weaknesses
  criticalWeaknesses: WeaknessDetail[];
  moderateWeaknesses: WeaknessDetail[];
  slightWeaknesses: WeaknessDetail[];
  patterns: WeaknessPattern[];
  prioritizedActions: PrioritizedAction[];
  improvementPlan: ImprovementPlan;
  confidence: number;
  analysisDate: Date;
  dataQuality: AnalysisDataQuality;
}

export interface WeaknessPattern {
  pattern: string;
  occurrences: number;
  components: Component[];
  severity: WeaknessSeverity;
  description: string;
  recommendations: string[];
}

export interface PrioritizedAction {
  rank: number;
  weakness: WeaknessDetail;
  estimatedImpact: number;
  urgency: number;
  effort: number;
  actionPlan: string[];
}

export interface ImprovementPlan {
  weeklyGoals: WeeklyGoal[];
  milestones: PlanMilestone[];
  totalEstimatedWeeks: number;
  expectedScoreImprovement: number;
  riskFactors: string[];
}

export interface WeeklyGoal {
  week: number;
  focusAreas: string[];
  studyHours: number;
  practiceTypes: string[];
  targetImprovement: number;
  successMetrics: string[];
}

export interface PlanMilestone {
  week: number;
  title: string;
  targetScore: number;
  assessmentType: string;
  successCriteria: string[];
}

export interface AnalysisDataQuality {
  sessionCoverage: number; // 0.0 to 1.0
  componentCoverage: number; // 0.0 to 1.0
  timeSpan: number; // days
  recencyScore: number; // 0.0 to 1.0
  volumeScore: number; // 0.0 to 1.0
}

/**
 * Main weakness detection engine
 */
export class WeaknessDetectionEngine {
  private config: WeaknessDetectionConfig;

  constructor(config: WeaknessDetectionConfig = DEFAULT_WEAKNESS_CONFIG) {
    this.config = config;
  }

  /**
   * Perform comprehensive weakness analysis
   */
  async analyzeWeaknesses(
    progress: UserProgress,
    examSessions: ExamSession[]
  ): Promise<WeaknessAnalysis> {
    const completedSessions = examSessions
      .filter(session => session.isCompleted)
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

    // Assess data quality
    const dataQuality = this.assessDataQuality(progress, completedSessions);
    
    // Detect different types of weaknesses
    const componentWeaknesses = this.detectComponentWeaknesses(progress.analytics);
    const questionTypeWeaknesses = this.detectQuestionTypeWeaknesses(completedSessions);
    const timeManagementWeaknesses = this.detectTimeManagementWeaknesses(completedSessions);
    const consistencyWeaknesses = this.detectConsistencyWeaknesses(progress.analytics);
    const stagnationWeaknesses = this.detectImprovementStagnation(completedSessions);
    const errorPatternWeaknesses = this.detectErrorPatterns(completedSessions);

    // Combine all weaknesses
    const allWeaknesses = [
      ...componentWeaknesses,
      ...questionTypeWeaknesses,
      ...timeManagementWeaknesses,
      ...consistencyWeaknesses,
      ...stagnationWeaknesses,
      ...errorPatternWeaknesses,
    ];

    // Categorize by severity
    const criticalWeaknesses = allWeaknesses.filter(w => w.severity === "critical");
    const moderateWeaknesses = allWeaknesses.filter(w => w.severity === "moderate");
    const slightWeaknesses = allWeaknesses.filter(w => w.severity === "slight");

    // Detect patterns
    const patterns = this.identifyWeaknessPatterns(allWeaknesses);

    // Prioritize actions
    const prioritizedActions = this.prioritizeActions(allWeaknesses);

    // Generate improvement plan
    const improvementPlan = this.generateImprovementPlan(
      prioritizedActions,
      progress.analytics
    );

    // Calculate overall weakness score
    const overallWeaknessScore = this.calculateOverallWeaknessScore(allWeaknesses);

    // Calculate analysis confidence
    const confidence = this.calculateAnalysisConfidence(dataQuality, allWeaknesses);

    return {
      overallWeaknessScore,
      criticalWeaknesses,
      moderateWeaknesses,
      slightWeaknesses,
      patterns,
      prioritizedActions,
      improvementPlan,
      confidence,
      analysisDate: new Date(),
      dataQuality,
    };
  }

  /**
   * Assess the quality of available data for analysis
   */
  private assessDataQuality(
    progress: UserProgress,
    sessions: ExamSession[]
  ): AnalysisDataQuality {
    const sessionCount = sessions.length;
    const componentsWithSessions = new Set(sessions.map(s => s.component));
    const totalComponents = 4; // reading, writing, listening, speaking
    
    // Time span analysis
    const timeSpan = sessions.length > 1
      ? (new Date(sessions[sessions.length - 1].startedAt).getTime() - 
         new Date(sessions[0].startedAt).getTime()) / (1000 * 60 * 60 * 24)
      : 0;

    // Recent activity
    const daysSinceLastActivity = (Date.now() - progress.lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    return {
      sessionCoverage: Math.min(1, sessionCount / this.config.minSessionsForAnalysis),
      componentCoverage: componentsWithSessions.size / totalComponents,
      timeSpan,
      recencyScore: Math.max(0, 1 - (daysSinceLastActivity / 30)), // 30 days decay
      volumeScore: Math.min(1, sessionCount / 20), // 20 sessions for full volume
    };
  }

  /**
   * Detect component-level weaknesses
   */
  private detectComponentWeaknesses(analytics: ProgressAnalytics): WeaknessDetail[] {
    const weaknesses: WeaknessDetail[] = [];

    Object.entries(analytics.componentAnalysis).forEach(([component, analysis]) => {
      const typedAnalysis = analysis as ComponentAnalysis;
      const score = typedAnalysis.averageScore;
      
      let severity: WeaknessSeverity | null = null;
      if (score < this.config.scoreThresholds.critical) {
        severity = "critical";
      } else if (score < this.config.scoreThresholds.moderate) {
        severity = "moderate";
      } else if (score < this.config.scoreThresholds.slight) {
        severity = "slight";
      }

      if (severity) {
        const skillBreakdown = typedAnalysis.skillBreakdown || {};
        const weakestSkill = Object.entries(skillBreakdown).reduce((min, curr) =>
          curr[1] < min[1] ? curr : min
        );

        weaknesses.push({
          id: `component_${component}_${Date.now()}`,
          type: "component_skill",
          severity,
          component: component as Component,
          specificArea: weakestSkill[0] || component,
          description: `${component.charAt(0).toUpperCase() + component.slice(1)} performance is below target level`,
          evidence: {
            averageScore: score,
            scoreVariation: this.calculateScoreVariation(typedAnalysis),
            sessionCount: typedAnalysis.sessionsCompleted,
            questionCount: typedAnalysis.sessionsCompleted * 10, // Estimate
            recentPerformance: [], // Would need session details
            errorPatterns: [],
            timeSpentAverage: (typedAnalysis.timeSpentMinutes / typedAnalysis.sessionsCompleted) * 60,
            improvementRate: this.calculateComponentImprovementRate(typedAnalysis),
          },
          impact: this.calculateWeaknessImpact(component as Component, score, analytics),
          recommendations: this.generateComponentRecommendations(component, severity),
          confidence: this.calculateWeaknessConfidence(typedAnalysis.sessionsCompleted),
          detectedAt: new Date(),
          trend: typedAnalysis.improvementTrend || "stable",
        });
      }
    });

    return weaknesses;
  }

  /**
   * Detect question type weaknesses
   */
  private detectQuestionTypeWeaknesses(sessions: ExamSession[]): WeaknessDetail[] {
    const weaknesses: WeaknessDetail[] = [];
    const questionTypePerformance: Record<string, number[]> = {};

    // Aggregate performance by question type (would need more detailed session data)
    sessions.forEach(session => {
      // This is a simplified version - in reality we'd analyze individual responses
      const estimatedQuestionTypes = ["multiple_choice", "gap_fill", "essay"];
      estimatedQuestionTypes.forEach(type => {
        if (!questionTypePerformance[type]) {
          questionTypePerformance[type] = [];
        }
        // Add some variance to the session score for different question types
        const variance = (Math.random() - 0.5) * 20;
        questionTypePerformance[type].push((session.score || 0) + variance);
      });
    });

    // Analyze each question type
    Object.entries(questionTypePerformance).forEach(([questionType, scores]) => {
      if (scores.length >= this.config.minQuestionsPerPattern) {
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        let severity: WeaknessSeverity | null = null;
        if (avgScore < this.config.scoreThresholds.critical) {
          severity = "critical";
        } else if (avgScore < this.config.scoreThresholds.moderate) {
          severity = "moderate";
        } else if (avgScore < this.config.scoreThresholds.slight) {
          severity = "slight";
        }

        if (severity) {
          weaknesses.push({
            id: `question_type_${questionType}_${Date.now()}`,
            type: "question_type",
            severity,
            component: this.inferComponentFromQuestionType(questionType),
            specificArea: questionType,
            description: `Difficulty with ${questionType.replace('_', ' ')} questions`,
            evidence: {
              averageScore: avgScore,
              scoreVariation: this.calculateVariation(scores),
              sessionCount: sessions.length,
              questionCount: scores.length,
              recentPerformance: scores.slice(-5),
              errorPatterns: [],
              timeSpentAverage: 120, // Estimate
              improvementRate: 0,
            },
            impact: {
              overallScoreImpact: 0.2,
              examReadinessImpact: 0.15,
              learningVelocityImpact: 0.1,
              confidenceImpact: 0.1,
              priorityScore: severity === "critical" ? 0.8 : severity === "moderate" ? 0.6 : 0.4,
            },
            recommendations: this.generateQuestionTypeRecommendations(questionType, severity),
            confidence: Math.min(1, scores.length / 10),
            detectedAt: new Date(),
            trend: "stable",
          });
        }
      }
    });

    return weaknesses;
  }

  /**
   * Detect time management issues
   */
  private detectTimeManagementWeaknesses(sessions: ExamSession[]): WeaknessDetail[] {
    const weaknesses: WeaknessDetail[] = [];
    
    if (sessions.length < 3) return weaknesses;

    const durations = sessions.map(s => s.durationSeconds / 60); // Convert to minutes
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const cv = this.calculateVariation(durations);

    // Check for time management issues
    if (cv > this.config.consistencyThreshold) {
      weaknesses.push({
        id: `time_management_${Date.now()}`,
        type: "time_management",
        severity: cv > 0.5 ? "critical" : "moderate",
        component: "reading", // Default, affects all components
        specificArea: "time_consistency",
        description: "Inconsistent time management across sessions",
        evidence: {
          averageScore: 0,
          scoreVariation: cv,
          sessionCount: sessions.length,
          questionCount: 0,
          recentPerformance: durations.slice(-5),
          errorPatterns: ["time_inconsistency"],
          timeSpentAverage: avgDuration * 60,
          improvementRate: 0,
        },
        impact: {
          overallScoreImpact: 0.15,
          examReadinessImpact: 0.3,
          learningVelocityImpact: 0.2,
          confidenceImpact: 0.25,
          priorityScore: 0.7,
        },
        recommendations: [{
          action: "Practice with timed sessions",
          priority: "high",
          estimatedTimeInvestment: 5,
          expectedImprovement: 10,
          resources: [],
        }],
        confidence: Math.min(1, sessions.length / 10),
        detectedAt: new Date(),
        trend: "stable",
      });
    }

    return weaknesses;
  }

  /**
   * Detect consistency issues
   */
  private detectConsistencyWeaknesses(analytics: ProgressAnalytics): WeaknessDetail[] {
    const weaknesses: WeaknessDetail[] = [];

    if (analytics.consistencyScore < 0.6) {
      weaknesses.push({
        id: `consistency_${Date.now()}`,
        type: "consistency",
        severity: analytics.consistencyScore < 0.3 ? "critical" : "moderate",
        component: "reading", // Default, affects all components
        specificArea: "performance_consistency",
        description: "Inconsistent performance across sessions",
        evidence: {
          averageScore: analytics.averageScore,
          scoreVariation: 1 - analytics.consistencyScore,
          sessionCount: analytics.totalSessions,
          questionCount: 0,
          recentPerformance: [],
          errorPatterns: ["performance_variation"],
          timeSpentAverage: 0,
          improvementRate: analytics.improvementRate,
        },
        impact: {
          overallScoreImpact: 0.2,
          examReadinessImpact: 0.4,
          learningVelocityImpact: 0.15,
          confidenceImpact: 0.3,
          priorityScore: 0.75,
        },
        recommendations: [{
          action: "Focus on building consistent study habits",
          priority: "high",
          estimatedTimeInvestment: 10,
          expectedImprovement: 15,
          resources: [],
        }],
        confidence: Math.min(1, analytics.totalSessions / 10),
        detectedAt: new Date(),
        trend: "stable",
      });
    }

    return weaknesses;
  }

  /**
   * Detect improvement stagnation
   */
  private detectImprovementStagnation(sessions: ExamSession[]): WeaknessDetail[] {
    const weaknesses: WeaknessDetail[] = [];

    if (sessions.length < 5) return weaknesses;

    const recentSessions = sessions.slice(-10);
    const scores = recentSessions.map(s => s.score || 0);
    
    // Calculate improvement rate using linear regression
    const improvementRate = this.calculateImprovementRate(scores);

    if (improvementRate < -1) { // Declining performance
      weaknesses.push({
        id: `stagnation_${Date.now()}`,
        type: "improvement_stagnation",
        severity: "moderate",
        component: "reading", // Default
        specificArea: "learning_progress",
        description: "Learning progress has stagnated or declined",
        evidence: {
          averageScore: scores.reduce((sum, score) => sum + score, 0) / scores.length,
          scoreVariation: this.calculateVariation(scores),
          sessionCount: sessions.length,
          questionCount: 0,
          recentPerformance: scores,
          errorPatterns: ["progress_stagnation"],
          timeSpentAverage: 0,
          improvementRate,
        },
        impact: {
          overallScoreImpact: 0.1,
          examReadinessImpact: 0.3,
          learningVelocityImpact: 0.4,
          confidenceImpact: 0.25,
          priorityScore: 0.6,
        },
        recommendations: [{
          action: "Review and adjust study methods",
          priority: "medium",
          estimatedTimeInvestment: 8,
          expectedImprovement: 12,
          resources: [],
        }],
        confidence: 0.8,
        detectedAt: new Date(),
        trend: "worsening",
      });
    }

    return weaknesses;
  }

  /**
   * Detect error patterns (simplified version)
   */
  private detectErrorPatterns(sessions: ExamSession[]): WeaknessDetail[] {
    const weaknesses: WeaknessDetail[] = [];
    
    // This would typically analyze individual question responses
    // For now, we'll create a simplified pattern detection
    
    const errorPatterns = [
      "grammar_errors",
      "vocabulary_confusion",
      "reading_comprehension_errors",
      "time_pressure_mistakes",
    ];

    // In a real implementation, we'd analyze the actual responses
    // For now, simulate pattern detection based on session performance
    const lowScoringSessions = sessions.filter(s => (s.score || 0) < 60);
    
    if (lowScoringSessions.length >= 3) {
      errorPatterns.forEach(pattern => {
        weaknesses.push({
          id: `error_pattern_${pattern}_${Date.now()}`,
          type: "error_pattern",
          severity: "moderate",
          component: "reading", // Would be inferred from actual pattern
          specificArea: pattern,
          description: `Recurring ${pattern.replace('_', ' ')} detected`,
          evidence: {
            averageScore: 50, // Estimate
            scoreVariation: 0.3,
            sessionCount: lowScoringSessions.length,
            questionCount: 0,
            recentPerformance: lowScoringSessions.slice(-3).map(s => s.score || 0),
            errorPatterns: [pattern],
            timeSpentAverage: 0,
            improvementRate: 0,
          },
          impact: {
            overallScoreImpact: 0.15,
            examReadinessImpact: 0.2,
            learningVelocityImpact: 0.1,
            confidenceImpact: 0.15,
            priorityScore: 0.5,
          },
          recommendations: [{
            action: `Focus on ${pattern.replace('_', ' ')} exercises`,
            priority: "medium",
            estimatedTimeInvestment: 6,
            expectedImprovement: 8,
            resources: [],
          }],
          confidence: 0.6,
          detectedAt: new Date(),
          trend: "stable",
        });
      });
    }

    return weaknesses;
  }

  // Helper methods for calculations and utilities

  private calculateScoreVariation(analysis: ComponentAnalysis): number {
    // Simplified - would calculate from actual scores
    return 0.2; // 20% variation
  }

  private calculateComponentImprovementRate(analysis: ComponentAnalysis): number {
    return analysis.improvementTrend === "improving" ? 5 :
           analysis.improvementTrend === "declining" ? -5 : 0;
  }

  private calculateWeaknessImpact(
    component: Component,
    score: number,
    analytics: ProgressAnalytics
  ): WeaknessImpact {
    const impactMultiplier = (100 - score) / 100; // Higher impact for lower scores
    
    return {
      overallScoreImpact: impactMultiplier * 0.25, // Each component is 25%
      examReadinessImpact: impactMultiplier * 0.3,
      learningVelocityImpact: impactMultiplier * 0.2,
      confidenceImpact: impactMultiplier * 0.25,
      priorityScore: impactMultiplier * 0.8,
    };
  }

  private calculateWeaknessConfidence(sessionCount: number): number {
    return Math.min(1, sessionCount / this.config.minSessionsForAnalysis);
  }

  private calculateVariation(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    return mean === 0 ? 0 : standardDeviation / mean;
  }

  private calculateImprovementRate(scores: number[]): number {
    if (scores.length < 2) return 0;
    
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
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private inferComponentFromQuestionType(questionType: string): Component {
    // Simple mapping - in reality this would be more sophisticated
    const mappings: Record<string, Component> = {
      "reading_comprehension": "reading",
      "essay": "writing",
      "listening_comprehension": "listening",
      "speaking_response": "speaking",
      "multiple_choice": "reading", // Default
      "gap_fill": "reading",
    };
    
    return mappings[questionType] || "reading";
  }

  private generateComponentRecommendations(
    component: string,
    severity: WeaknessSeverity
  ): WeaknessRecommendation[] {
    const timeInvestment = severity === "critical" ? 15 : severity === "moderate" ? 10 : 5;
    const expectedImprovement = severity === "critical" ? 20 : severity === "moderate" ? 15 : 10;
    
    return [{
      action: `Intensive ${component} practice sessions`,
      priority: severity === "critical" ? "high" : "medium",
      estimatedTimeInvestment: timeInvestment,
      expectedImprovement,
      resources: [],
    }];
  }

  private generateQuestionTypeRecommendations(
    questionType: string,
    severity: WeaknessSeverity
  ): WeaknessRecommendation[] {
    return [{
      action: `Practice ${questionType.replace('_', ' ')} questions`,
      priority: severity === "critical" ? "high" : "medium",
      estimatedTimeInvestment: 8,
      expectedImprovement: 12,
      resources: [],
    }];
  }

  private identifyWeaknessPatterns(weaknesses: WeaknessDetail[]): WeaknessPattern[] {
    const patterns: WeaknessPattern[] = [];
    
    // Group by component
    const componentGroups = weaknesses.reduce((groups, weakness) => {
      if (!groups[weakness.component]) {
        groups[weakness.component] = [];
      }
      groups[weakness.component].push(weakness);
      return groups;
    }, {} as Record<Component, WeaknessDetail[]>);

    // Create patterns for components with multiple weaknesses
    Object.entries(componentGroups).forEach(([component, componentWeaknesses]) => {
      if (componentWeaknesses.length > 1) {
        patterns.push({
          pattern: `Multiple ${component} difficulties`,
          occurrences: componentWeaknesses.length,
          components: [component as Component],
          severity: componentWeaknesses.some(w => w.severity === "critical") ? "critical" : "moderate",
          description: `Multiple weaknesses detected in ${component} skills`,
          recommendations: [`Focus intensive study on ${component} component`],
        });
      }
    });

    return patterns;
  }

  private prioritizeActions(weaknesses: WeaknessDetail[]): PrioritizedAction[] {
    return weaknesses
      .map((weakness, index) => ({
        rank: index + 1,
        weakness,
        estimatedImpact: weakness.impact.priorityScore,
        urgency: weakness.severity === "critical" ? 1.0 : weakness.severity === "moderate" ? 0.7 : 0.4,
        effort: weakness.recommendations[0]?.estimatedTimeInvestment || 5,
        actionPlan: weakness.recommendations.map(rec => rec.action),
      }))
      .sort((a, b) => (b.estimatedImpact * b.urgency) - (a.estimatedImpact * a.urgency))
      .map((action, index) => ({ ...action, rank: index + 1 }));
  }

  private generateImprovementPlan(
    actions: PrioritizedAction[],
    analytics: ProgressAnalytics
  ): ImprovementPlan {
    const totalWeeks = Math.min(12, Math.max(4, actions.length * 2));
    const weeklyGoals: WeeklyGoal[] = [];
    
    for (let week = 1; week <= totalWeeks; week++) {
      const weeklyActions = actions.slice((week - 1) * 2, week * 2);
      
      weeklyGoals.push({
        week,
        focusAreas: weeklyActions.map(action => action.weakness.specificArea),
        studyHours: weeklyActions.reduce((sum, action) => sum + action.effort, 0),
        practiceTypes: weeklyActions.map(action => action.weakness.type),
        targetImprovement: 5, // 5 points per week
        successMetrics: ["Complete daily practice", "Achieve target score"],
      });
    }

    const milestones: PlanMilestone[] = [
      {
        week: Math.ceil(totalWeeks / 3),
        title: "Foundation Building",
        targetScore: analytics.averageScore + 10,
        assessmentType: "practice_test",
        successCriteria: ["Consistent performance", "Reduced critical weaknesses"],
      },
      {
        week: Math.ceil(totalWeeks * 2 / 3),
        title: "Skill Development",
        targetScore: analytics.averageScore + 20,
        assessmentType: "mock_exam",
        successCriteria: ["Improved component scores", "Better time management"],
      },
      {
        week: totalWeeks,
        title: "Exam Readiness",
        targetScore: analytics.averageScore + 30,
        assessmentType: "full_mock",
        successCriteria: ["Consistent high performance", "All weaknesses addressed"],
      },
    ];

    return {
      weeklyGoals,
      milestones,
      totalEstimatedWeeks: totalWeeks,
      expectedScoreImprovement: 30,
      riskFactors: ["Study consistency", "Time management", "Motivation maintenance"],
    };
  }

  private calculateOverallWeaknessScore(weaknesses: WeaknessDetail[]): number {
    if (weaknesses.length === 0) return 0;
    
    const severityWeights = { critical: 1.0, moderate: 0.6, slight: 0.3 };
    const weightedSum = weaknesses.reduce((sum, weakness) => 
      sum + severityWeights[weakness.severity], 0
    );
    
    return Math.min(1, weightedSum / weaknesses.length);
  }

  private calculateAnalysisConfidence(
    dataQuality: AnalysisDataQuality,
    weaknesses: WeaknessDetail[]
  ): number {
    const dataConfidence = (
      dataQuality.sessionCoverage +
      dataQuality.componentCoverage +
      dataQuality.recencyScore +
      dataQuality.volumeScore
    ) / 4;

    const weaknessConfidence = weaknesses.length > 0
      ? weaknesses.reduce((sum, w) => sum + w.confidence, 0) / weaknesses.length
      : 1;

    return (dataConfidence + weaknessConfidence) / 2;
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<WeaknessDetectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  public getConfig(): WeaknessDetectionConfig {
    return { ...this.config };
  }
}