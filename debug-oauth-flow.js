// OAuth Flow Debug Script
// This script helps diagnose PKCE flow issues

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 OAuth Debug Script');
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

async function testOAuthConfig() {
  console.log('\n🧪 Testing OAuth Configuration...');

  try {
    // Test basic Supabase connection
    const { data: { session } } = await supabase.auth.getSession();
    console.log('Current session:', session ? 'exists' : 'null');

    // Test OAuth URL generation (without actual redirect)
    console.log('\n🚀 Testing OAuth URL generation...');

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback',
        skipBrowserRedirect: true, // This prevents actual redirect in Node.js
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'openid email profile'
      }
    });

    if (error) {
      console.error('❌ OAuth URL generation failed:', error);
      return;
    }

    console.log('✅ OAuth URL generated successfully');
    console.log('URL length:', data.url?.length || 0);
    console.log('URL starts with:', data.url?.substring(0, 50) + '...');

    // Parse the URL to check PKCE parameters
    if (data.url) {
      const url = new URL(data.url);
      const state = url.searchParams.get('state');
      const codeChallenge = url.searchParams.get('code_challenge');
      const codeChallengeMethod = url.searchParams.get('code_challenge_method');

      console.log('\n🔐 PKCE Parameters:');
      console.log('State:', state ? 'present' : 'missing');
      console.log('Code Challenge:', codeChallenge ? 'present' : 'missing');
      console.log('Challenge Method:', codeChallengeMethod || 'missing');

      if (!state || !codeChallenge || codeChallengeMethod !== 'S256') {
        console.warn('⚠️ PKCE parameters may be incomplete');
      } else {
        console.log('✅ PKCE parameters look correct');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testOAuthConfig().then(() => {
  console.log('\n🏁 OAuth debug test completed');
}).catch(error => {
  console.error('💥 Debug script error:', error);
});