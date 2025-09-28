-- Migration: Update AI Agents Testing Schema
-- This updates the database schema to support the comprehensive agent testing interface

-- Drop and recreate agent_test_results table with the correct structure
DROP TABLE IF EXISTS agent_test_results CASCADE;

CREATE TABLE agent_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    
    -- Test identification
    test_type TEXT NOT NULL, -- 'writing', 'speaking', 'reading', 'listening', 'unit', 'integration'
    session_id TEXT, -- For grouping related tests
    
    -- Test data
    input_text TEXT NOT NULL,
    expected_output TEXT,
    actual_output TEXT,
    
    -- Test results
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    
    -- Performance metrics
    processing_time_ms INTEGER NOT NULL DEFAULT 0,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    
    -- Audit fields
    tested_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_test_templates table for predefined test cases
CREATE TABLE agent_test_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Template identification
    name TEXT NOT NULL,
    description TEXT,
    
    -- Agent matching criteria
    agent_type TEXT NOT NULL, -- 'writing', 'speaking', 'reading', 'listening'
    language TEXT NOT NULL,
    level TEXT, -- Optional level filter
    
    -- Test configuration
    test_type TEXT NOT NULL,
    input_template TEXT NOT NULL,
    expected_criteria JSONB DEFAULT '[]', -- Array of criteria to check
    difficulty_level TEXT DEFAULT 'intermediate' CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_test_sessions table for tracking test sessions
CREATE TABLE agent_test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id TEXT NOT NULL, -- Client-generated session ID
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    
    -- Session details
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    -- Session metrics
    total_tests INTEGER DEFAULT 0,
    successful_tests INTEGER DEFAULT 0,
    total_processing_time_ms INTEGER DEFAULT 0,
    total_tokens_used INTEGER DEFAULT 0,
    
    -- User information
    tested_by UUID REFERENCES admin_users(id),
    
    UNIQUE(session_id)
);

-- Update agent_performance_metrics table to include test session data
ALTER TABLE agent_performance_metrics 
ADD COLUMN test_session_id TEXT,
ADD COLUMN test_result_id UUID REFERENCES agent_test_results(id);

-- Create indexes for performance
CREATE INDEX idx_agent_test_results_agent_id ON agent_test_results(agent_id);
CREATE INDEX idx_agent_test_results_test_type ON agent_test_results(test_type);
CREATE INDEX idx_agent_test_results_success ON agent_test_results(success);
CREATE INDEX idx_agent_test_results_created_at ON agent_test_results(created_at);
CREATE INDEX idx_agent_test_results_session_id ON agent_test_results(session_id);
CREATE INDEX idx_agent_test_results_tested_by ON agent_test_results(tested_by);

CREATE INDEX idx_agent_test_templates_agent_type ON agent_test_templates(agent_type);
CREATE INDEX idx_agent_test_templates_language ON agent_test_templates(language);
CREATE INDEX idx_agent_test_templates_level ON agent_test_templates(level);
CREATE INDEX idx_agent_test_templates_is_active ON agent_test_templates(is_active);

CREATE INDEX idx_agent_test_sessions_session_id ON agent_test_sessions(session_id);
CREATE INDEX idx_agent_test_sessions_agent_id ON agent_test_sessions(agent_id);
CREATE INDEX idx_agent_test_sessions_tested_by ON agent_test_sessions(tested_by);
CREATE INDEX idx_agent_test_sessions_started_at ON agent_test_sessions(started_at);

-- Apply updated_at trigger to templates
CREATE TRIGGER update_agent_test_templates_updated_at 
    BEFORE UPDATE ON agent_test_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security policies
ALTER TABLE agent_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_test_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_test_sessions ENABLE ROW LEVEL SECURITY;

-- Test results policies
CREATE POLICY "Admins can view test results" ON agent_test_results FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

CREATE POLICY "Admins can insert test results" ON agent_test_results FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

CREATE POLICY "Test creators can update their results" ON agent_test_results FOR UPDATE USING (
    tested_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

-- Test templates policies
CREATE POLICY "Admins can view test templates" ON agent_test_templates FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

CREATE POLICY "Admins can manage test templates" ON agent_test_templates FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin')
        AND au.active = true
    )
);

-- Test sessions policies
CREATE POLICY "Admins can view test sessions" ON agent_test_sessions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

CREATE POLICY "Admins can manage test sessions" ON agent_test_sessions FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'course_manager')
        AND au.active = true
    )
);

-- Insert initial test templates
INSERT INTO agent_test_templates (name, description, agent_type, language, level, test_type, input_template, expected_criteria, difficulty_level) VALUES 

-- English Writing Templates
('Grammar Correction Basic', 'Test basic grammar error detection and correction', 'writing', 'english', 'B1', 'writing', 
'I goes to the store yesterday and buy some apples. The apples was very delicious.', 
'["subject-verb agreement", "tense consistency", "article usage"]', 'basic'),

('Formal Essay Structure', 'Test academic writing structure and coherence', 'writing', 'english', 'B2', 'writing',
'Technology is good. It helps people. But sometimes technology is bad. People use phones too much. This is a problem.',
'["coherence", "academic style", "paragraph structure", "transitions"]', 'intermediate'),

('Advanced Vocabulary Enhancement', 'Test vocabulary sophistication suggestions', 'writing', 'english', 'C1', 'writing',
'The movie was very good. The actors were good too. The story was interesting and the ending was good.',
'["vocabulary variety", "word choice", "sophistication", "register"]', 'advanced'),

