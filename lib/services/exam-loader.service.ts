// =============================================
// EXAM LOADER SERVICE
// =============================================
// Service for loading official exams from real-exams/ directory

import fs from 'fs/promises';
import path from 'path';
import { parse } from 'node-html-parser';
import { HtmlParser } from '@/lib/utils/html-parser';
import { JsParser } from '@/lib/utils/js-parser';
import type {
  ExamTemplate,
  ExamContent,
  Language,
  Level,
  Provider,
  Skill,
  QuestionType,
  ImportSummary,
  ImportError
} from '@/types/exam-system';
import {
  ParsedExamData,
  SimulatorMetadata,
  SimulatorStructure,
  HtmlParsingContext,
  ParsedQuestion,
  ParsedPassage,
  ParsedExamSection,
  AnswerKeyMap,
  ExamConfiguration
} from '@/lib/types/exam-migration';

export interface LoaderResult {
  success: boolean;
  template?: ExamTemplate;
  content?: ExamContent[];
  errors: ImportError[];
}

export interface ImportResult {
  success: boolean;
  summary: ImportSummary;
  errors: ImportError[];
  templatesCreated: ExamTemplate[];
  contentCreated: ExamContent[];
}

export class ExamLoaderService {
  private readonly realExamsPath: string;

  constructor() {
    this.realExamsPath = path.join(process.cwd(), 'real-exams');
  }

  /**
   * Get available exam directories
   */
  async getAvailableExams(): Promise<string[]> {
    try {
      const languages = await fs.readdir(this.realExamsPath);
      const exams: string[] = [];

      for (const lang of languages) {
        if (lang.startsWith('.')) continue;

        const langPath = path.join(this.realExamsPath, lang);
        const stat = await fs.stat(langPath);

        if (stat.isDirectory()) {
          const levels = await fs.readdir(langPath);

          for (const level of levels) {
            if (level.startsWith('.')) continue;

            const levelPath = path.join(langPath, level);
            const levelStat = await fs.stat(levelPath);

            if (levelStat.isDirectory()) {
              exams.push(path.join(lang, level));
            }
          }
        }
      }

      return exams;
    } catch (error) {
      console.error('Error getting available exams:', error);
      return [];
    }
  }

  /**
   * Load a single exam from directory
   */
  async loadExam(examPath: string): Promise<LoaderResult> {
    const errors: ImportError[] = [];

    try {
      const fullPath = path.join(this.realExamsPath, examPath);
      const exists = await this.directoryExists(fullPath);

      if (!exists) {
        errors.push({
          file_path: examPath,
          error_type: 'not_found',
          error_message: 'Exam directory not found'
        });
        return { success: false, errors };
      }

      // Parse exam path to extract metadata
      const pathParts = examPath.split('/');
      if (pathParts.length < 2) {
        errors.push({
          file_path: examPath,
          error_type: 'invalid_path',
          error_message: 'Invalid exam path format'
        });
        return { success: false, errors };
      }

      const [languageCode, levelCode] = pathParts;
      const metadata = this.parseExamMetadata(languageCode, levelCode, examPath);

      if (!metadata) {
        errors.push({
          file_path: examPath,
          error_type: 'invalid_metadata',
          error_message: 'Could not parse exam metadata from path'
        });
        return { success: false, errors };
      }

      // Find exam files
      const examFiles = await this.findExamFiles(fullPath);

      // Load PDF content
      const pdfContent = await this.loadPDFContent(examFiles.pdf);

      // Load audio files
      const audioContent = await this.loadAudioContent(examFiles.audio);

      // Load HTML simulator
      const htmlContent = await this.loadHTMLSimulator(examFiles.html);

      // Create exam template
      const template = await this.createExamTemplate(metadata, examFiles, htmlContent);

      // Extract exam content from HTML simulator
      const content = await this.extractExamContent(template.id, htmlContent);

      return {
        success: true,
        template,
        content,
        errors
      };

    } catch (error) {
      errors.push({
        file_path: examPath,
        error_type: 'load_error',
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });
      return { success: false, errors };
    }
  }

