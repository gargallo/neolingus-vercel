/**
 * JQCV Valenciano Certification Configuration
 * Junta Qualificadora de Coneixements de Valencià - Certification B2/C1/C2
 *
 * Official format alignment with CEFR standards and Valencian educational system
 */

import type {
  ExamConfiguration,
  ContentConfig,
  ScoringRubric,
  QuestionType,
} from "../../types";

// JQCV Valenciano B2 Configuration
export const jqcvValencianoB2Config: ExamConfiguration = {
  certificationModule: "jqcv_va",
  component: "reading",
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
      vida_quotidiana: 0.25, // Daily life
      cultura_valenciana: 0.2, // Valencian culture
      educacio_formacio: 0.15, // Education and training
      treball_professional: 0.15, // Work and professional
      medi_ambient: 0.1, // Environment
      salut_benestar: 0.1, // Health and wellbeing
      tecnologia_comunicacio: 0.05, // Technology and communication
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
      vocabulari: 0.35, // Vocabulary weight higher for regional language
      gramatica: 0.3,
      comprensio: 0.35,
    },
  },
  adaptiveMode: false,
  allowReview: true,
  showProgress: true,
  randomizeQuestions: true,
  randomizeOptions: true,
};

// JQCV Valenciano C1 Configuration
export const jqcvValencianoC1Config: ExamConfiguration = {
  ...jqcvValencianoB2Config,
  questionCount: 30,
  timeLimit: 90,
  questionSelection: {
    ...jqcvValencianoB2Config.questionSelection,
    difficultyDistribution: {
      beginner: 0,
      intermediate: 0.2,
      upper_intermediate: 0.6,
      advanced: 0.2,
    },
    topicDistribution: {
      literatura_valenciana: 0.3, // Valencian literature
      historia_patrimoni: 0.2, // History and heritage
      politica_societat: 0.15, // Politics and society
      ciencia_tecnologia: 0.15, // Science and technology
      economia_negocis: 0.1, // Economy and business
      art_expressio: 0.1, // Art and expression
    },
  },
  scoringMethod: {
    ...jqcvValencianoB2Config.scoringMethod,
    passingScore: 5.5,
    rubricWeights: {
      vocabulari: 0.4,
      gramatica: 0.25,
      comprensio: 0.35,
    },
  },
};

// JQCV Valenciano C2 Configuration (Advanced)
export const jqcvValencianoC2Config: ExamConfiguration = {
  ...jqcvValencianoC1Config,
  questionCount: 35,
  timeLimit: 120,
  questionSelection: {
    ...jqcvValencianoC1Config.questionSelection,
    difficultyDistribution: {
      beginner: 0,
      intermediate: 0,
      upper_intermediate: 0.3,
      advanced: 0.7,
    },
    topicDistribution: {
      textos_especialitzats: 0.4, // Specialized texts
      registres_formals: 0.25, // Formal registers
      discurs_academic: 0.15, // Academic discourse
      variacio_linguistica: 0.1, // Linguistic variation
      traduccio_interpretacio: 0.1, // Translation and interpretation
    },
  },
  scoringMethod: {
    ...jqcvValencianoC1Config.scoringMethod,
    passingScore: 6.0,
    rubricWeights: {
      vocabulari: 0.35,
      gramatica: 0.3,
      comprensio: 0.25,
      registre: 0.1, // Register appropriateness
    },
  },
};

