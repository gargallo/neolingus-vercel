"use client";

import type { UserStats as UserStatsType } from "@/lib/admin/users/types";

interface UserStatsProps {
  stats: UserStatsType;
  loading?: boolean;
}

export function UserStats({ stats, loading = false }: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">U</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? '...' : stats.total.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Total Usuarios</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? '...' : stats.active.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Usuarios Activos</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? '...' : stats.pending.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-2xl font-semibold text-gray-900">
              {loading ? '...' : stats.admins.toLocaleString()}
            </p>
            <p className="text-sm text-gray-600">Administradores</p>
          </div>
        </div>
      </div>
    </div>
  );
}