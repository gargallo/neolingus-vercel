'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// Audio configuration types
interface AudioConfig {
  volume: number;
  muted: boolean;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

interface GameSounds {
  correct: string;
  wrong: string;
  combo: string[];
  streak: string[];
  timeWarning: string;
  levelUp: string;
  powerUp: string;
  buttonHover: string;
  cardFlip: string;
  backgroundMusic: string;
}

// Default audio configuration
const defaultConfig: AudioConfig = {
  volume: 0.7,
  muted: false,
  musicEnabled: true,
  sfxEnabled: true
};

// Audio configuration for Web Audio API sounds
const gameSounds: GameSounds = {
  correct: 'correct',
  wrong: 'wrong',
  combo: ['combo-1', 'combo-2', 'combo-3', 'combo-4', 'combo-5'],
  streak: ['streak-1', 'streak-2', 'streak-3'],
  timeWarning: 'timeWarning',
  levelUp: 'levelUp',
  powerUp: 'powerUp',
  buttonHover: 'buttonHover',
  cardFlip: 'cardFlip',
  backgroundMusic: 'backgroundMusic'
};

// Web Audio API sound generation utilities
const generateTone = (
  context: AudioContext,
  frequency: number,
  duration: number,
  volume: number = 0.3,
  type: OscillatorType = 'sine'
) => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = type;

  gainNode.gain.setValueAtTime(volume, context.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration);

  oscillator.start();
  oscillator.stop(context.currentTime + duration);
};

