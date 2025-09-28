-- Migration: Scoring Engine Implementation
-- Creates the complete database schema for the NeoLingus scoring engine
-- Date: 2025-09-22

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- 1. SCORING RUBRICS TABLE
-- Stores versioned scoring rubrics for different providers and tasks
CREATE TABLE scoring_rubrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL CHECK (provider IN ('EOI', 'JQCV', 'Cambridge', 'Cervantes')),
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    task TEXT NOT NULL CHECK (task IN ('reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation')),
    version TEXT NOT NULL,
    json JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    archived_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure unique combination of provider, level, task, and version
    CONSTRAINT uq_scoring_rubrics_version UNIQUE (provider, level, task, version)
);

-- 2. SCORING ATTEMPTS TABLE
-- Records of individual scoring attempts with their payloads and results
CREATE TABLE scoring_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    user_id UUID NULL,
    exam_session_id UUID NULL,
    exam_id TEXT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('EOI', 'JQCV', 'Cambridge', 'Cervantes')),
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    task TEXT NOT NULL CHECK (task IN ('reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation')),
    payload JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'scored', 'failed')),
    rubric_id UUID NOT NULL,
    rubric_ver TEXT NOT NULL,
    model_name TEXT NOT NULL,
    committee JSONB DEFAULT '[]',
    score_json JSONB NULL,
    qc_json JSONB NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key to scoring rubrics
    CONSTRAINT fk_scoring_attempts_rubric_id FOREIGN KEY (rubric_id) REFERENCES scoring_rubrics(id),
    -- Optional foreign key to exam sessions (if table exists)
    CONSTRAINT fk_scoring_attempts_exam_session_id FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL
);

-- 3. SCORING ATTEMPT EVENTS TABLE
-- Immutable audit log for all scoring attempt state transitions
CREATE TABLE scoring_attempt_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('created', 'queued', 'started', 'scored', 'failed', 're_scored', 'appeal')),
    data JSONB NOT NULL DEFAULT '{}',
    at TIMESTAMPTZ DEFAULT NOW(),

    -- Foreign key to scoring attempts with cascade delete
    CONSTRAINT fk_scoring_attempt_events_attempt_id FOREIGN KEY (attempt_id) REFERENCES scoring_attempts(id) ON DELETE CASCADE
);

-- 4. SCORING CORRECTORS TABLE
-- Configuration profiles for automated scoring with model committees
CREATE TABLE scoring_correctors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    provider TEXT NOT NULL CHECK (provider IN ('EOI', 'JQCV', 'Cambridge', 'Cervantes')),
    level TEXT NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    task TEXT NOT NULL CHECK (task IN ('reading', 'listening', 'use_of_english', 'writing', 'speaking', 'mediation')),
    committee JSONB NOT NULL DEFAULT '[]',
    model_config JSONB NOT NULL DEFAULT '{}',
    prompt_version TEXT NOT NULL DEFAULT 'PROMPT_WR_v1',
    rubric_id UUID NULL,
    active BOOLEAN DEFAULT true,
    created_by UUID NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique combination of provider, level, task, and name
    CONSTRAINT uq_scoring_correctors_name UNIQUE (provider, level, task, name),
    -- Optional foreign key to scoring rubrics for override
    CONSTRAINT fk_scoring_correctors_rubric_id FOREIGN KEY (rubric_id) REFERENCES scoring_rubrics(id) ON DELETE SET NULL
    -- Note: created_by references admin_users(id) - constraint added if table exists
);

-- 5. SCORING WEBHOOKS TABLE
-- Webhook registrations for external systems
CREATE TABLE scoring_webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL DEFAULT ARRAY['attempt.scored'],
    secret TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SCORING SETTINGS TABLE
