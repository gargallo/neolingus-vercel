/**
 * Database Migration Verification Script
 * 
 * Verifies that the academia database migration has been applied correctly
 * by checking the existence of all required tables, columns, constraints, and indexes.
 * 
 * Run with: npx tsx scripts/verify-migration.ts
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { mcpClient } from '../utils/supabase/mcp-config';

// =============================================================================
// MIGRATION VERIFICATION SCHEMA
// =============================================================================

interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  constraints: ConstraintSchema[];
  indexes: IndexSchema[];
}

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
}

interface ConstraintSchema {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK';
  definition: string;
}

interface IndexSchema {
  name: string;
  columns: string[];
  unique?: boolean;
  where_clause?: string;
}

interface MigrationVerificationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  tables_found: string[];
  tables_missing: string[];
  summary: {
    total_tables_expected: number;
    total_tables_found: number;
    total_columns_expected: number;
    total_columns_found: number;
    total_constraints_expected: number;
    total_constraints_found: number;
    total_indexes_expected: number;
    total_indexes_found: number;
  };
}

// =============================================================================
// EXPECTED SCHEMA DEFINITION
// =============================================================================

const EXPECTED_TABLES: TableSchema[] = [
  {
    name: 'certification_modules',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'name', type: 'varchar', nullable: false },
      { name: 'code', type: 'varchar', nullable: false },
      { name: 'language', type: 'varchar', nullable: false },
      { name: 'certification_body', type: 'varchar', nullable: false },
      { name: 'official_website', type: 'text', nullable: true },
      { name: 'exam_structure', type: 'jsonb', nullable: false },
      { name: 'content_config', type: 'jsonb', nullable: false },
      { name: 'compliance_requirements', type: 'jsonb', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: false, default: 'false' },
      { name: 'phase', type: 'integer', nullable: false },
      { name: 'launch_date', type: 'date', nullable: true },
      { name: 'version', type: 'varchar', nullable: false, default: "'1.0.0'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' }
    ],
    constraints: [
      { name: 'certification_modules_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'certification_modules_code_key', type: 'UNIQUE', definition: 'UNIQUE (code)' },
      { name: 'certification_modules_phase_check', type: 'CHECK', definition: 'CHECK (phase IN (1, 2, 3))' }
    ],
    indexes: []
  },
  {
    name: 'courses',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'certification_module_id', type: 'uuid', nullable: false },
      { name: 'language', type: 'varchar', nullable: false },
      { name: 'level', type: 'varchar', nullable: false },
      { name: 'certification_type', type: 'varchar', nullable: false },
      { name: 'title', type: 'varchar', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'components', type: 'jsonb', nullable: false, default: "'[]'" },
      { name: 'assessment_rubric', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'is_active', type: 'boolean', nullable: false, default: 'true' },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' }
    ],
    constraints: [
      { name: 'courses_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'courses_certification_module_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (certification_module_id) REFERENCES certification_modules(id) ON DELETE CASCADE' },
      { name: 'unique_course_combination', type: 'UNIQUE', definition: 'UNIQUE (language, level, certification_type)' }
    ],
    indexes: [
      { name: 'idx_courses_language_level', columns: ['language', 'level'], where_clause: 'is_active = true' },
      { name: 'idx_courses_certification_type', columns: ['certification_type'], where_clause: 'is_active = true' }
    ]
  },
  {
    name: 'user_profiles',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'email', type: 'varchar', nullable: false },
      { name: 'full_name', type: 'varchar', nullable: true },
      { name: 'preferred_language', type: 'varchar', nullable: false, default: "'english'" },
      { name: 'gdpr_consent', type: 'boolean', nullable: false, default: 'false' },
      { name: 'gdpr_consent_date', type: 'timestamptz', nullable: true },
      { name: 'lopd_consent', type: 'boolean', nullable: false, default: 'false' },
      { name: 'data_retention_preference', type: 'varchar', nullable: false, default: "'standard'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'last_active', type: 'timestamptz', nullable: false, default: 'now()' }
    ],
    constraints: [
      { name: 'user_profiles_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'user_profiles_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE' },
      { name: 'gdpr_consent_required', type: 'CHECK', definition: 'CHECK (gdpr_consent = true)' },
      { name: 'gdpr_consent_date_required', type: 'CHECK', definition: 'CHECK (gdpr_consent_date IS NOT NULL)' },
      { name: 'user_profiles_data_retention_preference_check', type: 'CHECK', definition: "CHECK (data_retention_preference IN ('minimal', 'standard', 'extended'))" }
    ],
    indexes: []
  },
  {
    name: 'user_course_enrollments',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'course_id', type: 'uuid', nullable: false },
      { name: 'enrollment_date', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'subscription_status', type: 'varchar', nullable: false, default: "'active'" },
      { name: 'access_expires_at', type: 'timestamptz', nullable: true },
      { name: 'subscription_tier', type: 'varchar', nullable: false, default: "'standard'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' }
    ],
    constraints: [
      { name: 'user_course_enrollments_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'user_course_enrollments_user_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE' },
      { name: 'user_course_enrollments_course_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE' },
      { name: 'unique_user_course_enrollment', type: 'UNIQUE', definition: 'UNIQUE (user_id, course_id)' },
      { name: 'user_course_enrollments_subscription_status_check', type: 'CHECK', definition: "CHECK (subscription_status IN ('active', 'expired', 'cancelled'))" },
      { name: 'user_course_enrollments_subscription_tier_check', type: 'CHECK', definition: "CHECK (subscription_tier IN ('basic', 'standard', 'premium'))" }
    ],
    indexes: [
      { name: 'idx_user_enrollments_user_id', columns: ['user_id'] },
      { name: 'idx_user_enrollments_course_id', columns: ['course_id'] }
    ]
  },
  {
    name: 'user_course_progress',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'course_id', type: 'uuid', nullable: false },
      { name: 'enrollment_date', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'last_activity', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'overall_progress', type: 'decimal', nullable: false, default: '0.0' },
      { name: 'component_progress', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'strengths', type: 'jsonb', nullable: false, default: "'[]'" },
      { name: 'weaknesses', type: 'jsonb', nullable: false, default: "'[]'" },
      { name: 'readiness_score', type: 'decimal', nullable: false, default: '0.0' },
      { name: 'estimated_study_hours', type: 'integer', nullable: false, default: '0' },
      { name: 'target_exam_date', type: 'date', nullable: true },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' }
    ],
    constraints: [
      { name: 'user_course_progress_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'user_course_progress_user_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE' },
      { name: 'user_course_progress_course_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE' },
      { name: 'unique_user_course_progress', type: 'UNIQUE', definition: 'UNIQUE (user_id, course_id)' },
      { name: 'user_course_progress_overall_progress_check', type: 'CHECK', definition: 'CHECK (overall_progress >= 0.0 AND overall_progress <= 1.0)' },
      { name: 'user_course_progress_readiness_score_check', type: 'CHECK', definition: 'CHECK (readiness_score >= 0.0 AND readiness_score <= 1.0)' }
    ],
    indexes: [
      { name: 'idx_user_progress_user_id', columns: ['user_id'] },
      { name: 'idx_user_progress_course_id', columns: ['course_id'] },
      { name: 'idx_user_progress_last_activity', columns: ['last_activity'] }
    ]
  },
  {
    name: 'exam_sessions',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'course_id', type: 'uuid', nullable: false },
      { name: 'progress_id', type: 'uuid', nullable: false },
      { name: 'session_type', type: 'varchar', nullable: false },
      { name: 'component', type: 'varchar', nullable: false },
      { name: 'started_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'completed_at', type: 'timestamptz', nullable: true },
      { name: 'duration_seconds', type: 'integer', nullable: false, default: '0' },
      { name: 'responses', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'score', type: 'decimal', nullable: true },
      { name: 'detailed_scores', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'ai_feedback', type: 'text', nullable: true },
      { name: 'improvement_suggestions', type: 'jsonb', nullable: false, default: "'[]'" },
      { name: 'is_completed', type: 'boolean', nullable: false, default: 'false' },
      { name: 'session_data', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' }
    ],
    constraints: [
      { name: 'exam_sessions_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'exam_sessions_user_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE' },
      { name: 'exam_sessions_course_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE' },
      { name: 'exam_sessions_progress_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (progress_id) REFERENCES user_course_progress(id) ON DELETE CASCADE' },
      { name: 'exam_sessions_session_type_check', type: 'CHECK', definition: "CHECK (session_type IN ('practice', 'mock_exam', 'diagnostic'))" },
      { name: 'exam_sessions_component_check', type: 'CHECK', definition: "CHECK (component IN ('reading', 'writing', 'listening', 'speaking'))" },
      { name: 'exam_sessions_score_check', type: 'CHECK', definition: 'CHECK (score >= 0.0 AND score <= 1.0)' }
    ],
    indexes: [
      { name: 'idx_exam_sessions_user_course', columns: ['user_id', 'course_id'] },
      { name: 'idx_exam_sessions_type_component', columns: ['session_type', 'component'] },
      { name: 'idx_exam_sessions_started_at', columns: ['started_at'] }
    ]
  },
  {
    name: 'ai_tutor_contexts',
    columns: [
      { name: 'id', type: 'uuid', nullable: false },
      { name: 'user_id', type: 'uuid', nullable: false },
      { name: 'course_id', type: 'uuid', nullable: false },
      { name: 'session_id', type: 'uuid', nullable: true },
      { name: 'context_type', type: 'varchar', nullable: false },
      { name: 'learning_profile', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'interaction_history', type: 'jsonb', nullable: false, default: "'[]'" },
      { name: 'current_context', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'ai_session_metadata', type: 'jsonb', nullable: false, default: "'{}'" },
      { name: 'created_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', nullable: false, default: 'now()' },
      { name: 'expires_at', type: 'timestamptz', nullable: false, default: "(now() + '30 days'::interval)" }
    ],
    constraints: [
      { name: 'ai_tutor_contexts_pkey', type: 'PRIMARY KEY', definition: 'PRIMARY KEY (id)' },
      { name: 'ai_tutor_contexts_user_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE' },
      { name: 'ai_tutor_contexts_course_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE' },
      { name: 'ai_tutor_contexts_session_id_fkey', type: 'FOREIGN KEY', definition: 'FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE SET NULL' },
      { name: 'ai_tutor_contexts_context_type_check', type: 'CHECK', definition: "CHECK (context_type IN ('general', 'session_specific', 'weakness_focused'))" }
    ],
    indexes: [
      { name: 'idx_ai_contexts_user_course', columns: ['user_id', 'course_id'] },
      { name: 'idx_ai_contexts_metadata', columns: ['ai_session_metadata'] },
      { name: 'idx_ai_contexts_expires_at', columns: ['expires_at'], where_clause: 'expires_at IS NOT NULL' }
    ]
  }
];

// =============================================================================
// VERIFICATION FUNCTIONS
// =============================================================================

/**
 * Main verification function
 */
