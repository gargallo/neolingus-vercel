-- Swipe de la Norma Game System Database Schema
-- Date: 2025-09-24
-- Description: Complete database schema for the swipe-based language normalization game

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- SWIPE ITEMS TABLE
-- =============================================================================
-- Stores individual language items (words/expressions) with exam safety rules
CREATE TABLE swipe_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    term TEXT NOT NULL,
    lemma TEXT,
    lang TEXT NOT NULL CHECK (lang IN ('es', 'val', 'en')),
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    exam TEXT NOT NULL CHECK (exam IN ('EOI', 'Cambridge', 'DELE', 'JQCV')),
    skill_scope TEXT[] NOT NULL DEFAULT '{}',
    tags JSONB DEFAULT '[]'::JSONB,
    exam_safe BOOLEAN NOT NULL,
    example TEXT,
    explanation_short TEXT,
    suggested TEXT,
    rule_overrides JSONB DEFAULT '[]'::JSONB,
    difficulty_elo INTEGER DEFAULT 1500,
    content_version TEXT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SWIPE SESSIONS TABLE
-- =============================================================================
-- Tracks individual game sessions with configuration and results
CREATE TABLE swipe_sessions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    user_id TEXT NOT NULL,
    config JSONB NOT NULL,
    duration_s INTEGER NOT NULL CHECK (duration_s IN (20, 30, 60, 120)),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    score_total NUMERIC,
    answers_total INTEGER,
    correct INTEGER,
    incorrect INTEGER,
    accuracy_pct NUMERIC,
    items_per_min NUMERIC,
    streak_max INTEGER,
    avg_latency_ms INTEGER,
    error_buckets JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SWIPE ANSWERS TABLE
-- =============================================================================
-- Individual answer events with timing and correctness tracking
CREATE TABLE swipe_answers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    session_id TEXT NOT NULL REFERENCES swipe_sessions(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    item_id TEXT NOT NULL REFERENCES swipe_items(id),
    user_choice TEXT NOT NULL CHECK (user_choice IN ('apta', 'no_apta')),
    correct BOOLEAN NOT NULL,
    score_delta NUMERIC NOT NULL,
    latency_ms INTEGER NOT NULL,
    input_method TEXT CHECK (input_method IN ('keyboard', 'mouse', 'touch')),
    shown_at TIMESTAMPTZ NOT NULL,
    answered_at TIMESTAMPTZ NOT NULL,
    item_difficulty INTEGER,
    app_version TEXT,
    content_version TEXT,
    suspicious BOOLEAN DEFAULT FALSE,
    tags JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SWIPE USER SKILL TABLE
-- =============================================================================
-- ELO ratings per user for different skill categories
CREATE TABLE swipe_user_skill (
    user_id TEXT NOT NULL,
    lang TEXT NOT NULL,
    exam TEXT NOT NULL,
    skill TEXT NOT NULL,
    tag TEXT NOT NULL,
    rating_elo INTEGER NOT NULL DEFAULT 1500,
    rd REAL DEFAULT 350.0,
    last_update TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, lang, exam, skill, tag)
);

