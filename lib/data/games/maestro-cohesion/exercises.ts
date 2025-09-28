// Maestro de Cohesión - Exercise Content Database
// Real C1-level discourse connector exercises for all three game modes

export type ExerciseMode = 'substitution' | 'repair' | 'classification';
export type Language = 'en' | 'es' | 'val';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Exercise {
  id: string;
  mode: ExerciseMode;
  language: Language;
  difficulty: Difficulty;
  category: string;
  instruction: string;
  content: string;
  correctAnswer: string | string[];
  options?: string[];
  explanation: string;
  points: number;
  tags: string[];
}

// SUBSTITUTION MODE EXERCISES
const substitutionExercises: Exercise[] = [
  // English C1 Substitution
  {
    id: 'sub_en_001',
    mode: 'substitution',
    language: 'en',
    difficulty: 'medium',
    category: 'contrast',
    instruction: 'Replace the highlighted connector with a more sophisticated alternative',
    content: 'The research methodology was rigorous and comprehensive. [However], the sample size remained relatively small.',
    correctAnswer: 'Nevertheless',
    options: ['Nevertheless', 'Although', 'Furthermore', 'Consequently'],
    explanation: '"Nevertheless" provides a stronger contrast than "however" and is more formal for academic writing.',
    points: 10,
    tags: ['contrast', 'academic', 'formal']
  },
  {
    id: 'sub_en_002',
    mode: 'substitution',
    language: 'en',
    difficulty: 'hard',
    category: 'cause-effect',
    instruction: 'Select the most precise connector for this causal relationship',
    content: 'Climate change has accelerated in recent decades. [Because of this], extreme weather events have become more frequent.',
    correctAnswer: 'As a consequence',
    options: ['As a consequence', 'Due to this', 'Therefore', 'Hence'],
    explanation: '"As a consequence" explicitly shows the causal relationship and is more formal than the original.',
    points: 15,
    tags: ['causality', 'environment', 'formal']
  },
  {
    id: 'sub_en_003',
    mode: 'substitution',
    language: 'en',
    difficulty: 'easy',
    category: 'addition',
    instruction: 'Upgrade this basic connector to a C1-level alternative',
    content: 'The proposal addresses environmental concerns. [Also], it considers economic implications.',
    correctAnswer: 'Moreover',
    options: ['Moreover', 'Additionally', 'Plus', 'And'],
    explanation: '"Moreover" adds emphasis and is more sophisticated than "also" in formal contexts.',
    points: 8,
    tags: ['addition', 'formal', 'emphasis']
  },

  // Spanish C1 Substitution
  {
    id: 'sub_es_001',
    mode: 'substitution',
    language: 'es',
    difficulty: 'medium',
    category: 'contrast',
    instruction: 'Sustituye el conector destacado por una alternativa más sofisticada',
    content: 'La propuesta tiene méritos evidentes. [Pero] presenta algunos inconvenientes significativos.',
    correctAnswer: 'No obstante',
    options: ['No obstante', 'Sin embargo', 'Aunque', 'Por el contrario'],
    explanation: '"No obstante" es más formal y académico que "pero", apropiado para nivel C1.',
    points: 10,
    tags: ['contraste', 'formal', 'académico']
  },
  {
    id: 'sub_es_002',
    mode: 'substitution',
    language: 'es',
    difficulty: 'hard',
    category: 'concession',
    instruction: 'Selecciona el conector concesivo más preciso',
    content: '[Aunque] los resultados son prometedores, se requiere más investigación.',
    correctAnswer: 'Pese a que',
    options: ['Pese a que', 'A pesar de que', 'Si bien', 'Aun cuando'],
    explanation: '"Pese a que" aporta mayor formalidad y precisión en contextos académicos.',
    points: 15,
    tags: ['concesión', 'formal', 'precisión']
  },
  {
    id: 'sub_es_003',
    mode: 'substitution',
    language: 'es',
    difficulty: 'easy',
    category: 'sequence',
    instruction: 'Mejora este conector temporal básico',
    content: '[Después] de analizar los datos, presentaremos las conclusiones.',
    correctAnswer: 'Posteriormente',
    options: ['Posteriormente', 'A continuación', 'Luego', 'Más tarde'],
    explanation: '"Posteriormente" es más formal y preciso para secuencias temporales en textos académicos.',
    points: 8,
    tags: ['secuencia', 'temporal', 'formal']
  },

  // Valencian C1 Substitution
  {
    id: 'sub_val_001',
    mode: 'substitution',
    language: 'val',
    difficulty: 'medium',
    category: 'contrast',
    instruction: 'Substitueix el connector destacat per una alternativa més sofisticada',
    content: 'La investigació és rigorosa i ben documentada. [Però] té limitacions metodològiques.',
    correctAnswer: 'No obstant això',
    options: ['No obstant això', 'Tanmateix', 'Malgrat tot', 'Per contra'],
    explanation: '"No obstant això" és més formal i acadèmic que "però", adequat per al nivell C1.',
    points: 10,
    tags: ['contrast', 'formal', 'acadèmic']
  },
  {
    id: 'sub_val_002',
    mode: 'substitution',
    language: 'val',
    difficulty: 'hard',
    category: 'cause-effect',
    instruction: 'Selecciona el connector causal més precís',
    content: 'Els canvis climàtics s\'han accelerat. [Per això] veiem més fenòmens extrems.',
    correctAnswer: 'En conseqüència',
    options: ['En conseqüència', 'Com a resultat', 'Per tant', 'Així doncs'],
    explanation: '"En conseqüència" estableix una relació causal més formal i precisa.',
    points: 15,
    tags: ['causalitat', 'formal', 'precisió']
  }
];

