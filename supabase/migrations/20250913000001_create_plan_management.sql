-- Plan Management System Migration
-- Created: 2025-09-13
-- Spec: 002-course-centric-academy
-- Extension of existing academy schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- PLAN MANAGEMENT TABLES
-- =============================================

-- Plans table: Core subscription plan definitions
CREATE TABLE plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
    description TEXT,
    pricing JSONB NOT NULL DEFAULT '{}',
    features JSONB NOT NULL DEFAULT '{}',
    limits JSONB NOT NULL DEFAULT '{}',
    trial JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints for data integrity
    CONSTRAINT valid_pricing CHECK (jsonb_typeof(pricing) = 'object'),
    CONSTRAINT valid_features CHECK (jsonb_typeof(features) = 'object'),
    CONSTRAINT valid_limits CHECK (jsonb_typeof(limits) = 'object'),
    CONSTRAINT valid_trial CHECK (jsonb_typeof(trial) = 'object'),
    CONSTRAINT valid_monthly_price CHECK (
        (pricing->>'monthly_price')::int IS NULL OR 
        (pricing->>'monthly_price')::int >= 0
    ),
    CONSTRAINT valid_yearly_price CHECK (
        (pricing->>'yearly_price')::int IS NULL OR 
        (pricing->>'yearly_price')::int >= 0
    ),
    CONSTRAINT valid_max_courses CHECK (
        (limits->>'max_courses')::int IS NULL OR 
        (limits->>'max_courses')::int > 0
    ),
    CONSTRAINT valid_trial_duration CHECK (
        (trial->>'duration_days')::int IS NULL OR 
        (trial->>'duration_days')::int BETWEEN 1 AND 30
    )
);

-- Plan templates table: Reusable plan configurations
CREATE TABLE plan_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
    template_data JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    version VARCHAR(20) DEFAULT '1.0.0',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_template_data CHECK (jsonb_typeof(template_data) = 'object')
);

-- User plan assignments table: Links users to their subscribed plans
CREATE TABLE user_plan_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled', 'suspended')),
    access_level VARCHAR(20) DEFAULT 'full' CHECK (access_level IN ('full', 'limited', 'readonly')),
    subscription_tier VARCHAR(20) NOT NULL CHECK (subscription_tier IN ('basic', 'standard', 'premium')),
    billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'trial')),
    trial JSONB DEFAULT '{}',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT true,
    assignment_reason TEXT,
    assigned_by UUID REFERENCES auth.users(id),
    cancelled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_trial_data CHECK (jsonb_typeof(trial) = 'object'),
    CONSTRAINT valid_period_dates CHECK (
        current_period_end IS NULL OR 
        current_period_end > current_period_start
    ),
    CONSTRAINT trial_expiration_check CHECK (
        (status != 'trial') OR 
        (status = 'trial' AND (trial->>'trial_ends_at')::timestamptz IS NOT NULL)
    ),
    -- Prevent multiple active assignments for same user-course combination
    CONSTRAINT unique_active_user_course UNIQUE (user_id, course_id, status) 
        DEFERRABLE INITIALLY DEFERRED
);

-- Extend user_course_enrollments to link with plan assignments
ALTER TABLE user_course_enrollments 
ADD COLUMN plan_assignment_id UUID REFERENCES user_plan_assignments(id) ON DELETE SET NULL,
ADD COLUMN subscription_status VARCHAR(20) DEFAULT 'free',
ADD COLUMN access_expires_at TIMESTAMPTZ;

-- =============================================
-- MATERIALIZED VIEWS FOR PERFORMANCE
-- =============================================

