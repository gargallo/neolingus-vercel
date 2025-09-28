import { createSupabaseClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AgentDetailView from "@/components/admin/agents/agent-detail-view";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; updated?: string }>;
}

function AgentDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Loading */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Stats Cards Loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </Card>
        ))}
      </div>

      {/* Main Content Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
          
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border rounded p-4">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function AgentDetailPage({ params, searchParams }: AgentDetailPageProps) {
  const { id } = await params;
  const { created, updated } = await searchParams;
  const supabase = await createSupabaseClient();

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .maybeSingle();

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
      created_at,
      updated_at,
      deployed_at,
      last_tested_at,
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

  // Get performance metrics for this agent
  const { data: performanceMetrics } = await supabase
    .from('agent_performance_metrics')
    .select(`
      id,
      accuracy_score,
      processing_time_ms,
      tokens_used,
      cost_cents,
      student_satisfaction,
      human_review_required,
      test_case_results,
      created_at
    `)
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get deployment stats
  const { data: deploymentStats } = await supabase
    .from('agent_deployments')
    .select(`
      id,
      status,
      deployment_url,
      total_corrections,
      avg_response_time_ms,
      error_rate,
      deployed_at,
      activated_at,
      last_health_check,
      health_status
    `)
    .eq('agent_id', id)
    .single();

  // Get recent test results
  const { data: testResults } = await supabase
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
      created_at
    `)
    .eq('agent_id', id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Suspense fallback={<AgentDetailLoading />}>
        <AgentDetailView
          agent={agent}
          performanceMetrics={performanceMetrics || []}
          deploymentStats={deploymentStats}
          testResults={testResults || []}
          userRole={adminUser?.role}
          showCreatedAlert={created === 'true'}
          showUpdatedAlert={updated === 'true'}
        />
      </Suspense>
    </div>
  );
}