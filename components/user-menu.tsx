"use client";

import Link from "next/link";
import { LogOut, Settings, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils/theme-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserMenuProps {
  user: {
    id: string;
    email?: string;
  };
  userProfile: {
    full_name?: string;
    email: string;
    preferred_language?: string;
  } | null;
}

export default function UserMenu({ user, userProfile }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  const displayName = userProfile?.full_name || userProfile?.email || user.email || "User";
  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  async function signOut() {
    setIsSigningOut(true);
    const client = createSupabaseClient();
    await client.auth.signOut();
    router.push("/");
    router.refresh();
    setIsSigningOut(false);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-10 w-10 rounded-full p-0 academy-hover",
            "hover:bg-construction-primary/10"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className={cn(
              "bg-construction-primary text-white text-sm font-medium",
              "shadow-academy-light"
            )}>
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent
        align="end"
        className={cn(
          "w-56 academy-card-hover shadow-academy-light",
          "border-construction-primary/20"
        )}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-construction-primary">
              {displayName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {userProfile?.email || user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link
            href="/dashboard"
            className={cn(
              "academy-hover cursor-pointer",
              "hover:bg-construction-primary/10 hover:text-construction-primary"
            )}
          >
            <BookOpen className="mr-2 h-4 w-4" />
            <span>My Courses</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link
            href="/progress"
            className={cn(
              "academy-hover cursor-pointer",
              "hover:bg-construction-primary/10 hover:text-construction-primary"
            )}
          >
            <User className="mr-2 h-4 w-4" />
            <span>Progress</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link
            href="/settings"
            className={cn(
              "academy-hover cursor-pointer",
              "hover:bg-construction-primary/10 hover:text-construction-primary"
            )}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem
          onClick={signOut}
          disabled={isSigningOut}
          className={cn(
            "academy-hover cursor-pointer text-destructive focus:text-destructive",
            "hover:bg-destructive/10 focus:bg-destructive/10"
          )}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}