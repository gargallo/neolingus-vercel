#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function setupDatabase() {
  console.log('🚀 Setting up NeoLingus database...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }

  // Use service role key for admin operations
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📦 Checking database tables...');
    
    // Check if tables exist by trying to query them
    let tablesExist = true;
    try {
      await supabase.from('admin_users').select('id').limit(1);
      await supabase.from('courses').select('id').limit(1);
      await supabase.from('user_courses').select('id').limit(1);
      console.log('✅ Database tables already exist');
    } catch (error) {
      tablesExist = false;
      console.log('ℹ️  Tables don\'t exist, they need to be created manually');
      console.log('🛑 Please run the SQL migrations in your Supabase dashboard first.');
      console.log('📋 Use the file: setup-database.sql');
      throw new Error('Database tables not found. Please run the SQL migrations first.');
    }

    // Enable RLS
    console.log('🔒 Setting up security policies...');
    const securitySQL = `
      -- Enable Row Level Security
      ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;
      ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

      -- Courses - anyone can view available courses
      DROP POLICY IF EXISTS "Anyone can view available courses" ON courses;
      CREATE POLICY "Anyone can view available courses" ON courses FOR SELECT USING (available = true);

      -- User courses policies
      DROP POLICY IF EXISTS "Users can view their own course subscriptions" ON user_courses;
      CREATE POLICY "Users can view their own course subscriptions" ON user_courses FOR SELECT USING (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can insert their own course subscriptions" ON user_courses;
      CREATE POLICY "Users can insert their own course subscriptions" ON user_courses FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can update their own course subscriptions" ON user_courses;
      CREATE POLICY "Users can update their own course subscriptions" ON user_courses FOR UPDATE USING (auth.uid() = user_id);

      -- Admin users policies
      DROP POLICY IF EXISTS "Super admins can view all admin users" ON admin_users;
      CREATE POLICY "Super admins can view all admin users" ON admin_users FOR SELECT USING (
          EXISTS (
              SELECT 1 FROM admin_users au 
              WHERE au.user_id = auth.uid() 
              AND au.active = true 
              AND au.role = 'super_admin' 
          )
      );
    `;

    const { error: securityError } = await supabase.rpc('exec_sql', { sql: securitySQL });
    if (securityError) {
      console.log('⚠️  Security policies setup failed (this is normal if exec_sql is not available)');
    } else {
      console.log('✅ Security policies configured');
    }

    // Insert sample courses
    console.log('📚 Inserting sample courses...');
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
      console.log('⚠️  Courses insertion failed:', coursesError.message);
    } else {
      console.log('✅ Sample courses inserted');
    }

    // Create admin user
    console.log('👤 Setting up admin user...');
    
    // First, check if auth user exists
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
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({
        user_id: adminAuthUser.id,
        role: 'super_admin',
        active: true
      }, { onConflict: 'user_id' });

    if (adminError) {
      throw new Error(`Failed to create admin user record: ${adminError.message}`);
    }

    console.log('✅ Admin user record created/updated');

    // Verify setup
    console.log('🔍 Verifying setup...');
    
    const { data: adminUser, error: verifyError } = await supabase
      .from('admin_users')
      .select(`
        id,
        role,
        active,
        created_at
      `)
      .eq('user_id', adminAuthUser.id)
      .single();

    if (verifyError) {
      console.log('⚠️  Admin user verification failed:', verifyError.message);
    } else {
      console.log('✅ Admin user verified:', {
        email: 'admin@neolingus.com',
        role: adminUser.role,
        active: adminUser.active,
        id: adminUser.id
      });
    }

    const { data: courses, error: coursesVerifyError } = await supabase
      .from('courses')
      .select('course_id, title, language, level')
      .eq('available', true);

    if (!coursesVerifyError && courses) {
      console.log('✅ Available courses:', courses.length);
      courses.forEach(course => {
        console.log(`   - ${course.title} (${course.course_id})`);
      });
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Sign out and sign back in with admin@neolingus.com');
    console.log('2. Navigate to /admin');
    console.log('3. Change the default password: TempAdminPass123!');

    return { success: true };

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await setupDatabase();
  } catch (error) {
    console.error('❌ Setup failed:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();