-- Tenant-specific configuration for scoring behavior
CREATE TABLE scoring_settings (
    tenant_id TEXT PRIMARY KEY,
    defaults JSONB NOT NULL DEFAULT '{}',
    weights JSONB NOT NULL DEFAULT '{}',
    equivalences JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE OPTIMIZATION

-- Primary lookup patterns for scoring attempts
CREATE INDEX idx_sc_attempts_status ON scoring_attempts(status);
CREATE INDEX idx_sc_attempts_plt ON scoring_attempts(provider, level, task);
CREATE INDEX idx_sc_attempts_created ON scoring_attempts(created_at);
CREATE INDEX idx_sc_attempts_session ON scoring_attempts(exam_session_id);
CREATE INDEX idx_sc_attempts_tenant ON scoring_attempts(tenant_id);

-- Rubric management indexes
CREATE INDEX idx_sc_rubrics_active ON scoring_rubrics(provider, level, task) WHERE is_active = true;
CREATE INDEX idx_sc_rubrics_version ON scoring_rubrics(version);

-- Event auditing indexes
CREATE INDEX idx_sc_events_attempt_time ON scoring_attempt_events(attempt_id, at);
CREATE INDEX idx_sc_events_type ON scoring_attempt_events(type, at);

-- Corrector management indexes
CREATE INDEX idx_sc_correctors_active ON scoring_correctors(provider, level, task, active);

-- Webhook indexes
CREATE INDEX idx_sc_webhooks_tenant ON scoring_webhooks(tenant_id);
CREATE INDEX idx_sc_webhooks_active ON scoring_webhooks(active);

-- TRIGGERS FOR AUTOMATIC TIMESTAMPS

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_scoring_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers to relevant tables
CREATE TRIGGER trigger_scoring_rubrics_updated_at
    BEFORE UPDATE ON scoring_rubrics
    FOR EACH ROW EXECUTE FUNCTION update_scoring_timestamp();

CREATE TRIGGER trigger_scoring_attempts_updated_at
    BEFORE UPDATE ON scoring_attempts
    FOR EACH ROW EXECUTE FUNCTION update_scoring_timestamp();

CREATE TRIGGER trigger_scoring_correctors_updated_at
    BEFORE UPDATE ON scoring_correctors
    FOR EACH ROW EXECUTE FUNCTION update_scoring_timestamp();

CREATE TRIGGER trigger_scoring_settings_updated_at
    BEFORE UPDATE ON scoring_settings
    FOR EACH ROW EXECUTE FUNCTION update_scoring_timestamp();

-- AUDIT TRIGGER FOR SCORING ATTEMPTS

-- Function to automatically create audit events
CREATE OR REPLACE FUNCTION scoring_attempt_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert audit event for status changes
    IF TG_OP = 'INSERT' THEN
        INSERT INTO scoring_attempt_events (attempt_id, type, data)
        VALUES (NEW.id, 'created', jsonb_build_object(
            'status', NEW.status,
            'tenant_id', NEW.tenant_id,
            'provider', NEW.provider,
            'level', NEW.level,
            'task', NEW.task
        ));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log status changes
        IF OLD.status != NEW.status THEN
            INSERT INTO scoring_attempt_events (attempt_id, type, data)
            VALUES (NEW.id,
                CASE NEW.status
                    WHEN 'processing' THEN 'started'
                    WHEN 'scored' THEN 'scored'
                    WHEN 'failed' THEN 'failed'
                    ELSE 'status_changed'
                END,
                jsonb_build_object(
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'model_name', NEW.model_name
                )
            );
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to scoring attempts
CREATE TRIGGER trigger_scoring_attempt_audit
    AFTER INSERT OR UPDATE ON scoring_attempts
    FOR EACH ROW EXECUTE FUNCTION scoring_attempt_audit_trigger();

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all scoring tables
ALTER TABLE scoring_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_attempt_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_correctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE scoring_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scoring_rubrics (public read, admin write)
CREATE POLICY "scoring_rubrics_select_policy" ON scoring_rubrics
    FOR SELECT USING (true);

CREATE POLICY "scoring_rubrics_admin_policy" ON scoring_rubrics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for scoring_attempts (tenant isolation)
CREATE POLICY "scoring_attempts_tenant_policy" ON scoring_attempts
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant', true)
        OR EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for scoring_attempt_events (follows parent attempt)
CREATE POLICY "scoring_attempt_events_policy" ON scoring_attempt_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM scoring_attempts sa
            WHERE sa.id = attempt_id
            AND (
                sa.tenant_id = current_setting('app.current_tenant', true)
                OR EXISTS (
                    SELECT 1 FROM admin_users
                    WHERE admin_users.id = auth.uid()
                    AND admin_users.role IN ('super_admin', 'admin')
                )
            )
        )
    );

