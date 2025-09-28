'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Particle types and configurations
export type ParticleType =
  | 'sparkles'
  | 'confetti'
  | 'explosion'
  | 'energy_rings'
  | 'glitch'
  | 'combo_trail'
  | 'streak_fire'
  | 'level_up_burst';

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: ParticleType;
  angle: number;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleEffect {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  particles: Particle[];
  duration: number;
  startTime: number;
}

interface ParticleSystemProps {
  className?: string;
  width?: number;
  height?: number;
}

// Particle configurations
const PARTICLE_CONFIGS = {
  sparkles: {
    count: 30,
    colors: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
    minLife: 800,
    maxLife: 1500,
    minSize: 2,
    maxSize: 6,
    physics: 'floating'
  },
  confetti: {
    count: 60,
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e'],
    minLife: 2000,
    maxLife: 4000,
    minSize: 4,
    maxSize: 8,
    physics: 'gravity'
  },
  explosion: {
    count: 40,
    colors: ['#ef4444', '#f87171', '#fca5a5'],
    minLife: 600,
    maxLife: 1200,
    minSize: 3,
    maxSize: 7,
    physics: 'explosion'
  },
  energy_rings: {
    count: 20,
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    minLife: 1500,
    maxLife: 3000,
    minSize: 6,
    maxSize: 12,
    physics: 'orbital'
  },
  glitch: {
    count: 15,
    colors: ['#ef4444', '#f87171', '#dc2626'],
    minLife: 300,
    maxLife: 800,
    minSize: 4,
    maxSize: 8,
    physics: 'scatter'
  },
  combo_trail: {
    count: 25,
    colors: ['#06b6d4', '#67e8f9', '#a5f3fc'],
    minLife: 1000,
    maxLife: 2000,
    minSize: 3,
    maxSize: 6,
    physics: 'trail'
  },
  streak_fire: {
    count: 35,
    colors: ['#f97316', '#fb923c', '#fdba74'],
    minLife: 800,
    maxLife: 1600,
    minSize: 4,
    maxSize: 8,
    physics: 'fire'
  },
  level_up_burst: {
    count: 100,
    colors: ['#fbbf24', '#f59e0b', '#d97706', '#92400e', '#8b5cf6', '#a78bfa'],
    minLife: 3000,
    maxLife: 5000,
    minSize: 6,
    maxSize: 12,
    physics: 'burst'
  }
} as const;

