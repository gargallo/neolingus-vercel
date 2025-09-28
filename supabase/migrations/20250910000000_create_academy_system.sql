-- Neolingus Academy System Migration
-- Course-Centric Architecture with MCP Integration
-- Created: 2025-09-10
-- Spec: 002-course-centric-academy

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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
    phase INTEGER NOT NULL CHECK (phase IN (1, 2, 3)),
    launch_date DATE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- COURSES TABLE (Language + Level combinations)
-- =============================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    certification_module_id UUID NOT NULL REFERENCES certification_modules(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    level VARCHAR(10) NOT NULL,
    certification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    components JSONB NOT NULL DEFAULT '[]', -- ["reading", "writing", "listening", "speaking"]
    assessment_rubric JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique language + level + certification combinations
    CONSTRAINT unique_course_combination UNIQUE (language, level, certification_type)
);

-- =============================================
-- USER PROFILES TABLE (Extended from auth.users)
-- =============================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    preferred_language VARCHAR(50) DEFAULT 'english',
    gdpr_consent BOOLEAN NOT NULL DEFAULT false,
    gdpr_consent_date TIMESTAMPTZ,
    lopd_consent BOOLEAN NOT NULL DEFAULT false,
    data_retention_preference VARCHAR(20) DEFAULT 'standard' CHECK (data_retention_preference IN ('minimal', 'standard', 'extended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    
    -- GDPR compliance checks
    CONSTRAINT gdpr_consent_required CHECK (gdpr_consent = true),
    CONSTRAINT gdpr_consent_date_required CHECK (gdpr_consent_date IS NOT NULL)
);

-- =============================================
-- USER COURSE ENROLLMENTS TABLE
-- =============================================
CREATE TABLE user_course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
    access_expires_at TIMESTAMPTZ,
    subscription_tier VARCHAR(20) DEFAULT 'standard' CHECK (subscription_tier IN ('basic', 'standard', 'premium')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one enrollment per user per course
    CONSTRAINT unique_user_course_enrollment UNIQUE (user_id, course_id)
);

-- =============================================
-- USER COURSE PROGRESS TABLE
-- =============================================
CREATE TABLE user_course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    enrollment_date TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    overall_progress DECIMAL(3,2) DEFAULT 0.0 CHECK (overall_progress >= 0.0 AND overall_progress <= 1.0),
    component_progress JSONB DEFAULT '{}', -- {"reading": 0.7, "writing": 0.5, ...}
    strengths JSONB DEFAULT '[]', -- ["grammar", "vocabulary"]
    weaknesses JSONB DEFAULT '[]', -- ["pronunciation", "listening"]
    readiness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (readiness_score >= 0.0 AND readiness_score <= 1.0),
    estimated_study_hours INTEGER DEFAULT 0,
    target_exam_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one progress record per user per course
    CONSTRAINT unique_user_course_progress UNIQUE (user_id, course_id)
);

-- =============================================
-- EXAM SESSIONS TABLE
-- =============================================
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress_id UUID NOT NULL REFERENCES user_course_progress(id) ON DELETE CASCADE,
    session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('practice', 'mock_exam', 'diagnostic')),
    component VARCHAR(20) NOT NULL CHECK (component IN ('reading', 'writing', 'listening', 'speaking')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    responses JSONB DEFAULT '{}', -- User answers and responses
    score DECIMAL(3,2) CHECK (score >= 0.0 AND score <= 1.0),
    detailed_scores JSONB DEFAULT '{}', -- Section-wise breakdown
    ai_feedback TEXT,
    improvement_suggestions JSONB DEFAULT '[]',
    is_completed BOOLEAN DEFAULT false,
    session_data JSONB DEFAULT '{}', -- Exam configuration, timing, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- EXAM QUESTIONS TABLE
-- =============================================
CREATE TABLE exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    answer JSONB NOT NULL, -- The user's answer (varies by question type)
    answer_text TEXT, -- Searchable text version of the answer
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent INTEGER, -- seconds spent on this question
    attempts INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    score DECIMAL(5,2), -- Question score if already graded
    feedback JSONB DEFAULT '{}' -- AI feedback for the answer
);

-- =============================================
-- USER ANSWERS TABLE
-- =============================================
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    answer JSONB NOT NULL, -- The user's answer (varies by question type)
    answer_text TEXT, -- Searchable text version of the answer
    answered_at TIMESTAMPTZ DEFAULT NOW(),
    time_spent INTEGER, -- seconds spent on this question
    attempts INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    score DECIMAL(5,2), -- Question score if already graded
    feedback JSONB DEFAULT '{}' -- AI feedback for the answer
);