// Component-specific configurations for JQCV
export const jqcvComponentConfigs = {
  reading: {
    b2: {
      ...jqcvValencianoB2Config,
      component: "reading" as const,
      timeLimit: 90,
      questionCount: 25,
      questionTypes: [
        "multiple_choice",
        "true_false",
        "gap_fill",
        "reading_comprehension",
      ] as QuestionType[],
    },
    c1: {
      ...jqcvValencianoC1Config,
      component: "reading" as const,
      timeLimit: 90,
      questionCount: 30,
      questionTypes: [
        "multiple_choice",
        "gap_fill",
        "reading_comprehension",
      ] as QuestionType[],
    },
    c2: {
      ...jqcvValencianoC2Config,
      component: "reading" as const,
      timeLimit: 120,
      questionCount: 35,
      questionTypes: ["reading_comprehension", "gap_fill"] as QuestionType[],
    },
  },
  writing: {
    b2: {
      ...jqcvValencianoB2Config,
      component: "writing" as const,
      timeLimit: 90,
      questionCount: 2,
      questionTypes: ["essay", "formal_letter"] as QuestionType[],
    },
    c1: {
      ...jqcvValencianoC1Config,
      component: "writing" as const,
      timeLimit: 90,
      questionCount: 2,
      questionTypes: ["essay", "short_answer"] as QuestionType[],
    },
    c2: {
      ...jqcvValencianoC2Config,
      component: "writing" as const,
      timeLimit: 120,
      questionCount: 2,
      questionTypes: ["essay", "short_answer"] as QuestionType[],
    },
  },
  listening: {
    b2: {
      ...jqcvValencianoB2Config,
      component: "listening" as const,
      timeLimit: 40,
      questionCount: 20,
      questionTypes: [
        "multiple_choice",
        "true_false",
        "gap_fill",
      ] as QuestionType[],
    },
    c1: {
      ...jqcvValencianoC1Config,
      component: "listening" as const,
      timeLimit: 40,
      questionCount: 25,
      questionTypes: [
        "multiple_choice",
        "gap_fill",
        "listening_comprehension",
      ] as QuestionType[],
    },
    c2: {
      ...jqcvValencianoC2Config,
      component: "listening" as const,
      timeLimit: 50,
      questionCount: 30,
      questionTypes: ["listening_comprehension", "gap_fill"] as QuestionType[],
    },
  },
  speaking: {
    b2: {
      ...jqcvValencianoB2Config,
      component: "speaking" as const,
      timeLimit: 20,
      questionCount: 3,
      questionTypes: ["speaking_response"] as QuestionType[],
    },
    c1: {
      ...jqcvValencianoC1Config,
      component: "speaking" as const,
      timeLimit: 20,
      questionCount: 3,
      questionTypes: ["speaking_response"] as QuestionType[],
    },
    c2: {
      ...jqcvValencianoC2Config,
      component: "speaking" as const,
      timeLimit: 25,
      questionCount: 4,
      questionTypes: ["speaking_response"] as QuestionType[],
    },
  },
};

