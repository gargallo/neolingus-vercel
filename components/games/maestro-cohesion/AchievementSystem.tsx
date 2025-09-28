'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Star,
  Zap,
  Target,
  Crown,
  Shield,
  Flame,
  Clock,
  Heart,
  Sparkles,
  Award,
  Medal,
  CheckCircle
} from 'lucide-react';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: 'combo' | 'streak' | 'speed' | 'accuracy' | 'powerups' | 'special';
  requirement: {
    type: string;
    value: number;
    description: string;
  };
  reward: {
    experience: number;
    powerups?: string[];
    title?: string;
  };
  isUnlocked: boolean;
  progress: number;
  unlockedAt?: Date;
}

interface GameStats {
  combo: number;
  streak: number;
  score: number;
  correctAnswers: number;
  totalAnswers: number;
  timeLeft: number;
  powerupsUsed: number;
  level: number;
  maxCombo: number;
  maxStreak: number;
  averageResponseTime: number;
  perfectAnswers: number; // Answered within 3 seconds
}

interface AchievementSystemProps {
  gameStats: GameStats;
  onAchievementUnlocked: (achievement: Achievement) => void;
  className?: string;
}

// Achievement definitions
const ACHIEVEMENTS: Achievement[] = [
  // Combo achievements
  {
    id: 'first_combo',
    name: 'Primera Conexión',
    description: 'Consigue tu primer combo de 3',
    icon: <Zap className="w-6 h-6" />,
    rarity: 'bronze',
    category: 'combo',
    requirement: { type: 'combo', value: 3, description: 'Alcanza un combo de 3' },
    reward: { experience: 50, powerups: ['shield'] },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'combo_master',
    name: 'Maestro del Combo',
    description: 'Alcanza un combo de 10',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'silver',
    category: 'combo',
    requirement: { type: 'combo', value: 10, description: 'Alcanza un combo de 10' },
    reward: { experience: 150, powerups: ['point_multiplier'], title: 'Combo Master' },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'combo_legend',
    name: 'Leyenda del Combo',
    description: 'Alcanza un combo de 25',
    icon: <Flame className="w-6 h-6" />,
    rarity: 'gold',
    category: 'combo',
    requirement: { type: 'combo', value: 25, description: 'Alcanza un combo de 25' },
    reward: { experience: 300, powerups: ['lightning'], title: 'Combo Legend' },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'combo_god',
    name: 'Dios del Combo',
    description: 'Alcanza un combo de 50',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'diamond',
    category: 'combo',
    requirement: { type: 'combo', value: 50, description: 'Alcanza un combo de 50' },
    reward: { experience: 1000, powerups: ['crown'], title: 'Combo God' },
    isUnlocked: false,
    progress: 0
  },

  // Streak achievements
  {
    id: 'streak_starter',
    name: 'Racha Inicial',
    description: 'Consigue una racha de 5',
    icon: <Target className="w-6 h-6" />,
    rarity: 'bronze',
    category: 'streak',
    requirement: { type: 'streak', value: 5, description: 'Alcanza una racha de 5' },
    reward: { experience: 75, powerups: ['streak_save'] },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'streak_warrior',
    name: 'Guerrero de la Racha',
    description: 'Consigue una racha de 15',
    icon: <Shield className="w-6 h-6" />,
    rarity: 'silver',
    category: 'streak',
    requirement: { type: 'streak', value: 15, description: 'Alcanza una racha de 15' },
    reward: { experience: 200, powerups: ['energy'], title: 'Streak Warrior' },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'unstoppable',
    name: 'Imparable',
    description: 'Consigue una racha de 30',
    icon: <Flame className="w-6 h-6" />,
    rarity: 'gold',
    category: 'streak',
    requirement: { type: 'streak', value: 30, description: 'Alcanza una racha de 30' },
    reward: { experience: 500, powerups: ['crown'], title: 'Unstoppable' },
    isUnlocked: false,
    progress: 0
  },

  // Speed achievements
  {
    id: 'quick_thinker',
    name: 'Pensador Rápido',
    description: 'Responde 10 preguntas en menos de 3 segundos',
    icon: <Clock className="w-6 h-6" />,
    rarity: 'bronze',
    category: 'speed',
    requirement: { type: 'perfectAnswers', value: 10, description: 'Respuestas perfectas (< 3s)' },
    reward: { experience: 100, powerups: ['time_boost'] },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'lightning_fast',
    name: 'Velocidad del Rayo',
    description: 'Responde 25 preguntas en menos de 3 segundos',
    icon: <Zap className="w-6 h-6" />,
    rarity: 'silver',
    category: 'speed',
    requirement: { type: 'perfectAnswers', value: 25, description: 'Respuestas perfectas (< 3s)' },
    reward: { experience: 250, powerups: ['lightning'], title: 'Lightning Fast' },
    isUnlocked: false,
    progress: 0
  },

  // Accuracy achievements
  {
    id: 'sharpshooter',
    name: 'Tirador Certero',
    description: 'Mantén 90% de precisión con al menos 20 respuestas',
    icon: <Target className="w-6 h-6" />,
    rarity: 'silver',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 90, description: '90% precisión (min. 20 respuestas)' },
    reward: { experience: 200, powerups: ['hint'], title: 'Sharpshooter' },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'perfectionist',
    name: 'Perfeccionista',
    description: 'Mantén 100% de precisión con al menos 15 respuestas',
    icon: <Star className="w-6 h-6" />,
    rarity: 'gold',
    category: 'accuracy',
    requirement: { type: 'accuracy', value: 100, description: '100% precisión (min. 15 respuestas)' },
    reward: { experience: 400, powerups: ['crown'], title: 'Perfectionist' },
    isUnlocked: false,
    progress: 0
  },

  // Power-up achievements
  {
    id: 'powerup_collector',
    name: 'Coleccionista de Power-ups',
    description: 'Usa 10 power-ups en una sesión',
    icon: <Sparkles className="w-6 h-6" />,
    rarity: 'bronze',
    category: 'powerups',
    requirement: { type: 'powerupsUsed', value: 10, description: 'Usa 10 power-ups' },
    reward: { experience: 100, powerups: ['combo_boost'] },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'powerup_master',
    name: 'Maestro de Power-ups',
    description: 'Usa 25 power-ups en una sesión',
    icon: <Crown className="w-6 h-6" />,
    rarity: 'gold',
    category: 'powerups',
    requirement: { type: 'powerupsUsed', value: 25, description: 'Usa 25 power-ups' },
    reward: { experience: 300, powerups: ['crown'], title: 'PowerUp Master' },
    isUnlocked: false,
    progress: 0
  },

  // Special achievements
  {
    id: 'first_steps',
    name: 'Primeros Pasos',
    description: 'Completa tu primera pregunta',
    icon: <CheckCircle className="w-6 h-6" />,
    rarity: 'bronze',
    category: 'special',
    requirement: { type: 'totalAnswers', value: 1, description: 'Responde 1 pregunta' },
    reward: { experience: 25 },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'scholar',
    name: 'Erudito',
    description: 'Alcanza el nivel 10',
    icon: <Award className="w-6 h-6" />,
    rarity: 'silver',
    category: 'special',
    requirement: { type: 'level', value: 10, description: 'Alcanza el nivel 10' },
    reward: { experience: 500, title: 'Scholar' },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'score_hunter',
    name: 'Cazador de Puntos',
    description: 'Alcanza 5000 puntos en una sesión',
    icon: <Trophy className="w-6 h-6" />,
    rarity: 'gold',
    category: 'special',
    requirement: { type: 'score', value: 5000, description: 'Alcanza 5000 puntos' },
    reward: { experience: 300, powerups: ['star_burst'], title: 'Score Hunter' },
    isUnlocked: false,
    progress: 0
  },
  {
    id: 'legendary_scholar',
    name: 'Erudito Legendario',
    description: 'Desbloquea 10 logros',
    icon: <Medal className="w-6 h-6" />,
    rarity: 'platinum',
    category: 'special',
    requirement: { type: 'achievementsUnlocked', value: 10, description: 'Desbloquea 10 logros' },
    reward: { experience: 1000, powerups: ['crown'], title: 'Legendary Scholar' },
    isUnlocked: false,
    progress: 0
  }
];

