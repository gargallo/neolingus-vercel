/**
 * Seed script for Swipe de la Norma game
 * Populates the database with sample swipe items for testing
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample swipe items for different languages and levels
const sampleItems = [
  // Español - Formales (exam_safe = true)
  {
    term: 'utilizar',
    example: 'Es necesario utilizar las normas establecidas.',
    lang: 'es',
    level: 'B2',
    exam: 'EOI',
    exam_safe: true,
    difficulty_elo: 1500,
    tags: ['formal', 'verbs', 'academic'],
    content_source: 'norma_culta',
    context: 'academic_writing'
  },
  {
    term: 'establecer',
    example: 'El gobierno decidió establecer nuevas políticas.',
    lang: 'es',
    level: 'B2',
    exam: 'EOI',
    exam_safe: true,
    difficulty_elo: 1520,
    tags: ['formal', 'verbs', 'politics'],
    content_source: 'norma_culta',
    context: 'formal_discourse'
  },
  {
    term: 'a fin de que',
    example: 'Modificó el horario a fin de que pudieran asistir todos.',
    lang: 'es',
    level: 'C1',
    exam: 'EOI',
    exam_safe: true,
    difficulty_elo: 1650,
    tags: ['connectors', 'formal', 'purpose'],
    content_source: 'norma_culta',
    context: 'formal_writing'
  },
  {
    term: 'no obstante',
    example: 'El proyecto presentaba dificultades; no obstante, se completó.',
    lang: 'es',
    level: 'C1',
    exam: 'EOI',
    exam_safe: true,
    difficulty_elo: 1680,
    tags: ['connectors', 'formal', 'contrast'],
    content_source: 'norma_culta',
    context: 'academic_writing'
  },
  {
    term: 'realizar',
    example: 'Los estudiantes deben realizar el examen en silencio.',
    lang: 'es',
    level: 'B1',
    exam: 'EOI',
    exam_safe: true,
    difficulty_elo: 1450,
    tags: ['formal', 'verbs', 'academic'],
    content_source: 'norma_culta',
    context: 'institutional'
  },

  // Español - Informales/Coloquiales (exam_safe = false)
  {
    term: 'currar',
    example: 'Hoy toca currar hasta muy tarde.',
    lang: 'es',
    level: 'B1',
    exam: 'EOI',
    exam_safe: false,
    difficulty_elo: 1400,
    tags: ['colloquial', 'verbs', 'work'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },
  {
    term: 'flipar',
    example: 'Me flipo con lo que has conseguido.',
    lang: 'es',
    level: 'B2',
    exam: 'EOI',
    exam_safe: false,
    difficulty_elo: 1480,
    tags: ['colloquial', 'slang', 'emotions'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },
  {
    term: 'tío/tía',
    example: 'Oye, tío, ¿vienes esta noche?',
    lang: 'es',
    level: 'A2',
    exam: 'EOI',
    exam_safe: false,
    difficulty_elo: 1300,
    tags: ['colloquial', 'address', 'family'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },
  {
    term: 'guay',
    example: 'La película está muy guay.',
    lang: 'es',
    level: 'A2',
    exam: 'EOI',
    exam_safe: false,
    difficulty_elo: 1280,
    tags: ['colloquial', 'adjectives', 'evaluation'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },
  {
    term: 'mogollón',
    example: 'Había un mogollón de gente en la fiesta.',
    lang: 'es',
    level: 'B1',
    exam: 'EOI',
    exam_safe: false,
    difficulty_elo: 1420,
    tags: ['colloquial', 'quantity', 'nouns'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },

  // Valenciano - Formales
  {
    term: 'utilitzar',
    example: 'Cal utilitzar les normes establides per la institució.',
    lang: 'val',
    level: 'B2',
    exam: 'JQCV',
    exam_safe: true,
    difficulty_elo: 1520,
    tags: ['formal', 'verbs', 'academic'],
    content_source: 'norma_culta',
    context: 'academic_writing'
  },
  {
    term: 'establir',
    example: 'El govern va decidir establir noves polítiques.',
    lang: 'val',
    level: 'B2',
    exam: 'JQCV',
    exam_safe: true,
    difficulty_elo: 1540,
    tags: ['formal', 'verbs', 'politics'],
    content_source: 'norma_culta',
    context: 'formal_discourse'
  },
  {
    term: 'amb la finalitat que',
    example: 'Va modificar l\'horari amb la finalitat que pogueren assistir tots.',
    lang: 'val',
    level: 'C1',
    exam: 'JQCV',
    exam_safe: true,
    difficulty_elo: 1660,
    tags: ['connectors', 'formal', 'purpose'],
    content_source: 'norma_culta',
    context: 'formal_writing'
  },

  // Valenciano - Informales/Coloquiales
  {
    term: 'currar',
    example: 'Hui toca currar fins molt tard.',
    lang: 'val',
    level: 'B1',
    exam: 'JQCV',
    exam_safe: false,
    difficulty_elo: 1410,
    tags: ['colloquial', 'verbs', 'work'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },
  {
    term: 'flipar',
    example: 'Flipe amb el que has aconseguit.',
    lang: 'val',
    level: 'B2',
    exam: 'JQCV',
    exam_safe: false,
    difficulty_elo: 1490,
    tags: ['colloquial', 'slang', 'emotions'],
    content_source: 'colloquial',
    context: 'informal_conversation'
  },

  // Inglés - Formales
  {
    term: 'utilize',
    example: 'It is necessary to utilize the established protocols.',
    lang: 'en',
    level: 'B2',
    exam: 'Cambridge',
    exam_safe: true,
    difficulty_elo: 1510,
    tags: ['formal', 'verbs', 'academic'],
    content_source: 'academic_english',
    context: 'formal_writing'
  },
  {
    term: 'establish',
    example: 'The government decided to establish new policies.',
    lang: 'en',
    level: 'B2',
    exam: 'Cambridge',
    exam_safe: true,
    difficulty_elo: 1530,
    tags: ['formal', 'verbs', 'politics'],
    content_source: 'academic_english',
    context: 'formal_discourse'
  },
  {
    term: 'nevertheless',
    example: 'The project had difficulties; nevertheless, it was completed.',
    lang: 'en',
    level: 'C1',
    exam: 'Cambridge',
    exam_safe: true,
    difficulty_elo: 1670,
    tags: ['connectors', 'formal', 'contrast'],
    content_source: 'academic_english',
    context: 'academic_writing'
  },

  // Inglés - Informales/Coloquiales
  {
    term: 'gonna',
    example: 'I\'m gonna check it out later.',
    lang: 'en',
    level: 'A2',
    exam: 'Cambridge',
    exam_safe: false,
    difficulty_elo: 1250,
    tags: ['colloquial', 'contractions', 'future'],
    content_source: 'spoken_english',
    context: 'informal_conversation'
  },
  {
    term: 'wanna',
    example: 'Do you wanna come with us?',
    lang: 'en',
    level: 'A2',
    exam: 'Cambridge',
    exam_safe: false,
    difficulty_elo: 1260,
    tags: ['colloquial', 'contractions', 'desire'],
    content_source: 'spoken_english',
    context: 'informal_conversation'
  },
  {
    term: 'awesome',
    example: 'That concert was totally awesome!',
    lang: 'en',
    level: 'B1',
    exam: 'Cambridge',
    exam_safe: false,
    difficulty_elo: 1380,
    tags: ['colloquial', 'adjectives', 'evaluation'],
    content_source: 'spoken_english',
    context: 'informal_conversation'
  }
];

async function seedSwipeData() {
  console.log('🌱 Starting to seed swipe game data...');

  try {
    // Clear existing data
    console.log('🧹 Clearing existing swipe items...');
    await supabase.from('swipe_items').delete().neq('id', '');

    // Insert sample items
    console.log('📝 Inserting sample swipe items...');
    const { data, error } = await supabase
      .from('swipe_items')
      .insert(sampleItems)
      .select();

    if (error) {
      console.error('❌ Error inserting sample items:', error);
      return;
    }

    console.log(`✅ Successfully inserted ${data.length} swipe items`);

    // Display summary
    const summary = sampleItems.reduce((acc, item) => {
      const key = `${item.lang}_${item.level}`;
      if (!acc[key]) acc[key] = { formal: 0, informal: 0 };
      if (item.exam_safe) acc[key].formal++;
      else acc[key].informal++;
      return acc;
    }, {} as Record<string, { formal: number; informal: number }>);

    console.log('\n📊 Data Summary:');
    Object.entries(summary).forEach(([key, stats]) => {
      console.log(`  ${key}: ${stats.formal} formal, ${stats.informal} informal`);
    });

    console.log('\n🎮 Sample URLs to test:');
    console.log('  - http://localhost:3001/juegos');
    console.log('  - http://localhost:3001/dashboard/espanol/b2/juegos');
    console.log('  - http://localhost:3001/dashboard/espanol/b2/juegos/swipe-de-la-norma');

  } catch (error) {
    console.error('❌ Failed to seed data:', error);
  }
}

// Run if called directly
if (require.main === module) {
  seedSwipeData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seedSwipeData;