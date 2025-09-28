'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { useExamState } from '@/components/providers/exam-state-provider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import {
  BookOpen,
  User as UserIcon,
  Settings,
  LogOut,
  Home,
  GraduationCap,
  BarChart3,
  Trophy,
  Bell,
  HelpCircle,
  MessageSquare,
  Search,
  Menu,
  X,
  Globe,
  ChevronRight,
  Zap,
  Calendar,
  Star,
  Target,
  BookmarkIcon,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { signOutAction } from '@/app/actions';
import { useCourseContext, ProviderOption } from '@/components/academia/course-context-provider';

const LANGUAGE_NAMES: Record<string, string> = {
  english: 'Inglés',
  valenciano: 'Valenciano',
  spanish: 'Español',
  french: 'Francés',
  german: 'Alemán',
  italian: 'Italiano',
  portuguese: 'Portugués'
};

interface AcademiaHeaderProps {
  user: User;
}

export function AcademiaHeader({ user }: AcademiaHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(3); // Mock notifications
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const { isExamActive } = useExamState();

  // Independent provider logic for header (outside CourseContextProvider)
  const [selectedProvider, setSelectedProviderState] = useState<string | null>(null);

  // Extract course ID from pathname
  const courseMatch = pathname.match(/^\/dashboard\/([^\/]+)\/([^\/]+)/);
  const courseId = courseMatch ? `${courseMatch[1]}_${courseMatch[2]}` : null;

  // Static providers for testing (will be replaced with dynamic loading)
  const availableProviders: ProviderOption[] = courseId === 'valenciano_b2' || courseId === 'valenciano_c1' ? [
    {
      slug: 'cieacova',
      name: 'CIEACOVA',
      description: 'Comité Interuniversitario para la Evaluación del Conocimiento del Valenciano',
      total_exams: 1
    },
    {
      slug: 'jqcv',
      name: 'JQCV',
      description: 'Junta Qualificadora de Coneixements de Valencià',
      total_exams: 1
    }
  ] : [];

  // Provider selection handler
  const setSelectedProvider = (provider: string) => {
    setSelectedProviderState(provider);
    if (courseId) {
      localStorage.setItem(`selected-provider-${courseId}`, provider);
    }
  };

  // Load saved provider from localStorage on mount
  useEffect(() => {
    if (courseId && availableProviders.length > 0) {
      const savedProvider = localStorage.getItem(`selected-provider-${courseId}`);
      if (savedProvider && availableProviders.some(p => p.slug === savedProvider)) {
        setSelectedProviderState(savedProvider);
      }
    }
  }, [courseId, availableProviders.length]);

  const userInitials = user?.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() ||
                      user?.email?.substring(0, 2).toUpperCase() || 'U';
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Aprendiz';

  // Detect if we're in a specific course or general academia area
  const isInCourse = pathname.match(/^\/dashboard\/[^\/]+\/[^\/]+/);
  const isMainAcademia = pathname === '/dashboard';

  // Debug provider availability (NEW VERSION)
  console.log('🔍 AcademiaHeader Provider Selector Debug (NEW):', {
    pathname,
    courseId,
    isInCourse,
    availableProvidersLength: availableProviders.length,
    selectedProvider,
    shouldShowSelector: isInCourse && availableProviders.length > 0,
    availableProviders: availableProviders
  });

  // DEBUG: Log provider selector visibility conditions
  console.log('🔍 AcademiaHeader Provider Selector Debug:', {
    pathname,
    isInCourse: !!isInCourse,
    availableProvidersLength: availableProviders.length,
    shouldShowSelector: !!(isInCourse && availableProviders.length > 0),
    availableProviders: availableProviders.map(p => p.name)
  });
  const currentCourse = isInCourse ? {
    language: pathname.split('/')[2],
    level: pathname.split('/')[3]
  } : null;

  // Navigation items based on current context
  const getNavigationItems = () => {
    if (isMainAcademia) {
      // Main academia page - only basic navigation
      return [
        {
          name: 'Inicio',
          href: '/',
          icon: Home,
          active: false,
          description: 'Volver al inicio'
        }
      ];
    } else if (isInCourse) {
      // Inside a specific course - show course-specific navigation
      const baseCourseUrl = `/dashboard/${currentCourse!.language}/${currentCourse!.level}`;
      return [
        {
          name: 'Mis Cursos',
          href: '/dashboard',
          icon: Home,
          active: false,
          description: 'Volver a selección de cursos'
        },
        {
          name: 'Dashboard',
          href: baseCourseUrl,
          icon: GraduationCap,
          active: pathname === baseCourseUrl,
          description: 'Panel del curso'
        },
        {
          name: 'Mi Progreso',
          href: `${baseCourseUrl}/progress`,
          icon: BarChart3,
          active: pathname.includes('/progress'),
          description: 'Analíticas y estadísticas'
        },
        {
          name: 'Logros',
          href: `${baseCourseUrl}/achievements`,
          icon: Trophy,
          active: pathname.includes('/achievements'),
          description: 'Medallas y certificados'
        },
        {
          name: 'Calendario',
          href: `${baseCourseUrl}/calendar`,
          icon: Calendar,
          active: pathname.includes('/calendar'),
          description: 'Horarios y eventos'
        }
      ];
    } else {
      // Other academia pages - minimal navigation
      return [
        {
          name: 'Inicio',
          href: '/',
          icon: Home,
          active: false,
          description: 'Volver al inicio'
        },
        {
          name: 'Academia',
          href: '/dashboard',
          icon: GraduationCap,
          active: pathname.includes('/dashboard'),
          description: 'Plataforma de idiomas'
        }
      ];
    }
  };

  const navigationItems = getNavigationItems();

  // Get current page info for breadcrumb
  const getCurrentPageInfo = () => {
    if (isMainAcademia) {
      return {
        title: `Hola, ${firstName}`,
        subtitle: 'Activa tu entrenamiento inteligente de idiomas'
      };
    }

    if (isInCourse) {
      const [language, level] = pathname.split('/').slice(2, 4);
      if (!language || !level) {
        return { title: 'Curso', subtitle: 'Dashboard del curso' };
      }
      const languageNames: Record<string, string> = {
        english: 'Inglés',
        valenciano: 'Valenciano',
        spanish: 'Español',
        french: 'Francés'
      };

      const languageName = languageNames[language] || language.charAt(0).toUpperCase() + language.slice(1);
      const courseTitle = `${languageName} ${level.toUpperCase()}`;

      // Get selected provider info for subtitle
      const selectedProviderInfo = availableProviders.find(p => p.slug === selectedProvider);
      const providerText = selectedProviderInfo
        ? ` • ${selectedProviderInfo.name}`
        : (availableProviders.length > 0 ? ' • Selecciona proveedor' : '');

      if (pathname.includes('/progress')) return {
        title: 'Mi Progreso',
        subtitle: `Analíticas del curso ${courseTitle}${providerText}`
      };
      if (pathname.includes('/achievements')) return {
        title: 'Logros',
        subtitle: `Certificaciones de ${courseTitle}${providerText}`
      };
      if (pathname.includes('/calendar')) return {
        title: 'Calendario',
        subtitle: `Horarios de ${courseTitle}${providerText}`
      };
      if (pathname.includes('/examens')) return {
        title: 'Exámenes',
        subtitle: `Simuladores de ${courseTitle}${providerText}`
      };

      return {
        title: courseTitle,
        subtitle: `Dashboard del curso${providerText}`
      };
    }

    return { title: 'Academia', subtitle: 'Plataforma de idiomas profesional' };
  };

  const currentPage = getCurrentPageInfo();
  const courseLanguageName = currentCourse?.language
    ? LANGUAGE_NAMES[currentCourse.language] || currentCourse.language.charAt(0).toUpperCase() + currentCourse.language.slice(1)
    : null;
  const selectedProviderName = selectedProvider
    ? availableProviders.find((p) => p.slug === selectedProvider)?.name
    : null;

  const highlightPills = isInCourse
    ? [
        courseLanguageName,
        currentCourse?.level ? `Nivel ${currentCourse.level.toUpperCase()}` : null,
        selectedProviderName ? `Proveedor ${selectedProviderName}` : null,
      ].filter(Boolean)
    : [
        'IA Adaptativa',
        '97% aprobación',
        'Rutinas dinámicas'
      ];

  // Ocultar header cuando hay un examen activo
  if (isExamActive) {
    return null;
  }

  const brandTagline = isInCourse ? 'Curso activo' : 'IA Language Hub';

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 border-b border-slate-200/40 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/75 backdrop-blur-2xl shadow-[0_20px_45px_rgba(15,23,42,0.08)] relative overflow-hidden"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent dark:from-blue-500/20 dark:via-purple-600/20" />
        <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />
        <div className="absolute -top-32 -left-16 h-56 w-56 rounded-full bg-purple-500/10 blur-[110px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Main Navigation Bar */}
        <div className="flex flex-wrap items-center gap-4 py-4">
          {/* Logo and Brand */}
          <motion.div
            className="flex flex-1 items-center gap-6 min-w-0"
            whileHover={{ scale: 1.02 }}
          >
            <Link href="/dashboard" className="flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.3 }}
                className="p-2.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg"
              >
                <Globe className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 dark:from-white dark:via-blue-300 dark:to-purple-300 bg-clip-text text-transparent">
                  NEOLINGUS
                </h1>
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400 font-semibold">
                  {brandTagline}
                </p>
              </div>
            </Link>

            {!isInCourse && (currentPage.title || currentPage.subtitle) && (
              <div className="hidden md:flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
                {currentPage.title && (
                  <span className="text-sm font-semibold text-slate-800 dark:text-white">
                    {currentPage.title}
                  </span>
                )}
                {currentPage.subtitle && (
                  <span>{currentPage.subtitle}</span>
                )}
              </div>
            )}

            {(highlightPills.length > 0 || (isInCourse && availableProviders.length > 0)) && (
              <div className="hidden md:flex items-center gap-3 min-w-0 border-l border-white/30 dark:border-white/10 pl-4">
                {highlightPills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {highlightPills.map((pill, index) => (
                      <span
                        key={`${pill}-${index}`}
                        className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-white/60 dark:bg-white/10 dark:text-white/80 dark:ring-white/10"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                        {pill}
                      </span>
                    ))}
                  </div>
                )}
                {isInCourse && availableProviders.length > 0 && (
                  <Select
                    value={selectedProvider || undefined}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger className="h-9 w-[200px] rounded-xl border-white/40 bg-white/60 text-slate-700 backdrop-blur hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20">
                      <SelectValue placeholder="Proveedor" />
                    </SelectTrigger>
                    <SelectContent className="min-w-[240px]">
                      {availableProviders.map((provider) => (
                        <SelectItem key={provider.slug} value={provider.slug} className="cursor-pointer">
                          <div className="flex items-center gap-3 py-1">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                provider.slug === 'cambridge'
                                  ? 'bg-blue-500'
                                  : provider.slug === 'eoi'
                                  ? 'bg-emerald-500'
                                  : provider.slug === 'jqcv'
                                  ? 'bg-orange-500'
                                  : 'bg-gray-500'
                              }`}
                            />
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              {provider.description && (
                                <div className="text-xs text-gray-500">{provider.description}</div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex items-center space-x-2">
            {navigationItems.map((item) => (
              <motion.div key={item.name} whileHover={{ scale: 1.05 }}>
                <Link href={item.href}>
                  <Button
                    variant="ghost"
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 text-sm font-medium ${
                      item.active
                        ? 'bg-white text-slate-900 shadow-lg shadow-blue-500/10 dark:bg-white/10 dark:text-white dark:shadow-purple-500/20'
                        : 'text-slate-600 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span className="font-medium">{item.name}</span>
                  </Button>
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3 ml-auto">
            {isInCourse && (
              <div className="hidden lg:flex items-center gap-2 pr-3 border-r border-white/40 dark:border-white/10 mr-3">
                <Button
                  variant="outline"
                  className="rounded-xl border-white/40 bg-white/30 text-slate-700 hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20"
                  onClick={() => router.push('/dashboard/progress')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Progreso
                </Button>
                <Button
                  className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/20"
                  onClick={() => router.push('/dashboard/examens')}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Simuladores
                </Button>
              </div>
            )}
            {/* Quick Search */}
            <motion.div whileHover={{ scale: 1.05 }} className="hidden md:block">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border-white/40 bg-white/40 text-slate-700 backdrop-blur-md hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/15 transition-all duration-300"
              >
                <Search className="w-4 h-4" />
                <span className="text-sm">Buscar...</span>
              </Button>
            </motion.div>

            {/* Theme Toggle */}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2.5 rounded-xl border-white/40 bg-white/40 hover:bg-white/60 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 transition-all duration-300"
              >
                {theme === 'dark' ? (
                  <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-sm" />
                ) : (
                  <div className="w-4 h-4 bg-slate-600 rounded-full shadow-sm" />
                )}
              </Button>
            </motion.div>

            {/* Notifications */}
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                size="sm"
                className="p-2.5 rounded-xl border-white/40 bg-white/30 hover:bg-white/50 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15 transition-all duration-300 relative"
              >
                <Bell className="w-4 h-4" />
                {notifications > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold"
                  >
                    {notifications}
                  </motion.div>
                )}
              </Button>
            </motion.div>

            {/* User Menu */}
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/70 dark:hover:bg-white/10 transition-all duration-300"
                >
                  <Avatar className="h-8 w-8 border-2 border-transparent bg-gradient-to-br from-blue-600 to-purple-600">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Estudiante Premium
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${userMenuOpen ? 'rotate-90' : ''}`} />
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-72" align="end" forceMount>
                {/* User Profile Header */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 ml-auto">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-lg">
                      <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {user?.email}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">Premium</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-blue-600">2</div>
                      <div className="text-xs text-gray-500">Cursos</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-emerald-600">85%</div>
                      <div className="text-xs text-gray-500">Progreso</div>
                    </div>
                    <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                      <div className="text-lg font-bold text-purple-600">12</div>
                      <div className="text-xs text-gray-500">Logros</div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer flex items-center gap-3 p-3 rounded-xl">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Home className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Dashboard</div>
                        <div className="text-xs text-gray-500">Panel principal</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/progress" className="cursor-pointer flex items-center gap-3 p-3 rounded-xl">
                      <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-medium">Mi Progreso</div>
                        <div className="text-xs text-gray-500">Estadísticas detalladas</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/achievements" className="cursor-pointer flex items-center gap-3 p-3 rounded-xl">
                      <div className="p-1.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="font-medium">Logros</div>
                        <div className="text-xs text-gray-500">Medallas y certificados</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem asChild>
                    <Link href="/protected" className="cursor-pointer flex items-center gap-3 p-3 rounded-xl">
                      <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                        <UserIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium">Perfil</div>
                        <div className="text-xs text-gray-500">Configuración personal</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/protected/subscription" className="cursor-pointer flex items-center gap-3 p-3 rounded-xl">
                      <div className="p-1.5 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                        <Zap className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <div className="font-medium">Suscripción</div>
                        <div className="text-xs text-gray-500">Plan y facturación</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild>
                    <Link href="/help" className="cursor-pointer flex items-center gap-3 p-3 rounded-xl">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium">Ayuda</div>
                        <div className="text-xs text-gray-500">Soporte y tutoriales</div>
                      </div>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600 flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={() => signOutAction()}
                  >
                    <div className="p-1.5 bg-red-100 dark:bg-red-900/50 rounded-lg">
                      <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="font-medium">Cerrar Sesión</div>
                      <div className="text-xs text-red-500">Salir de la plataforma</div>
                    </div>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </motion.button>
          </div>
        </div>

        {(highlightPills.length > 0 || (isInCourse && availableProviders.length > 0)) && (
          <div className="flex w-full flex-wrap items-center gap-2 pb-2 md:hidden">
            {highlightPills.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {highlightPills.map((pill, index) => (
                  <span
                    key={`mobile-pill-${pill}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm ring-1 ring-white/60 dark:bg-white/10 dark:text-white/80 dark:ring-white/10"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                    {pill}
                  </span>
                ))}
              </div>
            )}
            {isInCourse && availableProviders.length > 0 && (
              <Select
                value={selectedProvider || undefined}
                onValueChange={setSelectedProvider}
              >
                <SelectTrigger className="h-9 w-full rounded-xl border-white/40 bg-white/70 text-slate-700 backdrop-blur hover:bg-white/80 dark:border-white/10 dark:bg-white/10 dark:text-white/80 dark:hover:bg-white/20">
                  <SelectValue placeholder="Proveedor" />
                </SelectTrigger>
                <SelectContent className="min-w-[220px]">
                  {availableProviders.map((provider) => (
                    <SelectItem key={`mobile-${provider.slug}`} value={provider.slug}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Mobile Navigation */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-4 space-y-2"
            >
              {navigationItems.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={item.active ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 p-4 rounded-xl ${
                      item.active
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                        : ''
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <div className="text-left">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  </Button>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Context Bar */}
      </div>
    </motion.header>
  );
}
