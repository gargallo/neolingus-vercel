"use client";

import { useState } from "react";
import type { FilterOptions } from "@/lib/admin/users/types";

interface UserFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  loading?: boolean;
}

export function UserFilters({ filters, onFiltersChange, loading = false }: UserFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (key: keyof FilterOptions, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      status: 'all',
      role: 'all',
      course: 'all',
      fromDate: '',
      toDate: ''
    };
    setLocalFilters(prev => ({ ...prev, ...clearedFilters }));
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Filtros y Búsqueda</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Buscar por email..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localFilters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            disabled={loading}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estado
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localFilters.status}
            onChange={(e) => handleInputChange('status', e.target.value)}
            disabled={loading}
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="unconfirmed">Sin confirmar</option>
          </select>
        </div>

        {/* Role */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rol
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localFilters.role}
            onChange={(e) => handleInputChange('role', e.target.value)}
            disabled={loading}
          >
            <option value="all">Todos los roles</option>
            <option value="student">Estudiante</option>
            <option value="teacher">Profesor</option>
            <option value="admin">Administrador</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>

        {/* Course */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Curso
          </label>
          <select
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localFilters.course}
            onChange={(e) => handleInputChange('course', e.target.value)}
            disabled={loading}
          >
            <option value="all">Todos los cursos</option>
            <option value="beginner">Principiante</option>
            <option value="intermediate">Intermedio</option>
            <option value="advanced">Avanzado</option>
          </select>
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha desde
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localFilters.fromDate}
            onChange={(e) => handleInputChange('fromDate', e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fecha hasta
          </label>
          <input
            type="date"
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localFilters.toDate}
            onChange={(e) => handleInputChange('toDate', e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={handleApplyFilters}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Aplicando...' : 'Aplicar Filtros'}
        </button>
        <button 
          onClick={handleClearFilters}
          disabled={loading}
          className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Limpiar Filtros
        </button>
      </div>
    </div>
  );
}