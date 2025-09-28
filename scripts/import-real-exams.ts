#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import { ExamLoaderService } from '@/lib/services/exam-loader.service';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Configuration
const REAL_EXAMS_PATH = join(process.cwd(), 'real-exams');
const BATCH_SIZE = 5; // Process exams in batches to avoid overwhelming the system

// CLI Arguments
const args = process.argv.slice(2);
const mode = args[0] || 'full'; // full, incremental, single
const examPath = args[1]; // for single mode
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message: string) {
  log(`❌ ${message}`, 'red');
}

function success(message: string) {
  log(`✅ ${message}`, 'green');
}

function warning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

// Initialize Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

// Get all exam directories from real-exams/
async function getExamDirectories(): Promise<string[]> {
  try {
    const realExamsExists = await stat(REAL_EXAMS_PATH).then(() => true).catch(() => false);
    if (!realExamsExists) {
      throw new Error(`real-exams directory not found at: ${REAL_EXAMS_PATH}`);
    }

    const items = await readdir(REAL_EXAMS_PATH);
    const directories = [];

    for (const item of items) {
      const itemPath = join(REAL_EXAMS_PATH, item);
      const itemStat = await stat(itemPath);
      if (itemStat.isDirectory()) {
        directories.push(item);
      }
    }

    return directories;
  } catch (err) {
    throw new Error(`Failed to read real-exams directory: ${err}`);
  }
}

// Parse exam directory name to extract metadata
function parseExamDirectory(dirName: string) {
  // Expected format: language_level_provider_skill_examname
  // Example: english_b2_cambridge_reading_2023-sample
  const parts = dirName.split('_');

  if (parts.length < 4) {
    warning(`Skipping directory with invalid format: ${dirName}`);
    return null;
  }

  const [language, level, provider, skill, ...examNameParts] = parts;
  const examName = examNameParts.join('_') || 'untitled';

  return {
    language,
    level: level.toUpperCase(),
    provider,
    skill,
    examName,
    directoryName: dirName
  };
}

// Check if exam already exists in database
async function examExists(supabase: any, metadata: any): Promise<boolean> {
  const { data, error } = await supabase
    .from('exam_templates')
    .select('id')
    .eq('language', metadata.language)
    .eq('level', metadata.level)
    .eq('provider', metadata.provider)
    .eq('skill', metadata.skill)
    .eq('external_id', metadata.directoryName)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw error;
  }

  return !!data;
}

