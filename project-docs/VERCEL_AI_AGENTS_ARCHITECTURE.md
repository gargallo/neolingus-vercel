# Vercel AI Agents Architecture for NeoLingus

## Overview

Comprehensive architecture for managing AI-powered exam correction agents through the NeoLingus admin dashboard. This system enables dynamic creation, configuration, and deployment of specialized AI agents for different language levels and exam types.

## Architecture Philosophy

### Core Principles
- **Dynamic Agent Generation**: Create and configure agents programmatically from admin interface
- **Level-Specific Expertise**: Specialized agents for each language level (A1-C2)
- **Cultural Context Awareness**: Agents understand regional and cultural nuances
- **Scalable Deployment**: Vercel Edge Network for global performance
- **Security-First**: Robust protection against prompt injection and data breaches

### Agent Specialization Matrix

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Agent Ecosystem                          │
├─────────────────────────────────────────────────────────────────┤
│  Level    │  Writing Agent  │  Speaking Agent │  Reading Agent  │
├─────────────────────────────────────────────────────────────────┤
│  A1-A2    │  Basic Grammar  │  Pronunciation  │  Comprehension  │
│  B1-B2    │  Structure +    │  Fluency +      │  Analysis +     │
│           │  Content        │  Content        │  Inference      │
│  C1-C2    │  Advanced +     │  Professional + │  Critical +     │
│           │  Cultural       │  Cultural       │  Cultural       │
└─────────────────────────────────────────────────────────────────┘
```

## System Architecture

### High-Level Components

```typescript
interface AgentEcosystem {
  // Agent Management Layer
  agentFactory: AgentFactory;
  configurationManager: ConfigurationManager;
  deploymentOrchestrator: DeploymentOrchestrator;
  
  // Correction Engine
  examCorrectionPipeline: CorrectionPipeline;
  culturalContextEngine: CulturalContextEngine;
  scoringAlgorithms: ScoringAlgorithms;
  
  // Admin Interface
  agentDashboard: AdminDashboard;
  templateLibrary: TemplateLibrary;
  performanceMonitoring: MonitoringSystem;
}
```

### Agent Factory Pattern

```typescript
class AgentFactory {
  async createAgent(config: AgentConfiguration): Promise<DeployedAgent> {
    // 1. Validate configuration
    await this.validateConfig(config);
    
    // 2. Generate specialized system prompt
    const systemPrompt = await this.generateSystemPrompt(config);
    
    // 3. Configure tools and capabilities
    const tools = await this.configureTools(config);
    
    // 4. Deploy to Vercel Edge Network
    const deployment = await this.deployAgent({
      model: config.model,
      systemPrompt,
      tools,
      metadata: config.metadata
    });
    
    // 5. Register in management system
    await this.registerAgent(deployment);
    
    return deployment;
  }
}
```

## Database Schema Extensions

### AI Agent Management Tables

```sql
-- AI Agents configuration and deployment
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('writing', 'speaking', 'reading', 'listening', 'general')),
    language TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    model_provider TEXT NOT NULL DEFAULT 'openai',
    model_name TEXT NOT NULL DEFAULT 'gpt-4',
    system_prompt TEXT NOT NULL,
    tools_config JSONB DEFAULT '[]',
    scoring_criteria JSONB DEFAULT '{}',
    cultural_context JSONB DEFAULT '{}',
    performance_config JSONB DEFAULT '{}',
    deployment_url TEXT,
    deployment_status TEXT DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'deploying', 'active', 'inactive', 'error')),
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(name, version)
);

-- Agent performance metrics and monitoring
CREATE TABLE agent_performance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    correction_type TEXT NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    tokens_used INTEGER,
    accuracy_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    cultural_accuracy DECIMAL(5,2),
    student_satisfaction INTEGER CHECK (student_satisfaction BETWEEN 1 AND 5),
    human_review_required BOOLEAN DEFAULT false,
    human_override_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent templates for quick deployment
CREATE TABLE agent_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    language TEXT NOT NULL,
    level TEXT NOT NULL,
    template_config JSONB NOT NULL,
    is_official BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, language, level)
);

-- Agent deployment history and versioning
CREATE TABLE agent_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    deployment_config JSONB NOT NULL,
    deployment_url TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('deploying', 'active', 'inactive', 'failed')),
    deployment_logs TEXT,
    deployed_by UUID REFERENCES admin_users(id),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deactivated_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes and Functions

