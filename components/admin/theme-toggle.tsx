"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="admin-button-secondary w-10 h-10 p-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="admin-card border">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`admin-hover cursor-pointer ${
            theme === "light" ? "bg-primary/10 text-primary" : "admin-text-primary"
          }`}
        >
          <Sun className="mr-2 h-4 w-4" />
          <span className="text-body">Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`admin-hover cursor-pointer ${
            theme === "dark" ? "bg-primary/10 text-primary" : "admin-text-primary"
          }`}
        >
          <Moon className="mr-2 h-4 w-4" />
          <span className="text-body">Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`admin-hover cursor-pointer ${
            theme === "system" ? "bg-primary/10 text-primary" : "admin-text-primary"
          }`}
        >
          <Monitor className="mr-2 h-4 w-4" />
          <span className="text-body">System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}