// Import single exam
async function importSingleExam(
  examLoader: ExamLoaderService,
  supabase: any,
  examDir: string,
  metadata: any
): Promise<{ success: boolean; message: string }> {
  try {
    if (verbose) {
      info(`Processing exam: ${examDir}`);
    }

    // Check if already exists in incremental mode
    if (mode === 'incremental') {
      const exists = await examExists(supabase, metadata);
      if (exists) {
        return { success: true, message: `Exam already exists: ${examDir}` };
      }
    }

    // Load exam content
    const examPath = join(REAL_EXAMS_PATH, examDir);
    const loadResult = await examLoader.loadExam(examPath);

    if (!loadResult.success) {
      return { success: false, message: `Failed to load exam: ${loadResult.error}` };
    }

    if (dryRun) {
      return { success: true, message: `[DRY RUN] Would import exam: ${examDir}` };
    }

    // Create exam template
    const { data: template, error: templateError } = await supabase
      .from('exam_templates')
      .insert({
        language: metadata.language,
        level: metadata.level,
        provider: metadata.provider,
        skill: metadata.skill,
        title: loadResult.exam.title || metadata.examName,
        description: loadResult.exam.description || `Official ${metadata.provider} ${metadata.skill} exam`,
        estimated_duration: loadResult.exam.duration || 90,
        total_questions: loadResult.exam.questions?.length || 0,
        total_points: loadResult.exam.totalPoints || 100,
        instructions: loadResult.exam.instructions || '',
        external_id: metadata.directoryName,
        source_path: examPath,
        metadata: loadResult.exam.metadata || {},
        is_published: true,
        is_active: true
      })
      .select()
      .single();

    if (templateError) {
      return { success: false, message: `Failed to create template: ${templateError.message}` };
    }

    // Import exam content (questions)
    if (loadResult.exam.questions && loadResult.exam.questions.length > 0) {
      const examContent = loadResult.exam.questions.map((question: any, index: number) => ({
        template_id: template.id,
        section_id: question.section || 'main',
        question_number: index + 1,
        question_type: question.type || 'multiple_choice',
        question_text: question.text || question.question,
        question_data: question.data || {},
        answer_options: question.options || [],
        correct_answer: question.correctAnswer || question.answer,
        answer_explanation: question.explanation || '',
        points: question.points || 1,
        difficulty_tags: question.difficulty ? [question.difficulty] : [],
        topic_tags: question.topics || [],
        media_urls: question.media || {}
      }));

      const { error: contentError } = await supabase
        .from('exam_content')
        .insert(examContent);

      if (contentError) {
        // Clean up template if content insertion fails
        await supabase.from('exam_templates').delete().eq('id', template.id);
        return { success: false, message: `Failed to insert content: ${contentError.message}` };
      }
    }

    // Log import
    await supabase
      .from('exam_import_logs')
      .insert({
        source_path: examPath,
        import_type: mode,
        questions_imported: loadResult.exam.questions?.length || 0,
        success: true,
        metadata: {
          ...metadata,
          loadResult: {
            questions: loadResult.exam.questions?.length || 0,
            media: loadResult.exam.media?.length || 0,
            duration: loadResult.exam.duration || 0
          }
        }
      });

    return { success: true, message: `Successfully imported: ${examDir}` };

  } catch (err: any) {
    // Log failed import
    await supabase
      .from('exam_import_logs')
      .insert({
        source_path: join(REAL_EXAMS_PATH, examDir),
        import_type: mode,
        questions_imported: 0,
        success: false,
        error_message: err.message,
        metadata
      });

    return { success: false, message: `Error importing ${examDir}: ${err.message}` };
  }
}

// Process exams in batches
async function processBatch(
  examLoader: ExamLoaderService,
  supabase: any,
  examDirs: string[],
  batchIndex: number
): Promise<{ success: number; failed: number; skipped: number; messages: string[] }> {
  const results = { success: 0, failed: 0, skipped: 0, messages: [] as string[] };

  info(`Processing batch ${batchIndex + 1} (${examDirs.length} exams)`);

  for (const examDir of examDirs) {
    const metadata = parseExamDirectory(examDir);

    if (!metadata) {
      results.skipped++;
      results.messages.push(`Skipped: ${examDir} (invalid format)`);
      continue;
    }

    const result = await importSingleExam(examLoader, supabase, examDir, metadata);

    if (result.success) {
      results.success++;
      if (verbose) {
        success(result.message);
      }
    } else {
      results.failed++;
      error(result.message);
    }

    results.messages.push(result.message);
  }

  return results;
}

