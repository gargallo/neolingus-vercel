'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlayCircle,
  Pause,
  RotateCcw,
  Trophy,
  Target,
  Clock,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Volume2,
  VolumeX
} from 'lucide-react';

import {
  Exercise,
  ExerciseMode,
  Language,
  getRandomExercise,
  calculateScore
} from '@/lib/data/games/maestro-cohesion/exercises';

import { ParticleSystem, useParticleEffects } from './ParticleSystem';
import { ComboCounter } from './ComboCounter';
import { SoundControls } from './SoundControls';
import { PowerUpSystem, PowerUpType, usePowerUps } from './PowerUpSystem';
import { AchievementSystem, Achievement } from './AchievementSystem';
import { useGameAudio } from '@/hooks/useGameAudio';

interface GameEngineProps {
  language: Language;
  level: string;
  mode?: ExerciseMode;
}

interface GameState {
  isPlaying: boolean;
  currentExercise: Exercise | null;
  score: number;
  streak: number;
  combo: number;
  timeLeft: number;
  correctAnswers: number;
  totalAnswers: number;
  feedback: string | null;
  showAnswer: boolean;
  isAnswering: boolean;
  level: number;
  experience: number;
  powerupsUsed: number;
  maxCombo: number;
  maxStreak: number;
  perfectAnswers: number;
  averageResponseTime: number;
  hasShield: boolean;
  hasStreakSave: boolean;
  pointMultiplier: number;
  multiplierAnswersLeft: number;
  showHint: boolean;
  autoAnswer: boolean;
  isVIP: boolean;
  energyBoost: boolean;
}

const GAME_TIME = 180; // 3 minutes per session
const TIME_BONUS_THRESHOLD = 10; // seconds for bonus

