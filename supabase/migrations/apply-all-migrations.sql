-- Apply All Migrations Orchestration Script
-- Date: 2025-09-15
-- Description: Idempotent orchestration of all required migrations with guards

-- Enable necessary extensions first
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Start transaction for safety
BEGIN;

-- ====================================
-- STEP 1: CREATE USER PROFILES SYSTEM
-- ====================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    subscription_status VARCHAR(20) DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled', 'trial')),
    subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'standard', 'premium')),
    gamification_enabled BOOLEAN DEFAULT true,
    gdpr_consent BOOLEAN DEFAULT false,
    gdpr_consent_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================
-- STEP 2: CREATE EXAM SYSTEM TABLES
-- ====================================

-- Courses table - Available courses in the system
CREATE TABLE IF NOT EXISTS courses (
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
CREATE TABLE IF NOT EXISTS user_courses (
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

-- Also create user_course_enrollments for consistency with newer migration patterns
CREATE TABLE IF NOT EXISTS user_course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    enrollment_status TEXT DEFAULT 'active' CHECK (enrollment_status IN ('active', 'expired', 'cancelled', 'trial')),
    subscription_tier TEXT DEFAULT 'standard',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    plan_id UUID, -- Will be linked to plans table later
    trial_started_at TIMESTAMPTZ,
    trial_expires_at TIMESTAMPTZ,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- Exam sessions - Individual exam attempts
CREATE TABLE IF NOT EXISTS exam_sessions (
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
    completed_at TIMESTAMP WITH TIME ZONE,
    time_remaining INTEGER, -- seconds remaining
    current_section TEXT,
    auto_save_data JSONB DEFAULT '{}',
    browser_info JSONB DEFAULT '{}',
    ip_address INET,
    score INTEGER DEFAULT 0,
    engagement_data JSONB DEFAULT '{}',
    skills_practiced JSONB,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User answers - Individual question answers
CREATE TABLE IF NOT EXISTS user_answers (
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
CREATE TABLE IF NOT EXISTS exam_results (
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

-- Course progress - Track overall progress in courses
CREATE TABLE IF NOT EXISTS course_progress (
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

-- ====================================
-- STEP 3: CREATE MODERN DASHBOARD SCHEMA
-- ====================================

-- Create user_analytics table for enhanced dashboard personalization
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Engagement metrics (JSONB for flexibility and performance)
    engagement JSONB NOT NULL DEFAULT '{
        "total_login_days": 0,
        "current_streak": 0,
        "longest_streak": 0,
        "last_activity_at": null,
        "session_count_today": 0,
        "total_study_minutes": 0,
        "weekly_study_minutes": [0, 0, 0, 0, 0, 0, 0]
    }',

    -- Achievement tracking
    achievements JSONB NOT NULL DEFAULT '{
        "total_xp": 0,
        "current_level": 1,
        "badges_earned": [],
        "milestones_reached": [],
        "next_milestone": {
            "id": "first_session",
            "progress": 0,
            "required_xp": 10
        }
    }',

    -- User preferences
    preferences JSONB NOT NULL DEFAULT '{
        "study_goal_minutes_daily": 30,
        "preferred_study_times": ["evening"],
        "difficulty_preference": "adaptive",
        "notification_preferences": {
            "streak_reminders": true,
            "achievement_alerts": true,
            "study_goal_reminders": true,
            "weekly_progress_summary": true
        }
    }',

    -- Dashboard configuration
    dashboard_config JSONB NOT NULL DEFAULT '{
        "layout": "comfortable",
        "theme": "auto",
        "widget_order": [],
        "hidden_widgets": [],
        "quick_actions": ["start_session", "view_progress"]
    }',

    -- Performance metrics
    performance JSONB NOT NULL DEFAULT '{
        "average_session_score": 0,
        "improvement_rate": 0,
        "weak_areas": [],
        "strong_areas": [],
        "recommended_study_path": ""
    }',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Schema versioning
    data_version VARCHAR(10) DEFAULT '1.0.0',

    -- Constraints
    CONSTRAINT user_analytics_user_id_unique UNIQUE(user_id),
    CONSTRAINT user_analytics_xp_positive CHECK ((achievements->>'total_xp')::int >= 0),
    CONSTRAINT user_analytics_level_range CHECK ((achievements->>'current_level')::int BETWEEN 1 AND 100),
    CONSTRAINT user_analytics_streak_positive CHECK ((engagement->>'current_streak')::int >= 0),
    CONSTRAINT user_analytics_study_minutes_positive CHECK ((engagement->>'total_study_minutes')::int >= 0)
);

