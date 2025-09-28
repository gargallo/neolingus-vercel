import { CourseConfiguration } from '../../types/course-config';

export const valencianoB2Config: CourseConfiguration = {
  courseId: "valenciano_b2",
  
  metadata: {
    title: "Valencià B2",
    language: "valenciano",
    level: "B2",
    region: "valencia",
    institution: "EOI / CIEACOVA",
    description: "Preparació per als exàmens oficials de valencià nivell B2",
    culturalContext: [
      "Cultura valenciana contemporània",
      "Tradicions i festes del País Valencià", 
      "Context professional i acadèmic",
      "Mitjans de comunicació valencians",
      "Literatura i arts valencianes"
    ]
  },

  ui: {
    language: "valenciano",
    locale: "ca-ES-valencia",
    rtl: false,
    
    theme: {
      primaryColor: "#D97706", // Amber 600
      accentColor: "#DC2626",  // Red 600
      backgroundColor: "#FEF3C7", // Amber 50
      textColor: "#0F172A", // Slate 900
      typography: {
        headers: "font-bold tracking-tight",
        body: "font-normal leading-relaxed",
        accent: "font-medium text-amber-600"
      },
      culturalElements: {
        patterns: "valencia-tiles",
        icons: "lucide",
        imagery: "mediterranean",
        references: ["Generalitat Valenciana", "País Valencià", "Tradicions", "Senyera"]
      }
    },

    messages: {
      start: "Començar Examen",
      pause: "Pausar",
      continue: "Continuar",
      finish: "Finalitzar",
      next: "Següent",
      previous: "Anterior",
      timeWarning: "Queden {{minutes}} minuts",
      examComplete: "Examen completat correctament",
      autoSave: "Progrés guardat automàticament",
      loading: "Carregant...",
      selectAnswer: "Selecciona la teua resposta",
      writeYourAnswer: "Escriu la teua resposta",
      recordYourResponse: "Grava la teua resposta",
      correct: "Correcte",
      incorrect: "Incorrecte",
      partialCredit: "Parcialment correcte",
      culturalGreeting: "Benvingut/da al teu examen de Valencià B2",
      encouragement: [
        "Vas molt bé!",
        "Excel·lent treball!",
        "Continua així!",
        "Molt bon nivell de valencià!"
      ]
    },

    navigation: {
      breadcrumbs: {
        home: "Inici",
        courses: "Cursos",
        exams: "Exàmens B2",
        progress: "Progrés", 
        results: "Resultats"
      },
      sections: {
        reading: "Comprensió Lectora",
        writing: "Expressió Escrita",
        listening: "Comprensió Oral",
        speaking: "Expressió Oral"
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
    "cieacova_b2_001": {
      examId: "cieacova_b2_001",
      metadata: {
        title: "CIEACOVA B2 - Examen 1",
        description: "Examen complet CIEACOVA nivell B2 amb totes les competències",
        duration: 180,
        totalQuestions: 55,
        difficulty: "intermediate",
        year: 2024,
        month: "Març",
        examType: "complete",
        provider: "cieacova",
        certification: "CIEACOVA B2"
      },
      structure: {
        sections: [
          {
            id: "comprensio_lectora",
            title: "Comprensió Lectora",
            duration: 60,
            questions: 20,
            weight: 0.25
          },
          {
            id: "expressio_escrita",
            title: "Expressió Escrita",
            duration: 75,
            questions: 2,
            weight: 0.25
          },
          {
            id: "comprensio_oral", 
            title: "Comprensió Oral",
            duration: 30,
            questions: 15,
            weight: 0.25
          },
          {
            id: "expressio_oral",
            title: "Expressió Oral", 
            duration: 15,
            questions: 3,
            weight: 0.25
          }
        ]
      },
      questions: [],
      scoring: {
        passingScore: 65,
        maxScore: 100,
        gradeBoundaries: {
          "Apte": 65,
          "No Apte": 0
        }
      }
    },
    "jqcv_b2_001": {
      examId: "jqcv_b2_001", 
      metadata: {
        title: "JQCV B2 - Prova 1",
        description: "Simulacro de l'examen JQCV nivell B2 seguint el format oficial",
        duration: 150,
        totalQuestions: 50,
        difficulty: "intermediate",
        year: 2024,
        examType: "complete",
        provider: "jqcv",
        certification: "JQCV B2"
      },
      structure: {
        sections: [
          {
            id: "comprensio_lectora",
            title: "Comprensió Lectora",
            duration: 50,
            questions: 18,
            weight: 0.3
          },
          {
            id: "expressio_escrita",
            title: "Expressió Escrita",
            duration: 70,
            questions: 2,
            weight: 0.3
          },
          {
            id: "comprensio_oral",
            title: "Comprensió Oral", 
            duration: 30,
            questions: 12,
            weight: 0.4
          }
        ]
      },
      questions: [],
      scoring: {
        passingScore: 60,
        maxScore: 100,
        gradeBoundaries: {
          "Apte": 60,
          "No Apte": 0
        }
      }
    }
  },

  providers: {
    cieacova: {
      name: "CIEACOVA",
      description: "Comité Interuniversitario para la Evaluación del Conocimiento del Valenciano - Certificaciones universitarias oficiales",
      official: true,
      examIds: ["cieacova_b2_001"],
      website: "https://cieacova.es",
      certification: "CIEACOVA B2"
    },
    jqcv: {
      name: "JQCV",
      description: "Junta Qualificadora de Coneixements de Valencià - Certificacions oficials de la Generalitat",
      official: true, 
      examIds: ["jqcv_b2_001"],
      website: "https://jqcv.gva.es",
      certification: "JQCV B2"
    }
  },

  simulatorIntegration: {
    legacySimulatorUrl: "/simulators/valenciano-b2",
    apiIntegration: true,
    realTimeSync: true
  }
};