// Main execution function
async function main() {
  try {
    log('🚀 Real Exams Import Script', 'bright');
    log('================================', 'cyan');

    info(`Mode: ${mode}`);
    info(`Real exams path: ${REAL_EXAMS_PATH}`);
    if (dryRun) warning('DRY RUN MODE - No changes will be made');
    if (verbose) info('Verbose mode enabled');

    log(''); // Empty line

    // Initialize services
    const supabase = createSupabaseClient();
    const examLoader = new ExamLoaderService();

    // Handle single exam mode
    if (mode === 'single') {
      if (!examPath) {
        throw new Error('Exam path required for single mode. Usage: npm run import-exams single <exam-directory>');
      }

      const metadata = parseExamDirectory(examPath);
      if (!metadata) {
        throw new Error(`Invalid exam directory format: ${examPath}`);
      }

      const result = await importSingleExam(examLoader, supabase, examPath, metadata);

      if (result.success) {
        success(result.message);
      } else {
        error(result.message);
        process.exit(1);
      }

      return;
    }

    // Get all exam directories
    info('Scanning real-exams directory...');
    const allExamDirs = await getExamDirectories();

    if (allExamDirs.length === 0) {
      warning('No exam directories found in real-exams/');
      return;
    }

    info(`Found ${allExamDirs.length} exam directories`);

    // Filter valid exam directories
    const validExamDirs = allExamDirs.filter(dir => parseExamDirectory(dir) !== null);

    if (validExamDirs.length === 0) {
      warning('No valid exam directories found (must follow format: language_level_provider_skill_name)');
      return;
    }

    info(`${validExamDirs.length} directories have valid format`);

    // Process in batches
    const totalBatches = Math.ceil(validExamDirs.length / BATCH_SIZE);
    const totalResults = { success: 0, failed: 0, skipped: 0, messages: [] as string[] };

    for (let i = 0; i < totalBatches; i++) {
      const batchStart = i * BATCH_SIZE;
      const batchEnd = Math.min(batchStart + BATCH_SIZE, validExamDirs.length);
      const batch = validExamDirs.slice(batchStart, batchEnd);

      const batchResults = await processBatch(examLoader, supabase, batch, i);

      totalResults.success += batchResults.success;
      totalResults.failed += batchResults.failed;
      totalResults.skipped += batchResults.skipped;
      totalResults.messages.push(...batchResults.messages);

      // Progress update
      log(`Batch ${i + 1}/${totalBatches} complete: ✅ ${batchResults.success} | ❌ ${batchResults.failed} | ⏭️  ${batchResults.skipped}`, 'cyan');
    }

    // Final summary
    log(''); // Empty line
    log('Import Summary', 'bright');
    log('==============', 'cyan');
    success(`Successfully imported: ${totalResults.success} exams`);
    if (totalResults.failed > 0) error(`Failed: ${totalResults.failed} exams`);
    if (totalResults.skipped > 0) warning(`Skipped: ${totalResults.skipped} exams`);

    log(`Total processed: ${totalResults.success + totalResults.failed + totalResults.skipped}`);

    if (dryRun) {
      log(''); // Empty line
      warning('This was a DRY RUN. No changes were made to the database.');
      info('Remove --dry-run flag to perform actual import.');
    }

  } catch (err: any) {
    error(`Script failed: ${err.message}`);
    if (verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

// Show usage information
function showUsage() {
  log('Real Exams Import Script', 'bright');
  log('========================', 'cyan');
  log('');
  log('Usage:', 'bright');
  log('  npm run import-exams [mode] [options]');
  log('');
  log('Modes:', 'bright');
  log('  full         Import all exams (default)');
  log('  incremental  Import only new exams');
  log('  single <dir> Import single exam directory');
  log('');
  log('Options:', 'bright');
  log('  --dry-run    Preview changes without importing');
  log('  --verbose    Show detailed output');
  log('  --help       Show this help message');
  log('');
  log('Examples:', 'bright');
  log('  npm run import-exams full --dry-run');
  log('  npm run import-exams incremental');
  log('  npm run import-exams single english_b2_cambridge_reading_sample');
  log('');
  log('Environment Variables Required:', 'bright');
  log('  NEXT_PUBLIC_SUPABASE_URL');
  log('  SUPABASE_SERVICE_ROLE_KEY');
}

// Handle help flag
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Validate mode
if (!['full', 'incremental', 'single'].includes(mode)) {
  error(`Invalid mode: ${mode}`);
  showUsage();
  process.exit(1);
}

// Run main function
main().catch((err) => {
  error(`Unhandled error: ${err.message}`);
  process.exit(1);
});