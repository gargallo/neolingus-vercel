'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// Cyberpunk color palette
export const CYBERPUNK_COLORS = {
  // Neons
  neonBlue: '#00f5ff',
  neonPink: '#ff006e',
  neonPurple: '#8b5cf6',
  neonGreen: '#39ff14',
  neonOrange: '#ff7300',
  neonYellow: '#ffff00',

  // Dark base
  darkBg: '#0a0a0f',
  darkCard: '#1a1a2e',
  darkAccent: '#16213e',

  // Glows
  blueglow: 'rgba(0, 245, 255, 0.5)',
  pinkglow: 'rgba(255, 0, 110, 0.5)',
  purpleglow: 'rgba(139, 92, 246, 0.5)',
  greenglow: 'rgba(57, 255, 20, 0.5)'
};

// Cyberpunk gradients
export const CYBERPUNK_GRADIENTS = {
  primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  accent: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  success: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  cyberpunk1: 'linear-gradient(45deg, #00f5ff, #ff006e, #8b5cf6)',
  cyberpunk2: 'linear-gradient(135deg, #ff006e, #8b5cf6, #00f5ff)',
  cyberpunk3: 'linear-gradient(225deg, #8b5cf6, #00f5ff, #39ff14)',
  rainbow: 'linear-gradient(45deg, #ff006e, #ff7300, #ffff00, #39ff14, #00f5ff, #8b5cf6)',
};