  /**
   * Parse HTML simulator from directory path (NEW METHOD)
   */
  async parseHtmlSimulator(dirPath: string): Promise<ParsedExamData> {
    const structure = await this.validateSimulatorStructure(dirPath);

    if (!structure.isValid) {
      throw new Error(`Invalid simulator structure: ${structure.errors.join(', ')}`);
    }

    const metadata = this.extractMetadataFromPath(dirPath);
    const htmlContent = await this.readHtmlContent(dirPath);
    const jsContent = await this.readJsContent(dirPath);

    // Parse HTML content
    const $ = HtmlParser.parseHtmlDocument(htmlContent);

    const context: HtmlParsingContext = {
      document: $,
      language: metadata.language,
      provider: metadata.provider
    };

    // Extract exam components
    const htmlMetadata = HtmlParser.extractExamMetadata($, context);
    const questions = HtmlParser.extractQuestionItems($);
    const passages = HtmlParser.extractTextPassages($);
    const sections = HtmlParser.extractNavigationTiming($);

    // Parse JavaScript content for answer keys
    const jsContext = JsParser.parseJavaScriptFile(jsContent, path.join(dirPath, 'script.js'));
    const answerKeys = JsParser.extractAnswerKeys(jsContext);
    const configuration = JsParser.extractExamConfiguration(jsContext);

    // Validate answer keys
    const validation = JsParser.validateAnswerKeyFormat(answerKeys);
    if (!validation.valid) {
      console.warn(`Answer key validation warnings for ${dirPath}:`, validation.errors);
    }

    // Combine metadata
    const completeMetadata: SimulatorMetadata = {
      ...metadata,
      ...htmlMetadata,
      title: htmlMetadata.title || metadata.title || 'Untitled Exam',
      duration: htmlMetadata.duration || configuration?.timing?.total_duration || 120
    };

    return {
      metadata: completeMetadata,
      sections: this.enhanceSections(sections, configuration),
      passages: this.enhancePassages(passages, completeMetadata),
      questions: this.enhanceQuestions(questions, answerKeys, completeMetadata),
      answerKeys,
      configuration: this.buildExamConfiguration(configuration, completeMetadata, sections, questions)
    };
  }

  /**
   * Extract questions from HTML content (NEW METHOD)
   */
  extractQuestionsFromHtml(htmlContent: string, context?: HtmlParsingContext): ParsedQuestion[] {
    const $ = HtmlParser.parseHtmlDocument(htmlContent);
    return HtmlParser.extractQuestionItems($);
  }

  /**
   * Extract answer keys from JavaScript content (NEW METHOD)
   */
  extractAnswerKeysFromJs(jsContent: string, filePath?: string): AnswerKeyMap {
    const context = JsParser.parseJavaScriptFile(jsContent, filePath);
    return JsParser.extractAnswerKeys(context);
  }

  /**
   * Extract metadata from HTML content (NEW METHOD)
   */
  extractMetadataFromHtml(htmlContent: string, context?: HtmlParsingContext): Partial<SimulatorMetadata> {
    const $ = HtmlParser.parseHtmlDocument(htmlContent);
    return HtmlParser.extractExamMetadata($, context);
  }

  /**
   * Map simulator data to exam format expected by import scripts (NEW METHOD)
   */
  mapSimulatorToExamData(simulatorData: ParsedExamData): any {
    const { metadata, questions, passages, sections, answerKeys, configuration } = simulatorData;

    return {
      // Exam template data
      examTemplate: {
        language: metadata.language,
        level: metadata.level,
        provider: metadata.provider,
        skill: metadata.skill,
        title: metadata.title,
        description: metadata.description,
        duration: metadata.duration,
        configuration: configuration,
        is_active: true,
        created_at: new Date().toISOString()
      },

      // Exam content data
      examContent: {
        sections: sections.map(section => ({
          ...section,
          exam_template_id: null, // Will be set during import
        })),
        passages: passages.map(passage => ({
          ...passage,
          exam_template_id: null, // Will be set during import
        })),
        questions: questions.map(question => ({
          ...question,
          exam_template_id: null, // Will be set during import
          section_id: this.findQuestionSection(question, sections),
          created_at: new Date().toISOString()
        }))
      },

      // Additional metadata for import process
      importMetadata: {
        source_path: simulatorData.metadata.provider,
        import_type: 'html_simulator',
        total_questions: questions.length,
        total_passages: passages.length,
        total_sections: sections.length,
        has_answer_keys: Object.keys(answerKeys).length > 0
      }
    };
  }