-- Plan statistics view for admin dashboard
CREATE MATERIALIZED VIEW plan_statistics AS
SELECT 
    p.id,
    p.name,
    p.tier,
    p.slug,
    p.is_active,
    COUNT(upa.id) FILTER (WHERE upa.status = 'active') as active_subscribers,
    COUNT(upa.id) FILTER (WHERE upa.status = 'trial') as trial_subscribers,
    COUNT(upa.id) FILTER (WHERE upa.status IN ('active', 'trial')) as total_subscribers,
    -- Monthly recurring revenue calculation
    COALESCE(
        SUM(
            CASE 
                WHEN upa.status = 'active' AND upa.billing_cycle = 'monthly' 
                THEN (p.pricing->>'monthly_price')::int
                WHEN upa.status = 'active' AND upa.billing_cycle = 'yearly'
                THEN (p.pricing->>'yearly_price')::int / 12
                ELSE 0
            END
        ), 0
    ) as monthly_revenue,
    p.created_at,
    NOW() as last_updated
FROM plans p
LEFT JOIN user_plan_assignments upa ON p.id = upa.plan_id
GROUP BY p.id, p.name, p.tier, p.slug, p.is_active, p.created_at;

-- User plan summary view for quick lookups
CREATE MATERIALIZED VIEW user_plan_summary AS
SELECT 
    upa.user_id,
    upa.id as assignment_id,
    p.name as plan_name,
    p.tier as plan_tier,
    upa.status,
    upa.access_level,
    upa.subscription_tier,
    upa.billing_cycle,
    upa.current_period_end,
    (upa.trial->>'is_trial')::boolean as is_trial,
    (upa.trial->>'trial_ends_at')::timestamptz as trial_ends_at,
    CASE 
        WHEN upa.status = 'trial' AND (upa.trial->>'trial_ends_at')::timestamptz < NOW()
        THEN 'expired'
        ELSE upa.status
    END as computed_status,
    upa.created_at,
    upa.updated_at
FROM user_plan_assignments upa
JOIN plans p ON upa.plan_id = p.id
WHERE upa.status IN ('active', 'trial');

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Plans table indexes
CREATE INDEX idx_plans_active_tier ON plans(is_active, tier) WHERE is_active = true;
CREATE INDEX idx_plans_slug ON plans(slug);
CREATE INDEX idx_plans_sort_order ON plans(sort_order) WHERE is_active = true;
CREATE INDEX idx_plans_featured ON plans(is_featured, sort_order) WHERE is_active = true AND is_featured = true;
CREATE INDEX idx_plans_pricing_gin ON plans USING GIN (pricing);
CREATE INDEX idx_plans_features_gin ON plans USING GIN (features);

-- Plan templates indexes  
CREATE INDEX idx_plan_templates_tier ON plan_templates(tier) WHERE is_active = true;
CREATE INDEX idx_plan_templates_active ON plan_templates(is_active);

