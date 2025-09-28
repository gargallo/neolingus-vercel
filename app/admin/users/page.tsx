import { createSupabaseClient } from "@/utils/supabase/server";
import { AdminUsersClient } from "@/components/admin/users/admin-users-client";
import type { FilterOptions } from "@/lib/admin/users/types";

interface SearchParams {
  page?: string;
  search?: string;
  status?: string;
  role?: string;
  course?: string;
  fromDate?: string;
  toDate?: string;
  sortBy?: string;
  sortOrder?: string;
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await createSupabaseClient();
  
  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('user_id', user?.id)
    .maybeSingle();

  // Parse search params (await them in Next.js 15)
  const params = await searchParams;
  
  // Build filter options from search params
  const filterOptions: FilterOptions = {
    search: params.search || '',
    status: params.status || 'all',
    role: params.role || 'all',
    course: params.course || 'all',
    fromDate: params.fromDate || '',
    toDate: params.toDate || '',
    page: parseInt(params.page || '1'),
    limit: 20,
    sortBy: params.sortBy || 'created_at',
    sortOrder: params.sortOrder as 'asc' | 'desc' || 'desc'
  };

  // Pass initial filter options to the client component
  return (
    <AdminUsersClient 
      initialFilters={filterOptions} 
      adminRole={adminUser?.role || 'viewer'}
    />
  );
}