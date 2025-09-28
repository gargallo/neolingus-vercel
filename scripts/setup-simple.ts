#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function setupSimple() {
  console.log('🚀 Setting up admin user for NeoLingus...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Check if admin user exists in auth
    console.log('👤 Checking for admin user...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }

    let adminAuthUser = authUsers.users.find(user => user.email === 'admin@neolingus.com');
    
    if (!adminAuthUser) {
      // Create the auth user first
      console.log('📝 Creating auth user admin@neolingus.com...');
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

    // Try to create sample courses first
    console.log('📚 Setting up sample courses...');
    try {
      const { error: coursesError } = await supabase
        .from('courses')
        .upsert([
          {
            course_id: 'valenciano_c1',
            title: 'Valencià C1',
            language: 'valenciano',
            level: 'C1',
            institution: 'EOI / CIEACOVA',
            region: 'valencia',
            description: 'Preparació per als exàmens oficials de valencià nivell C1',
            cultural_context: ['Literatura valenciana', 'Tradicions valencianes', 'Història del País Valencià'],
            available: true
          },
          {
            course_id: 'ingles_b2',
            title: 'English B2 First',
            language: 'english',
            level: 'B2',
            institution: 'Cambridge English / EOI',
            region: 'cambridge',
            description: 'Preparation for Cambridge B2 First and EOI B2 examinations',
            cultural_context: ['Everyday contexts', 'Work situations', 'Social interactions'],
            available: true
          }
        ], 
        { onConflict: 'course_id' });

      if (coursesError) {
        console.log('⚠️  Courses table may not exist:', coursesError.message);
      } else {
        console.log('✅ Sample courses created/updated');
      }
    } catch (error) {
      console.log('⚠️  Courses setup skipped (table may not exist)');
    }

    // Try to create admin user record
    console.log('🔐 Creating admin user record...');
    try {
      const { error: adminError } = await supabase
        .from('admin_users')
        .upsert({
          user_id: adminAuthUser.id,
          role: 'super_admin',
          active: true
        }, { onConflict: 'user_id' });

      if (adminError) {
        console.log('❌ Admin users table does not exist:', adminError.message);
        console.log('🛑 You need to run the database migrations first!');
        console.log('📋 Please copy and run the SQL from: setup-database.sql in your Supabase dashboard');
        throw new Error('Admin users table not found. Please run the SQL migrations first.');
      } else {
        console.log('✅ Admin user record created/updated');
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('table')) {
        console.log('❌ Database tables not found. Please run the migrations first.');
        console.log('📋 Go to your Supabase dashboard → SQL Editor');
        console.log('📋 Copy and run the contents of: setup-database.sql');
        return { success: false, needsMigrations: true };
      }
      throw error;
    }

    // Verify setup
    console.log('🔍 Verifying admin setup...');
    const { data: adminUser, error: verifyError } = await supabase
      .from('admin_users')
      .select('id, role, active, created_at')
      .eq('user_id', adminAuthUser.id)
      .single();

    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }

    console.log('✅ Admin user verified:', {
      email: 'admin@neolingus.com',
      role: adminUser.role,
      active: adminUser.active,
      id: adminUser.id
    });

    console.log('\n🎉 Setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Sign out and sign back in with admin@neolingus.com');
    console.log('2. Password: TempAdminPass123!');
    console.log('3. Navigate to /admin');
    console.log('4. ⚠️  IMPORTANT: Change the password immediately!');

    return { success: true };

  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    const result = await setupSimple();
    if (!result.success && result.needsMigrations) {
      console.log('\n📄 Please run this SQL in your Supabase dashboard:');
      console.log('=' .repeat(60));
      console.log('Go to Supabase Dashboard → SQL Editor → New Query → Paste and Run:');
      console.log('File: setup-database.sql');
      console.log('=' .repeat(60));
    }
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();