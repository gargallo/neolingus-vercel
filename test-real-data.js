#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function testRealDataConnectivity() {
  console.log('🧪 Testing Real Data & Database Connectivity\n');

  // Test 1: Environment Variables
  console.log('1️⃣ Testing Environment Variables:');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY'
  ];

  for (const varName of requiredVars) {
    const value = process.env[varName];
    console.log(`   ${value ? '✅' : '❌'} ${varName}: ${value ? '***configured***' : 'MISSING'}`);
  }

  // Test 2: Supabase Client Connection
  console.log('\n2️⃣ Testing Supabase Client Connection:');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    const { data, error } = await supabase.from('courses').select('id, title, is_active').limit(1);
    if (error) {
      console.log(`   ❌ Supabase client error: ${error.message}`);
    } else {
      console.log(`   ✅ Supabase client working - found ${data.length} course(s)`);
    }
  } catch (err) {
    console.log(`   ❌ Supabase client exception: ${err.message}`);
  }

  // Test 3: Service Role Connection  
  console.log('\n3️⃣ Testing Service Role Connection:');
  const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { data, error } = await serviceSupabase.from('admin_users').select('id, role').limit(1);
    if (error) {
      console.log(`   ❌ Service role error: ${error.message}`);
    } else {
      console.log(`   ✅ Service role working - found ${data.length} admin(s)`);
    }
  } catch (err) {
    console.log(`   ❌ Service role exception: ${err.message}`);
  }

  // Test 4: Real Data Validation
  console.log('\n4️⃣ Testing Real Data Integrity:');
  
  try {
    // Test courses data
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id, title, language, level, is_active,
        certification_modules!inner(name)
      `);
    
    if (coursesError) {
      console.log(`   ❌ Courses query error: ${coursesError.message}`);
    } else {
      console.log(`   ✅ Found ${courses.length} courses with certification modules`);
      courses.forEach(course => {
        console.log(`      - ${course.title} (${course.language}/${course.level}) - ${course.is_active ? 'Active' : 'Inactive'}`);
      });
    }

    // Test user enrollments
    const { data: enrollments, error: enrollError } = await serviceSupabase
      .from('user_course_enrollments')
      .select(`
        id,
        user_profiles!inner(email),
        courses!inner(title)
      `);

    if (enrollError) {
      console.log(`   ❌ Enrollments query error: ${enrollError.message}`);
    } else {
      console.log(`   ✅ Found ${enrollments.length} course enrollments`);
    }

  } catch (err) {
    console.log(`   ❌ Data validation exception: ${err.message}`);
  }

  // Test 5: MCP Integration (if available)
  console.log('\n5️⃣ Testing MCP Integration:');
  try {
    // Try to import MCP config
    const { getSupabaseMCPClient } = require('./utils/supabase/mcp-config.js');
    const mcpClient = await getSupabaseMCPClient();
    console.log('   ✅ MCP client initialized successfully');
    
    const result = await mcpClient.from('courses').select('count');
    console.log('   ✅ MCP client can query database');
  } catch (err) {
    console.log(`   ⚠️  MCP integration: ${err.message}`);
  }

  console.log('\n🎯 Real Data Connectivity Test Complete!');
}

testRealDataConnectivity().catch(console.error);