// JQCV Valenciano Scoring Rubrics
export const jqcvScoringRubrics: Record<string, ScoringRubric> = {
  writing_b2: {
    id: "jqcv_va_writing_b2",
    name: "JQCV Valencià B2 Avaluació d'Escriptura",
    component: "writing",
    type: "writing",
    criteria: [
      {
        name: "Adequació a la tasca",
        description: "Com de bé la resposta aborda els requisits de la tasca",
        weight: 0.25,
        skills: ["compliment_tasca", "relevancia", "adequacio"],
      },
      {
        name: "Coherència i cohesió",
        description: "Organització i flux lògic de les idees",
        weight: 0.25,
        skills: ["organitzacio", "connexio", "paragrafacio"],
      },
      {
        name: "Riquesa lexical",
        description: "Gamma i precisió del vocabulari valencià",
        weight: 0.25,
        skills: ["varietat_vocabulari", "precisio_vocabulari", "col·locacions"],
      },
      {
        name: "Correcció gramatical",
        description: "Varietat i correcció de les estructures gramaticals",
        weight: 0.25,
        skills: [
          "varietat_gramatical",
          "precisio_gramatical",
          "varietat_oracions",
        ],
      },
    ],
    maxScore: 10,
    levels: [
      {
        level: 9,
        name: "Excel·lent",
        description:
          "Aborda completament la tasca amb un llenguatge sofisticat",
        scoreRange: [9, 10],
      },
      {
        level: 7,
        name: "Bo",
        description: "Aborda bé la tasca amb bon control del llenguatge",
        scoreRange: [7, 8.9],
      },
      {
        level: 5,
        name: "Satisfactori",
        description: "Aborda adequadament la tasca amb llenguatge suficient",
        scoreRange: [5, 6.9],
      },
      {
        level: 3,
        name: "Limitat",
        description: "Aborda parcialment la tasca amb llenguatge limitat",
        scoreRange: [3, 4.9],
      },
      {
        level: 1,
        name: "Inadequat",
        description: "No aborda adequadament la tasca",
        scoreRange: [0, 2.9],
      },
    ],
  },
  speaking_b2: {
    id: "jqcv_va_speaking_b2",
    name: "JQCV Valencià B2 Avaluació d'Expressió Oral",
    component: "speaking",
    type: "speaking",
    criteria: [
      {
        name: "Fluïdesa i coherència",
        description: "Capacitat de parlar amb fluïdesa i lògica",
        weight: 0.25,
        skills: ["fluixesa", "coherencia", "marcadors_discurs"],
      },
      {
        name: "Riquesa lexical",
        description: "Gamma i precisió del vocabulari en l'expressió oral",
        weight: 0.25,
        skills: ["varietat_vocabulari", "precisio_vocabulari", "parafrasig"],
      },
      {
        name: "Correcció gramatical",
        description: "Varietat i correcció de la gramàtica oral",
        weight: 0.25,
        skills: [
          "varietat_gramatical",
          "precisio_gramatical",
          "frequencia_errors",
        ],
      },
      {
        name: "Pronunciació",
        description: "Claredat i intel·ligibilitat de la parla",
        weight: 0.25,
        skills: ["sons_individuals", "accent_paraules", "entonacio"],
      },
    ],
    maxScore: 10,
    levels: [
      {
        level: 9,
        name: "Excel·lent",
        description: "Comunicació natural i sense esforç",
        scoreRange: [9, 10],
      },
      {
        level: 7,
        name: "Bo",
        description: "Comunicació efectiva amb problemes menors",
        scoreRange: [7, 8.9],
      },
      {
        level: 5,
        name: "Satisfactori",
        description: "Comunicació generalment efectiva",
        scoreRange: [5, 6.9],
      },
      {
        level: 3,
        name: "Limitat",
        description: "Comunicació amb limitacions notables",
        scoreRange: [3, 4.9],
      },
      {
        level: 1,
        name: "Inadequat",
        description: "Capacitat de comunicació molt limitada",
        scoreRange: [0, 2.9],
      },
    ],
  },
};

// JQCV Content Configuration with Valencian specificities
export const jqcvContentConfig: ContentConfig = {
  questionTypes: {
    reading: [
      "multiple_choice",
      "true_false",
      "gap_fill",
      "reading_comprehension",
    ],
    writing: ["essay", "formal_letter", "short_answer"],
    listening: [
      "multiple_choice",
      "true_false",
      "gap_fill",
      "listening_comprehension",
    ],
    speaking: ["speaking_response"],
  },
  difficultyLevels: ["intermediate", "upper_intermediate", "advanced"],
  topicAreas: [
    // Valencian-specific topics
    "vida_quotidiana", // Daily life
    "cultura_valenciana", // Valencian culture
    "historia_valencia", // History of Valencia
    "tradicions_festes", // Traditions and festivals
    "gastronomia_local", // Local gastronomy
    "paisatge_territori", // Landscape and territory
    "institucions_politiques", // Political institutions
    "educacio_valenciano", // Valencian education
    "mitjans_comunicacio", // Media
    "literatura_valenciana", // Valencian literature
    "economia_regional", // Regional economy
    "medi_ambient_local", // Local environment
    "tecnologia_innovacio", // Technology and innovation
    "salut_benestar", // Health and wellbeing
    "treball_professional", // Work and professional
  ],
  vocabularyRange: {
    minWords: 4000, // Higher for regional language maintenance
    maxWords: 6000,
    specializedTerms: [
      "terminologia_institucional", // Institutional terminology
      "registre_formal_valencia", // Formal Valencian register
      "expressions_idiomatiques", // Idiomatic expressions
      "vocabulari_tecnic", // Technical vocabulary
      "cultismes_valencians", // Valencian cultisms
    ],
  },
};

