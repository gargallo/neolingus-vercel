/**
 * EOI English Certification Configuration
 * Escuela Oficial de Idiomas - English B2/C1 Certification
 *
 * Official format alignment with CEFR standards and Spanish educational system
 */

import type {
  ExamConfiguration,
  ContentConfig,
  ScoringRubric,
  QuestionType,
} from "../../types";

// EOI English B2 Configuration
export const eoiEnglishB2Config: ExamConfiguration = {
  certificationModule: "eoi_en",
  component: "reading", // Default component, overridden per session
  sessionType: "practice",
  questionCount: 25,
  timeLimit: 90, // minutes
  questionSelection: {
    strategy: "difficulty_progression",
    difficultyDistribution: {
      beginner: 0,
      intermediate: 0.7,
      upper_intermediate: 0.3,
      advanced: 0,
    },
    topicDistribution: {
      daily_life: 0.2,
      work_professional: 0.2,
      education: 0.15,
      travel_culture: 0.15,
      technology: 0.1,
      health_lifestyle: 0.1,
      environment: 0.08,
    },
    excludeRecentQuestions: true,
    excludeRecentDays: 7,
  },
  scoringMethod: {
    algorithm: "weighted",
    passingScore: 5.0, // Out of 10
    partialCreditEnabled: true,
    penaltyForGuessing: false,
    rubricWeights: {
      vocabulary: 0.3,
      grammar: 0.3,
      comprehension: 0.4,
    },
  },
  adaptiveMode: false,
  allowReview: true,
  showProgress: true,
  randomizeQuestions: true,
  randomizeOptions: true,
};

// EOI English C1 Configuration
export const eoiEnglishC1Config: ExamConfiguration = {
  ...eoiEnglishB2Config,
  questionCount: 30,
  timeLimit: 90,
  questionSelection: {
    ...eoiEnglishB2Config.questionSelection,
    difficultyDistribution: {
      beginner: 0,
      intermediate: 0.3,
      upper_intermediate: 0.5,
      advanced: 0.2,
    },
    topicDistribution: {
      academic_research: 0.25,
      professional_business: 0.2,
      literature_arts: 0.15,
      science_technology: 0.15,
      social_issues: 0.15,
      abstract_concepts: 0.1,
    },
  },
  scoringMethod: {
    ...eoiEnglishB2Config.scoringMethod,
    passingScore: 5.5,
    rubricWeights: {
      vocabulary: 0.35,
      grammar: 0.25,
      comprehension: 0.4,
    },
  },
};

// Component-specific configurations
export const eoiComponentConfigs = {
  reading: {
    b2: {
      ...eoiEnglishB2Config,
      component: "reading" as const,
      timeLimit: 90,
      questionCount: 25,
      questionTypes: [
        "multiple_choice",
        "true_false",
        "matching",
        "gap_fill",
      ] as QuestionType[],
    },
    c1: {
      ...eoiEnglishC1Config,
      component: "reading" as const,
      timeLimit: 90,
      questionCount: 30,
      questionTypes: [
        "multiple_choice",
        "matching",
        "gap_fill",
        "reading_comprehension",
      ] as QuestionType[],
    },
  },
  writing: {
    b2: {
      ...eoiEnglishB2Config,
      component: "writing" as const,
      timeLimit: 90,
      questionCount: 2, // 2 writing tasks
      questionTypes: ["essay", "short_answer"] as QuestionType[],
    },
    c1: {
      ...eoiEnglishC1Config,
      component: "writing" as const,
      timeLimit: 90,
      questionCount: 2,
      questionTypes: ["essay", "short_answer"] as QuestionType[],
    },
  },
  listening: {
    b2: {
      ...eoiEnglishB2Config,
      component: "listening" as const,
      timeLimit: 40,
      questionCount: 20,
      questionTypes: [
        "multiple_choice",
        "true_false",
        "matching",
      ] as QuestionType[],
    },
    c1: {
      ...eoiEnglishC1Config,
      component: "listening" as const,
      timeLimit: 40,
      questionCount: 25,
      questionTypes: [
        "multiple_choice",
        "gap_fill",
        "listening_comprehension",
      ] as QuestionType[],
    },
  },
  speaking: {
    b2: {
      ...eoiEnglishB2Config,
      component: "speaking" as const,
      timeLimit: 15,
      questionCount: 3, // 3 speaking tasks
      questionTypes: ["speaking_response"] as QuestionType[],
    },
    c1: {
      ...eoiEnglishC1Config,
      component: "speaking" as const,
      timeLimit: 15,
      questionCount: 3,
      questionTypes: ["speaking_response"] as QuestionType[],
    },
  },
};

