-- Seed script to create initial admin user
-- This should be run after the user admin@neolingus.com has been created in Supabase Auth

-- Create the super admin user entry
-- First, make sure the user exists in auth.users
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

-- Verify the admin user was created
SELECT 
    au.id,
    au.role,
    au.active,
    u.email,
    au.created_at
FROM admin_users au
JOIN auth.users u ON au.user_id = u.id
WHERE u.email = 'admin@neolingus.com';