-- =============================================
-- AI TUTOR SESSIONS TABLE
-- =============================================
CREATE TABLE ai_tutor_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    ai_session_metadata JSONB DEFAULT '{}', -- AI provider session tracking
    topic VARCHAR(255),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI TUTOR MESSAGES TABLE
-- =============================================
CREATE TABLE ai_tutor_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES ai_tutor_sessions(id) ON DELETE CASCADE,
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'ai')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AI TUTOR CONTEXT TABLE
-- =============================================
CREATE TABLE ai_tutor_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    session_id UUID REFERENCES exam_sessions(id) ON DELETE SET NULL,
    context_type VARCHAR(30) NOT NULL CHECK (context_type IN ('general', 'session_specific', 'weakness_focused')),
    learning_profile JSONB DEFAULT '{}', -- Learning style, preferences, patterns
    interaction_history JSONB DEFAULT '[]', -- Last 100 interactions
    current_context JSONB DEFAULT '{}', -- Active learning context
    ai_session_metadata JSONB DEFAULT '{}', -- AI provider session tracking
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'), -- Data retention
    
    -- Index for AI session metadata lookups
    -- Removed Context7 constraint - now using flexible ai_session_metadata JSONB
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Course lookups by language/level
CREATE INDEX idx_courses_language_level ON courses(language, level) WHERE is_active = true;
CREATE INDEX idx_courses_certification_type ON courses(certification_type) WHERE is_active = true;

-- User progress and activity
CREATE INDEX idx_user_progress_user_id ON user_course_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_course_progress(course_id);
CREATE INDEX idx_user_progress_last_activity ON user_course_progress(last_activity DESC);

-- User course enrollments
CREATE INDEX idx_user_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX idx_user_enrollments_course_id ON user_course_enrollments(course_id);

-- Exam session lookups
CREATE INDEX idx_exam_sessions_user_course ON exam_sessions(user_id, course_id);
CREATE INDEX idx_exam_sessions_type_component ON exam_sessions(session_type, component);
CREATE INDEX idx_exam_sessions_started_at ON exam_sessions(started_at DESC);

-- Exam questions and user answers
CREATE INDEX idx_exam_questions_session_id ON exam_questions(session_id);
CREATE INDEX idx_exam_questions_question_id ON exam_questions(question_id);
CREATE INDEX idx_user_answers_session_id ON user_answers(session_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);

-- AI context lookups
CREATE INDEX idx_ai_contexts_user_course ON ai_tutor_contexts(user_id, course_id);
CREATE INDEX idx_ai_contexts_metadata ON ai_tutor_contexts USING GIN (ai_session_metadata);
CREATE INDEX idx_ai_contexts_expires_at ON ai_tutor_contexts(expires_at) WHERE expires_at IS NOT NULL;

-- AI tutor sessions and messages
CREATE INDEX idx_ai_tutor_sessions_user_course ON ai_tutor_sessions(user_id, course_id);
CREATE INDEX idx_ai_tutor_sessions_metadata ON ai_tutor_sessions USING GIN (ai_session_metadata);
CREATE INDEX idx_ai_tutor_messages_session ON ai_tutor_messages(session_id);
CREATE INDEX idx_ai_tutor_messages_timestamp ON ai_tutor_messages(timestamp);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE certification_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_tutor_contexts ENABLE ROW LEVEL SECURITY;

-- Certification modules: Public read for active modules, admin write
CREATE POLICY "Public can view active certification modules" ON certification_modules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage certification modules" ON certification_modules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Courses: Public read for active courses, admin write
CREATE POLICY "Public can view active courses" ON courses
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage courses" ON courses
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- User profiles: Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User course enrollments: Users can only access their own enrollments
CREATE POLICY "Users can view own enrollments" ON user_course_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments" ON user_course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON user_course_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- User course progress: Users can only access their own progress
CREATE POLICY "Users can view own progress" ON user_course_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_course_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_course_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exam sessions: Users can only access their own sessions
CREATE POLICY "Users can view own exam sessions" ON exam_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own exam sessions" ON exam_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exam sessions" ON exam_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Exam questions: Users can only access questions from their own sessions
CREATE POLICY "Users can view own exam questions" ON exam_questions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exam_sessions es 
        WHERE es.id = exam_questions.session_id 
        AND es.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own exam questions" ON exam_questions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM exam_sessions es 
        WHERE es.id = exam_questions.session_id 
        AND es.user_id = auth.uid()
    ));

CREATE POLICY "Users can update own exam questions" ON exam_questions
    FOR UPDATE USING (EXISTS (
        SELECT 1 FROM exam_sessions es 
        WHERE es.id = exam_questions.session_id 
        AND es.user_id = auth.uid()
    ));

