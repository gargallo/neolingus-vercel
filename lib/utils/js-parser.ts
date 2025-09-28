import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { AnswerKeyMap, ExamConfiguration, JsParsingContext } from '@/lib/types/exam-migration';

export class JsParser {
  static parseJavaScriptFile(jsContent: string, filePath: string = ''): JsParsingContext {
    try {
      const ast = parse(jsContent, {
        sourceType: 'module',
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        plugins: ['jsx', 'typescript', 'decorators-legacy']
      });

      return {
        ast,
        sourceCode: jsContent,
        filePath,
        variables: new Map()
      };
    } catch (error) {
      throw new Error(`Failed to parse JavaScript file ${filePath}: ${error}`);
    }
  }

  static extractAnswerKeys(context: JsParsingContext): AnswerKeyMap {
    const answerKeys: AnswerKeyMap = {};
    const { ast } = context;

    // Common variable names for answer keys
    const answerKeyVariables = [
      'answerKeys',
      'correctAnswers',
      'answers',
      'answerKey',
      'solutions',
      'results'
    ];

    traverse(ast, {
      VariableDeclarator(path) {
        const { node } = path;

        if (t.isIdentifier(node.id)) {
          const variableName = node.id.name;

          if (answerKeyVariables.some(name =>
            variableName.toLowerCase().includes(name.toLowerCase())
          )) {
            const extractedKeys = this.extractAnswerKeysFromNode(node.init);
            Object.assign(answerKeys, extractedKeys);
          }
        }
      },

      ObjectProperty(path) {
        const { node } = path;

        if (t.isIdentifier(node.key) || t.isStringLiteral(node.key)) {
          const keyName = t.isIdentifier(node.key) ? node.key.name : node.key.value;

          if (answerKeyVariables.some(name =>
            keyName.toLowerCase().includes(name.toLowerCase())
          )) {
            const extractedKeys = this.extractAnswerKeysFromNode(node.value);
            Object.assign(answerKeys, extractedKeys);
          }
        }
      }
    });

    return answerKeys;
  }

  static extractScoringRubrics(context: JsParsingContext): any {
    const { ast } = context;
    const rubrics: any = {};

    const scoringVariables = [
      'scoring',
      'rubric',
      'points',
      'scores',
      'grading'
    ];

    traverse(ast, {
      VariableDeclarator(path) {
        const { node } = path;

        if (t.isIdentifier(node.id)) {
          const variableName = node.id.name;

          if (scoringVariables.some(name =>
            variableName.toLowerCase().includes(name.toLowerCase())
          )) {
            const extracted = this.extractObjectFromNode(node.init);
            if (extracted) {
              rubrics[variableName] = extracted;
            }
          }
        }
      }
    });

    return rubrics;
  }

  static extractExamConfiguration(context: JsParsingContext): Partial<ExamConfiguration> {
    const { ast } = context;
    const config: Partial<ExamConfiguration> = {};

    const configVariables = [
      'config',
      'configuration',
      'settings',
      'examConfig',
      'testConfig'
    ];

    const timerVariables = [
      'timer',
      'timing',
      'duration',
      'timeLimit'
    ];

    traverse(ast, {
      VariableDeclarator(path) {
        const { node } = path;

        if (t.isIdentifier(node.id)) {
          const variableName = node.id.name;

          if (configVariables.some(name =>
            variableName.toLowerCase().includes(name.toLowerCase())
          )) {
            const extracted = this.extractObjectFromNode(node.init);
            if (extracted) {
              Object.assign(config, extracted);
            }
          }

          if (timerVariables.some(name =>
            variableName.toLowerCase().includes(name.toLowerCase())
          )) {
            const timingConfig = this.extractTimingConfiguration(node.init);
            if (timingConfig) {
              config.timing = { ...config.timing, ...timingConfig };
            }
          }
        }
      }
    });

    return config;
  }

  static validateAnswerKeyFormat(answerKeys: AnswerKeyMap): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (Object.keys(answerKeys).length === 0) {
      errors.push('No answer keys found');
      return { valid: false, errors };
    }

