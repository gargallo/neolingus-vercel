import { createSupabaseClient } from "@/utils/supabase/server";
import DashboardStats from "@/components/admin/dashboard-stats";
import RecentActivity from "@/components/admin/recent-activity";
import QuickActions from "@/components/admin/quick-actions";

export default async function AdminDashboard() {
  const supabase = await createSupabaseClient();
  
  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .maybeSingle();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, manage your NeoLingus platform
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Role:</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm font-medium">
            {adminUser?.role?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <QuickActions role={adminUser?.role} />
        </div>
        
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}