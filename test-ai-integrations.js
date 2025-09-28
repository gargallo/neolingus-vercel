#!/usr/bin/env node

const { config } = require('dotenv');
const { resolve } = require('path');

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function testAIIntegrations() {
  console.log('🤖 Testing AI Integrations with Real Data\n');

  // Test 1: OpenAI Integration
  console.log('1️⃣ Testing OpenAI Integration:');
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ OpenAI API connected - Found ${data.data.length} models`);
      // Find GPT models
      const gptModels = data.data.filter(model => model.id.includes('gpt'));
      console.log(`   ✅ Available GPT models: ${gptModels.slice(0, 3).map(m => m.id).join(', ')}`);
    } else {
      console.log(`   ❌ OpenAI API error: ${response.status} ${response.statusText}`);
    }
  } catch (err) {
    console.log(`   ❌ OpenAI integration exception: ${err.message}`);
  }

  // Test 2: Anthropic Integration
  console.log('\n2️⃣ Testing Anthropic Integration:');
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test with a simple message to Claude
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Test connection'
        }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Anthropic API connected successfully');
      console.log(`   ✅ Claude response: "${data.content[0]?.text || 'No response text'}"`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Anthropic API error: ${response.status} ${response.statusText}`);
      console.log(`   ❌ Error details: ${errorText.substring(0, 100)}...`);
    }
  } catch (err) {
    console.log(`   ❌ Anthropic integration exception: ${err.message}`);
  }

  // Test 3: Context7 Integration  
  console.log('\n3️⃣ Testing Context7 Integration:');
  try {
    const fetch = (await import('node-fetch')).default;
    
    const response = await fetch(`${process.env.CONTEXT7_BASE_URL}/health`, {
      headers: {
        'Authorization': `Bearer ${process.env.CONTEXT7_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('   ✅ Context7 API connected successfully');
    } else {
      console.log(`   ⚠️  Context7 API response: ${response.status} ${response.statusText}`);
      // This might be normal if there's no health endpoint
    }
  } catch (err) {
    console.log(`   ⚠️  Context7 integration: ${err.message}`);
  }

  // Test 4: AI Agent Integration
  console.log('\n4️⃣ Testing AI Agent Integration:');
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test AI agents in database
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('id, name, type, language, level, deployment_status')
      .limit(5);

    if (error) {
      console.log(`   ❌ AI agents query error: ${error.message}`);
    } else {
      console.log(`   ✅ Found ${agents.length} AI agents in database`);
      agents.forEach(agent => {
        console.log(`      - ${agent.name} (${agent.type}) - ${agent.language}/${agent.level} - Status: ${agent.deployment_status}`);
      });
    }

    // Test agent performance metrics
    const { data: metrics, error: metricsError } = await supabase
      .from('agent_performance_metrics')
      .select('processing_time_ms, accuracy_score, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (metricsError) {
      console.log(`   ❌ Agent metrics query error: ${metricsError.message}`);
    } else {
      console.log(`   ✅ Found ${metrics.length} recent agent performance metrics`);
      if (metrics.length > 0) {
        const avgProcessingTime = metrics.reduce((sum, m) => sum + m.processing_time_ms, 0) / metrics.length;
        const avgAccuracy = metrics.reduce((sum, m) => sum + (m.accuracy_score || 0), 0) / metrics.length;
        console.log(`      - Average processing time: ${Math.round(avgProcessingTime)}ms`);
        console.log(`      - Average accuracy: ${(avgAccuracy * 100).toFixed(1)}%`);
      }
    }

  } catch (err) {
    console.log(`   ❌ AI agent integration exception: ${err.message}`);
  }

  console.log('\n🎯 AI Integrations Test Complete!');
}

testAIIntegrations().catch(console.error);