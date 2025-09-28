"use client";

import { useState } from "react";

interface UserDeleteModalProps {
  userEmail: string | null;
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UserDeleteModal({ userEmail, userId, isOpen, onClose, onConfirm }: UserDeleteModalProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!userId) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      onConfirm(); // Refresh the users list
      onClose(); // Close modal
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Error al eliminar usuario');
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.002 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            Confirmar Eliminación
          </h3>
          
          <p className="text-sm text-gray-600 text-center mb-4">
            ¿Estás seguro de que quieres eliminar permanentemente al usuario?
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-900">
              <strong>Email:</strong> {userEmail}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <strong>ID:</strong> {userId?.slice(0, 8)}...
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-semibold text-red-800">
                  ¡Atención!
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  Esta acción no se puede deshacer. El usuario será eliminado permanentemente del sistema, incluyendo todos sus datos asociados.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="text-red-800 font-semibold">Error</div>
              <div className="text-red-700 text-sm">{error}</div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {deleting && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            )}
            {deleting ? 'Eliminando...' : 'Eliminar Usuario'}
          </button>
        </div>
      </div>
    </div>
  );
}