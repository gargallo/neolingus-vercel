"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  useSpring as useReactSpring,
  animated,
  config,
} from "@react-spring/web";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Target,
  Trophy,
  Zap,
  Rocket,
  Star,
  Users,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  BookOpen,
  Award,
  TrendingUp,
  Shield,
  Sparkles,
  Clock,
  ChevronDown,
  PlayCircle,
  BarChart3,
  Globe,
  HeadphonesIcon,
  Languages,
  Lightbulb,
  TimerIcon,
  FileText,
  PenTool,
  MessageSquare,
  Heart,
  Flame,
  Eye,
  MousePointer,
} from "lucide-react";
import Link from "next/link";

// Componente de partículas flotantes animadas
// Componente de partículas flotantes premium con interactividad
const FloatingParticles: React.FC = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate consistent particle positions using seeded random
  const generateParticlePositions = (count: number, seed: number) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      // Use seeded pseudo-random for consistent positioning
      const x = ((seed + i * 17) % 100);
      const y = ((seed + i * 23) % 100);
      positions.push({ x, y });
    }
    return positions;
  };

  const particlePositions = generateParticlePositions(30, 42); // Fixed seed for consistency
  const specialParticlePositions = generateParticlePositions(8, 73);

  useEffect(() => {
    setIsClient(true);
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Only render particles on client side to avoid hydration mismatch
  if (!isClient) {
    return <div className="absolute inset-0 overflow-hidden pointer-events-none" />;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
    >
      {particlePositions.map((position, i) => {
        const offsetX = (mousePosition.x - 0.5) * 20 * ((i % 3) + 1);
        const offsetY = (mousePosition.y - 0.5) * 20 * ((i % 3) + 1);

        return (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400/30 to-cyan-300/30 rounded-full"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
            }}
            animate={{
              x: offsetX,
              y: offsetY,
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + (i % 4),
              repeat: Infinity,
              ease: "easeInOut",
              delay: (i % 2),
            }}
          />
        );
      })}

      {/* Partículas especiales que reaccionan más al mouse */}
      {specialParticlePositions.map((position, i) => (
        <motion.div
          key={`special-${i}`}
          className="absolute w-2 h-2 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-sm"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
          animate={{
            x: (mousePosition.x - 0.5) * 100,
            y: (mousePosition.y - 0.5) * 100,
            scale: [1, 2, 1],
            rotate: [0, 360],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

// Contador animado de números
const AnimatedCounter: React.FC<{
  target: number;
  suffix?: string;
  duration?: number;
}> = ({ target, suffix = "", duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      setCount((prev) => {
        const newValue = prev + increment;
        if (newValue >= target) {
          clearInterval(timer);
          return target;
        }
        return newValue;
      });
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span className="text-gradient-construction font-bold">
      {Math.floor(count)}
      {suffix}
    </span>
  );
};

// Componente de stats con animaciones
const StatsCard: React.FC<{
  icon: React.ElementType;
  value: number;
  suffix: string;
  label: string;
  delay: number;
}> = ({ icon: Icon, value, suffix, label, delay }) => {
  return (
    <div className="text-center group" style={{ animationDelay: `${delay}s` }}>
      <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-slate-700 via-slate-600 to-slate-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-500 group-hover:shadow-xl group-hover:shadow-slate-500/20 border border-white/20">
        <Icon className="h-9 w-9 text-blue-300" />
      </div>
      <div className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-slate-800 to-slate-900 bg-clip-text text-transparent">
        <AnimatedCounter target={value} suffix={suffix} />
      </div>
      <div className="text-slate-700 font-semibold text-lg">{label}</div>
    </div>
  );
};

// Componente de feature con hover effect espectacular
const FeatureCard: React.FC<{
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}> = ({ icon: Icon, title, description, gradient, delay }) => {
  return (
    <Card
      className={`group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative z-10">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-4">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </Card>
  );
};

const SpectacularHomepage: React.FC = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  // Parallax transforms para efectos de profundidad
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  // Intersection Observer para animaciones
  const [heroRef, heroInView] = useInView({
    threshold: 0.3,
    triggerOnce: true,
  });

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "Algoritmo Adaptativo",
      description:
        "Sistema de IA que personaliza el entrenamiento según tu perfil de aprendizaje y debilidades específicas",
      gradient: "from-slate-700 to-slate-600",
    },
    {
      icon: Target,
      title: "Simulacros Oficiales",
      description:
        "Réplicas exactas de exámenes reales con banco de preguntas actualizado y análisis detallado",
      gradient: "from-slate-700 to-slate-600",
    },
    {
      icon: BarChart3,
      title: "Analítica Avanzada",
      description:
        "Métricas de rendimiento en tiempo real con insights predictivos para optimizar tu preparación",
      gradient: "from-slate-700 to-slate-600",
    },
    {
      icon: Shield,
      title: "Certificación Garantizada",
      description:
        "Metodología respaldada por datos con 97% de tasa de aprobación en primera convocatoria",
      gradient: "from-slate-700 to-slate-600",
    },
  ];

  const stats = [
    {
      icon: Users,
      value: 50000,
      suffix: "+",
      label: "Profesionales Certificados",
    },
    {
      icon: Award,
      value: 97,
      suffix: "%",
      label: "Éxito en Primera Convocatoria",
    },
    {
      icon: BookOpen,
      value: 15,
      suffix: "+",
      label: "Organismos Certificadores",
    },
    { icon: Star, value: 4.9, suffix: "/5", label: "Satisfacción Comprobada" },
  ];

  const certifications = [
    {
      name: "Cambridge English",
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      color: "from-blue-500 to-indigo-600",
      icon: Globe,
    },
    {
      name: "JQCV Valenciano",
      levels: ["A2", "B1", "B2", "C1", "C2"],
      color: "from-orange-500 to-red-500",
      icon: Languages,
    },
    {
      name: "EOI Oficial",
      levels: ["Básico", "Intermedio", "Avanzado"],
      color: "from-green-500 to-emerald-600",
      icon: GraduationCap,
    },
    {
      name: "DELE Cervantes",
      levels: ["A1", "A2", "B1", "B2", "C1", "C2"],
      color: "from-purple-500 to-pink-600",
      icon: PenTool,
    },
    {
      name: "TOEFL",
      levels: ["iBT", "PBT", "Preparación"],
      color: "from-cyan-500 to-blue-600",
      icon: FileText,
    },
    {
      name: "IELTS",
      levels: ["Academic", "General", "Life Skills"],
      color: "from-teal-500 to-green-600",
      icon: HeadphonesIcon,
    },
  ];

  const testimonials = [
    {
      name: "María González",
      position: "Directora de Marketing Internacional",
      certification: "Cambridge C1 Advanced",
      text: "La metodología adaptativa me permitió aprobar el C1 en primer intento mientras mantenía mi agenda profesional. Un enfoque verdaderamente inteligente.",
      rating: 5,
      avatar: "MG",
    },
    {
      name: "David López",
      position: "Consultor de Negocios",
      certification: "JQCV C1 Valenciano",
      text: "Los simulacros replican fielmente la experiencia del examen real. La analítica predictiva me dio la confianza necesaria para el día del examen.",
      rating: 5,
      avatar: "DL",
    },
    {
      name: "Ana Martín",
      position: "Especialista en RRHH",
      certification: "EOI Nivel Avanzado",
      text: "La plataforma identificó mis patrones de error con precisión quirúrgica. Resultados medibles desde la primera semana de entrenamiento.",
      rating: 5,
      avatar: "AM",
    },
  ];

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden"
    >
      {/* Hero Section Premium con Parallax */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-20"
      >
        <FloatingParticles />

        {/* Background con efectos parallax */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20"
          style={{ y: backgroundY }}
        />
        <motion.div
          className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"
          style={{ y: backgroundY }}
        />

        {/* Efecto de profundidad con múltiples capas */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/10 to-slate-900/30"
          style={{ y: useTransform(scrollYProgress, [0, 1], ["0%", "20%"]) }}
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center min-h-[80vh]">
            {/* Contenido Principal con animaciones premium */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotateX: -15 }}
              animate={
                heroInView
                  ? {
                      opacity: 1,
                      x: 0,
                      rotateX: 0,
                      transition: {
                        duration: 1.2,
                        ease: [0.6, -0.05, 0.01, 0.99],
                        staggerChildren: 0.2,
                      },
                    }
                  : {}
              }
              style={{ y: textY }}
            >
              {/* Logo y título profesional */}
              <div className="mb-12">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
                      <Brain className="h-8 w-8 text-blue-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
                  </div>
                  <div className="text-3xl md:text-4xl font-light tracking-tight text-white">
                    Neo
                    <span className="font-semibold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      Lingus
                    </span>
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-medium text-white mb-8 leading-tight">
                  Domina cualquier{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent font-semibold">
                    certificación oficial
                  </span>
                  <br />
                  con IA avanzada
                </h1>

                <p className="text-xl text-gray-300 mb-10 leading-relaxed font-light max-w-lg">
                  Sistema de entrenamiento adaptativo diseñado para
                  profesionales que buscan
                  <strong className="text-white">
                    {" "}
                    excelencia certificada
                  </strong>{" "}
                  en idiomas.
                </p>

                {/* Métricas inline */}
                <div className="flex flex-wrap gap-6 mb-10">
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-5 h-5 text-emerald-400" />
                    <span className="text-white font-semibold">97% éxito</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-semibold">
                      50k+ profesionales
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <span className="text-white font-semibold">
                      15+ certificaciones
                    </span>
                  </div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/dashboard">
                  <Button className="group relative bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-xl w-full sm:w-auto">
                    <span className="flex items-center justify-center">
                      Acceder a la plataforma
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>

                <Button className="group bg-transparent border border-white/20 text-white hover:border-white/40 hover:bg-white/5 px-8 py-4 text-lg font-medium rounded-xl backdrop-blur-sm transition-all duration-300 w-full sm:w-auto">
                  <span className="flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 mr-2" />
                    Ver demostración
                  </span>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Sin tarjeta requerida</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <span>Resultados garantizados</span>
                </div>
              </div>
            </motion.div>

            {/* Preview de la App con efectos 3D */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: 15, scale: 0.9 }}
              animate={
                heroInView
                  ? {
                      opacity: 1,
                      x: 0,
                      rotateY: 0,
                      scale: 1,
                      transition: {
                        duration: 1.4,
                        ease: [0.6, -0.05, 0.01, 0.99],
                        delay: 0.3,
                      },
                    }
                  : {}
              }
              whileHover={{
                scale: 1.02,
                rotateY: -5,
                transition: { duration: 0.3 },
              }}
            >
              <div className="relative">
                {/* Mockup de la aplicación */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl p-8 shadow-2xl border border-white/10">
                  <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                    {/* Header de la app */}
                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                          <span className="font-semibold text-slate-800">
                            Cambridge C1 - Módulo 3
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-sm text-slate-600">
                            En vivo
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenido de la app */}
                    <div className="p-6 space-y-6">
                      {/* Pregunta simulada */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-800">
                          Reading Comprehension
                        </h3>
                        <div className="bg-slate-50 rounded-lg p-4">
                          <p className="text-slate-700 text-sm leading-relaxed">
                            "The implementation of artificial intelligence in
                            education has revolutionized..."
                          </p>
                        </div>
                      </div>

                      {/* Opciones simuladas con animaciones */}
                      <motion.div className="space-y-3">
                        <motion.div
                          className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.5, duration: 0.3 }}
                        >
                          <motion.div
                            className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{
                              delay: 1.8,
                              type: "spring",
                              stiffness: 300,
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </motion.div>
                          <span className="text-sm text-slate-700">
                            A) Enhances personalized learning experiences
                          </span>
                        </motion.div>
                        <motion.div
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.0, duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                          <span className="text-sm text-slate-700">
                            B) Replaces traditional teaching methods
                          </span>
                        </motion.div>
                        <motion.div
                          className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 2.2, duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                        >
                          <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                          <span className="text-sm text-slate-700">
                            C) Eliminates the need for human interaction
                          </span>
                        </motion.div>
                      </motion.div>

                      {/* Progress bar animada */}
                      <motion.div
                        className="space-y-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 2.4, duration: 0.3 }}
                      >
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>Progreso</span>
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2.8 }}
                          >
                            7/12
                          </motion.span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <motion.div
                            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "58%" }}
                            transition={{
                              delay: 2.6,
                              duration: 1.5,
                              ease: "easeOut",
                            }}
                          />
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Elementos flotantes decorativos premium */}
                <motion.div
                  className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-cyan-300/20 rounded-full blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                <motion.div
                  className="absolute -bottom-6 -left-6 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.1, 1],
                    x: [0, 10, 0],
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />

                {/* Partículas adicionales premium */}
                <motion.div
                  className="absolute top-1/2 -right-8 w-4 h-4 bg-gradient-to-r from-yellow-400/30 to-orange-400/30 rounded-full"
                  animate={{
                    y: [-20, 20, -20],
                    opacity: [0.3, 1, 0.3],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  className="absolute bottom-1/3 -left-4 w-6 h-6 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-sm"
                  animate={{
                    x: [-15, 15, -15],
                    scale: [1, 1.3, 1],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </div>
            </motion.div>
          </div>

          {/* Indicador de scroll premium con efectos */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3, duration: 0.8 }}
          >
            <motion.div
              animate={{
                y: [0, 10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer p-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
              onClick={() => scrollToSection("stats")}
            >
              <ChevronDown className="h-6 w-6 text-white/70" />
            </motion.div>

            {/* Efecto de ondas */}
            <motion.div
              className="absolute inset-0 rounded-full border border-white/20"
              animate={{
                scale: [1, 2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeOut",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section con Fondo Elegante */}
      <section id="stats" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-slate-50/90 to-gray-100/85 backdrop-blur-sm" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23e2e8f0%22%20fill-opacity%3D%220.3%22%3E%3Ccircle%20cx%3D%2220%22%20cy%3D%2220%22%20r%3D%221%22/%3E%3C/g%3E%3C/svg%3E')] opacity-40" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
              Líderes en Certificación Digital
            </h2>
            <p className="text-xl text-slate-700 max-w-3xl mx-auto font-light">
              Datos reales que respaldan nuestra metodología. Miles de
              profesionales han transformado su carrera con nuestro sistema de
              preparación avanzado
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <StatsCard
                key={index}
                icon={stat.icon}
                value={stat.value}
                suffix={stat.suffix}
                label={stat.label}
                delay={index * 0.2}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
              Metodología{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                científica
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto font-light">
              Tecnología de vanguardia aplicada al aprendizaje profesional de
              idiomas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                gradient={feature.gradient}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Certifications Showcase */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-900/30 to-blue-900/30" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
              Certificaciones{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                oficiales
              </span>
            </h2>
            <p className="text-xl text-gray-300 font-light">
              Preparación especializada para organismos certificadores
              internacionales
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {certifications.map((cert, index) => {
              const IconComponent = cert.icon;
              return (
                <Card
                  key={index}
                  className="group relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
                >
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-300 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-4">
                      {cert.name}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {cert.levels.map((level, levelIndex) => (
                        <Badge
                          key={levelIndex}
                          className="bg-white/10 text-gray-300 border border-white/20 hover:bg-white/20 transition-colors text-xs"
                        >
                          {level}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
              Casos de{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                éxito
              </span>
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border-white/20 p-8 text-center">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-8 w-8 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              <blockquote className="text-xl md:text-2xl text-white font-light mb-8 leading-relaxed italic">
                "{testimonials[currentTestimonial].text}"
              </blockquote>

              <div className="flex items-center justify-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl border border-white/20 flex items-center justify-center text-white font-semibold text-lg">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <div className="text-left">
                  <div className="text-lg font-semibold text-white">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-sm text-gray-400">
                    {testimonials[currentTestimonial].position}
                  </div>
                  <div className="text-sm text-cyan-300">
                    {testimonials[currentTestimonial].certification}
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentTestimonial
                        ? "bg-blue-400 scale-125"
                        : "bg-white/30 hover:bg-white/50"
                    }`}
                    onClick={() => setCurrentTestimonial(index)}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-medium text-white mb-8 leading-tight">
              Alcanza la{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent font-semibold">
                excelencia
              </span>
              <br />
              que mereces
            </h2>

            <p className="text-xl text-gray-300 mb-12 leading-relaxed font-light max-w-2xl mx-auto">
              Únete a los{" "}
              <strong className="text-white">50,000+ profesionales</strong> que
              ya han potenciado su carrera con certificaciones oficiales
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/dashboard">
                <Button className="group bg-white text-slate-900 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-xl">
                  <span className="flex items-center">
                    Comenzar evaluación gratuita
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-400">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Evaluación sin compromiso</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Shield className="h-4 w-4 text-blue-400" />
                <span>Garantía de resultados</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span>Soporte especializado</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SpectacularHomepage;