// Typewriter effect component for word preview
function TypewriterWord({
  originalWord,
  previewWord,
  showPreview,
  onMouseEnter,
  onMouseLeave,
  className
}: {
  originalWord: string;
  previewWord: string;
  showPreview: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  className: string;
}) {
  // Simple instant replacement - no complex animations to avoid "going crazy"
  const displayText = showPreview && previewWord ? previewWord : originalWord;

  return (
    <span
      className={`${className} transition-all duration-200`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {displayText}
    </span>
  );
}

export default function GameEngine({ language, level, mode = 'substitution' }: GameEngineProps) {
  const [gameState, setGameState] = useState<GameState>({
    isPlaying: false,
    currentExercise: null,
    score: 0,
    streak: 0,
    combo: 0,
    timeLeft: GAME_TIME,
    correctAnswers: 0,
    totalAnswers: 0,
    feedback: null,
    showAnswer: false,
    isAnswering: false,
    level: 1,
    experience: 0
  });

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showSoundControls, setShowSoundControls] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState<number>(0);
  const [responseTimes, setResponseTimes] = useState<number[]>([]);
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [awaitingManualContinue, setAwaitingManualContinue] = useState(false);

  // Animation controls
  const containerControls = useAnimation();
  const questionControls = useAnimation();
  const cardControls = useAnimation();

  // Audio and particle effects
  const { playCorrect, playWrong, playButtonHover, playCombo, playStreak, playLevelUp } = useGameAudio();
  const { triggerCorrect, triggerWrong, triggerCombo, triggerStreak, triggerLevelUp } = useParticleEffects();

  // Power-ups and achievements
  const { activePowerUps, activatePowerUp, deactivatePowerUp, hasPowerUp } = usePowerUps();

  // Refs for particle targeting
  const gameAreaRef = useRef<HTMLDivElement>(null);

  // Power-up handlers
  const handlePowerUpActivated = useCallback((powerUp: any) => {
    const effect = powerUp.effect(gameState);
    setGameState(prev => ({ ...prev, ...effect, powerupsUsed: prev.powerupsUsed + 1 }));
    activatePowerUp(powerUp.type);
  }, [gameState, activatePowerUp]);

  const handlePowerUpExpired = useCallback((powerUpType: PowerUpType) => {
    deactivatePowerUp(powerUpType);

    // Reset power-up effects
    switch (powerUpType) {
      case 'shield':
        setGameState(prev => ({ ...prev, hasShield: false }));
        break;
      case 'point_multiplier':
        setGameState(prev => ({ ...prev, pointMultiplier: 1, multiplierAnswersLeft: 0 }));
        break;
      case 'streak_save':
        setGameState(prev => ({ ...prev, hasStreakSave: false }));
        break;
      case 'crown':
        setGameState(prev => ({
          ...prev,
          isVIP: false,
          pointMultiplier: 1,
          hasShield: false,
          hasStreakSave: false,
          energyBoost: false
        }));
        break;
      case 'energy':
        setGameState(prev => ({ ...prev, energyBoost: false }));
        break;
    }
  }, [deactivatePowerUp]);

  // Achievement handler
  const handleAchievementUnlocked = useCallback((achievement: Achievement) => {
    // Play achievement sound and effects
    playLevelUp();
    triggerLevelUp();

    // Add experience reward
    setGameState(prev => ({
      ...prev,
      experience: prev.experience + achievement.reward.experience
    }));
  }, [playLevelUp, triggerLevelUp]);

  // Get game stats for achievements
  const gameStats = {
    combo: gameState.combo,
    streak: gameState.streak,
    score: gameState.score,
    correctAnswers: gameState.correctAnswers,
    totalAnswers: gameState.totalAnswers,
    timeLeft: gameState.timeLeft,
    powerupsUsed: gameState.powerupsUsed,
    level: gameState.level,
    maxCombo: gameState.maxCombo,
    maxStreak: gameState.maxStreak,
    averageResponseTime: gameState.averageResponseTime,
    perfectAnswers: gameState.perfectAnswers
  };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (gameState.isPlaying && gameState.timeLeft > 0) {
      interval = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (gameState.timeLeft === 0) {
      endGame();
    }

    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.timeLeft]);

  const startGame = () => {
    const exercise = getRandomExercise(mode, language);
    if (!exercise) return;

    setGameState({
      isPlaying: true,
      currentExercise: exercise,
      score: 0,
      streak: 0,
      combo: 0,
      timeLeft: GAME_TIME,
      correctAnswers: 0,
      totalAnswers: 0,
      feedback: null,
      showAnswer: false,
      isAnswering: false,
      level: 1,
      experience: 0,
      powerupsUsed: 0,
      maxCombo: 0,
      maxStreak: 0,
      perfectAnswers: 0,
      averageResponseTime: 0,
      hasShield: false,
      hasStreakSave: false,
      pointMultiplier: 1,
      multiplierAnswersLeft: 0,
      showHint: false,
      autoAnswer: false,
      isVIP: false,
      energyBoost: false
    });
    setAnswerStartTime(Date.now());
    setResponseTimes([]);

    // Start game animation
    containerControls.start({
      scale: [0.95, 1],
      opacity: [0, 1],
      transition: { duration: 0.5, ease: "easeOut" }
    });
    setSelectedAnswer(null);
  };

  const pauseGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const endGame = () => {
    setGameState(prev => ({ ...prev, isPlaying: false }));
  };

  const resetGame = () => {
    setGameState({
      isPlaying: false,
      currentExercise: null,
      score: 0,
      streak: 0,
      combo: 0,
      timeLeft: GAME_TIME,
      correctAnswers: 0,
      totalAnswers: 0,
      feedback: null,
      showAnswer: false,
      isAnswering: false,
      level: 1,
      experience: 0,
      powerupsUsed: 0,
      maxCombo: 0,
      maxStreak: 0,
      perfectAnswers: 0,
      averageResponseTime: 0,
      hasShield: false,
      hasStreakSave: false,
      pointMultiplier: 1,
      multiplierAnswersLeft: 0,
      showHint: false,
      autoAnswer: false,
      isVIP: false,
      energyBoost: false
    });
    setSelectedAnswer(null);
  };

  const submitAnswer = async (answer: string) => {
    if (!gameState.currentExercise || gameState.showAnswer || gameState.isAnswering) return;

    setGameState(prev => ({ ...prev, isAnswering: true }));

    // Calculate response time
    const responseTime = Date.now() - answerStartTime;
    const isPerfectAnswer = responseTime < 3000;

    let isCorrect = answer === gameState.currentExercise.correctAnswer;

    // Check for auto-answer power-up
    if (gameState.autoAnswer) {
      isCorrect = true;
      setGameState(prev => ({ ...prev, autoAnswer: false }));
    }

    // Handle shield protection
    if (!isCorrect && gameState.hasShield) {
      isCorrect = true; // Shield protects from wrong answer
      setGameState(prev => ({ ...prev, hasShield: false }));
    }

    const timeBonus = gameState.timeLeft > GAME_TIME - TIME_BONUS_THRESHOLD ? 5 : 0;

    // Calculate new combo and experience
    let newCombo = isCorrect ? gameState.combo + 1 : 0;
    let newStreak = isCorrect ? gameState.streak + 1 : 0;

    // Handle streak save
    if (!isCorrect && gameState.hasStreakSave) {
      newStreak = gameState.streak; // Save the streak
      setGameState(prev => ({ ...prev, hasStreakSave: false }));
    }

    const comboMultiplier = Math.floor(newCombo / 3) + 1;
    const basePoints = isCorrect ? gameState.currentExercise.points + timeBonus : 0;
    const pointMultiplier = gameState.pointMultiplier;
    const finalPoints = basePoints * comboMultiplier * pointMultiplier;

    const newExperience = gameState.experience + (isCorrect ? 10 + newCombo : 0);
    const newLevel = Math.floor(newExperience / 100) + 1;
    const leveledUp = newLevel > gameState.level;

    // Update response times
    const newResponseTimes = [...responseTimes, responseTime];
    setResponseTimes(newResponseTimes);
    const averageResponseTime = newResponseTimes.reduce((a, b) => a + b, 0) / newResponseTimes.length;

    setGameState(prev => ({
      ...prev,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      totalAnswers: prev.totalAnswers + 1,
      score: prev.score + finalPoints,
      streak: newStreak,
      combo: newCombo,
      level: newLevel,
      experience: newExperience,
      maxCombo: Math.max(prev.maxCombo, newCombo),
      maxStreak: Math.max(prev.maxStreak, newStreak),
      perfectAnswers: prev.perfectAnswers + (isPerfectAnswer && isCorrect ? 1 : 0),
      averageResponseTime,
      multiplierAnswersLeft: pointMultiplier > 1 ? Math.max(0, prev.multiplierAnswersLeft - 1) : 0,
      pointMultiplier: prev.multiplierAnswersLeft <= 1 ? 1 : prev.pointMultiplier,
      feedback: isCorrect
        ? `¡Correcto! ${comboMultiplier > 1 ? `Combo x${comboMultiplier}` : ''} ${pointMultiplier > 1 ? `Multiplicador x${pointMultiplier}` : ''}`
        : `Incorrecto. ${prev.currentExercise!.explanation}`,
      showAnswer: true,
      isAnswering: false
    }));

    setSelectedAnswer(answer);

    // Audio and visual effects
    if (isCorrect) {
      playCorrect();
      triggerCorrect();

      if (newCombo >= 3) {
        playCombo();
        triggerCombo(newCombo);
      }

      if (newStreak >= 5) {
        playStreak();
        triggerStreak(newStreak);
      }

      if (leveledUp) {
        playLevelUp();
        triggerLevelUp();
      }

      // Celebration animation
      cardControls.start({
        scale: [1, 1.05, 1],
        rotateY: [0, 5, -5, 0],
        transition: { duration: 0.6, ease: "easeOut" }
      });
    } else {
      playWrong();
      triggerWrong();

      // Screen shake on wrong answer
      setScreenShake(true);
      setTimeout(() => setScreenShake(false), 500);

      // Error animation
      cardControls.start({
        x: [-10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      });
    }

    // Auto-advance logic - different timing based on correctness
    if (isCorrect) {
      // Quick advance for correct answers
      setTimeout(() => {
        nextExercise();
      }, 2000);
    } else {
      // Manual continue for wrong answers to allow reading explanation
      setAwaitingManualContinue(true);
    }
  };

  const nextExercise = async () => {
    const exercise = getRandomExercise(mode, language);
    if (!exercise) {
      endGame();
      return;
    }

    // Question entrance animation
    await questionControls.start({
      opacity: 0,
      y: 20,
      rotateX: -15,
      transition: { duration: 0.3 }
    });

    setGameState(prev => ({
      ...prev,
      currentExercise: exercise,
      feedback: null,
      showAnswer: false,
      showHint: false
    }));
    setSelectedAnswer(null);
    setAnswerStartTime(Date.now());
    setAwaitingManualContinue(false);
    setHoveredWord(null);

    // Question entrance animation
    questionControls.start({
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getModeTitle = (mode: ExerciseMode) => {
    switch (mode) {
      case 'substitution': return 'Modo Sustitución';
      case 'repair': return 'Modo Reparación';
      case 'classification': return 'Modo Clasificación';
      default: return 'Maestro de Cohesión';
    }
  };

  const getGameOverMessage = () => {
    const percentage = gameState.totalAnswers > 0
      ? Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)
      : 0;

    if (percentage >= 90) return '¡Excelente! Dominio magistral 🏆';
    if (percentage >= 75) return '¡Muy bien! Buen dominio 🎯';
    if (percentage >= 60) return 'Bien. Sigue practicando 📚';
    return 'Necesitas más práctica 💪';
  };

  // Game not started state
  if (!gameState.isPlaying && !gameState.currentExercise) {
    return (
      <div className="relative max-w-4xl mx-auto p-6">
        {/* Particle System */}
        <ParticleSystem className="absolute inset-0" width={800} height={600} />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative text-center space-y-6 z-10"
        >
          {/* Sound Controls Toggle */}
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSoundControls(!showSoundControls)}
              onMouseEnter={playButtonHover}
              className="text-purple-400 hover:text-purple-300"
            >
              {showSoundControls ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
          </div>

          {/* Sound Controls */}
          <AnimatePresence>
            {showSoundControls && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.8 }}
                className="absolute top-12 right-0 z-20"
              >
                <SoundControls />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, rotateX: -30 }}
            animate={{ opacity: 1, rotateX: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundSize: '200% 200%'
              }}
            >
              🎮 Maestro de Cohesión
            </motion.h1>
            <motion.p
              className="text-xl text-slate-300"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {getModeTitle(mode)} - Nivel {level.toUpperCase()}
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, rotateY: -10 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <Card className="max-w-md mx-auto bg-slate-900/80 border-purple-500/30 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-100">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Target className="w-5 h-5 text-cyan-400" />
                  </motion.div>
                  Instrucciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  {mode === 'substitution' && (
                    <p className="text-slate-300">Sustituye los conectores básicos por alternativas más sofisticadas de nivel C1.</p>
                  )}
                  {mode === 'repair' && (
                    <p className="text-slate-300">Identifica y corrige errores en el uso de conectores discursivos.</p>
                  )}
                  {mode === 'classification' && (
                    <p className="text-slate-300">Clasifica los conectores según su función lógica y nivel de formalidad.</p>
                  )}
                </motion.div>

                <motion.div
                  className="flex items-center justify-between text-sm text-purple-300"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    3 minutos
                  </span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-4 h-4" />
                    Combo system
                  </span>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={startGame}
              size="lg"
              className="font-semibold bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white shadow-lg shadow-purple-500/30 border border-purple-400/30"
              onMouseEnter={playButtonHover}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <PlayCircle className="w-5 h-5 mr-2" />
              </motion.div>
              Comenzar Juego
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Game over state
  if (!gameState.isPlaying && gameState.currentExercise) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-6"
        >
          <div className="space-y-2">
            <Trophy className="w-16 h-16 mx-auto text-yellow-500" />
            <h2 className="text-3xl font-bold">¡Juego Terminado!</h2>
            <p className="text-xl text-muted-foreground">{getGameOverMessage()}</p>
          </div>

          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-500">{gameState.score}</div>
                  <div className="text-sm text-muted-foreground">Puntos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">
                    {gameState.totalAnswers > 0
                      ? Math.round((gameState.correctAnswers / gameState.totalAnswers) * 100)
                      : 0}%
                  </div>
                  <div className="text-sm text-muted-foreground">Precisión</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-500">{gameState.correctAnswers}</div>
                  <div className="text-sm text-muted-foreground">Correctas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-500">{gameState.streak}</div>
                  <div className="text-sm text-muted-foreground">Racha Máx.</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 justify-center">
            <Button onClick={startGame} variant="default">
              <PlayCircle className="w-4 h-4 mr-2" />
              Jugar de Nuevo
            </Button>
            <Button onClick={resetGame} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Menú Principal
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Playing state
  return (
    <motion.div
      ref={gameAreaRef}
      className={`relative max-w-6xl mx-auto p-6 space-y-6 ${screenShake ? 'animate-pulse' : ''}`}
      animate={containerControls}
      style={{
        transform: screenShake ? 'translateX(-5px)' : 'translateX(0px)',
        transition: 'transform 0.1s ease-out'
      }}
    >
      {/* Particle System */}
      <ParticleSystem className="absolute inset-0 pointer-events-none" width={1200} height={800} />

      {/* Game Header */}
      <motion.div
        className="flex items-center justify-between relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <motion.h1
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent"
            animate={{
              textShadow: [
                '0 0 0px rgba(147, 51, 234, 0)',
                '0 0 20px rgba(147, 51, 234, 0.5)',
                '0 0 0px rgba(147, 51, 234, 0)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {getModeTitle(mode)}
          </motion.h1>
          <Badge variant="secondary" className="bg-purple-900/50 text-purple-300 border-purple-500/30">
            {level.toUpperCase()}
          </Badge>
          <Badge variant="outline" className="bg-cyan-900/50 text-cyan-300 border-cyan-500/30">
            Nivel {gameState.level}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <SoundControls compact />
          <Button
            onClick={pauseGame}
            variant="outline"
            size="sm"
            onMouseEnter={playButtonHover}
            className="border-purple-500/30 text-purple-300 hover:bg-purple-900/50"
          >
            <Pause className="w-4 h-4" />
          </Button>
          <Button
            onClick={endGame}
            variant="outline"
            size="sm"
            onMouseEnter={playButtonHover}
            className="border-red-500/30 text-red-300 hover:bg-red-900/50"
          >
            Terminar
          </Button>
        </div>
      </motion.div>

      {/* Game Stats */}
      <div className="grid grid-cols-12 gap-4 relative z-10">
        {/* Traditional Stats */}
        <div className="col-span-8 grid grid-cols-4 gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-slate-900/80 border-red-500/30 backdrop-blur-sm">
              <CardContent className="pt-4 text-center">
                <motion.div
                  animate={gameState.timeLeft <= 30 ? {
                    scale: [1, 1.2, 1],
                    color: ['#ef4444', '#fbbf24', '#ef4444']
                  } : {}}
                  transition={{ duration: 1, repeat: gameState.timeLeft <= 30 ? Infinity : 0 }}
                >
                  <Clock className="w-6 h-6 mx-auto mb-2 text-red-400" />
                  <div className="text-2xl font-bold text-white">{formatTime(gameState.timeLeft)}</div>
                </motion.div>
                <div className="text-sm text-slate-400">Tiempo</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-slate-900/80 border-yellow-500/30 backdrop-blur-sm">
              <CardContent className="pt-4 text-center">
                <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <motion.div
                  className="text-2xl font-bold text-white"
                  key={gameState.score}
                  initial={{ scale: 1.2, color: '#fbbf24' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.3 }}
                >
                  {gameState.score}
                </motion.div>
                <div className="text-sm text-slate-400">Puntos</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-slate-900/80 border-green-500/30 backdrop-blur-sm">
              <CardContent className="pt-4 text-center">
                <Target className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold text-white">{gameState.correctAnswers}/{gameState.totalAnswers}</div>
                <div className="text-sm text-slate-400">Correctas</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Card className="bg-slate-900/80 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="pt-4 text-center">
                <div className="text-sm text-purple-300 mb-1">EXP</div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(gameState.experience % 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-lg font-bold text-white">{gameState.experience % 100}/100</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Combo Counter */}
        <div className="col-span-4">
          <ComboCounter
            combo={gameState.combo}
            streak={gameState.streak}
            onComboBreak={() => {
              // Handle combo break effects
              triggerWrong();
            }}
          />
        </div>
      </div>

      {/* Exercise Card */}
      <AnimatePresence mode="wait">
        {gameState.currentExercise && (
          <motion.div
            key={gameState.currentExercise.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="outline">{gameState.currentExercise.category}</Badge>
                    <Badge variant="secondary">{gameState.currentExercise.difficulty}</Badge>
                  </CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {gameState.currentExercise.points} puntos
                  </div>
                </div>
                <p className="text-muted-foreground">{gameState.currentExercise.instruction}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Exercise Content */}
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-lg leading-relaxed">
                    {gameState.currentExercise.content.split(/\[([^\]]+)\]/).map((part, index) => {
                      if (index % 2 === 0) {
                        return part;
                      } else {
                        // This is a bracketed word - add hover preview with typewriter effect
                        const originalWord = part;
                        const showPreview = hoveredOption && !gameState.showAnswer;
                        const showCorrectAnswer = gameState.showAnswer;

                        // When answer is shown, display correct answer; when hovering, show hovered option
                        const displayWord = showCorrectAnswer
                          ? gameState.currentExercise.correctAnswer as string
                          : (showPreview ? hoveredOption : originalWord);

                        return (
                          <TypewriterWord
                            key={index}
                            originalWord={originalWord}
                            previewWord={displayWord || ''}
                            showPreview={showPreview || showCorrectAnswer}
                            onMouseEnter={() => {}}
                            onMouseLeave={() => {}}
                            className={`px-2 py-1 rounded font-semibold transition-all duration-200 ${
                              showCorrectAnswer
                                ? 'bg-green-200 dark:bg-green-900 border-2 border-green-400 text-green-800 dark:text-green-200'
                                : showPreview
                                  ? 'bg-blue-200 dark:bg-blue-900 border-2 border-blue-400 text-blue-800 dark:text-blue-200'
                                  : 'bg-yellow-200 dark:bg-yellow-900 hover:bg-yellow-300 dark:hover:bg-yellow-800 cursor-pointer'
                            }`}
                          />
                        );
                      }
                    })}
                  </p>
                </div>

                {/* Answer Options */}
                {gameState.currentExercise.options && (
                  <motion.div
                    className="grid grid-cols-1 gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ staggerChildren: 0.1, delayChildren: 0.2 }}
                  >
                    {gameState.currentExercise.options.map((option, index) => {
                      const isCorrect = option === gameState.currentExercise!.correctAnswer;
                      const isSelected = selectedAnswer === option;
                      const isWrong = gameState.showAnswer && isSelected && !isCorrect;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20, rotateX: -15 }}
                          animate={{ opacity: 1, x: 0, rotateX: 0 }}
                          transition={{
                            delay: index * 0.1,
                            type: "spring",
                            stiffness: 300,
                            damping: 20
                          }}
                          whileHover={{
                            scale: gameState.showAnswer ? 1 : 1.01
                          }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <Button
                            variant={
                              gameState.showAnswer
                                ? isCorrect
                                  ? "default"
                                  : isWrong
                                    ? "destructive"
                                    : "outline"
                                : isSelected
                                  ? "secondary"
                                  : "outline"
                            }
                            onClick={() => !gameState.showAnswer && !gameState.isAnswering && submitAnswer(option)}
                            disabled={gameState.showAnswer || gameState.isAnswering}
                            onMouseEnter={() => !gameState.showAnswer && setHoveredOption(option)}
                            onMouseLeave={() => setHoveredOption(null)}
                            className={`justify-start h-auto p-4 text-left transition-all duration-300 ${
                              gameState.showAnswer
                                ? isCorrect
                                  ? 'bg-green-900/50 border-green-500/50 text-green-100 shadow-lg shadow-green-500/20'
                                  : isWrong
                                    ? 'bg-red-900/50 border-red-500/50 text-red-100 shadow-lg shadow-red-500/20'
                                    : 'bg-slate-900/50 border-slate-600/30 text-slate-400'
                                : isSelected
                                  ? 'bg-purple-900/50 border-purple-500/50 text-purple-100'
                                  : 'bg-slate-900/30 border-slate-600/30 text-slate-300 hover:bg-slate-800/50 hover:border-purple-500/30'
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <motion.div
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${
                                  gameState.showAnswer && isCorrect
                                    ? 'border-green-400 bg-green-500/20 text-green-300'
                                    : gameState.showAnswer && isWrong
                                      ? 'border-red-400 bg-red-500/20 text-red-300'
                                      : 'border-slate-400 text-slate-300'
                                }`}
                                animate={gameState.showAnswer && isCorrect ? {
                                  scale: [1, 1.2, 1],
                                  rotate: [0, 360]
                                } : {}}
                                transition={{ duration: 0.6 }}
                              >
                                {String.fromCharCode(65 + index)}
                              </motion.div>
                              <span className="flex-1">{option}</span>
                              <AnimatePresence>
                                {gameState.showAnswer && isCorrect && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 180 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                  </motion.div>
                                )}
                                {gameState.showAnswer && isWrong && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                  >
                                    <XCircle className="w-5 h-5 text-red-400" />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </Button>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Feedback */}
                <AnimatePresence>
                  {gameState.feedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 rounded-lg ${
                        gameState.feedback.includes('Correcto')
                          ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                          : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      }`}
                    >
                      <p className="font-medium">{gameState.feedback}</p>
                      {gameState.showAnswer && (
                        <div className="mt-2 text-sm opacity-80">
                          <strong>Explicación:</strong> {gameState.currentExercise.explanation}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                  {/* Next Button - Different behavior for correct vs wrong answers */}
                  <AnimatePresence>
                    {gameState.showAnswer && awaitingManualContinue && (
                      <motion.div
                        className="flex flex-col items-center pt-4 space-y-3"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
                      >
                        <p className="text-sm text-muted-foreground text-center">
                          Tómate tu tiempo para leer la explicación
                        </p>
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <Button
                            onClick={nextExercise}
                            onMouseEnter={playButtonHover}
                            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg shadow-orange-500/30 border border-orange-400/30"
                          >
                            Continuar
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </motion.div>
                      </motion.div>
                    )}
                    {gameState.showAnswer && !awaitingManualContinue && (
                      <motion.div
                        className="flex justify-center pt-4"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: 1, type: "spring", stiffness: 300 }}
                      >
                        <div className="text-center">
                          <div className="text-sm text-green-600 dark:text-green-400 mb-2">
                            ¡Correcto! Avanzando automáticamente...
                          </div>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="inline-block"
                          >
                            <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full"></div>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Power-up System */}
      {gameState.isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <PowerUpSystem
            combo={gameState.combo}
            streak={gameState.streak}
            score={gameState.score}
            onPowerUpActivated={handlePowerUpActivated}
            onPowerUpExpired={handlePowerUpExpired}
          />
        </motion.div>
      )}

      {/* Achievement System */}
      <AchievementSystem
        gameStats={gameStats}
        onAchievementUnlocked={handleAchievementUnlocked}
      />
    </motion.div>
  );
}