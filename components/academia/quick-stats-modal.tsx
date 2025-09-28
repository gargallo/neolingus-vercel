"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import { X, TrendingUp, Calendar, Target } from "lucide-react";

interface QuickStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  language: string;
  level: string;
}

export function QuickStatsModal({ isOpen, onClose, user, language, level }: QuickStatsModalProps) {
  const { resolvedTheme } = useEnhancedTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: 50 }}
            className={`fixed right-4 top-4 bottom-4 w-80 z-50 rounded-2xl shadow-2xl ${
              isDark
                ? "bg-slate-800 border border-slate-700"
                : "bg-white border border-slate-200"
            }`}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  Progreso Rápido
                </h2>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark
                      ? "hover:bg-slate-700 text-slate-400 hover:text-white"
                      : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* User Profile */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {user?.user_metadata?.full_name?.charAt(0) || "U"}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {user?.user_metadata?.full_name || "User"}
                    </h3>
                    <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      {user?.user_metadata?.subscription_type || "Basic Plan"}
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <TrendingUp className="w-5 h-5" />
                    Estadísticas
                  </h3>
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Curso Actual</span>
                        <span className="text-lg font-bold text-blue-600">85%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-4 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-600 mb-1">12</div>
                          <div className="text-xs text-gray-500">Racha de días</div>
                        </div>
                      </div>

                      <div className={`p-4 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                        <div className="text-center">
                          <div className="text-xl font-bold text-purple-600 mb-1">4.2h</div>
                          <div className="text-xs text-gray-500">Esta semana</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <Target className="w-5 h-5" />
                    Acciones Rápidas
                  </h3>
                  <div className="space-y-3">
                    <button
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isDark
                          ? "hover:bg-slate-600 text-slate-300"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 dark:text-blue-400">📝</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Continuar práctica</div>
                          <div className="text-xs text-gray-500">Vocabulario pendiente</div>
                        </div>
                      </div>
                    </button>

                    <button
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isDark
                          ? "hover:bg-slate-600 text-slate-300"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                          <span className="text-green-600 dark:text-green-400">🎯</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Examen simulacro</div>
                          <div className="text-xs text-gray-500">15 min restantes</div>
                        </div>
                      </div>
                    </button>

                    <button
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        isDark
                          ? "hover:bg-slate-600 text-slate-300"
                          : "hover:bg-slate-50 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                          <span className="text-purple-600 dark:text-purple-400">🏆</span>
                        </div>
                        <div>
                          <div className="font-medium text-sm">Ver logros</div>
                          <div className="text-xs text-gray-500">3 nuevos disponibles</div>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Activity Calendar */}
                <div>
                  <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                    <Calendar className="w-5 h-5" />
                    Actividad Reciente
                  </h3>
                  <div className={`p-4 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-100"}`}>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
                      {["L", "M", "X", "J", "V", "S", "D"].map(day => (
                        <div key={day} className="p-1">{day}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 14 }, (_, i) => {
                        const intensity = Math.random();
                        return (
                          <div
                            key={i}
                            className={`aspect-square rounded text-xs flex items-center justify-center ${
                              intensity > 0.7 ? 'bg-green-500 text-white' :
                              intensity > 0.4 ? 'bg-green-300 text-green-800' :
                              intensity > 0.1 ? 'bg-green-100 text-green-600' :
                              'bg-gray-100 dark:bg-gray-600'
                            }`}
                            title={`${Math.floor(intensity * 60)} minutos`}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}