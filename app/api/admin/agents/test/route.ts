import { createSupabaseClient } from "@/utils/supabase/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextRequest } from "next/server";

interface TestRequest {
  agentId: string;
  testType: string;
  inputText: string;
  expectedOutput?: string;
  streaming?: boolean;
  sessionId?: string;
  tools?: boolean;
  temperature?: number;
  maxTokens?: number;
}

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  language: string;
  level: string;
  model_provider: string;
  model_name: string;
  cultural_context: Record<string, unknown>;
  scoring_criteria: Record<string, unknown>;
  performance_config: Record<string, unknown>;
  tools_config?: Record<string, unknown>;
  system_prompt?: string;
  deployment_status?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseClient();

    // Check authentication and permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const canTest = ['super_admin', 'admin', 'course_manager'].includes(adminUser?.role || '');
    if (!canTest) {
      return new Response("Forbidden: Insufficient permissions", { status: 403 });
    }

    // Parse request
    const body: TestRequest = await request.json();
    const { 
      agentId, 
      testType, 
      inputText, 
      expectedOutput, 
      streaming = true, 
      sessionId,
      tools = false,
      temperature,
      maxTokens 
    } = body;

    if (!agentId || !testType || !inputText?.trim()) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // Get agent configuration
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select(`
        id,
        name,
        type,
        language,
        level,
        model_provider,
        model_name,
        cultural_context,
        scoring_criteria,
        performance_config,
        tools_config,
        system_prompt,
        deployment_status
      `)
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return new Response("Agent not found", { status: 404 });
    }

    // Check if agent is deployed
    if (agent.deployment_status !== 'deployed' && agent.deployment_status !== 'ready') {
      console.warn(`Agent ${agentId} is not deployed. Status: ${agent.deployment_status}`);
    }

    // Create system prompt based on agent configuration
    const systemPrompt = agent.system_prompt || buildSystemPrompt(agent, testType);

    // Prepare the correction request prompt
    const userPrompt = buildUserPrompt(testType, inputText, agent.language, agent.level);

    // Get the appropriate model
    const model = getModel(agent);

    // Prepare messages for the model
    const messages: CoreMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    const startTime = Date.now();

    if (streaming) {
      // Stream the response for real-time feedback
      const streamParams: Record<string, unknown> = {
        model,
        messages,
        temperature: temperature ?? agent.performance_config?.temperature ?? 0.7,
        maxTokens: maxTokens ?? agent.performance_config?.max_tokens ?? 2000,
      };

      // Add tools if configured
      if (tools && agent.tools_config) {
        const agentTools = buildAgentTools(agent.tools_config);
        if (agentTools.length > 0) {
          streamParams.tools = agentTools;
        }
      }

      const result = await streamText(streamParams);

      // Convert to data stream response with SSE format
      const stream = result.toDataStreamResponse();
      
      // Add custom headers for better compatibility
      stream.headers.set('X-Agent-Id', agent.id);
      stream.headers.set('X-Test-Type', testType);
      stream.headers.set('X-Session-Id', sessionId || 'no-session');
      stream.headers.set('X-Model-Provider', agent.model_provider);
      stream.headers.set('X-Model-Name', agent.model_name);
      
      return stream;

    } else {
      // Generate complete response
      const generateParams: Record<string, unknown> = {
        model,
        messages,
        temperature: temperature ?? agent.performance_config?.temperature ?? 0.7,
        maxTokens: maxTokens ?? agent.performance_config?.max_tokens ?? 2000,
      };

      // Add tools if configured
      if (tools && agent.tools_config) {
        const agentTools = buildAgentTools(agent.tools_config);
        if (agentTools.length > 0) {
          generateParams.tools = agentTools;
        }
      }

      const result = await generateText(generateParams);

      const processingTime = Date.now() - startTime;
      const usage = result.usage;

      return Response.json({
        success: true,
        correction: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
        metadata: {
          processingTime,
          tokensUsed: usage?.totalTokens || estimateTokens(result.text),
          promptTokens: usage?.promptTokens,
          completionTokens: usage?.completionTokens,
          confidence: calculateConfidence(result.text, expectedOutput),
          model: agent.model_name,
          provider: agent.model_provider,
          agentId: agent.id,
          testType,
          timestamp: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Agent test error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function buildSystemPrompt(agent: AgentConfig, testType: string): string {
  const basePrompt = `You are an AI language learning assistant specialized in ${agent.language} language correction and feedback at the ${agent.level} level.

Your role is to:
1. Analyze the provided ${testType} sample
2. Identify errors, issues, and areas for improvement
3. Provide constructive feedback with specific corrections
4. Explain the reasoning behind your corrections
5. Suggest improvements to help the learner progress

Language: ${agent.language}
Level: ${agent.level}
Test Type: ${testType}

Guidelines:
- Be encouraging while being thorough in your analysis
- Focus on the most important issues first
- Provide specific examples and explanations
- Consider cultural context when relevant
- Adapt your feedback style to the proficiency level`;

  // Add cultural context if available
  if (agent.cultural_context) {
    const culturalNotes = Array.isArray(agent.cultural_context) 
      ? agent.cultural_context.join(', ')
      : JSON.stringify(agent.cultural_context);
    
    return basePrompt + `\n\nCultural Context: ${culturalNotes}`;
  }

  // Add scoring criteria if available
  if (agent.scoring_criteria && typeof agent.scoring_criteria === 'object') {
    const criteria = Object.entries(agent.scoring_criteria)
      .map(([key, value]: [string, any]) => `${key}: ${value.description || value}`)
      .join('\n');
    
    return basePrompt + `\n\nScoring Criteria:\n${criteria}`;
  }

  return basePrompt;
}

function buildUserPrompt(testType: string, inputText: string, language: string, level: string): string {
  const prompts = {
    writing: `Please analyze and correct the following ${language} writing sample (${level} level):

"${inputText}"

Provide:
1. Corrected version with tracked changes
2. Grammar and vocabulary feedback
3. Style and coherence suggestions
4. Overall assessment and grade
5. Specific recommendations for improvement

Format your response clearly with sections for each type of feedback.`,

    speaking: `Please analyze the following ${language} speaking sample transcription (${level} level):

"${inputText}"

Provide feedback on:
1. Grammar and sentence structure
2. Vocabulary usage and appropriateness
3. Fluency indicators (if transcription shows hesitations)
4. Pronunciation notes (if indicated in transcription)
5. Overall communicative effectiveness
6. Suggestions for improvement

Format your response with clear sections for each area of analysis.`,

    reading: `Please analyze the reading comprehension response in ${language} (${level} level):

${inputText}

Evaluate:
1. Comprehension accuracy
2. Language use in the response
3. Depth of understanding demonstrated
4. Grammar and vocabulary
5. Suggestions for better comprehension strategies

Provide constructive feedback to help improve reading skills.`,

    listening: `Please analyze the following listening comprehension response in ${language} (${level} level):

${inputText}

Assess:
1. Comprehension accuracy
2. Key information identification
3. Detail vs. main idea understanding
4. Language use in response
5. Listening strategy recommendations

Provide feedback to enhance listening skills and comprehension.`
  };

  return prompts[testType as keyof typeof prompts] || prompts.writing;
}

function getModel(agent: AgentConfig): LanguageModel {
  const provider = agent.model_provider?.toLowerCase() || 'openai';
  const modelName = agent.model_name || 'gpt-4';

  switch (provider) {
    case 'openai':
      // Map common model names to actual OpenAI model identifiers
      const openaiModels: Record<string, string> = {
        'gpt-4': 'gpt-4-turbo',
        'gpt-4-turbo': 'gpt-4-turbo',
        'gpt-4o': 'gpt-4o',
        'gpt-4o-mini': 'gpt-4o-mini',
        'gpt-3.5-turbo': 'gpt-3.5-turbo',
        'gpt-3.5': 'gpt-3.5-turbo',
      };
      return openai(openaiModels[modelName] || modelName);

    case 'anthropic':
      const anthropicModels: Record<string, string> = {
        'claude-3-opus': 'claude-3-opus-20240229',
        'claude-3-sonnet': 'claude-3-5-sonnet-20241022',
        'claude-3-haiku': 'claude-3-haiku-20240307',
        'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
      };
      return anthropic(anthropicModels[modelName] || modelName);

    case 'google':
      const googleModels: Record<string, string> = {
        'gemini-pro': 'gemini-1.5-pro',
        'gemini-flash': 'gemini-1.5-flash',
        'gemini-1.5-pro': 'gemini-1.5-pro',
        'gemini-1.5-flash': 'gemini-1.5-flash',
      };
      return google(googleModels[modelName] || modelName);

    default:
      // Default to OpenAI GPT-4 if provider is unknown
      console.warn(`Unknown provider: ${provider}, defaulting to OpenAI GPT-4`);
      return openai('gpt-4-turbo');
  }
}

function buildAgentTools(toolsConfig: Record<string, unknown>) {
  const tools = [];
  
  if (!toolsConfig) return tools;

  // Example tool: Grammar checker
  if (toolsConfig.grammar_check) {
    tools.push({
      type: 'function',
      function: {
        name: 'check_grammar',
        description: 'Check grammar and provide detailed feedback',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to check for grammar issues'
            },
            level: {
              type: 'string',
              enum: ['beginner', 'intermediate', 'advanced'],
              description: 'The proficiency level for grammar checking'
            }
          },
          required: ['text']
        }
      }
    });
  }

  // Example tool: Vocabulary enhancement
  if (toolsConfig.vocabulary_enhance) {
    tools.push({
      type: 'function',
      function: {
        name: 'enhance_vocabulary',
        description: 'Suggest vocabulary improvements',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to enhance'
            },
            targetLevel: {
              type: 'string',
              description: 'Target vocabulary level'
            }
          },
          required: ['text']
        }
      }
    });
  }

  // Example tool: Cultural context analyzer
  if (toolsConfig.cultural_context) {
    tools.push({
      type: 'function',
      function: {
        name: 'analyze_cultural_context',
        description: 'Analyze text for cultural appropriateness',
        parameters: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to analyze'
            },
            targetCulture: {
              type: 'string',
              description: 'The target cultural context'
            }
          },
          required: ['text']
        }
      }
    });
  }

  return tools;
}

function calculateConfidence(actualOutput: string, expectedOutput?: string): number {
  // Simple confidence calculation based on output length and expected match
  if (!actualOutput) return 0;
  
  let confidence = 0.7; // Base confidence
  
  // Increase confidence based on output completeness
  if (actualOutput.length > 100) confidence += 0.1;
  if (actualOutput.length > 500) confidence += 0.1;
  
  // If we have expected output, calculate similarity
  if (expectedOutput) {
    const similarity = calculateSimilarity(actualOutput, expectedOutput);
    confidence = Math.min(0.95, confidence * similarity);
  }
  
  return Math.min(0.95, Math.max(0.1, confidence));
}

function calculateSimilarity(str1: string, str2: string): number {
  // Simple Jaccard similarity for demo purposes
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}

function estimateTokens(text: string): number {
  // More accurate token estimation based on common patterns
  // Average is ~4 characters per token for English
  // Adjust for code, special characters, and other languages
  if (!text) return 0;
  
  // Count words and special characters
  const words = text.split(/\s+/).length;
  const specialChars = (text.match(/[^a-zA-Z0-9\s]/g) || []).length;
  
  // Estimate: 1.3 tokens per word + extra for special characters
  return Math.ceil(words * 1.3 + specialChars * 0.3);
}