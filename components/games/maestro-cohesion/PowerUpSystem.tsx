'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import {
  Shield,
  Zap,
  Clock,
  Target,
  Star,
  Heart,
  Lightbulb,
  Flame,
  Sparkles,
  Crown
} from 'lucide-react';

export type PowerUpType =
  | 'shield'        // Protects from one wrong answer
  | 'time_boost'    // Adds extra time
  | 'point_multiplier' // Doubles points for next 3 answers
  | 'hint'          // Shows hint for current question
  | 'streak_save'   // Saves streak from breaking once
  | 'combo_boost'   // Automatically adds +3 to combo
  | 'energy'        // Restores health/energy
  | 'lightning'     // Auto-answers correctly (rare)
  | 'star_burst'    // Bonus points explosion
  | 'crown'         // VIP status with multiple benefits

interface PowerUp {
  id: string;
  type: PowerUpType;
  name: string;
  description: string;
  icon: React.ReactNode;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  duration?: number; // in seconds, if applicable
  color: string;
  glowColor: string;
  effect: (gameState: any) => any;
}

interface ActivePowerUp {
  powerUp: PowerUp;
  timeLeft: number;
  activated: number; // timestamp
}

interface PowerUpSystemProps {
  combo: number;
  streak: number;
  score: number;
  onPowerUpActivated: (powerUp: PowerUp) => void;
  onPowerUpExpired: (powerUpType: PowerUpType) => void;
  className?: string;
}

// Power-up definitions
const POWER_UPS: Record<PowerUpType, PowerUp> = {
  shield: {
    id: 'shield',
    type: 'shield',
    name: 'Escudo Protector',
    description: 'Te protege de una respuesta incorrecta',
    icon: <Shield className="w-5 h-5" />,
    rarity: 'common',
    duration: 60,
    color: 'from-blue-400 to-cyan-500',
    glowColor: 'shadow-blue-400/50',
    effect: (gameState) => ({ ...gameState, hasShield: true })
  },
  time_boost: {
    id: 'time_boost',
    type: 'time_boost',
    name: 'Impulso Temporal',
    description: 'Añade 30 segundos extra al reloj',
    icon: <Clock className="w-5 h-5" />,
    rarity: 'common',
    color: 'from-green-400 to-emerald-500',
    glowColor: 'shadow-green-400/50',
    effect: (gameState) => ({ ...gameState, timeLeft: gameState.timeLeft + 30 })
  },
  point_multiplier: {
    id: 'point_multiplier',
    type: 'point_multiplier',
    name: 'Multiplicador x2',
    description: 'Duplica los puntos por las próximas 3 respuestas',
    icon: <Star className="w-5 h-5" />,
    rarity: 'uncommon',
    duration: 45,
    color: 'from-yellow-400 to-orange-500',
    glowColor: 'shadow-yellow-400/50',
    effect: (gameState) => ({ ...gameState, pointMultiplier: 2, multiplierAnswersLeft: 3 })
  },
  hint: {
    id: 'hint',
    type: 'hint',
    name: 'Pista Reveladora',
    description: 'Muestra una pista para la pregunta actual',
    icon: <Lightbulb className="w-5 h-5" />,
    rarity: 'common',
    color: 'from-purple-400 to-pink-500',
    glowColor: 'shadow-purple-400/50',
    effect: (gameState) => ({ ...gameState, showHint: true })
  },
  streak_save: {
    id: 'streak_save',
    type: 'streak_save',
    name: 'Salvavidas de Racha',
    description: 'Evita que se rompa tu racha una vez',
    icon: <Heart className="w-5 h-5" />,
    rarity: 'uncommon',
    duration: 120,
    color: 'from-red-400 to-pink-500',
    glowColor: 'shadow-red-400/50',
    effect: (gameState) => ({ ...gameState, hasStreakSave: true })
  },
  combo_boost: {
    id: 'combo_boost',
    type: 'combo_boost',
    name: 'Impulso de Combo',
    description: 'Añade +5 al combo instantáneamente',
    icon: <Zap className="w-5 h-5" />,
    rarity: 'rare',
    color: 'from-cyan-400 to-blue-500',
    glowColor: 'shadow-cyan-400/50',
    effect: (gameState) => ({ ...gameState, combo: gameState.combo + 5 })
  },
  energy: {
    id: 'energy',
    type: 'energy',
    name: 'Energía Vital',
    description: 'Restaura energía y mejora el rendimiento',
    icon: <Sparkles className="w-5 h-5" />,
    rarity: 'uncommon',
    duration: 90,
    color: 'from-emerald-400 to-cyan-500',
    glowColor: 'shadow-emerald-400/50',
    effect: (gameState) => ({ ...gameState, energy: 100, energyBoost: true })
  },
  lightning: {
    id: 'lightning',
    type: 'lightning',
    name: 'Rayo de Sabiduría',
    description: 'Responde automáticamente la siguiente pregunta',
    icon: <Flame className="w-5 h-5" />,
    rarity: 'epic',
    color: 'from-yellow-400 to-red-500',
    glowColor: 'shadow-yellow-400/50',
    effect: (gameState) => ({ ...gameState, autoAnswer: true })
  },
  star_burst: {
    id: 'star_burst',
    type: 'star_burst',
    name: 'Explosión Estelar',
    description: 'Otorga 500 puntos bonus instantáneos',
    icon: <Target className="w-5 h-5" />,
    rarity: 'rare',
    color: 'from-purple-400 to-cyan-500',
    glowColor: 'shadow-purple-400/50',
    effect: (gameState) => ({ ...gameState, score: gameState.score + 500 })
  },
  crown: {
    id: 'crown',
    type: 'crown',
    name: 'Corona Imperial',
    description: 'Estado VIP: Todos los beneficios por 2 minutos',
    icon: <Crown className="w-5 h-5" />,
    rarity: 'legendary',
    duration: 120,
    color: 'from-yellow-400 to-purple-500',
    glowColor: 'shadow-yellow-400/50',
    effect: (gameState) => ({
      ...gameState,
      isVIP: true,
      pointMultiplier: 3,
      hasShield: true,
      hasStreakSave: true,
      energyBoost: true
    })
  }
};