// EOI English Scoring Rubrics
export const eoiScoringRubrics: Record<string, ScoringRubric> = {
  writing_b2: {
    id: "eoi_en_writing_b2",
    name: "EOI English B2 Writing Assessment",
    component: "writing",
    type: "writing",
    criteria: [
      {
        name: "Task Achievement",
        description: "How well the response addresses the task requirements",
        weight: 0.25,
        skills: ["task_completion", "relevance", "appropriateness"],
      },
      {
        name: "Coherence and Cohesion",
        description: "Organization and logical flow of ideas",
        weight: 0.25,
        skills: ["organization", "linking", "paragraphing"],
      },
      {
        name: "Lexical Resource",
        description: "Range and accuracy of vocabulary",
        weight: 0.25,
        skills: ["vocabulary_range", "vocabulary_accuracy", "collocation"],
      },
      {
        name: "Grammatical Range and Accuracy",
        description: "Variety and correctness of grammatical structures",
        weight: 0.25,
        skills: ["grammar_range", "grammar_accuracy", "sentence_variety"],
      },
    ],
    maxScore: 10,
    levels: [
      {
        level: 9,
        name: "Excellent",
        description: "Fully addresses task with sophisticated language",
        scoreRange: [9, 10],
      },
      {
        level: 7,
        name: "Good",
        description: "Addresses task well with good language control",
        scoreRange: [7, 8.9],
      },
      {
        level: 5,
        name: "Satisfactory",
        description: "Addresses task adequately with sufficient language",
        scoreRange: [5, 6.9],
      },
      {
        level: 3,
        name: "Limited",
        description: "Partially addresses task with limited language",
        scoreRange: [3, 4.9],
      },
      {
        level: 1,
        name: "Inadequate",
        description: "Does not address task adequately",
        scoreRange: [0, 2.9],
      },
    ],
  },
  speaking_b2: {
    id: "eoi_en_speaking_b2",
    name: "EOI English B2 Speaking Assessment",
    component: "speaking",
    type: "speaking",
    criteria: [
      {
        name: "Fluency and Coherence",
        description: "Ability to speak smoothly and logically",
        weight: 0.25,
        skills: ["fluency", "coherence", "discourse_markers"],
      },
      {
        name: "Lexical Resource",
        description: "Range and accuracy of vocabulary in speech",
        weight: 0.25,
        skills: ["vocabulary_range", "vocabulary_accuracy", "paraphrasing"],
      },
      {
        name: "Grammatical Range and Accuracy",
        description: "Variety and correctness of spoken grammar",
        weight: 0.25,
        skills: ["grammar_range", "grammar_accuracy", "error_frequency"],
      },
      {
        name: "Pronunciation",
        description: "Clarity and intelligibility of speech",
        weight: 0.25,
        skills: ["individual_sounds", "word_stress", "intonation"],
      },
    ],
    maxScore: 10,
    levels: [
      {
        level: 9,
        name: "Excellent",
        description: "Natural, effortless communication",
        scoreRange: [9, 10],
      },
      {
        level: 7,
        name: "Good",
        description: "Effective communication with minor issues",
        scoreRange: [7, 8.9],
      },
      {
        level: 5,
        name: "Satisfactory",
        description: "Generally effective communication",
        scoreRange: [5, 6.9],
      },
      {
        level: 3,
        name: "Limited",
        description: "Communication with noticeable limitations",
        scoreRange: [3, 4.9],
      },
      {
        level: 1,
        name: "Inadequate",
        description: "Very limited communication ability",
        scoreRange: [0, 2.9],
      },
    ],
  },
};

// EOI Content Configuration
export const eoiContentConfig: ContentConfig = {
  questionTypes: {
    reading: [
      "multiple_choice",
      "true_false",
      "matching",
      "gap_fill",
      "reading_comprehension",
    ],
    writing: ["essay", "formal_letter", "short_answer"],
    listening: [
      "multiple_choice",
      "true_false",
      "matching",
      "gap_fill",
      "listening_comprehension",
    ],
    speaking: ["speaking_response"],
  },
  difficultyLevels: ["intermediate", "upper_intermediate", "advanced"],
  topicAreas: [
    "daily_life",
    "work_professional",
    "education",
    "travel_culture",
    "technology",
    "health_lifestyle",
    "environment",
    "academic_research",
    "professional_business",
    "literature_arts",
    "science_technology",
    "social_issues",
    "abstract_concepts",
  ],
  vocabularyRange: {
    minWords: 3000, // B2 level
    maxWords: 5000, // C1 level
    specializedTerms: [
      "academic",
      "professional",
      "technical",
      "formal_register",
    ],
  },
};

// CEFR Descriptors for EOI English
export const eoiCEFRDescriptors = {
  b2: {
    reading: [
      "Can read articles and reports concerned with contemporary problems",
      "Can understand contemporary literary prose",
      "Can read correspondence relating to their field of interest",
    ],
    writing: [
      "Can write clear, detailed text on a wide range of subjects",
      "Can write an essay or report passing on information or giving reasons",
      "Can write letters highlighting the personal significance of events",
    ],
    listening: [
      "Can understand extended speech and lectures",
      "Can understand TV news and current affairs programmes",
      "Can understand the majority of films in standard dialect",
    ],
    speaking: [
      "Can interact with a degree of fluency and spontaneity",
      "Can present clear, detailed descriptions on a wide range of subjects",
      "Can explain a viewpoint on a topical issue giving advantages and disadvantages",
    ],
  },
  c1: {
    reading: [
      "Can understand long and complex factual and literary texts",
      "Can understand specialized articles and longer technical instructions",
      "Can understand implicit meaning and attitude",
    ],
    writing: [
      "Can express themselves in clear, well-structured text",
      "Can write complex letters, reports or articles",
      "Can select style appropriate to the reader in mind",
    ],
    listening: [
      "Can understand extended speech even when not clearly structured",
      "Can understand television programmes and films without too much effort",
      "Can follow complex interactions between third parties",
    ],
    speaking: [
      "Can express themselves fluently and spontaneously",
      "Can use language flexibly and effectively for social and professional purposes",
      "Can present clear, detailed descriptions of complex subjects",
    ],
  },
};

export default {
  b2: eoiEnglishB2Config,
  c1: eoiEnglishC1Config,
  components: eoiComponentConfigs,
  rubrics: eoiScoringRubrics,
  content: eoiContentConfig,
  cefrDescriptors: eoiCEFRDescriptors,
};
