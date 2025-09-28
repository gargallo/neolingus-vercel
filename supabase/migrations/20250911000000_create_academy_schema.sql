-- Neolingus Academy Schema Migration
-- Course-Centric Academy Architecture
-- Created: 2025-09-11
-- Spec: 002-course-centric-academy

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- CUSTOM TYPES AND ENUMS
-- =============================================

-- Data retention preference enum
CREATE TYPE data_retention_type AS ENUM ('minimal', 'standard', 'extended');

-- Session type enum
CREATE TYPE session_type_enum AS ENUM ('practice', 'mock_exam', 'diagnostic');

-- Component enum for exam components
CREATE TYPE component_enum AS ENUM ('reading', 'writing', 'listening', 'speaking');

-- AI context type enum
CREATE TYPE context_type_enum AS ENUM ('general', 'session_specific', 'weakness_focused');

-- =============================================
-- COURSES TABLE
-- =============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    language VARCHAR(50) NOT NULL,
    level VARCHAR(10) NOT NULL,
    certification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    components JSONB NOT NULL DEFAULT '[]',
    assessment_rubric JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_course_combination UNIQUE (language, level, certification_type),
    CONSTRAINT valid_components CHECK (jsonb_typeof(components) = 'array'),
    CONSTRAINT valid_assessment_rubric CHECK (jsonb_typeof(assessment_rubric) = 'object')
);

-- Add comments for documentation
COMMENT ON TABLE courses IS 'Represents specific language-level combinations with certification standards';
COMMENT ON COLUMN courses.components IS 'JSON array of exam components: ["reading", "writing", "listening", "speaking"]';
COMMENT ON COLUMN courses.assessment_rubric IS 'JSON object defining scoring criteria for each component';
COMMENT ON CONSTRAINT unique_course_combination ON courses IS 'Ensures unique combination of language + level + certification type';

-- =============================================
-- USER PROFILES TABLE
-- =============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    preferred_language VARCHAR(50) DEFAULT 'english',
    gdpr_consent BOOLEAN NOT NULL DEFAULT false,
    gdpr_consent_date TIMESTAMPTZ,
    lopd_consent BOOLEAN NOT NULL DEFAULT false,
    data_retention_preference data_retention_type DEFAULT 'standard',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints for GDPR compliance
    CONSTRAINT gdpr_consent_required CHECK (gdpr_consent = true),
    CONSTRAINT lopd_consent_required CHECK (lopd_consent = true),
    CONSTRAINT gdpr_consent_date_required CHECK (
        (gdpr_consent = true AND gdpr_consent_date IS NOT NULL) OR 
        (gdpr_consent = false)
    ),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user account with academy-specific data and GDPR compliance';
COMMENT ON COLUMN user_profiles.gdpr_consent IS 'Required consent for GDPR compliance before course access';
COMMENT ON COLUMN user_profiles.lopd_consent IS 'Required consent for Spanish LOPD compliance';
COMMENT ON COLUMN user_profiles.data_retention_preference IS 'User preference for data retention period';

-- =============================================
-- USER COURSE PROGRESS TABLE
-- =============================================
CREATE TABLE user_course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    overall_progress DECIMAL(3,2) DEFAULT 0.0,
    component_progress JSONB DEFAULT '{}',
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    readiness_score DECIMAL(3,2) DEFAULT 0.0,
    estimated_study_hours INTEGER DEFAULT 0,
    target_exam_date DATE,
    
    -- Constraints
    CONSTRAINT unique_user_course_progress UNIQUE (user_id, course_id),
    CONSTRAINT valid_overall_progress CHECK (overall_progress >= 0.0 AND overall_progress <= 1.0),
    CONSTRAINT valid_readiness_score CHECK (readiness_score >= 0.0 AND readiness_score <= 1.0),
    CONSTRAINT valid_component_progress CHECK (jsonb_typeof(component_progress) = 'object'),
    CONSTRAINT valid_strengths CHECK (jsonb_typeof(strengths) = 'array'),
    CONSTRAINT valid_weaknesses CHECK (jsonb_typeof(weaknesses) = 'array'),
    CONSTRAINT positive_study_hours CHECK (estimated_study_hours >= 0),
    CONSTRAINT future_exam_date CHECK (target_exam_date IS NULL OR target_exam_date >= CURRENT_DATE)
);

-- Add comments for documentation
COMMENT ON TABLE user_course_progress IS 'Tracks user progress within specific courses';
COMMENT ON COLUMN user_course_progress.overall_progress IS 'Overall progress as decimal 0.0-1.0';
COMMENT ON COLUMN user_course_progress.component_progress IS 'JSON object with progress per component: {"reading": 0.7, "writing": 0.5}';
COMMENT ON COLUMN user_course_progress.readiness_score IS 'Exam readiness indicator 0.0-1.0';