export function ParticleSystem({ className = '', width = 800, height = 600 }: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const effectsRef = useRef<ParticleEffect[]>([]);
  const pendingEffectsRef = useRef<{ type: ParticleType; x: number; y: number }[]>([]);
  const [effects, setEffects] = useState<ParticleEffect[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    effectsRef.current = effects;
  }, [effects]);

  // Process pending effects
  useEffect(() => {
    if (pendingEffectsRef.current.length > 0) {
      const toProcess = [...pendingEffectsRef.current];
      pendingEffectsRef.current = [];

      toProcess.forEach(({ type, x, y }) => {
        const particles = createParticles(type, x, y);
        const effect: ParticleEffect = {
          id: `effect-${Date.now()}-${Math.random()}`,
          type,
          x,
          y,
          particles,
          duration: Math.max(...particles.map(p => p.maxLife)),
          startTime: Date.now()
        };

        setEffects(prev => [...prev, effect]);

        // Auto-remove effect after duration
        setTimeout(() => {
          setEffects(prev => prev.filter(e => e.id !== effect.id));
        }, effect.duration + 1000);
      });
    }
  });

  // Create particles for an effect
  const createParticles = useCallback((type: ParticleType, x: number, y: number): Particle[] => {
    const config = PARTICLE_CONFIGS[type];
    const particles: Particle[] = [];

    for (let i = 0; i < config.count; i++) {
      const angle = (Math.PI * 2 * i) / config.count + (Math.random() - 0.5) * 0.5;
      const speed = 2 + Math.random() * 4;
      const life = config.minLife + Math.random() * (config.maxLife - config.minLife);
      const size = config.minSize + Math.random() * (config.maxSize - config.minSize);
      const color = config.colors[Math.floor(Math.random() * config.colors.length)];

      let vx = 0, vy = 0;

      // Apply physics based on type
      switch (config.physics) {
        case 'floating':
          vx = (Math.random() - 0.5) * 2;
          vy = -Math.random() * 2 - 1;
          break;
        case 'gravity':
          vx = (Math.random() - 0.5) * 6;
          vy = -Math.random() * 8 - 2;
          break;
        case 'explosion':
          vx = Math.cos(angle) * speed * 2;
          vy = Math.sin(angle) * speed * 2;
          break;
        case 'orbital':
          const radius = 20 + Math.random() * 40;
          vx = Math.cos(angle) * speed * 0.5;
          vy = Math.sin(angle) * speed * 0.5;
          break;
        case 'scatter':
          vx = (Math.random() - 0.5) * 8;
          vy = (Math.random() - 0.5) * 8;
          break;
        case 'trail':
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed * 0.5;
          break;
        case 'fire':
          vx = (Math.random() - 0.5) * 2;
          vy = -Math.random() * 4 - 2;
          break;
        case 'burst':
          vx = Math.cos(angle) * speed * 3;
          vy = Math.sin(angle) * speed * 3;
          break;
      }

      particles.push({
        id: `${type}-${i}-${Date.now()}`,
        x,
        y,
        vx,
        vy,
        life,
        maxLife: life,
        size,
        color,
        type,
        angle,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    return particles;
  }, []);

  // Add new particle effect (deferred to avoid setState during render)
  const addEffect = useCallback((type: ParticleType, x: number, y: number) => {
    pendingEffectsRef.current.push({ type, x, y });
    // Trigger useEffect to process pending effects
    setEffects(prev => [...prev]); // Force re-render to trigger useEffect
  }, []);

  // Update particles
  const updateParticles = useCallback((deltaTime: number) => {
    setEffects(prev => prev.map(effect => ({
      ...effect,
      particles: effect.particles
        .map(particle => {
          // Update position
          const newX = particle.x + particle.vx * deltaTime * 0.016;
          const newY = particle.y + particle.vy * deltaTime * 0.016;

          // Apply physics
          let newVx = particle.vx;
          let newVy = particle.vy;

          const config = PARTICLE_CONFIGS[particle.type];

          switch (config.physics) {
            case 'gravity':
            case 'fire':
              newVy += 0.2; // Gravity
              break;
            case 'floating':
              newVy += Math.sin(Date.now() * 0.001 + particle.angle) * 0.1;
              break;
            case 'explosion':
            case 'burst':
              newVx *= 0.98; // Friction
              newVy *= 0.98;
              break;
            case 'orbital':
              // Circular motion
              const centerX = effect.x;
              const centerY = effect.y;
              const angle = Math.atan2(newY - centerY, newX - centerX) + 0.02;
              const radius = Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2);
              const targetX = centerX + Math.cos(angle) * radius;
              const targetY = centerY + Math.sin(angle) * radius;
              newVx = (targetX - particle.x) * 0.1;
              newVy = (targetY - particle.y) * 0.1;
              break;
          }

          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            life: particle.life - deltaTime,
            rotation: particle.rotation + particle.rotationSpeed * deltaTime * 0.016
          };
        })
        .filter(particle => particle.life > 0)
    })).filter(effect => effect.particles.length > 0));
  }, []);

  // Canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = Date.now();

    const animate = () => {
      const currentTime = Date.now();
      const deltaTime = currentTime - lastTime;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Update particles inline to avoid dependency issues (throttled to 60fps)
      if (deltaTime > 16) { // ~60fps throttling
        lastTime = currentTime;
        setEffects(prev => prev.map(effect => ({
        ...effect,
        particles: effect.particles
          .map(particle => {
            // Update position
            const newX = particle.x + particle.vx * deltaTime * 0.016;
            const newY = particle.y + particle.vy * deltaTime * 0.016;

            // Apply physics
            let newVx = particle.vx;
            let newVy = particle.vy;

            const config = PARTICLE_CONFIGS[particle.type];

            switch (config.physics) {
              case 'gravity':
              case 'fire':
                newVy += 0.2; // Gravity
                break;
              case 'floating':
                newVy += Math.sin(Date.now() * 0.001 + particle.angle) * 0.1;
                break;
              case 'explosion':
              case 'burst':
                newVx *= 0.98; // Friction
                newVy *= 0.98;
                break;
              case 'orbital':
                // Circular motion
                const centerX = effect.x;
                const centerY = effect.y;
                const angle = Math.atan2(newY - centerY, newX - centerX) + 0.02;
                const radius = Math.sqrt((newX - centerX) ** 2 + (newY - centerY) ** 2);
                const targetX = centerX + Math.cos(angle) * radius;
                const targetY = centerY + Math.sin(angle) * radius;
                newVx = (targetX - particle.x) * 0.1;
                newVy = (targetY - particle.y) * 0.1;
                break;
            }

            // Update life
            const newLife = particle.life - deltaTime * 0.016;

            return {
              ...particle,
              x: newX,
              y: newY,
              vx: newVx,
              vy: newVy,
              life: newLife,
              rotation: particle.rotation + particle.rotationSpeed * deltaTime * 0.016
            };
          })
          .filter(particle => particle.life > 0)
      })).filter(effect => effect.particles.length > 0));
      }

      // Draw particles
      effectsRef.current.forEach(effect => {
        effect.particles.forEach(particle => {
          const alpha = particle.life / particle.maxLife;

          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.rotation);
          ctx.globalAlpha = alpha;

          // Draw particle based on type
          switch (particle.type) {
            case 'sparkles':
              ctx.fillStyle = particle.color;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
              ctx.fill();
              break;

            case 'confetti':
              ctx.fillStyle = particle.color;
              ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size/3);
              break;

            case 'explosion':
            case 'glitch':
              ctx.fillStyle = particle.color;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 5;
              ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
              break;

            case 'energy_rings':
              ctx.strokeStyle = particle.color;
              ctx.lineWidth = 2;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 15;
              ctx.beginPath();
              ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
              ctx.stroke();
              break;

            case 'combo_trail':
            case 'streak_fire':
              ctx.fillStyle = particle.color;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(0, 0, particle.size * alpha, 0, Math.PI * 2);
              ctx.fill();
              break;

            case 'level_up_burst':
              ctx.fillStyle = particle.color;
              ctx.shadowColor = particle.color;
              ctx.shadowBlur = 20;

              // Draw star shape
              const spikes = 5;
              const outerRadius = particle.size;
              const innerRadius = particle.size * 0.5;

              ctx.beginPath();
              for (let i = 0; i < spikes * 2; i++) {
                const angle = (i * Math.PI) / spikes;
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
              }
              ctx.closePath();
              ctx.fill();
              break;
          }

          ctx.restore();
        });
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height]);

  // Expose methods for triggering effects
  const triggerEffect = useCallback(addEffect, [addEffect]);

  // Effect trigger functions for specific game events
  const celebrateCorrect = useCallback((x?: number, y?: number) => {
    triggerEffect('sparkles', x ?? width / 2, y ?? height / 2);
  }, [triggerEffect, width, height]);

  const showWrongAnswer = useCallback((x?: number, y?: number) => {
    triggerEffect('glitch', x ?? width / 2, y ?? height / 2);
  }, [triggerEffect, width, height]);

  const showCombo = useCallback((level: number, x?: number, y?: number) => {
    if (level >= 3) triggerEffect('combo_trail', x ?? width / 2, y ?? height / 2);
    if (level >= 5) triggerEffect('energy_rings', x ?? width / 2, y ?? height / 2);
    if (level >= 10) triggerEffect('explosion', x ?? width / 2, y ?? height / 2);
  }, [triggerEffect, width, height]);

  const showStreak = useCallback((level: number, x?: number, y?: number) => {
    if (level >= 5) triggerEffect('streak_fire', x ?? width / 2, y ?? height / 2);
  }, [triggerEffect, width, height]);

  const celebrateLevelUp = useCallback((x?: number, y?: number) => {
    triggerEffect('level_up_burst', x ?? width / 2, y ?? height / 2);
    setTimeout(() => triggerEffect('confetti', x ?? width / 2, y ?? height / 2 - 50), 500);
  }, [triggerEffect, width, height]);

  // Expose methods to window for global access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).gameParticles = {
        celebrateCorrect,
        showWrongAnswer,
        showCombo,
        showStreak,
        celebrateLevelUp,
        triggerEffect
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).gameParticles;
      }
    };
  }, [celebrateCorrect, showWrongAnswer, showCombo, showStreak, celebrateLevelUp, triggerEffect]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute inset-0 pointer-events-none z-10"
        style={{ width: '100%', height: '100%' }}
      />

    </div>
  );
}

