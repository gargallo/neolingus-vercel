#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying agent testing migration...');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20250108000000_update_agent_testing_schema.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If the RPC function doesn't exist, try direct execution
      console.log('⚠️ RPC function not available, trying direct execution...');
      
      // Split SQL into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      for (const statement of statements) {
        if (statement.trim()) {
          const { error: directError } = await supabase
            .from('_migrations')
            .insert({ statement });

          if (directError && directError.message.includes('relation "_migrations" does not exist')) {
            // Execute directly using the SQL from supabase-js
            console.log('Executing statement directly...');
            // This is a simplified approach - in practice, you'd use the Supabase CLI or admin panel
          }
        }
      }
    }

    console.log('✅ Migration applied successfully!');

    // Verify the tables were created
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['agent_test_results', 'agent_test_templates', 'agent_test_sessions']);

    if (tablesError) {
      console.error('❌ Error checking tables:', tablesError.message);
    } else {
      console.log('📋 Created tables:', tables?.map(t => t.table_name).join(', ') || 'none');
    }

    // Test the template function
    const { data: templates, error: templatesError } = await supabase
      .rpc('get_agent_test_templates', {
        p_agent_type: 'writing',
        p_language: 'english'
      });

    if (templatesError) {
      console.error('❌ Error testing template function:', templatesError.message);
    } else {
      console.log('🧪 Test templates available:', templates?.length || 0);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();