-- =============================================
-- EXAM SESSIONS TABLE
-- =============================================
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_id UUID NOT NULL REFERENCES user_course_progress(id) ON DELETE CASCADE,
    session_type session_type_enum NOT NULL,
    component component_enum NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    responses JSONB DEFAULT '{}',
    detailed_scores JSONB DEFAULT '{}',
    session_data JSONB DEFAULT '{}',
    score DECIMAL(3,2),
    ai_feedback TEXT,
    improvement_suggestions JSONB DEFAULT '[]',
    is_completed BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT valid_score CHECK (score IS NULL OR (score >= 0.0 AND score <= 1.0)),
    CONSTRAINT valid_duration CHECK (duration_seconds >= 0),
    CONSTRAINT valid_responses CHECK (jsonb_typeof(responses) = 'object'),
    CONSTRAINT valid_detailed_scores CHECK (jsonb_typeof(detailed_scores) = 'object'),
    CONSTRAINT valid_session_data CHECK (jsonb_typeof(session_data) = 'object'),
    CONSTRAINT valid_improvement_suggestions CHECK (jsonb_typeof(improvement_suggestions) = 'array'),
    CONSTRAINT completion_timestamp_required CHECK (
        (is_completed = true AND completed_at IS NOT NULL) OR 
        (is_completed = false)
    ),
    CONSTRAINT component_in_course CHECK (
        EXISTS (
            SELECT 1 FROM courses c 
            WHERE c.id = course_id 
            AND c.components ? component::text
        )
    )
);

-- Add comments for documentation
COMMENT ON TABLE exam_sessions IS 'Individual practice or assessment attempts';
COMMENT ON COLUMN exam_sessions.responses IS 'JSON object containing user answers and responses';
COMMENT ON COLUMN exam_sessions.session_data IS 'JSON object with exam configuration, timing, metadata';
COMMENT ON COLUMN exam_sessions.improvement_suggestions IS 'JSON array of AI-generated improvement recommendations';

-- =============================================
-- AI TUTOR CONTEXTS TABLE
-- =============================================
CREATE TABLE ai_tutor_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES exam_sessions(id) ON DELETE SET NULL,
    context_type context_type_enum NOT NULL,
    learning_profile JSONB DEFAULT '{}',
    current_context JSONB DEFAULT '{}',
    interaction_history JSONB DEFAULT '[]',
    context7_session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    -- Constraints
    CONSTRAINT valid_learning_profile CHECK (jsonb_typeof(learning_profile) = 'object'),
    CONSTRAINT valid_current_context CHECK (jsonb_typeof(current_context) = 'object'),
    CONSTRAINT valid_interaction_history CHECK (jsonb_typeof(interaction_history) = 'array'),
    CONSTRAINT interaction_history_limit CHECK (jsonb_array_length(interaction_history) <= 100),
    CONSTRAINT valid_expires_at CHECK (expires_at > created_at)
);

-- Add comments for documentation
COMMENT ON TABLE ai_tutor_contexts IS 'Contextual AI assistance data for personalized tutoring';
COMMENT ON COLUMN ai_tutor_contexts.learning_profile IS 'JSON object with learning style, preferences, patterns';
COMMENT ON COLUMN ai_tutor_contexts.interaction_history IS 'JSON array of previous AI interactions (max 100)';
COMMENT ON COLUMN ai_tutor_contexts.context7_session_id IS 'Context7 integration session identifier';

-- =============================================
-- CERTIFICATION MODULES TABLE
-- =============================================
CREATE TABLE certification_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    language VARCHAR(50) NOT NULL,
    certification_body VARCHAR(255) NOT NULL,
    official_website TEXT,
    exam_structure JSONB NOT NULL,
    content_config JSONB NOT NULL,
    compliance_requirements JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    phase INTEGER NOT NULL,
    launch_date DATE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_phase CHECK (phase IN (1, 2, 3)),
    CONSTRAINT valid_exam_structure CHECK (jsonb_typeof(exam_structure) = 'object'),
    CONSTRAINT valid_content_config CHECK (jsonb_typeof(content_config) = 'object'),
    CONSTRAINT valid_compliance_requirements CHECK (jsonb_typeof(compliance_requirements) = 'object'),
    CONSTRAINT active_module_launch_date CHECK (
        (is_active = false) OR 
        (is_active = true AND launch_date IS NOT NULL)
    ),
    CONSTRAINT valid_website_url CHECK (
        official_website IS NULL OR 
        official_website ~* '^https?://[^\s/$.?#].[^\s]*$'
    )
);

