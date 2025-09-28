"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Clock,
  Award,
  Star,
  Users,
  TrendingUp,
  CheckCircle,
  Play,
  Target,
  Zap,
  ExternalLink,
  AlertCircle,
  Info,
  ChevronRight,
  Trophy,
  BarChart3
} from "lucide-react";
import { getProviderClasses, formatNumber, formatPercentage } from "@/lib/academia/widget-utils";

// Types for provider data
export interface ExamProvider {
  id: string;
  slug: string;
  name: string;
  description: string;
  logo?: string;
  featured?: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'official';
  totalExams: number;
  completedExams?: number;
  averageScore?: number;
  estimatedTime?: number;
  rating?: number;
  studentsCount?: number;
  tags?: string[];
  color?: string;
  certification?: {
    type: string;
    validity?: string;
    recognized?: string[];
  };
  pricing?: {
    examFee?: number;
    currency?: string;
    freeRetakes?: number;
  };
  availability?: {
    nextAvailable?: Date;
    waitlist?: boolean;
    locations?: string[];
  };
  stats?: {
    passRate?: number;
    averagePreparationTime?: number;
    satisfactionScore?: number;
  };
}

interface ProviderCardProps {
  provider: ExamProvider;
  isSelected?: boolean;
  showProgress?: boolean;
  showPricing?: boolean;
  showStats?: boolean;
  compact?: boolean;
  onSelect?: (provider: ExamProvider) => void;
  onStartExam?: (providerId: string) => void;
  onViewDetails?: (providerId: string) => void;
  className?: string;
}

