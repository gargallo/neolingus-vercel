#!/usr/bin/env npx tsx

import fs from 'fs/promises';
import path from 'path';
import { ExamLoaderService } from '@/lib/services/exam-loader.service';
import { createSupabaseClient } from '@/utils/supabase/client';
import {
  MigrationResult,
  MigrationReport,
  SimulatorStructure,
  ParsedExamData
} from '@/lib/types/exam-migration';

class HtmlSimulatorMigrator {
  private readonly simulatorsPath: string;
  private readonly supabase;
  private readonly isDryRun: boolean;

  constructor(isDryRun = false) {
    this.simulatorsPath = path.join(process.cwd(), 'real-exams', 'simulators');
    this.supabase = createSupabaseClient();
    this.isDryRun = isDryRun;
  }

  /**
   * Main migration method
   */
  async migrate(): Promise<MigrationReport> {
    const startTime = new Date();
    console.log(`🚀 Starting HTML simulator migration ${this.isDryRun ? '(DRY RUN)' : ''}`);
    console.log(`📁 Scanning: ${this.simulatorsPath}`);

    const report: MigrationReport = {
      totalSimulators: 0,
      successfulMigrations: 0,
      failedMigrations: 0,
      totalQuestionsImported: 0,
      totalPassagesImported: 0,
      results: [],
      errors: [],
      startTime,
      endTime: new Date(),
      duration: 0
    };

    try {
      // Scan for simulator directories
      const simulatorPaths = await this.scanSimulatorDirectories();
      report.totalSimulators = simulatorPaths.length;

      console.log(`📊 Found ${simulatorPaths.length} simulator directories`);

      // Process each simulator
      for (const simulatorPath of simulatorPaths) {
        console.log(`\n🔄 Processing: ${simulatorPath}`);

        const result = await this.migrateSimulator(simulatorPath);
        report.results.push(result);

        if (result.success) {
          report.successfulMigrations++;
          report.totalQuestionsImported += result.questionsImported;
          report.totalPassagesImported += result.passagesImported;
          console.log(`✅ Success: ${result.questionsImported} questions, ${result.passagesImported} passages`);
        } else {
          report.failedMigrations++;
          report.errors.push(...result.errors);
          console.log(`❌ Failed: ${result.errors.join(', ')}`);
        }
      }

      // Generate import report
      await this.generateImportReport(report);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      report.errors.push(errorMessage);
      console.error(`💥 Migration failed: ${errorMessage}`);
    }

    report.endTime = new Date();
    report.duration = report.endTime.getTime() - report.startTime.getTime();

    this.printSummary(report);
    return report;
  }

  /**
   * Scan for simulator directories
   */
  async scanSimulatorDirectories(): Promise<string[]> {
    const simulatorPaths: string[] = [];

    try {
      const languages = await fs.readdir(this.simulatorsPath);

      for (const language of languages) {
        if (language.startsWith('.')) continue;

        const languagePath = path.join(this.simulatorsPath, language);
        const languageStat = await fs.stat(languagePath);

        if (!languageStat.isDirectory()) continue;

        const exams = await fs.readdir(languagePath);

        for (const exam of exams) {
          if (exam.startsWith('.')) continue;

          const examPath = path.join(languagePath, exam);
          const examStat = await fs.stat(examPath);

          if (examStat.isDirectory()) {
            simulatorPaths.push(examPath);
          }
        }
      }
    } catch (error) {
      console.error('Error scanning simulator directories:', error);
    }

    return simulatorPaths;
  }

  /**
   * Parse simulator metadata from directory path
   */
  parseSimulatorMetadata(dirPath: string): any {
    const relativePath = path.relative(this.simulatorsPath, dirPath);
    const pathParts = relativePath.split(path.sep);

    if (pathParts.length !== 2) {
      throw new Error(`Invalid simulator path structure: ${dirPath}`);
    }

    const [language, examFolder] = pathParts;

    // Parse exam folder name (e.g., "b2-first", "b2-cieacova")
    const parts = examFolder.split('-');
    const level = parts[0].toUpperCase();
    const provider = parts.slice(1).join('-').toUpperCase();

    return {
      language,
      level,
      provider,
      examFolder,
      relativePath,
      absolutePath: dirPath
    };
  }

  /**
   * Validate simulator structure
   */
  async validateSimulatorStructure(dirPath: string): Promise<SimulatorStructure> {
    const examLoader = new ExamLoaderService();
    return await examLoader.validateSimulatorStructure(dirPath);
  }

