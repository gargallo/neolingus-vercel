"use client";

import { CourseSidebar } from "@/components/academia/course-sidebar";
import { QuickStatsModal } from "@/components/academia/quick-stats-modal";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

interface CourseLayoutWrapperProps {
  children: React.ReactNode;
  user: any;
  language: string;
  level: string;
}

const LANGUAGE_DISPLAY_NAMES: Record<string, string> = {
  english: "English",
  valenciano: "Valencià",
  spanish: "Español",
  french: "Français",
  german: "Deutsch",
  italian: "Italiano",
  portuguese: "Português",
};

const LANGUAGE_GRADIENTS: Record<string, string> = {
  english: "from-blue-600 via-indigo-600 to-purple-600",
  valenciano: "from-orange-500 via-rose-500 to-pink-600",
  spanish: "from-emerald-500 via-cyan-500 to-blue-500",
  french: "from-purple-500 via-pink-500 to-red-500",
  german: "from-slate-700 via-gray-700 to-black",
  italian: "from-emerald-600 via-lime-500 to-red-500",
  portuguese: "from-green-600 via-teal-500 to-blue-500",
};

export function CourseLayoutWrapper({ children, user, language, level }: CourseLayoutWrapperProps) {
  const { resolvedTheme } = useEnhancedTheme();
  const [mounted, setMounted] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Theme helper to avoid hydration mismatches
  const isDark = mounted ? resolvedTheme === "dark" : false;

  return (
    <div
      className={`relative min-h-screen ${
        isDark ? "bg-slate-900" : "bg-slate-50"
      }`}
    >
      {/* Left Sidebar - Navigation */}
      <CourseSidebar user={user} language={language} level={level} />

      {/* Main Content Area */}
      <main className="min-h-screen pl-16 transition-[padding] duration-300 ease-out">
        <div className="relative">
          {/* Course Badge - Top Right */}
          <div className="absolute top-4 right-6 z-20">
            <CourseHeader language={language} level={level} />
          </div>
          <div className="px-6 pt-4 pb-16">
            {children}
          </div>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsStatsModalOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-30 flex items-center justify-center transition-all duration-300 ${
          isDark
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Ver progreso y estadísticas"
      >
        <BarChart3 className="w-6 h-6" />
      </motion.button>

      {/* Quick Stats Modal */}
      <QuickStatsModal
        isOpen={isStatsModalOpen}
        onClose={() => setIsStatsModalOpen(false)}
        user={user}
        language={language}
        level={level}
      />
    </div>
  );
}

function CourseHeader({ language, level }: { language: string; level: string }) {
  const languageKey = language?.toLowerCase() || "";
  const gradient = LANGUAGE_GRADIENTS[languageKey] || "from-blue-600 to-purple-600";
  const displayLanguage = LANGUAGE_DISPLAY_NAMES[languageKey] || language?.charAt(0).toUpperCase() + language?.slice(1);
  const levelLabel = level?.toUpperCase();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <div
        className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-gradient-to-r ${gradient} px-3 py-1.5 text-white shadow-md cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="h-2 w-2 rounded-full bg-white/80" />
        <span className="text-sm font-semibold">
          {displayLanguage} {levelLabel}
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full right-0 mt-2 w-72 p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30"
        >
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Curso Activo
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {displayLanguage} - Nivel {levelLabel}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Certificación:</span>
                <span className="font-medium text-slate-900 dark:text-white">Oficial</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">IA Adaptativa:</span>
                <span className="font-medium text-green-600 dark:text-green-400">Activa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Simuladores:</span>
                <span className="font-medium text-slate-900 dark:text-white">Disponibles</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-600">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personaliza tu estudio con rutas generadas por IA y simuladores diseñados para tu certificación.
              </p>
            </div>
          </div>

          {/* Arrow pointing up */}
          <div className="absolute -top-2 right-4 w-4 h-4 bg-white dark:bg-slate-800 border-l border-t border-slate-200 dark:border-slate-700 rotate-45"></div>
        </motion.div>
      )}
    </div>
  );
}
