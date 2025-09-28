"use client";

import { useState, useEffect } from "react";
import type { User } from "@/lib/admin/users/types";

interface UserViewModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserViewModal({ userId, isOpen, onClose }: UserViewModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser();
    }
  }, [isOpen, userId]);

  const fetchUser = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Detalles del Usuario</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Cargando datos del usuario...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-800 font-semibold">Error</div>
              <div className="text-red-700">{error}</div>
            </div>
          )}

          {user && !loading && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">ID de Usuario</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{user.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre Completo</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.user_metadata?.full_name || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Estado</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.email_confirmed_at 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.email_confirmed_at ? 'Email Confirmado' : 'Email Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Info */}
              {user.admin_info && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Información de Administrador</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rol de Admin</label>
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {user.admin_info.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estado Admin</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.admin_info.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.admin_info.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Fechas Importantes</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Fecha de Registro</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(user.created_at)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Confirmado</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.email_confirmed_at ? formatDate(user.email_confirmed_at) : 'No confirmado'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Último Inicio de Sesión</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {user.last_sign_in_at ? formatDate(user.last_sign_in_at) : 'Nunca'}
                    </p>
                  </div>
                </div>
              </div>

              {/* User Metadata */}
              {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadatos del Usuario</h3>
                  <pre className="text-sm text-gray-700 bg-white p-3 rounded border overflow-x-auto">
                    {JSON.stringify(user.user_metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}