  /**
   * Migrate a single simulator
   */
  async migrateSimulator(dirPath: string): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      simulatorPath: dirPath,
      questionsImported: 0,
      passagesImported: 0,
      sectionsImported: 0,
      errors: [],
      warnings: [],
      processingTime: 0
    };

    try {
      // Parse metadata
      const metadata = this.parseSimulatorMetadata(dirPath);
      console.log(`📋 Metadata: ${metadata.language}/${metadata.level}/${metadata.provider}`);

      // Validate structure
      const structure = await this.validateSimulatorStructure(dirPath);
      if (!structure.isValid) {
        result.errors.push(`Invalid structure: ${structure.errors.join(', ')}`);
        return result;
      }

      // Parse HTML simulator
      const examLoader = new ExamLoaderService();
      const parsedData = await examLoader.parseHtmlSimulator(dirPath);

      // Convert to database format
      const examData = examLoader.mapSimulatorToExamData(parsedData);

      if (!this.isDryRun) {
        // Check for existing exam template
        const { data: existingTemplate } = await this.supabase
          .from('exam_templates')
          .select('id')
          .eq('language', examData.examTemplate.language)
          .eq('level', examData.examTemplate.level)
          .eq('provider', examData.examTemplate.provider)
          .eq('skill', examData.examTemplate.skill)
          .single();

        if (existingTemplate) {
          result.warnings.push(`Exam template already exists: ${existingTemplate.id}`);
          result.examTemplateId = existingTemplate.id;
        } else {
          // Insert exam template
          const { data: newTemplate, error: templateError } = await this.supabase
            .from('exam_templates')
            .insert(examData.examTemplate)
            .select('id')
            .single();

          if (templateError) {
            result.errors.push(`Template insert error: ${templateError.message}`);
            return result;
          }

          result.examTemplateId = newTemplate.id;
        }

        // Insert exam content
        if (result.examTemplateId) {
          await this.insertExamContent(result.examTemplateId, examData.examContent, result);
        }

        // Log import
        await this.logImport(result, examData.importMetadata);
      } else {
        // Dry run - just count what would be imported
        result.examTemplateId = 'dry-run';
        result.questionsImported = examData.examContent.questions.length;
        result.passagesImported = examData.examContent.passages.length;
        result.sectionsImported = examData.examContent.sections.length;
      }

      result.success = result.errors.length === 0;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMessage);
    }

    result.processingTime = Date.now() - startTime;
    return result;
  }

  /**
   * Insert exam content (sections, passages, questions)
   */
  private async insertExamContent(
    examTemplateId: string,
    examContent: any,
    result: MigrationResult
  ): Promise<void> {
    try {
      // Insert sections
      if (examContent.sections.length > 0) {
        const sectionsToInsert = examContent.sections.map((section: any) => ({
          ...section,
          exam_template_id: examTemplateId
        }));

        const { error: sectionsError } = await this.supabase
          .from('exam_sections')
          .insert(sectionsToInsert);

        if (sectionsError) {
          result.errors.push(`Sections insert error: ${sectionsError.message}`);
          return;
        }

        result.sectionsImported = sectionsToInsert.length;
      }

      // Insert passages
      if (examContent.passages.length > 0) {
        const passagesToInsert = examContent.passages.map((passage: any) => ({
          ...passage,
          exam_template_id: examTemplateId
        }));

        const { error: passagesError } = await this.supabase
          .from('exam_passages')
          .insert(passagesToInsert);

        if (passagesError) {
          result.errors.push(`Passages insert error: ${passagesError.message}`);
          return;
        }

        result.passagesImported = passagesToInsert.length;
      }

      // Insert questions
      if (examContent.questions.length > 0) {
        const questionsToInsert = examContent.questions.map((question: any) => ({
          ...question,
          exam_template_id: examTemplateId
        }));

        const { error: questionsError } = await this.supabase
          .from('exam_content')
          .insert(questionsToInsert);

        if (questionsError) {
          result.errors.push(`Questions insert error: ${questionsError.message}`);
          return;
        }

        result.questionsImported = questionsToInsert.length;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(`Content insert error: ${errorMessage}`);
    }
  }

  /**
   * Log import to database
   */
  private async logImport(result: MigrationResult, importMetadata: any): Promise<void> {
    try {
      const logEntry = {
        import_type: 'html_simulator',
        source_path: result.simulatorPath,
        exam_template_id: result.examTemplateId,
        status: result.success ? 'success' : 'failed',
        summary: {
          questions_imported: result.questionsImported,
          passages_imported: result.passagesImported,
          sections_imported: result.sectionsImported,
          processing_time: result.processingTime,
          errors: result.errors,
          warnings: result.warnings
        },
        metadata: importMetadata,
        created_at: new Date().toISOString()
      };

      await this.supabase
        .from('exam_import_logs')
        .insert(logEntry);

    } catch (error) {
      console.warn('Failed to log import:', error);
    }
  }

  /**
   * Generate detailed import report
   */
  private async generateImportReport(report: MigrationReport): Promise<void> {
    const reportPath = path.join(process.cwd(), 'migration-report.json');

    try {
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📊 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.warn('Failed to save report:', error);
    }
  }

  /**
   * Print migration summary
   */
  private printSummary(report: MigrationReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Total simulators: ${report.totalSimulators}`);
    console.log(`✅ Successful: ${report.successfulMigrations}`);
    console.log(`❌ Failed: ${report.failedMigrations}`);
    console.log(`❓ Questions imported: ${report.totalQuestionsImported}`);
    console.log(`📖 Passages imported: ${report.totalPassagesImported}`);
    console.log(`⏱️  Duration: ${Math.round(report.duration / 1000)}s`);

    if (report.errors.length > 0) {
      console.log('\n🚨 ERRORS:');
      report.errors.forEach(error => console.log(`  - ${error}`));
    }

    const successRate = report.totalSimulators > 0
      ? Math.round((report.successfulMigrations / report.totalSimulators) * 100)
      : 0;

    console.log(`\n🎯 Success Rate: ${successRate}%`);
    console.log('='.repeat(60));
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  try {
    const migrator = new HtmlSimulatorMigrator(isDryRun);
    const report = await migrator.migrate();

    process.exit(report.failedMigrations > 0 ? 1 : 0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { HtmlSimulatorMigrator };