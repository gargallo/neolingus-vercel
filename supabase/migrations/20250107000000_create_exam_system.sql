-- Migration: Create exam system tables
-- This creates the database schema for the hybrid exam architecture

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table - Available courses in the system
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id TEXT UNIQUE NOT NULL, -- e.g., 'valenciano_c1', 'ingles_b2'
    title TEXT NOT NULL,
    language TEXT NOT NULL, -- 'english', 'valenciano', 'catalan'
    level TEXT NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
    institution TEXT NOT NULL,
    region TEXT NOT NULL, -- 'valencia', 'andalucia', 'cambridge'
    description TEXT,
    cultural_context JSONB DEFAULT '[]',
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User courses - User subscriptions to courses
CREATE TABLE user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(course_id),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_tier TEXT DEFAULT 'standard', -- 'basic', 'standard', 'premium'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Exam sessions - Individual exam attempts
CREATE TABLE exam_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(course_id),
    exam_id TEXT NOT NULL, -- References courseConfig.examConfigs[examId]
    provider_id TEXT NOT NULL, -- 'cambridge', 'eoi_valencia', 'cieacova'
    session_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'paused', 'completed', 'expired', 'abandoned')),
    mode TEXT DEFAULT 'practice' CHECK (mode IN ('practice', 'exam', 'timed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    finished_at TIMESTAMP WITH TIME ZONE,
    time_remaining INTEGER, -- seconds remaining
    current_section TEXT,
    auto_save_data JSONB DEFAULT '{}',
    browser_info JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User answers - Individual question answers
CREATE TABLE user_answers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    part_id TEXT NOT NULL,
    answer JSONB NOT NULL, -- The user's answer (varies by question type)
    answer_text TEXT, -- Searchable text version of the answer
    answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    time_spent INTEGER, -- seconds spent on this question
    attempts INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT false,
    score DECIMAL(5,2), -- Question score if already graded
    feedback JSONB DEFAULT '{}' -- AI feedback for the answer
);

-- Exam results - Final exam scores and results
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(course_id),
    exam_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    total_score DECIMAL(5,2) NOT NULL,
    max_possible_score DECIMAL(5,2) NOT NULL,
    percentage_score DECIMAL(5,2) NOT NULL,
    passed BOOLEAN NOT NULL,
    section_scores JSONB NOT NULL, -- Scores by section
    detailed_scores JSONB NOT NULL, -- Detailed breakdown by question/part
    feedback JSONB DEFAULT '{}', -- Overall exam feedback
    ai_analysis JSONB DEFAULT '{}', -- AI analysis of performance
    cultural_bonus DECIMAL(5,2) DEFAULT 0, -- Bonus for cultural knowledge
    graded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    graded_by UUID REFERENCES auth.users(id), -- If manually reviewed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio recordings - For speaking sections
CREATE TABLE audio_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    duration INTEGER, -- seconds
    transcription TEXT,
    transcription_confidence DECIMAL(3,2),
    ai_score DECIMAL(5,2),
    ai_feedback JSONB DEFAULT '{}',
    human_score DECIMAL(5,2),
    human_feedback TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Analytics events - Track user behavior and system events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(course_id),
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Course progress - Track overall progress in courses
CREATE TABLE course_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(course_id),
    
    -- Skill levels (course-specific)
    skill_levels JSONB DEFAULT '{}', -- e.g., {"reading": 75, "writing": 60, "speaking": 80}
    cultural_knowledge JSONB DEFAULT '{}', -- Cultural context understanding
    exam_readiness DECIMAL(5,2) DEFAULT 0, -- Overall readiness percentage
    
    -- Learning path progress
    learning_path_progress JSONB DEFAULT '{}',
    recommended_study_hours INTEGER DEFAULT 0,
    study_streak INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX idx_exam_sessions_course_id ON exam_sessions(course_id);
CREATE INDEX idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_started_at ON exam_sessions(started_at);
CREATE INDEX idx_user_answers_session_id ON user_answers(session_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_exam_results_user_id ON exam_results(user_id);
CREATE INDEX idx_exam_results_course_id ON exam_results(course_id);
CREATE INDEX idx_exam_results_passed ON exam_results(passed);
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_course_progress_user_id ON course_progress(user_id);
CREATE INDEX idx_course_progress_course_id ON course_progress(course_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_courses_updated_at BEFORE UPDATE ON user_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_progress_updated_at BEFORE UPDATE ON course_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE audio_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

-- Courses are public (read-only)
CREATE POLICY "Public courses are viewable by everyone" ON courses FOR SELECT USING (available = true);

-- User courses - users can only see their own subscriptions
CREATE POLICY "Users can view their own course subscriptions" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own course subscriptions" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own course subscriptions" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

-- Exam sessions - users can only access their own sessions
CREATE POLICY "Users can view their own exam sessions" ON exam_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own exam sessions" ON exam_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own exam sessions" ON exam_sessions FOR UPDATE USING (auth.uid() = user_id);

-- User answers - users can only access answers from their sessions
CREATE POLICY "Users can view their own answers" ON user_answers FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM exam_sessions WHERE id = session_id)
);
CREATE POLICY "Users can insert their own answers" ON user_answers FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM exam_sessions WHERE id = session_id)
);
CREATE POLICY "Users can update their own answers" ON user_answers FOR UPDATE USING (
    auth.uid() IN (SELECT user_id FROM exam_sessions WHERE id = session_id)
);

