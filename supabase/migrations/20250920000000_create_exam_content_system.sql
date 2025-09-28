-- =============================================
-- EXAM CONTENT MANAGEMENT SYSTEM
-- =============================================
-- Migration: 20250920000000_create_exam_content_system
-- Purpose: Create tables for managing official exam content from real-exams/ directory

-- =============================================
-- EXAM TEMPLATES TABLE
-- =============================================
-- Stores the structure and metadata for official exams
CREATE TABLE exam_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic identification
    language VARCHAR(50) NOT NULL CHECK (language IN ('english', 'valenciano', 'spanish', 'french', 'german', 'italian', 'portuguese')),
    level VARCHAR(10) NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('cambridge', 'eoi', 'cieacova', 'jqcv', 'dele', 'delf', 'goethe')),
    skill VARCHAR(50) NOT NULL CHECK (skill IN ('reading', 'writing', 'listening', 'speaking', 'use_of_english', 'mediation', 'integrated')),

    -- Template metadata
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('basic', 'intermediate', 'advanced')),
    estimated_duration INTEGER NOT NULL, -- minutes
    total_questions INTEGER,
    max_score DECIMAL(5,2),

    -- Official source files
    official_source_path VARCHAR(500), -- Path to real-exams/ files
    pdf_path VARCHAR(500),
    audio_paths JSONB DEFAULT '[]', -- Array of audio file paths
    html_simulator_path VARCHAR(500),

    -- Exam structure definition
    structure JSONB NOT NULL DEFAULT '{}', -- Complete exam structure
    sections JSONB DEFAULT '[]', -- Sections with timing, questions, etc
    scoring_criteria JSONB DEFAULT '{}', -- How to score the exam
    instructions JSONB DEFAULT '{}', -- Exam instructions per section

    -- Configuration
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,
    version VARCHAR(20) DEFAULT '1.0',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for performance
    CONSTRAINT unique_exam_template UNIQUE (language, level, provider, skill)
);

-- =============================================
-- EXAM CONTENT TABLE
-- =============================================
-- Stores individual questions and content for each exam
CREATE TABLE exam_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,

    -- Question organization
    section_id VARCHAR(100) NOT NULL, -- e.g., "reading_part_1", "listening_part_3"
    part_id VARCHAR(100) NOT NULL, -- e.g., "part_1", "part_2"
    question_number INTEGER NOT NULL,
    sub_question VARCHAR(50), -- For multi-part questions (e.g., "a", "b", "c")

    -- Question data
    question_type VARCHAR(50) NOT NULL CHECK (question_type IN (
        'multiple_choice', 'true_false', 'fill_blank', 'open_ended',
        'drag_drop', 'matching', 'essay', 'speaking_task', 'listening_comprehension'
    )),
    question_text TEXT,
    question_data JSONB NOT NULL DEFAULT '{}', -- Complete question structure

    -- Answer information
    correct_answer JSONB, -- Correct answer(s)
    answer_options JSONB DEFAULT '[]', -- For multiple choice
    answer_explanation TEXT,

    -- Media and resources
    media_urls JSONB DEFAULT '{}', -- Images, audio, video URLs
    attachments JSONB DEFAULT '[]', -- Additional files

    -- Scoring
    points DECIMAL(5,2) DEFAULT 1.0,
    scoring_rubric JSONB DEFAULT '{}', -- For complex scoring

    -- Metadata
    difficulty_tags JSONB DEFAULT '[]',
    topic_tags JSONB DEFAULT '[]',
    skills_tested JSONB DEFAULT '[]',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure questions are ordered properly
    CONSTRAINT unique_question_position UNIQUE (template_id, section_id, question_number, sub_question)
);

