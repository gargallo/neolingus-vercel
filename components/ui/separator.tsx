"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export const Separator = React.forwardRef<
  HTMLDivElement,
  SeparatorProps
>(({ orientation = "horizontal", className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
));

Separator.displayName = "Separator";