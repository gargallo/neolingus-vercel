// Agent Configuration Management
// Centralized configuration for all AI agents

export interface AgentConfig {
  id: string;
  name: string;
  type: 'writing' | 'speaking' | 'reading' | 'listening' | 'general';
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  modelProvider: 'openai' | 'anthropic' | 'google';
  modelName: string;
  systemPrompt: string;
  culturalContext: Record<string, any>;
  scoringCriteria: Record<string, any>;
  performanceConfig: {
    temperature: number;
    maxTokens: number;
    maxSteps: number;
    timeoutMs: number;
  };
  toolsConfig: {
    grammarChecker: boolean;
    vocabularyEnhancer: boolean;
    culturalContextAnalyzer: boolean;
  };
  deploymentSettings: {
    environment: 'development' | 'staging' | 'production';
    rateLimit: number; // requests per minute
    monitoring: boolean;
    logging: boolean;
  };
}

export const DEFAULT_PERFORMANCE_CONFIG = {
  temperature: 0.3,
  maxTokens: 2000,
  maxSteps: 3,
  timeoutMs: 30000,
};

export const DEFAULT_TOOLS_CONFIG = {
  grammarChecker: true,
  vocabularyEnhancer: true,
  culturalContextAnalyzer: true,
};

export const MODEL_CONFIGURATIONS = {
  openai: {
    'gpt-4': {
      contextWindow: 8192,
      costPer1kTokens: 0.03,
      capabilities: ['text', 'reasoning', 'tools'],
      recommended: true
    },
    'gpt-4-turbo': {
      contextWindow: 128000,
      costPer1kTokens: 0.01,
      capabilities: ['text', 'reasoning', 'tools', 'vision'],
      recommended: true
    },
    'gpt-3.5-turbo': {
      contextWindow: 4096,
      costPer1kTokens: 0.002,
      capabilities: ['text', 'tools'],
      recommended: false
    }
  },
  anthropic: {
    'claude-3-sonnet': {
      contextWindow: 200000,
      costPer1kTokens: 0.015,
      capabilities: ['text', 'reasoning', 'tools'],
      recommended: true
    },
    'claude-3-haiku': {
      contextWindow: 200000,
      costPer1kTokens: 0.0025,
      capabilities: ['text', 'tools'],
      recommended: false
    }
  }
};

export const LANGUAGE_CONFIGS = {
  'English': {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    culturalContexts: ['US', 'UK', 'AU', 'CA'],
    commonErrors: ['grammar', 'spelling', 'punctuation', 'style'],
    resources: []
  },
  'Spanish': {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    culturalContexts: ['ES', 'MX', 'AR', 'CO'],
    commonErrors: ['subjunctive', 'ser-estar', 'gender', 'accents'],
    resources: []
  },
  'Valencian': {
    levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
    culturalContexts: ['Valencia', 'Castellon', 'Alicante'],
    commonErrors: ['verb_conjugation', 'article_contractions', 'pronunciation'],
    resources: []
  }
};

