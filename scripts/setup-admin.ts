#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

import { setupInitialAdmin } from '../lib/admin/setup-admin';

async function main() {
  console.log('🚀 Setting up initial admin user...');
  
  const result = await setupInitialAdmin();
  
  if (result.success) {
    console.log('✅ Success:', result.message);
    if (result.user) {
      console.log('📧 Email:', result.user.email);
      console.log('🆔 User ID:', result.user.id);
    }
  } else {
    console.error('❌ Error:', result.error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});