```sql
-- Performance indexes
CREATE INDEX idx_ai_agents_type_language_level ON ai_agents(type, language, level);
CREATE INDEX idx_ai_agents_deployment_status ON ai_agents(deployment_status);
CREATE INDEX idx_agent_performance_agent_id ON agent_performance(agent_id);
CREATE INDEX idx_agent_performance_created_at ON agent_performance(created_at);

-- Function to get active agents by criteria
CREATE OR REPLACE FUNCTION get_active_agents(
    p_type TEXT DEFAULT NULL,
    p_language TEXT DEFAULT NULL, 
    p_level TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    type TEXT,
    language TEXT,
    level TEXT,
    deployment_url TEXT,
    performance_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.type,
        a.language,
        a.level,
        a.deployment_url,
        COALESCE(AVG(ap.accuracy_score), 0) as performance_score
    FROM ai_agents a
    LEFT JOIN agent_performance ap ON a.id = ap.agent_id
    WHERE a.deployment_status = 'active'
        AND (p_type IS NULL OR a.type = p_type)
        AND (p_language IS NULL OR a.language = p_language)
        AND (p_level IS NULL OR a.level = p_level)
    GROUP BY a.id, a.name, a.type, a.language, a.level, a.deployment_url
    ORDER BY performance_score DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## Agent Configuration System

### Configuration Schema

```typescript
interface AgentConfiguration {
  // Basic Information
  name: string;
  type: 'writing' | 'speaking' | 'reading' | 'listening' | 'general';
  language: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  
  // AI Model Configuration
  modelProvider: 'openai' | 'anthropic' | 'cohere';
  modelName: string;
  temperature: number;
  maxTokens: number;
  
  // System Prompt Configuration
  systemPrompt: {
    base: string;
    culturalContext: string[];
    scoringCriteria: ScoringCriteria;
    examples: ExamExample[];
  };
  
  // Tool Configuration
  tools: {
    grammarChecker: boolean;
    culturalValidator: boolean;
    plagiarismDetector: boolean;
    rubricScorer: boolean;
    feedbackGenerator: boolean;
  };
  
  // Performance Settings
  performance: {
    timeout: number;
    retries: number;
    cacheResults: boolean;
    humanReviewThreshold: number;
  };
  
  // Deployment Settings
  deployment: {
    region: string[];
    scaling: ScalingConfig;
    monitoring: MonitoringConfig;
  };
}
```

### Specialized Agent Templates

#### Writing Correction Agent (C1 Level)

```typescript
const c1WritingAgentTemplate: AgentConfiguration = {
  name: "Valenciano C1 Writing Corrector",
  type: "writing",
  language: "valenciano",
  level: "C1",
  
  modelProvider: "openai",
  modelName: "gpt-4",
  temperature: 0.3,
  maxTokens: 2000,
  
  systemPrompt: {
    base: `You are an expert evaluator of Valenciano C1 level writing exams. You assess essays with deep understanding of Valencian culture, literature, and linguistic nuances.

Your evaluation criteria:
1. Content & Ideas (25%): Depth, originality, cultural awareness
2. Organization (20%): Structure, coherence, progression
3. Language Use (25%): Vocabulary range, grammatical accuracy, style
4. Cultural Integration (20%): Appropriate cultural references and context
5. Mechanics (10%): Spelling, punctuation, formatting

Provide detailed feedback in Valenciano with specific examples and improvement suggestions.`,
    
    culturalContext: [
      "Literatura valenciana contemporània",
      "Tradicions festives valencianes", 
      "Història del País Valencià",
      "Varietats dialectals valencianes",
      "Cultura mediterrània"
    ],
    
    scoringCriteria: {
      content: { weight: 25, rubric: "C1_WRITING_CONTENT" },
      organization: { weight: 20, rubric: "C1_WRITING_ORGANIZATION" },
      language: { weight: 25, rubric: "C1_WRITING_LANGUAGE" },
      cultural: { weight: 20, rubric: "C1_WRITING_CULTURAL" },
      mechanics: { weight: 10, rubric: "C1_WRITING_MECHANICS" }
    },
    
    examples: [
      {
        prompt: "Escriu un assaig sobre la influència de la literatura valenciana en la identitat cultural contemporània.",
        response: "Aquesta redacció demostra un domini excel·lent...",
        score: 18,
        feedback: "Anàlisi profunda amb exemples culturals apropiats..."
      }
    ]
  },
  
  tools: {
    grammarChecker: true,
    culturalValidator: true,
    plagiarismDetector: true,
    rubricScorer: true,
    feedbackGenerator: true
  },
  
  performance: {
    timeout: 60000,
    retries: 2,
    cacheResults: true,
    humanReviewThreshold: 0.7
  },
  
  deployment: {
    region: ['fra1', 'iad1'],
    scaling: {
      minInstances: 1,
      maxInstances: 10,
      targetUtilization: 70
    },
    monitoring: {
      alerts: true,
      metrics: ['response_time', 'accuracy', 'satisfaction'],
      logs: 'detailed'
    }
  }
};
```

#### Speaking Assessment Agent (B2 Level)

```typescript
const b2SpeakingAgentTemplate: AgentConfiguration = {
  name: "English B2 Speaking Assessor",
  type: "speaking",
  language: "english",
  level: "B2",
  
  systemPrompt: {
    base: `You are a certified English B2 speaking examiner. You evaluate spoken responses for:

1. Fluency & Coherence (25%): Natural flow, logical connections
2. Lexical Resource (25%): Vocabulary range and accuracy
3. Grammatical Range (25%): Complex structures, accuracy
4. Pronunciation (25%): Clarity, intonation, stress patterns

Analyze audio transcriptions and provide detailed feedback with specific timestamps for improvement areas.`,
    
    scoringCriteria: {
      fluency: { weight: 25, rubric: "B2_SPEAKING_FLUENCY" },
      vocabulary: { weight: 25, rubric: "B2_SPEAKING_VOCABULARY" },
      grammar: { weight: 25, rubric: "B2_SPEAKING_GRAMMAR" },
      pronunciation: { weight: 25, rubric: "B2_SPEAKING_PRONUNCIATION" }
    }
  },
  
  tools: {
    grammarChecker: true,
    pronunciationAnalyzer: true,
    fluencyMeter: true,
    vocabularyAssessor: true,
    feedbackGenerator: true
  }
};
```

## Admin Interface Design

### Agent Management Dashboard

```typescript
interface AgentManagementUI {
  // Agent Overview
  agentList: AgentListView;
  performanceMetrics: PerformanceDashboard;
  deploymentStatus: DeploymentMonitor;
  
