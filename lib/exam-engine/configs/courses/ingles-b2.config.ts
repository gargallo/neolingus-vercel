import { CourseConfiguration } from '../../types/course-config';

export const inglesB2Config: CourseConfiguration = {
  courseId: "ingles_b2",
  
  metadata: {
    title: "English B2 First",
    language: "english",
    level: "B2",
    region: "cambridge",
    institution: "Cambridge English / EOI",
    description: "Preparation for official B2 English certification exams",
    culturalContext: [
      "British and international culture",
      "Contemporary social issues",
      "Academic and professional contexts",
      "Global perspectives"
    ]
  },

  ui: {
    language: "english",
    locale: "en-GB",
    rtl: false,
    
    theme: {
      primaryColor: "#1E40AF", // Cambridge Blue
      accentColor: "#059669",  // British Racing Green
      backgroundColor: "#F8FAFC", // Clean British Grey
      textColor: "#1F2937",
      typography: {
        headers: "Crimson Text",
        body: "Inter",
        accent: "Roboto"
      },
      culturalElements: {
        patterns: "subtle_union_jack",
        icons: "british_cultural_icons",
        imagery: "uk_landmarks",
        references: ["Big Ben", "British Museum", "Lake District", "Shakespeare"]
      }
    },

    navigation: {
      sections: {
        "reading_use_of_english": "Reading & Use of English",
        "writing": "Writing",
        "listening": "Listening",
        "speaking": "Speaking"
      },
      breadcrumbs: {
        home: "Home",
        exams: "Exams",
        practice: "Practice"
      }
    },

    messages: {
      // Navigation
      start: "Start Exam",
      pause: "Pause",
      continue: "Continue",
      finish: "Submit",
      next: "Next",
      previous: "Previous",
      
      // Status
      timeWarning: "{{minutes}} minutes remaining",
      examComplete: "Exam completed successfully",
      autoSave: "Progress saved automatically",
      loading: "Loading...",
      
      // Instructions
      selectAnswer: "Choose the correct answer",
      writeYourAnswer: "Write your answer",
      recordYourResponse: "Record your response",
      
      // Feedback
      correct: "Correct!",
      incorrect: "Incorrect",
      partialCredit: "Partially correct",
      
      // Cultural context
      culturalGreeting: "Good morning! Ready for your exam?",
      encouragement: [
        "Well done! Keep going!",
        "Excellent progress!",
        "You're doing great!"
      ]
    },

    dateFormat: "dd/mm/yyyy",
    timeFormat: "HH:mm",
    numberFormat: "en-GB"
  },

  examConfigs: {
    "cambridge_b2_first_2022": {
      examId: "cambridge_b2_first_2022",
      metadata: {
        title: "Cambridge B2 First (FCE) 2022",
        institution: "Cambridge English",
        provider: "cambridge",
        language: "english",
        level: "B2",
        year: 2022,
        officialExam: true,
        duration: 210, // 3.5 hours
        totalQuestions: 52,
        passingScore: 160, // Cambridge scale
        maxScore: 190,
        description: "Official Cambridge B2 First Certificate in English examination"
      },
      sections: [
        {
          id: "reading_use_of_english",
          name: "Reading & Use of English",
          duration: 75,
          icon: "fas fa-book-open",
          parts: [
            {
              partId: "multiple_choice_cloze",
              name: "Multiple Choice Cloze",
              instructions: "For questions 1-8, read the text below and decide which answer (A, B, C or D) best fits each gap.",
              questionType: "multiple_choice",
              questionCount: 8,
              text: {
                title: "The Future of Work",
                content: `The world of work is changing rapidly, and many experts believe that the changes we are witnessing today are just the beginning. Technological advances are (1) ____ the way we work, and this transformation is likely to accelerate in the coming years...`
              },
              questions: [
                {
                  id: "rue_1",
                  number: 1,
                  type: "multiple_choice",
                  points: 1,
                  options: [
                    { value: "A", text: "converting" },
                    { value: "B", text: "transforming" },
                    { value: "C", text: "altering" },
                    { value: "D", text: "modifying" }
                  ],
                  correctAnswer: "B"
                }
                // ... more questions
              ]
            }
          ]
        },
        {
          id: "writing",
          name: "Writing", 
          duration: 80,
          icon: "fas fa-edit",
          parts: [
            {
              partId: "essay",
              name: "Essay",
              instructions: "Write an essay of 140-190 words on the following topic.",
              questionType: "essay",
              questionCount: 1,
              questions: [
                {
                  id: "w_1",
                  number: 1,
                  type: "essay",
                  points: 20,
                  text: "Some people say that physical books will completely disappear and be replaced by e-books. Do you agree?",
                  maxWords: 190,
                  rubric: {
                    criteria: {
                      "content": { 
                        weight: 0.25, 
                        description: "All content relevant, ideas well-developed, position clear" 
                      },
                      "communicative_achievement": { 
                        weight: 0.25, 
                        description: "Appropriate register, natural language use" 
                      },
                      "organisation": { 
                        weight: 0.25, 
                        description: "Clear structure, logical sequencing, cohesive devices" 
                      },
                      "language": { 
                        weight: 0.25, 
                        description: "Vocabulary range, grammatical accuracy, appropriate register" 
                      }
                    },
                    totalPoints: 20,
                    passingThreshold: 12
                  }
                }
              ]
            }
          ]
        }
      ],
      scoring: {
        passingScore: 160,
        maxScore: 190,
        weightings: {
          "reading_use_of_english": 0.25,
          "writing": 0.25,
          "listening": 0.25,
          "speaking": 0.25
        },
        rubrics: {
          "essay": {
            criteria: {
              "content": { weight: 0.25, description: "Task completion, relevant ideas, clear position" },
              "communicative_achievement": { weight: 0.25, description: "Appropriate register, natural language" },
              "organisation": { weight: 0.25, description: "Clear structure, logical sequencing, cohesive devices" },
              "language": { weight: 0.25, description: "Vocabulary range, grammatical accuracy, appropriate register" }
            },
            totalPoints: 20,
            passingThreshold: 12
          }
        }
      },
      messages: {
        welcome: "Welcome to the Cambridge B2 First examination",
        instructions: "Read the instructions for each part carefully"
      },
      settings: {
        allowPause: false, // Cambridge exams don't allow pauses
        showTimer: true,
        showProgress: true,
        autoSave: true,
        autoSaveInterval: 45,
        warnings: [
          { timeRemaining: 30, message: "30 minutes remaining" },
          { timeRemaining: 15, message: "15 minutes remaining" },
          { timeRemaining: 5, message: "Only 5 minutes left!" }
        ]
      }
    },

    "eoi_andalucia_b2_2024": {
      examId: "eoi_andalucia_b2_2024",
      metadata: {
        title: "EOI Andalucía B2 English 2024",
        institution: "Escuela Oficial de Idiomas Andalucía",
        provider: "eoi_andalucia",
        language: "english",
        level: "B2",
        year: 2024,
        officialExam: true,
        duration: 180,
        totalQuestions: 40,
        passingScore: 65,
        maxScore: 100
      },
      sections: [
        // Similar structure but with EOI-specific content and Spanish instructions
      ],
      scoring: {
        passingScore: 65,
        maxScore: 100,
        weightings: {
          "comprension_lectora": 0.2,
          "comprension_oral": 0.2,
          "expresion_escrita": 0.2,
          "expresion_oral": 0.2,
          "mediacion": 0.2
        },
        rubrics: {
          "essay": {
            criteria: {
              "contenido": { weight: 0.3, description: "Contenido y desarrollo de ideas" },
              "organizacion": { weight: 0.25, description: "Estructura y coherencia" },
              "vocabulario": { weight: 0.25, description: "Riqueza y precisión léxica" },
              "gramatica": { weight: 0.2, description: "Corrección gramatical" }
            },
            totalPoints: 10,
            passingThreshold: 6.5
          }
        }
      },
      messages: {
        welcome: "Bienvenido al examen EOI Andalucía B2 Inglés",
        instructions: "Lee atentamente las instrucciones de cada parte"
      },
      settings: {
        allowPause: true,
        showTimer: true,
        showProgress: true,
        autoSave: true,
        autoSaveInterval: 60,
        warnings: [
          { timeRemaining: 30, message: "Quedan 30 minutos" },
          { timeRemaining: 15, message: "Quedan 15 minutos" },
          { timeRemaining: 5, message: "¡Últimos 5 minutos!" }
        ]
      }
    }
  },

  providers: {
    "cambridge": {
      name: "Cambridge English",
      examIds: ["cambridge_b2_first_2022"],
      official: true,
      description: "Official Cambridge English B2 First Certificate examination"
    },
    "eoi_andalucia": {
      name: "EOI Andalucía",
      examIds: ["eoi_andalucia_b2_2024"],
      official: true,
      description: "Escuela Oficial de Idiomas de Andalucía - Certificado oficial del Ministerio de Educación"
    }
  },

  scoringAdjustments: {
    culturalBonus: 2, // Smaller bonus for international language
    languageVariant: "british",
    dialectSupport: true // Accept both British and American variants
  },

  simulatorIntegration: {
    legacyPath: "/real-exams/simulators/english/b2-first",
    migrationStatus: "hybrid",
    features: {
      timer: true,
      progress: true,
      autoSave: true,
      analytics: true
    }
  }
};