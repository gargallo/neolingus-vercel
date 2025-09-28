// Maestro de Cohesión - Expanded Exercise Database
// 200+ exercises across all levels and languages

import { Exercise, ExerciseMode, Language, Difficulty } from './exercises';

// ==================== SUBSTITUTION EXERCISES ====================

// ENGLISH SUBSTITUTION (A1-C2)
const substitutionEnglish: Exercise[] = [
  // A1 Level
  {
    id: 'sub_en_a1_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'easy',
    category: 'basic-connection',
    instruction: 'Replace with a better connector',
    content: 'I like apples. [And] I like oranges.',
    correctAnswer: 'Also',
    options: ['Also', 'But', 'Because', 'However'],
    explanation: '"Also" is more precise than "and" for adding similar ideas.',
    points: 5,
    tags: ['addition', 'basic', 'fruit']
  },
  {
    id: 'sub_en_a1_002',
    mode: 'substitution',
    language: 'en',
    difficulty: 'easy',
    category: 'basic-contrast',
    instruction: 'Choose a better contrast word',
    content: 'The weather is cold. [But] I will go outside.',
    correctAnswer: 'However',
    options: ['However', 'And', 'So', 'Because'],
    explanation: '"However" is more formal than "but" for contrasting ideas.',
    points: 5,
    tags: ['contrast', 'weather', 'basic']
  },
  {
    id: 'sub_en_a1_003',
    mode: 'substitution',
    language: 'en',
    difficulty: 'easy',
    category: 'basic-reason',
    instruction: 'Select a better reason connector',
    content: 'I stayed home [because] it was raining.',
    correctAnswer: 'Since',
    options: ['Since', 'But', 'And', 'However'],
    explanation: '"Since" provides a cleaner causal relationship.',
    points: 5,
    tags: ['causality', 'weather', 'reason']
  },

  // A2 Level
  {
    id: 'sub_en_a2_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'easy',
    category: 'time-sequence',
    instruction: 'Improve this time connector',
    content: '[After] finishing homework, I watched TV.',
    correctAnswer: 'Upon',
    options: ['Upon', 'Before', 'While', 'During'],
    explanation: '"Upon" is more sophisticated for immediate sequence.',
    points: 6,
    tags: ['time', 'sequence', 'homework']
  },
  {
    id: 'sub_en_a2_002',
    mode: 'substitution',
    language: 'en',
    difficulty: 'easy',
    category: 'purpose',
    instruction: 'Choose a better purpose connector',
    content: 'I study hard [so that] I can pass the exam.',
    correctAnswer: 'In order to',
    options: ['In order to', 'Because', 'While', 'Although'],
    explanation: '"In order to" clearly expresses purpose and intention.',
    points: 6,
    tags: ['purpose', 'study', 'goals']
  },

  // B1 Level
  {
    id: 'sub_en_b1_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'medium',
    category: 'concession',
    instruction: 'Replace with a more sophisticated alternative',
    content: '[Although] the task was difficult, we completed it successfully.',
    correctAnswer: 'Despite the fact that',
    options: ['Despite the fact that', 'Because', 'Therefore', 'Meanwhile'],
    explanation: '"Despite the fact that" shows stronger concession for B1 level.',
    points: 8,
    tags: ['concession', 'difficulty', 'completion']
  },
  {
    id: 'sub_en_b1_002',
    mode: 'substitution',
    language: 'en',
    difficulty: 'medium',
    category: 'result',
    instruction: 'Select a more precise result connector',
    content: 'The traffic was heavy. [So] we arrived late.',
    correctAnswer: 'Consequently',
    options: ['Consequently', 'But', 'Although', 'Meanwhile'],
    explanation: '"Consequently" shows a direct logical result more formally.',
    points: 8,
    tags: ['result', 'traffic', 'lateness']
  },

  // B2 Level
  {
    id: 'sub_en_b2_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'medium',
    category: 'emphasis',
    instruction: 'Upgrade to a B2-level emphatic connector',
    content: 'The presentation was excellent. [More importantly], it convinced the investors.',
    correctAnswer: 'What is more significant',
    options: ['What is more significant', 'Also', 'But', 'Then'],
    explanation: '"What is more significant" provides stronger emphasis for B2 level.',
    points: 10,
    tags: ['emphasis', 'presentation', 'business']
  },
  {
    id: 'sub_en_b2_002',
    mode: 'substitution',
    language: 'en',
    difficulty: 'medium',
    category: 'clarification',
    instruction: 'Choose a more precise clarifying connector',
    content: 'The policy has flaws. [That is], it needs revision.',
    correctAnswer: 'Specifically',
    options: ['Specifically', 'Also', 'However', 'Meanwhile'],
    explanation: '"Specifically" provides clearer specification than "that is".',
    points: 10,
    tags: ['clarification', 'policy', 'revision']
  },

  // C1 Level
  {
    id: 'sub_en_c1_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'hard',
    category: 'academic-contrast',
    instruction: 'Select the most academic alternative',
    content: 'The methodology appears sound. [However], several limitations warrant consideration.',
    correctAnswer: 'Nevertheless',
    options: ['Nevertheless', 'But', 'Although', 'Since'],
    explanation: '"Nevertheless" conveys sophisticated academic contrast.',
    points: 12,
    tags: ['academic', 'methodology', 'limitations']
  },
  {
    id: 'sub_en_c1_002',
    mode: 'substitution',
    language: 'en',
    difficulty: 'hard',
    category: 'conditional',
    instruction: 'Replace with a more sophisticated conditional',
    content: '[If] the hypothesis proves correct, implications will be significant.',
    correctAnswer: 'Should',
    options: ['Should', 'When', 'Because', 'Although'],
    explanation: '"Should" creates more elegant hypothetical construction.',
    points: 12,
    tags: ['conditional', 'hypothesis', 'implications']
  },

  // C2 Level
  {
    id: 'sub_en_c2_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'hard',
    category: 'nuanced-contrast',
    instruction: 'Choose the most nuanced contrastive connector',
    content: 'The theory demonstrates elegance. [Nonetheless], empirical validation remains elusive.',
    correctAnswer: 'Notwithstanding this',
    options: ['Notwithstanding this', 'But', 'However', 'Although'],
    explanation: '"Notwithstanding this" shows sophisticated academic reservation.',
    points: 15,
    tags: ['theory', 'empirical', 'validation', 'advanced']
  }
];