-- User answers: Users can only access answers from their own sessions
CREATE POLICY "Users can view own answers" ON user_answers
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM exam_sessions es 
        WHERE es.id = user_answers.session_id 
        AND es.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert own answers" ON user_answers
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM exam_sessions es 
        WHERE es.id = user_answers.session_id 
        AND es.user_id = auth.uid()
    ));

-- AI tutor sessions: Users can only access their own sessions
CREATE POLICY "Users can view own AI tutor sessions" ON ai_tutor_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AI tutor sessions" ON ai_tutor_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI tutor sessions" ON ai_tutor_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI tutor messages: Users can only access messages from their own sessions
CREATE POLICY "Users can view messages from their own tutor sessions" ON ai_tutor_messages
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ai_tutor_sessions ats 
        WHERE ats.id = ai_tutor_messages.session_id 
        AND ats.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert messages to their own tutor sessions" ON ai_tutor_messages
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM ai_tutor_sessions ats 
        WHERE ats.id = ai_tutor_messages.session_id 
        AND ats.user_id = auth.uid()
    ));

-- AI tutor contexts: Users can only access their own contexts
CREATE POLICY "Users can view own AI contexts" ON ai_tutor_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own AI contexts" ON ai_tutor_contexts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI contexts" ON ai_tutor_contexts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to calculate overall progress from component progress
CREATE OR REPLACE FUNCTION calculate_overall_progress(component_progress JSONB)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    total_progress DECIMAL(3,2) := 0.0;
    component_count INTEGER := 0;
    component_value DECIMAL(3,2);
BEGIN
    -- Iterate through all components and average the progress
    FOR component_value IN 
        SELECT (value::text)::DECIMAL(3,2) 
        FROM jsonb_each_text(component_progress)
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

-- Function to update progress timestamps
CREATE OR REPLACE FUNCTION update_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_activity = NOW();
    
    -- Recalculate overall progress from components
    NEW.overall_progress = calculate_overall_progress(NEW.component_progress);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired AI contexts (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_contexts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_tutor_contexts 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger to update progress timestamps and calculations
CREATE TRIGGER update_user_progress_trigger
    BEFORE UPDATE ON user_course_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_progress_timestamp();

-- Trigger to update exam session timestamps
CREATE OR REPLACE FUNCTION update_exam_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_session_trigger
    BEFORE UPDATE ON exam_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_session_timestamp();

-- Trigger to update exam questions timestamps
CREATE OR REPLACE FUNCTION update_exam_questions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.answered_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exam_questions_trigger
    BEFORE UPDATE ON exam_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_exam_questions_timestamp();

-- Trigger to update user answers timestamps
CREATE OR REPLACE FUNCTION update_user_answers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.answered_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_answers_trigger
    BEFORE UPDATE ON user_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_user_answers_timestamp();

-- Trigger to update AI tutor sessions timestamps
CREATE OR REPLACE FUNCTION update_ai_tutor_sessions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_tutor_sessions_trigger
    BEFORE UPDATE ON ai_tutor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_tutor_sessions_timestamp();

-- =============================================
-- SEED DATA FOR PHASE 1 CERTIFICATIONS
-- =============================================

-- Insert Phase 1 certification modules
INSERT INTO certification_modules (name, code, language, certification_body, official_website, exam_structure, content_config, compliance_requirements, is_active, phase, launch_date) VALUES
(
    'EOI English Certification',
    'eoi_en',
    'english',
    'Escuela Oficial de Idiomas',
    'https://www.educacion.gob.es/portada.html',
    '{
        "components": ["reading", "writing", "listening", "speaking"],
        "timing": {
            "reading": 90,
            "writing": 90,
            "listening": 40,
            "speaking": 15
        },
        "scoring": {
            "scale": "0-10",
            "pass_threshold": 5.0,
            "cefr_alignment": true
        }
    }',
    '{
        "question_types": {
            "reading": ["multiple_choice", "true_false", "matching", "gap_fill"],
            "writing": ["essay", "formal_letter", "report"],
            "listening": ["multiple_choice", "note_taking", "matching"],
            "speaking": ["presentation", "interaction", "monologue"]
        },
        "difficulty_levels": ["intermediate", "upper_intermediate"]
    }',
    '{
        "gdpr_compliant": true,
        "lopd_compliant": true,
        "data_retention_days": 1095,
        "region": "Spain"
    }',
    true,
    1,
    '2025-09-10'
),
(
    'JQCV Valenciano Certification',
    'jqcv_va',
    'valenciano',
    'Junta Qualificadora de Coneixements de Valencià',
    'https://www.ceice.gva.es/va/web/ensenanzas-en-valenciano',
    '{
        "components": ["reading", "writing", "listening", "speaking"],
        "timing": {
            "reading": 90,
            "writing": 90,
            "listening": 40,
            "speaking": 20
        },
        "scoring": {
            "scale": "0-10",
            "pass_threshold": 5.0,
            "cefr_alignment": true
        }
    }',
    '{
        "question_types": {
            "reading": ["multiple_choice", "true_false", "comprehension"],
            "writing": ["essay", "formal_text", "creative_writing"],
            "listening": ["multiple_choice", "dictation", "comprehension"],
            "speaking": ["conversation", "presentation", "reading_aloud"]
        },
        "difficulty_levels": ["intermediate", "upper_intermediate", "advanced"]
    }',
    '{
        "gdpr_compliant": true,
        "lopd_compliant": true,
        "data_retention_days": 1095,
        "region": "Valencia",
        "language_variant": "valenciano"
    }',
    true,
    1,
    '2025-09-10'
);