// REPAIR MODE EXERCISES
const repairExercises: Exercise[] = [
  // English C1 Repair
  {
    id: 'rep_en_001',
    mode: 'repair',
    language: 'en',
    difficulty: 'medium',
    category: 'logic',
    instruction: 'Identify and fix the logical connector error',
    content: 'The study was conducted with rigorous methodology. Furthermore, the results were inconclusive.',
    correctAnswer: 'However, the results were inconclusive.',
    options: [
      'However, the results were inconclusive.',
      'Nevertheless, the results were inconclusive.',
      'Moreover, the results were inconclusive.',
      'Consequently, the results were inconclusive.'
    ],
    explanation: '"Furthermore" suggests addition, but inconclusive results contrast with rigorous methodology. "However" provides the correct logical relationship.',
    points: 12,
    tags: ['logic', 'contrast', 'correction']
  },
  {
    id: 'rep_en_002',
    mode: 'repair',
    language: 'en',
    difficulty: 'hard',
    category: 'redundancy',
    instruction: 'Remove the redundant connector and improve the sentence',
    content: 'Although the experiment failed, however, we learned valuable lessons.',
    correctAnswer: 'Although the experiment failed, we learned valuable lessons.',
    options: [
      'Although the experiment failed, we learned valuable lessons.',
      'The experiment failed, however, we learned valuable lessons.',
      'Despite the experiment failing, however, we learned valuable lessons.',
      'The experiment failed, but we learned valuable lessons.'
    ],
    explanation: 'Using both "although" and "however" creates redundancy. One contrastive connector is sufficient.',
    points: 18,
    tags: ['redundancy', 'contrast', 'concision']
  },

  // Spanish C1 Repair
  {
    id: 'rep_es_001',
    mode: 'repair',
    language: 'es',
    difficulty: 'medium',
    category: 'logic',
    instruction: 'Identifica y corrige el error lógico del conector',
    content: 'El proyecto fue un éxito rotundo. Por tanto, hubo varios problemas durante su ejecución.',
    correctAnswer: 'Sin embargo, hubo varios problemas durante su ejecución.',
    options: [
      'Sin embargo, hubo varios problemas durante su ejecución.',
      'No obstante, hubo varios problemas durante su ejecución.',
      'Además, hubo varios problemas durante su ejecución.',
      'En consecuencia, hubo varios problemas durante su ejecución.'
    ],
    explanation: '"Por tanto" indica consecuencia, pero los problemas contrastan con el éxito. Se necesita un conector de contraste.',
    points: 12,
    tags: ['lógica', 'contraste', 'corrección']
  },
  {
    id: 'rep_es_002',
    mode: 'repair',
    language: 'es',
    difficulty: 'hard',
    category: 'redundancy',
    instruction: 'Elimina la redundancia de conectores',
    content: 'Aunque el presupuesto era limitado, sin embargo, logramos completar el proyecto.',
    correctAnswer: 'Aunque el presupuesto era limitado, logramos completar el proyecto.',
    options: [
      'Aunque el presupuesto era limitado, logramos completar el proyecto.',
      'El presupuesto era limitado, sin embargo, logramos completar el proyecto.',
      'Pese a que el presupuesto era limitado, sin embargo, logramos completar el proyecto.',
      'El presupuesto era limitado, pero logramos completar el proyecto.'
    ],
    explanation: 'Usar "aunque" y "sin embargo" juntos es redundante. Un solo conector de contraste es suficiente.',
    points: 18,
    tags: ['redundancia', 'contraste', 'concisión']
  }
];

