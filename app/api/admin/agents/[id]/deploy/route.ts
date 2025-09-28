import { createSupabaseClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface Agent {
  id: string;
  name: string;
  type: string;
  language: string;
  level: string;
  system_prompt: string;
  cultural_context: Record<string, unknown>;
  scoring_criteria: Record<string, unknown>;
  model_name: string;
  version: number;
  deployment_config?: Record<string, unknown>;
}


// POST /api/admin/agents/[id]/deploy - Deploy agent to Vercel
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseClient();
  
  // Check admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id, role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!adminUser || !['super_admin', 'admin', 'course_manager'].includes(adminUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    
    // Get agent details
    const { data: agent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check if agent is in deployable state
    if (agent.deployment_status === 'active') {
      return NextResponse.json({ 
        error: "Agent is already active" 
      }, { status: 400 });
    }

    // Update status to deploying
    await supabase
      .from('ai_agents')
      .update({ 
        deployment_status: 'deploying',
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    try {
      // Generate agent code based on configuration
      const agentCode = generateAgentCode(agent);
      
      // Deploy to Vercel using their API
      const deploymentResult = await deployToVercel(agentCode, agent);
      
      if (deploymentResult.success) {
        // Update agent with deployment info
        const { data: updatedAgent } = await supabase
          .from('ai_agents')
          .update({
            deployment_status: 'active',
            deployment_url: deploymentResult.url,
            deployed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        // Record deployment
        await supabase
          .from('agent_deployments')
          .insert({
            agent_id: id,
            version: agent.version,
            deployment_config: agent.deployment_config,
            deployment_url: deploymentResult.url,
            vercel_deployment_id: deploymentResult.deploymentId,
            status: 'active',
            deployed_by: adminUser.id
          });

        // Log admin action
        await supabase.rpc('log_admin_action', {
          action_type: 'deploy',
          resource_type_param: 'ai_agent',
          resource_id_param: id,
          new_data_param: {
            deployment_url: deploymentResult.url,
            deployment_id: deploymentResult.deploymentId
          }
        });

        return NextResponse.json({ 
          agent: updatedAgent,
          deployment: deploymentResult
        });
      } else {
        throw new Error(deploymentResult.error);
      }

    } catch (deployError) {
      // Update status to error
      await supabase
        .from('ai_agents')
        .update({ 
          deployment_status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      // Record failed deployment
      await supabase
        .from('agent_deployments')
        .insert({
          agent_id: id,
          version: agent.version,
          deployment_config: agent.deployment_config,
          deployment_url: '',
          status: 'failed',
          deployment_logs: deployError.message,
          error_message: deployError.message,
          deployed_by: adminUser.id
        });

      console.error('Deployment error:', deployError);
      return NextResponse.json({ 
        error: "Deployment failed: " + deployError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error deploying agent:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Generate agent code based on configuration
function generateAgentCode(agent: Agent): string {
  return `
import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';

// Agent: ${agent.name}
// Type: ${agent.type}
// Language: ${agent.language}
// Level: ${agent.level}

const correctionSchema = z.object({
  score: z.number().min(0).max(20),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  cultural_notes: z.array(z.string()).optional(),
  detailed_scores: z.object({
    content: z.number().optional(),
    organization: z.number().optional(),
    language: z.number().optional(),
    cultural: z.number().optional(),
    mechanics: z.number().optional()
  }).optional()
});

export async function POST(request: Request) {
  try {
    const { studentAnswer, examQuestion, context } = await request.json();
    
    const systemPrompt = \`${agent.system_prompt}\`;
    
    const { object } = await generateObject({
      model: openai('${agent.model_name}'),
      schema: correctionSchema,
      prompt: \`
        Exam Question: \${examQuestion}
        Student Answer: \${studentAnswer}
        Context: \${JSON.stringify(context)}
        
        Please evaluate this ${agent.type} response for ${agent.language} ${agent.level} level.
        
        Cultural Context: ${JSON.stringify(agent.cultural_context)}
        Scoring Criteria: ${JSON.stringify(agent.scoring_criteria)}
      \`,
      system: systemPrompt,
      temperature: ${agent.model_config?.temperature || 0.3}
    });

    // Track performance metrics
    const performanceMetrics = {
      agent_id: '${agent.id}',
      processing_time_ms: Date.now() - startTime,
      accuracy_score: object.score / 20 * 100,
      confidence_score: calculateConfidence(object),
      cultural_accuracy: calculateCulturalAccuracy(object)
    };

    // In production, this would be sent to your tracking endpoint
    console.log('Performance metrics:', performanceMetrics);

    return Response.json({
      correction: object,
      metadata: {
        agent_id: '${agent.id}',
        agent_name: '${agent.name}',
        model: '${agent.model_name}',
        processing_time: performanceMetrics.processing_time_ms
      }
    });

  } catch (error) {
    console.error('Agent error:', error);
    return Response.json({ error: 'Correction failed' }, { status: 500 });
  }
}

function calculateConfidence(correction: Record<string, unknown>): number {
  // Simple confidence calculation based on feedback length and detail
  const feedbackLength = correction.feedback?.length || 0;
  const hasDetailedScores = correction.detailed_scores && 
    Object.keys(correction.detailed_scores).length > 0;
  
  let confidence = 0.5; // Base confidence
  
  if (feedbackLength > 100) confidence += 0.2;
  if (feedbackLength > 200) confidence += 0.1;
  if (hasDetailedScores) confidence += 0.2;
  if (correction.strengths?.length > 0) confidence += 0.1;
  if (correction.improvements?.length > 0) confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function calculateCulturalAccuracy(correction: Record<string, unknown>): number {
  // Calculate cultural accuracy based on cultural notes presence
  const hasCulturalNotes = correction.cultural_notes && 
    correction.cultural_notes.length > 0;
  
  return hasCulturalNotes ? 0.9 : 0.7;
}
`;
}

// Deploy to Vercel (simplified - would use actual Vercel API)
async function deployToVercel(agentCode: string, agent: Agent): Promise<{
  success: boolean;
  url?: string;
  deploymentId?: string;
  error?: string;
}> {
  try {
    // This is a simplified version
    // In production, you would:
    // 1. Create a temporary project structure
    // 2. Use Vercel's deployment API
    // 3. Handle the actual deployment process
    
    const mockUrl = `https://agent-${agent.id}-${Date.now()}.vercel.app`;
    const mockDeploymentId = `dpl_${Date.now()}`;
    
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      url: mockUrl,
      deploymentId: mockDeploymentId
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };
  }
}