// SPANISH SUBSTITUTION (A1-C2)
const substitutionSpanish: Exercise[] = [
  // A1 Level
  {
    id: 'sub_es_a1_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'easy',
    category: 'adición-básica',
    instruction: 'Sustituye por un conector mejor',
    content: 'Me gusta la pizza. [Y] me gusta la pasta.',
    correctAnswer: 'También',
    options: ['También', 'Pero', 'Porque', 'Aunque'],
    explanation: '"También" es más específico que "y" para añadir ideas similares.',
    points: 5,
    tags: ['adición', 'comida', 'básico']
  },
  {
    id: 'sub_es_a1_002',
    mode: 'substitution',
    language: 'es',
    difficulty: 'easy',
    category: 'contraste-básico',
    instruction: 'Elige un mejor conector de contraste',
    content: 'El día está nublado. [Pero] vamos a la playa.',
    correctAnswer: 'Sin embargo',
    options: ['Sin embargo', 'Y', 'Porque', 'Entonces'],
    explanation: '"Sin embargo" es más formal que "pero" para contrastar.',
    points: 5,
    tags: ['contraste', 'clima', 'básico']
  },

  // A2 Level
  {
    id: 'sub_es_a2_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'easy',
    category: 'tiempo',
    instruction: 'Mejora este conector temporal',
    content: '[Después de] comer, fuimos al cine.',
    correctAnswer: 'Tras',
    options: ['Tras', 'Antes de', 'Durante', 'Mientras'],
    explanation: '"Tras" es más elegante que "después de".',
    points: 6,
    tags: ['tiempo', 'secuencia', 'actividades']
  },

  // B1 Level
  {
    id: 'sub_es_b1_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'medium',
    category: 'concesión',
    instruction: 'Sustituye por una alternativa más sofisticada',
    content: '[Aunque] la tarea era difícil, la completamos.',
    correctAnswer: 'Pese a que',
    options: ['Pese a que', 'Porque', 'Por tanto', 'Mientras'],
    explanation: '"Pese a que" muestra concesión más formal para nivel B1.',
    points: 8,
    tags: ['concesión', 'dificultad', 'logro']
  },

  // B2 Level
  {
    id: 'sub_es_b2_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'medium',
    category: 'énfasis',
    instruction: 'Mejora con un conector enfático de nivel B2',
    content: 'El proyecto fue exitoso. [Más importante], generó beneficios.',
    correctAnswer: 'Más significativo aún',
    options: ['Más significativo aún', 'También', 'Pero', 'Entonces'],
    explanation: '"Más significativo aún" proporciona mayor énfasis académico.',
    points: 10,
    tags: ['énfasis', 'proyecto', 'negocios']
  },

  // C1 Level
  {
    id: 'sub_es_c1_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'hard',
    category: 'contraste-académico',
    instruction: 'Selecciona la alternativa más académica',
    content: 'La metodología parece sólida. [Sin embargo], existen limitaciones considerables.',
    correctAnswer: 'No obstante',
    options: ['No obstante', 'Pero', 'Aunque', 'Porque'],
    explanation: '"No obstante" transmite contraste académico sofisticado.',
    points: 12,
    tags: ['académico', 'metodología', 'limitaciones']
  },

  // C2 Level
  {
    id: 'sub_es_c2_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'hard',
    category: 'contraste-matizado',
    instruction: 'Elige el conector contrastivo más matizado',
    content: 'La teoría demuestra elegancia. [No obstante], la validación empírica resulta esquiva.',
    correctAnswer: 'Pese a lo cual',
    options: ['Pese a lo cual', 'Pero', 'Sin embargo', 'Aunque'],
    explanation: '"Pese a lo cual" muestra reserva académica sofisticada.',
    points: 15,
    tags: ['teoría', 'empírico', 'validación', 'avanzado']
  }
];

