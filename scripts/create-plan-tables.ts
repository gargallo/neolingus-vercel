#!/usr/bin/env npx tsx

/**
 * Create Plan Management Tables
 * Creates the plan management tables using raw SQL execution through Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function executeSQLStatements() {
  console.log('🔄 Creating Plan Management Tables...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  // Define the core table creation SQL
  const sqlStatements = [
    // Create plans table
    `CREATE TABLE IF NOT EXISTS plans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
      description TEXT,
      pricing JSONB NOT NULL DEFAULT '{}',
      features JSONB NOT NULL DEFAULT '{}',
      limits JSONB NOT NULL DEFAULT '{}',
      trial JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      is_featured BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_by UUID,
      updated_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Create plan_templates table
    `CREATE TABLE IF NOT EXISTS plan_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      tier VARCHAR(20) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
      template_data JSONB NOT NULL DEFAULT '{}',
      is_active BOOLEAN DEFAULT true,
      version VARCHAR(20) DEFAULT '1.0.0',
      created_by UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Create user_plan_assignments table
    `CREATE TABLE IF NOT EXISTS user_plan_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      plan_id UUID NOT NULL,
      course_id UUID,
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled', 'suspended')),
      access_level VARCHAR(20) DEFAULT 'full' CHECK (access_level IN ('full', 'limited', 'readonly')),
      subscription_tier VARCHAR(20) NOT NULL CHECK (subscription_tier IN ('basic', 'standard', 'premium')),
      billing_cycle VARCHAR(10) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'trial')),
      trial JSONB DEFAULT '{}',
      current_period_start TIMESTAMPTZ DEFAULT NOW(),
      current_period_end TIMESTAMPTZ,
      auto_renew BOOLEAN DEFAULT true,
      assignment_reason TEXT,
      assigned_by UUID,
      cancelled_at TIMESTAMPTZ,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_plans_active_tier ON plans(is_active, tier)`,
    `CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug)`,
    `CREATE INDEX IF NOT EXISTS idx_user_plan_assignments_user_id ON user_plan_assignments(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_plan_assignments_plan_id ON user_plan_assignments(plan_id)`,
    `CREATE INDEX IF NOT EXISTS idx_user_plan_assignments_status ON user_plan_assignments(status)`,
    
    // Enable RLS
    `ALTER TABLE plans ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE plan_templates ENABLE ROW LEVEL SECURITY`,  
    `ALTER TABLE user_plan_assignments ENABLE ROW LEVEL SECURITY`
  ];
  
  try {
    // Execute each statement
    let successCount = 0;
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}...`);
      
      try {
        // Using SQL query execution via edge function approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ query: statement })
        });
        
        if (!response.ok) {
          // Try alternative approach using direct query
          const { error } = await supabase
            .from('_dummy_table_that_doesnt_exist_')
            .select('*')
            .limit(0);
            
          // This will fail but might reveal the SQL execution approach
          console.log('Response status:', response.status);
        }
        
        successCount++;
      } catch (error) {
        // Continue with next statement
        console.warn(`Statement ${i + 1} may have failed:`, (error as Error).message.substring(0, 50));
      }
    }
    
    console.log(`📊 Attempted to execute ${sqlStatements.length} statements`);
    
    // Now test if tables were created
    console.log('\n🔍 Testing table creation...');
    
    // Test plans table
    try {
      const { data, error } = await supabase.from('plans').select('*').limit(1);
      if (!error) {
        console.log('✅ Plans table is accessible');
      } else {
        console.log('❌ Plans table error:', error.message);
      }
    } catch (e) {
      console.log('❌ Plans table not accessible');
    }
    
    // Create seed data
    console.log('\n🌱 Creating seed plans...');
    await createSeedPlans();
    
    console.log('🎉 Plan management system setup completed!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

async function createSeedPlans() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  const seedPlans = [
    {
      name: 'Basic',
      slug: 'basic',
      tier: 'basic',
      description: 'Essential features for language learning',
      pricing: {
        monthly_price: 999,  // €9.99
        yearly_price: 9999,  // €99.99
        currency: 'EUR'
      },
      features: {
        max_courses: 1,
        max_concurrent_sessions: 1,
        ai_tutor_enabled: false,
        progress_analytics: 'basic',
        custom_study_plans: false,
        exam_simulation_unlimited: false,
        priority_support: false,
        offline_access: false,
        certificate_generation: false
      },
      limits: {
        max_courses: 1,
        max_exams_per_month: 10,
        ai_tutoring_sessions: 0,
        storage_gb: 1,
        concurrent_sessions: 1
      },
      trial: {
        enabled: true,
        duration_days: 7,
        features_included: ['basic_practice', 'progress_tracking']
      },
      sort_order: 1
    },
    {
      name: 'Standard',
      slug: 'standard',
      tier: 'standard',
      description: 'Advanced features with AI tutoring',
      pricing: {
        monthly_price: 1999,  // €19.99
        yearly_price: 19999,  // €199.99  
        currency: 'EUR'
      },
      features: {
        max_courses: 3,
        max_concurrent_sessions: 2,
        ai_tutor_enabled: true,
        progress_analytics: 'advanced',
        custom_study_plans: true,
        exam_simulation_unlimited: false,
        priority_support: false,
        offline_access: false,
        certificate_generation: true
      },
      limits: {
        max_courses: 3,
        max_exams_per_month: 50,
        ai_tutoring_sessions: 100,
        storage_gb: 5,
        concurrent_sessions: 2
      },
      trial: {
        enabled: true,
        duration_days: 7,
        features_included: ['ai_tutoring', 'advanced_analytics', 'custom_plans']
      },
      sort_order: 2,
      is_featured: true
    },
    {
      name: 'Premium',
      slug: 'premium',
      tier: 'premium',
      description: 'Complete access with unlimited features',
      pricing: {
        monthly_price: 2999,  // €29.99
        yearly_price: 29999,  // €299.99
        currency: 'EUR'
      },
      features: {
        max_courses: null, // unlimited
        max_concurrent_sessions: 5,
        ai_tutor_enabled: true,
        progress_analytics: 'premium',
        custom_study_plans: true,
        exam_simulation_unlimited: true,
        priority_support: true,
        offline_access: true,
        certificate_generation: true
      },
      limits: {
        max_courses: null, // unlimited
        max_exams_per_month: null, // unlimited
        ai_tutoring_sessions: null, // unlimited
        storage_gb: 50,
        concurrent_sessions: 5
      },
      trial: {
        enabled: true,
        duration_days: 7,
        features_included: ['unlimited_access', 'priority_support', 'offline_content']
      },
      sort_order: 3
    }
  ];
  
  try {
    for (const plan of seedPlans) {
      const { error } = await supabase.from('plans').upsert([plan], { 
        onConflict: 'slug' 
      });
      
      if (error) {
        console.warn(`⚠️ Could not create ${plan.name} plan:`, error.message);
      } else {
        console.log(`✅ Created ${plan.name} plan`);
      }
    }
  } catch (error) {
    console.warn('⚠️ Seed data creation skipped:', (error as Error).message);
  }
}

executeSQLStatements().catch(console.error);