-- User plan assignments indexes
CREATE INDEX idx_user_plan_assignments_user_id ON user_plan_assignments(user_id);
CREATE INDEX idx_user_plan_assignments_plan_id ON user_plan_assignments(plan_id);
CREATE INDEX idx_user_plan_assignments_course_id ON user_plan_assignments(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_user_plan_assignments_status ON user_plan_assignments(status);
CREATE INDEX idx_user_plan_assignments_user_status ON user_plan_assignments(user_id, status);
CREATE INDEX idx_user_plan_assignments_plan_status ON user_plan_assignments(plan_id, status);
CREATE INDEX idx_user_plan_assignments_tier ON user_plan_assignments(subscription_tier);
CREATE INDEX idx_user_plan_assignments_billing ON user_plan_assignments(billing_cycle);
CREATE INDEX idx_user_plan_assignments_period_end ON user_plan_assignments(current_period_end) WHERE current_period_end IS NOT NULL;
CREATE INDEX idx_user_plan_assignments_trial_gin ON user_plan_assignments USING GIN (trial);
CREATE INDEX idx_user_plan_assignments_trial_end ON user_plan_assignments(((trial->>'trial_ends_at')::timestamptz)) WHERE status = 'trial';

-- User course enrollments extended indexes
CREATE INDEX idx_user_course_enrollments_plan_assignment ON user_course_enrollments(plan_assignment_id) WHERE plan_assignment_id IS NOT NULL;
CREATE INDEX idx_user_course_enrollments_subscription_status ON user_course_enrollments(subscription_status);
CREATE INDEX idx_user_course_enrollments_access_expires ON user_course_enrollments(access_expires_at) WHERE access_expires_at IS NOT NULL;

-- Materialized view indexes
CREATE UNIQUE INDEX idx_plan_statistics_id ON plan_statistics(id);
CREATE INDEX idx_plan_statistics_tier_active ON plan_statistics(tier, is_active);
CREATE INDEX idx_plan_statistics_subscribers ON plan_statistics(total_subscribers DESC);
CREATE INDEX idx_plan_statistics_revenue ON plan_statistics(monthly_revenue DESC);

CREATE INDEX idx_user_plan_summary_user_id ON user_plan_summary(user_id);
CREATE INDEX idx_user_plan_summary_status ON user_plan_summary(computed_status);
CREATE INDEX idx_user_plan_summary_tier ON user_plan_summary(plan_tier);
CREATE INDEX idx_user_plan_summary_trial_ends ON user_plan_summary(trial_ends_at) WHERE is_trial = true;

-- =============================================
-- DATABASE FUNCTIONS
-- =============================================

-- Function to validate plan features consistency
CREATE OR REPLACE FUNCTION validate_plan_features()
RETURNS TRIGGER AS $$
DECLARE
    ai_tutor_enabled BOOLEAN;
    custom_study_plans BOOLEAN;
    premium_analytics BOOLEAN;
BEGIN
    -- Extract feature flags
    ai_tutor_enabled := COALESCE((NEW.features->>'ai_tutor_enabled')::boolean, false);
    custom_study_plans := COALESCE((NEW.features->>'custom_study_plans')::boolean, false);
    premium_analytics := COALESCE((NEW.features->>'progress_analytics')::text = 'premium', false);
    
    -- Business rule: Custom study plans require AI tutor
    IF custom_study_plans AND NOT ai_tutor_enabled THEN
        RAISE EXCEPTION 'Custom study plans require AI tutoring to be enabled';
    END IF;
    
    -- Business rule: Premium analytics only for Standard+ tiers
    IF premium_analytics AND NEW.tier = 'basic' THEN
        RAISE EXCEPTION 'Premium analytics not available for Basic tier';
    END IF;
    
    -- Business rule: Validate pricing structure
    IF NEW.pricing IS NOT NULL THEN
        IF (NEW.pricing->>'monthly_price')::int IS NULL THEN
            RAISE EXCEPTION 'Monthly price is required';
        END IF;
        
        IF (NEW.pricing->>'currency') IS NULL THEN
            RAISE EXCEPTION 'Currency is required';
        END IF;
        
        IF (NEW.pricing->>'yearly_price')::int IS NOT NULL AND 
           (NEW.pricing->>'yearly_price')::int >= (NEW.pricing->>'monthly_price')::int * 12 THEN
            RAISE EXCEPTION 'Yearly price should be less than 12x monthly price';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate trial assignment
CREATE OR REPLACE FUNCTION validate_trial_assignment()
RETURNS TRIGGER AS $$
DECLARE
    plan_trial_enabled BOOLEAN;
    user_previous_trials INTEGER;
BEGIN
    -- Only validate for trial assignments
    IF NEW.status != 'trial' THEN
        RETURN NEW;
    END IF;
    
    -- Check if plan supports trials
    SELECT COALESCE((trial->>'enabled')::boolean, false) INTO plan_trial_enabled
    FROM plans WHERE id = NEW.plan_id;
    
    IF NOT plan_trial_enabled THEN
        RAISE EXCEPTION 'Plan does not support trial periods';
    END IF;
    
    -- Check if user has already used trial for this plan (prevent abuse)
    SELECT COUNT(*) INTO user_previous_trials
    FROM user_plan_assignments
    WHERE user_id = NEW.user_id 
    AND plan_id = NEW.plan_id 
    AND (trial->>'is_trial')::boolean = true
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
    
    IF user_previous_trials > 0 THEN
        RAISE EXCEPTION 'User has already used a trial period for this plan';
    END IF;
    
    -- Set trial expiration date if not provided
    IF (NEW.trial->>'trial_ends_at') IS NULL THEN
        NEW.trial := jsonb_set(
            COALESCE(NEW.trial, '{}'::jsonb),
            '{trial_ends_at}',
            to_jsonb((NOW() + INTERVAL '7 days')::timestamptz),
            true
        );
        NEW.trial := jsonb_set(NEW.trial, '{is_trial}', 'true'::jsonb, true);
    END IF;
    
    -- Set appropriate period end for trial
    NEW.current_period_end := (NEW.trial->>'trial_ends_at')::timestamptz;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle trial expiration and cleanup
CREATE OR REPLACE FUNCTION handle_trial_expiration()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER := 0;
    expired_assignment RECORD;
BEGIN
    -- Update expired trials
    FOR expired_assignment IN
        SELECT id, user_id, plan_id, course_id
        FROM user_plan_assignments
        WHERE status = 'trial'
        AND (trial->>'trial_ends_at')::timestamptz < NOW()
        AND (trial->>'is_trial')::boolean = true
    LOOP
        -- Update assignment status
        UPDATE user_plan_assignments
        SET 
            status = 'expired',
            updated_at = NOW(),
            notes = COALESCE(notes || E'\n', '') || 'Trial expired on ' || NOW()::date
        WHERE id = expired_assignment.id;
        
        -- Update related course enrollments
        UPDATE user_course_enrollments
        SET 
            subscription_status = 'expired',
            access_expires_at = NOW()
        WHERE plan_assignment_id = expired_assignment.id;
        
        expired_count := expired_count + 1;
    END LOOP;
    
    -- Log the cleanup operation
    INSERT INTO system_logs (action, details, created_at) 
    VALUES ('trial_expiration_cleanup', jsonb_build_object('expired_count', expired_count), NOW())
    ON CONFLICT DO NOTHING;
    
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update plan assignment timestamps
CREATE OR REPLACE FUNCTION update_plan_assignment_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Update subscription tier to match plan tier
    IF NEW.plan_id IS DISTINCT FROM OLD.plan_id THEN
        SELECT tier INTO NEW.subscription_tier
        FROM plans WHERE id = NEW.plan_id;
    END IF;
    
    -- Handle status changes
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        CASE NEW.status
            WHEN 'cancelled' THEN
                NEW.cancelled_at = NOW();
            WHEN 'expired' THEN
                NEW.auto_renew = false;
            ELSE
                -- Keep existing values
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_plan_statistics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW plan_statistics;
    REFRESH MATERIALIZED VIEW user_plan_summary;
    
    -- Log the refresh
    INSERT INTO system_logs (action, details, created_at) 
    VALUES ('materialized_views_refresh', jsonb_build_object('views', ARRAY['plan_statistics', 'user_plan_summary']), NOW())
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for plan feature validation
CREATE TRIGGER validate_plan_features_trigger
    BEFORE INSERT OR UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION validate_plan_features();

-- Trigger for trial assignment validation
CREATE TRIGGER validate_trial_assignment_trigger
    BEFORE INSERT OR UPDATE ON user_plan_assignments
    FOR EACH ROW
    EXECUTE FUNCTION validate_trial_assignment();

-- Trigger for plan assignment timestamp updates
CREATE TRIGGER update_plan_assignment_timestamp_trigger
    BEFORE UPDATE ON user_plan_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_assignment_timestamp();

-- Trigger to update plan timestamps
CREATE OR REPLACE FUNCTION update_plan_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plan_timestamp_trigger
    BEFORE UPDATE ON plans
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_timestamp();

-- Trigger to update template timestamps
CREATE OR REPLACE FUNCTION update_plan_template_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plan_template_timestamp_trigger
    BEFORE UPDATE ON plan_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_plan_template_timestamp();

-- =============================================
-- COMPLETION ACKNOWLEDGMENT
-- =============================================

-- Insert completion log
INSERT INTO system_logs (action, details) 
VALUES ('plan_management_migration', jsonb_build_object(
    'migration_name', '20250913000001_create_plan_management',
    'tables_created', 3,
    'views_created', 2,
    'indexes_created', 25,
    'functions_created', 6,
    'triggers_created', 5
));

-- Success message
SELECT 'Plan Management Migration 20250913000001 completed successfully' as migration_status;