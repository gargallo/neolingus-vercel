"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FilterOptions, User, UserStats } from "@/lib/admin/users/types";
import { UsersTable } from "./users-table";
import { UsersHeader } from "./users-header";
import { UserFilters } from "./user-filters";
import { UserStats as StatsComponent } from "./user-stats";

interface AdminUsersClientProps {
  initialFilters: FilterOptions;
  adminRole: string;
}

export function AdminUsersClient({ initialFilters, adminRole }: AdminUsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    pending: 0,
    admins: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch users data
  const fetchUsers = async (filterOptions: FilterOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const queryParams = new URLSearchParams();
      if (filterOptions.search) queryParams.set('search', filterOptions.search);
      if (filterOptions.status !== 'all') queryParams.set('status', filterOptions.status);
      if (filterOptions.role !== 'all') queryParams.set('role', filterOptions.role);
      if (filterOptions.course !== 'all') queryParams.set('course', filterOptions.course);
      if (filterOptions.fromDate) queryParams.set('fromDate', filterOptions.fromDate);
      if (filterOptions.toDate) queryParams.set('toDate', filterOptions.toDate);
      queryParams.set('page', filterOptions.page.toString());
      queryParams.set('limit', filterOptions.limit.toString());
      queryParams.set('sortBy', filterOptions.sortBy);
      queryParams.set('sortOrder', filterOptions.sortOrder);

      const response = await fetch(`/api/admin/users?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setStats(data.stats || { total: 0, active: 0, pending: 0, admins: 0 });
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset to page 1
    setFilters(updatedFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.status !== 'all') params.set('status', updatedFilters.status);
    if (updatedFilters.role !== 'all') params.set('role', updatedFilters.role);
    if (updatedFilters.course !== 'all') params.set('course', updatedFilters.course);
    if (updatedFilters.fromDate) params.set('fromDate', updatedFilters.fromDate);
    if (updatedFilters.toDate) params.set('toDate', updatedFilters.toDate);
    if (updatedFilters.page > 1) params.set('page', updatedFilters.page.toString());
    if (updatedFilters.sortBy !== 'created_at') params.set('sortBy', updatedFilters.sortBy);
    if (updatedFilters.sortOrder !== 'desc') params.set('sortOrder', updatedFilters.sortOrder);

    router.push(`/admin/users?${params.toString()}`);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    handleFiltersChange({ page });
  };

  // Handle user operations
  const handleCreateUser = () => {
    // TODO: Open create user dialog/modal
    console.log('Create user clicked');
  };

  const handleEditUser = (userId: string) => {
    // TODO: Open edit user dialog/modal
    console.log('Edit user:', userId);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Refresh users list
      await fetchUsers(filters);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const handleExportUsers = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.status !== 'all') queryParams.set('status', filters.status);
      if (filters.role !== 'all') queryParams.set('role', filters.role);
      queryParams.set('export', 'csv');

      const response = await fetch(`/api/admin/users?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Error al exportar usuarios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchUsers(filters);
  }, [filters]);

  return (
    <div className="space-y-6 p-6">
      <UsersHeader
        onCreateUser={handleCreateUser}
        onExportUsers={handleExportUsers}
        adminRole={adminRole}
      />
      
      <UserFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        loading={loading}
      />

      <StatsComponent stats={stats} loading={loading} />

      <UsersTable
        users={users}
        loading={loading}
        error={error}
        selectedUsers={selectedUsers}
        onSelectedUsersChange={setSelectedUsers}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
        adminRole={adminRole}
        pagination={{
          currentPage: filters.page,
          totalUsers: stats.total,
          usersPerPage: filters.limit,
          onPageChange: handlePageChange
        }}
        sorting={{
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
          onSortChange: (sortBy, sortOrder) => handleFiltersChange({ sortBy, sortOrder })
        }}
      />
    </div>
  );
}