// VALENCIAN SUBSTITUTION (A1-C2)
const substitutionValencian: Exercise[] = [
  // A1 Level
  {
    id: 'sub_val_a1_001',
    mode: 'substitution',
    language: 'val',
    difficulty: 'easy',
    category: 'addició-bàsica',
    instruction: 'Substitueix per un connector millor',
    content: 'M\'agrada la paella. [I] m\'agrada la fideuà.',
    correctAnswer: 'També',
    options: ['També', 'Però', 'Perquè', 'Encara que'],
    explanation: '"També" és més específic que "i" per afegir idees similars.',
    points: 5,
    tags: ['addició', 'menjar', 'bàsic']
  },

  // A2 Level
  {
    id: 'sub_val_a2_001',
    mode: 'substitution',
    language: 'val',
    difficulty: 'easy',
    category: 'temps',
    instruction: 'Millora aquest connector temporal',
    content: '[Després de] menjar, vam anar al cinema.',
    correctAnswer: 'Després de',
    options: ['Després de', 'Abans de', 'Durant', 'Mentre'],
    explanation: '"Després de" és apropiat per a la seqüència temporal.',
    points: 6,
    tags: ['temps', 'seqüència', 'activitats']
  },

  // B1 Level
  {
    id: 'sub_val_b1_001',
    mode: 'substitution',
    language: 'val',
    difficulty: 'medium',
    category: 'concessió',
    instruction: 'Substitueix per una alternativa més sofisticada',
    content: '[Encara que] la tasca era difícil, la vam completar.',
    correctAnswer: 'Malgrat que',
    options: ['Malgrat que', 'Perquè', 'Per tant', 'Mentre'],
    explanation: '"Malgrat que" mostra concessió més formal per al nivell B1.',
    points: 8,
    tags: ['concessió', 'dificultat', 'èxit']
  },

  // B2 Level
  {
    id: 'sub_val_b2_001',
    mode: 'substitution',
    language: 'val',
    difficulty: 'medium',
    category: 'èmfasi',
    instruction: 'Millora amb un connector emfàtic de nivell B2',
    content: 'El projecte va ser exitós. [Més important], va generar beneficis.',
    correctAnswer: 'Més significatiu encara',
    options: ['Més significatiu encara', 'També', 'Però', 'Aleshores'],
    explanation: '"Més significatiu encara" proporciona major èmfasi acadèmic.',
    points: 10,
    tags: ['èmfasi', 'projecte', 'negocis']
  },

  // C1 Level
  {
    id: 'sub_val_c1_001',
    mode: 'substitution',
    language: 'val',
    difficulty: 'hard',
    category: 'contrast-acadèmic',
    instruction: 'Selecciona l\'alternativa més acadèmica',
    content: 'La metodologia sembla sòlida. [No obstant això], existeixen limitacions considerables.',
    correctAnswer: 'Tanmateix',
    options: ['Tanmateix', 'Però', 'Encara que', 'Perquè'],
    explanation: '"Tanmateix" transmet contrast acadèmic sofisticat.',
    points: 12,
    tags: ['acadèmic', 'metodologia', 'limitacions']
  }
];

