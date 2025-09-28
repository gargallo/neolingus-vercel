// =============================================
// EXAM DATA SERVICE
// =============================================
// Service for fetching and managing exam content from dashboard to simulator

import type {
  ExamContent,
  Language,
  Level,
  QuestionType
} from '@/types/exam-system';
import { jqcvB2ComprensioLectoraAdmin } from '@/lib/data/exams/jqcv/comprensio-lectora-admin-b2';
import { jqcvB2ExpressioEscritaAdmin } from '@/lib/data/exams/jqcv/expressio-escrita-admin-b2';
import { jqcvB2ExpressioOralAdmin } from '@/lib/data/exams/jqcv/expressio-oral-admin-b2';

// Simplified interfaces for our use case
export interface Question {
  id: string;
  exam_template_id: string;
  exam_content_id: string | null;
  question_type: QuestionType;
  skill: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  points: number;
  order_index: number;
  explanation?: string;
  context?: string;
  section?: string;
  created_at: string;
  updated_at: string;
}

// Simplified exam template for simulator
export interface SimpleExamTemplate {
  id: string;
  title: string;
  description?: string;
  language: Language;
  level: Level;
  provider: string;
  estimated_duration: number;
  total_questions: number;
  instructions: string;
  created_at: string;
  updated_at: string;
  version: string;
}

export interface ExamData {
  template: SimpleExamTemplate;
  content: ExamContent[];
  questions: Question[];
}

export interface ExamInfo {
  id: string;
  title: string;
  description: string;
  duration: number;
  total_questions: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  exam_type: string;
  provider: string;
  language: Language;
  level: Level;
}

export class ExamDataService {
  private static readonly realExamMap: Record<string, ExamData & { info: ExamInfo }> = {
    [jqcvB2ComprensioLectoraAdmin.info.id]: jqcvB2ComprensioLectoraAdmin,
    [jqcvB2ExpressioEscritaAdmin.info.id]: jqcvB2ExpressioEscritaAdmin,
    [jqcvB2ExpressioOralAdmin.info.id]: jqcvB2ExpressioOralAdmin,
  };

  /**
   * Get exam information by ID
   */
  static async getExamInfo(examId: string): Promise<ExamInfo | null> {
    try {
      const realExam = this.realExamMap[examId];
      if (realExam) {
        return realExam.info;
      }

      const examData = await this.getMockExamData(examId);
      return examData;
    } catch (error) {
      console.error('Error fetching exam info:', error);
      return null;
    }
  }

  /**
   * Get full exam data for simulator
   */
  static async getExamData(examId: string): Promise<ExamData | null> {
    try {
      const realExam = this.realExamMap[examId];
      if (realExam) {
        return {
          template: realExam.template,
          content: realExam.content,
          questions: realExam.questions,
        };
      }

      const examInfo = await this.getExamInfo(examId);
      if (!examInfo) return null;

      // Generate exam template
      const template: SimpleExamTemplate = {
        id: examId,
        title: examInfo.title,
        description: examInfo.description,
        language: examInfo.language,
        level: examInfo.level,
        provider: examInfo.provider,
        estimated_duration: examInfo.duration,
        total_questions: examInfo.total_questions,
        instructions: this.getInstructionsForProvider(examInfo.provider),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: "1.0"
      };

      // Generate mock exam content and questions
      const { content, questions } = this.generateMockExamContent(examInfo);

      return {
        template,
        content,
        questions
      };
    } catch (error) {
      console.error('Error fetching exam data:', error);
      return null;
    }
  }