// CLASSIFICATION MODE EXERCISES
const classificationExercises: Exercise[] = [
  // English C1 Classification
  {
    id: 'cla_en_001',
    mode: 'classification',
    language: 'en',
    difficulty: 'medium',
    category: 'connector-types',
    instruction: 'Classify these connectors by their logical function',
    content: 'Drag the connectors to their correct categories: Nevertheless, Furthermore, Consequently, In contrast',
    correctAnswer: ['Contrast: Nevertheless, In contrast', 'Addition: Furthermore', 'Cause-Effect: Consequently'],
    explanation: 'Contrast connectors show opposition, addition connectors add information, cause-effect connectors show causal relationships.',
    points: 16,
    tags: ['classification', 'connector-types', 'logic']
  },
  {
    id: 'cla_en_002',
    mode: 'classification',
    language: 'en',
    difficulty: 'hard',
    category: 'formality-levels',
    instruction: 'Classify these connectors by formality level (Formal/Informal)',
    content: 'Sort these connectors: Moreover, Plus, Nevertheless, But, Furthermore, However',
    correctAnswer: ['Formal: Moreover, Nevertheless, Furthermore', 'Informal: Plus, But, However'],
    explanation: 'Formal connectors are preferred in academic writing, while informal ones are used in casual contexts.',
    points: 20,
    tags: ['formality', 'register', 'academic']
  },

  // Spanish C1 Classification
  {
    id: 'cla_es_001',
    mode: 'classification',
    language: 'es',
    difficulty: 'medium',
    category: 'connector-types',
    instruction: 'Clasifica estos conectores según su función lógica',
    content: 'Arrastra los conectores a su categoría: No obstante, Además, Por consiguiente, En cambio',
    correctAnswer: ['Contraste: No obstante, En cambio', 'Adición: Además', 'Causa-Efecto: Por consiguiente'],
    explanation: 'Los conectores de contraste muestran oposición, los de adición suman información, los causales muestran relaciones de causa-efecto.',
    points: 16,
    tags: ['clasificación', 'tipos-conectores', 'lógica']
  },
  {
    id: 'cla_es_002',
    mode: 'classification',
    language: 'es',
    difficulty: 'hard',
    category: 'formality-levels',
    instruction: 'Clasifica por nivel de formalidad (Formal/Informal)',
    content: 'Ordena estos conectores: Asimismo, Y, No obstante, Pero, Por ende, Sin embargo',
    correctAnswer: ['Formal: Asimismo, No obstante, Por ende', 'Informal: Y, Pero, Sin embargo'],
    explanation: 'Los conectores formales se prefieren en textos académicos, los informales en contextos coloquiales.',
    points: 20,
    tags: ['formalidad', 'registro', 'académico']
  }
];

// Import expanded exercises
import {
  expandedExerciseDatabase,
  getExercisesByLevel,
  getExercisesByDifficultyLevel,
  getTotalExerciseCount
} from './exercises-expanded';

// COMBINED EXERCISE DATABASE (Original + Expanded)
export const exerciseDatabase = {
  substitution: [...substitutionExercises, ...expandedExerciseDatabase.substitution],
  repair: [...repairExercises, ...expandedExerciseDatabase.repair],
  classification: [...classificationExercises, ...expandedExerciseDatabase.classification]
};

// Export expanded functions
export { getExercisesByLevel, getExercisesByDifficultyLevel, getTotalExerciseCount };

// UTILITY FUNCTIONS

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Creates a shuffled version of exercise options with correct answer randomized
 */
export function shuffleExerciseOptions(exercise: Exercise): Exercise {
  if (!exercise.options) return exercise;

  const shuffledOptions = shuffleArray(exercise.options);

  return {
    ...exercise,
    options: shuffledOptions
  };
}

export function getExercisesByMode(mode: ExerciseMode): Exercise[] {
  return exerciseDatabase[mode] || [];
}

export function getExercisesByLanguage(language: Language): Exercise[] {
  return [
    ...substitutionExercises.filter(ex => ex.language === language),
    ...repairExercises.filter(ex => ex.language === language),
    ...classificationExercises.filter(ex => ex.language === language)
  ];
}

export function getExercisesByDifficulty(difficulty: Difficulty): Exercise[] {
  return [
    ...substitutionExercises.filter(ex => ex.difficulty === difficulty),
    ...repairExercises.filter(ex => ex.difficulty === difficulty),
    ...classificationExercises.filter(ex => ex.difficulty === difficulty)
  ];
}

/**
 * Gets a random exercise with shuffled options to prevent first answer bias
 */
export function getRandomExercise(
  mode: ExerciseMode,
  language: Language,
  difficulty?: Difficulty
): Exercise | null {
  let exercises = getExercisesByMode(mode).filter(ex => ex.language === language);

  if (difficulty) {
    exercises = exercises.filter(ex => ex.difficulty === difficulty);
  }

  if (exercises.length === 0) return null;

  const randomExercise = exercises[Math.floor(Math.random() * exercises.length)];

  // Return shuffled version to prevent first answer bias
  return shuffleExerciseOptions(randomExercise);
}

export function calculateScore(correctAnswers: number, totalQuestions: number, timeBonus: number = 0): number {
  const baseScore = (correctAnswers / totalQuestions) * 100;
  return Math.round(baseScore + timeBonus);
}