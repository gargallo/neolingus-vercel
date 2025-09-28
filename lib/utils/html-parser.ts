import * as cheerio from 'cheerio';
import { ParsedQuestion, ParsedPassage, ParsedExamSection, HtmlParsingContext, SimulatorMetadata } from '@/lib/types/exam-migration';

export class HtmlParser {
  static parseHtmlDocument(htmlContent: string): cheerio.CheerioAPI {
    return cheerio.load(htmlContent);
  }

  static extractExamMetadata($: cheerio.CheerioAPI, context: Partial<HtmlParsingContext> = {}): Partial<SimulatorMetadata> {
    const metadata: Partial<SimulatorMetadata> = {};

    // Extract title from h1, title tag, or data attributes
    metadata.title = $('h1').first().text().trim() ||
                    $('title').text().trim() ||
                    $('[data-exam-title]').attr('data-exam-title') ||
                    'Untitled Exam';

    // Extract description
    metadata.description = $('.exam-description').first().text().trim() ||
                          $('meta[name="description"]').attr('content') ||
                          $('.description').first().text().trim();

    // Extract duration from timer elements or data attributes
    const durationText = $('.timer').text() ||
                        $('[data-duration]').attr('data-duration') ||
                        $('.duration').text();

    if (durationText) {
      const minutes = this.parseDurationToMinutes(durationText);
      if (minutes > 0) metadata.duration = minutes;
    }

    // Count sections from navigation pills or section headers
    const navPills = $('.nav-pill');
    const sectionHeaders = $('h2, h3, .section-header');
    metadata.sectionsCount = Math.max(navPills.length, sectionHeaders.length);

    return metadata;
  }