// Hook for easier use in game components
export function useParticleEffects() {
  const triggerCorrect = useCallback((x?: number, y?: number) => {
    if (typeof window !== 'undefined' && (window as any).gameParticles) {
      (window as any).gameParticles.celebrateCorrect(x, y);
    }
  }, []);

  const triggerWrong = useCallback((x?: number, y?: number) => {
    if (typeof window !== 'undefined' && (window as any).gameParticles) {
      (window as any).gameParticles.showWrongAnswer(x, y);
    }
  }, []);

  const triggerCombo = useCallback((level: number, x?: number, y?: number) => {
    if (typeof window !== 'undefined' && (window as any).gameParticles) {
      (window as any).gameParticles.showCombo(level, x, y);
    }
  }, []);

  const triggerStreak = useCallback((level: number, x?: number, y?: number) => {
    if (typeof window !== 'undefined' && (window as any).gameParticles) {
      (window as any).gameParticles.showStreak(level, x, y);
    }
  }, []);

  const triggerLevelUp = useCallback((x?: number, y?: number) => {
    if (typeof window !== 'undefined' && (window as any).gameParticles) {
      (window as any).gameParticles.celebrateLevelUp(x, y);
    }
  }, []);

  return {
    triggerCorrect,
    triggerWrong,
    triggerCombo,
    triggerStreak,
    triggerLevelUp
  };
}