-- Valenciano Writing Templates
('Correcció Gramatical Bàsica', 'Detectar errors bàsics de gramàtica valenciana', 'writing', 'valenciano', 'B1', 'writing',
'Vaig anar al mercat ahir i vaig comprar unes pomes. Les pomes estava molt bones.',
'["concordança", "temps verbals", "articles"]', 'basic'),

('Registre Formal Valencià', 'Avaluar l''ús del registre formal en valencià', 'writing', 'valenciano', 'B2', 'writing',
'Estic escrivint per demanar-te si pots vindre a ma casa demà per sopar.',
'["registre formal", "cortesia", "estructura", "vocabulari"]', 'intermediate'),

('Redacció Avançada Valencià', 'Analitzar textos complexos en valencià amb context cultural', 'writing', 'valenciano', 'C1', 'writing',
'La festa de les Falles és una tradició molt antic a València. Moltes persones venen per vore els monuments i escoltar la mascletà.',
'["precisió lingüística", "context cultural", "registre apropiat", "cohesió textual"]', 'advanced'),

-- English Speaking Templates  
('Fluency Assessment', 'Evaluate speech fluency and coherence', 'speaking', 'english', 'B2', 'speaking',
'Well, um, I think that, you know, the weather today is, like, really nice and, uh, I want to go outside but, well, I have work to do.',
'["fluency", "hesitation markers", "coherence", "discourse markers"]', 'intermediate'),

('Pronunciation Analysis', 'Test pronunciation feedback capability', 'speaking', 'english', 'B1', 'speaking',
'[AUDIO TRANSCRIPTION] I sank ze chip was wery expansiv and ze qualidy was not gud.',
'["pronunciation", "phonetic accuracy", "intelligibility", "word stress"]', 'basic'),

-- Valenciano Speaking Templates
('Pronunciació Valenciana', 'Avaluar la pronunciació en valencià', 'speaking', 'valenciano', 'B2', 'speaking',
'[TRANSCRIPCIÓ] Bon dia, me dic Joan i estic estudiant valencià des de fa dos anys a l''EOI.',
'["pronunciació", "accent", "naturalitat", "entonació"]', 'intermediate'),

-- Reading Comprehension Templates
('Reading Comprehension Analysis', 'Test reading comprehension feedback', 'reading', 'english', 'B2', 'reading',
'Text: "The Industrial Revolution marked a major turning point in history." Question: What was the main impact of the Industrial Revolution? Answer: It changed how people worked and lived.',
'["comprehension", "inference", "context understanding", "detail identification"]', 'intermediate'),

('Comprensió Lectora Valenciana', 'Avaluar la comprensió de textos en valencià', 'reading', 'valenciano', 'B1', 'reading',
'Text: "València és una ciutat amb una rica història cultural." Pregunta: Què caracteritza València segons el text? Resposta: Té molta cultura.',
'["comprensió", "interpretació", "vocabulari", "inferència"]', 'basic'),

-- Listening Comprehension Templates
('Listening Comprehension', 'Test listening comprehension feedback', 'listening', 'english', 'B1', 'listening',
'[AUDIO TRANSCRIPT] The meeting will be held next Tuesday at 3 PM in the conference room. Question: When is the meeting? Answer: Tuesday at 3.',
'["comprehension", "detail extraction", "context", "specific information"]', 'basic'),

('Comprensió Auditiva Valenciana', 'Avaluar la comprensió auditiva en valencià', 'listening', 'valenciano', 'B2', 'listening',
'[TRANSCRIPCIÓ ÀUDIO] La reunió serà dimarts que ve a les tres de la vesprada a la sala de conferències. Pregunta: On serà la reunió? Resposta: A la sala de conferències.',
'["comprensió", "detalls", "context", "informació específica"]', 'intermediate');

-- Function to get test templates for an agent
CREATE OR REPLACE FUNCTION get_agent_test_templates(
    p_agent_type TEXT,
    p_language TEXT,
    p_level TEXT DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    description TEXT,
    test_type TEXT,
    input_template TEXT,
    expected_criteria JSONB,
    difficulty_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        att.id,
        att.name,
        att.description,
        att.test_type,
        att.input_template,
        att.expected_criteria,
        att.difficulty_level
    FROM agent_test_templates att
    WHERE att.agent_type = p_agent_type
        AND att.language = p_language
        AND att.is_active = true
        AND (p_level IS NULL OR att.level IS NULL OR att.level = p_level)
    ORDER BY 
        CASE att.difficulty_level 
            WHEN 'basic' THEN 1
            WHEN 'intermediate' THEN 2
            WHEN 'advanced' THEN 3
            ELSE 4
        END,
        att.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agent test statistics
CREATE OR REPLACE FUNCTION get_agent_test_statistics(p_agent_id UUID)
RETURNS TABLE(
    total_tests INTEGER,
    successful_tests INTEGER,
    success_rate DECIMAL,
    avg_processing_time INTEGER,
    total_tokens INTEGER,
    avg_confidence DECIMAL,
    tests_last_24h INTEGER,
    tests_last_week INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_tests,
        COUNT(*) FILTER (WHERE success = true)::INTEGER as successful_tests,
        CASE 
            WHEN COUNT(*) > 0 THEN ROUND((COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*) * 100), 2)
            ELSE 0::DECIMAL
        END as success_rate,
        COALESCE(AVG(processing_time_ms), 0)::INTEGER as avg_processing_time,
        COALESCE(SUM(tokens_used), 0)::INTEGER as total_tokens,
        COALESCE(AVG(confidence_score), 0)::DECIMAL as avg_confidence,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::INTEGER as tests_last_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::INTEGER as tests_last_week
    FROM agent_test_results
    WHERE agent_id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;