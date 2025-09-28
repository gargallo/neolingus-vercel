import { BookOpen, PenTool, Headphones, MessageSquare, Languages, FileText, Users, Building } from 'lucide-react';

export interface SkillDefinition {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  duration: number; // minutes
  description: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  estimatedTime: string;
  topics: string[];
  color: string; // Tailwind gradient classes
}

export interface ProviderSkills {
  [providerId: string]: SkillDefinition[];
}

// Provider-specific skills mapping for realistic exam structure
export const providerSkills: ProviderSkills = {
  cambridge: [
    {
      id: 'reading_use_of_english',
      name: 'Reading & Use of English',
      icon: BookOpen,
      duration: 75,
      description: 'Comprensión lectora y uso del inglés con textos académicos y profesionales',
      difficulty: 'Avanzado',
      estimatedTime: '1h 15min',
      topics: ['Vocabulario avanzado', 'Gramática compleja', 'Comprensión textual', 'Transformaciones'],
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'writing',
      name: 'Writing',
      icon: PenTool,
      duration: 80,
      description: 'Expresión escrita formal e informal con diferentes tipos de texto',
      difficulty: 'Avanzado',
      estimatedTime: '1h 20min',
      topics: ['Essays', 'Emails', 'Reviews', 'Reports', 'Articles'],
      color: 'from-green-500 to-emerald-600'
    },
    {
      id: 'listening',
      name: 'Listening',
      icon: Headphones,
      duration: 40,
      description: 'Comprensión auditiva con acentos británicos y contextos variados',
      difficulty: 'Intermedio',
      estimatedTime: '40min',
      topics: ['Conversaciones', 'Monólogos', 'Entrevistas', 'Conferencias'],
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'speaking',
      name: 'Speaking',
      icon: MessageSquare,
      duration: 14,
      description: 'Expresión oral con entrevistador y otro candidato',
      difficulty: 'Avanzado',
      estimatedTime: '14min',
      topics: ['Entrevista personal', 'Presentación individual', 'Discusión colaborativa'],
      color: 'from-orange-500 to-red-600'
    }
  ],
  eoi: [
    {
      id: 'comprension_lectora',
      name: 'Comprensión Lectora',
      icon: BookOpen,
      duration: 90,
      description: 'Comprensión de textos escritos de diferentes tipologías y registros',
      difficulty: 'Intermedio',
      estimatedTime: '1h 30min',
      topics: ['Textos informativos', 'Textos argumentativos', 'Textos literarios', 'Prensa escrita'],
      color: 'from-blue-500 to-cyan-600'
    },
    {
      id: 'expresion_escrita',
      name: 'Expresión Escrita',
      icon: PenTool,
      duration: 90,
      description: 'Producción de textos escritos de diferentes tipologías',
      difficulty: 'Intermedio',
      estimatedTime: '1h 30min',
      topics: ['Cartas formales', 'Ensayos', 'Informes', 'Textos descriptivos'],
      color: 'from-green-500 to-teal-600'
    },
    {
      id: 'comprension_auditiva',
      name: 'Comprensión Auditiva',
      icon: Headphones,
      duration: 40,
      description: 'Comprensión de mensajes orales de diferentes contextos',
      difficulty: 'Intermedio',
      estimatedTime: '40min',
      topics: ['Conversaciones', 'Noticias', 'Conferencias', 'Debates'],
      color: 'from-purple-500 to-indigo-600'
    },
    {
      id: 'expresion_oral',
      name: 'Expresión Oral',
      icon: MessageSquare,
      duration: 15,
      description: 'Producción oral mediante monólogos y diálogos',
      difficulty: 'Intermedio',
      estimatedTime: '15min',
      topics: ['Monólogo', 'Conversación', 'Presentación', 'Debate'],
      color: 'from-orange-500 to-yellow-600'
    },
    {
      id: 'mediacion',
      name: 'Mediación',
      icon: Users,
      duration: 20,
      description: 'Actividades de mediación lingüística y intercultural',
      difficulty: 'Avanzado',
      estimatedTime: '20min',
      topics: ['Mediación oral', 'Mediación escrita', 'Resolución de conflictos', 'Transmisión de información'],
      color: 'from-pink-500 to-rose-600'
    }
  ],
  cieacova: [
    {
      id: 'comprensio_lectora',
      name: 'Comprensió Lectora',
      icon: BookOpen,
      duration: 90,
      description: 'Comprensió de textos escrits en valencià de diferents tipologies',
      difficulty: 'Intermedio',
      estimatedTime: '1h 30min',
      topics: ['Textos informatius', 'Textos argumentatius', 'Literatura valenciana', 'Premsa local'],
      color: 'from-amber-500 to-orange-600'
    },
    {
      id: 'expressio_escrita',
      name: 'Expressió Escrita',
      icon: PenTool,
      duration: 90,
      description: 'Producció de textos escrits en valencià estàndard',
      difficulty: 'Intermedio',
      estimatedTime: '1h 30min',
      topics: ['Cartes formals', 'Assajos', 'Informes', 'Textos descriptius'],
      color: 'from-yellow-500 to-amber-600'
    },
    {
      id: 'comprensio_oral',
      name: 'Comprensió Oral',
      icon: Headphones,
      duration: 40,
      description: 'Comprensió de missatges orals en valencià',
      difficulty: 'Intermedio',
      estimatedTime: '40min',
      topics: ['Converses', 'Notícies', 'Conferències', 'Debats'],
      color: 'from-emerald-500 to-green-600'
    },
    {
      id: 'expressio_oral',
      name: 'Expressió Oral',
      icon: MessageSquare,
      duration: 15,
      description: 'Producció oral en valencià amb fluïdesa i correcció',
      difficulty: 'Intermedio',
      estimatedTime: '15min',
      topics: ['Monòleg', 'Conversa', 'Presentació', 'Debat'],
      color: 'from-lime-500 to-emerald-600'
    }
  ],
  jqcv: [
    {
      id: 'comprensio_lectora_admin',
      name: 'Comprensió Lectora',
      icon: FileText,
      duration: 120,
      description: 'Comprensió de textos administratius i jurídics en valencià',
      difficulty: 'Avanzado',
      estimatedTime: '2h',
      topics: ['Textos legals', 'Documents administratius', 'Normativa autonòmica', 'Correspondència oficial'],
      color: 'from-slate-500 to-gray-600'
    },
    {
      id: 'expressio_escrita_admin',
      name: 'Expressió Escrita',
      icon: Building,
      duration: 120,
      description: 'Redacció de documents administratius en valencià',
      difficulty: 'Avanzado',
      estimatedTime: '2h',
      topics: ['Informes tècnics', 'Resolucions', 'Circulars', 'Actes'],
      color: 'from-blue-600 to-slate-600'
    },
    {
      id: 'expressio_oral_admin',
      name: 'Expressió Oral',
      icon: Users,
      duration: 20,
      description: 'Comunicació oral en context administratiu',
      difficulty: 'Avanzado',
      estimatedTime: '20min',
      topics: ['Atenció al ciutadà', 'Reunions de treball', 'Presentacions', 'Comunicació institucional'],
      color: 'from-indigo-600 to-blue-600'
    }
  ]
};

export function getSkillById(providerId: string, skillId: string): SkillDefinition | null {
  const skills = providerSkills[providerId];
  if (!skills) return null;
  return skills.find(skill => skill.id === skillId) || null;
}

export function getProviderSkills(providerId: string): SkillDefinition[] {
  return providerSkills[providerId] || [];
}