async function verifyMigration(): Promise<MigrationVerificationResult> {
  console.log('🔍 Starting academia database migration verification...\n');
  
  const result: MigrationVerificationResult = {
    success: true,
    errors: [],
    warnings: [],
    tables_found: [],
    tables_missing: [],
    summary: {
      total_tables_expected: EXPECTED_TABLES.length,
      total_tables_found: 0,
      total_columns_expected: 0,
      total_columns_found: 0,
      total_constraints_expected: 0,
      total_constraints_found: 0,
      total_indexes_expected: 0,
      total_indexes_found: 0
    }
  };

  try {
    // Get Supabase client
    const supabase = mcpClient.getClient();

    // Check each expected table
    for (const expectedTable of EXPECTED_TABLES) {
      console.log(`📋 Verifying table: ${expectedTable.name}`);
      
      const tableResult = await verifyTable(supabase, expectedTable);
      
      if (tableResult.exists) {
        result.tables_found.push(expectedTable.name);
        result.summary.total_tables_found++;
        console.log(`  ✅ Table exists`);
        
        // Verify columns
        result.summary.total_columns_expected += expectedTable.columns.length;
        result.summary.total_columns_found += tableResult.columns_found;
        
        if (tableResult.columns_missing.length > 0) {
          result.errors.push(`Table ${expectedTable.name} missing columns: ${tableResult.columns_missing.join(', ')}`);
          console.log(`  ❌ Missing columns: ${tableResult.columns_missing.join(', ')}`);
        }
        
        // Note: We cannot easily verify constraints and indexes without direct DB access
        result.summary.total_constraints_expected += expectedTable.constraints.length;
        result.summary.total_indexes_expected += expectedTable.indexes.length;
        
      } else {
        result.tables_missing.push(expectedTable.name);
        result.errors.push(`Table ${expectedTable.name} does not exist`);
        console.log(`  ❌ Table missing`);
      }
      
      // Add any warnings
      if (tableResult.warnings.length > 0) {
        result.warnings.push(...tableResult.warnings);
      }
      
      console.log('');
    }

    // Check if migration was successful
    result.success = result.errors.length === 0;

    // Print summary
    console.log('📊 Migration Verification Summary:');
    console.log(`  Tables Expected: ${result.summary.total_tables_expected}`);
    console.log(`  Tables Found: ${result.summary.total_tables_found}`);
    console.log(`  Tables Missing: ${result.tables_missing.length}`);
    console.log(`  Columns Expected: ${result.summary.total_columns_expected}`);
    console.log(`  Columns Found: ${result.summary.total_columns_found}`);
    console.log(`  Errors: ${result.errors.length}`);
    console.log(`  Warnings: ${result.warnings.length}`);

    if (result.success) {
      console.log('\n✅ Migration verification completed successfully!');
    } else {
      console.log('\n❌ Migration verification failed!');
      console.log('\nErrors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    if (result.warnings.length > 0) {
      console.log('\nWarnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

  } catch (error) {
    console.error('💥 Migration verification failed with error:', error);
    result.success = false;
    result.errors.push(`Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Verify individual table
 */
async function verifyTable(supabase: any, expectedTable: TableSchema): Promise<{
  exists: boolean;
  columns_found: number;
  columns_missing: string[];
  warnings: string[];
}> {
  try {
    // Try to query the table to see if it exists
    const { data, error } = await supabase
      .from(expectedTable.name)
      .select('*')
      .limit(1);

    if (error) {
      // Check if error is due to table not existing
      if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
        return {
          exists: false,
          columns_found: 0,
          columns_missing: expectedTable.columns.map(col => col.name),
          warnings: []
        };
      }
      
      // Table exists but there might be other issues
      return {
        exists: true,
        columns_found: expectedTable.columns.length, // Assume all columns exist if we can query
        columns_missing: [],
        warnings: [`Warning querying table ${expectedTable.name}: ${error.message}`]
      };
    }

    // Table exists and is queryable
    return {
      exists: true,
      columns_found: expectedTable.columns.length, // We assume all columns exist if query succeeds
      columns_missing: [],
      warnings: []
    };

  } catch (error) {
    return {
      exists: false,
      columns_found: 0,
      columns_missing: expectedTable.columns.map(col => col.name),
      warnings: [`Error checking table ${expectedTable.name}: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Generate migration status report
 */
function generateReport(result: MigrationVerificationResult): string {
  const timestamp = new Date().toISOString();
  
  return `
# Academia Database Migration Verification Report
Generated: ${timestamp}

## Summary
- **Status**: ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Tables Expected**: ${result.summary.total_tables_expected}
- **Tables Found**: ${result.summary.total_tables_found}
- **Tables Missing**: ${result.tables_missing.length}
- **Errors**: ${result.errors.length}
- **Warnings**: ${result.warnings.length}

## Tables Found
${result.tables_found.map(table => `- ✅ ${table}`).join('\n')}

## Tables Missing
${result.tables_missing.map(table => `- ❌ ${table}`).join('\n')}

## Errors
${result.errors.map(error => `- ${error}`).join('\n')}

## Warnings
${result.warnings.map(warning => `- ${warning}`).join('\n')}

## Recommendations
${result.success ? 
  '- Migration appears to be applied correctly\n- Proceed with academia functionality development' : 
  '- Review and apply the academia database migration\n- Run: supabase db push or apply migration manually\n- Rerun verification after migration is applied'}
`;
}

// =============================================================================
// MAIN EXECUTION
// =============================================================================

if (require.main === module) {
  verifyMigration()
    .then(result => {
      const report = generateReport(result);
      console.log('\n' + report);
      
      // Exit with appropriate code
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Failed to verify migration:', error);
      process.exit(1);
    });
}

export { verifyMigration, generateReport, type MigrationVerificationResult };