import { CourseConfiguration } from '../../types/course-config';

export const valencianoC1Config: CourseConfiguration = {
  courseId: "valenciano_c1",
  
  metadata: {
    title: "Valencià C1",
    language: "valenciano",
    level: "C1",
    region: "valencia",
    institution: "EOI / CIEACOVA",
    description: "Preparació per als exàmens oficials de valencià nivell C1",
    culturalContext: [
      "Literatura valenciana contemporània",
      "Tradicions i festes valencianes", 
      "Història del País Valencià",
      "Cultura mediterrània",
      "Institucions valencianes"
    ]
  },

  ui: {
    language: "valenciano",
    locale: "ca-ES-valencia",
    rtl: false,
    
    theme: {
      primaryColor: "#D97706", // Taronja València
      accentColor: "#DC2626",  // Roig senyera
      backgroundColor: "#FEF3C7", // Crema mediterrani
      textColor: "#1F2937",
      typography: {
        headers: "Playfair Display",
        body: "Inter",
        accent: "Montserrat"
      },
      culturalElements: {
        patterns: "senyera_stripes",
        icons: "valencian_cultural_icons",
        imagery: "valencia_landmarks",
        references: ["Micalet", "Ciudad de las Artes", "Albufera", "Fallas"]
      }
    },

    navigation: {
      sections: {
        "comprensio_lectora": "Comprensió Lectora",
        "comprensio_oral": "Comprensió Oral", 
        "expressio_escrita": "Expressió Escrita",
        "expressio_oral": "Expressió Oral",
        "mediacio": "Mediació"
      },
      breadcrumbs: {
        home: "Inici",
        exams: "Exàmens",
        practice: "Pràctica"
      }
    },

    messages: {
      // Navigation
      start: "Començar Examen",
      pause: "Pausar",
      continue: "Continuar",
      finish: "Finalitzar",
      next: "Següent",
      previous: "Anterior",
      
      // Status
      timeWarning: "Queden {{minutes}} minuts per acabar",
      examComplete: "Examen completat correctament",
      autoSave: "Progrés desat automàticament",
      loading: "Carregant...",
      
      // Instructions
      selectAnswer: "Selecciona la resposta correcta",
      writeYourAnswer: "Escriu la teua resposta",
      recordYourResponse: "Grava la teua resposta",
      
      // Feedback
      correct: "Correcte!",
      incorrect: "Incorrecte",
      partialCredit: "Parcialment correcte",
      
      // Cultural context
      culturalGreeting: "Bon dia! Preparat per a l'examen?",
      encouragement: [
        "Molt bé! Continues així!",
        "Excel·lent progrés!",
        "Estàs fent-ho genial!"
      ]
    },

    dateFormat: "dd/mm/yyyy",
    timeFormat: "HH:mm",
    numberFormat: "es-ES"
  },

  examConfigs: {
    "cieacova_c1_2025": {
      examId: "cieacova_c1_2025",
      metadata: {
        title: "CIEACOVA C1 Valencià 2025",
        institution: "CIEACOVA",
        provider: "cieacova",
        language: "valenciano",
        level: "C1",
        year: 2025,
        officialExam: true,
        duration: 180, // 3 horas
        totalQuestions: 45,
        passingScore: 65,
        maxScore: 100,
        description: "Examen oficial CIEACOVA per a l'acreditació del nivell C1 de valencià"
      },
      sections: [
        {
          id: "comprensio_lectora",
          name: "Comprensió Lectora",
          duration: 60,
          icon: "fas fa-book-open",
          parts: [
            {
              partId: "text_sostenibilitat",
              name: "Text sobre sostenibilitat urbana",
              instructions: "Llegeix el text i respon les preguntes 1-8 seleccionant l'opció correcta",
              questionType: "multiple_choice",
              questionCount: 8,
              text: {
                title: "Cap a unes ciutats més sostenibles",
                content: `La Comunitat Valenciana està desenvolupant un procés de transformació urbana orientat cap a la sostenibilitat i la millora de la qualitat de vida dels ciutadans. Les ciutats valencianes han iniciat diverses iniciatives que busquen equilibrar el desenvolupament econòmic amb la conservació del medi ambient i la cohesió social.

Aquest procés implica la implementació de polítiques públiques que fomenten l'ús d'energies renovables, la creació d'espais verds urbans i la promoció del transport sostenible. A més, les administracions locals treballen per garantir l'accessibilitat universal i la inclusió social en tots els projectes urbans.

La sostenibilitat urbana no es limita només als aspectes mediambientals, sinó que abasta també la sostenibilitat econòmica i social. Això significa que les iniciatives han de ser viables a llarg termini i beneficiar tots els sectors de la població, especialment els més vulnerables.

En aquest context, la participació ciutadana esdevé fonamental per assegurar que les transformacions urbanes responguin realment a les necessitats i expectatives de la comunitat. Els processos participatius permeten que els residents contribueixin amb les seues idees i prioritats per crear ciutats més habitables i inclusives.`
              },
              questions: [
                {
                  id: "cl_1",
                  number: 1,
                  type: "multiple_choice",
                  points: 1,
                  text: "Segons el text, la transformació urbana en la Comunitat Valenciana es caracteritza per:",
                  options: [
                    { value: "A", text: "prioritzar el desenvolupament econòmic" },
                    { value: "B", text: "centrar-se en la sostenibilitat ambiental" },
                    { value: "C", text: "augmentar la densitat populacional" },
                    { value: "D", text: "modernitzar les infrastructures antigues" }
                  ],
                  correctAnswer: "B"
                },
                {
                  id: "cl_2",
                  number: 2,
                  type: "multiple_choice",
                  points: 1,
                  text: "Quina és la principal finalitat de les iniciatives urbanes esmentades al text?",
                  options: [
                    { value: "A", text: "incrementar la població urbana" },
                    { value: "B", text: "millorar la qualitat de vida dels ciutadans" },
                    { value: "C", text: "atraure inversió estrangera" },
                    { value: "D", text: "expandir les zones metropolitanes" }
                  ],
                  correctAnswer: "B"
                },
                {
                  id: "cl_3",
                  number: 3,
                  type: "multiple_choice",
                  points: 1,
                  text: "Segons el context del text, què implica la sostenibilitat urbana?",
                  options: [
                    { value: "A", text: "només la protecció del medi ambient" },
                    { value: "B", text: "el desenvolupament econòmic sense límits" },
                    { value: "C", text: "l'equilibri entre desenvolupament i conservació" },
                    { value: "D", text: "la reducció de la població urbana" }
                  ],
                  correctAnswer: "C"
                }
              ]
            },
            {
              partId: "text_cultura_valenciana",
              name: "Text sobre cultura valenciana",
              instructions: "Llegeix el text i respon les preguntes 4-6",
              questionType: "multiple_choice",
              questionCount: 3,
              text: {
                title: "Les Falles: tradició i innovació",
                content: `Les Falles de València representen una de les expressions culturals més representatives del poble valencià. Aquesta festa, declarada Patrimoni Immaterial de la Humanitat per la UNESCO, combina tradició i innovació d'una manera única.

Cada any, els fallers i falleres treballen durant mesos per crear monuments artístics que critiquen la societat contemporània amb humor i creativitat. Aquest procés col·lectiu de creació involucra artistes, artesans i veïns de tots els barris de la ciutat.`
              },
              questions: [
                {
                  id: "cl_4",
                  number: 4,
                  type: "multiple_choice",
                  points: 1,
                  text: "Segons el text, què representen les Falles per al poble valencià?",
                  options: [
                    { value: "A", text: "una activitat econòmica important" },
                    { value: "B", text: "una expressió cultural representativa" },
                    { value: "C", text: "una festa religiosa tradicional" },
                    { value: "D", text: "un espectacle turístic modern" }
                  ],
                  correctAnswer: "B"
                },
                {
                  id: "cl_5",
                  number: 5,
                  type: "multiple_choice",
                  points: 1,
                  text: "El reconeixement de la UNESCO indica que les Falles són:",
                  options: [
                    { value: "A", text: "Patrimoni Material de la Humanitat" },
                    { value: "B", text: "Patrimoni Immaterial de la Humanitat" },
                    { value: "C", text: "Patrimoni Cultural Europeu" },
                    { value: "D", text: "Patrimoni Nacional Espanyol" }
                  ],
                  correctAnswer: "B"
                },
                {
                  id: "cl_6",
                  number: 6,
                  type: "multiple_choice",
                  points: 1,
                  text: "El procés de creació de les Falles es caracteritza per ser:",
                  options: [
                    { value: "A", text: "exclusivament artístic" },
                    { value: "B", text: "principalment turístic" },
                    { value: "C", text: "col·lectiu i participatiu" },
                    { value: "D", text: "només tradicional" }
                  ],
                  correctAnswer: "C"
                }
              ]
            }
          ]
        },
        {
          id: "expressio_escrita",
          name: "Expressió Escrita",
          duration: 60,
          icon: "fas fa-pen",
          parts: [
            {
              partId: "assaig_sostenibilitat",
              name: "Assaig argumentatiu",
              instructions: "Escriu un text argumentatiu de 200-250 paraules sobre el tema proposat",
              questionType: "essay",
              questionCount: 1,
              questions: [
                {
                  id: "ee_1",
                  number: 1,
                  type: "essay",
                  points: 10,
                  text: "La sostenibilitat urbana és un dels reptes més importants del segle XXI. Explica quines mesures consideres més efectives per crear ciutats més sostenibles i argumenta la teua posició amb exemples concrets.",
                  wordLimit: 250,
                  timeLimit: 60
                }
              ]
            }
          ]
        }
      ],
      scoring: {
        passingScore: 65,
        maxScore: 100,
        weightings: {
          "comprensio_lectora": 0.25,
          "comprensio_oral": 0.25,
          "expressio_escrita": 0.25,
          "expressio_oral": 0.25
        },
        rubrics: {
          "essay": {
            criteria: {
              "adequacio": { 
                weight: 0.25, 
                description: "Registre apropiat, coherència amb el context cultural valencià" 
              },
              "cohesio": { 
                weight: 0.25, 
                description: "Estructura clara, connectors apropiats del valencià" 
              },
              "riquesa_linguistica": { 
                weight: 0.25, 
                description: "Vocabulari variat, precisió gramatical valenciana" 
              },
              "coneixement_cultural": { 
                weight: 0.25, 
                description: "Referències culturals valencianes adequades" 
              }
            },
            totalPoints: 10,
            passingThreshold: 6
          }
        }
      },
      messages: {
        welcome: "Benvingut a l'examen oficial CIEACOVA C1",
        instructions: "Llegeix atentament les instruccions abans de començar"
      },
      settings: {
        allowPause: true,
        showTimer: true,
        showProgress: true,
        autoSave: true,
        autoSaveInterval: 60,
        warnings: [
          { timeRemaining: 30, message: "Queden 30 minuts" },
          { timeRemaining: 15, message: "Queden 15 minuts" },
          { timeRemaining: 5, message: "Queden només 5 minuts!" }
        ]
      }
    },

    "eoi_valencia_c1_2024": {
      examId: "eoi_valencia_c1_2024",
      metadata: {
        title: "EOI València C1 2024",
        institution: "Escola Oficial d'Idiomes de València",
        provider: "eoi_valencia",
        language: "valenciano",
        level: "C1",
        year: 2024,
        officialExam: true,
        duration: 210, // 3.5 horas
        totalQuestions: 50,
        passingScore: 60,
        maxScore: 100
      },
      sections: [
        // Similar structure but with EOI-specific content
      ],
      scoring: {
        passingScore: 60,
        maxScore: 100,
        weightings: {
          "comprensio_lectora": 0.2,
          "comprensio_oral": 0.2,
          "expressio_escrita": 0.2,
          "expressio_oral": 0.2,
          "mediacio": 0.2
        },
        rubrics: {
          "essay": {
            criteria: {
              "adequacio": { weight: 0.3, description: "Adequació al context i registre" },
              "fluixesa": { weight: 0.25, description: "Fluïdesa i naturalitat" },
              "correcio": { weight: 0.25, description: "Correcció lingüística" },
              "riquesa": { weight: 0.2, description: "Riquesa i varietat lèxica" }
            },
            totalPoints: 10,
            passingThreshold: 6
          }
        }
      },
      messages: {
        welcome: "Benvingut a l'examen EOI València C1",
        instructions: "Segueix les instruccions de cada part"
      },
      settings: {
        allowPause: false, // EOI no permite pausas
        showTimer: true,
        showProgress: true,
        autoSave: true,
        autoSaveInterval: 30, // Más frecuente
        warnings: [
          { timeRemaining: 45, message: "Queden 45 minuts" },
          { timeRemaining: 20, message: "Queden 20 minuts" },
          { timeRemaining: 10, message: "Últims 10 minuts!" }
        ]
      }
    }
  },

  providers: {
    "cieacova": {
      name: "CIEACOVA",
      examIds: ["cieacova_c1_2025"],
      official: true,
      description: "Certificació oficial de la Generalitat Valenciana per a l'administració pública"
    },
    "eoi_valencia": {
      name: "EOI València",
      examIds: ["eoi_valencia_c1_2024"],
      official: true,
      description: "Escola Oficial d'Idiomes - Títols oficials del Ministeri d'Educació"
    }
  },

  scoringAdjustments: {
    culturalBonus: 5, // 5% bonus for cultural knowledge
    languageVariant: "valencia",
    dialectSupport: true
  },

  simulatorIntegration: {
    legacyPath: "/real-exams/simulators/valenciano/c1-cieacova",
    migrationStatus: "native", // Use new React-based simulator
    features: {
      timer: true,
      progress: true,
      autoSave: true,
      analytics: true
    }
  }
};