// CEFR Descriptors adapted for Valencian context
export const jqcvCEFRDescriptors = {
  b2: {
    reading: [
      "Pot llegir articles i informes sobre problemes contemporanis valencians",
      "Pot comprendre textos literaris valencians contemporanis",
      "Pot llegir correspondència relacionada amb el seu camp d'interès",
    ],
    writing: [
      "Pot escriure textos clars i detallats sobre una àmplia gamma de temes",
      "Pot escriure assaigs o informes transmetent informació o donant raons",
      "Pot escriure cartes destacant la importància personal dels esdeveniments",
    ],
    listening: [
      "Pot comprendre discursos extensos i conferències en valencià",
      "Pot comprendre notícies de televisió i programes d'actualitat",
      "Pot comprendre la majoria de pel·lícules en dialecte estàndard",
    ],
    speaking: [
      "Pot interactuar amb cert grau de fluïdesa i espontaneïtat",
      "Pot presentar descripcions clares i detallades sobre una àmplia gamma de temes",
      "Pot explicar un punt de vista sobre un tema d'actualitat donant avantatges i desavantatges",
    ],
  },
  c1: {
    reading: [
      "Pot comprendre textos factuals i literaris llargs i complexos en valencià",
      "Pot comprendre articles especialitzats i instruccions tècniques més llargues",
      "Pot comprendre significat implícit i actitud",
    ],
    writing: [
      "Pot expressar-se en text clar i ben estructurat",
      "Pot escriure cartes, informes o articles complexos",
      "Pot seleccionar l'estil apropiat per al lector que té en ment",
    ],
    listening: [
      "Pot comprendre discursos extensos fins i tot quan no estan clarament estructurats",
      "Pot comprendre programes de televisió i pel·lícules sense massa esforç",
      "Pot seguir interaccions complexes entre terceres persones",
    ],
    speaking: [
      "Pot expressar-se amb fluïdesa i espontaneïtat",
      "Pot usar el llenguatge de manera flexible i efectiva per a propòsits socials i professionals",
      "Pot presentar descripcions clares i detallades de temes complexos",
    ],
  },
  c2: {
    reading: [
      "Pot comprendre amb facilitat pràcticament tot allò que llig",
      "Pot comprendre textos abstractes estructuralment complexos",
      "Pot comprendre articles especialitzats i obres literàries",
    ],
    writing: [
      "Pot escriure textos clars i fluids en un estil apropiat",
      "Pot escriure cartes, informes o articles complexos amb estructura lògica clara",
      "Pot escriure resums i ressenyes d'obres professionals o literàries",
    ],
    listening: [
      "No té cap dificultat per comprendre qualsevol tipus de llenguatge parlat",
      "Pot comprendre sense esforç el llenguatge parlat, tant en converses en directe com en retransmissions",
      "Pot seguir converses ràpides entre parlants nadius",
    ],
    speaking: [
      "Pot expressar-se espontàniament amb gran fluïdesa i precisió",
      "Pot presentar arguments de manera clara i fluida amb un estil apropiat al context",
      "Pot construir una presentació o argument de manera lògica",
    ],
  },
};

// Valencian linguistic specificities
export const valencianoLinguisticFeatures = {
  orthography: {
    // Specific orthographic rules for Valencian
    diacritics: ["à", "è", "é", "ï", "í", "ò", "ó", "ú", "ü"],
    contractions: ["del", "dels", "al", "als", "pel", "pels"],
    apostrophes: ["l'", "d'", "m'", "t'", "s'", "n'"],
  },
  morphology: {
    articles: ["el", "la", "els", "les", "lo", "los"],
    pronouns: ["em", "et", "es", "ens", "vos", "se"],
    verbalForms: ["som", "sou", "són", "vam", "vau", "van"],
  },
  syntax: {
    wordOrder: "SVO",
    questionFormation: "interrogative_particles",
    negation: "no_pre_verbal",
  },
  lexicon: {
    commonWords: ["casa", "treball", "família", "estudis", "salut"],
    regionalisms: ["xiquets", "xiquetes", "poble", "barri", "carrer"],
    formalRegister: ["institucions", "administració", "normativa"],
  },
};

export default {
  b2: jqcvValencianoB2Config,
  c1: jqcvValencianoC1Config,
  c2: jqcvValencianoC2Config,
  components: jqcvComponentConfigs,
  rubrics: jqcvScoringRubrics,
  content: jqcvContentConfig,
  cefrDescriptors: jqcvCEFRDescriptors,
  linguisticFeatures: valencianoLinguisticFeatures,
};
