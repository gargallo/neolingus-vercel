'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RotateCcw,
  Shuffle,
  Target,
  Wrench,
  BarChart3,
  PlayCircle,
  ArrowLeft,
  Settings,
  Trophy,
  Clock,
  Gamepad2
} from 'lucide-react';

import GameEngine from './game-engine';
import { ExerciseMode, Language } from '@/lib/data/games/maestro-cohesion/exercises';

interface MaestroCohesionGameProps {
  language: Language;
  level: string;
  mode?: ExerciseMode;
}

type GameView = 'menu' | 'playing' | 'stats';

export default function MaestroCohesionGame({
  language,
  level,
  mode: initialMode = 'substitution'
}: MaestroCohesionGameProps) {
  const [currentView, setCurrentView] = useState<GameView>('menu');
  const [selectedMode, setSelectedMode] = useState<ExerciseMode>(initialMode);

  const getLanguageLabel = (lang: Language) => {
    switch (lang) {
      case 'en': return 'English';
      case 'es': return 'Español';
      case 'val': return 'Valencià';
      default: return 'Unknown';
    }
  };

  const getModeConfig = (mode: ExerciseMode) => {
    switch (mode) {
      case 'substitution':
        return {
          title: 'Modo Sustitución',
          description: 'Reemplaza conectores básicos por alternativas sofisticadas',
          icon: <RotateCcw className="w-6 h-6" />,
          color: 'bg-blue-500',
          difficulty: 'Medio',
          duration: '3-5 min',
          points: '8-15 pts',
          example: 'Cambiar "pero" por "no obstante"'
        };
      case 'repair':
        return {
          title: 'Modo Reparación',
          description: 'Identifica y corrige errores en conectores',
          icon: <Wrench className="w-6 h-6" />,
          color: 'bg-red-500',
          difficulty: 'Difícil',
          duration: '4-6 min',
          points: '12-18 pts',
          example: 'Eliminar redundancias como "aunque... sin embargo"'
        };
      case 'classification':
        return {
          title: 'Modo Clasificación',
          description: 'Clasifica conectores por función y formalidad',
          icon: <BarChart3 className="w-6 h-6" />,
          color: 'bg-green-500',
          difficulty: 'Avanzado',
          duration: '5-7 min',
          points: '16-20 pts',
          example: 'Separar conectores formales de informales'
        };
    }
  };

  if (currentView === 'playing') {
    return (
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentView('menu')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
          </Button>
        </div>

        <GameEngine
          language={language}
          level={level}
          mode={selectedMode}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3">
          <Gamepad2 className="w-10 h-10 text-purple-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Maestro de Cohesión
          </h1>
        </div>

        <div className="flex items-center justify-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {getLanguageLabel(language)}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Nivel {level.toUpperCase()}
          </Badge>
        </div>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Domina el arte de los conectores discursivos con ejercicios adaptativos diseñados para el nivel C1.
          Mejora tu escritura académica y profesional.
        </p>
      </motion.div>

      {/* Game Mode Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Tabs value={selectedMode} onValueChange={(value) => setSelectedMode(value as ExerciseMode)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="substitution" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Sustitución
            </TabsTrigger>
            <TabsTrigger value="repair" className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Reparación
            </TabsTrigger>
            <TabsTrigger value="classification" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Clasificación
            </TabsTrigger>
          </TabsList>

          {(['substitution', 'repair', 'classification'] as ExerciseMode[]).map((mode) => (
            <TabsContent key={mode} value={mode} className="mt-6">
              <Card className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${getModeConfig(mode).color}`} />

                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getModeConfig(mode).color} text-white`}>
                      {getModeConfig(mode).icon}
                    </div>
                    {getModeConfig(mode).title}
                  </CardTitle>
                  <p className="text-muted-foreground">{getModeConfig(mode).description}</p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Mode Details */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <Target className="w-5 h-5 mx-auto mb-2 text-orange-500" />
                      <div className="font-semibold">{getModeConfig(mode).difficulty}</div>
                      <div className="text-sm text-muted-foreground">Dificultad</div>
                    </div>
                    <div className="text-center">
                      <Clock className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                      <div className="font-semibold">{getModeConfig(mode).duration}</div>
                      <div className="text-sm text-muted-foreground">Duración</div>
                    </div>
                    <div className="text-center">
                      <Trophy className="w-5 h-5 mx-auto mb-2 text-yellow-500" />
                      <div className="font-semibold">{getModeConfig(mode).points}</div>
                      <div className="text-sm text-muted-foreground">Puntos</div>
                    </div>
                    <div className="text-center">
                      <Shuffle className="w-5 h-5 mx-auto mb-2 text-green-500" />
                      <div className="font-semibold">Adaptativo</div>
                      <div className="text-sm text-muted-foreground">Dificultad</div>
                    </div>
                  </div>

                  {/* Example */}
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Ejemplo:</h4>
                    <p className="text-sm text-muted-foreground">{getModeConfig(mode).example}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4">
                    <Button
                      onClick={() => setCurrentView('playing')}
                      className="font-semibold"
                      size="lg"
                    >
                      <PlayCircle className="w-5 h-5 mr-2" />
                      Comenzar {getModeConfig(mode).title}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>

      {/* Features Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-purple-500" />
              Contenido Curado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ejercicios diseñados específicamente para nivel C1 con conectores auténticos
              utilizados en contextos académicos y profesionales.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Progreso Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              El sistema adapta la dificultad según tu rendimiento y identifica
              patrones de error para personalizar tu experiencia.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Feedback Inmediato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Explicaciones detalladas para cada respuesta que te ayudan a entender
              el uso correcto de cada conector discursivo.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Tu Progreso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">0</div>
                <div className="text-sm text-muted-foreground">Sesiones Completadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">0</div>
                <div className="text-sm text-muted-foreground">Puntos Totales</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-500">0%</div>
                <div className="text-sm text-muted-foreground">Precisión Media</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-500">0</div>
                <div className="text-sm text-muted-foreground">Racha Máxima</div>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              ¡Comienza a jugar para ver tus estadísticas aquí!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}