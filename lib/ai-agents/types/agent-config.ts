// Type definitions for AI Agent Configuration System

export type AgentType = 'writing' | 'speaking' | 'reading' | 'listening' | 'general';
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type ModelProvider = 'openai' | 'anthropic' | 'cohere' | 'vercel';
export type DeploymentStatus = 'draft' | 'testing' | 'deploying' | 'active' | 'inactive' | 'error';

export interface AgentConfiguration {
  // Basic Information
  name: string;
  description: string;
  type: AgentType;
  language: string;
  level: LanguageLevel;

  // AI Model Configuration
  modelProvider: ModelProvider;
  modelName: string;
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;

  // System Prompt Configuration
  systemPrompt: {
    base: string;
    culturalContext: string[];
    scoringCriteria: ScoringCriteria;
    examples: ExamExample[];
    instructions?: string[];
    constraints?: string[];
  };

  // Tool Configuration
  tools: ToolConfiguration;

  // Performance Settings
  performance: PerformanceConfiguration;

  // Deployment Settings
  deployment: DeploymentConfiguration;

  // Optional metadata
  metadata?: {
    institution?: string;
    examType?: string;
    version?: string;
    author?: string;
    tags?: string[];
  };
}

export interface ScoringCriteria {
  [criterion: string]: {
    weight: number;
    rubric: string;
    description: string;
    maxScore?: number;
  };
}

export interface ExamExample {
  prompt: string;
  response: string;
  score: number;
  feedback: string;
  metadata?: {
    level?: LanguageLevel;
    duration?: number;
    culturalNotes?: string[];
  };
}

export interface ToolConfiguration {
  // Language analysis tools
  grammarChecker: boolean;
  styleAnalyzer?: boolean;
  readabilityChecker?: boolean;
  
  // Cultural and context tools
  culturalValidator: boolean;
  dialectValidator?: boolean;
  literaryReferenceChecker?: boolean;
  
  // Content analysis tools
  plagiarismDetector: boolean;
  rubricScorer: boolean;
  feedbackGenerator: boolean;
  
  // Speaking-specific tools
  pronunciationAnalyzer?: boolean;
  fluencyMeter?: boolean;
  intonationAnalyzer?: boolean;
  pauseAnalyzer?: boolean;
  
  // Vocabulary assessment
  vocabularyAssessor?: boolean;
  complexityAnalyzer?: boolean;
  
  // Custom tools
  customTools?: { [toolName: string]: boolean };
}

export interface PerformanceConfiguration {
  timeout: number; // in milliseconds
  retries: number;
  cacheResults: boolean;
  humanReviewThreshold: number; // 0-1, when to trigger human review
  
  // Quality thresholds
  minimumConfidenceScore?: number;
  maximumProcessingTime?: number;
  
  // Batch processing
  batchSize?: number;
  concurrentRequests?: number;
}

export interface DeploymentConfiguration {
  region: string[]; // Vercel regions
  
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetUtilization: number; // percentage
  };
  
  monitoring: {
    alerts: boolean;
    metrics: string[];
    logs: 'minimal' | 'standard' | 'detailed';
  };
  
  // Environment variables for the deployed agent
  environment?: {
    [key: string]: string;
  };
  
  // Custom domain and routing
  customDomain?: string;
  routing?: {
    path: string;
    methods: string[];
  };
}

// Runtime types for deployed agents
export interface DeployedAgent {
  id: string;
  configuration: AgentConfiguration;
  deploymentUrl: string;
  deploymentId: string;
  status: DeploymentStatus;
  version: number;
  createdAt: Date;
  deployedAt?: Date;
  lastTestedAt?: Date;
}

export interface CorrectionRequest {
  agentId: string;
  examQuestion: string;
  studentAnswer: string;
  context: {
    sessionId: string;
    userId: string;
    courseId: string;
    examType: string;
    timeSpent?: number;
    metadata?: any;
  };
}

export interface CorrectionResponse {
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    culturalNotes?: string[];
  };
  
  detailedScores?: {
    [criterion: string]: {
      score: number;
      maxScore: number;
      feedback: string;
    };
  };
  
  metadata: {
    agentId: string;
    agentName: string;
    processingTime: number;
    confidence: number;
    model: string;
    timestamp: Date;
  };
}

export interface AgentPerformanceMetrics {
  totalCorrections: number;
  averageAccuracy: number;
  averageProcessingTime: number;
  averageStudentSatisfaction: number;
  humanReviewRate: number;
  errorRate: number;
  costPerCorrection: number;
  
  // Time-based metrics
  correctionsPerHour: number;
  peakUsageHours: number[];
  
  // Quality metrics
  consistencyScore: number;
  culturalAccuracy: number;
  feedbackQuality: number;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Template metadata
  type: AgentType;
  language: string;
  level: LanguageLevel;
  institution?: string;
  
  // Template configuration
  configuration: Partial<AgentConfiguration>;
  
  // Usage statistics
  isOfficial: boolean;
  usageCount: number;
  averagePerformance: number;
  lastUsed?: Date;
  
  // Creation info
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Rubric definitions
export interface ScoringRubric {
  code: string;
  name: string;
  description: string;
  
  skillType: AgentType;
  level: LanguageLevel;
  language: string;
  
  maxScore: number;
  criteria: {
    [band: string]: {
      score: number | [number, number];
      description: string;
      examples?: string[];
    };
  };
  
  isActive: boolean;
  version: number;
}

// Agent testing types
export interface AgentTest {
  id: string;
  agentId: string;
  testType: 'unit' | 'integration' | 'performance' | 'quality';
  
  testData: {
    input: CorrectionRequest;
    expectedOutput?: Partial<CorrectionResponse>;
    testCriteria: string[];
  };
  
  results?: {
    passed: boolean;
    score: number;
    actualOutput: CorrectionResponse;
    issues: string[];
    executionTime: number;
  };
  
  createdAt: Date;
  executedAt?: Date;
}

// Export utility types
export type AgentConfigurationPartial = Partial<AgentConfiguration>;
export type AgentCreationRequest = Omit<AgentConfiguration, 'metadata'> & {
  templateId?: string;
};
export type AgentUpdateRequest = Partial<AgentConfiguration> & {
  id: string;
  version: number;
};