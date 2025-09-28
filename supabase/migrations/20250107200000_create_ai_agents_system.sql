-- Migration: Create AI Agents Management System
-- This creates the database schema for managing AI-powered exam correction agents

-- AI Agents configuration and deployment
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('writing', 'speaking', 'reading', 'listening', 'general')),
    language TEXT NOT NULL,
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    
    -- Model configuration
    model_provider TEXT NOT NULL DEFAULT 'openai' CHECK (model_provider IN ('openai', 'anthropic', 'cohere', 'vercel')),
    model_name TEXT NOT NULL DEFAULT 'gpt-4',
    model_config JSONB DEFAULT '{"temperature": 0.3, "max_tokens": 2000, "top_p": 1.0}',
    
    -- System prompt configuration
    system_prompt TEXT NOT NULL,
    cultural_context JSONB DEFAULT '[]',
    scoring_criteria JSONB DEFAULT '{}',
    example_corrections JSONB DEFAULT '[]',
    
    -- Tool configuration
    tools_config JSONB DEFAULT '{
        "grammar_checker": true,
        "cultural_validator": true,
        "plagiarism_detector": false,
        "rubric_scorer": true,
        "feedback_generator": true
    }',
    
    -- Performance configuration
    performance_config JSONB DEFAULT '{
        "timeout": 60000,
        "retries": 2,
        "cache_results": true,
        "human_review_threshold": 0.7
    }',
    
    -- Deployment configuration
    deployment_config JSONB DEFAULT '{
        "regions": ["fra1", "iad1"],
        "min_instances": 1,
        "max_instances": 5,
        "target_utilization": 70
    }',
    
    -- Status and metadata
    deployment_url TEXT,
    deployment_status TEXT DEFAULT 'draft' CHECK (deployment_status IN ('draft', 'testing', 'deploying', 'active', 'inactive', 'error')),
    version INTEGER DEFAULT 1,
    is_template BOOLEAN DEFAULT false,
    
    -- Audit fields
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deployed_at TIMESTAMP WITH TIME ZONE,
    last_tested_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(name, version)
);

-- Agent performance metrics and monitoring
CREATE TABLE agent_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    user_answer_id UUID REFERENCES user_answers(id) ON DELETE CASCADE,
    
    -- Performance data
    correction_type TEXT NOT NULL,
    processing_time_ms INTEGER NOT NULL,
    tokens_used INTEGER,
    cost_cents INTEGER, -- Cost in cents
    
    -- Quality metrics
    accuracy_score DECIMAL(5,2), -- Compared to human evaluator
    confidence_score DECIMAL(5,2), -- Agent's confidence in its evaluation
    cultural_accuracy DECIMAL(5,2), -- Cultural context appropriateness
    consistency_score DECIMAL(5,2), -- Consistency with previous corrections
    
    -- Feedback quality
    student_satisfaction INTEGER CHECK (student_satisfaction BETWEEN 1 AND 5),
    human_review_required BOOLEAN DEFAULT false,
    human_override_reason TEXT,
    human_evaluator_id UUID REFERENCES admin_users(id),
    
    -- Raw data
    agent_input JSONB, -- Input sent to agent
    agent_output JSONB, -- Raw agent response
    processed_feedback TEXT, -- Final processed feedback
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent templates for quick deployment
CREATE TABLE agent_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'exam_correction',
    
    -- Template metadata
    type TEXT NOT NULL,
    language TEXT NOT NULL,
    level TEXT NOT NULL,
    institution TEXT, -- EOI, CIEACOVA, Cambridge, etc.
    
    -- Template configuration (JSON schema for agent creation)
    template_config JSONB NOT NULL,
    
    -- Usage and quality metrics
    is_official BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    avg_performance_score DECIMAL(5,2),
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Audit fields
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(name, language, level, institution)
);

-- Agent deployment history and versioning
CREATE TABLE agent_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    
    -- Deployment details
    deployment_config JSONB NOT NULL,
    deployment_url TEXT NOT NULL,
    vercel_deployment_id TEXT, -- Vercel deployment ID for management
    
    -- Status and logs
    status TEXT NOT NULL CHECK (status IN ('deploying', 'active', 'inactive', 'failed', 'rollback')),
    deployment_logs TEXT,
    error_message TEXT,
    
    -- Performance tracking
    total_corrections INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    error_rate DECIMAL(5,2),
    
    -- Audit fields
    deployed_by UUID REFERENCES admin_users(id),
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE,
    deactivated_at TIMESTAMP WITH TIME ZONE
);