// Cyberpunk animations
export const CYBERPUNK_ANIMATIONS = {
  glitch: {
    x: [0, -2, 2, -1, 1, 0],
    scaleX: [1, 0.98, 1.02, 0.99, 1.01, 1],
    transition: {
      duration: 0.5,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut"
    }
  },

  neonPulse: {
    textShadow: [
      '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
      '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
      '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  hologram: {
    opacity: [0.7, 1, 0.7],
    y: [0, -1, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  },

  dataStream: {
    backgroundPosition: ['0% 0%', '100% 100%'],
    transition: {
      duration: 20,
      repeat: Infinity,
      ease: "linear"
    }
  },

  scanline: {
    y: ['-100%', '100vh'],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear"
    }
  }
};

// Cyberpunk background effect component
export function CyberpunkBackground({ className = '' }) {
  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Animated grid */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            linear-gradient(90deg, transparent 98%, ${CYBERPUNK_COLORS.neonBlue} 100%),
            linear-gradient(180deg, transparent 98%, ${CYBERPUNK_COLORS.neonBlue} 100%)
          `,
          backgroundSize: '50px 50px'
        }}
        animate={CYBERPUNK_ANIMATIONS.dataStream}
      />

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Scanlines */}
      <motion.div
        className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-30"
        animate={CYBERPUNK_ANIMATIONS.scanline}
        style={{ left: 0 }}
      />
    </div>
  );
}

// Neon text component
export function NeonText({
  children,
  color = CYBERPUNK_COLORS.neonBlue,
  className = '',
  animate = true
}) {
  return (
    <motion.span
      className={`${className}`}
      style={{
        color,
        textShadow: `0 0 5px ${color}, 0 0 10px ${color}, 0 0 15px ${color}`
      }}
      animate={animate ? CYBERPUNK_ANIMATIONS.neonPulse : {}}
    >
      {children}
    </motion.span>
  );
}

// Holographic card component
export function HolographicCard({
  children,
  className = '',
  glitch = false
}) {
  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-lg border border-cyan-400/30
        bg-gradient-to-br from-slate-900/80 to-slate-800/80
        backdrop-blur-sm shadow-lg shadow-cyan-400/20
        ${className}
      `}
      animate={glitch ? CYBERPUNK_ANIMATIONS.glitch : CYBERPUNK_ANIMATIONS.hologram}
      whileHover={{
        scale: 1.02,
        boxShadow: '0 0 30px rgba(0, 245, 255, 0.3)'
      }}
    >
      {/* Hologram effect overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `repeating-linear-gradient(
            90deg,
            transparent,
            transparent 2px,
            ${CYBERPUNK_COLORS.neonBlue} 2px,
            ${CYBERPUNK_COLORS.neonBlue} 4px
          )`
        }}
      />

      {/* Border glow */}
      <div className="absolute inset-0 rounded-lg border border-cyan-400/50 animate-pulse" />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// Data stream effect
export function DataStream() {
  const [streams, setStreams] = useState<Array<{ id: number; left: number; delay: number; chars: string[] }>>([]);

  useEffect(() => {
    const characters = '01abcdefABCDEF</>{}[]();'.split('');
    const newStreams = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      chars: Array.from({ length: 10 }, () => characters[Math.floor(Math.random() * characters.length)])
    }));
    setStreams(newStreams);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20 z-0">
      {streams.map((stream) => (
        <motion.div
          key={stream.id}
          className="absolute top-0 flex flex-col text-green-400 text-xs font-mono"
          style={{ left: `${stream.left}%` }}
          initial={{ y: -100, opacity: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 1, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            delay: stream.delay,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {stream.chars.map((char, i) => (
            <motion.span
              key={i}
              animate={{
                opacity: [1, 0.3, 1],
                color: [CYBERPUNK_COLORS.neonGreen, CYBERPUNK_COLORS.neonBlue, CYBERPUNK_COLORS.neonGreen]
              }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                repeat: Infinity
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

// Glitch text effect
export function GlitchText({
  children,
  className = '',
  intensity = 1
}) {
  return (
    <motion.div className={`relative ${className}`}>
      {/* Main text */}
      <span className="relative z-10">{children}</span>

      {/* Glitch layers */}
      <motion.span
        className="absolute inset-0 text-red-500"
        animate={{
          x: [0, -1 * intensity, 1 * intensity, 0],
          opacity: [0, 0.7, 0]
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 2 + Math.random() * 3
        }}
        style={{ clipPath: 'inset(20% 0 30% 0)' }}
      >
        {children}
      </motion.span>

      <motion.span
        className="absolute inset-0 text-cyan-400"
        animate={{
          x: [0, 1 * intensity, -1 * intensity, 0],
          opacity: [0, 0.7, 0]
        }}
        transition={{
          duration: 0.3,
          repeat: Infinity,
          repeatDelay: 1.5 + Math.random() * 3
        }}
        style={{ clipPath: 'inset(60% 0 10% 0)' }}
      >
        {children}
      </motion.span>
    </motion.div>
  );
}

// Cyberpunk button component
export function CyberpunkButton({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false
}) {
  const variants = {
    primary: {
      bg: 'bg-gradient-to-r from-cyan-500 to-blue-600',
      border: 'border-cyan-400',
      glow: 'shadow-cyan-400/50',
      text: 'text-white'
    },
    secondary: {
      bg: 'bg-gradient-to-r from-purple-500 to-pink-600',
      border: 'border-purple-400',
      glow: 'shadow-purple-400/50',
      text: 'text-white'
    },
    danger: {
      bg: 'bg-gradient-to-r from-red-500 to-pink-600',
      border: 'border-red-400',
      glow: 'shadow-red-400/50',
      text: 'text-white'
    }
  };

  const variantStyles = variants[variant];

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative px-6 py-3 font-semibold rounded-lg border-2
        ${variantStyles.bg} ${variantStyles.border} ${variantStyles.text}
        shadow-lg ${variantStyles.glow}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        transition-all duration-200
        ${className}
      `}
      whileHover={!disabled ? {
        boxShadow: `0 0 25px ${variantStyles.glow.replace('shadow-', '').replace('/50', '')}`
      } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Button glow effect */}
      <div className="absolute inset-0 rounded-lg bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Content */}
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}

// Hook for cyberpunk theme context
export function useCyberpunkTheme() {
  const [glitchMode, setGlitchMode] = useState(false);
  const [neonIntensity, setNeonIntensity] = useState(1);

  const triggerGlitch = () => {
    setGlitchMode(true);
    setTimeout(() => setGlitchMode(false), 1000);
  };

  return {
    glitchMode,
    neonIntensity,
    setNeonIntensity,
    triggerGlitch,
    colors: CYBERPUNK_COLORS,
    gradients: CYBERPUNK_GRADIENTS,
    animations: CYBERPUNK_ANIMATIONS
  };
}