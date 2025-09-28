#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const { createClient } = require('@supabase/supabase-js');

async function testPublicCoursesEndpoint() {
  console.log('🧪 Testing Public Courses Endpoint\n');

  // Test 1: Direct Supabase query (what our endpoint should return)
  console.log('1️⃣ Testing direct database query:');
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: courses, error } = await supabase
      .from("courses")
      .select(`
        id,
        title,
        language,
        level,
        certification_type,
        description,
        components,
        certification_modules!inner(
          name,
          code,
          official_website
        )
      `)
      .eq("is_active", true)
      .order("language")
      .order("level");

    if (error) {
      console.log(`   ❌ Database error: ${error.message}`);
    } else {
      console.log(`   ✅ Database query successful - ${courses.length} courses found`);
      courses.forEach(course => {
        console.log(`      - ${course.title} (${course.language} ${course.level})`);
        console.log(`        Description: ${course.description}`);
        console.log(`        Components: ${course.components ? course.components.join(', ') : 'None'}`);
        console.log(`        Certification: ${course.certification_modules?.name || 'N/A'}`);
        console.log('');
      });
    }
  } catch (err) {
    console.log(`   ❌ Database exception: ${err.message}`);
  }

  // Test 2: Test API endpoint locally using fetch
  console.log('2️⃣ Testing public API endpoint:');
  try {
    // Simulate what the frontend would do
    const response = await fetch('http://localhost:3000/api/academia/courses/public');
    
    if (!response.ok) {
      console.log(`   ❌ API response error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log(`      Error details: ${errorText}`);
    } else {
      const result = await response.json();
      console.log(`   ✅ API endpoint successful`);
      console.log(`      Success: ${result.success}`);
      console.log(`      Count: ${result.count}`);
      console.log(`      Message: ${result.message}`);
      
      if (result.data && result.data.length > 0) {
        console.log('      Courses returned:');
        result.data.forEach(course => {
          console.log(`        - ${course.title} (${course.language} ${course.level})`);
        });
      } else {
        console.log('      ⚠️  No courses in API response data');
      }
    }
  } catch (err) {
    console.log(`   ❌ API endpoint exception: ${err.message}`);
  }

  console.log('\n🎯 Public Courses Endpoint Test Complete!');
}

testPublicCoursesEndpoint().catch(console.error);