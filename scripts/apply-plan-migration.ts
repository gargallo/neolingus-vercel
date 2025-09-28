#!/usr/bin/env tsx

/**
 * Apply Plan Management Migration
 * Runs the plan management schema migration directly through Supabase client
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
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function main() {
  console.log('🔄 Applying Plan Management Migration...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250913000001_create_plan_management.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded, executing SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const tableNames = ['plans', 'plan_templates', 'user_plan_assignments'];
    
    for (const tableName of tableNames) {
      const { data: tableData, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', tableName);
        
      if (tableError) {
        console.warn(`⚠️  Could not verify table ${tableName}:`, tableError.message);
      } else if (tableData && tableData.length > 0) {
        console.log(`✅ Table ${tableName} exists`);
      } else {
        console.error(`❌ Table ${tableName} not found`);
      }
    }
    
    // Test a simple query
    const { data: planData, error: planError } = await supabase
      .from('plans')
      .select('count')
      .limit(1);
      
    if (planError) {
      console.warn('⚠️  Could not query plans table:', planError.message);
    } else {
      console.log('✅ Plans table is queryable');
    }
    
    console.log('🎉 Plan management migration verification complete!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main().catch(console.error);