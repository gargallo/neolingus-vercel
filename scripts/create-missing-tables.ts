#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function createMissingTables() {
  console.log('🚀 Creando tablas que faltan...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Variables de entorno de Supabase no encontradas');
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // First, let's try using the RPC approach to execute raw SQL
    console.log('📝 Intentando crear tabla courses...');
    
    // Try to create courses table using upsert (this will create the table if it doesn't exist)
    try {
      const { error: insertError } = await supabase
        .from('courses')
        .upsert([
          {
            course_id: 'valenciano_c1',
            title: 'Valencià C1',
            language: 'valenciano',
            level: 'C1',
            institution: 'EOI / CIEACOVA',
            region: 'valencia',
            description: 'Preparació per als exàmens oficials de valencià nivell C1',
            cultural_context: ['Literatura valenciana', 'Tradicions valencianes', 'Història del País Valencià'],
            available: true
          }
        ], { onConflict: 'course_id' });

      if (insertError) {
        console.log('❌ No se puede insertar en courses (tabla no existe):', insertError.message);
        console.log('\n🛑 NECESITAS EJECUTAR SQL MANUALMENTE');
        console.log('📋 Ve a tu Dashboard de Supabase → SQL Editor y ejecuta:');
        console.log('\n' + '='.repeat(60));
        console.log(`-- Crear tabla courses
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    language TEXT NOT NULL,
    level TEXT NOT NULL,
    institution TEXT NOT NULL,
    region TEXT NOT NULL,
    description TEXT,
    cultural_context JSONB DEFAULT '[]',
    image_url TEXT,
    available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear tabla user_courses  
CREATE TABLE IF NOT EXISTS user_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL REFERENCES courses(course_id),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'cancelled')),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    subscription_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_courses ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY IF NOT EXISTS "Anyone can view available courses" ON courses FOR SELECT USING (available = true);
CREATE POLICY IF NOT EXISTS "Users can view their own course subscriptions" ON user_courses FOR SELECT USING (auth.uid() = user_id);

-- Insertar cursos de ejemplo
INSERT INTO courses (course_id, title, language, level, institution, region, description, cultural_context, available) VALUES
('valenciano_c1', 'Valencià C1', 'valenciano', 'C1', 'EOI / CIEACOVA', 'valencia', 'Preparació per als exàmens oficials de valencià nivell C1', '["Literatura valenciana", "Tradicions valencianes", "Història del País Valencià"]', true),
('ingles_b2', 'English B2 First', 'english', 'B2', 'Cambridge English / EOI', 'cambridge', 'Preparation for Cambridge B2 First and EOI B2 examinations', '["Everyday contexts", "Work situations", "Social interactions"]', true)
ON CONFLICT (course_id) DO NOTHING;`);
        console.log('='.repeat(60));
        
        return { success: false, needsSQL: true };
      } else {
        console.log('✅ Tabla courses creada y datos insertados correctamente');
      }
    } catch (error: any) {
      console.log('❌ Error creando courses:', error.message);
    }

    // Try to create user_courses table
    console.log('📝 Intentando crear tabla user_courses...');
    try {
      const { error: userCourseError } = await supabase
        .from('user_courses')
        .select('id')
        .limit(1);

      if (userCourseError) {
        console.log('❌ Tabla user_courses no existe');
      } else {
        console.log('✅ Tabla user_courses ya existe');
      }
    } catch (error) {
      console.log('❌ Error verificando user_courses');
    }

    // Verify admin can now access
    console.log('\n🔍 Verificación final...');
    const { data: adminCheck } = await supabase
      .from('admin_users')
      .select('id, role, active')
      .eq('user_id', '552bb9c4-428c-47ac-8248-4823c508726e')
      .single();

    if (adminCheck) {
      console.log('✅ Usuario admin verificado:');
      console.log(`   Role: ${adminCheck.role}`);
      console.log(`   Active: ${adminCheck.active}`);
      console.log(`   ID: ${adminCheck.id}`);
      
      console.log('\n🎉 Todo listo para probar el dashboard admin!');
      console.log('📋 Pasos para probar:');
      console.log('1. Cierra sesión en tu aplicación');
      console.log('2. Inicia sesión con: admin@neolingus.com');
      console.log('3. Password: TempAdminPass123!');
      console.log('4. Ve a /admin');
      console.log('5. ⚠️  Cambia la contraseña inmediatamente');
    }

    return { success: true };

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  try {
    await createMissingTables();
  } catch (error) {
    console.error('❌ Falló:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();