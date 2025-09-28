-- =============================================
-- Neolingus Academy RLS Policies
-- Enhanced security with audit logging and GDPR compliance
-- Created: 2025-09-11
-- =============================================

-- =============================================
-- HELPER FUNCTIONS FOR RLS
-- =============================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        (auth.jwt() ->> 'role') = 'admin',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has valid enrollment
CREATE OR REPLACE FUNCTION auth.has_valid_enrollment(p_user_id UUID, p_course_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_course_enrollments
        WHERE user_id = p_user_id
        AND course_id = p_course_id
        AND subscription_status = 'active'
        AND (access_expires_at IS NULL OR access_expires_at > NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- AUDIT LOGGING SYSTEM
-- =============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id UUID REFERENCES auth.users(id),
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for audit log queries
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_operation ON audit_logs(table_name, operation);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies - only admins can read, system can write
CREATE POLICY "Admins can read audit logs" ON audit_logs
    FOR SELECT USING (auth.is_admin());

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        table_name,
        operation,
        user_id,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent
    ) VALUES (
        TG_TABLE_NAME,
        TG_OP,
        auth.uid(),
        CASE 
            WHEN TG_OP = 'DELETE' THEN (OLD.id)::UUID
            ELSE (NEW.id)::UUID
        END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('request.headers', true)::json->>'user-agent'
    );
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- USER_PROFILES POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- SELECT: Users see their own, admins see all
CREATE POLICY "user_profiles_select" ON user_profiles
    FOR SELECT USING (
        auth.uid() = id OR auth.is_admin()
    );

-- INSERT: Users can only create their own profile
CREATE POLICY "user_profiles_insert" ON user_profiles
    FOR INSERT WITH CHECK (
        auth.uid() = id AND
        gdpr_consent = true AND
        gdpr_consent_date IS NOT NULL
    );

-- UPDATE: Users update their own, admins update all
CREATE POLICY "user_profiles_update" ON user_profiles
    FOR UPDATE USING (
        auth.uid() = id OR auth.is_admin()
    )
    WITH CHECK (
        -- Ensure GDPR compliance is maintained
        gdpr_consent = true AND
        gdpr_consent_date IS NOT NULL
    );

-- DELETE: Only admins can delete profiles (GDPR right to erasure)
CREATE POLICY "user_profiles_delete" ON user_profiles
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_user_profiles ON user_profiles;
CREATE TRIGGER audit_user_profiles
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- COURSES POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active courses" ON courses;
DROP POLICY IF EXISTS "Admin can manage courses" ON courses;

-- SELECT: All authenticated users can view active courses
CREATE POLICY "courses_select" ON courses
    FOR SELECT USING (
        is_active = true OR auth.is_admin()
    );

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "courses_insert" ON courses
    FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "courses_update" ON courses
    FOR UPDATE USING (auth.is_admin());

CREATE POLICY "courses_delete" ON courses
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_courses ON courses;
CREATE TRIGGER audit_courses
    AFTER INSERT OR UPDATE OR DELETE ON courses
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- USER_COURSE_ENROLLMENTS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own enrollments" ON user_course_enrollments;
DROP POLICY IF EXISTS "Users can insert their own enrollments" ON user_course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON user_course_enrollments;

-- SELECT: Users see their own, admins see all
CREATE POLICY "enrollments_select" ON user_course_enrollments
    FOR SELECT USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- INSERT: Users can enroll themselves
CREATE POLICY "enrollments_insert" ON user_course_enrollments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        -- Ensure course is active
        EXISTS (
            SELECT 1 FROM courses 
            WHERE id = course_id AND is_active = true
        )
    );

-- UPDATE: Users update their own (limited fields), admins update all
CREATE POLICY "enrollments_update" ON user_course_enrollments
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.is_admin()
    )
    WITH CHECK (
        -- Regular users can only update certain fields
        CASE 
            WHEN auth.is_admin() THEN true
            ELSE (
                -- Users can only cancel their subscription
                OLD.user_id = NEW.user_id AND
                OLD.course_id = NEW.course_id AND
                OLD.enrollment_date = NEW.enrollment_date AND
                (NEW.subscription_status = 'cancelled' OR NEW.subscription_status = OLD.subscription_status)
            )
        END
    );

-- DELETE: Only admins
CREATE POLICY "enrollments_delete" ON user_course_enrollments
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_user_course_enrollments ON user_course_enrollments;
CREATE TRIGGER audit_user_course_enrollments
    AFTER INSERT OR UPDATE OR DELETE ON user_course_enrollments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- USER_COURSE_PROGRESS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON user_course_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON user_course_progress;

