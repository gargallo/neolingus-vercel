-- Create agent usage tracking table
CREATE TABLE IF NOT EXISTS agent_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id text,
    input_text text NOT NULL,
    output_text text,
    tokens_used integer,
    prompt_tokens integer,
    completion_tokens integer,
    processing_time_ms integer,
    error_message text,
    timestamp timestamptz NOT NULL DEFAULT now(),
    metadata jsonb,
    
    -- Indexes for performance
    CONSTRAINT agent_usage_agent_id_idx FOREIGN KEY (agent_id) REFERENCES ai_agents(id),
    CONSTRAINT agent_usage_user_id_idx FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Create indexes for common queries
CREATE INDEX idx_agent_usage_agent_id ON agent_usage(agent_id);
CREATE INDEX idx_agent_usage_user_id ON agent_usage(user_id);
CREATE INDEX idx_agent_usage_session_id ON agent_usage(session_id);
CREATE INDEX idx_agent_usage_timestamp ON agent_usage(timestamp DESC);
CREATE INDEX idx_agent_usage_agent_timestamp ON agent_usage(agent_id, timestamp DESC);

-- Create agent deployment logs table
CREATE TABLE IF NOT EXISTS agent_deployment_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    deployed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    deployment_status text NOT NULL,
    deployment_message text,
    configuration jsonb,
    timestamp timestamptz NOT NULL DEFAULT now()
);

-- Create index for deployment logs
CREATE INDEX idx_deployment_logs_agent_id ON agent_deployment_logs(agent_id);
CREATE INDEX idx_deployment_logs_timestamp ON agent_deployment_logs(timestamp DESC);

-- Create agent API keys table for external access
CREATE TABLE IF NOT EXISTS agent_api_keys (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    api_key text NOT NULL UNIQUE,
    name text NOT NULL,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at timestamptz,
    last_used_at timestamptz,
    usage_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    metadata jsonb
);

-- Create indexes for API keys
CREATE INDEX idx_agent_api_keys_agent_id ON agent_api_keys(agent_id);
CREATE INDEX idx_agent_api_keys_api_key ON agent_api_keys(api_key);
CREATE INDEX idx_agent_api_keys_is_active ON agent_api_keys(is_active);

-- Create function to generate secure API key
CREATE OR REPLACE FUNCTION generate_agent_api_key()
RETURNS text AS $$
DECLARE
    key text;
BEGIN
    -- Generate a secure random key with prefix
    key := 'neolingus_' || encode(gen_random_bytes(32), 'hex');
    RETURN key;
END;
$$ LANGUAGE plpgsql;

-- Create function to track agent usage
CREATE OR REPLACE FUNCTION track_agent_usage(
    p_agent_id uuid,
    p_user_id uuid,
    p_session_id text,
    p_input text,
    p_output text DEFAULT NULL,
    p_tokens integer DEFAULT NULL,
    p_error text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    usage_id uuid;
BEGIN
    INSERT INTO agent_usage (
        agent_id,
        user_id,
        session_id,
        input_text,
        output_text,
        tokens_used,
        error_message
    ) VALUES (
        p_agent_id,
        p_user_id,
        p_session_id,
        p_input,
        p_output,
        p_tokens,
        p_error
    ) RETURNING id INTO usage_id;
    
    -- Update agent statistics
    UPDATE ai_agents 
    SET 
        usage_count = COALESCE(usage_count, 0) + 1,
        last_used_at = now()
    WHERE id = p_agent_id;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for agent usage statistics
CREATE OR REPLACE VIEW agent_usage_stats AS
SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.type as agent_type,
    a.language,
    a.model_provider,
    a.model_name,
    COUNT(DISTINCT u.user_id) as unique_users,
    COUNT(DISTINCT u.session_id) as total_sessions,
    COUNT(u.id) as total_requests,
    SUM(u.tokens_used) as total_tokens,
    AVG(u.tokens_used) as avg_tokens_per_request,
    AVG(u.processing_time_ms) as avg_processing_time,
    MAX(u.timestamp) as last_used,
    MIN(u.timestamp) as first_used
FROM ai_agents a
LEFT JOIN agent_usage u ON a.id = u.agent_id
GROUP BY a.id, a.name, a.type, a.language, a.model_provider, a.model_name;

-- Create view for agent deployment status
CREATE OR REPLACE VIEW agent_deployment_status AS
SELECT 
    a.id,
    a.name,
    a.deployment_status,
    a.version,
    dl.deployment_message as last_deployment_message,
    dl.timestamp as last_deployment_time,
    dl.deployed_by as last_deployed_by,
    u.email as deployed_by_email
FROM ai_agents a
LEFT JOIN LATERAL (
    SELECT * FROM agent_deployment_logs 
    WHERE agent_id = a.id 
    ORDER BY timestamp DESC 
    LIMIT 1
) dl ON true
LEFT JOIN auth.users u ON dl.deployed_by = u.id;

-- Add RLS policies
ALTER TABLE agent_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_deployment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_api_keys ENABLE ROW LEVEL SECURITY;

-- Policies for agent_usage
CREATE POLICY "Admin users can view all agent usage" ON agent_usage
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin', 'course_manager')
        )
    );

CREATE POLICY "Users can view their own usage" ON agent_usage
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "System can insert usage records" ON agent_usage
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policies for agent_deployment_logs
CREATE POLICY "Admin users can view deployment logs" ON agent_deployment_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

CREATE POLICY "Admin users can create deployment logs" ON agent_deployment_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Policies for agent_api_keys
CREATE POLICY "Admin users can manage API keys" ON agent_api_keys
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE user_id = auth.uid()
            AND role IN ('super_admin', 'admin')
        )
    );

-- Add missing columns to ai_agents table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_agents' 
                   AND column_name = 'usage_count') THEN
        ALTER TABLE ai_agents ADD COLUMN usage_count integer DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ai_agents' 
                   AND column_name = 'last_used_at') THEN
        ALTER TABLE ai_agents ADD COLUMN last_used_at timestamptz;
    END IF;
END $$;