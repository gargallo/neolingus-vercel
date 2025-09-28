import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/utils/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Gamepad2,
  Zap,
  Clock,
  Users,
  Target,
  ArrowRight,
  Play
} from 'lucide-react';

export default async function JuegosPage() {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mock user data for demo if not authenticated
  const isAuthenticated = !!user;

  // Available games
  const availableGames = [
    {
      id: 'swipe-de-la-norma',
      title: 'Swipe de la Norma',
      description: 'Decide si términos y expresiones son apropiados para exámenes formales',
      category: 'Gramática',
      duration: '2-5 min',
      difficulty: 'Intermedio',
      players: '1 jugador',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-emerald-500',
      available: true,
      languages: ['Español', 'Valenciano', 'Inglés'],
      levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
    },
    {
      id: 'maestro-cohesion',
      title: 'Maestro de Cohesión',
      description: 'Domina los conectores discursivos con ejercicios adaptativos',
      category: 'Gramática',
      duration: '8-12 min',
      difficulty: 'Avanzado',
      players: '1 jugador',
      icon: <Target className="w-8 h-8" />,
      color: 'bg-purple-500',
      available: true,
      languages: ['Español', 'Valenciano'],
      levels: ['B2', 'C1', 'C2']
    }
  ];

  // Language and level combinations
  const availableCourses = [
    { id: 'espanol_a1', name: 'Español A1', path: 'espanol/a1' },
    { id: 'espanol_a2', name: 'Español A2', path: 'espanol/a2' },
    { id: 'espanol_b1', name: 'Español B1', path: 'espanol/b1' },
    { id: 'espanol_b2', name: 'Español B2', path: 'espanol/b2' },
    { id: 'espanol_c1', name: 'Español C1', path: 'espanol/c1' },
    { id: 'espanol_c2', name: 'Español C2', path: 'espanol/c2' },
    { id: 'valenciano_b1', name: 'Valenciano B1', path: 'valenciano/b1' },
    { id: 'valenciano_b2', name: 'Valenciano B2', path: 'valenciano/b2' },
    { id: 'valenciano_c1', name: 'Valenciano C1', path: 'valenciano/c1' },
    { id: 'valenciano_c2', name: 'Valenciano C2', path: 'valenciano/c2' },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Intermedio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Avanzado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-orange-100 dark:bg-orange-900 rounded-2xl">
              <Gamepad2 className="w-12 h-12 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Juegos Educativos
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Mejora tus habilidades lingüísticas con nuestros juegos interactivos.
            Aprende jugando con ejercicios adaptativos diseñados por expertos.
          </p>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {availableGames.map((game) => (
            <Card key={game.id} className="hover:shadow-xl transition-all duration-300 group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`${game.color} w-16 h-16 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                      {game.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl mb-2">{game.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge className={getDifficultyColor(game.difficulty)}>
                          {game.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {game.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="text-base">
                  {game.description}
                </CardDescription>

                {/* Game Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span>{game.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span>{game.players}</span>
                  </div>
                </div>

                {/* Languages and Levels */}
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Idiomas:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {game.languages.map(lang => (
                        <Badge key={lang} variant="secondary" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Niveles:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {game.levels.map(level => (
                        <Badge key={level} variant="outline" className="text-xs">
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Play Button */}
                {game.available ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Elige tu curso para comenzar:
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {availableCourses.slice(0, 4).map(course => (
                        <Link
                          key={course.id}
                          href={`/dashboard/${course.path}/juegos/${game.id}`}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            {course.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Button disabled className="w-full">
                    <Clock className="w-4 h-4 mr-2" />
                    Próximamente
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Access Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Acceso Rápido por Curso
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {availableCourses.map(course => (
              <Link key={course.id} href={`/dashboard/${course.path}/juegos`}>
                <Card className="hover:shadow-md transition-all duration-200 cursor-pointer group">
                  <CardContent className="p-4 text-center">
                    <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {course.name}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Ver juegos
                    </div>
                    <ArrowRight className="w-4 h-4 mx-auto mt-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">
                ¡Comienza tu aventura de aprendizaje!
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Nuestros juegos están diseñados con inteligencia artificial para adaptarse a tu nivel
                y ayudarte a mejorar de forma efectiva y divertida.
              </p>
              <Link href="/dashboard/espanol/b1/juegos/swipe-de-la-norma">
                <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Play className="w-5 h-5 mr-2" />
                  Probar Swipe de la Norma
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}