-- Add comments for documentation
COMMENT ON TABLE certification_modules IS 'Independent certification system configuration';
COMMENT ON COLUMN certification_modules.exam_structure IS 'JSON object with components, timing, scoring rules';
COMMENT ON COLUMN certification_modules.content_config IS 'JSON object with question types, difficulty levels';
COMMENT ON COLUMN certification_modules.phase IS 'Rollout phase: 1=initial, 2=expansion, 3=full';

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Course lookups
CREATE INDEX idx_courses_language_level ON courses(language, level) WHERE is_active = true;
CREATE INDEX idx_courses_certification_type ON courses(certification_type) WHERE is_active = true;
CREATE INDEX idx_courses_active ON courses(is_active) WHERE is_active = true;

-- User profile lookups
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_last_active ON user_profiles(last_active DESC);
CREATE INDEX idx_user_profiles_preferred_language ON user_profiles(preferred_language);

-- User course progress lookups
CREATE INDEX idx_user_course_progress_user_id ON user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_course_id ON user_course_progress(course_id);
CREATE INDEX idx_user_course_progress_user_course ON user_course_progress(user_id, course_id);
CREATE INDEX idx_user_course_progress_last_activity ON user_course_progress(last_activity DESC);
CREATE INDEX idx_user_course_progress_readiness ON user_course_progress(readiness_score DESC);

-- Exam session lookups
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_course_id ON exam_sessions(course_id);
CREATE INDEX idx_exam_sessions_progress_id ON exam_sessions(progress_id);
CREATE INDEX idx_exam_sessions_user_course ON exam_sessions(user_id, course_id);
CREATE INDEX idx_exam_sessions_type_component ON exam_sessions(session_type, component);
CREATE INDEX idx_exam_sessions_started_at ON exam_sessions(started_at DESC);
CREATE INDEX idx_exam_sessions_completed ON exam_sessions(is_completed, completed_at DESC);

-- AI tutor context lookups
CREATE INDEX idx_ai_tutor_contexts_user_id ON ai_tutor_contexts(user_id);
CREATE INDEX idx_ai_tutor_contexts_course_id ON ai_tutor_contexts(course_id);
CREATE INDEX idx_ai_tutor_contexts_session_id ON ai_tutor_contexts(session_id) WHERE session_id IS NOT NULL;
CREATE INDEX idx_ai_tutor_contexts_user_course ON ai_tutor_contexts(user_id, course_id);
CREATE INDEX idx_ai_tutor_contexts_context7 ON ai_tutor_contexts(context7_session_id) WHERE context7_session_id IS NOT NULL;
CREATE INDEX idx_ai_tutor_contexts_expires_at ON ai_tutor_contexts(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_ai_tutor_contexts_context_type ON ai_tutor_contexts(context_type);

-- Certification module lookups
CREATE INDEX idx_certification_modules_code ON certification_modules(code);
CREATE INDEX idx_certification_modules_language ON certification_modules(language);
CREATE INDEX idx_certification_modules_active_phase ON certification_modules(is_active, phase) WHERE is_active = true;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE certification_modules ENABLE ROW LEVEL SECURITY;

-- Courses: Public read for active courses, admin write
CREATE POLICY "Public can view active courses" ON courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage courses" ON courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- User profiles: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User course progress: Users can only access their own progress
CREATE POLICY "Users can view own course progress" ON user_course_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own course progress" ON user_course_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own course progress" ON user_course_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exam sessions: Users can only access their own sessions
CREATE POLICY "Users can view own exam sessions" ON exam_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own exam sessions" ON exam_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam sessions" ON exam_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI tutor contexts: Users can only access their own contexts
CREATE POLICY "Users can view own AI tutor contexts" ON ai_tutor_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AI tutor contexts" ON ai_tutor_contexts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI tutor contexts" ON ai_tutor_contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Certification modules: Public read for active modules, admin write
CREATE POLICY "Public can view active certification modules" ON certification_modules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage certification modules" ON certification_modules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.uid() = id 
            AND raw_user_meta_data ->> 'role' = 'admin'
        )
    );

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to calculate overall progress from component progress
CREATE OR REPLACE FUNCTION calculate_overall_progress(component_progress_json JSONB)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_progress DECIMAL(5,4) := 0.0;
    component_count INTEGER := 0;
    component_value DECIMAL(5,4);
