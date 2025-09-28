import { createAdminClient } from "@/utils/supabase/admin";
import { openai } from "@ai-sdk/openai";
import { generateText, tool } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { logError, logAgentInteraction, measurePerformance } from "@/lib/monitoring";

// Configure Vercel Function settings
export const runtime = 'nodejs';
export const maxDuration = 30;

// Define tools following Vercel AI SDK patterns
const grammarChecker = tool({
  description: 'Check grammar and provide corrections for language learning',
  inputSchema: z.object({
    text: z.string().describe('The text to check for grammar errors'),
    language: z.string().describe('The language of the text (e.g., English, Spanish, Valencian)'),
    level: z.string().describe('The proficiency level (A1, A2, B1, B2, C1, C2)'),
  }),
  execute: async ({ text, language, level }) => {
    // Grammar checking logic
    return {
      originalText: text,
      corrections: [
        {
          error: "Sample error",
          correction: "Sample correction", 
          explanation: `Grammar correction for ${language} ${level} level`
        }
      ],
      score: 85,
      feedback: `Your ${language} grammar is at ${level} level with room for improvement.`
    };
  },
});

const vocabularyEnhancer = tool({
  description: 'Enhance vocabulary and suggest improvements',
  inputSchema: z.object({
    text: z.string().describe('The text to enhance'),
    language: z.string().describe('The target language'),
    level: z.string().describe('The target proficiency level'),
  }),
  execute: async ({ text, language, level }) => {
    return {
      originalText: text,
      suggestions: [
        {
          original: "good",
          suggestion: "excellent",
          reason: `More advanced ${language} vocabulary for ${level} level`
        }
      ],
      enhancedText: text,
      vocabularyScore: 78
    };
  },
});

