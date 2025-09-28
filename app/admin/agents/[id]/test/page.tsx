import { createSupabaseClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AgentTestingInterface from "@/components/admin/agents/agent-testing-interface";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TestTube } from "lucide-react";

interface AgentTestPageProps {
  params: Promise<{ id: string }>;
}

function AgentTestLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Loading */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Test Interface Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-24" />
            </div>
          </Card>

          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </Card>

          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function AgentTestPage({ params }: AgentTestPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseClient();

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .maybeSingle();

  // Check permissions
  const canTest = ['super_admin', 'admin', 'course_manager'].includes(adminUser?.role || '');
  
  if (!canTest) {
    notFound();
  }

  // Get agent details
  const { data: agent, error: agentError } = await supabase
    .from('ai_agents')
    .select(`
      id,
      name,
      description,
      type,
      language,
      level,
      model_provider,
      model_name,
      deployment_status,
      version,
      cultural_context,
      scoring_criteria,
      tools_config,
      performance_config
    `)
    .eq('id', id)
    .single();

  if (agentError || !agent) {
    notFound();
  }

  // Get recent test results
  const { data: recentTests } = await supabase
    .from('agent_test_results')
    .select(`
      id,
      test_type,
      input_text,
      expected_output,
      actual_output,
      success,
      error_message,
      processing_time_ms,
      tokens_used,
      confidence_score,
      created_at
    `)
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Get test templates based on agent type and language
  const { data: testTemplates } = await supabase
    .from('agent_test_templates')
    .select(`
      id,
      name,
      description,
      test_type,
      input_template,
      expected_criteria,
      difficulty_level
    `)
    .eq('agent_type', agent.type)
    .eq('language', agent.language)
    .order('difficulty_level', { ascending: true });

  return (
    <div className="max-w-7xl mx-auto admin-spacing-section">
      {/* Header */}
      <div className="admin-card p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-info/10 text-info">
                <TestTube className="h-6 w-6" />
              </div>
              <h1 className="text-display admin-text-primary">Test Agent: {agent.name}</h1>
            </div>
            <p className="admin-text-secondary text-body leading-relaxed">
              Test language correction capabilities with real-time feedback and performance metrics
            </p>
            <div className="flex items-center gap-4 mt-4 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                {agent.language} {agent.level}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground border border-secondary/20">
                {agent.type.replace('_', ' ')}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/10 text-muted-foreground border border-muted/20">
                {agent.model_provider} {agent.model_name}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<AgentTestLoading />}>
        <AgentTestingInterface
          agent={agent}
          recentTests={recentTests || []}
          testTemplates={testTemplates || []}
        />
      </Suspense>
    </div>
  );
}