  /**
   * Mock exam data based on exam ID patterns
   */
  private static async getMockExamData(examId: string): Promise<ExamInfo | null> {
    // Parse exam ID to extract information
    const [provider, level, type, number] = examId.split('_');

    if (!provider || !level || !type) {
      return null;
    }

    // Map exam types to readable names
    const examTypeNames: Record<string, string> = {
      'first': 'First Certificate',
      'mock': 'Simulacro',
      'reading': 'Reading Practice',
      'listening': 'Listening Practice',
      'writing': 'Writing Practice',
      'speaking': 'Speaking Practice',
      'complete': 'Examen Completo'
    };

    // Map providers to full names
    const providerNames: Record<string, string> = {
      cambridge: 'Cambridge English',
      eoi: 'EOI',
      cieacova: 'CIEACOVA',
      jqcv: 'JQCV'
    };

    // Determine language from provider context
    let language: Language = 'english';
    if (provider === 'cieacova' || provider === 'jqcv') {
      language = 'valenciano';
    }

    // Generate exam info
    const examInfo: ExamInfo = {
      id: examId,
      title: `${providerNames[provider] || provider} ${level.toUpperCase()} - ${examTypeNames[type] || type} ${number || '1'}`,
      description: `Examen ${examTypeNames[type] || type} de ${providerNames[provider] || provider} para nivel ${level.toUpperCase()}`,
      duration: this.getDurationForExamType(type),
      total_questions: this.getQuestionCountForExamType(type),
      difficulty: this.getDifficultyForLevel(level),
      exam_type: type,
      provider: provider,
      language: language,
      level: level as Level
    };

    return examInfo;
  }

