"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface DialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const Dialog = ({ open, onOpenChange, children }: DialogProps) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 animate-fade-in" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative bg-background border rounded-lg shadow-lg max-w-lg w-full mx-4 animate-scale-in">
        {children}
      </div>
    </div>
  );
};

export const DialogTrigger = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const DialogContent = ({ children, className }: DialogContentProps) => {
  return (
    <div className={cn("p-6", className)}>
      {children}
    </div>
  );
};

export const DialogHeader = ({ children, className }: DialogHeaderProps) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
      {children}
    </div>
  );
};

export const DialogTitle = ({ children, className }: DialogTitleProps) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  );
};

export const DialogDescription = ({ children, className }: DialogDescriptionProps) => {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  );
};

export const DialogFooter = ({ children, className }: DialogFooterProps) => {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:justify-end sm:space-x-2 space-y-2 sm:space-y-0 mt-6", className)}>
      {children}
    </div>
  );
};