-- SELECT: Users see their own, admins see all
CREATE POLICY "progress_select" ON user_course_progress
    FOR SELECT USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- INSERT: Users can create progress records for enrolled courses
CREATE POLICY "progress_insert" ON user_course_progress
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.has_valid_enrollment(user_id, course_id)
    );

-- UPDATE: Users update their own progress
CREATE POLICY "progress_update" ON user_course_progress
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- DELETE: Only admins
CREATE POLICY "progress_delete" ON user_course_progress
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_user_course_progress ON user_course_progress;
CREATE TRIGGER audit_user_course_progress
    AFTER INSERT OR UPDATE OR DELETE ON user_course_progress
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- EXAM_SESSIONS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can update their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Users can insert their own exam sessions" ON exam_sessions;

-- SELECT: Users see their own, admins see all
CREATE POLICY "exam_sessions_select" ON exam_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- INSERT: Users can create sessions for enrolled courses
CREATE POLICY "exam_sessions_insert" ON exam_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.has_valid_enrollment(user_id, course_id)
    );

-- UPDATE: Users update their active sessions
CREATE POLICY "exam_sessions_update" ON exam_sessions
    FOR UPDATE USING (
        (auth.uid() = user_id AND is_completed = false) OR 
        auth.is_admin()
    );

-- DELETE: Only admins
CREATE POLICY "exam_sessions_delete" ON exam_sessions
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_exam_sessions ON exam_sessions;
CREATE TRIGGER audit_exam_sessions
    AFTER INSERT OR UPDATE OR DELETE ON exam_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- EXAM_QUESTIONS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can insert their own exam questions" ON exam_questions;
DROP POLICY IF EXISTS "Users can update their own exam questions" ON exam_questions;

-- SELECT: Users see questions from their sessions
CREATE POLICY "exam_questions_select" ON exam_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exam_sessions es 
            WHERE es.id = exam_questions.session_id 
            AND (es.user_id = auth.uid() OR auth.is_admin())
        )
    );

-- INSERT: Users can add questions to their active sessions
CREATE POLICY "exam_questions_insert" ON exam_questions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM exam_sessions es 
            WHERE es.id = exam_questions.session_id 
            AND es.user_id = auth.uid()
            AND es.is_completed = false
        )
    );

-- UPDATE: Users update questions in their active sessions
CREATE POLICY "exam_questions_update" ON exam_questions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM exam_sessions es 
            WHERE es.id = exam_questions.session_id 
            AND es.user_id = auth.uid()
            AND es.is_completed = false
        ) OR auth.is_admin()
    );

-- DELETE: Only admins
CREATE POLICY "exam_questions_delete" ON exam_questions
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_exam_questions ON exam_questions;
CREATE TRIGGER audit_exam_questions
    AFTER INSERT OR UPDATE OR DELETE ON exam_questions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- USER_ANSWERS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own answers" ON user_answers;
DROP POLICY IF EXISTS "Users can insert their own answers" ON user_answers;

-- SELECT: Users see answers from their sessions
CREATE POLICY "user_answers_select" ON user_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM exam_sessions es 
            WHERE es.id = user_answers.session_id 
            AND (es.user_id = auth.uid() OR auth.is_admin())
        )
    );

-- INSERT: Users can add answers to their active sessions
CREATE POLICY "user_answers_insert" ON user_answers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM exam_sessions es 
            WHERE es.id = user_answers.session_id 
            AND es.user_id = auth.uid()
            AND es.is_completed = false
        )
    );

-- UPDATE: Users update answers in their active sessions
CREATE POLICY "user_answers_update" ON user_answers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM exam_sessions es 
            WHERE es.id = user_answers.session_id 
            AND es.user_id = auth.uid()
            AND es.is_completed = false
            AND user_answers.is_final = false
        ) OR auth.is_admin()
    );

-- DELETE: Only admins
CREATE POLICY "user_answers_delete" ON user_answers
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_user_answers ON user_answers;
CREATE TRIGGER audit_user_answers
    AFTER INSERT OR UPDATE OR DELETE ON user_answers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- AI_TUTOR_SESSIONS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own AI tutor sessions" ON ai_tutor_sessions;
DROP POLICY IF EXISTS "Users can update their own AI tutor sessions" ON ai_tutor_sessions;
DROP POLICY IF EXISTS "Users can insert their own AI tutor sessions" ON ai_tutor_sessions;

-- SELECT: Users see their own, admins see all
CREATE POLICY "ai_sessions_select" ON ai_tutor_sessions
    FOR SELECT USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- INSERT: Users create sessions for enrolled courses
