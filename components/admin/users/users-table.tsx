"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { UserViewModal } from "./user-view-modal";
import { UserEditModal } from "./user-edit-modal";
import { UserDeleteModal } from "./user-delete-modal";
import type { User } from "@/lib/admin/users/types";

interface UsersTableProps {
  users: User[];
  loading?: boolean;
  error?: string | null;
  selectedUsers: string[];
  onSelectedUsersChange: (selectedUsers: string[]) => void;
  onEditUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  adminRole: string;
  pagination: {
    currentPage: number;
    totalUsers: number;
    usersPerPage: number;
    onPageChange: (page: number) => void;
  };
  sorting: {
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  };
}

export function UsersTable({
  users,
  loading = false,
  error,
  selectedUsers,
  onSelectedUsersChange,
  onEditUser,
  onDeleteUser,
  adminRole,
  pagination,
  sorting,
}: UsersTableProps) {
  const canEdit = ['super_admin', 'admin'].includes(adminRole);
  const canDelete = ['super_admin'].includes(adminRole);
  
  // Modal states
  const [viewModal, setViewModal] = useState<{isOpen: boolean, userId: string | null}>({
    isOpen: false,
    userId: null
  });
  const [editModal, setEditModal] = useState<{isOpen: boolean, userId: string | null}>({
    isOpen: false,
    userId: null
  });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean, 
    userId: string | null, 
    userEmail: string | null
  }>({
    isOpen: false,
    userId: null,
    userEmail: null
  });

  const handleSelectUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onSelectedUsersChange(selectedUsers.filter(id => id !== userId));
    } else {
      onSelectedUsersChange([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectedUsersChange(users.map(user => user.id));
    } else {
      onSelectedUsersChange([]);
    }
  };

  // Modal handlers
  const handleViewUser = (userId: string) => {
    setViewModal({ isOpen: true, userId });
  };

  const handleEditUserModal = (userId: string) => {
    setEditModal({ isOpen: true, userId });
  };

  const handleDeleteUserModal = (userId: string, userEmail: string) => {
    setDeleteModal({ isOpen: true, userId, userEmail });
  };

  const handleRefreshAfterAction = () => {
    // This will trigger a refresh in the parent component
    window.location.reload(); // Simple approach for now
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      unconfirmed: 'bg-yellow-100 text-yellow-800',
    };
    return statusStyles[status] || statusStyles.inactive;
  };

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      student: 'bg-blue-100 text-blue-800',
      teacher: 'bg-purple-100 text-purple-800',
      admin: 'bg-red-100 text-red-800',
      super_admin: 'bg-red-200 text-red-900',
    };
    return roleStyles[role] || roleStyles.student;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const totalPages = Math.ceil(pagination.totalUsers / pagination.usersPerPage);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <div className="text-red-600 mb-4">
          <span className="text-lg font-semibold">Error</span>
        </div>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold">Lista de Usuarios</h3>
        <p className="text-sm text-gray-500 mt-1">
          Mostrando {users.length} de {pagination.totalUsers.toLocaleString()} usuarios
        </p>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Última actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => handleSelectUser(user.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.email}</div>
                          <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(user.email_confirmed_at ? 'active' : 'unconfirmed')}`}>
                        {user.email_confirmed_at ? 'Activo' : 'Sin confirmar'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadge('student')}`}>
                        Usuario
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewUser(user.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Ver
                        </button>
                        {canEdit && (
                          <button 
                            onClick={() => handleEditUserModal(user.id)}
                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                          >
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => handleDeleteUserModal(user.id, user.email)}
                            className="text-red-600 hover:text-red-900 font-medium"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Mostrando{' '}
                  <span className="font-medium">
                    {(pagination.currentPage - 1) * pagination.usersPerPage + 1}
                  </span>{' '}
                  a{' '}
                  <span className="font-medium">
                    {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)}
                  </span>{' '}
                  de{' '}
                  <span className="font-medium">{pagination.totalUsers.toLocaleString()}</span>{' '}
                  usuarios
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => pagination.onPageChange(page)}
                      className={`px-3 py-2 text-sm rounded-md ${
                        pagination.currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 text-sm rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && users.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No se encontraron usuarios</h3>
          <p className="text-gray-500">
            Intenta ajustar los filtros de búsqueda para encontrar usuarios.
          </p>
        </div>
      )}

      {/* Modals */}
      <UserViewModal
        userId={viewModal.userId}
        isOpen={viewModal.isOpen}
        onClose={() => setViewModal({ isOpen: false, userId: null })}
      />

      <UserEditModal
        userId={editModal.userId}
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, userId: null })}
        onSave={handleRefreshAfterAction}
      />

      <UserDeleteModal
        userId={deleteModal.userId}
        userEmail={deleteModal.userEmail}
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, userId: null, userEmail: null })}
        onConfirm={handleRefreshAfterAction}
      />
    </div>
  );
}