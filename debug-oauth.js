// Debug script para OAuth
require('dotenv').config({ path: '.env.local' });
console.log('🔍 Verificando configuración OAuth de Supabase...');

// Verificar variables de entorno
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

console.log('\n📋 Variables de entorno:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NO DEFINIDA`);
  }
});

// Intentar crear cliente de Supabase
try {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  console.log('\n✅ Cliente de Supabase creado exitosamente');
  
  // Verificar configuración OAuth
  console.log('\n🔗 Probando configuración OAuth...');
  
  const redirectUrl = 'http://localhost:3000/auth/callback';
  console.log(`📍 URL de callback: ${redirectUrl}`);
  
} catch (error) {
  console.error('\n❌ Error creando cliente de Supabase:', error.message);
}

console.log('\n🎯 Pasos para solucionar problemas de OAuth:');
console.log('1. Verificar que las variables de entorno estén definidas');
console.log('2. Verificar configuración OAuth en Supabase Dashboard');
console.log('3. Agregar URL autorizada: http://localhost:3000/auth/callback');
console.log('4. Verificar que el proveedor Google esté habilitado');