  /**
   * Generate mock exam content and questions
   */
  private static generateMockExamContent(examInfo: ExamInfo): { content: ExamContent[], questions: Question[] } {
    const content: ExamContent[] = [];
    const questions: Question[] = [];

    // Generate content based on exam type
    if (examInfo.exam_type === 'reading' || examInfo.exam_type === 'complete') {
      // Reading comprehension content
      const readingContent: ExamContent = {
        id: `${examInfo.id}_reading_content`,
        exam_template_id: examInfo.id,
        content_type: 'reading_passage',
        title: 'Reading Comprehension',
        content: this.generateReadingPassage(examInfo.language),
        media_url: null,
        duration_seconds: null,
        order_index: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      content.push(readingContent);

      // Generate reading questions
      const readingQuestions = this.generateReadingQuestions(examInfo, readingContent.id);
      questions.push(...readingQuestions);
    }

    if (examInfo.exam_type === 'listening' || examInfo.exam_type === 'complete') {
      // Listening content
      const listeningContent: ExamContent = {
        id: `${examInfo.id}_listening_content`,
        exam_template_id: examInfo.id,
        content_type: 'audio',
        title: 'Listening Comprehension',
        content: 'Audio transcription would be here...',
        media_url: '/audio/sample-listening.mp3',
        duration_seconds: 300,
        order_index: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      content.push(listeningContent);

      // Generate listening questions
      const listeningQuestions = this.generateListeningQuestions(examInfo, listeningContent.id);
      questions.push(...listeningQuestions);
    }

    // Add grammar/use of English questions for complete exams
    if (examInfo.exam_type === 'complete') {
      const grammarQuestions = this.generateGrammarQuestions(examInfo);
      questions.push(...grammarQuestions);
    }

    return { content, questions };
  }

  /**
   * Generate reading passage based on language and level
   */
  private static generateReadingPassage(language: Language): string {
    if (language === 'valenciano') {
      return `
        El patrimoni cultural valencià

        La Comunitat Valenciana té un patrimoni cultural extraordinàriament ric i divers que reflecteix la seua història mil·lenària. Des dels vestigis ibers i romans fins a l'arquitectura contemporània, el nostre territori ha estat testimoni de diferents civilitzacions que han deixat la seua empremta.

        L'art gòtic valencià, amb exemples com la Llotja de la Seda de València o la Catedral de Palma, representa un dels períodes més esplendorosos de la nostra història artística. Aquests monuments no sols són testimonis del passat, sinó que continuen sent centres vius de la cultura actual.

        La literatura valenciana medieval, amb figures com Ausiàs March o Joanot Martorell, va establir les bases d'una tradició literària que perdura fins als nostres dies. El "Tirant lo Blanch" és considerat una de les primeres novel·les modernes d'Europa.

        Avui dia, el patrimoni valencià s'enfronta a nous reptes. La globalització i els canvis socials exigeixen noves estratègies de conservació i difusió. Les noves tecnologies ofereixen oportunitats inèdites per a fer més accessible aquest patrimoni a les noves generacions.
      `;
    } else {
      return `
        The Digital Revolution in Education

        The integration of technology in education has fundamentally transformed how students learn and teachers instruct. Digital tools have moved beyond simple computer literacy to become integral components of modern pedagogy, reshaping traditional classroom dynamics and creating new opportunities for personalized learning.

        Interactive whiteboards, tablets, and learning management systems have replaced many conventional teaching methods. Students can now access vast libraries of information instantaneously, collaborate with peers across the globe, and receive immediate feedback on their progress. This shift has democratized access to quality educational resources, particularly benefiting students in remote or underserved areas.

        However, this technological revolution also presents significant challenges. The digital divide remains a persistent issue, with socioeconomic factors determining access to devices and reliable internet connections. Additionally, the constant presence of digital distractions requires new strategies for maintaining student focus and engagement.

        Educational institutions must now balance the benefits of technological integration with the preservation of fundamental human elements in learning. Critical thinking, creativity, and interpersonal skills remain essential competencies that cannot be fully developed through digital means alone.
      `;
    }
  }

  /**
   * Generate reading comprehension questions
   */
  private static generateReadingQuestions(examInfo: ExamInfo, contentId: string): Question[] {
    const questions: Question[] = [];
    const baseQuestions = examInfo.language === 'valenciano' ? [
      {
        text: "Segons el text, quin període representa un dels més esplendorosos de l'art valencià?",
        options: ["L'època ibera", "El període romà", "L'art gòtic", "L'arquitectura contemporània"],
        correct: 2
      },
      {
        text: "Quina obra és considerada una de les primeres novel·les modernes d'Europa?",
        options: ["Llibre dels fets", "Tirant lo Blanch", "Cançoner", "Curial e Güelfa"],
        correct: 1
      },
      {
        text: "Segons l'autor, quins són els principals reptes del patrimoni valencià actual?",
        options: ["La falta de finançament", "La globalització i els canvis socials", "La manca d'interès dels joves", "La deterioració dels monuments"],
        correct: 1
      }
    ] : [
      {
        text: "According to the passage, how has technology transformed education?",
        options: ["By replacing teachers entirely", "By integrating with traditional pedagogy", "By focusing only on computer literacy", "By eliminating face-to-face interaction"],
        correct: 1
      },
      {
        text: "What does the text identify as a persistent challenge in educational technology?",
        options: ["Lack of teacher training", "The digital divide", "Insufficient funding", "Student resistance"],
        correct: 1
      },
      {
        text: "According to the author, what must educational institutions balance?",
        options: ["Cost and quality", "Tradition and innovation", "Technology benefits and human elements", "Local and global perspectives"],
        correct: 2
      }
    ];

    baseQuestions.forEach((q, index) => {
      questions.push({
        id: `${examInfo.id}_reading_q${index + 1}`,
        exam_template_id: examInfo.id,
        exam_content_id: contentId,
        question_type: 'multiple_choice',
        skill: 'reading',
        question_text: q.text,
        options: q.options,
        correct_answer: q.correct.toString(),
        points: 1,
        order_index: index + 1,
        explanation: `La resposta correcta és "${q.options[q.correct]}" segons la informació del text.`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    return questions;
  }

  /**
   * Generate listening comprehension questions
   */
  private static generateListeningQuestions(examInfo: ExamInfo, contentId: string): Question[] {
    const questions: Question[] = [];

    // Simple listening questions for demo
    const listeningQuestions = [
      "What is the main topic of the audio?",
      "How many speakers are there in the conversation?",
      "What time is mentioned in the recording?"
    ];

    listeningQuestions.forEach((questionText, index) => {
      questions.push({
        id: `${examInfo.id}_listening_q${index + 1}`,
        exam_template_id: examInfo.id,
        exam_content_id: contentId,
        question_type: 'multiple_choice',
        skill: 'listening',
        question_text: questionText,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "0",
        points: 1,
        order_index: questions.length + index + 1,
        explanation: "Listen carefully to identify the correct answer.",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    return questions;
  }

  /**
   * Generate grammar/use of English questions
   */
  private static generateGrammarQuestions(examInfo: ExamInfo): Question[] {
    const questions: Question[] = [];

    const grammarQuestions = examInfo.language === 'valenciano' ? [
      {
        text: "Completa la frase: 'Si tingués temps, _____ al cinema.'",
        options: ["aniria", "anirà", "anava", "va anar"],
        correct: 0
      },
      {
        text: "Quina és la forma correcta del participi de 'escriure'?",
        options: ["escrigut", "escrit", "escrivint", "escriu"],
        correct: 1
      }
    ] : [
      {
        text: "Choose the correct form: 'She _____ have finished her homework by now.'",
        options: ["should", "would", "could", "might"],
        correct: 0
      },
      {
        text: "Complete the sentence: 'If I _____ you, I would accept the offer.'",
        options: ["am", "was", "were", "be"],
        correct: 2
      }
    ];

    grammarQuestions.forEach((q, index) => {
      questions.push({
        id: `${examInfo.id}_grammar_q${index + 1}`,
        exam_template_id: examInfo.id,
        exam_content_id: null,
        question_type: 'multiple_choice',
        skill: 'grammar',
        question_text: q.text,
        options: q.options,
        correct_answer: q.correct.toString(),
        points: 1,
        order_index: 100 + index + 1, // Place after reading/listening
        explanation: `La resposta correcta és "${q.options[q.correct]}".`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    return questions;
  }

  /**
   * Get skills for exam type
   */
  private static getSkillsForExamType(examType: string): string[] {
    switch (examType) {
      case 'complete':
        return ['reading', 'listening', 'writing', 'speaking', 'grammar'];
      case 'reading':
        return ['reading'];
      case 'listening':
        return ['listening'];
      case 'writing':
        return ['writing'];
      case 'speaking':
        return ['speaking'];
      default:
        return ['reading', 'grammar'];
    }
  }

  /**
   * Get instructions for provider
   */
  private static getInstructionsForProvider(provider: string): string {
    const instructions: Record<string, string> = {
      cambridge: "This exam follows Cambridge English format. Read instructions carefully and manage your time effectively.",
      eoi: "Este examen sigue el formato oficial de las Escuelas Oficiales de Idiomas. Lee las instrucciones atentamente.",
      cieacova: "Aquest examen segueix el format oficial del CIEACOVA. Llegeix atentament les instruccions.",
      jqcv: "Aquest examen segueix el format oficial de la JQCV. Gestiona el temps adequadament."
    };

    return instructions[provider] || "Read all instructions carefully before starting the exam.";
  }

  /**
   * Get duration based on exam type
   */
  private static getDurationForExamType(examType: string): number {
    switch (examType) {
      case 'complete':
        return 180; // 3 hours
      case 'reading':
        return 75;  // 1.25 hours
      case 'listening':
        return 45;  // 45 minutes
      case 'writing':
        return 90;  // 1.5 hours
      case 'speaking':
        return 20;  // 20 minutes
      default:
        return 60;  // 1 hour default
    }
  }

  /**
   * Get question count based on exam type
   */
  private static getQuestionCountForExamType(examType: string): number {
    switch (examType) {
      case 'complete':
        return 52;
      case 'reading':
        return 30;
      case 'listening':
        return 25;
      case 'writing':
        return 2;
      case 'speaking':
        return 4;
      default:
        return 20;
    }
  }

  /**
   * Get difficulty based on level
   */
  private static getDifficultyForLevel(level: string): "beginner" | "intermediate" | "advanced" {
    switch (level.toLowerCase()) {
      case 'a1':
      case 'a2':
        return 'beginner';
      case 'b1':
      case 'b2':
        return 'intermediate';
      case 'c1':
      case 'c2':
        return 'advanced';
      default:
        return 'intermediate';
    }
  }
}
