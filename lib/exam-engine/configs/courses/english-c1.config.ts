import { CourseConfiguration } from '../../types/course-config';

export const englishC1Config: CourseConfiguration = {
  courseId: "english_c1",
  
  metadata: {
    title: "English C1 Advanced",
    language: "english",
    level: "C1",
    region: "international",
    institution: "Cambridge English / EOI",
    description: "Preparation for Cambridge C1 Advanced and EOI C1 examinations",
    culturalContext: [
      "Professional communication",
      "Academic writing and research",
      "Complex argumentative discourse",
      "International business contexts",
      "Advanced literature and media"
    ]
  },

  ui: {
    language: "english",
    locale: "en-GB",
    rtl: false,
    
    theme: {
      primaryColor: "#1E40AF", // Blue 800
      accentColor: "#DC2626",  // Red 600
      backgroundColor: "#F8FAFC", // Slate 50
      textColor: "#0F172A", // Slate 900
      typography: {
        headers: "font-bold tracking-tight",
        body: "font-normal leading-relaxed",
        accent: "font-medium text-blue-600"
      },
      culturalElements: {
        patterns: "geometric",
        icons: "lucide",
        imagery: "professional",
        references: ["British Council", "Cambridge Assessment", "IELTS", "Academic contexts"]
      }
    },

    messages: {
      start: "Start Exam",
      pause: "Pause",
      continue: "Continue",
      finish: "Submit",
      next: "Next",
      previous: "Previous",
      timeWarning: "{{minutes}} minutes remaining",
      examComplete: "Exam completed successfully",
      autoSave: "Progress saved automatically",
      loading: "Loading...",
      selectAnswer: "Select your answer",
      writeYourAnswer: "Write your answer",
      recordYourResponse: "Record your response",
      correct: "Correct",
      incorrect: "Incorrect", 
      partialCredit: "Partially correct",
      culturalGreeting: "Welcome to your English C1 Advanced exam",
      encouragement: [
        "You're making excellent progress!",
        "Keep up the great work!",
        "Well done on reaching this level!",
        "Your English proficiency is impressive!"
      ]
    },

    navigation: {
      breadcrumbs: {
        home: "Home",
        courses: "Courses", 
        exams: "C1 Advanced Exams",
        progress: "Progress",
        results: "Results"
      },
      sections: {
        reading: "Reading & Use of English",
        writing: "Writing", 
        listening: "Listening",
        speaking: "Speaking"
      }
    },

    accessibility: {
      announcements: true,
      keyboardNavigation: true,
      screenReader: true,
      colorContrast: "AA",
      fontSize: "adjustable",
      reducedMotion: "respectPreference"
    }
  },

  examConfigs: {
    "cambridge_c1_001": {
      examId: "cambridge_c1_001",
      metadata: {
        title: "Cambridge C1 Advanced - Test 1",
        description: "Complete Cambridge C1 Advanced examination with all components",
        duration: 240,
        totalQuestions: 72,
        difficulty: "advanced",
        year: 2024,
        month: "March",
        examType: "complete",
        provider: "cambridge",
        certification: "Cambridge C1 Advanced"
      },
      structure: {
        sections: [
          {
            id: "reading_use_english",
            title: "Reading & Use of English",
            duration: 90,
            questions: 56,
            weight: 0.25
          },
          {
            id: "writing", 
            title: "Writing",
            duration: 90,
            questions: 2,
            weight: 0.25
          },
          {
            id: "listening",
            title: "Listening", 
            duration: 40,
            questions: 30,
            weight: 0.25
          },
          {
            id: "speaking",
            title: "Speaking",
            duration: 15,
            questions: 4,
            weight: 0.25
          }
        ]
      },
      questions: [],
      scoring: {
        passingScore: 180,
        maxScore: 200,
        gradeBoundaries: {
          A: 200,
          B: 193,
          C: 180
        }
      }
    },
    "eoi_c1_001": {
      examId: "eoi_c1_001",
      metadata: {
        title: "EOI C1 - Mock Exam 1",
        description: "Complete EOI C1 examination following official format",
        duration: 180,
        totalQuestions: 60,
        difficulty: "advanced",
        year: 2024,
        examType: "complete", 
        provider: "eoi",
        certification: "EOI C1"
      },
      structure: {
        sections: [
          {
            id: "comprension_lectora",
            title: "Comprensión Lectora",
            duration: 60,
            questions: 20,
            weight: 0.25
          },
          {
            id: "expresion_escrita",
            title: "Expresión Escrita", 
            duration: 90,
            questions: 2,
            weight: 0.25
          },
          {
            id: "comprension_oral",
            title: "Comprensión Oral",
            duration: 30,
            questions: 15,
            weight: 0.25
          }
        ]
      },
      questions: [],
      scoring: {
        passingScore: 65,
        maxScore: 100,
        gradeBoundaries: {
          "Apto": 65,
          "No Apto": 0
        }
      }
    }
  },

  providers: {
    cambridge: {
      name: "Cambridge English",
      description: "Official Cambridge C1 Advanced examinations for international certification",
      official: true,
      examIds: ["cambridge_c1_001"],
      website: "https://www.cambridgeenglish.org",
      certification: "Cambridge C1 Advanced"
    },
    eoi: {
      name: "EOI (Escuela Oficial de Idiomas)",
      description: "Official Spanish language school C1 examinations", 
      official: true,
      examIds: ["eoi_c1_001"],
      website: "https://www.educacion.gob.es",
      certification: "EOI C1"
    }
  },

  simulatorIntegration: {
    legacySimulatorUrl: "/simulators/english-c1",
    apiIntegration: true,
    realTimeSync: true
  }
};