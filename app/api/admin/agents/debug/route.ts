import { createAdminClient } from "@/utils/supabase/admin";
import { NextRequest } from "next/server";

export const runtime = 'nodejs';
export const maxDuration = 10;

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    // Get all agents
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('id, name, deployment_status')
      .limit(5);
    
    return Response.json({
      success: true,
      agents: agents || [],
      error: agentsError ? agentsError.message : null,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}