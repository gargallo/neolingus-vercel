"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEnhancedTheme } from "@/components/providers/enhanced-theme-provider";
import {
  Gamepad2,
  Clock,
  CheckCircle,
  Star,
  TrendingUp,
  Play,
  RotateCcw,
  Brain,
  Zap,
  Puzzle,
  Dices,
  Swords,
  Trophy,
  Timer,
  Users,
  Target,
  BookOpen,
  Headphones,
  MessageSquare,
  PenTool,
  Sparkles,
  Crown,
  Flame,
  Award
} from "lucide-react";

interface GameHistory {
  id: string;
  game_type: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed';
  score?: number;
  started_at: string;
  completed_at?: string;
  duration?: number;
  game_results?: {
    accuracy: number;
    speed: number;
    level_reached: number;
    achievements: string[];
  };
}

interface JuegosSectionProps {
  gameHistory: GameHistory[];
}

export function JuegosSection({ gameHistory }: JuegosSectionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme } = useEnhancedTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const isDark = resolvedTheme === "dark";

  // Extract course info from pathname
  const pathSegments = pathname.split('/');
  const language = pathSegments[2];
  const level = pathSegments[3];

  // Game activities organized by category
  const gameActivities = {
    vocabulary: [
      {
        id: "word-hunt",
        title: "Cazador de Palabras",
        description: "Encuentra palabras ocultas en tiempo limitado",
        duration: 15,
        difficulty: "Beginner",
        icon: <Target className="w-6 h-6" />,
        color: "bg-blue-500",
        progress: 0,
        players: "1",
        category: "Vocabulario"
      },
      {
        id: "word-memory",
        title: "Memoria de Palabras",
        description: "Memoriza y empareja palabras con sus significados",
        duration: 20,
        difficulty: "Intermediate",
        icon: <Brain className="w-6 h-6" />,
        color: "bg-purple-500",
        progress: 0,
        players: "1",
        category: "Vocabulario"
      },
      {
        id: "vocabulary-duel",
        title: "Duelo de Vocabulario",
        description: "Compite contra otros estudiantes en tiempo real",
        duration: 10,
        difficulty: "Advanced",
        icon: <Swords className="w-6 h-6" />,
        color: "bg-red-500",
        progress: 0,
        players: "2-4",
        category: "Vocabulario"
      }
    ],
    grammar: [
      {
        id: "swipe-de-la-norma",
        title: "Swipe de la Norma",
        description: "Decide si términos y expresiones son apropiados para exámenes formales",
        duration: 5,
        difficulty: "Intermediate",
        icon: <Zap className="w-6 h-6" />,
        color: "bg-emerald-500",
        progress: 0,
        players: "1",
        category: "Gramática",
        available: true
      },
      {
        id: "maestro-cohesion",
        title: "Maestro de Cohesión",
        description: "Domina los conectores discursivos con ejercicios adaptativos de nivel C1",
        duration: 10,
        difficulty: "Advanced",
        icon: <RotateCcw className="w-6 h-6" />,
        color: "bg-purple-500",
        progress: 0,
        players: "1",
        category: "Gramática",
        available: true
      },
      {
        id: "grammar-builder",
        title: "Constructor Gramatical",
        description: "Construye oraciones correctas pieza por pieza",
        duration: 25,
        difficulty: "Intermediate",
        icon: <Puzzle className="w-6 h-6" />,
        color: "bg-green-500",
        progress: 0,
        players: "1",
        category: "Gramática"
      },
      {
        id: "tense-master",
        title: "Maestro de Tiempos",
        description: "Domina los tiempos verbales con desafíos divertidos",
        duration: 30,
        difficulty: "Advanced",
        icon: <Crown className="w-6 h-6" />,
        color: "bg-yellow-500",
        progress: 0,
        players: "1",
        category: "Gramática"
      },
      {
        id: "sentence-scramble",
        title: "Revoltijo de Oraciones",
        description: "Ordena palabras para formar oraciones correctas",
        duration: 15,
        difficulty: "Beginner",
        icon: <Dices className="w-6 h-6" />,
        color: "bg-indigo-500",
        progress: 0,
        players: "1",
        category: "Gramática"
      }
    ],
    listening: [
      {
        id: "audio-detective",
        title: "Detective de Audio",
        description: "Resuelve misterios escuchando pistas de audio",
        duration: 35,
        difficulty: "Intermediate",
        icon: <Headphones className="w-6 h-6" />,
        color: "bg-teal-500",
        progress: 0,
        players: "1",
        category: "Comprensión Auditiva"
      },
      {
        id: "rhythm-language",
        title: "Ritmo del Idioma",
        description: "Aprende pronunciación siguiendo ritmos musicales",
        duration: 20,
        difficulty: "Beginner",
        icon: <Flame className="w-6 h-6" />,
        color: "bg-orange-500",
        progress: 0,
        players: "1",
        category: "Comprensión Auditiva"
      },
      {
        id: "conversation-quest",
        title: "Aventura Conversacional",
        description: "Navega por aventuras respondiendo correctamente",
        duration: 40,
        difficulty: "Advanced",
        icon: <MessageSquare className="w-6 h-6" />,
        color: "bg-pink-500",
        progress: 0,
        players: "1",
        category: "Comprensión Auditiva"
      }
    ],
    creative: [
      {
        id: "story-creator",
        title: "Creador de Historias",
        description: "Crea historias colaborativas con otros jugadores",
        duration: 45,
        difficulty: "Intermediate",
        icon: <BookOpen className="w-6 h-6" />,
        color: "bg-violet-500",
        progress: 0,
        players: "2-6",
        category: "Creatividad"
      },
      {
        id: "poetry-battle",
        title: "Batalla de Poesía",
        description: "Compite creando poemas con palabras aleatorias",
        duration: 25,
        difficulty: "Advanced",
        icon: <PenTool className="w-6 h-6" />,
        color: "bg-rose-500",
        progress: 0,
        players: "2-4",
        category: "Creatividad"
      },
      {
        id: "language-improv",
        title: "Improvisación Lingüística",
        description: "Actúa y habla espontáneamente en situaciones divertidas",
        duration: 30,
        difficulty: "Advanced",
        icon: <Sparkles className="w-6 h-6" />,
        color: "bg-cyan-500",
        progress: 0,
        players: "3-8",
        category: "Creatividad"
      }
    ]
  };

  const gameCategories = [
    { key: "vocabulary", name: "Vocabulario", icon: <Target className="w-5 h-5" />, count: gameActivities.vocabulary.length },
    { key: "grammar", name: "Gramática", icon: <Puzzle className="w-5 h-5" />, count: gameActivities.grammar.length },
    { key: "listening", name: "Comprensión Auditiva", icon: <Headphones className="w-5 h-5" />, count: gameActivities.listening.length },
    { key: "creative", name: "Creatividad", icon: <Sparkles className="w-5 h-5" />, count: gameActivities.creative.length }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "Advanced": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const handleStartGame = (gameId: string) => {
    router.push(`/dashboard/${language}/${level}/juegos/${gameId}`);
  };

  const renderGameCard = (game: any, index: number) => (
    <motion.div
      key={game.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
        isDark
          ? "bg-slate-800 border-slate-700 hover:bg-slate-750"
          : "bg-white hover:shadow-xl"
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`${game.color} w-12 h-12 rounded-xl flex items-center justify-center text-white`}>
                {game.icon}
              </div>
              <div>
                <CardTitle className={`text-lg ${isDark ? "text-white" : "text-slate-900"}`}>
                  {game.title}
                </CardTitle>
                <div className="flex gap-2 mt-1">
                  <Badge className={getDifficultyColor(game.difficulty)}>
                    {game.difficulty}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    {game.players}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <CardDescription className="mt-2">
            {game.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">Estado</span>
              <span className={`font-medium ${game.available ? 'text-green-600' : 'text-orange-600'}`}>
                {game.available ? 'Disponible' : 'Próximamente'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${game.available ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                style={{ width: game.available ? "100%" : "0%" }}
              />
            </div>
          </div>

          {/* Game Info */}
          <div className="flex items-center justify-between mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">{game.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">0 logros</span>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => handleStartGame(game.id)}
            className="w-full"
            disabled={!game.available}
            variant={game.available ? "default" : "outline"}
          >
            {game.available ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Jugar Ahora
              </>
            ) : (
              <>
                <Timer className="w-4 h-4 mr-2" />
                Próximamente
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-xl">
            <Gamepad2 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
              Juegos Educativos
            </h1>
            <p className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Aprende jugando con nuestros juegos interactivos potenciados por IA
            </p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className={`rounded-lg p-6 mb-6 border-2 border-dashed ${
          isDark
            ? "border-orange-600 bg-orange-900/20"
            : "border-orange-300 bg-orange-50"
        }`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
              <Sparkles className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className={`text-xl font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
                ¡Próximamente disponible!
              </h3>
              <p className={`${isDark ? "text-slate-300" : "text-slate-700"}`}>
                Estamos desarrollando una experiencia de juegos revolucionaria. Los juegos estarán disponibles muy pronto.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Gamepad2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-500">Juegos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">0</p>
                  <p className="text-sm text-gray-500">Completados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">0</p>
                  <p className="text-sm text-gray-500">Logros</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={isDark ? "bg-slate-800 border-slate-700" : "bg-white"}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">0h</p>
                  <p className="text-sm text-gray-500">Tiempo Jugado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Game Activities by Category */}
      <Tabs defaultValue="vocabulary" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          {gameCategories.map((category) => (
            <TabsTrigger key={category.key} value={category.key} className="flex items-center gap-2">
              {category.icon}
              <span className="hidden sm:inline">{category.name}</span>
              <Badge variant="secondary" className="ml-2">
                {category.count}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {gameCategories.map((category) => (
          <TabsContent key={category.key} value={category.key} className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                {category.icon}
              </div>
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                  {category.name}
                </h2>
                <p className="text-gray-500">
                  {category.count} juegos disponibles para mejorar tu {category.name.toLowerCase()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameActivities[category.key as keyof typeof gameActivities].map((game, index) =>
                renderGameCard(game, index)
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}