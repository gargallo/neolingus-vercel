import { createSupabaseClient } from "@/utils/supabase/server";
import { Suspense } from "react";
import AgentsHeader from "@/components/admin/agents/agents-header";
import AgentsDashboard from "@/components/admin/agents/agents-dashboard";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component for suspense
function AgentsLoading() {
  return (
    <div className="space-y-8">
      {/* Header Loading */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats Loading */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </Card>
        ))}
      </div>
      
      {/* Agents List Loading */}
      <Card className="p-6">
        <Skeleton className="h-6 w-32 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default async function AdminAgentsPage() {
  const supabase = await createSupabaseClient();
  
  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .maybeSingle();

  // Get all AI agents with comprehensive data
  const { data: agents, error: agentsError } = await supabase
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
    .order('created_at', { ascending: false });

  // Get performance metrics summary
  const { data: performanceMetrics } = await supabase
    .from('agent_performance_metrics')
    .select(`
      agent_id,
      accuracy_score,
      processing_time_ms,
      tokens_used,
      cost_cents,
      student_satisfaction,
      human_review_required,
      created_at
    `)
    .order('created_at', { ascending: false })
    .limit(1000); // Get more data for better analytics

  // Get deployment stats
  const { data: deploymentStats } = await supabase
    .from('agent_deployments')
    .select(`
      agent_id,
      status,
      deployment_url,
      total_corrections,
      avg_response_time_ms,
      error_rate,
      deployed_at,
      activated_at
    `);

  // Handle errors gracefully
  if (agentsError) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto">
        <AgentsHeader role={adminUser?.role} />
        <Card className="p-8 text-center">
          <div className="text-red-600 mb-2">
            <h3 className="text-lg font-semibold">Error Loading Agents</h3>
          </div>
          <p className="text-gray-600 mb-4">
            There was an error loading the AI agents data. Please try refreshing the page.
          </p>
          <p className="text-xs text-gray-500">
            Error: {agentsError.message}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <AgentsHeader role={adminUser?.role} />
      
      <Suspense fallback={<AgentsLoading />}>
        <AgentsDashboard 
          agents={agents || []}
          performanceMetrics={performanceMetrics || []}
          deploymentStats={deploymentStats || []}
          userRole={adminUser?.role}
        />
      </Suspense>
    </div>
  );
}