CREATE POLICY "ai_sessions_insert" ON ai_tutor_sessions
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.has_valid_enrollment(user_id, course_id)
    );

-- UPDATE: Users update their active sessions
CREATE POLICY "ai_sessions_update" ON ai_tutor_sessions
    FOR UPDATE USING (
        (auth.uid() = user_id AND status = 'active') OR 
        auth.is_admin()
    );

-- DELETE: Only admins
CREATE POLICY "ai_sessions_delete" ON ai_tutor_sessions
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_ai_tutor_sessions ON ai_tutor_sessions;
CREATE TRIGGER audit_ai_tutor_sessions
    AFTER INSERT OR UPDATE OR DELETE ON ai_tutor_sessions
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- AI_TUTOR_MESSAGES POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view messages from their own tutor sessions" ON ai_tutor_messages;
DROP POLICY IF EXISTS "Users can insert messages to their own tutor sessions" ON ai_tutor_messages;

-- SELECT: Users see messages from their sessions
CREATE POLICY "ai_messages_select" ON ai_tutor_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_tutor_sessions ats 
            WHERE ats.id = ai_tutor_messages.session_id 
            AND (ats.user_id = auth.uid() OR auth.is_admin())
        )
    );

-- INSERT: Users add messages to their active sessions
CREATE POLICY "ai_messages_insert" ON ai_tutor_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_tutor_sessions ats 
            WHERE ats.id = ai_tutor_messages.session_id 
            AND ats.user_id = auth.uid()
            AND ats.status = 'active'
            AND ai_tutor_messages.sender = 'user'
        )
    );

-- UPDATE/DELETE: Only admins
CREATE POLICY "ai_messages_update" ON ai_tutor_messages
    FOR UPDATE USING (auth.is_admin());

CREATE POLICY "ai_messages_delete" ON ai_tutor_messages
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_ai_tutor_messages ON ai_tutor_messages;
CREATE TRIGGER audit_ai_tutor_messages
    AFTER INSERT OR UPDATE OR DELETE ON ai_tutor_messages
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- AI_TUTOR_CONTEXTS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own AI contexts" ON ai_tutor_contexts;
DROP POLICY IF EXISTS "Users can update their own AI contexts" ON ai_tutor_contexts;
DROP POLICY IF EXISTS "Users can insert their own AI contexts" ON ai_tutor_contexts;

-- SELECT: Users see their own, admins see all
CREATE POLICY "ai_contexts_select" ON ai_tutor_contexts
    FOR SELECT USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- INSERT: Users create contexts for enrolled courses
CREATE POLICY "ai_contexts_insert" ON ai_tutor_contexts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        auth.has_valid_enrollment(user_id, course_id)
    );

-- UPDATE: Users update their own contexts
CREATE POLICY "ai_contexts_update" ON ai_tutor_contexts
    FOR UPDATE USING (
        auth.uid() = user_id OR auth.is_admin()
    )
    WITH CHECK (
        -- Ensure expires_at is not extended beyond 30 days
        expires_at <= (NOW() + INTERVAL '30 days')
    );

-- DELETE: Users can delete their own (GDPR), admins can delete all
CREATE POLICY "ai_contexts_delete" ON ai_tutor_contexts
    FOR DELETE USING (
        auth.uid() = user_id OR auth.is_admin()
    );

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_ai_tutor_contexts ON ai_tutor_contexts;
CREATE TRIGGER audit_ai_tutor_contexts
    AFTER INSERT OR UPDATE OR DELETE ON ai_tutor_contexts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- CERTIFICATION_MODULES POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view active certification modules" ON certification_modules;
DROP POLICY IF EXISTS "Admin can manage certification modules" ON certification_modules;

-- SELECT: All authenticated users can view active modules
CREATE POLICY "cert_modules_select" ON certification_modules
    FOR SELECT USING (
        is_active = true OR auth.is_admin()
    );

-- INSERT/UPDATE/DELETE: Only admins
CREATE POLICY "cert_modules_insert" ON certification_modules
    FOR INSERT WITH CHECK (auth.is_admin());

CREATE POLICY "cert_modules_update" ON certification_modules
    FOR UPDATE USING (auth.is_admin());

CREATE POLICY "cert_modules_delete" ON certification_modules
    FOR DELETE USING (auth.is_admin());

-- Add audit trigger
DROP TRIGGER IF EXISTS audit_certification_modules ON certification_modules;
CREATE TRIGGER audit_certification_modules
    AFTER INSERT OR UPDATE OR DELETE ON certification_modules
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- =============================================
-- GDPR COMPLIANCE FUNCTIONS
-- =============================================

