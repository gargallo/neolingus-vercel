import { createSupabaseClient } from "@/utils/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RecentActivity() {
  const supabase = await createSupabaseClient();

  // Get recent activity from existing tables
  let auditLogs: any[] = [];
  let recentAgents: any[] = [];
  let recentPayments: any[] = [];

  try {
    // Get recent audit logs (this table exists)
    const { data: logs } = await supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        resource_type,
        resource_id,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(10);
    
    auditLogs = logs || [];

    // Get recent AI agents
    const { data: agents } = await supabase
      .from('ai_agents')
      .select('id, name, type, deployment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    recentAgents = agents || [];

    // Get recent payments
    const { data: payments } = await supabase
      .from('payment_transactions')
      .select('id, amount, currency, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    recentPayments = payments || [];
  } catch (error) {
    console.error('Error fetching recent activity:', error);
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create': return 'bg-green-100 text-green-800';
      case 'update': return 'bg-blue-100 text-blue-800';
      case 'delete': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold text-lg mb-4">Recent Activity</h3>
      
      <div className="space-y-6">
        {/* Admin Actions */}
        {auditLogs && auditLogs.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Admin Actions
            </h4>
            <div className="space-y-2">
              {auditLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Badge className={getActionColor(log.action)}>
                      {log.action}
                    </Badge>
                    <span className="text-sm">
                      {log.resource_type} {log.resource_id && `(${log.resource_id})`}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent AI Agents */}
        {recentAgents && recentAgents.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Recent AI Agents
            </h4>
            <div className="space-y-2">
              {recentAgents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">{agent.name} ({agent.type})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(agent.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Payments */}
        {recentPayments && recentPayments.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-3">
              Recent Payments
            </h4>
            <div className="space-y-2">
              {recentPayments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                    <span className="text-sm">{payment.amount} {payment.currency}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(payment.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!auditLogs?.length && !recentAgents?.length && !recentPayments?.length) && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No recent activity to display</p>
          </div>
        )}
      </div>
    </Card>
  );
}