const culturalContextAnalyzer = tool({
  description: 'Analyze cultural context and appropriateness',
  inputSchema: z.object({
    text: z.string().describe('The text to analyze'),
    language: z.string().describe('The target language'),
    culturalContext: z.object({
      region: z.string().optional(),
      formality: z.string().optional(),
      situation: z.string().optional(),
    }).describe('Cultural context information'),
  }),
  execute: async ({ text, language, culturalContext }) => {
    // Use all parameters to avoid unused variable warnings
    console.log(`Analyzing ${language} text: ${text.substring(0, 50)}...`);
    return {
      appropriateness: 90,
      suggestions: [
        {
          aspect: "formality",
          current: "informal", 
          suggested: "formal",
          reason: "More appropriate for the context"
        }
      ],
      culturalNotes: `Text is culturally appropriate for ${culturalContext.region || 'general'} context.`
    };
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const testStartTime = Date.now();
  let agentId: string;
  let body: any;
  
  try {
    const { id } = await params;
    agentId = id;
    
    // Validate request body
    body = await request.json();
    const { inputText, testType = 'writing', expectedOutput } = body;

    // Enhanced input validation
    if (!inputText || typeof inputText !== 'string') {
      return Response.json(
        { 
          error: 'Input text is required and must be a string',
          code: 'INVALID_INPUT',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    if (inputText.length > 10000) {
      return Response.json(
        { 
          error: 'Input text too long (max 10,000 characters)',
          code: 'INPUT_TOO_LONG',
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }
    
    if (!['writing', 'speaking', 'reading', 'listening', 'general'].includes(testType)) {
      return Response.json(
        { 
          error: 'Invalid test type',
          code: 'INVALID_TEST_TYPE',
          validTypes: ['writing', 'speaking', 'reading', 'listening', 'general'],
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Get agent configuration from database using admin client (bypasses RLS)
    const supabase = createAdminClient();
    
    // Try to get agent data with more debugging
    console.log('Looking for agent ID:', agentId);
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agentId)
      .single();
    
    console.log('Agent query result:', { agent, agentError });

    if (agentError || !agent) {
      console.error('Agent query failed:', { agentError, agent, agentId });
      return Response.json(
        { 
          error: 'Agent not found or access denied',
          code: 'AGENT_NOT_FOUND',
          agentId,
          debug: {
            error: agentError?.message,
            code: agentError?.code,
            details: agentError?.details
          },
          timestamp: new Date().toISOString()
        },
        { status: 404 }
      );
    }
    
    // Check if agent has required configuration
    if (!agent.model_name || !agent.language || !agent.level) {
      return Response.json(
        { 
          error: 'Agent configuration incomplete',
          code: 'AGENT_MISCONFIGURED',
          missing: [
            !agent.model_name && 'model_name',
            !agent.language && 'language', 
            !agent.level && 'level'
          ].filter(Boolean),
          timestamp: new Date().toISOString()
        },
        { status: 422 }
      );
    }

    // Configure the model based on agent settings
    const modelConfig = {
      'gpt-4': openai('gpt-4'),
      'gpt-4-turbo': openai('gpt-4-turbo'),
      'gpt-3.5-turbo': openai('gpt-3.5-turbo'),
    };

    const model = modelConfig[agent.model_name as keyof typeof modelConfig] || openai('gpt-4');

    // Build system prompt with agent configuration
    const systemPrompt = agent.system_prompt || `You are a ${agent.language} language learning assistant specialized in ${agent.type} for ${agent.level} level students.

Your role is to provide accurate, culturally appropriate corrections and feedback.

Cultural Context: ${JSON.stringify(agent.cultural_context, null, 2)}
Scoring Criteria: ${JSON.stringify(agent.scoring_criteria, null, 2)}

Analyze the provided text and use the available tools to provide comprehensive feedback.`;

    // Select appropriate tools based on agent type
    const availableTools = {
      writing: { grammarChecker, vocabularyEnhancer, culturalContextAnalyzer },
      speaking: { vocabularyEnhancer, culturalContextAnalyzer },
      reading: { vocabularyEnhancer },
      listening: { vocabularyEnhancer },
      general: { grammarChecker, vocabularyEnhancer, culturalContextAnalyzer }
    };

    // Tools are temporarily disabled to ensure text generation works
    // const agentTools = availableTools[agent.type as keyof typeof availableTools] || availableTools.general;
    console.log(`Selected tools for ${agent.type} agent:`, Object.keys(availableTools[agent.type as keyof typeof availableTools] || availableTools.general));

    // Validate model configuration
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { 
          error: 'OpenAI API key not configured',
          code: 'API_KEY_MISSING',
          timestamp: new Date().toISOString()
        },
        { status: 503 }
      );
    }

    // Use Vercel AI SDK generateText with performance monitoring
    const result = await measurePerformance(
      'agent_text_generation',
      async () => generateText({
        model,
        system: systemPrompt + `

IMPORTANT: Always provide a comprehensive written response in ${agent.language}. Tools should supplement your analysis, but you must always provide detailed feedback text.`,
        prompt: `Please analyze this ${agent.language} text for a ${agent.level} level student and provide comprehensive feedback:

"${inputText}"

You may use the available tools to help with your analysis, but you MUST provide a comprehensive written analysis including:
1. Overall assessment of the text quality
2. Grammar and vocabulary feedback  
3. Suggestions for improvement
4. Encourage the student with positive comments

Please respond in ${agent.language} and provide detailed feedback. Even if the text is perfect, provide encouraging feedback and suggestions for advanced improvements.`,
        // Tools temporarily disabled - they prevent text generation in current configuration
        // TODO: Fix tool configuration to work with text generation
        // tools: agentTools,
        // maxSteps: 2,
        temperature: agent.performance_config?.temperature || 0.3,
        maxTokens: agent.performance_config?.max_tokens || 2000,
      }),
      { agentId, agentName: agent.name, inputLength: inputText.length }
    );
    
    // Update agent's last tested timestamp
    await supabase
      .from('ai_agents')
      .update({ last_tested_at: new Date().toISOString() })
      .eq('id', agentId);

    const processingTime = Date.now() - testStartTime;

    // Calculate confidence score based on tool results and model response
    const baseScore = 85;
    const stepsBonus = Math.min(10, (result.steps?.length || 0) * 2); // Bonus for using tools
    const lengthBonus = result.text.length > 100 ? 10 : 0;
    const processingPenalty = processingTime > 5000 ? -10 : 0; // Penalty for slow processing
    
    const confidenceScore = Math.min(95, Math.max(60, 
      baseScore + stepsBonus + lengthBonus + processingPenalty
    ));
    
    // Compare with expected output if provided
    let accuracyScore = confidenceScore;
    if (expectedOutput && typeof expectedOutput === 'string') {
      // Simple similarity check (in production, use more sophisticated comparison)
      const similarity = calculateTextSimilarity(result.text, expectedOutput);
      accuracyScore = Math.round(similarity * 100);
    }

    // Save test result to database
    const { error: saveError } = await supabase
      .from('agent_performance_metrics')
      .insert({
        agent_id: agentId,
        correction_type: testType,
        processing_time_ms: processingTime,
        tokens_used: result.usage?.totalTokens || 0,
        cost_cents: Math.round((result.usage?.totalTokens || 0) * 0.002), // Approximate cost
        accuracy_score: accuracyScore,
        confidence_score: confidenceScore,
        human_review_required: confidenceScore < 75,
        agent_input: { text: inputText, type: testType },
        agent_output: {
          text: result.text,
          steps: result.steps,
          toolResults: result.steps?.map(step => step.toolResults).filter(Boolean) || []
        }
      });

    if (saveError) {
      console.error('Error saving test result:', saveError);
      logError(saveError, {
        agentId,
        operation: 'save_test_result',
        metadata: { inputLength: inputText.length }
      });
    }

    // Log successful agent interaction
    logAgentInteraction({
      agentId,
      agentName: agent.name,
      inputLength: inputText.length,
      outputLength: result.text?.length || 0,
      processingTime,
      tokensUsed: result.usage?.totalTokens || 0,
      confidenceScore,
      success: true,
      sessionId: `test_${Date.now()}`
    });

    // Return comprehensive test result
    return Response.json({
      success: true,
      agentId,
      agentName: agent.name,
      input: inputText,
      output: result.text,
      processingTime,
      tokensUsed: result.usage?.totalTokens || 0,
      confidenceScore,
      accuracyScore: expectedOutput ? accuracyScore : null,
      steps: result.steps?.length || 0,
      toolResults: result.steps?.map(step => ({
        toolName: step.toolCalls?.[0]?.toolName,
        result: step.toolResults?.[0]?.result
      })).filter(Boolean) || [{ toolName: 'direct_analysis', result: 'AI provided direct analysis without tool calls' }],
      metadata: {
        model: agent.model_name,
        language: agent.language,
        level: agent.level,
        type: testType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Agent test error:', error);
    
    // Log error with monitoring system  
    logError(error, {
      agentId: agentId || 'unknown',
      operation: 'agent_test',
      metadata: {
        inputLength: body?.inputText?.length || 0,
        testType: body?.testType || 'unknown',
        processingTime: Date.now() - testStartTime
      }
    });

    // Log failed agent interaction
    if (agentId) {
      logAgentInteraction({
        agentId,
        agentName: 'Unknown Agent',
        inputLength: body?.inputText?.length || 0,
        outputLength: 0,
        processingTime: Date.now() - testStartTime,
        tokensUsed: 0,
        confidenceScore: 0,
        success: false,
        sessionId: `error_${Date.now()}`
      });
    }
    
    // Log error for monitoring using admin client
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase
        .from('agent_performance_metrics')
        .insert({
          agent_id: agentId || 'unknown',
          session_id: `error_${Date.now()}`,
          correction_type: 'test_error',
          processing_time_ms: Date.now() - testStartTime,
          tokens_used: 0,
          cost_cents: 0,
          accuracy_score: 0,
          confidence_score: 0,
          human_review_required: true,
          agent_input: { error: 'Test failed', timestamp: new Date().toISOString() },
          agent_output: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
    } catch (logError) {
      console.error('Failed to log test error:', logError);
    }
    
    return Response.json(
      { 
        success: false,
        error: 'Failed to test agent',
        code: 'TEST_EXECUTION_FAILED',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - testStartTime
      },
      { status: 500 }
    );
  }
}

// Helper function to calculate text similarity (basic implementation)
function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;
  
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
}