  static extractTextPassages($: cheerio.CheerioAPI): ParsedPassage[] {
    const passages: ParsedPassage[] = [];
    let passageIndex = 0;

    // Look for various passage containers
    const passageSelectors = [
      '.text-passage',
      '.passage',
      '.reading-passage',
      '.listening-passage',
      '.passage-container',
      '[data-passage]'
    ];

    passageSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const $passage = $(element);
        const passageId = $passage.attr('id') ||
                         $passage.attr('data-passage-id') ||
                         `passage_${passageIndex}`;

        const title = $passage.find('h3, h4, .passage-title').first().text().trim() ||
                     $passage.attr('data-title') ||
                     `Passage ${passageIndex + 1}`;

        const content = $passage.find('.passage-content, .text-content').text().trim() ||
                       $passage.text().trim();

        if (content) {
          // Determine passage type and skill from context
          const type = this.determinePassageType($passage);
          const skill = this.determineSkillFromContext($passage, type);

          passages.push({
            id: passageId,
            title,
            content: this.sanitizeHtmlContent(content),
            type,
            skill,
            order_index: passageIndex
          });

          passageIndex++;
        }
      });
    });

    return passages;
  }

  static extractQuestionItems($: cheerio.CheerioAPI): ParsedQuestion[] {
    const questions: ParsedQuestion[] = [];
    let questionIndex = 0;

    // Look for various question containers
    const questionSelectors = [
      '.question-item',
      '.question',
      '.question-container',
      '[data-question]',
      '.quiz-question'
    ];

    questionSelectors.forEach(selector => {
      $(selector).each((index, element) => {
        const $question = $(element);
        const questionId = $question.attr('id') ||
                          $question.attr('data-question-id') ||
                          `question_${questionIndex}`;

        const questionText = this.extractQuestionText($question);
        if (!questionText) return; // Skip if no question text found

        const question: ParsedQuestion = {
          id: questionId,
          type: this.determineQuestionType($question),
          question_text: questionText,
          order_index: questionIndex,
          skill: this.determineSkillFromContext($question),
          passage_id: this.findAssociatedPassage($question)
        };

        // Extract options for multiple choice questions
        if (question.type === 'multiple_choice') {
          question.options = this.extractQuestionOptions($question);
        }

        // Extract instructions
        const instructions = $question.find('.instructions, .question-instructions').text().trim();
        if (instructions) {
          question.instructions = instructions;
        }

        // Extract points if specified
        const pointsText = $question.find('.points, [data-points]').text();
        const points = this.parsePoints(pointsText);
        if (points > 0) {
          question.points = points;
        }

        questions.push(question);
        questionIndex++;
      });
    });

    return questions;
  }

  static extractNavigationTiming($: cheerio.CheerioAPI): ParsedExamSection[] {
    const sections: ParsedExamSection[] = [];
    let sectionIndex = 0;

    // Extract from navigation pills
    $('.nav-pill').each((index, element) => {
      const $pill = $(element);
      const name = $pill.text().trim();
      const duration = this.extractDurationFromElement($pill);
      const skill = this.inferSkillFromSectionName(name);

      if (name) {
        sections.push({
          id: `section_${sectionIndex}`,
          name,
          skill,
          duration,
          order_index: sectionIndex
        });
        sectionIndex++;
      }
    });

    // If no nav pills, extract from section headers
    if (sections.length === 0) {
      $('h2, h3, .section-header').each((index, element) => {
        const $header = $(element);
        const name = $header.text().trim();
        const duration = this.extractDurationFromElement($header) || 30; // Default 30 minutes
        const skill = this.inferSkillFromSectionName(name);

        if (name) {
          sections.push({
            id: `section_${sectionIndex}`,
            name,
            skill,
            duration,
            order_index: sectionIndex
          });
          sectionIndex++;
        }
      });
    }

    return sections;
  }

  static sanitizeHtmlContent(content: string): string {
    // Remove extra whitespace and normalize
    return content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  // Helper methods

  private static extractQuestionText($question: cheerio.Cheerio<any>): string {
    // Try various selectors for question text
    const textSelectors = [
      '.question-text',
      '.question-content',
      '.question-body',
      'p:first-child',
      '.text'
    ];

    for (const selector of textSelectors) {
      const text = $question.find(selector).first().text().trim();
      if (text) return this.sanitizeHtmlContent(text);
    }

    // Fallback: extract text from the question element itself, excluding options
    const $clone = $question.clone();
    $clone.find('.options, .choices, input, button').remove();
    return this.sanitizeHtmlContent($clone.text());
  }

  private static extractQuestionOptions($question: cheerio.Cheerio<any>): string[] {
    const options: string[] = [];

    // Try various option selectors
    const optionSelectors = [
      '.options input[type="radio"] + label',
      '.choices input[type="radio"] + label',
      '.option-text',
      '.choice-text',
      'label[for*="option"]',
      '.options li',
      '.choices li'
    ];

    for (const selector of optionSelectors) {
      $question.find(selector).each((index, element) => {
        const text = cheerio.load(element).text().trim();
        if (text && !options.includes(text)) {
          options.push(this.sanitizeHtmlContent(text));
        }
      });
      if (options.length > 0) break;
    }

    return options;
  }

  private static determineQuestionType($question: cheerio.Cheerio<any>): 'multiple_choice' | 'fill_blank' | 'essay' {
    if ($question.find('input[type="radio"], input[type="checkbox"]').length > 0) {
      return 'multiple_choice';
    }
    if ($question.find('input[type="text"], textarea').length > 0) {
      const inputCount = $question.find('input[type="text"]').length;
      return inputCount === 1 ? 'fill_blank' : 'essay';
    }
    if ($question.find('textarea, .essay-area').length > 0) {
      return 'essay';
    }
    // Default to multiple choice if unclear
    return 'multiple_choice';
  }

  private static determinePassageType($passage: cheerio.Cheerio<any>): 'reading' | 'listening' | 'use_of_english' {
    const classNames = $passage.attr('class') || '';
    const dataType = $passage.attr('data-type') || '';

    if (classNames.includes('listening') || dataType.includes('listening')) {
      return 'listening';
    }
    if (classNames.includes('use-of-english') || dataType.includes('use-of-english')) {
      return 'use_of_english';
    }
    return 'reading'; // Default
  }

  private static determineSkillFromContext($element: cheerio.Cheerio<any>, fallback = 'reading'): string {
    const classNames = $element.attr('class') || '';
    const dataSkill = $element.attr('data-skill') || '';

    const skills = ['reading', 'listening', 'writing', 'speaking', 'use_of_english'];

    for (const skill of skills) {
      if (classNames.includes(skill) || dataSkill.includes(skill)) {
        return skill;
      }
    }

    return fallback;
  }

  private static findAssociatedPassage($question: cheerio.Cheerio<any>): string | undefined {
    const passageId = $question.attr('data-passage-id') ||
                     $question.attr('data-passage') ||
                     $question.closest('[data-passage-id]').attr('data-passage-id');

    return passageId;
  }

  private static extractDurationFromElement($element: cheerio.Cheerio<any>): number {
    const durationText = $element.attr('data-duration') ||
                        $element.find('.duration').text() ||
                        $element.text();

    return this.parseDurationToMinutes(durationText);
  }

  private static parseDurationToMinutes(durationText: string): number {
    if (!durationText) return 0;

    // Match various duration formats: "30 min", "1h 30m", "90 minutes"
    const hourMatch = durationText.match(/(\d+)\s*h(?:our)?/i);
    const minuteMatch = durationText.match(/(\d+)\s*m(?:in)?/i);

    let totalMinutes = 0;
    if (hourMatch) totalMinutes += parseInt(hourMatch[1]) * 60;
    if (minuteMatch) totalMinutes += parseInt(minuteMatch[1]);

    // If no specific format, try to extract just the number
    if (totalMinutes === 0) {
      const numberMatch = durationText.match(/(\d+)/);
      if (numberMatch) totalMinutes = parseInt(numberMatch[1]);
    }

    return totalMinutes;
  }

  private static parsePoints(pointsText: string): number {
    if (!pointsText) return 0;
    const match = pointsText.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private static inferSkillFromSectionName(name: string): string {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('reading')) return 'reading';
    if (lowerName.includes('listening')) return 'listening';
    if (lowerName.includes('writing')) return 'writing';
    if (lowerName.includes('speaking')) return 'speaking';
    if (lowerName.includes('use of english') || lowerName.includes('grammar')) return 'use_of_english';

    return 'reading'; // Default
  }
}