  /**
   * Validate simulator directory structure (NEW METHOD)
   */
  async validateSimulatorStructure(dirPath: string): Promise<SimulatorStructure> {
    const structure: SimulatorStructure = {
      path: dirPath,
      hasIndexHtml: false,
      hasScriptJs: false,
      hasStyleCss: false,
      additionalFiles: [],
      isValid: false,
      errors: []
    };

    try {
      const files = await fs.readdir(dirPath);

      structure.hasIndexHtml = files.includes('index.html');
      structure.hasScriptJs = files.includes('script.js');
      structure.hasStyleCss = files.includes('style.css') || files.includes('styles.css');
      structure.additionalFiles = files.filter(file =>
        !['index.html', 'script.js', 'style.css', 'styles.css'].includes(file)
      );

      // Validation rules
      if (!structure.hasIndexHtml) {
        structure.errors.push('Missing index.html file');
      }

      if (!structure.hasScriptJs) {
        structure.errors.push('Missing script.js file');
      }

      // Check if files are readable
      if (structure.hasIndexHtml) {
        try {
          await fs.access(path.join(dirPath, 'index.html'), fs.constants.R_OK);
        } catch {
          structure.errors.push('index.html is not readable');
        }
      }

      if (structure.hasScriptJs) {
        try {
          await fs.access(path.join(dirPath, 'script.js'), fs.constants.R_OK);
        } catch {
          structure.errors.push('script.js is not readable');
        }
      }

      structure.isValid = structure.errors.length === 0;

    } catch (error) {
      structure.errors.push(`Cannot access directory: ${error}`);
    }

    return structure;
  }

  /**
   * Import all exams from real-exams directory
   */
  async importAllExams(): Promise<ImportResult> {
    const startTime = Date.now();
    const summary: ImportSummary = {
      total_files_processed: 0,
      successful_imports: 0,
      failed_imports: 0,
      skipped_imports: 0,
      processing_time: 0,
      file_types: {}
    };
    const errors: ImportError[] = [];
    const templatesCreated: ExamTemplate[] = [];
    const contentCreated: ExamContent[] = [];

    try {
      const availableExams = await this.getAvailableExams();
      summary.total_files_processed = availableExams.length;

      for (const examPath of availableExams) {
        const result = await this.loadExam(examPath);

        if (result.success && result.template && result.content) {
          templatesCreated.push(result.template);
          contentCreated.push(...result.content);
          summary.successful_imports++;
        } else {
          summary.failed_imports++;
          errors.push(...result.errors);
        }
      }

      summary.processing_time = Math.round((Date.now() - startTime) / 1000);

      return {
        success: summary.failed_imports === 0,
        summary,
        errors,
        templatesCreated,
        contentCreated
      };

    } catch (error) {
      errors.push({
        file_path: 'all',
        error_type: 'import_error',
        error_message: error instanceof Error ? error.message : 'Unknown import error'
      });

      return {
        success: false,
        summary,
        errors,
        templatesCreated,
        contentCreated
      };
    }
  }

  // Private helper methods (NEW METHODS)

  private extractMetadataFromPath(dirPath: string): SimulatorMetadata {
    const pathParts = dirPath.split(path.sep);
    const simulatorIndex = pathParts.findIndex(part => part === 'simulators');

    if (simulatorIndex === -1 || simulatorIndex + 2 >= pathParts.length) {
      throw new Error(`Invalid simulator path structure: ${dirPath}`);
    }

    const language = pathParts[simulatorIndex + 1];
    const examFolder = pathParts[simulatorIndex + 2];

    // Parse exam folder name (e.g., "b2-first", "b2-cieacova")
    const parts = examFolder.split('-');
    const level = parts[0].toUpperCase();
    const provider = parts.slice(1).join('-').toUpperCase();

    return {
      language,
      level,
      provider,
      skill: 'general', // Will be refined during HTML parsing
      title: `${provider} ${level} Exam`,
      description: `Official ${provider} ${level} level exam simulator`
    };
  }

  private async readHtmlContent(dirPath: string): Promise<string> {
    const htmlPath = path.join(dirPath, 'index.html');
    return await fs.readFile(htmlPath, 'utf-8');
  }