-- =============================================================================
-- SWIPE ITEM STATS TABLE
-- =============================================================================
-- Aggregate statistics per item for difficulty calibration
CREATE TABLE swipe_item_stats (
    item_id TEXT PRIMARY KEY REFERENCES swipe_items(id),
    plays INTEGER DEFAULT 0,
    correct INTEGER DEFAULT 0,
    incorrect INTEGER DEFAULT 0,
    avg_latency_ms INTEGER DEFAULT 0,
    difficulty_elo INTEGER DEFAULT 1500,
    last_played TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Swipe items indexes
CREATE INDEX idx_swipe_items_lang_exam_skill ON swipe_items(lang, exam, skill_scope);
CREATE INDEX idx_swipe_items_active_difficulty ON swipe_items(active, difficulty_elo) WHERE active = TRUE;
CREATE INDEX idx_swipe_items_tags ON swipe_items USING GIN(tags);
CREATE INDEX idx_swipe_items_content_version ON swipe_items(content_version);

-- Swipe sessions indexes
CREATE INDEX idx_swipe_sessions_user_id ON swipe_sessions(user_id);
CREATE INDEX idx_swipe_sessions_started_at ON swipe_sessions(started_at);
CREATE INDEX idx_swipe_sessions_config ON swipe_sessions USING GIN(config);

-- Swipe answers indexes
CREATE INDEX idx_swipe_answers_session_id ON swipe_answers(session_id);
CREATE INDEX idx_swipe_answers_user_item ON swipe_answers(user_id, item_id);
CREATE INDEX idx_swipe_answers_answered_at ON swipe_answers(answered_at);
CREATE INDEX idx_swipe_answers_latency ON swipe_answers(latency_ms);
CREATE INDEX idx_swipe_answers_tags ON swipe_answers USING GIN(tags);

-- Swipe user skill indexes
CREATE INDEX idx_swipe_user_skill_user_lang ON swipe_user_skill(user_id, lang);
CREATE INDEX idx_swipe_user_skill_rating ON swipe_user_skill(rating_elo);
CREATE INDEX idx_swipe_user_skill_last_update ON swipe_user_skill(last_update);

-- Swipe item stats indexes
CREATE INDEX idx_swipe_item_stats_plays ON swipe_item_stats(plays);
CREATE INDEX idx_swipe_item_stats_difficulty ON swipe_item_stats(difficulty_elo);
CREATE INDEX idx_swipe_item_stats_last_played ON swipe_item_stats(last_played);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_swipe_items_updated_at BEFORE UPDATE ON swipe_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swipe_sessions_updated_at BEFORE UPDATE ON swipe_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_swipe_item_stats_updated_at BEFORE UPDATE ON swipe_item_stats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- FUNCTIONS FOR GAME LOGIC
-- =============================================================================

-- Function to get deck of items based on user preferences and difficulty
CREATE OR REPLACE FUNCTION get_swipe_deck(
    p_user_id TEXT,
    p_lang TEXT,
    p_level TEXT,
    p_exam TEXT,
    p_skill TEXT,
    p_size INTEGER DEFAULT 50
)
RETURNS TABLE (
    item_id TEXT,
    term TEXT,
    example TEXT,
    difficulty_elo INTEGER,
    tags JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        si.id,
        si.term,
        si.example,
        si.difficulty_elo,
        si.tags
    FROM swipe_items si
    LEFT JOIN swipe_item_stats sis ON si.id = sis.item_id
    WHERE si.active = TRUE
        AND si.lang = p_lang
        AND si.level = p_level
        AND si.exam = p_exam
        AND p_skill = ANY(si.skill_scope)
    ORDER BY
        RANDOM(),  -- Randomize selection
        ABS(si.difficulty_elo - 1500)  -- Prefer items near default difficulty
    LIMIT p_size;
END;
$$ LANGUAGE plpgsql;

-- Function to update ELO ratings after an answer
CREATE OR REPLACE FUNCTION update_elo_ratings(
    p_user_id TEXT,
    p_item_id TEXT,
    p_correct BOOLEAN,
    p_k_factor INTEGER DEFAULT 20
)
RETURNS VOID AS $$
DECLARE
    v_user_rating INTEGER;
    v_item_rating INTEGER;
    v_expected_score REAL;
    v_actual_score INTEGER;
    v_user_delta INTEGER;
    v_item_delta INTEGER;
BEGIN
    -- Get current ratings (default to 1500 if not found)
    SELECT COALESCE(rating_elo, 1500) INTO v_user_rating
    FROM swipe_user_skill
    WHERE user_id = p_user_id
    LIMIT 1;

    SELECT COALESCE(difficulty_elo, 1500) INTO v_item_rating
    FROM swipe_items
    WHERE id = p_item_id;

    -- Calculate expected score using ELO formula
    v_expected_score := 1.0 / (1.0 + POWER(10.0, (v_item_rating - v_user_rating) / 400.0));

    -- Actual score (1 for correct, 0 for incorrect)
    v_actual_score := CASE WHEN p_correct THEN 1 ELSE 0 END;

    -- Calculate rating changes
    v_user_delta := ROUND(p_k_factor * (v_actual_score - v_expected_score));
    v_item_delta := ROUND(p_k_factor * ((1 - v_actual_score) - (1 - v_expected_score)));

    -- Update user rating (create if not exists)
    INSERT INTO swipe_user_skill (user_id, lang, exam, skill, tag, rating_elo, last_update)
    VALUES (p_user_id, 'general', 'general', 'general', 'general', 1500 + v_user_delta, NOW())
    ON CONFLICT (user_id, lang, exam, skill, tag)
    DO UPDATE SET
        rating_elo = swipe_user_skill.rating_elo + v_user_delta,
        last_update = NOW();

    -- Update item difficulty
    UPDATE swipe_items
    SET difficulty_elo = difficulty_elo + v_item_delta,
        updated_at = NOW()
    WHERE id = p_item_id;

    -- Update item statistics
    INSERT INTO swipe_item_stats (item_id, plays, correct, incorrect, last_played)
    VALUES (p_item_id, 1, v_actual_score, 1 - v_actual_score, NOW())
    ON CONFLICT (item_id)
    DO UPDATE SET
        plays = swipe_item_stats.plays + 1,
        correct = swipe_item_stats.correct + v_actual_score,
        incorrect = swipe_item_stats.incorrect + (1 - v_actual_score),
        last_played = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE swipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_user_skill ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipe_item_stats ENABLE ROW LEVEL SECURITY;

-- Allow read access to swipe_items for authenticated users
CREATE POLICY "Allow read access to swipe items" ON swipe_items
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to read their own sessions
CREATE POLICY "Users can read own sessions" ON swipe_sessions
    FOR SELECT USING (auth.uid()::TEXT = user_id);

-- Allow users to insert their own sessions
CREATE POLICY "Users can insert own sessions" ON swipe_sessions
    FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

-- Allow users to update their own sessions
CREATE POLICY "Users can update own sessions" ON swipe_sessions
    FOR UPDATE USING (auth.uid()::TEXT = user_id);

-- Allow users to read their own answers
CREATE POLICY "Users can read own answers" ON swipe_answers
    FOR SELECT USING (auth.uid()::TEXT = user_id);

-- Allow users to insert their own answers
CREATE POLICY "Users can insert own answers" ON swipe_answers
    FOR INSERT WITH CHECK (auth.uid()::TEXT = user_id);

-- Allow users to read their own skill ratings
CREATE POLICY "Users can read own skills" ON swipe_user_skill
    FOR SELECT USING (auth.uid()::TEXT = user_id);

-- Allow users to update their own skill ratings
CREATE POLICY "Users can update own skills" ON swipe_user_skill
    FOR ALL USING (auth.uid()::TEXT = user_id);

-- Allow read access to item stats for authenticated users
CREATE POLICY "Allow read access to item stats" ON swipe_item_stats
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies for content management
CREATE POLICY "Admin full access to swipe items" ON swipe_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'super_admin')
        )
    );