export function useGameAudio() {
  const [config, setConfig] = useState<AudioConfig>(defaultConfig);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context and generate sounds
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load saved config from localStorage
    const savedConfig = localStorage.getItem('gameAudioConfig');
    if (savedConfig) {
      try {
        setConfig(JSON.parse(savedConfig));
      } catch (error) {
        console.warn('Failed to load audio config from localStorage');
      }
    }

    // Initialize Web Audio API
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('Web Audio API not supported');
    }

    // Generate audio sounds
    const generateAudioSounds = () => {
      if (!audioContextRef.current) return;

      // Generate all sound effects
      createGameSounds();
      setIsLoaded(true);
    };

    generateAudioSounds();

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Create game sounds using Web Audio API
  const createGameSounds = useCallback(() => {
    if (!audioContextRef.current) return;

    const createSoundEffect = (soundKey: string, generator: (volume: number) => void) => {
      audioRefs.current.set(soundKey, {
        play: (currentConfig?: typeof config) => {
          // Use passed config or fallback to current config
          const activeConfig = currentConfig || config;

          // Check muted state first
          if (activeConfig.muted) return;

          // For background music, check musicEnabled
          if (soundKey === 'backgroundMusic' && !activeConfig.musicEnabled) return;

          // For other sounds, check sfxEnabled
          if (soundKey !== 'backgroundMusic' && !activeConfig.sfxEnabled) return;

          if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
          }

          // Pass current volume to generator function
          const currentVolume = activeConfig.volume;
          generator(currentVolume);
        },
        volume: config.volume,
        currentTime: 0
      } as any);
    };

    // Correct answer sound - ascending notes
    createSoundEffect('correct', (currentVolume) => {
      const frequencies = [523, 659, 784]; // C5, E5, G5
      frequencies.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContextRef.current!.createOscillator();
          const gain = audioContextRef.current!.createGain();

          osc.connect(gain);
          gain.connect(audioContextRef.current!.destination);

          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(currentVolume * 0.3, audioContextRef.current!.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.2);

          osc.start();
          osc.stop(audioContextRef.current!.currentTime + 0.2);
        }, index * 50);
      });
    });

    // Wrong answer sound - descending buzz
    createSoundEffect('wrong', (currentVolume) => {
      const osc = audioContextRef.current!.createOscillator();
      const gain = audioContextRef.current!.createGain();

      osc.connect(gain);
      gain.connect(audioContextRef.current!.destination);

      osc.frequency.value = 200;
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(currentVolume * 0.4, audioContextRef.current!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.4);

      // Add frequency modulation for buzzing effect
      const lfo = audioContextRef.current!.createOscillator();
      const lfoGain = audioContextRef.current!.createGain();
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.frequency.value = 10;
      lfoGain.gain.value = 20;

      osc.start();
      lfo.start();
      osc.stop(audioContextRef.current!.currentTime + 0.4);
      lfo.stop(audioContextRef.current!.currentTime + 0.4);
    });

    // Combo sounds - increasing pitch excitement
    [1, 2, 3, 4, 5].forEach((level) => {
      createSoundEffect(`combo-${level - 1}`, (currentVolume) => {
        const baseFreq = 400 + (level * 100);
        const osc = audioContextRef.current!.createOscillator();
        const gain = audioContextRef.current!.createGain();

        osc.connect(gain);
        gain.connect(audioContextRef.current!.destination);

        osc.frequency.value = baseFreq;
        osc.type = 'square';
        gain.gain.setValueAtTime(currentVolume * 0.3, audioContextRef.current!.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.15);

        osc.start();
        osc.stop(audioContextRef.current!.currentTime + 0.15);
      });
    });

    // Streak sounds - triumphant arpeggios
    [1, 2, 3].forEach((level) => {
      createSoundEffect(`streak-${level - 1}`, (currentVolume) => {
        const baseFreq = 523; // C5
        const notes = [1, 1.25, 1.5, 2]; // Major chord progression
        notes.forEach((multiplier, index) => {
          setTimeout(() => {
            const osc = audioContextRef.current!.createOscillator();
            const gain = audioContextRef.current!.createGain();

            osc.connect(gain);
            gain.connect(audioContextRef.current!.destination);

            osc.frequency.value = baseFreq * multiplier * (1 + level * 0.2);
            osc.type = 'triangle';
            gain.gain.setValueAtTime(currentVolume * 0.2, audioContextRef.current!.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.3);

            osc.start();
            osc.stop(audioContextRef.current!.currentTime + 0.3);
          }, index * 60);
        });
      });
    });

    // Time warning - urgent beeping
    createSoundEffect('timeWarning', (currentVolume) => {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const osc = audioContextRef.current!.createOscillator();
          const gain = audioContextRef.current!.createGain();

          osc.connect(gain);
          gain.connect(audioContextRef.current!.destination);

          osc.frequency.value = 880; // High A
          osc.type = 'sine';
          gain.gain.setValueAtTime(currentVolume * 0.4, audioContextRef.current!.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.1);

          osc.start();
          osc.stop(audioContextRef.current!.currentTime + 0.1);
        }, i * 150);
      }
    });

    // Level up - fanfare
    createSoundEffect('levelUp', (currentVolume) => {
      const fanfare = [523, 659, 784, 1047]; // C5, E5, G5, C6
      fanfare.forEach((freq, index) => {
        setTimeout(() => {
          const osc = audioContextRef.current!.createOscillator();
          const gain = audioContextRef.current!.createGain();

          osc.connect(gain);
          gain.connect(audioContextRef.current!.destination);

          osc.frequency.value = freq;
          osc.type = 'triangle';
          gain.gain.setValueAtTime(currentVolume * 0.3, audioContextRef.current!.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.4);

          osc.start();
          osc.stop(audioContextRef.current!.currentTime + 0.4);
        }, index * 100);
      });
    });

    // Power up - rising sweep
    createSoundEffect('powerUp', (currentVolume) => {
      const osc = audioContextRef.current!.createOscillator();
      const gain = audioContextRef.current!.createGain();

      osc.connect(gain);
      gain.connect(audioContextRef.current!.destination);

      osc.frequency.setValueAtTime(200, audioContextRef.current!.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, audioContextRef.current!.currentTime + 0.5);
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(currentVolume * 0.2, audioContextRef.current!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.5);

      osc.start();
      osc.stop(audioContextRef.current!.currentTime + 0.5);
    });

    // Button hover - subtle click
    createSoundEffect('buttonHover', (currentVolume) => {
      const osc = audioContextRef.current!.createOscillator();
      const gain = audioContextRef.current!.createGain();

      osc.connect(gain);
      gain.connect(audioContextRef.current!.destination);

      osc.frequency.value = 800;
      osc.type = 'sine';
      gain.gain.setValueAtTime(currentVolume * 0.1, audioContextRef.current!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.05);

      osc.start();
      osc.stop(audioContextRef.current!.currentTime + 0.05);
    });

    // Card flip - quick snap
    createSoundEffect('cardFlip', (currentVolume) => {
      const osc = audioContextRef.current!.createOscillator();
      const gain = audioContextRef.current!.createGain();

      osc.connect(gain);
      gain.connect(audioContextRef.current!.destination);

      osc.frequency.value = 1200;
      osc.type = 'square';
      gain.gain.setValueAtTime(currentVolume * 0.15, audioContextRef.current!.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current!.currentTime + 0.08);

      osc.start();
      osc.stop(audioContextRef.current!.currentTime + 0.08);
    });

    // Background music - ambient drone
    createSoundEffect('backgroundMusic', (currentVolume) => {
      // Music enabled check is now handled in the play function
      const createAmbientTone = (freq: number, delay: number) => {
        setTimeout(() => {
          const osc = audioContextRef.current!.createOscillator();
          const gain = audioContextRef.current!.createGain();

          osc.connect(gain);
          gain.connect(audioContextRef.current!.destination);

          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0, audioContextRef.current!.currentTime);
          gain.gain.linearRampToValueAtTime(currentVolume * 0.08, audioContextRef.current!.currentTime + 2);
          gain.gain.setValueAtTime(currentVolume * 0.08, audioContextRef.current!.currentTime + 10);
          gain.gain.linearRampToValueAtTime(0, audioContextRef.current!.currentTime + 12);

          osc.start();
          osc.stop(audioContextRef.current!.currentTime + 12);
        }, delay);
      };

      // Create layered ambient tones
      createAmbientTone(110, 0);    // A2
      createAmbientTone(165, 1000); // E3
      createAmbientTone(220, 2000); // A3
    });
  }, [config.volume, config.musicEnabled, config.muted, config.sfxEnabled]);

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('gameAudioConfig', JSON.stringify(config));
  }, [config]);

  // No need to recreate sounds when config changes - they now use current config in real-time

  // Play sound function
  const playSound = useCallback((soundKey: string, index?: number) => {
    if (!config.sfxEnabled || config.muted || !isLoaded) return;

    try {
      const key = index !== undefined ? `${soundKey}-${index}` : soundKey;
      const audio = audioRefs.current.get(key);

      if (audio && typeof audio.play === 'function') {
        // Pass current config to the play function
        audio.play(config);
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }, [config, isLoaded]);

  // Specific sound functions
  const playCorrect = useCallback(() => playSound('correct'), [playSound]);

  const playWrong = useCallback(() => playSound('wrong'), [playSound]);

  const playCombo = useCallback((level: number) => {
    const index = Math.min(level - 1, gameSounds.combo.length - 1);
    playSound('combo', index);
  }, [playSound]);

  const playStreak = useCallback((level: number) => {
    const index = Math.min(Math.floor(level / 3), gameSounds.streak.length - 1);
    playSound('streak', index);
  }, [playSound]);

  const playTimeWarning = useCallback(() => playSound('timeWarning'), [playSound]);

  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound]);

  const playPowerUp = useCallback(() => playSound('powerUp'), [playSound]);

  const playButtonHover = useCallback(() => playSound('buttonHover'), [playSound]);

  const playCardFlip = useCallback(() => playSound('cardFlip'), [playSound]);

  // Background music control
  const startMusic = useCallback(() => {
    if (!config.musicEnabled || config.muted || !isLoaded) return;

    const backgroundMusicAudio = audioRefs.current.get('backgroundMusic');
    if (backgroundMusicAudio && typeof backgroundMusicAudio.play === 'function') {
      backgroundMusicAudio.play(config);
    }
  }, [config, isLoaded]);

  const stopMusic = useCallback(() => {
    // For Web Audio API, background music naturally stops after its duration
    // No persistent playback to stop
  }, []);

  const pauseMusic = useCallback(() => {
    // For Web Audio API, we can't pause/resume individual oscillators
    // This is a limitation of the current implementation
  }, []);

  const resumeMusic = useCallback(() => {
    startMusic();
  }, [startMusic]);

  // Configuration functions
  const toggleMute = useCallback(() => {
    setConfig(prev => ({ ...prev, muted: !prev.muted }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setConfig(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  }, []);

  const toggleMusic = useCallback(() => {
    setConfig(prev => ({ ...prev, musicEnabled: !prev.musicEnabled }));
  }, []);

  const toggleSFX = useCallback(() => {
    setConfig(prev => ({ ...prev, sfxEnabled: !prev.sfxEnabled }));
  }, []);

  return {
    // Configuration
    config,
    isLoaded,

    // Sound effects
    playCorrect,
    playWrong,
    playCombo,
    playStreak,
    playTimeWarning,
    playLevelUp,
    playPowerUp,
    playButtonHover,
    playCardFlip,

    // Background music
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,

    // Controls
    toggleMute,
    setVolume,
    toggleMusic,
    toggleSFX
  };
}