// Power-up generation probabilities
const POWERUP_PROBABILITIES = {
  common: 50,      // 50%
  uncommon: 30,    // 30%
  rare: 15,        // 15%
  epic: 4,         // 4%
  legendary: 1     // 1%
};

export function PowerUpSystem({
  combo,
  streak,
  score,
  onPowerUpActivated,
  onPowerUpExpired,
  className = ''
}: PowerUpSystemProps) {
  const [availablePowerUps, setAvailablePowerUps] = useState<PowerUp[]>([]);
  const [activePowerUps, setActivePowerUps] = useState<ActivePowerUp[]>([]);
  const [showPowerUpNotification, setShowPowerUpNotification] = useState<PowerUp | null>(null);

  // Generate power-ups based on performance
  const generatePowerUp = useCallback(() => {
    // Higher combo/streak = better power-ups
    const comboBonus = Math.floor(combo / 5) * 10;
    const streakBonus = Math.floor(streak / 3) * 5;
    const totalBonus = comboBonus + streakBonus;

    // Adjust probabilities based on performance
    const adjustedProbs = {
      common: Math.max(10, POWERUP_PROBABILITIES.common - totalBonus),
      uncommon: POWERUP_PROBABILITIES.uncommon + Math.floor(totalBonus * 0.3),
      rare: POWERUP_PROBABILITIES.rare + Math.floor(totalBonus * 0.4),
      epic: POWERUP_PROBABILITIES.epic + Math.floor(totalBonus * 0.2),
      legendary: POWERUP_PROBABILITIES.legendary + Math.floor(totalBonus * 0.1)
    };

    const random = Math.random() * 100;
    let cumulativeProb = 0;
    let selectedRarity: keyof typeof POWERUP_PROBABILITIES = 'common';

    for (const [rarity, prob] of Object.entries(adjustedProbs)) {
      cumulativeProb += prob;
      if (random <= cumulativeProb) {
        selectedRarity = rarity as keyof typeof POWERUP_PROBABILITIES;
        break;
      }
    }

    // Get power-ups of selected rarity
    const powerUpsOfRarity = Object.values(POWER_UPS).filter(
      (powerUp) => powerUp.rarity === selectedRarity
    );

    if (powerUpsOfRarity.length > 0) {
      const randomPowerUp = powerUpsOfRarity[Math.floor(Math.random() * powerUpsOfRarity.length)];
      return randomPowerUp;
    }

    return Object.values(POWER_UPS)[0]; // Fallback
  }, [combo, streak]);

  // Generate power-ups on milestones
  useEffect(() => {
    const shouldGeneratePowerUp =
      (combo > 0 && combo % 7 === 0) ||  // Every 7 combo
      (streak > 0 && streak % 10 === 0) || // Every 10 streak
      (score > 0 && score % 1000 === 0);   // Every 1000 points

    if (shouldGeneratePowerUp && availablePowerUps.length < 3) {
      const newPowerUp = generatePowerUp();
      setAvailablePowerUps(prev => [...prev, newPowerUp]);

      // Show notification
      setShowPowerUpNotification(newPowerUp);
      setTimeout(() => setShowPowerUpNotification(null), 3000);
    }
  }, [combo, streak, score, generatePowerUp, availablePowerUps.length]);

  // Handle power-up expiration
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePowerUps(prev => {
        const now = Date.now();
        return prev.filter(activePowerUp => {
          const timeElapsed = (now - activePowerUp.activated) / 1000;
          const shouldExpire = activePowerUp.powerUp.duration && timeElapsed >= activePowerUp.powerUp.duration;

          if (shouldExpire) {
            onPowerUpExpired(activePowerUp.powerUp.type);
          }

          return !shouldExpire;
        }).map(activePowerUp => ({
          ...activePowerUp,
          timeLeft: activePowerUp.powerUp.duration
            ? Math.max(0, activePowerUp.powerUp.duration - (now - activePowerUp.activated) / 1000)
            : 0
        }));
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onPowerUpExpired]);

  const activatePowerUp = (powerUp: PowerUp) => {
    // Remove from available
    setAvailablePowerUps(prev => prev.filter(p => p.id !== powerUp.id));

    // Add to active if it has duration
    if (powerUp.duration) {
      setActivePowerUps(prev => [...prev, {
        powerUp,
        timeLeft: powerUp.duration!,
        activated: Date.now()
      }]);
    }

    onPowerUpActivated(powerUp);
  };

  const getRarityGlow = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'shadow-gray-400/30';
      case 'uncommon': return 'shadow-green-400/40';
      case 'rare': return 'shadow-blue-400/50';
      case 'epic': return 'shadow-purple-400/60';
      case 'legendary': return 'shadow-yellow-400/70';
      default: return 'shadow-gray-400/30';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-500/50';
      case 'uncommon': return 'border-green-500/50';
      case 'rare': return 'border-blue-500/50';
      case 'epic': return 'border-purple-500/50';
      case 'legendary': return 'border-yellow-500/50';
      default: return 'border-gray-500/50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Available Power-ups */}
      {availablePowerUps.length > 0 && (
        <motion.div
          className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Power-ups Disponibles
          </h3>
          <div className="flex gap-3">
            {availablePowerUps.map((powerUp, index) => (
              <motion.button
                key={powerUp.id}
                onClick={() => activatePowerUp(powerUp)}
                className={`relative group p-3 rounded-lg border-2 ${getRarityBorder(powerUp.rarity)} bg-gradient-to-br ${powerUp.color} shadow-lg ${getRarityGlow(powerUp.rarity)} transition-all duration-300`}
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, scale: 0, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: index * 0.1, type: "spring", stiffness: 300 }}
                title={`${powerUp.name}: ${powerUp.description}`}
              >
                <motion.div
                  className="text-white"
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                >
                  {powerUp.icon}
                </motion.div>

                {/* Rarity indicator */}
                <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                  powerUp.rarity === 'legendary' ? 'bg-yellow-400' :
                  powerUp.rarity === 'epic' ? 'bg-purple-400' :
                  powerUp.rarity === 'rare' ? 'bg-blue-400' :
                  powerUp.rarity === 'uncommon' ? 'bg-green-400' :
                  'bg-gray-400'
                } animate-pulse`} />
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Power-ups */}
      {activePowerUps.length > 0 && (
        <motion.div
          className="bg-slate-900/80 border border-cyan-500/30 rounded-xl p-4 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-cyan-300 font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Power-ups Activos
          </h3>
          <div className="space-y-2">
            {activePowerUps.map((activePowerUp, index) => (
              <motion.div
                key={activePowerUp.powerUp.id}
                className={`flex items-center gap-3 p-2 rounded-lg bg-gradient-to-r ${activePowerUp.powerUp.color} bg-opacity-20 border border-white/10`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-white">
                  {activePowerUp.powerUp.icon}
                </div>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {activePowerUp.powerUp.name}
                  </div>
                  <div className="text-white/60 text-xs">
                    {Math.ceil(activePowerUp.timeLeft)}s restantes
                  </div>
                </div>
                <div className="w-12 h-2 bg-black/30 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/80 rounded-full"
                    style={{
                      width: `${(activePowerUp.timeLeft / activePowerUp.powerUp.duration!) * 100}%`
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Power-up Notification */}
      <AnimatePresence>
        {showPowerUpNotification && (
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 180 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className={`bg-gradient-to-br ${showPowerUpNotification.color} p-6 rounded-xl border-2 border-white/30 shadow-2xl ${showPowerUpNotification.glowColor} backdrop-blur-sm`}>
              <motion.div
                className="text-center text-white"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <div className="text-4xl mb-2">
                  {showPowerUpNotification.icon}
                </div>
                <div className="font-bold text-lg">
                  ¡Nuevo Power-up!
                </div>
                <div className="font-medium">
                  {showPowerUpNotification.name}
                </div>
                <div className="text-sm opacity-80 mt-1">
                  {showPowerUpNotification.description}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for easier power-up management
export function usePowerUps() {
  const [activePowerUps, setActivePowerUps] = useState<Record<PowerUpType, boolean>>({
    shield: false,
    time_boost: false,
    point_multiplier: false,
    hint: false,
    streak_save: false,
    combo_boost: false,
    energy: false,
    lightning: false,
    star_burst: false,
    crown: false
  });

  const activatePowerUp = useCallback((type: PowerUpType) => {
    setActivePowerUps(prev => ({ ...prev, [type]: true }));
  }, []);

  const deactivatePowerUp = useCallback((type: PowerUpType) => {
    setActivePowerUps(prev => ({ ...prev, [type]: false }));
  }, []);

  const hasPowerUp = useCallback((type: PowerUpType) => {
    return activePowerUps[type];
  }, [activePowerUps]);

  return {
    activePowerUps,
    activatePowerUp,
    deactivatePowerUp,
    hasPowerUp
  };
}