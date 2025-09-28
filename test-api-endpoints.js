/**
 * Simple API endpoint test script for the fixed academia APIs
 * Run this after starting the development server
 */

const BASE_URL = 'http://localhost:3000';

// Test data
const testRequests = [
  {
    name: 'Get Courses',
    method: 'GET',
    url: `${BASE_URL}/api/academia/courses`,
    expectedStatus: [200, 401] // 401 if not authenticated, 200 if authenticated
  },
  {
    name: 'Get Courses with Filters',
    method: 'GET',
    url: `${BASE_URL}/api/academia/courses?language=english&level=b2`,
    expectedStatus: [200, 401]
  },
  {
    name: 'Get Exam Sessions',
    method: 'GET',
    url: `${BASE_URL}/api/academia/exams/sessions`,
    expectedStatus: [200, 401]
  },
  {
    name: 'Demo Setup (requires auth)',
    method: 'POST',
    url: `${BASE_URL}/api/demo/setup`,
    expectedStatus: [200, 401]
  },
];

async function testEndpoint(test) {
  try {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`   ${test.method} ${test.url}`);
    
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const response = await fetch(test.url, options);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    
    if (test.expectedStatus.includes(response.status)) {
      console.log(`   ✅ Expected status received`);
    } else {
      console.log(`   ❌ Unexpected status (expected: ${test.expectedStatus})`);
    }
    
    // Log response for debugging
    if (response.status === 200) {
      console.log(`   📊 Data keys: ${Object.keys(data).join(', ')}`);
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`   📦 Array length: ${data.data.length}`);
        } else {
          console.log(`   📦 Object keys: ${Object.keys(data.data).join(', ')}`);
        }
      }
    } else if (response.status === 401) {
      console.log(`   🔒 Authentication required (expected for unauthenticated request)`);
    } else {
      console.log(`   ⚠️  Error: ${data.error || 'Unknown error'}`);
    }
    
  } catch (error) {
    console.log(`   💥 Request failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Starting API endpoint tests...\n');
  console.log('Note: These tests expect 401 (Unauthorized) responses since no authentication is provided.');
  console.log('This is normal behavior for protected endpoints.\n');
  
  for (const test of testRequests) {
    await testEndpoint(test);
  }
  
  console.log('\n✨ Test run completed!');
  console.log('\nTo test with authentication:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Log in as daniel@visionari.es in the browser');
  console.log('3. Use the browser network tab to copy authentication headers');
  console.log('4. Test the endpoints with proper authentication headers');
  console.log('\nOr run the demo setup endpoint after authenticating to create test data.');
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests, testEndpoint };