export function validateAgentConfig(config: Partial<AgentConfig>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields validation
  if (!config.name) errors.push('Agent name is required');
  if (!config.type) errors.push('Agent type is required');
  if (!config.language) errors.push('Language is required');
  if (!config.level) errors.push('Level is required');
  if (!config.modelProvider) errors.push('Model provider is required');
  if (!config.modelName) errors.push('Model name is required');

  // Model configuration validation
  if (config.modelProvider && config.modelName) {
    const modelConfig = MODEL_CONFIGURATIONS[config.modelProvider as keyof typeof MODEL_CONFIGURATIONS];
    if (!modelConfig || !modelConfig[config.modelName as keyof typeof modelConfig]) {
      errors.push(`Invalid model configuration: ${config.modelProvider}/${config.modelName}`);
    }
  }

  // Performance configuration validation
  if (config.performanceConfig) {
    const perf = config.performanceConfig;
    if (perf.temperature < 0 || perf.temperature > 1) {
      errors.push('Temperature must be between 0 and 1');
    }
    if (perf.maxTokens < 100 || perf.maxTokens > 32000) {
      warnings.push('MaxTokens should be between 100 and 32000 for optimal performance');
    }
    if (perf.maxSteps < 1 || perf.maxSteps > 10) {
      warnings.push('MaxSteps should be between 1 and 10');
    }
  }

  // Language configuration validation
  if (config.language && config.level) {
    const langConfig = LANGUAGE_CONFIGS[config.language as keyof typeof LANGUAGE_CONFIGS];
    if (!langConfig) {
      warnings.push(`No specific configuration found for language: ${config.language}`);
    } else if (!langConfig.levels.includes(config.level)) {
      errors.push(`Invalid level ${config.level} for language ${config.language}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function getOptimalModelForUseCase(
  useCase: 'speed' | 'quality' | 'cost',
  provider?: 'openai' | 'anthropic'
): { provider: string; model: string; reasoning: string } {
  switch (useCase) {
    case 'speed':
      return {
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        reasoning: 'Fastest response times with acceptable quality for most use cases'
      };
    case 'quality':
      return {
        provider: provider === 'anthropic' ? 'anthropic' : 'openai',
        model: provider === 'anthropic' ? 'claude-3-sonnet' : 'gpt-4-turbo',
        reasoning: 'Best reasoning capabilities and highest quality outputs'
      };
    case 'cost':
      return {
        provider: 'anthropic',
        model: 'claude-3-haiku',
        reasoning: 'Most cost-effective while maintaining good quality'
      };
    default:
      return {
        provider: 'openai',
        model: 'gpt-4',
        reasoning: 'Balanced performance, quality, and cost'
      };
  }
}

export function estimateCosts(
  tokensUsed: number,
  provider: string,
  model: string
): { inputCost: number; outputCost: number; totalCost: number } {
  const modelConfig = MODEL_CONFIGURATIONS[provider as keyof typeof MODEL_CONFIGURATIONS];
  const modelData = modelConfig?.[model as keyof typeof modelConfig];
  
  if (!modelData) {
    return { inputCost: 0, outputCost: 0, totalCost: 0 };
  }
  
  const costPer1k = modelData.costPer1kTokens;
  const estimatedInputTokens = Math.floor(tokensUsed * 0.7); // Approximate split
  const estimatedOutputTokens = Math.floor(tokensUsed * 0.3);
  
  const inputCost = (estimatedInputTokens / 1000) * costPer1k;
  const outputCost = (estimatedOutputTokens / 1000) * costPer1k * 2; // Output usually costs 2x
  const totalCost = inputCost + outputCost;
  
  return {
    inputCost: Math.round(inputCost * 10000) / 10000, // Round to 4 decimal places
    outputCost: Math.round(outputCost * 10000) / 10000,
    totalCost: Math.round(totalCost * 10000) / 10000
  };
}

export function generateSystemPrompt(config: Partial<AgentConfig>): string {
  const culturalContext = config.culturalContext 
    ? JSON.stringify(config.culturalContext, null, 2)
    : 'General cultural context';
  
  const scoringCriteria = config.scoringCriteria
    ? JSON.stringify(config.scoringCriteria, null, 2) 
    : 'Standard scoring criteria';

  return `You are ${config.name}, a specialized ${config.language} language learning assistant.

**Your Expertise:**
- Type: ${config.type || 'general'}
- Language: ${config.language || 'multiple languages'}
- Level: ${config.level || 'all levels'}
- Focus: ${config.type === 'writing' ? 'Written communication and grammar' : 
          config.type === 'speaking' ? 'Oral communication and pronunciation' :
          config.type === 'reading' ? 'Reading comprehension and vocabulary' :
          config.type === 'listening' ? 'Audio comprehension and context' :
          'General language skills'}

**Cultural Context:**
${culturalContext}

**Scoring Criteria:**
${scoringCriteria}

**Your Mission:**
1. Provide accurate, constructive feedback on language use
2. Identify errors and explain corrections clearly
3. Suggest improvements appropriate for the ${config.level || 'target'} level
4. Consider cultural appropriateness and context
5. Encourage continued learning with positive reinforcement

**Instructions:**
- Use available tools to analyze the text comprehensively
- Provide specific examples and explanations
- Focus on the most important improvements for the student's level
- Be supportive and encouraging while maintaining accuracy
- Include cultural notes when relevant

Always strive for accuracy, clarity, and helpfulness in your responses.`;
}