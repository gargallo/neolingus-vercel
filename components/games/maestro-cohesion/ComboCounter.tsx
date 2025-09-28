'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Zap, Flame, Crown } from 'lucide-react';

interface ComboCounterProps {
  combo: number;
  streak: number;
  className?: string;
  onComboBreak?: () => void;
}

export function ComboCounter({ combo, streak, className = '', onComboBreak }: ComboCounterProps) {
  const [previousCombo, setPreviousCombo] = useState(combo);
  const [showComboBreak, setShowComboBreak] = useState(false);

  useEffect(() => {
    // Detect combo break
    if (previousCombo > 0 && combo === 0) {
      setShowComboBreak(true);
      onComboBreak?.();
      setTimeout(() => setShowComboBreak(false), 2000);
    }
    setPreviousCombo(combo);
  }, [combo, previousCombo, onComboBreak]);

  // Get combo tier and styling
  const getComboTier = (comboValue: number) => {
    if (comboValue >= 10) return { tier: 'legendary', color: 'from-yellow-400 to-orange-500', glow: 'shadow-yellow-400/50' };
    if (comboValue >= 7) return { tier: 'epic', color: 'from-purple-400 to-pink-500', glow: 'shadow-purple-400/50' };
    if (comboValue >= 5) return { tier: 'rare', color: 'from-blue-400 to-cyan-500', glow: 'shadow-blue-400/50' };
    if (comboValue >= 3) return { tier: 'uncommon', color: 'from-green-400 to-emerald-500', glow: 'shadow-green-400/50' };
    return { tier: 'common', color: 'from-gray-400 to-gray-500', glow: 'shadow-gray-400/50' };
  };

  const comboTier = getComboTier(combo);
  const streakTier = getComboTier(streak);

  // Get multiplier text
  const getMultiplierText = (value: number) => {
    if (value >= 10) return `${Math.floor(value / 2)}x MEGA!`;
    if (value >= 7) return `${Math.floor(value / 2)}x SUPER!`;
    if (value >= 5) return `${Math.floor(value / 2)}x GREAT!`;
    if (value >= 3) return `${Math.floor(value / 2)}x GOOD!`;
    return '';
  };

  const getComboIcon = (value: number) => {
    if (value >= 10) return <Crown className="w-6 h-6" />;
    if (value >= 5) return <Flame className="w-5 h-5" />;
    if (value >= 3) return <Zap className="w-4 h-4" />;
    return null;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Combo Break Animation */}
      <AnimatePresence>
        {showComboBreak && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            <div className="bg-red-500/20 border border-red-400 rounded-lg px-4 py-2 backdrop-blur-sm">
              <motion.span
                className="text-red-400 font-bold text-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
              >
                COMBO BREAK!
              </motion.span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        {/* Combo Counter */}
        <motion.div
          className={`relative overflow-hidden rounded-xl border-2 p-4 text-center ${
            combo > 0
              ? `bg-gradient-to-br ${comboTier.color} border-white/30 ${comboTier.glow} shadow-lg`
              : 'bg-slate-800/50 border-slate-600'
          }`}
          animate={{
            scale: combo > previousCombo ? [1, 1.1, 1] : 1,
            boxShadow: combo >= 3
              ? ['0 0 20px rgba(139, 92, 246, 0.5)', '0 0 40px rgba(139, 92, 246, 0.8)', '0 0 20px rgba(139, 92, 246, 0.5)']
              : '0 0 0px rgba(0, 0, 0, 0)'
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated background effect */}
          {combo >= 5 && (
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
                  'linear-gradient(45deg, transparent, transparent, transparent)',
                  'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* Combo Icon */}
          <div className="flex items-center justify-center mb-2">
            <motion.div
              animate={{
                rotate: combo > 0 ? [0, 10, -10, 0] : 0,
                scale: combo >= 10 ? [1, 1.2, 1] : 1
              }}
              transition={{ duration: 0.5, repeat: combo >= 10 ? Infinity : 0 }}
            >
              {getComboIcon(combo) || <Zap className="w-4 h-4 text-gray-400" />}
            </motion.div>
          </div>

          {/* Combo Number */}
          <motion.div
            key={combo}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-white"
          >
            {combo}
          </motion.div>

          <div className="text-xs text-white/80 uppercase tracking-wider">
            Combo
          </div>

          {/* Multiplier Text */}
          <AnimatePresence>
            {combo >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-bold text-white mt-1"
              >
                {getMultiplierText(combo)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse effect for high combos */}
          {combo >= 7 && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-white/50"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.div>

        {/* Streak Counter */}
        <motion.div
          className={`relative overflow-hidden rounded-xl border-2 p-4 text-center ${
            streak > 0
              ? `bg-gradient-to-br ${streakTier.color} border-white/30 ${streakTier.glow} shadow-lg`
              : 'bg-slate-800/50 border-slate-600'
          }`}
          animate={{
            scale: streak > 0 && streak % 5 === 0 ? [1, 1.1, 1] : 1
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Fire animation for high streaks */}
          {streak >= 5 && (
            <motion.div
              className="absolute inset-0"
              animate={{
                background: [
                  'radial-gradient(circle at 50% 100%, rgba(249, 115, 22, 0.3), transparent 50%)',
                  'radial-gradient(circle at 30% 100%, rgba(249, 115, 22, 0.4), transparent 60%)',
                  'radial-gradient(circle at 70% 100%, rgba(249, 115, 22, 0.3), transparent 50%)'
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}

          {/* Streak Icon */}
          <div className="flex items-center justify-center mb-2">
            <motion.div
              animate={{
                scale: streak >= 10 ? [1, 1.3, 1] : 1,
                rotate: streak >= 15 ? [0, 5, -5, 0] : 0
              }}
              transition={{ duration: 0.8, repeat: streak >= 10 ? Infinity : 0 }}
            >
              <Flame className={`w-5 h-5 ${streak > 0 ? 'text-orange-300' : 'text-gray-400'}`} />
            </motion.div>
          </div>

          {/* Streak Number */}
          <motion.div
            key={streak}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-white"
          >
            {streak}
          </motion.div>

          <div className="text-xs text-white/80 uppercase tracking-wider">
            Streak
          </div>

          {/* Streak milestone celebration */}
          <AnimatePresence>
            {streak > 0 && streak % 10 === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <motion.div
                  className="text-yellow-300 font-bold text-lg"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 0.5, repeat: 3 }}
                >
                  🔥 ON FIRE! 🔥
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Combo Timer Bar (optional) */}
      {combo > 0 && (
        <motion.div
          className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
        >
          <motion.div
            className={`h-full bg-gradient-to-r ${comboTier.color}`}
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </motion.div>
      )}

      {/* Achievement notifications */}
      <AnimatePresence>
        {combo === 5 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-blue-500/90 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap"
          >
            🎯 Combo Master!
          </motion.div>
        )}
        {combo === 10 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap"
          >
            👑 Legendary Combo!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}