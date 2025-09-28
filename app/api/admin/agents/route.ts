import { createSupabaseClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/agents - List all AI agents
export async function GET(request: NextRequest) {
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

  if (!adminUser || !['super_admin', 'admin', 'course_manager'].includes(adminUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get query parameters
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const language = searchParams.get('language');
  const level = searchParams.get('level');
  const status = searchParams.get('status');

  try {
    // Build query
    let query = supabase
      .from('ai_agents')
      .select(`
        *,
        agent_performance_metrics(
          accuracy_score,
          processing_time_ms,
          student_satisfaction,
          human_review_required,
          created_at
        ),
        agent_deployments(
          status,
          total_corrections,
          avg_response_time_ms,
          deployed_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) query = query.eq('type', type);
    if (language) query = query.eq('language', language);
    if (level) query = query.eq('level', level);
    if (status) query = query.eq('deployment_status', status);

    const { data: agents, error } = await query;

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'view',
      resource_type_param: 'ai_agents',
      resource_id_param: null
    });

    return NextResponse.json({ agents: agents || [] });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/agents - Create new AI agent
export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const {
      name,
      description,
      type,
      language,
      level,
      model_provider = 'openai',
      model_name = 'gpt-4',
      model_config = { temperature: 0.3, max_tokens: 2000 },
      system_prompt,
      cultural_context = [],
      scoring_criteria = {},
      example_corrections = [],
      tools_config = {
        grammar_checker: true,
        cultural_validator: true,
        plagiarism_detector: false,
        rubric_scorer: true,
        feedback_generator: true
      },
      performance_config = {
        timeout: 60000,
        retries: 2,
        cache_results: true,
        human_review_threshold: 0.7
      },
      deployment_config = {
        regions: ['fra1', 'iad1'],
        min_instances: 1,
        max_instances: 5,
        target_utilization: 70
      }
    } = body;

    // Validate required fields
    if (!name || !type || !language || !level || !system_prompt) {
      return NextResponse.json({ 
        error: "Missing required fields: name, type, language, level, system_prompt" 
      }, { status: 400 });
    }

    // Validate enum values
    const validTypes = ['writing', 'speaking', 'reading', 'listening', 'general'];
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const validProviders = ['openai', 'anthropic', 'cohere', 'vercel'];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    if (!validLevels.includes(level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 });
    }
    if (!validProviders.includes(model_provider)) {
      return NextResponse.json({ error: "Invalid model provider" }, { status: 400 });
    }

    // Check if agent name already exists
    const { data: existingAgent } = await supabase
      .from('ai_agents')
      .select('name')
      .eq('name', name)
      .single();

    if (existingAgent) {
      return NextResponse.json({ error: "Agent name already exists" }, { status: 409 });
    }

    // Create agent
    const { data: newAgent, error } = await supabase
      .from('ai_agents')
      .insert({
        name,
        description,
        type,
        language,
        level,
        model_provider,
        model_name,
        model_config,
        system_prompt,
        cultural_context,
        scoring_criteria,
        example_corrections,
        tools_config,
        performance_config,
        deployment_config,
        created_by: adminUser.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log admin action
    await supabase.rpc('log_admin_action', {
      action_type: 'create',
      resource_type_param: 'ai_agent',
      resource_id_param: newAgent.id,
      new_data_param: {
        name,
        type,
        language,
        level,
        model_provider,
        model_name
      }
    });

    return NextResponse.json({ agent: newAgent }, { status: 201 });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}