export function ProviderCard({
  provider,
  isSelected = false,
  showProgress = true,
  showPricing = false,
  showStats = true,
  compact = false,
  onSelect,
  onStartExam,
  onViewDetails,
  className = ""
}: ProviderCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const providerClasses = getProviderClasses(provider.slug);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
      case "intermediate": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700";
      case "advanced": return "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700";
      case "official": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700";
      default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-700";
    }
  };

  const getAvailabilityStatus = () => {
    if (!provider.availability) return null;

    if (provider.availability.waitlist) {
      return { status: "waitlist", text: "Lista de espera", color: "text-amber-600" };
    }

    if (provider.availability.nextAvailable) {
      const nextDate = new Date(provider.availability.nextAvailable);
      const isAvailable = nextDate <= new Date();
      return {
        status: isAvailable ? "available" : "scheduled",
        text: isAvailable ? "Disponible ahora" : `Disponible ${nextDate.toLocaleDateString()}`,
        color: isAvailable ? "text-green-600" : "text-blue-600"
      };
    }

    return { status: "available", text: "Disponible", color: "text-green-600" };
  };

  const availabilityStatus = getAvailabilityStatus();
  const progressPercentage = provider.completedExams && provider.totalExams
    ? (provider.completedExams / provider.totalExams) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group cursor-pointer ${className}`}
      onClick={() => onSelect?.(provider)}
    >
      <Card className={`h-full border-2 transition-all duration-300 ${
        isSelected
          ? `${providerClasses.border} ${providerClasses.background} shadow-lg scale-105`
          : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-md'
      } ${compact ? 'min-h-[280px]' : 'min-h-[350px]'}`}>

        {/* Header Section */}
        <CardHeader className={`space-y-3 ${compact ? 'pb-3' : 'pb-4'}`}>
          <div className="flex items-start justify-between">
            {/* Provider Info */}
            <div className="flex items-center gap-3 flex-1">
              {provider.logo ? (
                <img
                  src={provider.logo}
                  alt={provider.name}
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${providerClasses.gradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                  {provider.name.charAt(0)}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
                  {provider.name}
                  {provider.featured && (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 text-xs">
                      <Star className="w-3 h-3 mr-1 fill-current" />
                      Featured
                    </Badge>
                  )}
                </CardTitle>

                {/* Certification Info */}
                {provider.certification && (
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {provider.certification.type}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Difficulty Badge */}
            <Badge className={getDifficultyColor(provider.difficulty)}>
              {provider.difficulty}
            </Badge>
          </div>

          {/* Description */}
          {!compact && (
            <CardDescription className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {provider.description}
            </CardDescription>
          )}

          {/* Availability Status */}
          {availabilityStatus && (
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                availabilityStatus.status === 'available'
                  ? 'bg-green-500'
                  : availabilityStatus.status === 'waitlist'
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
              }`} />
              <span className={`text-xs font-medium ${availabilityStatus.color}`}>
                {availabilityStatus.text}
              </span>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Provider Stats Grid */}
          <div className={`grid grid-cols-2 gap-3 text-sm ${compact ? 'grid-cols-1' : ''}`}>
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatNumber(provider.totalExams)} exams
              </span>
            </div>

            {provider.rating && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {provider.rating.toFixed(1)}
                </span>
              </div>
            )}

            {provider.studentsCount && (
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {formatNumber(provider.studentsCount)}
                </span>
              </div>
            )}

            {provider.estimatedTime && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {provider.estimatedTime}min
                </span>
              </div>
            )}
          </div>

          {/* Progress Section */}
          {showProgress && provider.completedExams !== undefined && (
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {provider.completedExams}/{provider.totalExams}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {formatPercentage(progressPercentage)} completado
              </div>
            </div>
          )}

          {/* Average Score */}
          {provider.averageScore !== undefined && (
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Puntuación media</span>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatPercentage(provider.averageScore)}
              </span>
            </div>
          )}

          {/* Statistics */}
          {showStats && provider.stats && !compact && (
            <div className="grid grid-cols-1 gap-2 text-xs">
              {provider.stats.passRate && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tasa de aprobados</span>
                  <span className="font-medium">{formatPercentage(provider.stats.passRate)}</span>
                </div>
              )}
              {provider.stats.satisfactionScore && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Satisfacción</span>
                  <span className="font-medium">{provider.stats.satisfactionScore}/5</span>
                </div>
              )}
            </div>
          )}

          {/* Pricing Info */}
          {showPricing && provider.pricing && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700 dark:text-blue-300">Precio del examen</span>
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  {provider.pricing.examFee}€
                </span>
              </div>
              {provider.pricing.freeRetakes && provider.pricing.freeRetakes > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {provider.pricing.freeRetakes} repetición{provider.pricing.freeRetakes !== 1 ? 'es' : ''} gratis
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {provider.tags && provider.tags.length > 0 && !compact && (
            <div className="flex flex-wrap gap-1">
              {provider.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs px-2 py-1 border-gray-300 dark:border-gray-600"
                >
                  {tag}
                </Badge>
              ))}
              {provider.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1 border-gray-300 dark:border-gray-600">
                  +{provider.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className={`space-y-2 pt-2 ${compact ? 'space-y-1' : ''}`}>
            {/* Primary Action */}
            <Button
              className={`w-full transition-all duration-300 ${
                isSelected
                  ? `bg-gradient-to-r ${providerClasses.gradient} text-white shadow-lg hover:shadow-xl`
                  : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200'
              } ${compact ? 'h-9 text-sm' : 'h-10'}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isSelected && onStartExam) {
                  onStartExam(provider.id);
                } else {
                  onSelect?.(provider);
                }
              }}
            >
              {isSelected ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Comenzar Examen
                </>
              ) : (
                <>
                  <CheckCircle className={`w-4 h-4 mr-2 ${isHovered ? 'scale-110' : ''} transition-transform`} />
                  Seleccionar Proveedor
                </>
              )}
            </Button>

            {/* Secondary Actions */}
            {!compact && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails?.(provider.id);
                  }}
                >
                  <Info className="w-3 h-3 mr-1" />
                  Detalles
                </Button>
                {provider.certification && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle certification info
                    }}
                  >
                    <Award className="w-3 h-3 mr-1" />
                    Certificación
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {/* Hover Effect Indicator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${providerClasses.gradient} w-full rounded-b-lg`}
        />

        {/* Selection Indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <CheckCircle className="w-4 h-4 text-white" />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

// Quick provider comparison component
export function ProviderComparison({
  providers,
  selectedProvider,
  onProviderSelect
}: {
  providers: ExamProvider[];
  selectedProvider?: string;
  onProviderSelect?: (provider: ExamProvider) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {providers.map((provider) => (
        <ProviderCard
          key={provider.id}
          provider={provider}
          isSelected={selectedProvider === provider.id}
          showProgress={false}
          showPricing={true}
          showStats={true}
          compact={true}
          onSelect={onProviderSelect}
        />
      ))}
    </div>
  );
}

// Provider stats widget for dashboard
export function ProviderStatsWidget({
  providers,
  className = ""
}: {
  providers: ExamProvider[];
  className?: string;
}) {
  const totalExams = providers.reduce((sum, p) => sum + p.totalExams, 0);
  const averageRating = providers.reduce((sum, p) => sum + (p.rating || 0), 0) / providers.length;
  const totalStudents = providers.reduce((sum, p) => sum + (p.studentsCount || 0), 0);

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-500" />
          Proveedores de Examen
        </CardTitle>
        <CardDescription>
          Estadísticas de todos los proveedores disponibles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalExams)}</div>
            <div className="text-xs text-gray-600">Exámenes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{averageRating.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Puntuación</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{formatNumber(totalStudents)}</div>
            <div className="text-xs text-gray-600">Estudiantes</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProviderCard;