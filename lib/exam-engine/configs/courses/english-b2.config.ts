import { CourseConfiguration } from '../../types/course-config';

export const englishB2Config: CourseConfiguration = {
  courseId: "english_b2",
  
  metadata: {
    title: "English B2 First",
    language: "english",
    level: "B2",
    region: "international",
    institution: "Cambridge English / EOI",
    description: "Preparation for Cambridge B2 First and EOI B2 examinations",
    culturalContext: [
      "Work situations and professional contexts",
      "Academic environments and study skills",
      "Social interactions and relationships",
      "Travel and cultural experiences",
      "Current events and media"
    ]
  },

  ui: {
    language: "english",
    locale: "en-GB",
    rtl: false,
    
    theme: {
      primaryColor: "#059669", // Emerald 600
      accentColor: "#DC2626",  // Red 600
      backgroundColor: "#F0FDF4", // Green 50
      textColor: "#0F172A", // Slate 900
      typography: {
        headers: "font-bold tracking-tight",
        body: "font-normal leading-relaxed",
        accent: "font-medium text-emerald-600"
      },
      culturalElements: {
        patterns: "geometric",
        icons: "lucide",
        imagery: "modern",
        references: ["British Council", "Cambridge Assessment", "First Certificate", "Work contexts"]
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
      culturalGreeting: "Welcome to your English B2 First exam",
      encouragement: [
        "Great progress so far!",
        "You're doing well!",
        "Keep going, you've got this!",
        "Excellent work!"
      ]
    },

    navigation: {
      breadcrumbs: {
        home: "Home",
        courses: "Courses", 
        exams: "B2 First Exams",
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
    "cambridge_b2_001": {
      examId: "cambridge_b2_001",
      metadata: {
        title: "Cambridge B2 First - Test 1",
        description: "Complete Cambridge B2 First examination with all components",
        duration: 209,
        totalQuestions: 52,
        difficulty: "intermediate",
        year: 2024,
        month: "March",
        examType: "complete",
        provider: "cambridge",
        certification: "Cambridge B2 First"
      },
      structure: {
        sections: [
          {
            id: "reading_use_english",
            title: "Reading & Use of English",
            duration: 75,
            questions: 42,
            weight: 0.25
          },
          {
            id: "writing", 
            title: "Writing",
            duration: 80,
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
            duration: 14,
            questions: 4,
            weight: 0.25
          }
        ]
      },
      questions: [],
      scoring: {
        passingScore: 160,
        maxScore: 190,
        gradeBoundaries: {
          A: 180,
          B: 173,
          C: 160
        }
      }
    },
    "eoi_b2_001": {
      examId: "eoi_b2_001",
      metadata: {
        title: "EOI B2 - Mock Exam 1",
        description: "Complete EOI B2 examination following official format",
        duration: 150,
        totalQuestions: 45,
        difficulty: "intermediate",
        year: 2024,
        examType: "complete", 
        provider: "eoi",
        certification: "EOI B2"
      },
      structure: {
        sections: [
          {
            id: "comprension_lectora",
            title: "Comprensión Lectora",
            duration: 50,
            questions: 15,
            weight: 0.25
          },
          {
            id: "expresion_escrita",
            title: "Expresión Escrita", 
            duration: 75,
            questions: 2,
            weight: 0.25
          },
          {
            id: "comprension_oral",
            title: "Comprensión Oral",
            duration: 25,
            questions: 10,
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
      description: "Official Cambridge B2 First examinations for international certification",
      official: true,
      examIds: ["cambridge_b2_001"],
      website: "https://www.cambridgeenglish.org",
      certification: "Cambridge B2 First"
    },
    eoi: {
      name: "EOI (Escuela Oficial de Idiomas)",
      description: "Official Spanish language school B2 examinations", 
      official: true,
      examIds: ["eoi_b2_001"],
      website: "https://www.educacion.gob.es",
      certification: "EOI B2"
    }
  },

  simulatorIntegration: {
    legacySimulatorUrl: "/simulators/english-b2",
    apiIntegration: true,
    realTimeSync: true
  }
};