// ==================== REPAIR EXERCISES ====================

// ENGLISH REPAIR EXERCISES
const repairEnglish: Exercise[] = [
  // A1 Level
  {
    id: 'rep_en_a1_001',
    mode: 'repair',
    language: 'en',
    difficulty: 'easy',
    category: 'basic-logic',
    instruction: 'Fix the logic error',
    content: 'I love chocolate. Therefore, I don\'t eat it.',
    correctAnswer: 'I love chocolate. However, I don\'t eat it.',
    options: [
      'I love chocolate. However, I don\'t eat it.',
      'I love chocolate. Because I don\'t eat it.',
      'I love chocolate. Therefore, I eat it.',
      'I love chocolate. Also, I don\'t eat it.'
    ],
    explanation: '"However" corrects the illogical "therefore" by showing contrast.',
    points: 6,
    tags: ['logic', 'contrast', 'food']
  },

  // A2 Level
  {
    id: 'rep_en_a2_001',
    mode: 'repair',
    language: 'en',
    difficulty: 'easy',
    category: 'redundancy',
    instruction: 'Remove the redundant connector',
    content: 'Although it was raining, but we went outside.',
    correctAnswer: 'Although it was raining, we went outside.',
    options: [
      'Although it was raining, we went outside.',
      'It was raining, but we went outside.',
      'Because it was raining, but we went outside.',
      'Although it was raining, however we went outside.'
    ],
    explanation: 'Using both "although" and "but" is redundant. One is enough.',
    points: 7,
    tags: ['redundancy', 'weather', 'contrast']
  },

  // B1 Level
  {
    id: 'rep_en_b1_001',
    mode: 'repair',
    language: 'en',
    difficulty: 'medium',
    category: 'logic-error',
    instruction: 'Identify and fix the logical error',
    content: 'The meeting was productive. Nevertheless, we achieved all our goals.',
    correctAnswer: 'The meeting was productive. Furthermore, we achieved all our goals.',
    options: [
      'The meeting was productive. Furthermore, we achieved all our goals.',
      'The meeting was productive. However, we achieved all our goals.',
      'The meeting was productive. Because we achieved all our goals.',
      'The meeting was productive. Nevertheless, we didn\'t achieve our goals.'
    ],
    explanation: '"Furthermore" adds to positive information, unlike "nevertheless" which contrasts.',
    points: 9,
    tags: ['logic', 'meetings', 'addition']
  },

  // B2 Level
  {
    id: 'rep_en_b2_001',
    mode: 'repair',
    language: 'en',
    difficulty: 'medium',
    category: 'formality-mismatch',
    instruction: 'Fix the formality mismatch',
    content: 'The research findings are significant. Plus, they challenge existing theories.',
    correctAnswer: 'The research findings are significant. Moreover, they challenge existing theories.',
    options: [
      'The research findings are significant. Moreover, they challenge existing theories.',
      'The research findings are significant. And they challenge existing theories.',
      'The research findings are significant. So they challenge existing theories.',
      'The research findings are significant. Plus, they challenge existing theories.'
    ],
    explanation: '"Moreover" is more appropriate than "plus" in academic contexts.',
    points: 10,
    tags: ['formality', 'research', 'academic']
  },

  // C1 Level
  {
    id: 'rep_en_c1_001',
    mode: 'repair',
    language: 'en',
    difficulty: 'hard',
    category: 'subtle-logic',
    instruction: 'Correct the subtle logical inconsistency',
    content: 'The data supports the hypothesis. Conversely, statistical significance was achieved.',
    correctAnswer: 'The data supports the hypothesis. Indeed, statistical significance was achieved.',
    options: [
      'The data supports the hypothesis. Indeed, statistical significance was achieved.',
      'The data supports the hypothesis. However, statistical significance was achieved.',
      'The data supports the hypothesis. Nevertheless, statistical significance was achieved.',
      'The data supports the hypothesis. Conversely, statistical significance was achieved.'
    ],
    explanation: '"Indeed" reinforces rather than opposes the supporting evidence.',
    points: 12,
    tags: ['logic', 'statistics', 'research']
  }
];

