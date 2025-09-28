import { createSupabaseClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import AgentEditForm from "@/components/admin/agents/agent-edit-form";

interface EditAgentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
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
  if (!adminUser || !['super_admin', 'admin'].includes(adminUser.role)) {
    redirect('/admin');
  }

  // Get agent details
  const { data: agent, error } = await supabase
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

  if (error || !agent) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <AgentEditForm agent={agent} />
    </div>
  );
}