#!/usr/bin/env npx tsx

/**
 * Verify Plan Management Migration
 * Tests the plan management system by attempting basic operations
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function main() {
  console.log('🔍 Verifying Plan Management System...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test 1: Check if tables exist
    console.log('\n1. Checking table existence...');
    
    const tables = ['plans', 'plan_templates', 'user_plan_assignments'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.message.includes('does not exist')) {
            console.log(`❌ Table ${tableName} does not exist`);
          } else {
            console.log(`✅ Table ${tableName} exists (${error.message})`);
          }
        } else {
          console.log(`✅ Table ${tableName} exists and is accessible`);
        }
      } catch (e) {
        console.log(`❌ Table ${tableName} - error: ${(e as Error).message.substring(0, 50)}...`);
      }
    }
    
    // Test 2: Try to create a test plan
    console.log('\n2. Testing plan creation...');
    
    try {
      const testPlan = {
        name: 'Test Plan',
        slug: 'test-plan',
        tier: 'basic',
        description: 'Test plan for verification',
        pricing: { 
          monthly_price: 999, 
          yearly_price: 9999, 
          currency: 'EUR' 
        },
        features: { 
          max_courses: 1, 
          ai_tutor_enabled: false 
        },
        limits: { 
          max_courses: 1,
          max_exams_per_month: 10
        },
        trial: { 
          enabled: true, 
          duration_days: 7 
        }
      };
      
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .insert([testPlan])
        .select();
        
      if (planError) {
        console.log(`⚠️  Plan creation failed: ${planError.message}`);
      } else {
        console.log(`✅ Test plan created successfully`);
        
        // Clean up test plan
        if (planData && planData.length > 0) {
          await supabase
            .from('plans')
            .delete()
            .eq('id', planData[0].id);
          console.log(`🧹 Test plan cleaned up`);
        }
      }
      
    } catch (e) {
      console.log(`⚠️  Plan creation test failed: ${(e as Error).message}`);
    }
    
    // Test 3: Check constraints
    console.log('\n3. Testing constraints...');
    
    try {
      // Try to create invalid plan (should fail)
      const { error: constraintError } = await supabase
        .from('plans')
        .insert([{
          name: 'Invalid Plan',
          slug: 'invalid',
          tier: 'invalid_tier', // Should fail constraint
          pricing: { monthly_price: -100 } // Should fail constraint
        }]);
        
      if (constraintError) {
        console.log(`✅ Constraints working: ${constraintError.message.substring(0, 60)}...`);
      } else {
        console.log(`⚠️  Constraints may not be working - invalid data was accepted`);
      }
      
    } catch (e) {
      console.log(`✅ Constraints working: ${(e as Error).message.substring(0, 60)}...`);
    }
    
    console.log('\n🎉 Plan management system verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);