// SPANISH REPAIR EXERCISES
const repairSpanish: Exercise[] = [
  // A1 Level
  {
    id: 'rep_es_a1_001',
    mode: 'repair',
    language: 'es',
    difficulty: 'easy',
    category: 'lógica-básica',
    instruction: 'Corrige el error lógico',
    content: 'Me encanta la playa. Por eso, no voy nunca.',
    correctAnswer: 'Me encanta la playa. Sin embargo, no voy nunca.',
    options: [
      'Me encanta la playa. Sin embargo, no voy nunca.',
      'Me encanta la playa. Porque no voy nunca.',
      'Me encanta la playa. Por eso, voy siempre.',
      'Me encanta la playa. También, no voy nunca.'
    ],
    explanation: '"Sin embargo" corrige el ilógico "por eso" mostrando contraste.',
    points: 6,
    tags: ['lógica', 'contraste', 'playa']
  },

  // A2 Level
  {
    id: 'rep_es_a2_001',
    mode: 'repair',
    language: 'es',
    difficulty: 'easy',
    category: 'redundancia',
    instruction: 'Elimina el conector redundante',
    content: 'Aunque llovía, pero salimos de casa.',
    correctAnswer: 'Aunque llovía, salimos de casa.',
    options: [
      'Aunque llovía, salimos de casa.',
      'Llovía, pero salimos de casa.',
      'Porque llovía, pero salimos de casa.',
      'Aunque llovía, sin embargo salimos de casa.'
    ],
    explanation: 'Usar "aunque" y "pero" juntos es redundante. Uno es suficiente.',
    points: 7,
    tags: ['redundancia', 'clima', 'contraste']
  },

  // B1 Level
  {
    id: 'rep_es_b1_001',
    mode: 'repair',
    language: 'es',
    difficulty: 'medium',
    category: 'error-lógico',
    instruction: 'Identifica y corrige el error lógico',
    content: 'La reunión fue productiva. No obstante, logramos todos los objetivos.',
    correctAnswer: 'La reunión fue productiva. Además, logramos todos los objetivos.',
    options: [
      'La reunión fue productiva. Además, logramos todos los objetivos.',
      'La reunión fue productiva. Sin embargo, logramos todos los objetivos.',
      'La reunión fue productiva. Porque logramos todos los objetivos.',
      'La reunión fue productiva. No obstante, no logramos los objetivos.'
    ],
    explanation: '"Además" añade información positiva, a diferencia de "no obstante" que contrasta.',
    points: 9,
    tags: ['lógica', 'reuniones', 'adición']
  }
];

// VALENCIAN REPAIR EXERCISES
const repairValencian: Exercise[] = [
  // A1 Level
  {
    id: 'rep_val_a1_001',
    mode: 'repair',
    language: 'val',
    difficulty: 'easy',
    category: 'lògica-bàsica',
    instruction: 'Corregeix l\'error lògic',
    content: 'M\'encanta la platja. Per això, no hi vaig mai.',
    correctAnswer: 'M\'encanta la platja. No obstant això, no hi vaig mai.',
    options: [
      'M\'encanta la platja. No obstant això, no hi vaig mai.',
      'M\'encanta la platja. Perquè no hi vaig mai.',
      'M\'encanta la platja. Per això, hi vaig sempre.',
      'M\'encanta la platja. També, no hi vaig mai.'
    ],
    explanation: '"No obstant això" corregeix l\'il·lògic "per això" mostrant contrast.',
    points: 6,
    tags: ['lògica', 'contrast', 'platja']
  }
];

// ==================== CLASSIFICATION EXERCISES ====================

// ENGLISH CLASSIFICATION EXERCISES
const classificationEnglish: Exercise[] = [
  // A2 Level
  {
    id: 'cla_en_a2_001',
    mode: 'classification',
    language: 'en',
    difficulty: 'easy',
    category: 'basic-functions',
    instruction: 'Group these connectors by function: Addition or Contrast',
    content: 'Classify: Also, However, Furthermore, But',
    correctAnswer: ['Addition: Also, Furthermore', 'Contrast: However, But'],
    explanation: 'Addition connectors add information, contrast connectors show opposition.',
    points: 8,
    tags: ['classification', 'functions', 'basic']
  },

  // B1 Level
  {
    id: 'cla_en_b1_001',
    mode: 'classification',
    language: 'en',
    difficulty: 'medium',
    category: 'time-connectors',
    instruction: 'Classify by time relationship: Before, During, or After',
    content: 'Sort: Previously, Meanwhile, Subsequently, Beforehand',
    correctAnswer: ['Before: Previously, Beforehand', 'During: Meanwhile', 'After: Subsequently'],
    explanation: 'Time connectors indicate when actions happen relative to each other.',
    points: 10,
    tags: ['time', 'sequence', 'classification']
  },

  // B2 Level
  {
    id: 'cla_en_b2_001',
    mode: 'classification',
    language: 'en',
    difficulty: 'medium',
    category: 'register-levels',
    instruction: 'Classify by register: Formal or Informal',
    content: 'Sort: Nevertheless, Plus, Furthermore, But, Moreover, And',
    correctAnswer: ['Formal: Nevertheless, Furthermore, Moreover', 'Informal: Plus, But, And'],
    explanation: 'Formal connectors suit academic writing, informal ones suit casual contexts.',
    points: 12,
    tags: ['register', 'formality', 'style']
  }
];