-- Exam results - users can only see their own results
CREATE POLICY "Users can view their own exam results" ON exam_results FOR SELECT USING (auth.uid() = user_id);

-- Audio recordings - users can only access their own recordings
CREATE POLICY "Users can view their own audio recordings" ON audio_recordings FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM exam_sessions WHERE id = session_id)
);
CREATE POLICY "Users can insert their own audio recordings" ON audio_recordings FOR INSERT WITH CHECK (
    auth.uid() IN (SELECT user_id FROM exam_sessions WHERE id = session_id)
);

-- Analytics events - users can only see their own events
CREATE POLICY "Users can view their own analytics events" ON analytics_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can insert analytics events" ON analytics_events FOR INSERT WITH CHECK (true);

-- Course progress - users can only see their own progress
CREATE POLICY "Users can view their own course progress" ON course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own course progress" ON course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own course progress" ON course_progress FOR UPDATE USING (auth.uid() = user_id);

-- Insert initial course data based on existing simulators
INSERT INTO courses (course_id, title, language, level, institution, region, description, cultural_context, available) VALUES
(
    'valenciano_c1',
    'Valencià C1', 
    'valenciano',
    'C1',
    'EOI / CIEACOVA',
    'valencia',
    'Preparació per als exàmens oficials de valencià nivell C1',
    '["Literatura valenciana", "Tradicions valencianes", "Història del País Valencià", "Cultura mediterrània"]',
    true
),
(
    'valenciano_b2',
    'Valencià B2',
    'valenciano', 
    'B2',
    'EOI / CIEACOVA',
    'valencia',
    'Preparació per als exàmens oficials de valencià nivell B2',
    '["Cultura valenciana", "Festes populars", "Tradicions locals"]',
    true
),
(
    'valenciano_b1',
    'Valencià B1',
    'valenciano',
    'B1', 
    'EOI / CIEACOVA',
    'valencia',
    'Preparació per als exàmens oficials de valencià nivell B1',
    '["Vida quotidiana valenciana", "Tradicions bàsiques"]',
    true
),
(
    'ingles_c2',
    'English C2 Proficiency',
    'english',
    'C2',
    'Cambridge English',
    'cambridge',
    'Preparation for Cambridge C2 Proficiency examination',
    '["Academic English", "Professional contexts", "Literature", "Critical thinking"]',
    true
),
(
    'ingles_c1',
    'English C1 Advanced',
    'english',
    'C1',
    'Cambridge English / EOI',
    'cambridge',
    'Preparation for Cambridge C1 Advanced and EOI C1 examinations',
    '["Academic contexts", "Professional English", "Cultural awareness"]',
    true
),
(
    'ingles_b2',
    'English B2 First',
    'english',
    'B2',
    'Cambridge English / EOI',
    'cambridge',
    'Preparation for Cambridge B2 First and EOI B2 examinations',
    '["Everyday contexts", "Work situations", "Social interactions"]',
    true
),
(
    'ingles_b1',
    'English B1 Preliminary',
    'english',
    'B1',
    'Cambridge English',
    'cambridge',
    'Preparation for Cambridge B1 Preliminary examination',
    '["Basic social contexts", "Travel situations", "Simple work contexts"]',
    true
),
(
    'ingles_a2',
    'English A2 Key',
    'english',
    'A2',
    'Cambridge English',
    'cambridge',
    'Preparation for Cambridge A2 Key examination',
    '["Basic personal information", "Simple social situations"]',
    true
);