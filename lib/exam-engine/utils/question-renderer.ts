import { ExamQuestion, QuestionType, QuestionOption } from '../types/exam-config';

export interface RenderedQuestion {
  questionId: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  metadata: Record<string, unknown>;
}

export class QuestionRenderer {
  static renderQuestion(question: ExamQuestion): RenderedQuestion {
    return {
      questionId: question.id,
      type: question.type,
      content: question.text || '',
      options: question.options,
      metadata: {
        points: question.points,
        timeLimit: question.timeLimit,
        maxWords: question.maxWords
      }
    };
  }

  static validateAnswer(question: ExamQuestion, answer: unknown): boolean {
    switch (question.type) {
      case 'multiple_choice':
        return typeof answer === 'string' && 
               (question.options?.some(opt => opt.value === answer) ?? false);
      
      case 'gap_fill':
        return typeof answer === 'string' && answer.trim().length > 0;
      
      case 'essay':
        return typeof answer === 'string' && 
               answer.trim().length > 0 && 
               (!question.maxWords || answer.split(' ').length <= question.maxWords);
      
      default:
        return true;
    }
  }
}