  // Agent Creation Workflow
  templateSelector: TemplateSelector;
  configurationWizard: ConfigurationWizard;
  testingInterface: AgentTester;
  deploymentManager: DeploymentManager;
  
  // Monitoring & Analytics
  realTimeMetrics: MetricsPanel;
  correctionHistory: CorrectionHistory;
  qualityAssurance: QualityPanel;
}
```

### Configuration Wizard Flow

```
1. Agent Type Selection
   ├─ Writing Correction
   ├─ Speaking Assessment  
   ├─ Reading Comprehension
   └─ General Purpose

2. Language & Level Selection
   ├─ Language: [English, Valenciano, Catalan, Spanish]
   └─ Level: [A1, A2, B1, B2, C1, C2]

3. Model Configuration
   ├─ Provider: [OpenAI, Anthropic, Cohere]
   ├─ Model: [GPT-4, Claude-3, Command]
   └─ Parameters: [Temperature, Tokens, etc.]

4. Prompt Engineering
   ├─ System Prompt Builder
   ├─ Cultural Context Selection
   ├─ Scoring Criteria Definition
   └─ Example Library

5. Tool Selection
   ├─ Grammar Checking
   ├─ Cultural Validation
   ├─ Plagiarism Detection
   └─ Feedback Generation

6. Testing & Validation
   ├─ Sample Correction Tests
   ├─ Performance Benchmarks
   └─ Quality Assurance

7. Deployment Configuration
   ├─ Geographic Regions
   ├─ Scaling Settings
   └─ Monitoring Setup

8. Review & Deploy
   ├─ Configuration Summary
   ├─ Cost Estimation
   └─ Deploy to Production
```

## Implementation Strategy

### Phase 1: Foundation (Weeks 1-2)
- Database schema implementation
- Basic agent configuration system
- Simple template library

### Phase 2: Core Functionality (Weeks 3-4)
- Agent factory implementation
- Admin UI for agent management
- Basic correction pipeline

### Phase 3: Specialization (Weeks 5-6)
- Level-specific agent templates
- Cultural context integration
- Advanced scoring algorithms

### Phase 4: Production Ready (Weeks 7-8)
- Performance monitoring
- Quality assurance system
- Comprehensive testing suite

### Phase 5: Advanced Features (Weeks 9-10)
- Multi-agent collaboration
- Advanced analytics
- Machine learning optimization

## Security & Compliance

### Security Measures
- **Prompt Injection Protection**: Input sanitization and validation
- **Data Privacy**: Encryption at rest and in transit
- **Access Control**: Role-based agent management
- **Audit Logging**: Complete action tracking
- **Secure Deployment**: Environment isolation

### Educational Compliance
- **FERPA Compliance**: Student data protection
- **GDPR Compliance**: EU data protection regulations
- **Academic Integrity**: Plagiarism prevention
- **Cultural Sensitivity**: Appropriate content validation

## Monitoring & Quality Assurance

### Performance Metrics
- Response time and throughput
- Correction accuracy vs. human evaluators
- Student satisfaction scores
- Cultural appropriateness ratings
- Cost per correction

### Quality Assurance Process
1. **Automated Testing**: Regression tests for each agent
2. **Human Validation**: Regular expert review of corrections
3. **A/B Testing**: Compare agent versions
4. **Student Feedback**: Integrate user satisfaction data
5. **Continuous Improvement**: ML-based optimization

This architecture provides a comprehensive foundation for creating, managing, and deploying AI-powered exam correction agents that can be fully controlled through the NeoLingus admin interface.