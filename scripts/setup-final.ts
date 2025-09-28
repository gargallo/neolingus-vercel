#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function setupFinal() {
  console.log('🚀 Final NeoLingus setup using service role...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use service role key for full admin access
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('🔍 Checking current database state...');

    // Check what tables exist by trying to access them
    const checkTables = async () => {
      const checks = [
        { name: 'courses', query: () => supabase.from('courses').select('count').single() },
        { name: 'admin_users', query: () => supabase.from('admin_users').select('count').single() },
        { name: 'user_courses', query: () => supabase.from('user_courses').select('count').single() }
      ];

      const results = [];
      for (const check of checks) {
        try {
          await check.query();
          results.push({ table: check.name, exists: true });
        } catch (error: any) {
          results.push({ table: check.name, exists: false, error: error.message });
        }
      }
      return results;
    };

    const tableStatus = await checkTables();
    console.log('📋 Table status:');
    tableStatus.forEach(status => {
      console.log(`   ${status.exists ? '✅' : '❌'} ${status.table}: ${status.exists ? 'exists' : 'missing'}`);
    });

    // If tables don't exist, we need to create them
    const missingTables = tableStatus.filter(t => !t.exists);
    if (missingTables.length > 0) {
      console.log('\n❌ Required tables are missing. You need to run the SQL manually.');
      console.log('📋 Please go to your Supabase Dashboard → SQL Editor and run this:');
      console.log('\n' + '='.repeat(60));
      console.log('-- NeoLingus Database Setup SQL');
      console.log('-- Copy and paste this entire block into Supabase SQL Editor');
      console.log('');
      console.log('-- Enable UUID extension');
      console.log('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
      console.log('');
      console.log('-- Create courses table');
      console.log(`CREATE TABLE IF NOT EXISTS courses (
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
);`);
      console.log('');
      console.log('-- Create user_courses table');
      console.log(`CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(course_id),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
      console.log('');
      console.log('-- Create admin_users table');
      console.log(`CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'course_manager', 'support')),
    permissions JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);`);
      console.log('');
      console.log('-- Insert sample courses');
      console.log(`INSERT INTO courses (course_id, title, language, level, institution, region, description, cultural_context, available) VALUES
('valenciano_c1', 'Valencià C1', 'valenciano', 'C1', 'EOI / CIEACOVA', 'valencia', 'Preparació per als exàmens oficials de valencià nivell C1', '["Literatura valenciana", "Tradicions valencianes", "Història del País Valencià"]', true),
('ingles_b2', 'English B2 First', 'english', 'B2', 'Cambridge English / EOI', 'cambridge', 'Preparation for Cambridge B2 First and EOI B2 examinations', '["Everyday contexts", "Work situations", "Social interactions"]', true)
ON CONFLICT (course_id) DO NOTHING;`);
      console.log('');
      console.log('-- Create admin user');
      console.log(`INSERT INTO admin_users (user_id, role, active, created_at)
SELECT id, 'super_admin', true, NOW()
FROM auth.users 
WHERE email = 'admin@neolingus.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin', active = true;`);
      console.log('='.repeat(60));
      console.log('\n🔄 After running the SQL, run this script again to verify the setup.');
      return { success: false, needsManualSetup: true };
    }

    console.log('✅ All required tables exist!');

    // Verify admin user exists in auth
    console.log('👤 Verifying admin user...');
    
    // List all users to find admin
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw new Error(`Failed to list users: ${authError.message}`);
    }

    const adminUser = authUsers.users.find(u => u.email === 'admin@neolingus.com');
    if (!adminUser) {
      console.log('❌ Admin auth user not found. Creating...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'admin@neolingus.com',
        password: 'TempAdminPass123!',
        email_confirm: true
      });
      
      if (createError) {
        throw new Error(`Failed to create admin user: ${createError.message}`);
      }
      console.log('✅ Admin auth user created');
    } else {
      console.log('✅ Admin auth user exists');
    }

    // Ensure admin record exists
    console.log('🔐 Setting up admin user record...');
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: adminUser?.id,
        role: 'super_admin',
        active: true
      }, { onConflict: 'user_id' });

    if (adminError) {
      console.log('❌ Failed to create admin user record:', adminError.message);
    } else {
      console.log('✅ Admin user record created/updated');
    }

    // Verify final setup
    console.log('🔍 Final verification...');
    const { data: finalAdmin } = await supabase
      .from('admin_users')
      .select(`
        id,
        role,
        active,
        created_at
      `)
      .eq('user_id', adminUser?.id)
      .single();

    if (finalAdmin) {
      console.log('✅ Setup verified successfully!');
      console.log(`   Admin ID: ${finalAdmin.id}`);
      console.log(`   Role: ${finalAdmin.role}`);
      console.log(`   Active: ${finalAdmin.active}`);
      
      console.log('\n🎉 Admin setup completed!');
      console.log('📋 Next steps:');
      console.log('1. Sign out and sign back in with: admin@neolingus.com');
      console.log('2. Password: TempAdminPass123!');
      console.log('3. Navigate to /admin');
      console.log('4. ⚠️  IMPORTANT: Change the password immediately!');
      
      return { success: true };
    } else {
      throw new Error('Admin verification failed');
    }

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupFinal();
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();