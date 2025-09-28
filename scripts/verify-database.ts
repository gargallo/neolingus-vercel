#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function verifyDatabase() {
  console.log('🔍 Verificando configuración de base de datos...');
  
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Variables de entorno de Supabase no encontradas');
  }

  console.log('📋 Configuración del proyecto:');
  console.log(`   URL: ${process.env.SUPABASE_URL}`);
  
  const projectId = process.env.SUPABASE_URL.split('.')[0].split('//')[1];
  console.log(`   Proyecto ID: ${projectId}`);

  // Create Supabase client
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('\n👤 Verificando usuarios en auth.users...');
    
    // List all users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Error listando usuarios: ${authError.message}`);
    }

    console.log(`📊 Total usuarios encontrados: ${authUsers.users.length}`);
    
    if (authUsers.users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      console.log('\n📝 Usuarios existentes:');
      authUsers.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id}) - Creado: ${new Date(user.created_at).toLocaleDateString()}`);
      });
      
      // Check specifically for admin user
      const adminUser = authUsers.users.find(u => u.email === 'admin@neolingus.com');
      if (adminUser) {
        console.log(`\n✅ Usuario admin encontrado: ${adminUser.email}`);
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Email confirmado: ${adminUser.email_confirmed_at ? 'Sí' : 'No'}`);
      } else {
        console.log('\n❌ Usuario admin@neolingus.com NO encontrado');
      }
    }

    // Check if admin_users table exists and has data
    console.log('\n🔐 Verificando tabla admin_users...');
    try {
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('id, role, active, created_at');

      if (adminError) {
        console.log(`❌ Error accediendo a admin_users: ${adminError.message}`);
        if (adminError.message.includes('does not exist') || adminError.message.includes('relation')) {
          console.log('🛑 La tabla admin_users NO EXISTE en esta base de datos');
        }
      } else {
        console.log(`📊 Registros en admin_users: ${adminUsers?.length || 0}`);
        if (adminUsers && adminUsers.length > 0) {
          adminUsers.forEach((admin, index) => {
            console.log(`   ${index + 1}. Rol: ${admin.role}, Activo: ${admin.active}, ID: ${admin.id}`);
          });
        }
      }
    } catch (tableError) {
      console.log('❌ Error verificando tabla admin_users:', tableError);
    }

    // Check other tables
    console.log('\n📚 Verificando tabla courses...');
    try {
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')
        .limit(5);

      if (coursesError) {
        console.log(`❌ Error accediendo a courses: ${coursesError.message}`);
        if (coursesError.message.includes('does not exist') || coursesError.message.includes('relation')) {
          console.log('🛑 La tabla courses NO EXISTE en esta base de datos');
        }
      } else {
        console.log(`📊 Cursos encontrados: ${courses?.length || 0}`);
        if (courses && courses.length > 0) {
          courses.forEach(course => {
            console.log(`   - ${course.title} (${course.id})`);
          });
        }
      }
    } catch (courseError) {
      console.log('❌ Error verificando tabla courses:', courseError);
    }

    console.log('\n🎯 Diagnóstico:');
    if (authUsers.users.length === 1 && !authUsers.users.find(u => u.email === 'admin@neolingus.com')) {
      console.log('❌ Solo hay 1 usuario y NO es admin@neolingus.com');
      console.log('🔄 El script anterior no funcionó correctamente o estamos en bases diferentes');
    } else if (authUsers.users.find(u => u.email === 'admin@neolingus.com')) {
      console.log('✅ Usuario admin@neolingus.com existe');
      console.log('🔄 Verificando si tiene registro en admin_users...');
    }

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
    throw error;
  }
}

async function main() {
  try {
    await verifyDatabase();
  } catch (error) {
    console.error('❌ Verificación falló:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();