-- Agent test results and quality assurance
CREATE TABLE agent_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    test_type TEXT NOT NULL CHECK (test_type IN ('unit', 'integration', 'performance', 'quality')),
    
    -- Test configuration
    test_config JSONB NOT NULL,
    test_data JSONB NOT NULL, -- Input test data
    expected_results JSONB, -- Expected outputs
    
    -- Results
    actual_results JSONB NOT NULL, -- Actual outputs
    passed BOOLEAN NOT NULL,
    score DECIMAL(5,2),
    
    -- Performance metrics
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    
    -- Details
    error_message TEXT,
    detailed_feedback TEXT,
    
    -- Audit
    tested_by UUID REFERENCES admin_users(id),
    tested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Correction rubrics for consistent evaluation
CREATE TABLE correction_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g., 'C1_WRITING_CONTENT'
    name TEXT NOT NULL,
    description TEXT,
    
    -- Rubric details
    skill_type TEXT NOT NULL, -- writing, speaking, reading, listening
    level TEXT NOT NULL,
    language TEXT NOT NULL,
    
    -- Scoring configuration
    max_score INTEGER NOT NULL DEFAULT 20,
    criteria JSONB NOT NULL, -- Detailed scoring criteria
    examples JSONB DEFAULT '[]', -- Example scores and explanations
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent training data and fine-tuning
CREATE TABLE agent_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    
    -- Training sample
    input_data JSONB NOT NULL, -- Question, student answer, context
    expected_output JSONB NOT NULL, -- Expected correction and score
    actual_output JSONB, -- Agent's output for comparison
    
    -- Quality metrics
    quality_score DECIMAL(5,2), -- Human evaluator score
    is_validated BOOLEAN DEFAULT false,
    validation_notes TEXT,
    
    -- Usage in training
    used_in_training BOOLEAN DEFAULT false,
    training_weight DECIMAL(3,2) DEFAULT 1.0,
    
    -- Audit
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_at TIMESTAMP WITH TIME ZONE,
    validated_by UUID REFERENCES admin_users(id)
);

-- Create indexes for performance
CREATE INDEX idx_ai_agents_type_language_level ON ai_agents(type, language, level);
CREATE INDEX idx_ai_agents_deployment_status ON ai_agents(deployment_status);
CREATE INDEX idx_ai_agents_created_by ON ai_agents(created_by);
CREATE INDEX idx_ai_agents_is_template ON ai_agents(is_template);

CREATE INDEX idx_agent_performance_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX idx_agent_performance_session_id ON agent_performance_metrics(session_id);
CREATE INDEX idx_agent_performance_created_at ON agent_performance_metrics(created_at);
CREATE INDEX idx_agent_performance_accuracy ON agent_performance_metrics(accuracy_score);

CREATE INDEX idx_agent_templates_type_language_level ON agent_templates(type, language, level);
CREATE INDEX idx_agent_templates_is_official ON agent_templates(is_official);
CREATE INDEX idx_agent_templates_usage_count ON agent_templates(usage_count);

CREATE INDEX idx_agent_deployments_agent_id ON agent_deployments(agent_id);
CREATE INDEX idx_agent_deployments_status ON agent_deployments(status);
CREATE INDEX idx_agent_deployments_deployed_at ON agent_deployments(deployed_at);

CREATE INDEX idx_agent_test_results_agent_id ON agent_test_results(agent_id);
CREATE INDEX idx_agent_test_results_test_type ON agent_test_results(test_type);
CREATE INDEX idx_agent_test_results_passed ON agent_test_results(passed);

CREATE INDEX idx_correction_rubrics_code ON correction_rubrics(code);
CREATE INDEX idx_correction_rubrics_skill_level_lang ON correction_rubrics(skill_type, level, language);

CREATE INDEX idx_agent_training_data_agent_id ON agent_training_data(agent_id);
CREATE INDEX idx_agent_training_data_is_validated ON agent_training_data(is_validated);
CREATE INDEX idx_agent_training_data_used_training ON agent_training_data(used_in_training);

