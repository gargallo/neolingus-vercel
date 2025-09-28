import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminHeader from "@/components/admin/admin-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createSupabaseClient();
    
    // Check if user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser();
    console.log('=== ADMIN LAYOUT ===');
    console.log('User auth error:', error);
    console.log('User:', user?.id, user?.email);
    
    if (error || !user) {
      console.log('Not authenticated, redirecting to sign-in');
      redirect("/sign-in");
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, role, active')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    console.log('Admin query result:', adminUser);
    console.log('Admin query error:', adminError);

    if (adminError) {
      console.log('Admin query error occurred:', adminError);
      throw new Error(`Error consultando admin_users: ${adminError.message}`);
    }

    if (!adminUser) {
      console.log('No admin user found for user:', user.id, user.email);
      redirect("/dashboard");
    }

    return (
      <div className="min-h-screen admin-panel">
        {/* Admin Header with user menu */}
        <AdminHeader user={user} adminUser={adminUser} />
        
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {/* Main Content */}
          <main className="admin-card p-6">
            {children}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Admin layout error:', error);
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-800">Error en el Panel Admin</h1>
          <p className="text-red-600">Ha ocurrido un error: {String(error)}</p>
        </div>
      </div>
    );
  }
}