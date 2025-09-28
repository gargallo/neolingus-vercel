'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import {
  Volume2,
  VolumeX,
  Music,
  Music2,
  Headphones,
  Settings
} from 'lucide-react';
import { useGameAudio } from '@/hooks/useGameAudio';
import { useState } from 'react';

interface SoundControlsProps {
  className?: string;
  compact?: boolean;
}

export function SoundControls({ className = '', compact = false }: SoundControlsProps) {
  const {
    config,
    isLoaded,
    toggleMute,
    setVolume,
    toggleMusic,
    toggleSFX,
    playButtonHover,
    playCorrect
  } = useGameAudio();

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0] / 100);
  };

  const handleTestSound = () => {
    playCorrect();
  };

  if (compact) {
    return (
      <motion.div
        className={`flex items-center gap-2 ${className}`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Mute Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMute}
          onMouseEnter={playButtonHover}
          className="relative group"
          title={config.muted ? 'Unmute' : 'Mute'}
        >
          <motion.div
            initial={false}
            animate={{
              scale: config.muted ? 0.8 : 1,
              rotate: config.muted ? -15 : 0
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            {config.muted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-green-400" />
            )}
          </motion.div>

          {/* Pulse effect when unmuted */}
          {!config.muted && (
            <motion.div
              className="absolute inset-0 rounded-full bg-green-400/20"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </Button>

        {/* Volume Slider */}
        {!config.muted && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 80, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center"
          >
            <Slider
              value={[config.volume * 100]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              className="w-20"
            />
          </motion.div>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm">
        <CardContent className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Headphones className="w-5 h-5 text-purple-400" />
              <span className="font-semibold text-white">Audio Settings</span>
              {!isLoaded && (
                <motion.div
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  title="Loading audio..."
                />
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-purple-400 hover:text-purple-300"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>

          {/* Master Controls */}
          <div className="grid grid-cols-2 gap-3">
            {/* Mute Button */}
            <Button
              variant={config.muted ? "destructive" : "default"}
              onClick={toggleMute}
              onMouseEnter={playButtonHover}
              className="relative group"
            >
              <motion.div
                animate={{
                  scale: config.muted ? 0.9 : 1,
                  rotate: config.muted ? -10 : 0
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {config.muted ? (
                  <VolumeX className="w-4 h-4 mr-2" />
                ) : (
                  <Volume2 className="w-4 h-4 mr-2" />
                )}
              </motion.div>
              {config.muted ? 'Unmute' : 'Mute'}

              {/* Sound waves animation */}
              {!config.muted && (
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 bg-green-400 rounded-full"
                      style={{
                        right: i * 3,
                        height: `${8 + i * 4}px`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                      animate={{
                        scaleY: [0.5, 1, 0.5],
                        opacity: [0.3, 1, 0.3]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </div>
              )}
            </Button>

            {/* Test Sound Button */}
            <Button
              variant="outline"
              onClick={handleTestSound}
              onMouseEnter={playButtonHover}
              disabled={config.muted || !config.sfxEnabled}
              className="border-green-500/30 hover:border-green-400 text-green-400 hover:text-green-300"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.1 }}
              >
                🔊
              </motion.div>
              Test
            </Button>
          </div>

          {/* Volume Slider */}
          {!config.muted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-purple-300">Volume</span>
                <span className="text-white font-mono">
                  {Math.round(config.volume * 100)}%
                </span>
              </div>

              <div className="relative">
                <Slider
                  value={[config.volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={5}
                  className="w-full"
                />

                {/* Volume level indicators */}
                <div className="absolute top-6 left-0 right-0 flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Advanced Controls */}
          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3 pt-3 border-t border-purple-500/20"
            >
              {/* Music Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-white">Background Music</span>
                </div>
                <Button
                  variant={config.musicEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleMusic}
                  onMouseEnter={playButtonHover}
                  className="h-8"
                >
                  {config.musicEnabled ? (
                    <Music2 className="w-3 h-3" />
                  ) : (
                    <Music className="w-3 h-3" />
                  )}
                </Button>
              </div>

              {/* SFX Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-orange-400" />
                  <span className="text-sm text-white">Sound Effects</span>
                </div>
                <Button
                  variant={config.sfxEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSFX}
                  onMouseEnter={playButtonHover}
                  className="h-8"
                >
                  {config.sfxEnabled ? '🔊' : '🔇'}
                </Button>
              </div>

              {/* Audio Status */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Audio Status:</span>
                <div className="flex items-center gap-1">
                  <motion.div
                    className={`w-2 h-2 rounded-full ${
                      isLoaded ? 'bg-green-400' : 'bg-yellow-400'
                    }`}
                    animate={{ opacity: isLoaded ? 1 : [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: isLoaded ? 0 : Infinity }}
                  />
                  <span className={isLoaded ? 'text-green-400' : 'text-yellow-400'}>
                    {isLoaded ? 'Ready' : 'Loading...'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}