-- =============================================
-- EXAM CONFIGURATIONS TABLE
-- =============================================
-- Global configuration for exam system
CREATE TABLE exam_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    config_type VARCHAR(50) NOT NULL CHECK (config_type IN ('system', 'ui', 'scoring', 'import')),
    description TEXT,

    -- Management
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXAM IMPORT LOGS TABLE
-- =============================================
-- Track imports from real-exams/ directory
CREATE TABLE exam_import_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50) NOT NULL CHECK (import_type IN ('full_import', 'incremental', 'single_exam')),
    source_path VARCHAR(500) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'partial')),

    -- Import details
    templates_imported INTEGER DEFAULT 0,
    content_imported INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,

    -- Results
    import_summary JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '[]',

    -- Management
    initiated_by UUID REFERENCES admin_users(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER EXAM ATTEMPTS TABLE
-- =============================================
-- Enhanced version of exam_sessions for official exams
CREATE TABLE user_exam_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES exam_templates(id) ON DELETE CASCADE,

    -- Attempt details
    attempt_number INTEGER DEFAULT 1,
    exam_mode VARCHAR(30) NOT NULL CHECK (exam_mode IN ('practice', 'mock_exam', 'diagnostic', 'timed_practice')),

    -- Timing
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    total_duration_seconds INTEGER,
    time_per_section JSONB DEFAULT '{}',

    -- Results
    total_score DECIMAL(5,2),
    max_possible_score DECIMAL(5,2),
    percentage_score DECIMAL(5,2),
    section_scores JSONB DEFAULT '{}',
    detailed_results JSONB DEFAULT '{}',

    -- User responses
    user_answers JSONB DEFAULT '{}', -- All user responses
    flagged_questions JSONB DEFAULT '[]', -- Questions marked for review

    -- AI feedback
    ai_feedback TEXT,
    improvement_areas JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    recommended_study_plan JSONB DEFAULT '{}',

    -- Status
    is_completed BOOLEAN DEFAULT false,
    is_graded BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure attempt numbering
    CONSTRAINT unique_user_attempt UNIQUE (user_id, template_id, attempt_number)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Exam templates
CREATE INDEX idx_exam_templates_language_level ON exam_templates(language, level) WHERE is_active = true;
CREATE INDEX idx_exam_templates_provider ON exam_templates(provider) WHERE is_active = true;
CREATE INDEX idx_exam_templates_skill ON exam_templates(skill) WHERE is_active = true;
CREATE INDEX idx_exam_templates_published ON exam_templates(is_published) WHERE is_published = true;

-- Exam content
CREATE INDEX idx_exam_content_template_id ON exam_content(template_id);
CREATE INDEX idx_exam_content_section ON exam_content(template_id, section_id);
CREATE INDEX idx_exam_content_question_type ON exam_content(question_type);

-- Configurations
CREATE INDEX idx_exam_configs_type ON exam_configurations(config_type);

-- Import logs
CREATE INDEX idx_import_logs_status ON exam_import_logs(status);
CREATE INDEX idx_import_logs_created ON exam_import_logs(created_at DESC);

-- User attempts
CREATE INDEX idx_user_attempts_user_template ON user_exam_attempts(user_id, template_id);
CREATE INDEX idx_user_attempts_completed ON user_exam_attempts(completed_at DESC) WHERE is_completed = true;
CREATE INDEX idx_user_attempts_template ON user_exam_attempts(template_id);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE exam_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_attempts ENABLE ROW LEVEL SECURITY;

-- Exam templates: Public read for published, admin write
CREATE POLICY "Public can view published exam templates" ON exam_templates
    FOR SELECT USING (is_published = true AND is_active = true);

CREATE POLICY "Admin can manage exam templates" ON exam_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role IN ('super_admin', 'admin', 'course_manager')
            AND au.active = true
        )
    );

-- Exam content: Public read for published templates, admin write
CREATE POLICY "Public can view published exam content" ON exam_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exam_templates et
            WHERE et.id = exam_content.template_id
            AND et.is_published = true AND et.is_active = true
        )
    );

CREATE POLICY "Admin can manage exam content" ON exam_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role IN ('super_admin', 'admin', 'course_manager')
            AND au.active = true
        )
    );

-- Exam configurations: Admin only
CREATE POLICY "Admin can manage exam configurations" ON exam_configurations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role IN ('super_admin', 'admin')
            AND au.active = true
        )
    );

-- Import logs: Admin only
CREATE POLICY "Admin can view import logs" ON exam_import_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role IN ('super_admin', 'admin', 'course_manager')
            AND au.active = true
        )
    );

-- User exam attempts: Users can only access their own attempts
CREATE POLICY "Users can view own exam attempts" ON user_exam_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam attempts" ON user_exam_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own exam attempts" ON user_exam_attempts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all exam attempts" ON user_exam_attempts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.role IN ('super_admin', 'admin', 'course_manager')
            AND au.active = true
        )
    );

-- =============================================
-- INITIAL CONFIGURATION DATA
-- =============================================

-- Insert default exam configurations
INSERT INTO exam_configurations (config_key, config_value, config_type, description) VALUES
('exam_audio_formats', '["mp3", "wav", "m4a"]', 'system', 'Supported audio formats for exam content'),
('exam_pdf_max_size', '50', 'system', 'Maximum PDF file size in MB'),
('exam_time_buffer', '0.1', 'system', 'Buffer time percentage for exam timing'),
('exam_auto_save_interval', '30', 'system', 'Auto-save interval in seconds'),
('exam_review_enabled', 'true', 'ui', 'Enable question review functionality'),
('exam_bookmark_enabled', 'true', 'ui', 'Enable question bookmarking'),
('exam_calculator_enabled', 'false', 'ui', 'Enable built-in calculator'),
('exam_spell_check_enabled', 'true', 'ui', 'Enable spell check for text inputs'),
('exam_accessibility_mode', 'true', 'ui', 'Enable accessibility features'),
('exam_passing_score', '60', 'scoring', 'Default passing score percentage'),
('exam_partial_credit', 'true', 'scoring', 'Enable partial credit scoring'),
('import_batch_size', '100', 'import', 'Number of questions to import per batch'),
('import_timeout', '300', 'import', 'Import timeout in seconds'),
('import_validation', 'strict', 'import', 'Import validation level');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_exam_templates_updated_at BEFORE UPDATE ON exam_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_content_updated_at BEFORE UPDATE ON exam_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_exam_attempts_updated_at BEFORE UPDATE ON user_exam_attempts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON TABLE exam_templates IS 'Templates for official exams loaded from real-exams/ directory';
COMMENT ON TABLE exam_content IS 'Individual questions and content for each exam template';
COMMENT ON TABLE exam_configurations IS 'Global configuration settings for the exam system';
COMMENT ON TABLE exam_import_logs IS 'Logs of imports from real-exams/ directory';
COMMENT ON TABLE user_exam_attempts IS 'User attempts at official exams with detailed results';

COMMENT ON COLUMN exam_templates.structure IS 'Complete exam structure in JSON format';
COMMENT ON COLUMN exam_content.question_data IS 'Complete question data including type-specific fields';
COMMENT ON COLUMN user_exam_attempts.user_answers IS 'All user responses in structured format';