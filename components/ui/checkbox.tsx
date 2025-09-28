"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  id?: string;
}

export const Checkbox = React.forwardRef<
  HTMLInputElement,
  CheckboxProps
>(({ checked, onCheckedChange, className, id, ...props }, ref) => {
  return (
    <input
      ref={ref}
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={cn(
        "h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500",
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = "Checkbox";