-- =============================================================================
-- SAMPLE DATA VALIDATION
-- =============================================================================

-- Constraint to ensure valid JSON structure in rule_overrides
ALTER TABLE swipe_items ADD CONSTRAINT valid_rule_overrides
    CHECK (jsonb_typeof(rule_overrides) = 'array');

-- Constraint to ensure valid tags array
ALTER TABLE swipe_items ADD CONSTRAINT valid_tags_array
    CHECK (jsonb_typeof(tags) = 'array');

-- Constraint to ensure valid config JSON in sessions
ALTER TABLE swipe_sessions ADD CONSTRAINT valid_session_config
    CHECK (jsonb_typeof(config) = 'object');

-- Constraint to ensure positive latency
ALTER TABLE swipe_answers ADD CONSTRAINT positive_latency
    CHECK (latency_ms >= 0);

-- Constraint to ensure valid score delta range
ALTER TABLE swipe_answers ADD CONSTRAINT valid_score_delta
    CHECK (score_delta BETWEEN -2.0 AND 2.0);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE swipe_items IS 'Language items for the swipe game with exam safety rules';
COMMENT ON TABLE swipe_sessions IS 'Individual game sessions with timing and scoring';
COMMENT ON TABLE swipe_answers IS 'Individual answers within game sessions';
COMMENT ON TABLE swipe_user_skill IS 'ELO ratings per user for different skill categories';
COMMENT ON TABLE swipe_item_stats IS 'Aggregate statistics for item difficulty calibration';

COMMENT ON FUNCTION get_swipe_deck IS 'Returns a deck of items based on user preferences and adaptive difficulty';
COMMENT ON FUNCTION update_elo_ratings IS 'Updates ELO ratings for both user and item after an answer';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant usage on all sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION get_swipe_deck TO authenticated;
GRANT EXECUTE ON FUNCTION update_elo_ratings TO authenticated;

-- Migration completed successfully
SELECT 'Swipe de la Norma database schema created successfully' AS result;