  private async readJsContent(dirPath: string): Promise<string> {
    const jsPath = path.join(dirPath, 'script.js');
    try {
      return await fs.readFile(jsPath, 'utf-8');
    } catch (error) {
      console.warn(`Could not read script.js from ${dirPath}:`, error);
      return '// No script content found';
    }
  }

  private enhanceSections(
    sections: ParsedExamSection[],
    configuration?: Partial<ExamConfiguration>
  ): ParsedExamSection[] {
    return sections.map((section, index) => ({
      ...section,
      duration: section.duration ||
                configuration?.timing?.section_durations?.[section.id] ||
                configuration?.timing?.total_duration ?
                  Math.floor(configuration.timing.total_duration / sections.length) :
                  30, // Default 30 minutes per section
      instructions: section.instructions || `Instructions for ${section.name}`
    }));
  }

  private enhancePassages(
    passages: ParsedPassage[],
    metadata: SimulatorMetadata
  ): ParsedPassage[] {
    return passages.map(passage => ({
      ...passage,
      skill: passage.skill || metadata.skill || 'reading'
    }));
  }

  private enhanceQuestions(
    questions: ParsedQuestion[],
    answerKeys: AnswerKeyMap,
    metadata: SimulatorMetadata
  ): ParsedQuestion[] {
    return questions.map(question => {
      const answerData = answerKeys[question.id] || answerKeys[`question_${question.order_index}`];

      return {
        ...question,
        correct_answer: answerData?.correct,
        points: answerData?.points || question.points || 1,
        explanation: answerData?.explanation,
        skill: question.skill || metadata.skill || 'reading'
      };
    });
  }

  private buildExamConfiguration(
    jsConfig: Partial<ExamConfiguration> | undefined,
    metadata: SimulatorMetadata,
    sections: ParsedExamSection[],
    questions: ParsedQuestion[]
  ): ExamConfiguration {
    const totalDuration = metadata.duration || jsConfig?.timing?.total_duration || 120;
    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    return {
      timing: {
        total_duration: totalDuration,
        section_durations: jsConfig?.timing?.section_durations ||
          sections.reduce((acc, section) => {
            acc[section.id] = section.duration;
            return acc;
          }, {} as { [key: string]: number }),
        warning_times: jsConfig?.timing?.warning_times || [10, 5, 1] // 10, 5, 1 minutes remaining
      },
      scoring: {
        total_points: totalPoints,
        passing_score: jsConfig?.scoring?.passing_score || Math.floor(totalPoints * 0.6),
        section_weights: jsConfig?.scoring?.section_weights
      },
      navigation: {
        allow_review: jsConfig?.navigation?.allow_review ?? true,
        allow_skip: jsConfig?.navigation?.allow_skip ?? true,
        show_progress: jsConfig?.navigation?.show_progress ?? true
      }
    };
  }

  private findQuestionSection(question: ParsedQuestion, sections: ParsedExamSection[]): string | undefined {
    // Try to match question skill with section skill
    const matchingSection = sections.find(section =>
      section.skill === question.skill ||
      section.name.toLowerCase().includes(question.skill?.toLowerCase() || '')
    );

    return matchingSection?.id;
  }

  /**
   * Parse exam metadata from path
   */
  private parseExamMetadata(languageCode: string, levelCode: string, fullPath: string) {
    // Map directory names to our types
    const languageMap: Record<string, Language> = {
      '01-INGLES': 'english',
      '02-VALENCIANO': 'valenciano',
      'english': 'english',
      'valenciano': 'valenciano'
    };

    const levelMap: Record<string, Level> = {
      'A2': 'A2',
      'B1': 'B1',
      'B2': 'B2',
      'C1': 'C1',
      'C2': 'C2'
    };

    const language = languageMap[languageCode];
    const level = levelMap[levelCode];

    if (!language || !level) {
      return null;
    }

    // Try to determine provider and skill from path
    const provider = this.detectProvider(fullPath);
    const skill = this.detectSkill(fullPath);

    return {
      language,
      level,
      provider: provider || 'cambridge',
      skill: skill || 'integrated'
    };
  }

