-- ========================================
-- NEOLINGUS DATABASE SETUP
-- Run this entire script in your Supabase SQL Editor
-- ========================================

-- Step 1: Create the exam system (from 20250107000000_create_exam_system.sql)
-- Migration: Create exam system tables
-- This creates the database schema for the hybrid exam architecture

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    subscription_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create the admin system (from 20250107100000_create_admin_system.sql)
-- Admin users and roles
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'course_manager', 'support')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES admin_users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- System audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
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

-- Enable Row Level Security
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 3: Create basic policies
-- Courses - anyone can view available courses
CREATE POLICY IF NOT EXISTS "Anyone can view available courses" ON courses FOR SELECT USING (available = true);

-- User courses - users can only see their own courses
CREATE POLICY IF NOT EXISTS "Users can view their own course subscriptions" ON user_courses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own course subscriptions" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own course subscriptions" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

-- Admin users - only super_admins can manage
CREATE POLICY IF NOT EXISTS "Super admins can view all admin users" ON admin_users FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM admin_users au 
        WHERE au.user_id = auth.uid() 
        AND au.active = true 
        AND au.role = 'super_admin' 
    )
);

-- Step 4: Insert sample courses
INSERT INTO courses (course_id, title, language, level, institution, region, description, cultural_context, available) VALUES
('valenciano_c1', 'Valencià C1', 'valenciano', 'C1', 'EOI / CIEACOVA', 'valencia', 'Preparació per als exàmens oficials de valencià nivell C1', '["Literatura valenciana", "Tradicions valencianes", "Història del País Valencià"]', true),
('ingles_b2', 'English B2 First', 'english', 'B2', 'Cambridge English / EOI', 'cambridge', 'Preparation for Cambridge B2 First and EOI B2 examinations', '["Everyday contexts", "Work situations", "Social interactions"]', true)
ON CONFLICT (course_id) DO NOTHING;

-- Step 5: Create admin user for admin@neolingus.com
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the user ID for admin@neolingus.com
    SELECT id INTO admin_user_id
    FROM auth.users 
    WHERE email = 'admin@neolingus.com'
    LIMIT 1;
    
    -- If user exists, create admin record
    IF admin_user_id IS NOT NULL THEN
        -- Insert or update admin user record
        INSERT INTO admin_users (user_id, role, active, created_at)
        VALUES (admin_user_id, 'super_admin', true, NOW())
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            role = 'super_admin',
            active = true,
            updated_at = NOW();
        
        RAISE NOTICE 'Admin user created/updated successfully for admin@neolingus.com';
    ELSE
        RAISE WARNING 'User admin@neolingus.com not found in auth.users. Please create the user first in Supabase Auth.';
    END IF;
END $$;

-- Step 6: Verify setup
SELECT 'Database setup completed successfully!' as message;

-- Verify admin user
SELECT 
    'Admin user verification:' as info,
    au.id,
    au.role,
    au.active,
    u.email,
    au.created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'admin@neolingus.com';

-- Verify courses
SELECT 'Available courses:' as info, course_id, title, language, level FROM courses WHERE available = true;