-- Apply updated_at triggers
CREATE TRIGGER update_ai_agents_updated_at BEFORE UPDATE ON ai_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_templates_updated_at BEFORE UPDATE ON agent_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_correction_rubrics_updated_at BEFORE UPDATE ON correction_rubrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE correction_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_training_data ENABLE ROW LEVEL SECURITY;

-- AI Agents policies - admins and course managers can manage agents
CREATE POLICY "Admins can view all agents" ON ai_agents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

CREATE POLICY "Admins can manage agents" ON ai_agents FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

-- Performance metrics policies - admins can view metrics
CREATE POLICY "Admins can view performance metrics" ON agent_performance_metrics FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.active = true
    )
);

CREATE POLICY "System can insert performance metrics" ON agent_performance_metrics FOR INSERT WITH CHECK (true);

-- Templates policies - course managers can use templates
CREATE POLICY "Course managers can view templates" ON agent_templates FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

CREATE POLICY "Admins can manage templates" ON agent_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin')
        AND au.active = true
    )
);

-- Similar policies for other tables
CREATE POLICY "Admins can view deployments" ON agent_deployments FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.active = true)
);

CREATE POLICY "Admins can manage deployments" ON agent_deployments FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin') AND au.active = true)
);

CREATE POLICY "Admins can view test results" ON agent_test_results FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.active = true)
);

CREATE POLICY "Admins can manage test results" ON agent_test_results FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin', 'course_manager') AND au.active = true)
);

CREATE POLICY "Admins can view rubrics" ON correction_rubrics FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.active = true)
);

CREATE POLICY "Admins can manage rubrics" ON correction_rubrics FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin') AND au.active = true)
);

CREATE POLICY "Admins can view training data" ON agent_training_data FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.active = true)
);

CREATE POLICY "Admins can manage training data" ON agent_training_data FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = auth.uid() AND au.role IN ('super_admin', 'admin', 'course_manager') AND au.active = true)
);

-- Utility functions for agent management
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
    performance_score DECIMAL,
    total_corrections INTEGER,
    avg_response_time INTEGER
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
        COALESCE(AVG(apm.accuracy_score), 0) as performance_score,
        COUNT(apm.id)::INTEGER as total_corrections,
        AVG(apm.processing_time_ms)::INTEGER as avg_response_time
    FROM ai_agents a
    LEFT JOIN agent_performance_metrics apm ON a.id = apm.agent_id
    WHERE a.deployment_status = 'active'
        AND (p_type IS NULL OR a.type = p_type)
        AND (p_language IS NULL OR a.language = p_language)
        AND (p_level IS NULL OR a.level = p_level)
    GROUP BY a.id, a.name, a.type, a.language, a.level, a.deployment_url
    ORDER BY performance_score DESC, total_corrections DESC, a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agent performance summary
