#!/usr/bin/env npx tsx

// Simple script to populate database with sample exams using MCP
console.log('🚀 Starting sample exam population...');

const sampleExams = [
  {
    language: 'english',
    level: 'B2',
    provider: 'cambridge',
    skill: 'integrated',
    name: 'Cambridge B2 First Sample',
    description: 'Examen oficial Cambridge B2 First con todas las habilidades integradas',
    difficulty_level: 'intermediate',
    estimated_duration: 180,
    total_questions: 52,
    max_score: 190,
    official_source_path: 'real-exams/01-INGLES/B2',
    pdf_path: 'real-exams/01-INGLES/B2/B2_First_Cambridge_2022.pdf',
    audio_paths: ['real-exams/01-INGLES/B2/B2_First_Cambridge_2022.mp3'],
    structure: {
      sections: [
        { id: 'reading', name: 'Reading and Use of English', duration: 75, questions: 52 },
        { id: 'writing', name: 'Writing', duration: 80, questions: 2 },
        { id: 'listening', name: 'Listening', duration: 40, questions: 30 },
        { id: 'speaking', name: 'Speaking', duration: 14, questions: 4 }
      ]
    },
    sections: [
      { id: 'reading', name: 'Reading and Use of English', duration: 75 },
      { id: 'writing', name: 'Writing', duration: 80 },
      { id: 'listening', name: 'Listening', duration: 40 },
      { id: 'speaking', name: 'Speaking', duration: 14 }
    ],
    instructions: {
      general: 'Este es un examen oficial Cambridge B2 First. Incluye todas las habilidades: Reading, Writing, Listening y Speaking.',
      reading: 'Complete las 7 partes del Reading and Use of English en 75 minutos.',
      writing: 'Complete las 2 tareas de Writing en 80 minutos.',
      listening: 'Escuche atentamente y complete las 4 partes en 40 minutos.',
      speaking: 'Participate en las 4 partes del Speaking con el examinador.'
    },
    is_published: true,
    is_active: true
  }
];

console.log('📚 Sample exam data prepared');
console.log('Use MCP Supabase tools to insert this data into exam_templates table');
console.log(JSON.stringify(sampleExams[0], null, 2));