    for (const [questionId, answerData] of Object.entries(answerKeys)) {
      if (!answerData.correct) {
        errors.push(`Missing correct answer for question ${questionId}`);
        continue;
      }

      if (typeof answerData.points !== 'number' || answerData.points <= 0) {
        errors.push(`Invalid points value for question ${questionId}`);
      }

      // Validate answer format
      const { correct } = answerData;
      if (typeof correct !== 'string' && !Array.isArray(correct)) {
        errors.push(`Invalid answer format for question ${questionId}: must be string or array`);
      }

      if (Array.isArray(correct) && correct.some(ans => typeof ans !== 'string')) {
        errors.push(`Invalid answer array for question ${questionId}: all elements must be strings`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Helper methods

  private static extractAnswerKeysFromNode(node: any): AnswerKeyMap {
    const answerKeys: AnswerKeyMap = {};

    if (t.isObjectExpression(node)) {
      node.properties.forEach((prop: any) => {
        if (t.isObjectProperty(prop) &&
            (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {

          const questionId = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
          const answerData = this.extractAnswerDataFromNode(prop.value);

          if (answerData) {
            answerKeys[questionId] = answerData;
          }
        }
      });
    } else if (t.isArrayExpression(node)) {
      // Handle array format: ['A', 'B', 'C', 'A']
      node.elements.forEach((element: any, index: number) => {
        if (t.isStringLiteral(element)) {
          answerKeys[`question_${index}`] = {
            correct: element.value,
            points: 1
          };
        }
      });
    }

    return answerKeys;
  }

  private static extractAnswerDataFromNode(node: any): any {
    if (t.isStringLiteral(node)) {
      // Simple string answer
      return {
        correct: node.value,
        points: 1
      };
    }

    if (t.isObjectExpression(node)) {
      // Object with answer details
      const data: any = {};

      node.properties.forEach((prop: any) => {
        if (t.isObjectProperty(prop) &&
            (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {

          const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
          const value = this.extractPrimitiveValue(prop.value);

          if (value !== null) {
            data[key] = value;
          }
        }
      });

      // Map common key variations
      if (data.answer) data.correct = data.answer;
      if (data.solution) data.correct = data.solution;
      if (data.score) data.points = data.score;
      if (data.mark) data.points = data.mark;

      return data.correct ? data : null;
    }

    if (t.isArrayExpression(node)) {
      // Array of correct answers
      const answers = node.elements
        .map(element => this.extractPrimitiveValue(element))
        .filter(value => value !== null);

      return answers.length > 0 ? {
        correct: answers,
        points: 1
      } : null;
    }

    return null;
  }

  private static extractObjectFromNode(node: any): any {
    if (!t.isObjectExpression(node)) return null;

    const obj: any = {};

    node.properties.forEach((prop: any) => {
      if (t.isObjectProperty(prop) &&
          (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {

        const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
        const value = this.extractPrimitiveValue(prop.value) ||
                     this.extractObjectFromNode(prop.value);

        if (value !== null) {
          obj[key] = value;
        }
      }
    });

    return Object.keys(obj).length > 0 ? obj : null;
  }

  private static extractPrimitiveValue(node: any): any {
    if (t.isStringLiteral(node)) return node.value;
    if (t.isNumericLiteral(node)) return node.value;
    if (t.isBooleanLiteral(node)) return node.value;
    if (t.isNullLiteral(node)) return null;

    if (t.isArrayExpression(node)) {
      return node.elements
        .map(element => this.extractPrimitiveValue(element))
        .filter(value => value !== null);
    }

    return null;
  }

  private static extractTimingConfiguration(node: any): any {
    const timing: any = {};

    if (t.isNumericLiteral(node)) {
      // Simple number - total duration in minutes
      timing.total_duration = node.value;
      return timing;
    }

    if (t.isObjectExpression(node)) {
      const obj = this.extractObjectFromNode(node);

      // Map common timing properties
      if (obj.duration) timing.total_duration = obj.duration;
      if (obj.totalTime) timing.total_duration = obj.totalTime;
      if (obj.timeLimit) timing.total_duration = obj.timeLimit;
      if (obj.sections) timing.section_durations = obj.sections;
      if (obj.warnings) timing.warning_times = obj.warnings;

      return Object.keys(timing).length > 0 ? timing : null;
    }

    return null;
  }
}