-- Insert Phase 1 courses
INSERT INTO courses (certification_module_id, language, level, certification_type, title, description, components, assessment_rubric) VALUES
(
    (SELECT id FROM certification_modules WHERE code = 'eoi_en'),
    'english',
    'b2',
    'eoi',
    'English B2 - EOI Certification',
    'Upper-intermediate English certification following EOI standards and CEFR B2 guidelines.',
    '["reading", "writing", "listening", "speaking"]',
    '{
        "reading": {"vocabulary": 0.3, "comprehension": 0.4, "analysis": 0.3},
        "writing": {"grammar": 0.3, "vocabulary": 0.3, "structure": 0.2, "content": 0.2},
        "listening": {"comprehension": 0.5, "detail": 0.3, "inference": 0.2},
        "speaking": {"fluency": 0.3, "accuracy": 0.3, "pronunciation": 0.2, "interaction": 0.2}
    }'
),
(
    (SELECT id FROM certification_modules WHERE code = 'eoi_en'),
    'english',
    'c1',
    'eoi',
    'English C1 - EOI Certification',
    'Advanced English certification following EOI standards and CEFR C1 guidelines.',
    '["reading", "writing", "listening", "speaking"]',
    '{
        "reading": {"vocabulary": 0.3, "comprehension": 0.4, "analysis": 0.3},
        "writing": {"grammar": 0.25, "vocabulary": 0.35, "structure": 0.2, "content": 0.2},
        "listening": {"comprehension": 0.4, "detail": 0.3, "inference": 0.3},
        "speaking": {"fluency": 0.35, "accuracy": 0.25, "pronunciation": 0.2, "interaction": 0.2}
    }'
),
(
    (SELECT id FROM certification_modules WHERE code = 'jqcv_va'),
    'valenciano',
    'b2',
    'jqcv',
    'Valencià B2 - JQCV Certification',
    'Certificació de valencià nivell intermedi-alt segons estàndards JQCV i MECR B2.',
    '["reading", "writing", "listening", "speaking"]',
    '{
        "reading": {"vocabulari": 0.3, "comprensio": 0.4, "analisi": 0.3},
        "writing": {"gramatica": 0.3, "vocabulari": 0.3, "estructura": 0.2, "contingut": 0.2},
        "listening": {"comprensio": 0.5, "detall": 0.3, "inferencia": 0.2},
        "speaking": {"fluixesa": 0.3, "precisio": 0.3, "pronunciacio": 0.2, "interaccio": 0.2}
    }'
),
(
    (SELECT id FROM certification_modules WHERE code = 'jqcv_va'),
    'valenciano',
    'c1',
    'jqcv',
    'Valencià C1 - JQCV Certification',
    'Certificació de valencià nivell avançat segons estàndards JQCV i MECR C1.',
    '["reading", "writing", "listening", "speaking"]',
    '{
        "reading": {"vocabulari": 0.3, "comprensio": 0.4, "analisi": 0.3},
        "writing": {"gramatica": 0.25, "vocabulari": 0.35, "estructura": 0.2, "contingut": 0.2},
        "listening": {"comprensio": 0.4, "detall": 0.3, "inferencia": 0.3},
        "speaking": {"fluixesa": 0.35, "precisio": 0.25, "pronunciacio": 0.2, "interaccio": 0.2}
    }'
);

-- =============================================
-- REAL-TIME SUBSCRIPTIONS SETUP
-- =============================================

-- Enable real-time for progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE user_course_progress;
ALTER PUBLICATION supabase_realtime ADD TABLE exam_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE ai_tutor_messages;

-- =============================================
-- SCHEDULED CLEANUP (GDPR COMPLIANCE)
-- =============================================

-- Note: This would typically be set up as a cron job or scheduled function
-- SELECT cron.schedule('cleanup-expired-contexts', '0 2 * * *', 'SELECT cleanup_expired_ai_contexts();');

-- Migration completed successfully
SELECT 'Neolingus Academy Database Migration Completed' as status;