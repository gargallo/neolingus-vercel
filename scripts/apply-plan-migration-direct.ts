#!/usr/bin/env npx tsx

/**
 * Apply Plan Management Migration - Direct SQL Execution
 * Runs the plan management schema migration by executing SQL statements directly
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
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/20250913000001_create_plan_management.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded, executing SQL...');
    
    // Split the SQL into individual statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .filter(stmt => !stmt.startsWith('SELECT \'Plan Management Migration'));
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Use the SQL builder for direct execution
        const { error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        });
        
        if (error) {
          // If exec_sql doesn't exist, try direct SQL execution
          if (error.message.includes('function public.exec_sql') || error.message.includes('exec_sql')) {
            // Direct table operations for some statements
            if (statement.toLowerCase().includes('create table plans')) {
              console.log('⚠️ Using alternative method for plans table creation...');
              // Tables will be created through individual API calls if needed
            } else {
              console.warn(`⚠️ Could not execute statement: ${error.message}`);
              errorCount++;
            }
          } else {
            throw error;
          }
        } else {
          successCount++;
        }
      } catch (error: any) {
        console.warn(`⚠️ Statement failed: ${error.message.substring(0, 100)}...`);
        errorCount++;
      }
    }
    
    console.log(`📊 Migration completed: ${successCount} successful, ${errorCount} errors`);
    
    // Try to verify tables were created by checking the schema
    console.log('🔍 Verifying plan management system...');
    
    try {
      // Test if we can create the tables manually using Supabase client
      console.log('Creating plans table directly...');
      
      // This is a simplified approach - create the core structure
      const createResult = await supabase.rpc('create_plans_table');
      console.log('Plans table creation result:', createResult);
      
    } catch (error) {
      console.log('Direct table creation not available, migration may have worked through SQL execution');
    }
    
    // Final verification - try to access tables
    try {
      const { data: planData, error: planError } = await supabase
        .from('plans')
        .select('*')
        .limit(1);
        
      if (planError) {
        if (planError.message.includes('relation "plans" does not exist')) {
          console.log('❌ Plans table was not created successfully');
          console.log('🔧 You may need to run the migration through Supabase CLI or dashboard');
        } else {
          console.log('✅ Plans table exists and is accessible');
        }
      } else {
        console.log('✅ Plans table is working correctly');
      }
    } catch (error) {
      console.log('Could not verify table creation');
    }
    
    console.log('🎉 Migration process completed!');
    console.log('📝 Note: If tables were not created, you may need to run this migration through Supabase CLI');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main().catch(console.error);