-- Create dashboard_widgets table for configurable dashboard components
CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_type VARCHAR(100) NOT NULL,

    -- Widget configuration
    config JSONB NOT NULL DEFAULT '{}', -- title, size, position, data_source, etc.
    metadata JSONB NOT NULL DEFAULT '{}', -- category, description, requirements, etc.
    default_settings JSONB NOT NULL DEFAULT '{}', -- visibility, collapsible, etc.

    -- Admin settings
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT dashboard_widgets_type_not_empty CHECK (LENGTH(widget_type) > 0)
);

-- Create user_widget_preferences table for personalized widget layouts
CREATE TABLE IF NOT EXISTS user_widget_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    widget_id UUID NOT NULL REFERENCES dashboard_widgets(id) ON DELETE CASCADE,

    -- Widget positioning
    position JSONB NOT NULL DEFAULT '{
        "row": 1,
        "column": 1,
        "span_rows": 1,
        "span_columns": 1
    }',

    -- User-specific settings
    settings JSONB NOT NULL DEFAULT '{
        "is_visible": true,
        "is_collapsed": false,
        "refresh_interval": null,
        "custom_title": null,
        "filters": {},
        "display_options": {}
    }',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT user_widget_prefs_unique UNIQUE(user_id, widget_id),
    CONSTRAINT user_widget_position_positive CHECK (
        (position->>'row')::int > 0 AND
        (position->>'column')::int > 0 AND
        (position->>'span_rows')::int > 0 AND
        (position->>'span_columns')::int > 0
    )
);

-- Create user_progress_visualizations table for custom progress charts
CREATE TABLE IF NOT EXISTS user_progress_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT REFERENCES courses(course_id) ON DELETE CASCADE,

    -- Progress data
    progress JSONB NOT NULL DEFAULT '{
        "overall_completion": 0,
        "weekly_completion": [0, 0, 0, 0, 0, 0, 0],
        "skill_breakdown": {},
        "session_history": [],
        "time_spent": {
            "total_minutes": 0,
            "this_week": 0,
            "daily_average": 0,
            "streak_minutes": 0
        }
    }',

    -- Visualization configuration
    visualization_config JSONB NOT NULL DEFAULT '{
        "chart_type": "line",
        "color_scheme": "blue",
        "show_comparisons": false,
        "show_predictions": true,
        "animation_enabled": true,
        "detail_level": "summary"
    }',

    -- Milestones tracking
    milestones JSONB NOT NULL DEFAULT '{
        "completed": [],
        "current": [],
        "upcoming": [],
        "overdue": []
    }',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_calculated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT user_progress_completion_range CHECK (
        (progress->>'overall_completion')::numeric BETWEEN 0 AND 1
    )
);

-- ====================================
-- STEP 4: CREATE PLAN MANAGEMENT TABLES
-- ====================================

-- Create plans table for subscription management
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    tier VARCHAR(20) CHECK (tier IN ('basic', 'standard', 'premium')),
    features JSONB DEFAULT '[]',
    pricing JSONB DEFAULT '{}',
    trial_enabled BOOLEAN DEFAULT true,
    trial_duration_days INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link plan_id to user_course_enrollments if column doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_course_enrollments' AND column_name = 'plan_id') THEN
        ALTER TABLE user_course_enrollments ADD COLUMN plan_id UUID REFERENCES plans(id);
    END IF;
END $$;

-- ====================================
-- STEP 5: CREATE AI AGENTS SYSTEM
-- ====================================

-- AI agents table for intelligent tutoring
CREATE TABLE IF NOT EXISTS ai_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL, -- 'tutor', 'examiner', 'feedback'
    description TEXT,
    system_prompt TEXT NOT NULL,
    model_config JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent conversations tracking
CREATE TABLE IF NOT EXISTS agent_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES ai_agents(id) ON DELETE CASCADE,
    session_id UUID REFERENCES exam_sessions(id) ON DELETE CASCADE,
    conversation_data JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    total_messages INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- ====================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);