export function AchievementSystem({ gameStats, onAchievementUnlocked, className = '' }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(ACHIEVEMENTS);
  const [recentUnlocks, setRecentUnlocks] = useState<Achievement[]>([]);
  const [showAchievementPanel, setShowAchievementPanel] = useState(false);

  // Check achievements
  const checkAchievements = useCallback(() => {
    setAchievements(prevAchievements => {
      const updatedAchievements = prevAchievements.map(achievement => {
        if (achievement.isUnlocked) return achievement;

        let progress = 0;
        let shouldUnlock = false;

        switch (achievement.requirement.type) {
          case 'combo':
            progress = Math.min(gameStats.combo / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.combo >= achievement.requirement.value;
            break;
          case 'streak':
            progress = Math.min(gameStats.streak / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.streak >= achievement.requirement.value;
            break;
          case 'score':
            progress = Math.min(gameStats.score / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.score >= achievement.requirement.value;
            break;
          case 'level':
            progress = Math.min(gameStats.level / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.level >= achievement.requirement.value;
            break;
          case 'totalAnswers':
            progress = Math.min(gameStats.totalAnswers / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.totalAnswers >= achievement.requirement.value;
            break;
          case 'perfectAnswers':
            progress = Math.min(gameStats.perfectAnswers / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.perfectAnswers >= achievement.requirement.value;
            break;
          case 'powerupsUsed':
            progress = Math.min(gameStats.powerupsUsed / achievement.requirement.value, 1) * 100;
            shouldUnlock = gameStats.powerupsUsed >= achievement.requirement.value;
            break;
          case 'accuracy':
            if (gameStats.totalAnswers >= 15) {
              const accuracy = (gameStats.correctAnswers / gameStats.totalAnswers) * 100;
              progress = Math.min(accuracy / achievement.requirement.value, 1) * 100;
              shouldUnlock = accuracy >= achievement.requirement.value;
            }
            break;
          case 'achievementsUnlocked':
            const unlockedCount = prevAchievements.filter(a => a.isUnlocked).length;
            progress = Math.min(unlockedCount / achievement.requirement.value, 1) * 100;
            shouldUnlock = unlockedCount >= achievement.requirement.value;
            break;
        }

        if (shouldUnlock && !achievement.isUnlocked) {
          const unlockedAchievement = {
            ...achievement,
            isUnlocked: true,
            progress: 100,
            unlockedAt: new Date()
          };

          // Add to recent unlocks
          setRecentUnlocks(prev => [...prev, unlockedAchievement]);
          setTimeout(() => {
            setRecentUnlocks(prev => prev.filter(a => a.id !== achievement.id));
          }, 5000);

          onAchievementUnlocked(unlockedAchievement);
          return unlockedAchievement;
        }

        return { ...achievement, progress };
      });

      return updatedAchievements;
    });
  }, [gameStats, onAchievementUnlocked]);

  // Check achievements when stats change
  useEffect(() => {
    checkAchievements();
  }, [checkAchievements]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'bronze': return 'from-amber-600 to-yellow-700';
      case 'silver': return 'from-gray-400 to-gray-600';
      case 'gold': return 'from-yellow-400 to-yellow-600';
      case 'platinum': return 'from-blue-400 to-purple-600';
      case 'diamond': return 'from-cyan-400 to-blue-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityGlow = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'bronze': return 'shadow-amber-500/50';
      case 'silver': return 'shadow-gray-400/50';
      case 'gold': return 'shadow-yellow-400/50';
      case 'platinum': return 'shadow-purple-400/50';
      case 'diamond': return 'shadow-cyan-400/50';
      default: return 'shadow-gray-400/50';
    }
  };

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const totalAchievements = achievements.length;

  return (
    <div className={className}>
      {/* Achievement Button */}
      <motion.button
        onClick={() => setShowAchievementPanel(true)}
        className="fixed bottom-20 right-6 w-14 h-14 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full shadow-lg shadow-yellow-500/30 flex items-center justify-center z-30"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Ver logros"
      >
        <Trophy className="w-6 h-6 text-white" />
        {unlockedAchievements.length > 0 && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {unlockedAchievements.length}
          </motion.div>
        )}
      </motion.button>

      {/* Recent Achievement Notifications */}
      <AnimatePresence>
        {recentUnlocks.map((achievement, index) => (
          <motion.div
            key={achievement.id}
            className="fixed top-20 right-6 z-50"
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
            style={{ top: 80 + index * 120 }}
          >
            <div className={`bg-gradient-to-br ${getRarityColor(achievement.rarity)} p-4 rounded-xl border-2 border-white/30 shadow-2xl ${getRarityGlow(achievement.rarity)} backdrop-blur-sm`}>
              <motion.div
                className="text-center text-white"
                animate={{
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 2, repeat: 2 }}
              >
                <div className="text-2xl mb-2">
                  {achievement.icon}
                </div>
                <div className="font-bold text-lg">
                  ¡Logro Desbloqueado!
                </div>
                <div className="font-medium">
                  {achievement.name}
                </div>
                <div className="text-sm opacity-80 mt-1">
                  +{achievement.reward.experience} EXP
                </div>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Achievement Panel */}
      <AnimatePresence>
        {showAchievementPanel && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAchievementPanel(false)}
          >
            <motion.div
              className="bg-slate-900/95 border border-purple-500/30 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto backdrop-blur-sm"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-yellow-400" />
                  Logros
                  <span className="text-purple-400">({unlockedAchievements.length}/{totalAchievements})</span>
                </h2>
                <button
                  onClick={() => setShowAchievementPanel(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Progreso general</span>
                  <span>{Math.round((unlockedAchievements.length / totalAchievements) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(unlockedAchievements.length / totalAchievements) * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>

              {/* Achievement Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    className={`p-4 rounded-lg border-2 ${
                      achievement.isUnlocked
                        ? `bg-gradient-to-br ${getRarityColor(achievement.rarity)} border-white/30 ${getRarityGlow(achievement.rarity)}`
                        : 'bg-slate-800/50 border-slate-600/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: achievements.indexOf(achievement) * 0.05 }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-2xl ${achievement.isUnlocked ? 'text-white' : 'text-gray-500'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold ${achievement.isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${achievement.isUnlocked ? 'text-white/80' : 'text-gray-500'} mb-2`}>
                          {achievement.description}
                        </p>
                        <div className={`text-xs ${achievement.isUnlocked ? 'text-white/60' : 'text-gray-600'} mb-2`}>
                          {achievement.requirement.description}
                        </div>
                        {!achievement.isUnlocked && (
                          <div className="w-full bg-slate-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-400 to-cyan-400 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${achievement.progress}%` }}
                            />
                          </div>
                        )}
                        {achievement.isUnlocked && achievement.unlockedAt && (
                          <div className="text-xs text-white/60 mt-2">
                            Desbloqueado: {achievement.unlockedAt.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}