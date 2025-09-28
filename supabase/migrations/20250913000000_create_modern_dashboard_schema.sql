-- Migration: Modern Dashboard Redesign Schema
-- Date: 2025-09-13
-- Description: Creates tables and functions for modern dashboard with gamification and analytics

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Drop existing objects if they exist (for development)
DROP TABLE IF EXISTS user_widget_preferences CASCADE;
DROP TABLE IF EXISTS user_progress_visualizations CASCADE;
DROP TABLE IF EXISTS dashboard_widgets CASCADE;
DROP TABLE IF EXISTS user_analytics CASCADE;

-- Create user_analytics table for enhanced dashboard personalization
CREATE TABLE user_analytics (
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
CREATE TABLE dashboard_widgets (
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
CREATE TABLE user_widget_preferences (
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
CREATE TABLE user_progress_visualizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    
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

-- Add indexes for performance optimization
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_updated_at ON user_analytics(updated_at);
CREATE INDEX idx_user_analytics_xp ON user_analytics USING GIN ((achievements->'total_xp'));
CREATE INDEX idx_user_analytics_level ON user_analytics USING GIN ((achievements->'current_level'));
CREATE INDEX idx_user_analytics_streak ON user_analytics USING GIN ((engagement->'current_streak'));

CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX idx_dashboard_widgets_active ON dashboard_widgets(is_active);
CREATE INDEX idx_dashboard_widgets_metadata ON dashboard_widgets USING GIN (metadata);

CREATE INDEX idx_user_widget_prefs_user_id ON user_widget_preferences(user_id);
CREATE INDEX idx_user_widget_prefs_widget_id ON user_widget_preferences(widget_id);

CREATE INDEX idx_user_progress_user_id ON user_progress_visualizations(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress_visualizations(course_id);
CREATE INDEX idx_user_progress_calculated ON user_progress_visualizations(last_calculated_at);

-- Create functions for XP calculation and level management
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

-- Function to update user analytics after exam session
CREATE OR REPLACE FUNCTION update_user_analytics_after_session(
    p_user_id UUID,
    p_session_id UUID,
    p_score INTEGER,
    p_duration_minutes INTEGER,
    p_xp_earned INTEGER,
    p_skills_practiced TEXT[]
) RETURNS VOID AS $$
DECLARE
    current_analytics JSONB;
    new_total_xp INTEGER;
    new_level INTEGER;
    current_streak INTEGER;
    last_activity DATE;
    today DATE := CURRENT_DATE;
BEGIN
    -- Get current analytics or create default
    SELECT engagement, achievements INTO current_analytics 
    FROM user_analytics WHERE user_id = p_user_id;
    
    IF current_analytics IS NULL THEN
        -- Create new analytics record
        INSERT INTO user_analytics (user_id) VALUES (p_user_id);
        current_analytics := '{
            "engagement": {"current_streak": 0, "total_study_minutes": 0, "session_count_today": 0},
            "achievements": {"total_xp": 0, "current_level": 1}
        }'::jsonb;
    END IF;
    
    -- Calculate new XP and level
    new_total_xp := COALESCE((current_analytics->'achievements'->>'total_xp')::INTEGER, 0) + p_xp_earned;
    new_level := calculate_level_from_xp(new_total_xp);
    
    -- Update streak logic
    last_activity := (current_analytics->'engagement'->>'last_activity_at')::DATE;
    current_streak := COALESCE((current_analytics->'engagement'->>'current_streak')::INTEGER, 0);
    
    IF last_activity IS NULL OR last_activity < today THEN
        IF last_activity = today - INTERVAL '1 day' THEN
            current_streak := current_streak + 1;
        ELSE
            current_streak := 1;
        END IF;
    END IF;
    
    -- Update user analytics
    UPDATE user_analytics SET
        engagement = engagement || jsonb_build_object(
            'total_study_minutes', COALESCE((engagement->>'total_study_minutes')::INTEGER, 0) + p_duration_minutes,
            'current_streak', current_streak,
            'last_activity_at', NOW(),
            'session_count_today', COALESCE((engagement->>'session_count_today')::INTEGER, 0) + 1
        ),
        achievements = achievements || jsonb_build_object(
            'total_xp', new_total_xp,
            'current_level', new_level
        ),
        performance = performance || jsonb_build_object(
            'average_session_score', (
                SELECT AVG(score) FROM exam_sessions 
                WHERE user_id = p_user_id AND completed_at IS NOT NULL
            )
        ),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
END;
$$ LANGUAGE plpgsql;

-- Function to get user dashboard data efficiently
CREATE OR REPLACE FUNCTION get_user_dashboard_data(p_user_id UUID)
RETURNS TABLE(
    user_stats JSONB,
    configured_widgets JSONB,
    recent_progress JSONB
) AS $$
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
    progress_data AS (
        SELECT 
            jsonb_agg(row_to_json(upv)) as progress
        FROM user_progress_visualizations upv
        WHERE upv.user_id = p_user_id
        ORDER BY upv.updated_at DESC
        LIMIT 5
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

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_analytics_updated_at
    BEFORE UPDATE ON user_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
    BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_widget_preferences_updated_at
    BEFORE UPDATE ON user_widget_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_visualizations_updated_at
    BEFORE UPDATE ON user_progress_visualizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_widget_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress_visualizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analytics" ON user_analytics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics" ON user_analytics
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" ON user_analytics
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view active widgets" ON dashboard_widgets
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can modify widgets" ON dashboard_widgets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Users can manage their widget preferences" ON user_widget_preferences
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their progress visualizations" ON user_progress_visualizations
    FOR ALL USING (auth.uid() = user_id);

-- Insert default dashboard widgets
INSERT INTO dashboard_widgets (widget_type, config, metadata, default_settings) VALUES 
('progress_overview', 
 '{"title": "Learning Progress", "size": "large", "position": {"row": 1, "column": 1}, "data_source": "user_analytics"}',
 '{"category": "progress", "description": "Overall learning progress with XP and streaks", "is_customizable": true, "supports_drill_down": true}',
 '{"is_visible": true, "is_collapsible": false, "user_sortable": true, "admin_only": false}'
),
('course_cards', 
 '{"title": "Active Courses", "size": "medium", "position": {"row": 1, "column": 2}, "data_source": "user_courses"}',
 '{"category": "courses", "description": "User enrolled courses with progress", "is_customizable": true, "supports_drill_down": true}',
 '{"is_visible": true, "is_collapsible": false, "user_sortable": true, "admin_only": false}'
),
('achievement_showcase', 
 '{"title": "Recent Achievements", "size": "medium", "position": {"row": 2, "column": 1}, "data_source": "user_achievements"}',
 '{"category": "achievements", "description": "Badges, XP milestones, and accomplishments", "is_customizable": true, "supports_drill_down": false}',
 '{"is_visible": true, "is_collapsible": true, "user_sortable": true, "admin_only": false}'
),
('study_analytics', 
 '{"title": "Study Analytics", "size": "full-width", "position": {"row": 3, "column": 1}, "data_source": "session_analytics"}',
 '{"category": "analytics", "description": "Detailed study time and performance analytics", "is_customizable": true, "supports_drill_down": true}',
 '{"is_visible": true, "is_collapsible": true, "user_sortable": true, "admin_only": false}'
),
('streak_tracker', 
 '{"title": "Study Streak", "size": "small", "position": {"row": 2, "column": 2}, "data_source": "user_streaks"}',
 '{"category": "progress", "description": "Daily study streak counter with motivational elements", "is_customizable": false, "supports_drill_down": false}',
 '{"is_visible": true, "is_collapsible": false, "user_sortable": true, "admin_only": false}'
);

-- Add XP tracking to exam_sessions table (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_sessions' AND column_name = 'xp_earned') THEN
        ALTER TABLE exam_sessions ADD COLUMN xp_earned INTEGER DEFAULT 0;
    END IF;
END $$;

-- Create trigger to automatically calculate and update XP for exam sessions
CREATE OR REPLACE FUNCTION auto_calculate_session_xp()
RETURNS TRIGGER AS $$
DECLARE
    calculated_xp INTEGER;
    engagement_data JSONB;
    hints_used INTEGER := 0;
BEGIN
    -- Extract engagement data if available
    IF NEW.engagement_data IS NOT NULL THEN
        hints_used := COALESCE((NEW.engagement_data->>'help_requests')::INTEGER, 0);
    END IF;
    
    -- Calculate XP for the session
    calculated_xp := calculate_xp_for_session(
        NEW.score,
        EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60, -- duration in minutes
        5, -- default difficulty
        hints_used,
        NEW.completed_at IS NOT NULL -- completion bonus if completed
    );
    
    NEW.xp_earned := calculated_xp;
    
    -- Update user analytics if session is completed
    IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
        PERFORM update_user_analytics_after_session(
            NEW.user_id,
            NEW.id,
            NEW.score,
            EXTRACT(EPOCH FROM (NEW.completed_at - NEW.started_at)) / 60,
            calculated_xp,
            CASE WHEN NEW.skills_practiced IS NOT NULL 
                 THEN ARRAY(SELECT jsonb_array_elements_text(NEW.skills_practiced))
                 ELSE ARRAY[]::TEXT[]
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to exam_sessions if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_sessions') THEN
        DROP TRIGGER IF EXISTS auto_calculate_session_xp_trigger ON exam_sessions;
        CREATE TRIGGER auto_calculate_session_xp_trigger
            BEFORE UPDATE ON exam_sessions
            FOR EACH ROW
            WHEN (NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL)
            EXECUTE FUNCTION auto_calculate_session_xp();
    END IF;
END $$;

-- Create materialized view for leaderboard performance
CREATE MATERIALIZED VIEW user_leaderboard_stats AS
SELECT 
    ua.user_id,
    up.full_name,
    (ua.achievements->>'total_xp')::INTEGER as total_xp,
    (ua.achievements->>'current_level')::INTEGER as current_level,
    (ua.engagement->>'current_streak')::INTEGER as current_streak,
    (ua.engagement->>'longest_streak')::INTEGER as longest_streak,
    (ua.engagement->>'total_study_minutes')::INTEGER as total_study_minutes,
    ua.updated_at
FROM user_analytics ua
JOIN user_profiles up ON ua.user_id = up.id
WHERE up.gamification_enabled = true;

-- Create index on materialized view
CREATE UNIQUE INDEX idx_leaderboard_user_id ON user_leaderboard_stats(user_id);
CREATE INDEX idx_leaderboard_xp ON user_leaderboard_stats(total_xp DESC);
CREATE INDEX idx_leaderboard_level ON user_leaderboard_stats(current_level DESC);
CREATE INDEX idx_leaderboard_streak ON user_leaderboard_stats(current_streak DESC);

-- Create function to refresh leaderboard stats
CREATE OR REPLACE FUNCTION refresh_leaderboard_stats()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_leaderboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Schedule leaderboard refresh (requires pg_cron extension in production)
-- SELECT cron.schedule('refresh-leaderboard', '*/15 * * * *', 'SELECT refresh_leaderboard_stats();');

COMMENT ON TABLE user_analytics IS 'Enhanced analytics for dashboard personalization and gamification';
COMMENT ON TABLE dashboard_widgets IS 'Configurable dashboard widget definitions';
COMMENT ON TABLE user_widget_preferences IS 'User-specific widget positioning and settings';
COMMENT ON TABLE user_progress_visualizations IS 'Custom progress charts and visualizations';
COMMENT ON FUNCTION calculate_xp_for_session IS 'Calculates XP earned for an exam session based on performance metrics';
COMMENT ON FUNCTION update_user_analytics_after_session IS 'Updates user analytics data after completing an exam session';
COMMENT ON FUNCTION get_user_dashboard_data IS 'Efficiently retrieves all dashboard data for a user in a single query';
COMMENT ON MATERIALIZED VIEW user_leaderboard_stats IS 'Optimized leaderboard data for competitive features';