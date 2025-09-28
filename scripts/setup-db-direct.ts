#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { Client } from 'pg';
import { createClient } from '@supabase/supabase-js';

async function setupDatabaseDirect() {
  console.log('🚀 Setting up NeoLingus database directly...');
  
  if (!process.env.POSTGRES_URL_NON_POOLING || !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables');
  }

  // PostgreSQL client for direct SQL execution
  const pgClient = new Client({
    connectionString: process.env.POSTGRES_URL_NON_POOLING,
    ssl: {
      rejectUnauthorized: false
    }
  });

  // Supabase client for user management
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔗 Connecting to PostgreSQL...');
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL');

    // Create the schema
    console.log('📦 Creating database schema...');
    
    const schemaSQL = `
      -- Enable UUID extension if not already enabled
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Courses table - Available courses in the system
      CREATE TABLE IF NOT EXISTS courses (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          course_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          language TEXT NOT NULL,
          level TEXT NOT NULL,
          institution TEXT NOT NULL,
          region TEXT NOT NULL,
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
    `;

    await pgClient.query(schemaSQL);
    console.log('✅ Database schema created successfully');

    // Enable RLS and create policies
    console.log('🔒 Setting up security policies...');
    const securitySQL = `
      -- Enable Row Level Security
      ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Anyone can view available courses" ON courses;
      DROP POLICY IF EXISTS "Users can view their own course subscriptions" ON user_courses;
      DROP POLICY IF EXISTS "Users can insert their own course subscriptions" ON user_courses;
      DROP POLICY IF EXISTS "Users can update their own course subscriptions" ON user_courses;
      DROP POLICY IF EXISTS "Super admins can view all admin users" ON admin_users;

      -- Courses - anyone can view available courses
      CREATE POLICY "Anyone can view available courses" ON courses FOR SELECT USING (available = true);

      -- User courses policies
      CREATE POLICY "Users can view their own course subscriptions" ON user_courses FOR SELECT USING (auth.uid() = user_id);
      CREATE POLICY "Users can insert their own course subscriptions" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
      CREATE POLICY "Users can update their own course subscriptions" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

      -- Admin users policies
      CREATE POLICY "Super admins can view all admin users" ON admin_users FOR SELECT USING (
          EXISTS (
              SELECT 1 FROM admin_users au 
              WHERE au.user_id = auth.uid() 
              AND au.active = true 
              AND au.role = 'super_admin' 
          )
      );

      CREATE POLICY "Super admins can insert admin users" ON admin_users FOR INSERT WITH CHECK (
          EXISTS (
              SELECT 1 FROM admin_users au 
              WHERE au.user_id = auth.uid() 
              AND au.active = true 
              AND au.role = 'super_admin' 
          )
      );

      CREATE POLICY "Super admins can update admin users" ON admin_users FOR UPDATE USING (
          EXISTS (
              SELECT 1 FROM admin_users au 
              WHERE au.user_id = auth.uid() 
              AND au.active = true 
              AND au.role = 'super_admin' 
          )
      );
    `;

    await pgClient.query(securitySQL);
    console.log('✅ Security policies configured');

    // Insert sample courses
    console.log('📚 Inserting sample courses...');
    const coursesSQL = `
      INSERT INTO courses (course_id, title, language, level, institution, region, description, cultural_context, available) 
      VALUES 
        ('valenciano_c1', 'Valencià C1', 'valenciano', 'C1', 'EOI / CIEACOVA', 'valencia', 'Preparació per als exàmens oficials de valencià nivell C1', '["Literatura valenciana", "Tradicions valencianes", "Història del País Valencià"]', true),
        ('ingles_b2', 'English B2 First', 'english', 'B2', 'Cambridge English / EOI', 'cambridge', 'Preparation for Cambridge B2 First and EOI B2 examinations', '["Everyday contexts", "Work situations", "Social interactions"]', true)
      ON CONFLICT (course_id) DO NOTHING;
    `;

    await pgClient.query(coursesSQL);
    console.log('✅ Sample courses inserted');

    // Create admin user
    console.log('👤 Setting up admin user...');
    
    // Check if auth user exists
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    let adminAuthUser = authUsers.users.find(user => user.email === 'admin@neolingus.com');
    
    if (!adminAuthUser) {
      // Create the auth user first
      console.log('📝 Creating auth user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@neolingus.com',
        password: 'TempAdminPass123!',
        email_confirm: true,
        user_metadata: {
          role: 'super_admin',
          name: 'System Administrator'
        }
      });

      if (createError) {
        throw new Error(`Failed to create auth user: ${createError.message}`);
      }

      adminAuthUser = newUser.user;
      console.log('✅ Auth user created:', adminAuthUser.email);
    } else {
      console.log('ℹ️  Auth user already exists:', adminAuthUser.email);
    }

    // Create admin user record
    const adminUserSQL = `
      INSERT INTO admin_users (user_id, role, active, created_at)
      VALUES ($1, 'super_admin', true, NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        role = 'super_admin',
        active = true,
        updated_at = NOW()
      RETURNING id, role, active;
    `;

    const adminResult = await pgClient.query(adminUserSQL, [adminAuthUser.id]);
    console.log('✅ Admin user record created/updated:', {
      id: adminResult.rows[0].id,
      role: adminResult.rows[0].role,
      active: adminResult.rows[0].active
    });

    // Verify setup
    console.log('🔍 Verifying setup...');
    
    const verifySQL = `
      SELECT 
        au.id,
        au.role,
        au.active,
        u.email,
        au.created_at
      FROM admin_users au
      JOIN auth.users u ON au.user_id = u.id
      WHERE u.email = 'admin@neolingus.com';
    `;

    const verifyResult = await pgClient.query(verifySQL);
    if (verifyResult.rows.length > 0) {
      const admin = verifyResult.rows[0];
      console.log('✅ Admin user verified:', {
        email: admin.email,
        role: admin.role,
        active: admin.active,
        id: admin.id
      });
    }

    const coursesResult = await pgClient.query('SELECT course_id, title, language, level FROM courses WHERE available = true');
    console.log('✅ Available courses:', coursesResult.rows.length);
    coursesResult.rows.forEach(course => {
      console.log(`   - ${course.title} (${course.course_id})`);
    });

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Sign out and sign back in with admin@neolingus.com');
    console.log('2. Navigate to /admin');
    console.log('3. Change the default password: TempAdminPass123!');

    return { success: true };

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await pgClient.end();
    console.log('🔗 PostgreSQL connection closed');
  }
}

async function main() {
  try {
    await setupDatabaseDirect();
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();