CREATE OR REPLACE FUNCTION get_agent_performance_summary(agent_id_param UUID)
RETURNS TABLE(
    total_corrections INTEGER,
    avg_accuracy DECIMAL,
    avg_processing_time INTEGER,
    avg_student_satisfaction DECIMAL,
    human_review_rate DECIMAL,
    cost_per_correction DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_corrections,
        AVG(accuracy_score) as avg_accuracy,
        AVG(processing_time_ms)::INTEGER as avg_processing_time,
        AVG(student_satisfaction) as avg_student_satisfaction,
        (COUNT(*) FILTER (WHERE human_review_required = true)::DECIMAL / COUNT(*) * 100) as human_review_rate,
        AVG(cost_cents / 100.0) as cost_per_correction
    FROM agent_performance_metrics
    WHERE agent_id = agent_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial correction rubrics
INSERT INTO correction_rubrics (code, name, description, skill_type, level, language, max_score, criteria) VALUES
('C1_WRITING_CONTENT', 'C1 Writing Content Assessment', 'Content quality and cultural awareness for C1 writing', 'writing', 'C1', 'valenciano', 20, '{
    "excellent": {"score_range": "18-20", "description": "Idees profundes i originals amb perfecta integració cultural"},
    "good": {"score_range": "14-17", "description": "Contingut sòlid amb bona consciència cultural"},
    "satisfactory": {"score_range": "10-13", "description": "Contingut adequat amb alguna referència cultural"},
    "needs_improvement": {"score_range": "0-9", "description": "Contingut superficial sense context cultural apropiat"}
}'),

('C1_WRITING_ORGANIZATION', 'C1 Writing Organization', 'Text structure and coherence for C1 level', 'writing', 'C1', 'valenciano', 20, '{
    "excellent": {"score_range": "18-20", "description": "Estructura perfecta amb transicions elegants"},
    "good": {"score_range": "14-17", "description": "Bona organització amb coherència clara"},
    "satisfactory": {"score_range": "10-13", "description": "Organització adequada amb algunes incoherències menors"},
    "needs_improvement": {"score_range": "0-9", "description": "Estructura confusa o incoherent"}
}'),

('C1_WRITING_LANGUAGE', 'C1 Writing Language Use', 'Language complexity and accuracy for C1', 'writing', 'C1', 'valenciano', 20, '{
    "excellent": {"score_range": "18-20", "description": "Ús sofisticat del llenguatge amb registre apropiat"},
    "good": {"score_range": "14-17", "description": "Bon domini lingüístic amb varietat lèxica"},
    "satisfactory": {"score_range": "10-13", "description": "Llenguatge adequat amb alguns errors menors"},
    "needs_improvement": {"score_range": "0-9", "description": "Errors que dificulten la comprensió"}
}'),

('B2_SPEAKING_FLUENCY', 'B2 Speaking Fluency', 'Fluency and coherence for B2 speaking', 'speaking', 'B2', 'english', 25, '{
    "excellent": {"score_range": "23-25", "description": "Natural flow with effective use of discourse markers"},
    "good": {"score_range": "19-22", "description": "Generally fluent with minor hesitations"},
    "satisfactory": {"score_range": "15-18", "description": "Some fluency with noticeable hesitations"},
    "needs_improvement": {"score_range": "0-14", "description": "Frequent hesitations that impede communication"}
}'),

('B2_SPEAKING_VOCABULARY', 'B2 Speaking Vocabulary', 'Lexical resource for B2 speaking', 'speaking', 'B2', 'english', 25, '{
    "excellent": {"score_range": "23-25", "description": "Wide range of vocabulary used naturally and flexibly"},
    "good": {"score_range": "19-22", "description": "Good range with some flexibility"},
    "satisfactory": {"score_range": "15-18", "description": "Adequate vocabulary for most topics"},
    "needs_improvement": {"score_range": "0-14", "description": "Limited vocabulary affects expression"}
}');

-- Insert initial agent templates
INSERT INTO agent_templates (name, description, category, type, language, level, institution, is_official, template_config) VALUES
('Valenciano C1 Writing Corrector', 'Expert evaluator for Valenciano C1 writing exams with cultural awareness', 'exam_correction', 'writing', 'valenciano', 'C1', 'EOI/CIEACOVA', true, '{
    "model_provider": "openai",
    "model_name": "gpt-4",
    "model_config": {"temperature": 0.3, "max_tokens": 2000},
    "system_prompt": "Ets un expert avaluador d''exàmens de valencià nivell C1...",
    "cultural_context": ["Literatura valenciana", "Tradicions valencianes", "Història del País Valencià"],
    "scoring_criteria": {
        "content": {"weight": 25, "rubric": "C1_WRITING_CONTENT"},
        "organization": {"weight": 20, "rubric": "C1_WRITING_ORGANIZATION"},
        "language": {"weight": 25, "rubric": "C1_WRITING_LANGUAGE"}
    },
    "tools_config": {
        "grammar_checker": true,
        "cultural_validator": true,
        "rubric_scorer": true,
        "feedback_generator": true
    }
}'),

('English B2 Speaking Assessor', 'Cambridge B2 speaking assessment with pronunciation analysis', 'exam_correction', 'speaking', 'english', 'B2', 'Cambridge', true, '{
    "model_provider": "openai", 
    "model_name": "gpt-4",
    "model_config": {"temperature": 0.2, "max_tokens": 1500},
    "system_prompt": "You are a certified Cambridge B2 speaking examiner...",
    "scoring_criteria": {
        "fluency": {"weight": 25, "rubric": "B2_SPEAKING_FLUENCY"},
        "vocabulary": {"weight": 25, "rubric": "B2_SPEAKING_VOCABULARY"}
    },
    "tools_config": {
        "pronunciation_analyzer": true,
        "fluency_meter": true,
        "vocabulary_assessor": true,
        "feedback_generator": true
    }
}');