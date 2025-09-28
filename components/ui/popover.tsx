"use client";

import React from "react";

// Basic popover implementation for compatibility
interface PopoverProps {
  children: React.ReactNode;
}

interface PopoverTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

export const Popover = ({ children }: PopoverProps) => {
  return <div className="relative inline-block">{children}</div>;
};

export const PopoverTrigger = ({ children }: PopoverTriggerProps) => {
  return <>{children}</>;
};

export const PopoverContent = ({ children, className = "" }: PopoverContentProps) => {
  return (
    <div className={`absolute z-50 bg-white border rounded-md shadow-lg p-4 ${className}`}>
      {children}
    </div>
  );
};