  /**
   * Detect provider from path
   */
  private detectProvider(examPath: string): Provider {
    const pathLower = examPath.toLowerCase();

    if (pathLower.includes('cambridge')) return 'cambridge';
    if (pathLower.includes('eoi')) return 'eoi';
    if (pathLower.includes('cieacova')) return 'cieacova';
    if (pathLower.includes('jqcv')) return 'jqcv';
    if (pathLower.includes('dele')) return 'dele';
    if (pathLower.includes('delf')) return 'delf';
    if (pathLower.includes('goethe')) return 'goethe';

    return 'cambridge'; // default
  }

  /**
   * Detect skill from path
   */
  private detectSkill(examPath: string): Skill {
    const pathLower = examPath.toLowerCase();

    if (pathLower.includes('reading')) return 'reading';
    if (pathLower.includes('writing')) return 'writing';
    if (pathLower.includes('listening')) return 'listening';
    if (pathLower.includes('speaking')) return 'speaking';
    if (pathLower.includes('use_of_english')) return 'use_of_english';
    if (pathLower.includes('mediation')) return 'mediation';

    return 'integrated'; // default for full exams
  }

  /**
   * Find exam files in directory
   */
  private async findExamFiles(examDir: string) {
    const files = await fs.readdir(examDir);

    const result = {
      pdf: [] as string[],
      audio: [] as string[],
      html: [] as string[]
    };

    for (const file of files) {
      const filePath = path.join(examDir, file);
      const ext = path.extname(file).toLowerCase();

      if (ext === '.pdf') {
        result.pdf.push(filePath);
      } else if (['.mp3', '.wav', '.m4a'].includes(ext)) {
        result.audio.push(filePath);
      } else if (ext === '.html') {
        result.html.push(filePath);
      }
    }

    return result;
  }

  /**
   * Load PDF content (metadata only for now)
   */
  private async loadPDFContent(pdfFiles: string[]) {
    // For now, just return file paths
    // In the future, we could extract text using pdf-parse
    return pdfFiles.map(file => ({
      path: file,
      size: 0, // We'd get this from fs.stat
      pages: 0 // We'd get this from PDF parsing
    }));
  }

  /**
   * Load audio content metadata
   */
  private async loadAudioContent(audioFiles: string[]) {
    // For now, just return file paths
    // In the future, we could extract duration using audio libraries
    return audioFiles.map(file => ({
      path: file,
      duration: 0, // We'd get this from audio metadata
      format: path.extname(file).slice(1)
    }));
  }

  /**
   * Load HTML simulator content
   */
  private async loadHTMLSimulator(htmlFiles: string[]) {
    if (htmlFiles.length === 0) return null;

    try {
      const htmlContent = await fs.readFile(htmlFiles[0], 'utf-8');
      const root = parse(htmlContent);

      return {
        path: htmlFiles[0],
        content: htmlContent,
        parsed: root
      };
    } catch (error) {
      console.error('Error loading HTML simulator:', error);
      return null;
    }
  }

