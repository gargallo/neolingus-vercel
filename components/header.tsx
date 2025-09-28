"use client";

import { usePathname } from "next/navigation";
import { AcademiaHeader } from "@/components/academia/dashboard-header";
import GlobalHeader from "@/components/global-header";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "@/utils/supabase/client";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseClient();
    
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Use advanced academia header for all academia routes
  const isAcademiaRoute = pathname.startsWith("/dashboard");

  // No renderizar header en TODAS las rutas de dashboard (/dashboard, /dashboard/*, etc.)
  if (pathname.startsWith('/dashboard')) {
    return null;
  }

  if (loading) {
    // Return a loading skeleton that matches the header height
    return (
      <div className="h-20 bg-slate-900 dark:bg-slate-900 border-b border-slate-800 dark:border-slate-800 animate-pulse">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-slate-700 dark:bg-slate-700 rounded-lg"></div>
            <div className="w-32 h-6 bg-slate-700 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="w-32 h-8 bg-slate-700 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (isAcademiaRoute && user) {
    return <AcademiaHeader user={user} />;
  }

  return <GlobalHeader user={user} />;
}
