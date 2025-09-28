"use client";

interface UsersHeaderProps {
  onCreateUser: () => void;
  onExportUsers: () => void;
  adminRole: string;
}

export function UsersHeader({ onCreateUser, onExportUsers, adminRole }: UsersHeaderProps) {
  const canCreateUsers = ['super_admin', 'admin'].includes(adminRole);
  const canExport = ['super_admin', 'admin', 'moderator'].includes(adminRole);

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold mb-2">Gestión de Usuarios</h1>
          <p className="text-gray-600">
            Sistema completo de administración de usuarios del sistema
          </p>
        </div>
        <div className="flex gap-2">
          {canCreateUsers && (
            <button 
              onClick={onCreateUser} 
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Crear Usuario
            </button>
          )}
          {canExport && (
            <button 
              onClick={onExportUsers} 
              className="border border-green-600 text-green-600 px-4 py-2 rounded-md hover:bg-green-50 transition-colors"
            >
              Exportar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}