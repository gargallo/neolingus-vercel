-- Migration: Create admin system tables
-- This extends the existing exam system with admin capabilities

-- Admin users and roles
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'course_manager', 'support')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    UNIQUE(user_id)
);

-- System audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment transactions (extends existing Update.dev integration)
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id TEXT, -- Update.dev subscription ID
    payment_provider TEXT NOT NULL DEFAULT 'update', -- 'update', 'stripe', 'paypal'
    payment_id TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'EUR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Site configuration settings
CREATE TABLE site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    updated_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feature flags for A/B testing and feature rollouts
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    conditions JSONB DEFAULT '{}', -- User segments, percentages, etc.
    created_by UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin notifications and alerts
CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admin_users(id),
    type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX idx_admin_users_role ON admin_users(role);
CREATE INDEX idx_admin_users_active ON admin_users(active);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX idx_site_settings_key ON site_settings(key);
CREATE INDEX idx_site_settings_category ON site_settings(category);
CREATE INDEX idx_feature_flags_flag_key ON feature_flags(flag_key);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
CREATE INDEX idx_admin_notifications_admin_id ON admin_notifications(admin_id);
CREATE INDEX idx_admin_notifications_read ON admin_notifications(read);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Apply updated_at triggers
CREATE TRIGGER update_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin users policies - only super_admins can manage admin users
CREATE POLICY "Super admins can view all admin users" ON admin_users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role = 'super_admin' 
        AND au.active = true
    )
);

CREATE POLICY "Super admins can insert admin users" ON admin_users FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role = 'super_admin' 
        AND au.active = true
    )
);

CREATE POLICY "Super admins can update admin users" ON admin_users FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role = 'super_admin' 
        AND au.active = true
    )
);

-- Audit logs policies - all admins can read, system can insert
CREATE POLICY "Admins can view audit logs" ON audit_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.active = true
    )
);

CREATE POLICY "System can insert audit logs" ON audit_logs FOR INSERT WITH CHECK (true);

-- Payment transactions policies - admins and support can view
CREATE POLICY "Admins can view payment transactions" ON payment_transactions FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin', 'support')
        AND au.active = true
    )
);

-- Site settings policies - admins can manage
CREATE POLICY "Admins can view site settings" ON site_settings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.active = true
    )
);

CREATE POLICY "Admins can manage site settings" ON site_settings FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin')
        AND au.active = true
    )
);

-- Feature flags policies - similar to site settings
CREATE POLICY "Admins can view feature flags" ON feature_flags FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.active = true
    )
);

CREATE POLICY "Admins can manage feature flags" ON feature_flags FOR ALL USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.role IN ('super_admin', 'admin')
        AND au.active = true
    )
);

-- Admin notifications policies - users see their own notifications
CREATE POLICY "Admins can view their notifications" ON admin_notifications FOR SELECT USING (
    admin_id IN (
        SELECT id FROM admin_users WHERE user_id = auth.uid() AND active = true
    )
);

CREATE POLICY "System can create admin notifications" ON admin_notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can update their notifications" ON admin_notifications FOR UPDATE USING (
    admin_id IN (
        SELECT id FROM admin_users WHERE user_id = auth.uid() AND active = true
    )
);

-- Insert initial site settings
INSERT INTO site_settings (key, value, description, category) VALUES
('site_name', '"NeoLingus"', 'Site name displayed in header and metadata', 'general'),
('site_description', '"Plataforma de preparación para exámenes oficiales de idiomas"', 'Site description for SEO', 'general'),
('maintenance_mode', 'false', 'Enable maintenance mode to block user access', 'system'),
('registration_enabled', 'true', 'Allow new user registrations', 'auth'),
('max_concurrent_exams', '3', 'Maximum concurrent exam sessions per user', 'exams'),
('default_exam_time_limit', '7200', 'Default exam time limit in seconds (2 hours)', 'exams'),
('cultural_context_weight', '0.1', 'Weight of cultural context in final scoring', 'scoring'),
('email_notifications', 'true', 'Enable email notifications', 'notifications'),
('analytics_enabled', 'true', 'Enable analytics tracking', 'analytics');

-- Insert initial feature flags
INSERT INTO feature_flags (flag_key, name, description, enabled, conditions) VALUES
('beta_ai_scoring', 'AI Scoring Beta', 'Enable AI-powered essay and speaking scoring', false, '{"user_segments": ["beta_testers"], "percentage": 10}'),
('advanced_analytics', 'Advanced Analytics', 'Enable advanced analytics dashboard', false, '{"roles": ["super_admin", "admin"]}'),
('multi_language_support', 'Multi-language Support', 'Enable multiple interface languages', true, '{}'),
('real_time_feedback', 'Real-time Feedback', 'Enable real-time feedback during exams', false, '{"courses": ["valenciano_c1", "ingles_c2"]}'),
('social_login', 'Social Login', 'Enable Google and GitHub OAuth', true, '{}');

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = user_uuid 
        AND active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin role
CREATE OR REPLACE FUNCTION get_admin_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role 
    FROM admin_users 
    WHERE user_id = user_uuid 
    AND active = true;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    action_type TEXT,
    resource_type_param TEXT,
    resource_id_param TEXT DEFAULT NULL,
    old_data_param JSONB DEFAULT NULL,
    new_data_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    admin_record admin_users;
    log_id UUID;
BEGIN
    -- Get admin record
    SELECT * INTO admin_record 
    FROM admin_users 
    WHERE user_id = auth.uid() 
    AND active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User is not an active admin';
    END IF;
    
    -- Insert audit log
    INSERT INTO audit_logs (
        admin_id, 
        action, 
        resource_type, 
        resource_id, 
        old_data, 
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        admin_record.id,
        action_type,
        resource_type_param,
        resource_id_param,
        old_data_param,
        new_data_param,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a default super admin (replace with your email)
-- This should be run after the migration with the actual admin email
-- INSERT INTO admin_users (user_id, role, created_at) 
-- SELECT id, 'super_admin', NOW() 
-- FROM auth.users 
-- WHERE email = 'admin@neolingus.com' 
-- LIMIT 1;