-- Courses and enrollments indexes
CREATE INDEX IF NOT EXISTS idx_user_courses_user_id ON user_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_courses_course_id ON user_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_user_id ON user_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_course_enrollments_course_id ON user_course_enrollments(course_id);

-- Exam sessions indexes
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_course_id ON exam_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_started_at ON exam_sessions(started_at);

-- User analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_updated_at ON user_analytics(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_analytics_xp ON user_analytics USING GIN ((achievements->'total_xp'));
CREATE INDEX IF NOT EXISTS idx_user_analytics_level ON user_analytics USING GIN ((achievements->'current_level'));
CREATE INDEX IF NOT EXISTS idx_user_analytics_streak ON user_analytics USING GIN ((engagement->'current_streak'));

-- Dashboard widgets indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active);

-- Widget preferences indexes
CREATE INDEX IF NOT EXISTS idx_user_widget_prefs_user_id ON user_widget_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_widget_prefs_widget_id ON user_widget_preferences(widget_id);

-- Progress visualizations indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress_visualizations(course_id);

-- ====================================
-- STEP 7: CREATE ESSENTIAL FUNCTIONS
-- ====================================

-- Create or replace the update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to calculate XP for sessions
CREATE OR REPLACE FUNCTION calculate_xp_for_session(
    p_score INTEGER,
    p_duration_minutes INTEGER,
    p_difficulty INTEGER DEFAULT 5,
    p_hints_used INTEGER DEFAULT 0,
    p_completion_bonus BOOLEAN DEFAULT TRUE
) RETURNS INTEGER AS $$
DECLARE
    base_xp INTEGER := 10;
    score_bonus INTEGER;
    time_bonus INTEGER;
    difficulty_multiplier DECIMAL;
    hint_penalty INTEGER;
    completion_bonus INTEGER := 0;
    total_xp INTEGER;
BEGIN
    -- Calculate score bonus (0-50 XP based on score)
    score_bonus := CASE
        WHEN p_score >= 90 THEN 50
        WHEN p_score >= 80 THEN 40
        WHEN p_score >= 70 THEN 30
        WHEN p_score >= 60 THEN 20
        WHEN p_score >= 50 THEN 10
        ELSE 0
    END;

    -- Calculate time bonus (up to 20 XP for efficient completion)
    time_bonus := CASE
        WHEN p_duration_minutes <= 15 THEN 20
        WHEN p_duration_minutes <= 30 THEN 15
        WHEN p_duration_minutes <= 45 THEN 10
        WHEN p_duration_minutes <= 60 THEN 5
        ELSE 0
    END;

    -- Difficulty multiplier (1.0-2.0)
    difficulty_multiplier := 1.0 + (p_difficulty - 1) * 0.1;

    -- Hint penalty (5 XP per hint used)
    hint_penalty := p_hints_used * 5;

    -- Completion bonus
    IF p_completion_bonus THEN
        completion_bonus := 15;
    END IF;

    -- Calculate total XP
    total_xp := FLOOR((base_xp + score_bonus + time_bonus + completion_bonus - hint_penalty) * difficulty_multiplier);

    -- Ensure minimum XP of 1
    RETURN GREATEST(total_xp, 1);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate user level from total XP
CREATE OR REPLACE FUNCTION calculate_level_from_xp(p_total_xp INTEGER) RETURNS INTEGER AS $$
DECLARE
    level INTEGER := 1;
    xp_for_next_level INTEGER := 100;
    remaining_xp INTEGER := p_total_xp;
BEGIN
    WHILE remaining_xp >= xp_for_next_level AND level < 100 LOOP
        remaining_xp := remaining_xp - xp_for_next_level;
        level := level + 1;
        -- XP requirement increases by 20% each level
        xp_for_next_level := FLOOR(xp_for_next_level * 1.2);
    END LOOP;

    RETURN level;
END;
$$ LANGUAGE plpgsql;

-- ====================================
-- STEP 8: CREATE THE MISSING DASHBOARD FUNCTION
-- ====================================