BEGIN
    -- Iterate through all components and calculate average progress
    FOR component_value IN 
        SELECT (value::text)::DECIMAL(5,4) 
        FROM jsonb_each_text(component_progress_json)
        WHERE value::text ~ '^[0-9]*\.?[0-9]+$'
    LOOP
        total_progress := total_progress + component_value;
        component_count := component_count + 1;
    END LOOP;
    
    -- Return average if components exist, otherwise 0
    IF component_count > 0 THEN
        RETURN ROUND(total_progress / component_count, 2);
    ELSE
        RETURN 0.0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update progress timestamps and calculations
CREATE OR REPLACE FUNCTION update_user_course_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update timestamps
    NEW.updated_at = NOW();
    
    -- Update last activity if progress changed
    IF OLD.component_progress IS DISTINCT FROM NEW.component_progress OR 
       OLD.overall_progress IS DISTINCT FROM NEW.overall_progress THEN
        NEW.last_activity = NOW();
    END IF;
    
    -- Recalculate overall progress from component progress
    IF NEW.component_progress IS DISTINCT FROM OLD.component_progress THEN
        NEW.overall_progress = calculate_overall_progress(NEW.component_progress);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired AI contexts (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_contexts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM ai_tutor_contexts 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO system_logs (action, details, created_at) 
    VALUES ('ai_contexts_cleanup', jsonb_build_object('deleted_count', deleted_count), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate readiness score based on progress and performance
CREATE OR REPLACE FUNCTION calculate_readiness_score(
    progress_id UUID
) RETURNS DECIMAL(3,2) AS $$
DECLARE
    progress_record user_course_progress%ROWTYPE;
    avg_session_score DECIMAL(3,2);
    readiness DECIMAL(3,2) := 0.0;
BEGIN
    -- Get the progress record
    SELECT * INTO progress_record 
    FROM user_course_progress 
    WHERE id = progress_id;
    
    -- Calculate average session score for recent sessions
    SELECT COALESCE(AVG(score), 0.0) INTO avg_session_score
    FROM exam_sessions 
    WHERE progress_id = progress_record.id 
    AND is_completed = true
    AND completed_at >= NOW() - INTERVAL '30 days';
    
    -- Calculate readiness as weighted average of overall progress and recent performance
    readiness := (progress_record.overall_progress * 0.6) + (avg_session_score * 0.4);
    
    -- Ensure result is within bounds
    readiness := GREATEST(0.0, LEAST(1.0, readiness));
    
    -- Update the progress record
    UPDATE user_course_progress 
    SET readiness_score = readiness, updated_at = NOW()
    WHERE id = progress_id;
    
    RETURN readiness;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update user course progress
CREATE TRIGGER update_user_course_progress_trigger
    BEFORE UPDATE ON user_course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_user_course_progress();

-- Trigger to update course timestamps
CREATE OR REPLACE FUNCTION update_course_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_trigger
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_timestamp();

-- Trigger to update certification module timestamps
CREATE OR REPLACE FUNCTION update_certification_module_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_certification_module_trigger
    BEFORE UPDATE ON certification_modules
    FOR EACH ROW
    EXECUTE FUNCTION update_certification_module_timestamp();

-- Trigger to update AI tutor context timestamps
CREATE OR REPLACE FUNCTION update_ai_tutor_context_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_tutor_context_trigger
    BEFORE UPDATE ON ai_tutor_contexts
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_tutor_context_timestamp();

-- =============================================
-- SYSTEM LOGS TABLE (for audit trail)
-- =============================================
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action VARCHAR(100) NOT NULL,
    details JSONB DEFAULT '{}',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_system_logs_action ON system_logs(action);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id) WHERE user_id IS NOT NULL;

-- =============================================
-- DATA VALIDATION FUNCTIONS
-- =============================================

-- Function to validate course components match certification module
CREATE OR REPLACE FUNCTION validate_course_components(
    course_components JSONB,
    cert_module_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    module_components JSONB;
BEGIN
    -- Get the certification module's required components
    SELECT (exam_structure->'components') INTO module_components
    FROM certification_modules 
    WHERE id = cert_module_id;
    
    -- Check if all course components exist in module components
    RETURN course_components <@ module_components;
END;
$$ LANGUAGE plpgsql;

-- Function to validate CEFR level alignment
CREATE OR REPLACE FUNCTION validate_cefr_level(level_code VARCHAR) 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN level_code IN ('a1', 'a2', 'b1', 'b2', 'c1', 'c2');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- COMPLETION ACKNOWLEDGMENT
-- =============================================

-- Insert completion log
INSERT INTO system_logs (action, details) 
VALUES ('schema_migration', jsonb_build_object(
    'migration_name', '20250911000000_create_academy_schema',
    'tables_created', 6,
    'indexes_created', 20,
    'functions_created', 7,
    'triggers_created', 4
));

-- Success message
SELECT 'Academy Schema Migration 20250911000000 completed successfully' as migration_status;