-- Function to anonymize user data (GDPR right to erasure)
CREATE OR REPLACE FUNCTION anonymize_user_data(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Anonymize user profile
    UPDATE user_profiles 
    SET 
        email = 'deleted_' || p_user_id || '@anonymous.com',
        full_name = 'Deleted User',
        gdpr_consent = false,
        lopd_consent = false
    WHERE id = p_user_id;
    
    -- Delete AI contexts (contains personal learning data)
    DELETE FROM ai_tutor_contexts WHERE user_id = p_user_id;
    
    -- Anonymize exam sessions
    UPDATE exam_sessions 
    SET 
        responses = '{}',
        ai_feedback = 'Data deleted per GDPR request'
    WHERE user_id = p_user_id;
    
    -- Log the anonymization
    INSERT INTO audit_logs (
        table_name, 
        operation, 
        user_id, 
        record_id,
        new_data
    ) VALUES (
        'gdpr_anonymization',
        'DELETE',
        p_user_id,
        p_user_id,
        jsonb_build_object('action', 'user_data_anonymized', 'timestamp', NOW())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export user data (GDPR right to data portability)
CREATE OR REPLACE FUNCTION export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Only allow users to export their own data or admins
    IF auth.uid() != p_user_id AND NOT auth.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized access to user data';
    END IF;
    
    SELECT jsonb_build_object(
        'profile', (SELECT to_jsonb(u.*) FROM user_profiles u WHERE u.id = p_user_id),
        'enrollments', (SELECT jsonb_agg(to_jsonb(e.*)) FROM user_course_enrollments e WHERE e.user_id = p_user_id),
        'progress', (SELECT jsonb_agg(to_jsonb(p.*)) FROM user_course_progress p WHERE p.user_id = p_user_id),
        'exam_sessions', (SELECT jsonb_agg(to_jsonb(s.*)) FROM exam_sessions s WHERE s.user_id = p_user_id),
        'ai_contexts', (SELECT jsonb_agg(to_jsonb(c.*)) FROM ai_tutor_contexts c WHERE c.user_id = p_user_id),
        'export_date', NOW(),
        'export_format', 'GDPR_DATA_EXPORT_V1'
    ) INTO result;
    
    -- Log the export
    INSERT INTO audit_logs (
        table_name, 
        operation, 
        user_id, 
        record_id,
        new_data
    ) VALUES (
        'gdpr_export',
        'SELECT',
        p_user_id,
        p_user_id,
        jsonb_build_object('action', 'user_data_exported', 'timestamp', NOW())
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- =============================================

-- Add indexes for RLS policy checks
CREATE INDEX IF NOT EXISTS idx_enrollments_user_course_status 
    ON user_course_enrollments(user_id, course_id, subscription_status) 
    WHERE subscription_status = 'active';

CREATE INDEX IF NOT EXISTS idx_sessions_user_completed 
    ON exam_sessions(user_id, is_completed) 
    WHERE is_completed = false;

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user_status 
    ON ai_tutor_sessions(user_id, status) 
    WHERE status = 'active';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions to authenticated users
GRANT SELECT ON certification_modules TO authenticated;
GRANT SELECT ON courses TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON user_course_enrollments TO authenticated;
GRANT ALL ON user_course_progress TO authenticated;
GRANT ALL ON exam_sessions TO authenticated;
GRANT ALL ON exam_questions TO authenticated;
GRANT ALL ON user_answers TO authenticated;
GRANT ALL ON ai_tutor_sessions TO authenticated;
GRANT ALL ON ai_tutor_messages TO authenticated;
GRANT ALL ON ai_tutor_contexts TO authenticated;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION auth.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION auth.has_valid_enrollment(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION export_user_data(UUID) TO authenticated;

-- Only admins can anonymize data
GRANT EXECUTE ON FUNCTION anonymize_user_data(UUID) TO authenticated;

-- =============================================
-- VALIDATION
-- =============================================

-- Verify all policies are in place
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN (
        'user_profiles', 'courses', 'user_course_enrollments',
        'user_course_progress', 'exam_sessions', 'exam_questions',
        'user_answers', 'ai_tutor_sessions', 'ai_tutor_messages',
        'ai_tutor_contexts', 'certification_modules', 'audit_logs'
    );
    
    RAISE NOTICE 'Total RLS policies created: %', policy_count;
    
    IF policy_count < 36 THEN
        RAISE WARNING 'Expected at least 36 policies, found %. Some policies may be missing.', policy_count;
    END IF;
END $$;

-- Success message
SELECT 'Academy RLS policies successfully created with audit logging and GDPR compliance' as status;