-- RLS Policies for scoring_correctors (admin only)
CREATE POLICY "scoring_correctors_admin_policy" ON scoring_correctors
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for scoring_webhooks (tenant isolation)
CREATE POLICY "scoring_webhooks_tenant_policy" ON scoring_webhooks
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant', true)
        OR EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- RLS Policies for scoring_settings (tenant isolation)
CREATE POLICY "scoring_settings_tenant_policy" ON scoring_settings
    FOR ALL USING (
        tenant_id = current_setting('app.current_tenant', true)
        OR EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.id = auth.uid()
            AND admin_users.role IN ('super_admin', 'admin')
        )
    );

-- HELPER FUNCTIONS

-- Function to get active rubric for provider/level/task combination
CREATE OR REPLACE FUNCTION get_active_rubric(
    p_provider TEXT,
    p_level TEXT,
    p_task TEXT
)
RETURNS TABLE (
    id UUID,
    version TEXT,
    json JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT sr.id, sr.version, sr.json
    FROM scoring_rubrics sr
    WHERE sr.provider = p_provider
      AND sr.level = p_level
      AND sr.task = p_task
      AND sr.is_active = true
    ORDER BY sr.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create scoring attempt with automatic event logging
CREATE OR REPLACE FUNCTION create_scoring_attempt(
    p_tenant_id TEXT,
    p_user_id UUID,
    p_exam_session_id UUID,
    p_exam_id TEXT,
    p_provider TEXT,
    p_level TEXT,
    p_task TEXT,
    p_payload JSONB,
    p_model_name TEXT DEFAULT 'gpt-4o-mini'
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
    v_rubric_id UUID;
    v_rubric_version TEXT;
BEGIN
    -- Get active rubric
    SELECT id, version INTO v_rubric_id, v_rubric_version
    FROM get_active_rubric(p_provider, p_level, p_task);

    IF v_rubric_id IS NULL THEN
        RAISE EXCEPTION 'No active rubric found for provider=%, level=%, task=%',
            p_provider, p_level, p_task;
    END IF;

    -- Create scoring attempt
    INSERT INTO scoring_attempts (
        tenant_id, user_id, exam_session_id, exam_id,
        provider, level, task, payload,
        rubric_id, rubric_ver, model_name
    ) VALUES (
        p_tenant_id, p_user_id, p_exam_session_id, p_exam_id,
        p_provider, p_level, p_task, p_payload,
        v_rubric_id, v_rubric_version, p_model_name
    ) RETURNING id INTO v_attempt_id;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE scoring_rubrics IS 'Versioned scoring rubrics for different certification providers and skill types';
COMMENT ON TABLE scoring_attempts IS 'Individual scoring attempts with payloads and results';
COMMENT ON TABLE scoring_attempt_events IS 'Immutable audit log for scoring attempt state transitions';
COMMENT ON TABLE scoring_correctors IS 'Configuration profiles for automated scoring with AI model committees';
COMMENT ON TABLE scoring_webhooks IS 'Webhook registrations for external system notifications';
COMMENT ON TABLE scoring_settings IS 'Tenant-specific configuration for scoring behavior and defaults';

-- Grant permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;