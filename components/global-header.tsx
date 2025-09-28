import Link from "next/link";
import { Button } from "@/components/ui/button";
import ConstructionThemeToggle from "@/components/theme/construction-theme-toggle";
import { Brain, GraduationCap, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils/theme-utils";
import UserMenu from "@/components/user-menu";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface GlobalHeaderProps {
  user: SupabaseUser | null;
}

export default function GlobalHeader({ user }: GlobalHeaderProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-white/[0.08] shadow-xl shadow-black/20">
      <div className="container mx-auto px-8 flex items-center justify-between h-20">
        {/* Premium Logo */}
        <Link
          href="/"
          className="flex items-center space-x-4 group transition-all duration-500 ease-out hover:scale-[1.02]"
        >
          <div className="relative">
            <div className="w-11 h-11 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl shadow-blue-500/10 transition-all duration-500 group-hover:shadow-blue-400/20 group-hover:border-blue-400/30">
              <Brain className="h-6 w-6 text-blue-300 transition-all duration-300 group-hover:text-blue-200" />
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full opacity-60 animate-pulse" />
          </div>
          <div className="text-2xl font-extralight tracking-wide text-white/95 transition-all duration-300 group-hover:text-white">
            Neo
            <span className="font-medium bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent bg-size-200 bg-pos-0 group-hover:bg-pos-100 transition-all duration-700">
              Lingus
            </span>
          </div>
        </Link>

        {/* Premium Navigation */}
        <div className="flex items-center space-x-12">
          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-10">
            <Link
              href="/dashboard"
              className="relative text-sm font-medium text-gray-300/90 hover:text-white transition-all duration-300 group py-2"
            >
              <span className="relative z-10">Plataforma</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/courses"
              className="relative text-sm font-medium text-gray-300/90 hover:text-white transition-all duration-300 group py-2"
            >
              <span className="relative z-10">Certificaciones</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/juegos"
              className="relative text-sm font-medium text-gray-300/90 hover:text-white transition-all duration-300 group py-2"
            >
              <span className="relative z-10">Juegos</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full" />
            </Link>
            <Link
              href="/about"
              className="relative text-sm font-medium text-gray-300/90 hover:text-white transition-all duration-300 group py-2"
            >
              <span className="relative z-10">Nosotros</span>
              <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-300 transition-all duration-300 group-hover:w-full" />
            </Link>
          </div>

          {/* Premium Action Buttons */}
          <div className="flex items-center gap-5">
            {user ? (
              <UserMenu user={user} userProfile={null} />
            ) : (
              <>
                <Button
                  variant="ghost"
                  asChild
                  className="text-gray-300/90 hover:text-white hover:bg-white/[0.08] px-6 py-2.5 font-medium transition-all duration-300 rounded-xl border border-transparent hover:border-white/10"
                >
                  <Link href="/sign-in">Iniciar sesión</Link>
                </Button>

                <Button
                  asChild
                  className="relative overflow-hidden bg-white text-slate-900 hover:bg-gray-50 font-semibold px-7 py-2.5 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-white/10 group"
                >
                  <Link
                    href="/dashboard"
                    className="relative z-10 flex items-center"
                  >
                    Acceder gratis
                    <div className="ml-2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