  /**
   * Create exam template from loaded data
   */
  private async createExamTemplate(
    metadata: any,
    examFiles: any,
    htmlContent: any
  ): Promise<ExamTemplate> {
    const id = `${metadata.language}_${metadata.level}_${metadata.provider}_${metadata.skill}`;

    return {
      id,
      language: metadata.language,
      level: metadata.level,
      provider: metadata.provider,
      skill: metadata.skill,
      name: `${metadata.language.charAt(0).toUpperCase() + metadata.language.slice(1)} ${metadata.level} - ${metadata.provider}`,
      description: `Official ${metadata.provider} exam for ${metadata.language} level ${metadata.level}`,
      difficulty_level: this.mapLevelToDifficulty(metadata.level),
      estimated_duration: this.estimateDuration(metadata.level, metadata.skill),
      total_questions: htmlContent ? this.countQuestions(htmlContent) : undefined,
      max_score: 100,
      official_source_path: examFiles.pdf[0] || '',
      pdf_path: examFiles.pdf[0] || '',
      audio_paths: examFiles.audio,
      html_simulator_path: examFiles.html[0] || '',
      structure: this.createExamStructure(htmlContent),
      sections: this.createExamSections(htmlContent),
      scoring_criteria: this.createScoringCriteria(metadata.level),
      instructions: this.extractInstructions(htmlContent),
      is_active: true,
      is_published: false,
      version: '1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  /**
   * Extract exam content from HTML simulator
   */
  private async extractExamContent(templateId: string, htmlContent: any): Promise<ExamContent[]> {
    if (!htmlContent) return [];

    const content: ExamContent[] = [];

    // This is a simplified version - we'd need more sophisticated parsing
    // for real HTML simulators

    // For now, create some sample content
    const sampleContent: ExamContent = {
      id: `${templateId}_q1`,
      template_id: templateId,
      section_id: 'reading_part_1',
      part_id: 'part_1',
      question_number: 1,
      question_type: 'multiple_choice',
      question_text: 'Sample question extracted from HTML',
      question_data: {
        type: 'multiple_choice',
        text: 'Sample question extracted from HTML',
        options: []
      },
      correct_answer: 'A',
      answer_options: [],
      media_urls: {},
      attachments: [],
      points: 1,
      scoring_rubric: {
        criteria: [],
        total_points: 1,
        grading_scale: { levels: [], pass_threshold: 60 }
      },
      difficulty_tags: [],
      topic_tags: [],
      skills_tested: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    content.push(sampleContent);
    return content;
  }

  /**
   * Helper methods
   */
  private async directoryExists(dir: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dir);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private mapLevelToDifficulty(level: Level) {
    if (['A1', 'A2'].includes(level)) return 'basic';
    if (['B1', 'B2'].includes(level)) return 'intermediate';
    return 'advanced';
  }

  private estimateDuration(level: Level, skill: Skill): number {
    const baseDurations: Record<Skill, number> = {
      reading: 60,
      writing: 90,
      listening: 45,
      speaking: 15,
      use_of_english: 75,
      mediation: 60,
      integrated: 180
    };

    const levelMultiplier = {
      A1: 0.8,
      A2: 0.9,
      B1: 1.0,
      B2: 1.1,
      C1: 1.2,
      C2: 1.3
    };

    return Math.round(baseDurations[skill] * levelMultiplier[level]);
  }

  private countQuestions(htmlContent: any): number {
    // This would parse the HTML to count actual questions
    // For now, return a default
    return 30;
  }

  private createExamStructure(htmlContent: any) {
    return {
      title: 'Official Exam',
      total_duration: 180,
      sections: ['reading', 'writing', 'listening', 'speaking'],
      timing_rules: {
        strict_timing: true,
        warning_time: 5,
        auto_submit: true,
        section_breaks: true,
        break_duration: 10
      },
      navigation_rules: {
        allow_back: true,
        allow_skip: true,
        allow_flag: true,
        allow_review: true,
        show_progress: true
      },
      scoring_method: 'weighted'
    };
  }

  private createExamSections(htmlContent: any) {
    // This would parse the HTML to create actual sections
    return [
      {
        id: 'reading',
        name: 'Reading',
        duration: 60,
        instructions: 'Read the texts and answer the questions.',
        parts: [
          {
            id: 'part_1',
            name: 'Part 1',
            description: 'Multiple choice questions',
            instructions: 'Choose the best answer.',
            question_count: 10,
            points_per_question: 1,
            question_types: ['multiple_choice' as QuestionType]
          }
        ],
        timing_strict: true,
        allow_review: true
      }
    ];
  }

  private createScoringCriteria(level: Level) {
    return {
      passing_score: 60,
      partial_credit: true,
      negative_marking: false,
      section_weights: {
        reading: 0.25,
        writing: 0.25,
        listening: 0.25,
        speaking: 0.25
      }
    };
  }

  private extractInstructions(htmlContent: any) {
    return {
      general: 'This is an official exam. Please read all instructions carefully.',
      sections: {
        reading: 'Read each text carefully and answer the questions.',
        writing: 'Write your answers clearly and check your work.',
        listening: 'Listen carefully to each recording.',
        speaking: 'Speak clearly and naturally.'
      },
      technical: [
        'Use a black or blue pen',
        'Do not use correction fluid',
        'Mark your answers clearly'
      ],
      warnings: [
        'Mobile phones are not allowed',
        'You may not leave during the listening test',
        'Late arrival may result in exclusion'
      ]
    };
  }
}