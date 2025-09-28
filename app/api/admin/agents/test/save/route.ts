import { createAdminClient } from "@/utils/supabase/admin";
import { createSupabaseClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

// Force this route to be dynamic
export const dynamic = 'force-dynamic';

interface SaveTestRequest {
  agentId: string;
  testType: string;
  inputText: string;
  expectedOutput?: string;
  actualOutput?: string;
  success: boolean;
  errorMessage?: string;
  processingTimeMs: number;
  tokensUsed: number;
  confidenceScore?: number;
  sessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Use both clients: regular for auth, admin for data operations
    const supabase = await createSupabaseClient();
    const adminSupabase = createAdminClient();

    // Check authentication and permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: adminUser } = await adminSupabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    const canTest = ['super_admin', 'admin', 'course_manager'].includes(adminUser?.role || '');
    if (!canTest) {
      return new Response("Forbidden: Insufficient permissions", { status: 403 });
    }

    // Parse request
    const body: SaveTestRequest = await request.json();
    const {
      agentId,
      testType,
      inputText,
      expectedOutput,
      actualOutput,
      success,
      errorMessage,
      processingTimeMs,
      tokensUsed,
      confidenceScore,
      sessionId
    } = body;

    if (!agentId || !testType || !inputText?.trim()) {
      return new Response("Missing required parameters", { status: 400 });
    }

    // Verify agent exists using admin client
    const { data: agent } = await adminSupabase
      .from('ai_agents')
      .select('id, name')
      .eq('id', agentId)
      .single();

    if (!agent) {
      return new Response("Agent not found", { status: 404 });
    }

    // Save test result using admin client
    const { data: testResult, error: insertError } = await adminSupabase
      .from('agent_test_results')
      .insert({
        agent_id: agentId,
        test_type: testType,
        input_text: inputText,
        expected_output: expectedOutput,
        actual_output: actualOutput,
        success,
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
        tokens_used: tokensUsed,
        confidence_score: confidenceScore,
        session_id: sessionId,
        tested_by: user.id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving test result:', insertError);
      return new Response("Failed to save test result", { status: 500 });
    }

    // Update agent's last_tested_at timestamp using admin client
    await adminSupabase
      .from('ai_agents')
      .update({ last_tested_at: new Date().toISOString() })
      .eq('id', agentId);

    // Optionally, update or create performance metrics using admin client
    if (success && actualOutput && confidenceScore) {
      // Calculate cost estimate (rough)
      const costPerToken = 0.002; // Updated cost estimate in cents
      const estimatedCost = tokensUsed * costPerToken;

      await adminSupabase
        .from('agent_performance_metrics')
        .insert({
          agent_id: agentId,
          session_id: sessionId || `manual_test_${Date.now()}`,
          correction_type: testType,
          accuracy_score: Math.round(confidenceScore * 100),
          processing_time_ms: processingTimeMs,
          tokens_used: tokensUsed,
          cost_cents: Math.round(estimatedCost),
          human_review_required: confidenceScore < 0.8,
          confidence_score: Math.round(confidenceScore * 100),
          agent_input: {
            text: inputText,
            test_type: testType,
            expected_output: expectedOutput
          },
          agent_output: {
            text: actualOutput || '',
            success: success,
            confidence: confidenceScore,
            session_id: sessionId
          },
          created_at: new Date().toISOString()
        });
    }

    return Response.json({
      success: true,
      testResultId: testResult.id,
      agentName: agent.name,
      message: "Test result saved successfully"
    });

  } catch (error) {
    console.error('Save test result error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}