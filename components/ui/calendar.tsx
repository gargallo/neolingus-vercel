"use client";

import React from "react";

interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date | { from?: Date; to?: Date };
  onSelect?: (date: Date | { from?: Date; to?: Date } | undefined) => void;
  className?: string;
}

// Basic calendar implementation
export const Calendar = ({ mode = "single", selected, onSelect, className }: CalendarProps) => {
  const today = new Date();
  
  const handleDateSelect = (date: Date) => {
    if (mode === "single") {
      onSelect?.(date);
    }
  };

  return (
    <div className={`p-4 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="font-semibold">
          {today.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </h3>
      </div>
      
      {/* Simplified calendar - for a full implementation, consider using react-day-picker */}
      <div className="grid grid-cols-7 gap-1 text-sm">
        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
        
        {/* Simplified day buttons */}
        {Array.from({ length: 30 }, (_, i) => {
          const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
          const isSelected = selected instanceof Date && 
            date.toDateString() === selected.toDateString();
          
          return (
            <button
              key={i}
              onClick={() => handleDateSelect(date)}
              className={`
                p-2 text-center rounded hover:bg-gray-100
                ${isSelected ? 'bg-blue-500 text-white' : ''}
              `}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};