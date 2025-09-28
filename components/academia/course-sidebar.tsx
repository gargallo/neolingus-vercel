"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useExamState } from "@/components/providers/exam-state-provider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  Home,
  GraduationCap,
  FileText,
  Target,
  BarChart3,
  Bell,
  Brain,
  ChevronLeft,
  Gamepad2,
} from "lucide-react";

interface CourseSidebarProps {
  user: any;
  language: string;
  level: string;
}

export function CourseSidebar({ user, language, level }: CourseSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useEnhancedTheme();
  const { isExamActive } = useExamState();
  const [mounted, setMounted] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Colapsar sidebar automáticamente cuando se inicia un examen
  useEffect(() => {
    if (isExamActive) {
      setIsSidebarCollapsed(true);
    }
  }, [isExamActive]);

  // Theme helper to avoid hydration mismatches
  const isDark = mounted ? resolvedTheme === "dark" : false;

  // Helper function to check if a route is active
  const isActiveRoute = (route: string) => {
    const basePath = `/dashboard/${language}/${level}`;
    if (route === basePath) {
      // Dashboard is active only on exact match
      return pathname === basePath;
    }
    // Other routes are active if pathname starts with the route
    return pathname.startsWith(route);
  };

  // Elegant tooltip component
  const TooltipWrapper = ({
    children,
    tooltip,
  }: {
    children: React.ReactNode;
    tooltip: string;
  }) => (
    <div className="relative group">
      {children}
      <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
        <div className="relative">
          <div
            className={`px-3 py-2 text-sm font-medium rounded-lg shadow-lg whitespace-nowrap ${
              isDark
                ? "bg-slate-700 text-white border border-slate-600"
                : "bg-white text-slate-900 border border-slate-200 shadow-xl"
            }`}
          >
            {tooltip}
          </div>
          <div
            className={`absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-y-4 border-y-transparent ${
              isDark ? "border-r-slate-700" : "border-r-white"
            }`}
          ></div>
        </div>
      </div>
    </div>
  );

  const handleMouseEnter = () => {
    setIsSidebarCollapsed(false);
  };

  const handleMouseLeave = () => {
    setIsSidebarCollapsed(true);
  };

  return (
    <aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`${
        isSidebarCollapsed ? "w-16" : "w-64"
      } fixed top-0 left-0 bottom-0 z-40 flex flex-col overflow-y-auto ${
        isSidebarCollapsed ? "px-3 py-6" : "p-6"
      } transition-[width,padding] duration-300 ease-in-out ${
        isDark
          ? "bg-slate-800 border-r border-slate-700"
          : "bg-white border-r border-slate-200"
      }`}
    >
      {/* Logo */}
      <div className="mb-8">
        {isSidebarCollapsed ? (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span
              className={`text-xl font-bold transition-opacity duration-300 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              NeoLingus
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={`space-y-${isSidebarCollapsed ? "3" : "2"}`}>
        {/* Dashboard */}
        {isSidebarCollapsed ? (
          <TooltipWrapper tooltip="Dashboard">
            <Link
              href={`/dashboard/${language}/${level}`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                isActiveRoute(`/dashboard/${language}/${level}`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300 hover:scale-105`}
            >
              <Home className="w-5 h-5" />
            </Link>
          </TooltipWrapper>
        ) : (
          <Link
            href={`/dashboard/${language}/${level}`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActiveRoute(`/dashboard/${language}/${level}`)
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                : isDark
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } transition-all duration-300`}
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
            {isActiveRoute(`/dashboard/${language}/${level}`) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            )}
          </Link>
        )}

        {/* Exámenes */}
        {isSidebarCollapsed ? (
          <TooltipWrapper tooltip="Exámenes">
            <Link
              href={`/dashboard/${language}/${level}/examens`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                isActiveRoute(`/dashboard/${language}/${level}/examens`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300 hover:scale-105`}
            >
              <GraduationCap className="w-5 h-5" />
            </Link>
          </TooltipWrapper>
        ) : (
          <Link
            href={`/dashboard/${language}/${level}/examens`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActiveRoute(`/dashboard/${language}/${level}/examens`)
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                : isDark
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } transition-all duration-300`}
          >
            <GraduationCap className="w-5 h-5" />
            <span className="font-medium">Exámenes</span>
            {isActiveRoute(`/dashboard/${language}/${level}/examens`) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            )}
          </Link>
        )}

        {/* Tareas */}
        {isSidebarCollapsed ? (
          <TooltipWrapper tooltip="Tareas">
            <Link
              href={`/dashboard/${language}/${level}/tareas`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                isActiveRoute(`/dashboard/${language}/${level}/tareas`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300 hover:scale-105`}
            >
              <FileText className="w-5 h-5" />
            </Link>
          </TooltipWrapper>
        ) : (
          <Link
            href={`/dashboard/${language}/${level}/tareas`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActiveRoute(`/dashboard/${language}/${level}/tareas`)
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                : isDark
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } transition-all duration-300`}
          >
            <FileText className="w-5 h-5" />
            <span className="font-medium">Tareas</span>
            {isActiveRoute(`/dashboard/${language}/${level}/tareas`) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            )}
          </Link>
        )}

        {/* Práctica */}
        {isSidebarCollapsed ? (
          <TooltipWrapper tooltip="Práctica">
            <Link
              href={`/dashboard/${language}/${level}/practica`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                isActiveRoute(`/dashboard/${language}/${level}/practica`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300 hover:scale-105`}
            >
              <Target className="w-5 h-5" />
            </Link>
          </TooltipWrapper>
        ) : (
          <Link
            href={`/dashboard/${language}/${level}/practica`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActiveRoute(`/dashboard/${language}/${level}/practica`)
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                : isDark
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } transition-all duration-300`}
          >
            <Target className="w-5 h-5" />
            <span className="font-medium">Práctica</span>
            {isActiveRoute(`/dashboard/${language}/${level}/practica`) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            )}
          </Link>
        )}

        {/* Juegos */}
        {isSidebarCollapsed ? (
          <TooltipWrapper tooltip="Juegos">
            <Link
              href={`/dashboard/${language}/${level}/juegos`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                isActiveRoute(`/dashboard/${language}/${level}/juegos`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300 hover:scale-105`}
            >
              <Gamepad2 className="w-5 h-5" />
            </Link>
          </TooltipWrapper>
        ) : (
          <Link
            href={`/dashboard/${language}/${level}/juegos`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActiveRoute(`/dashboard/${language}/${level}/juegos`)
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                : isDark
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } transition-all duration-300`}
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="font-medium">Juegos</span>
            {isActiveRoute(`/dashboard/${language}/${level}/juegos`) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            )}
          </Link>
        )}

        {/* Estadísticas */}
        {isSidebarCollapsed ? (
          <TooltipWrapper tooltip="Estadísticas">
            <Link
              href={`/dashboard/${language}/${level}/estadisticas`}
              className={`flex items-center justify-center w-10 h-10 rounded-xl mx-auto ${
                isActiveRoute(`/dashboard/${language}/${level}/estadisticas`)
                  ? isDark
                    ? "bg-blue-600 text-white"
                    : "bg-blue-50 text-blue-600"
                  : isDark
                  ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } transition-all duration-300 hover:scale-105`}
            >
              <BarChart3 className="w-5 h-5" />
            </Link>
          </TooltipWrapper>
        ) : (
          <Link
            href={`/dashboard/${language}/${level}/estadisticas`}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
              isActiveRoute(`/dashboard/${language}/${level}/estadisticas`)
                ? isDark
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-600"
                : isDark
                ? "text-slate-300 hover:bg-slate-700 hover:text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } transition-all duration-300`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Estadísticas</span>
            {isActiveRoute(`/dashboard/${language}/${level}/estadisticas`) && (
              <div className="w-2 h-2 bg-blue-400 rounded-full ml-auto"></div>
            )}
          </Link>
        )}
      </nav>

      {/* User Profile and Exit Course */}
      <div className="mt-8 space-y-4">
        {/* User Profile */}
        {!isSidebarCollapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user?.user_metadata?.full_name?.charAt(0) || "U"}
              </span>
            </div>
            <div className="flex-1">
              <h3
                className={`font-bold text-sm ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {user?.user_metadata?.full_name || "User"}
              </h3>
              <p
                className={`text-xs ${
                  isDark ? "text-slate-400" : "text-slate-600"
                }`}
              >
                {user?.user_metadata?.subscription_type || "Basic Plan"}
              </p>
            </div>
            <button className="text-slate-400 hover:text-slate-600">
              <Bell className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Exit Course Button */}
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className={`${
            isSidebarCollapsed ? "w-10 h-10 p-0" : "w-full"
          } flex items-center gap-2 ${
            isDark
              ? "border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
              : "border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          {!isSidebarCollapsed && <span>Salir del Curso</span>}
        </Button>
      </div>
    </aside>
  );
}
