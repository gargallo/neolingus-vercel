import { createSupabaseClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/agents/[id] - Get specific agent details
export async function GET(
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
    .select('role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!adminUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const params = await context.params;
    
    // Get agent with detailed performance data
    const { data: agent, error } = await supabase
      .from('ai_agents')
      .select(`
        *,
        agent_performance_metrics(*),
        agent_deployments(*),
        agent_test_results(*),
        admin_users!created_by(
          user_id,
          role
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Agent not found" }, { status: 404 });
      }
      console.error('Error fetching agent:', error);
      return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'view',
      resource_type_param: 'ai_agent',
      resource_id_param: params.id
    });

    return NextResponse.json({ agent });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/admin/agents/[id] - Update agent
export async function PUT(
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
    const params = await context.params;
    const body = await request.json();
    
    // Get current agent to preserve certain fields
    const { data: currentAgent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Prepare update data (exclude certain system fields)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      created_at,
      created_by,
      deployed_at,
      version,
      deployment_url,
      ...updateData
    } = body;

    // Update agent
    const { data: updatedAgent, error } = await supabase
      .from('ai_agents')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'update',
      resource_type_param: 'ai_agent',
      resource_id_param: params.id,
      old_data_param: currentAgent,
      new_data_param: updateData
    });

    return NextResponse.json({ agent: updatedAgent });

  } catch (error) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/agents/[id] - Delete agent
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseClient();
  
  // Check admin authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role (only admin and super_admin can delete)
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, active')
    .eq('user_id', user.id)
    .eq('active', true)
    .single();

  if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const params = await context.params;
    
    // Get agent info before deletion
    const { data: agent, error: fetchError } = await supabase
      .from('ai_agents')
      .select('name, deployment_status, deployment_url')
      .eq('id', params.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    // Check if agent is active (prevent deletion of active agents)
    if (agent.deployment_status === 'active') {
      return NextResponse.json({ 
        error: "Cannot delete active agent. Deactivate first." 
      }, { status: 400 });
    }

    // TODO: If agent has deployment_url, call Vercel API to delete deployment
    if (agent.deployment_url) {
      console.log('TODO: Delete Vercel deployment:', agent.deployment_url);
      // await deleteVercelDeployment(agent.deployment_url);
    }

    // Delete agent (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('ai_agents')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting agent:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'delete',
      resource_type_param: 'ai_agent',
      resource_id_param: params.id,
      old_data_param: agent
    });

    return NextResponse.json({ message: "Agent deleted successfully" });

  } catch (error) {
    console.error('Error deleting agent:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}