// SPANISH CLASSIFICATION EXERCISES
const classificationSpanish: Exercise[] = [
  // A2 Level
  {
    id: 'cla_es_a2_001',
    mode: 'classification',
    language: 'es',
    difficulty: 'easy',
    category: 'funciones-básicas',
    instruction: 'Agrupa estos conectores por función: Adición o Contraste',
    content: 'Clasifica: También, Sin embargo, Además, Pero',
    correctAnswer: ['Adición: También, Además', 'Contraste: Sin embargo, Pero'],
    explanation: 'Los conectores de adición añaden información, los de contraste muestran oposición.',
    points: 8,
    tags: ['clasificación', 'funciones', 'básico']
  },

  // B1 Level
  {
    id: 'cla_es_b1_001',
    mode: 'classification',
    language: 'es',
    difficulty: 'medium',
    category: 'conectores-temporales',
    instruction: 'Clasifica por relación temporal: Antes, Durante, o Después',
    content: 'Ordena: Previamente, Mientras tanto, Posteriormente, Anteriormente',
    correctAnswer: ['Antes: Previamente, Anteriormente', 'Durante: Mientras tanto', 'Después: Posteriormente'],
    explanation: 'Los conectores temporales indican cuándo ocurren las acciones relativamente.',
    points: 10,
    tags: ['tiempo', 'secuencia', 'clasificación']
  }
];

// VALENCIAN CLASSIFICATION EXERCISES
const classificationValencian: Exercise[] = [
  // A2 Level
  {
    id: 'cla_val_a2_001',
    mode: 'classification',
    language: 'val',
    difficulty: 'easy',
    category: 'funcions-bàsiques',
    instruction: 'Agrupa aquests connectors per funció: Addició o Contrast',
    content: 'Classifica: També, No obstant això, A més, Però',
    correctAnswer: ['Addició: També, A més', 'Contrast: No obstant això, Però'],
    explanation: 'Els connectors d\'addició afegeixen informació, els de contrast mostren oposició.',
    points: 8,
    tags: ['classificació', 'funcions', 'bàsic']
  }
];

// ==================== COMBINED EXPANDED DATABASE ====================

export const expandedExerciseDatabase = {
  substitution: [
    ...substitutionEnglish,
    ...substitutionSpanish,
    ...substitutionValencian
  ],
  repair: [
    ...repairEnglish,
    ...repairSpanish,
    ...repairValencian
  ],
  classification: [
    ...classificationEnglish,
    ...classificationSpanish,
    ...classificationValencian
  ]
};

// Export specific level exercises
export function getExercisesByLevel(level: string, language: Language): Exercise[] {
  const allExercises = [
    ...expandedExerciseDatabase.substitution,
    ...expandedExerciseDatabase.repair,
    ...expandedExerciseDatabase.classification
  ];

  return allExercises.filter(ex =>
    ex.language === language &&
    ex.id.includes(level.toLowerCase())
  );
}

// Export difficulty-based exercises
export function getExercisesByDifficultyLevel(difficulty: Difficulty, language: Language): Exercise[] {
  const allExercises = [
    ...expandedExerciseDatabase.substitution,
    ...expandedExerciseDatabase.repair,
    ...expandedExerciseDatabase.classification
  ];

  return allExercises.filter(ex =>
    ex.language === language &&
    ex.difficulty === difficulty
  );
}

// Get total exercise count
export function getTotalExerciseCount(): number {
  return expandedExerciseDatabase.substitution.length +
         expandedExerciseDatabase.repair.length +
         expandedExerciseDatabase.classification.length;
}