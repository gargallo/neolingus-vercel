#!/usr/bin/env npx tsx

import { createClient } from '@supabase/supabase-js';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

// Configuration
const REAL_EXAMS_PATH = join(process.cwd(), 'real-exams');

// Initialize Supabase client
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

async function importSampleExams() {
  console.log('🚀 Starting simple exam import...');

  const supabase = createSupabaseClient();

  // Sample exam templates based on actual real-exams structure
  const sampleExams = [
    {
      language: 'english',
      level: 'B2',
      provider: 'cambridge',
      skill: 'integrated',
      name: 'Cambridge B2 First Sample',
      description: 'Examen oficial Cambridge B2 First con todas las habilidades integradas',
      difficulty_level: 'intermediate',
      estimated_duration: 180, // 3 hours
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
    },
    {
      language: 'english',
      level: 'C1',
      provider: 'cambridge',
      skill: 'integrated',
      name: 'Cambridge C1 Advanced Sample',
      description: 'Examen oficial Cambridge C1 Advanced para nivel avanzado',
      difficulty_level: 'advanced',
      estimated_duration: 235,
      total_questions: 56,
      max_score: 210,
      official_source_path: 'real-exams/01-INGLES/C1',
      structure: {
        sections: [
          { id: 'reading', name: 'Reading and Use of English', duration: 90, questions: 56 },
          { id: 'writing', name: 'Writing', duration: 90, questions: 2 },
          { id: 'listening', name: 'Listening', duration: 40, questions: 30 },
          { id: 'speaking', name: 'Speaking', duration: 15, questions: 4 }
        ]
      },
      sections: [
        { id: 'reading', name: 'Reading and Use of English', duration: 90 },
        { id: 'writing', name: 'Writing', duration: 90 },
        { id: 'listening', name: 'Listening', duration: 40 },
        { id: 'speaking', name: 'Speaking', duration: 15 }
      ],
      instructions: {
        general: 'Este es un examen oficial Cambridge C1 Advanced para nivel avanzado.',
        reading: 'Complete las 8 partes del Reading and Use of English en 90 minutos.',
        writing: 'Complete las 2 tareas de Writing en 90 minutos.',
        listening: 'Escuche atentamente y complete las 4 partes en 40 minutos.',
        speaking: 'Participate en las 4 partes del Speaking con el examinador.'
      },
      is_published: true,
      is_active: true
    },
    {
      language: 'valenciano',
      level: 'C1',
      provider: 'jqcv',
      skill: 'integrated',
      name: 'JQCV C1 Valenciano',
      description: 'Examen oficial JQCV de Valenciano nivel C1',
      difficulty_level: 'advanced',
      estimated_duration: 240,
      total_questions: 45,
      max_score: 200,
      official_source_path: 'real-exams/02-VALENCIANO',
      structure: {
        sections: [
          { id: 'reading', name: 'Comprensió lectora', duration: 90, questions: 15 },
          { id: 'writing', name: 'Expressió escrita', duration: 90, questions: 2 },
          { id: 'listening', name: 'Comprensió oral', duration: 30, questions: 15 },
          { id: 'speaking', name: 'Expressió oral', duration: 30, questions: 3 }
        ]
      },
      sections: [
        { id: 'reading', name: 'Comprensió lectora', duration: 90 },
        { id: 'writing', name: 'Expressió escrita', duration: 90 },
        { id: 'listening', name: 'Comprensió oral', duration: 30 },
        { id: 'speaking', name: 'Expressió oral', duration: 30 }
      ],
      instructions: {
        general: 'Examen oficial de la Junta Qualificadora de Coneixements de Valencià (JQCV) per al nivell C1.',
        reading: 'Complete les tasques de comprensió lectora en 90 minuts.',
        writing: 'Realitze les 2 tasques d\'expressió escrita en 90 minuts.',
        listening: 'Escolteu atentament i completeu les tasques en 30 minuts.',
        speaking: 'Participeu en les 3 parts de l\'expressió oral.'
      },
      is_published: true,
      is_active: true
    }
  ];

  // Insert exam templates
  console.log('📚 Inserting exam templates...');

  for (const exam of sampleExams) {
    try {
      const { data, error } = await supabase
        .from('exam_templates')
        .insert(exam)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error inserting ${exam.name}:`, error.message);
        continue;
      }

      console.log(`✅ Inserted: ${exam.name} (ID: ${data.id})`);

      // Add some sample questions for each exam
      await addSampleQuestions(supabase, data.id, exam);

    } catch (err: any) {
      console.error(`❌ Failed to insert ${exam.name}:`, err.message);
    }
  }

  console.log('🎉 Import completed!');
}

async function addSampleQuestions(supabase: any, templateId: string, exam: any) {
  // Sample questions based on exam type
  const sampleQuestions = [];

  if (exam.language === 'english') {
    // English exam questions
    sampleQuestions.push(
      {
        template_id: templateId,
        section_id: 'reading',
        part_id: 'part_1',
        question_number: 1,
        question_type: 'multiple_choice',
        question_text: 'Choose the correct word to complete the sentence: The new policy will _____ employees to work more flexibly.',
        question_data: {
          context: 'Reading and Use of English - Part 1: Multiple Choice Cloze'
        },
        answer_options: [
          { id: 'A', text: 'enable', is_correct: true },
          { id: 'B', text: 'capable', is_correct: false },
          { id: 'C', text: 'possible', is_correct: false },
          { id: 'D', text: 'probable', is_correct: false }
        ],
        correct_answer: 'A',
        answer_explanation: '"Enable" means to give someone the authority or means to do something. This is the correct answer.',
        points: 1,
        topic_tags: ['vocabulary', 'business_english'],
        difficulty_tags: ['intermediate']
      },
      {
        template_id: templateId,
        section_id: 'listening',
        part_id: 'part_1',
        question_number: 1,
        question_type: 'multiple_choice',
        question_text: 'You will hear someone talking about their holiday plans. What is the main reason they chose this destination?',
        question_data: {
          context: 'Listening - Part 1: Multiple Choice'
        },
        answer_options: [
          { id: 'A', text: 'The weather is reliable', is_correct: false },
          { id: 'B', text: 'It\'s close to family', is_correct: true },
          { id: 'C', text: 'The cost is reasonable', is_correct: false }
        ],
        correct_answer: 'B',
        media_urls: {
          audio: ['real-exams/01-INGLES/B2/B2_First_Cambridge_2022.mp3']
        },
        points: 1,
        topic_tags: ['travel', 'family'],
        difficulty_tags: ['intermediate']
      }
    );
  } else if (exam.language === 'valenciano') {
    // Valenciano exam questions
    sampleQuestions.push(
      {
        template_id: templateId,
        section_id: 'reading',
        part_id: 'part_1',
        question_number: 1,
        question_type: 'multiple_choice',
        question_text: 'Tria la paraula correcta per completar la frase: El projecte cultural _____ la participació de tota la comunitat.',
        question_data: {
          context: 'Comprensió lectora - Part 1'
        },
        answer_options: [
          { id: 'A', text: 'requereix', is_correct: true },
          { id: 'B', text: 'demana', is_correct: false },
          { id: 'C', text: 'necessita', is_correct: false },
          { id: 'D', text: 'vol', is_correct: false }
        ],
        correct_answer: 'A',
        answer_explanation: '"Requereix" és la forma correcta en aquest context formal.',
        points: 1,
        topic_tags: ['cultura', 'comunitat'],
        difficulty_tags: ['advanced']
      }
    );
  }

  if (sampleQuestions.length > 0) {
    const { error } = await supabase
      .from('exam_content')
      .insert(sampleQuestions);

    if (error) {
      console.error(`❌ Error inserting questions for ${exam.name}:`, error.message);
    } else {
      console.log(`   📝 Added ${sampleQuestions.length} sample questions`);
    }
  }
}

// Run the import
if (require.main === module) {
  importSampleExams().catch(console.error);
}

export { importSampleExams };