-- THE CRITICAL FUNCTION THAT WAS MISSING - This resolves the PGRST202 error
-- Comment 6: Make function SECURITY DEFINER to avoid RLS read failures
CREATE OR REPLACE FUNCTION public.get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE(
    user_stats JSONB,
    configured_widgets JSONB,
    recent_progress JSONB
) SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH user_analytics_data AS (
        SELECT
            row_to_json(ua)::jsonb as analytics
        FROM user_analytics ua
        WHERE ua.user_id = p_user_id
    ),
    widget_data AS (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'widget', row_to_json(dw),
                    'preferences', row_to_json(uwp)
                )
            ) as widgets
        FROM dashboard_widgets dw
        LEFT JOIN user_widget_preferences uwp ON dw.id = uwp.widget_id AND uwp.user_id = p_user_id
        WHERE dw.is_active = true
    ),
    -- Comment 12: Add deterministic ordering to recent_progress
    progress_data AS (
        SELECT jsonb_agg(row_to_json(upv) ORDER BY upv.updated_at DESC) as progress
        FROM (
            SELECT * FROM user_progress_visualizations
            WHERE user_id = p_user_id
            ORDER BY updated_at DESC
            LIMIT 5
        ) upv
    )
    SELECT
        COALESCE(uad.analytics, '{}'::jsonb),
        COALESCE(wd.widgets, '[]'::jsonb),
        COALESCE(pd.progress, '[]'::jsonb)
    FROM user_analytics_data uad
    CROSS JOIN widget_data wd
    CROSS JOIN progress_data pd;
END;
$$ LANGUAGE plpgsql;

-- Comment 6 & 11: Grant execute permissions for the dashboard function
GRANT EXECUTE ON FUNCTION public.get_user_dashboard_data(UUID) TO authenticated;

-- ====================================
-- STEP 9: CREATE TRIGGERS
-- ====================================

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_courses_updated_at ON user_courses;
CREATE TRIGGER update_user_courses_updated_at BEFORE UPDATE ON user_courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_sessions_updated_at ON exam_sessions;
CREATE TRIGGER update_exam_sessions_updated_at BEFORE UPDATE ON exam_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_analytics_updated_at ON user_analytics;
CREATE TRIGGER update_user_analytics_updated_at BEFORE UPDATE ON user_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- STEP 10: ENABLE ROW LEVEL SECURITY
-- ====================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_widget_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_visualizations ENABLE ROW LEVEL SECURITY;

-- ====================================
-- STEP 11: CREATE RLS POLICIES
-- ====================================

-- Courses are public (read-only)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'public_courses_viewable') THEN
        CREATE POLICY "public_courses_viewable" ON courses FOR SELECT USING (available = true);
    END IF;
END
$$;

-- User courses - users can only see their own subscriptions
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_courses' AND policyname = 'users_own_course_subscriptions') THEN
        CREATE POLICY "users_own_course_subscriptions" ON user_courses FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- User analytics - users can only see their own analytics
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_analytics' AND policyname = 'users_own_analytics') THEN
        CREATE POLICY "users_own_analytics" ON user_analytics FOR ALL USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Dashboard widgets - everyone can view active widgets
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dashboard_widgets' AND policyname = 'active_widgets_viewable') THEN
        CREATE POLICY "active_widgets_viewable" ON dashboard_widgets FOR SELECT USING (is_active = true);
    END IF;
END
$$;

-- Comment 5: user_widget_preferences - users can read/update their own preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_widget_preferences' AND policyname = 'users_own_widget_prefs_select') THEN
        CREATE POLICY users_own_widget_prefs_select ON user_widget_preferences FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_widget_preferences' AND policyname = 'users_own_widget_prefs_modify') THEN
        CREATE POLICY users_own_widget_prefs_modify ON user_widget_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
        CREATE POLICY users_own_widget_prefs_update ON user_widget_preferences FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Comment 5: user_analytics - allow insert of own row
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_analytics' AND policyname = 'users_own_analytics_insert') THEN
        CREATE POLICY users_own_analytics_insert ON user_analytics FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- ====================================
-- STEP 12: INSERT DEFAULT DATA
-- ====================================

-- Insert default courses if they don't exist
INSERT INTO courses (course_id, title, language, level, institution, region, description, cultural_context, available)
VALUES
('valenciano_c1', 'Valencià C1', 'valenciano', 'C1', 'EOI / CIEACOVA', 'valencia', 'Preparació per als exàmens oficials de valencià nivell C1', '["Literatura valenciana", "Tradicions valencianes"]', true),
('ingles_b2', 'English B2 First', 'english', 'B2', 'Cambridge English / EOI', 'cambridge', 'Preparation for Cambridge B2 First and EOI B2 examinations', '["Everyday contexts", "Work situations"]', true)
ON CONFLICT (course_id) DO NOTHING;

-- Insert default dashboard widgets if they don't exist
INSERT INTO dashboard_widgets (widget_type, config, metadata, default_settings) VALUES
('progress_overview',
 '{"title": "Learning Progress", "size": "large", "position": {"row": 1, "column": 1}, "data_source": "user_analytics"}',
 '{"category": "progress", "description": "Overall learning progress with XP and streaks", "is_customizable": true}',
 '{"is_visible": true, "is_collapsible": false, "user_sortable": true, "admin_only": false}'
),
('course_cards',
 '{"title": "Active Courses", "size": "medium", "position": {"row": 1, "column": 2}, "data_source": "user_courses"}',
 '{"category": "courses", "description": "User enrolled courses with progress", "is_customizable": true}',
 '{"is_visible": true, "is_collapsible": false, "user_sortable": true, "admin_only": false}'
)
ON CONFLICT DO NOTHING;

-- Insert default plans if they don't exist
INSERT INTO plans (name, tier, features, pricing, trial_enabled, trial_duration_days) VALUES
('Basic Plan', 'basic', '["Access to B1-B2 courses", "Basic exam simulator", "Progress tracking"]', '{"monthly": 9.99, "yearly": 99.99}', true, 7),
('Standard Plan', 'standard', '["Access to all courses", "Advanced exam simulator", "AI feedback", "Progress analytics"]', '{"monthly": 19.99, "yearly": 199.99}', true, 7),
('Premium Plan', 'premium', '["Everything in Standard", "1-on-1 tutoring", "Cultural immersion content", "Certification prep"]', '{"monthly": 39.99, "yearly": 399.99}', true, 14)
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- INTROSPECTION HELPER FUNCTIONS
-- ====================================

-- Comment 3: Helper function to check if function exists
CREATE OR REPLACE FUNCTION public.fn_exists(p_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM information_schema.routines
    WHERE routine_schema = 'public' AND routine_name = p_name
  );
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comment 3: Helper function to list missing tables from a set
CREATE OR REPLACE FUNCTION public.missing_tables(p_names TEXT[])
RETURNS TABLE(name TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT unnest(p_names)
  EXCEPT
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Comment 3: Grant execute permissions for introspection functions
GRANT EXECUTE ON FUNCTION public.fn_exists(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.missing_tables(TEXT[]) TO anon, authenticated;

-- Comment 7: Fix inconsistent course_id typing - migrate from UUID to TEXT
DO $$
BEGIN
    -- Check if the column exists and is UUID type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_progress_visualizations'
        AND column_name = 'course_id'
        AND data_type = 'uuid'
    ) THEN
        -- Drop the existing foreign key constraint
        ALTER TABLE user_progress_visualizations
        DROP CONSTRAINT IF EXISTS user_progress_visualizations_course_id_fkey;

        -- Change the column type from UUID to TEXT
        ALTER TABLE user_progress_visualizations
        ALTER COLUMN course_id TYPE TEXT USING course_id::TEXT;

        -- Add the new foreign key constraint
        ALTER TABLE user_progress_visualizations
        ADD CONSTRAINT user_progress_visualizations_course_id_fkey
        FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE;
    END IF;
END $$;

COMMIT;

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Verify the critical function exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_dashboard_data') THEN
        RAISE NOTICE 'SUCCESS: get_user_dashboard_data function created successfully';
    ELSE
        RAISE EXCEPTION 'CRITICAL ERROR: get_user_dashboard_data function not found after migration';
    END IF;
END
$$;

-- Verify all critical tables exist
DO $$
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_analytics') THEN
        missing_tables := array_append(missing_tables, 'user_analytics');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dashboard_widgets') THEN
        missing_tables := array_append(missing_tables, 'dashboard_widgets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'courses') THEN
        missing_tables := array_append(missing_tables, 'courses');
    END IF;

    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'CRITICAL ERROR: Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All critical tables created successfully';
    END IF;
END
$$;

-- Final verification query as requested - confirm function existence in information_schema
SELECT routine_schema, routine_name
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_name = 'get_user_dashboard_data';