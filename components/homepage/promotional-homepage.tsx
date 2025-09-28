'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  Shield,
  Trophy,
  Target,
  Sparkles,
  Rocket,
  Users,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  TrendingUp,
  Clock,
  Award,
  Star,
  Zap,
  Gift,
  AlertTriangle,
  Heart,
  Truck,
  Activity,
  BookOpen,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import { useEnhancedTheme } from '@/components/providers/enhanced-theme-provider';

interface CountdownTimerProps {
  targetDate: Date;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="flex items-center justify-center space-x-4 text-center">
      <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-construction-primary/20">
        <div className="text-2xl font-bold text-construction-primary">{timeLeft.days}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Days</div>
      </div>
      <div className="text-construction-primary text-2xl">:</div>
      <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-construction-primary/20">
        <div className="text-2xl font-bold text-construction-primary">{timeLeft.hours}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Hrs</div>
      </div>
      <div className="text-construction-primary text-2xl">:</div>
      <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-construction-primary/20">
        <div className="text-2xl font-bold text-construction-primary">{timeLeft.minutes}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Mins</div>
      </div>
      <div className="text-construction-primary text-2xl">:</div>
      <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-construction-primary/20">
        <div className="text-2xl font-bold text-construction-primary">{timeLeft.seconds}</div>
        <div className="text-xs text-muted-foreground uppercase tracking-wide">Secs</div>
      </div>
    </div>
  );
};

const PromotionalHomepage: React.FC = () => {
  const { theme } = useEnhancedTheme();
  
  // Set promotion end date (30 days from now)
  const promotionEndDate = new Date();
  promotionEndDate.setDate(promotionEndDate.getDate() + 30);

  const features = [
    {
      icon: Flame,
      title: "Sistema SRS Inteligente",
      description: "Tecnología de repetición espaciada que adapta el entrenamiento a tu progreso",
      highlight: "Tecnología Avanzada"
    },
    {
      icon: Shield,
      title: "Certificación Oficial",
      description: "Formación reconocida por el Ministerio del Interior y organismos europeos",
      highlight: "Reconocimiento Oficial"
    },
    {
      icon: Trophy,
      title: "95% Tasa de Éxito",
      description: "Nuestros estudiantes aprueban las oposiciones en su primer intento",
      highlight: "Resultados Comprobados"
    },
    {
      icon: Target,
      title: "Tests Adaptativos",
      description: "Simulacros de examen que se ajustan a tu nivel y debilidades",
      highlight: "Entrenamiento Personalizado"
    }
  ];

  const stats = [
    { number: "8,500+", label: "Bomberos Formados", icon: Users },
    { number: "95%", label: "Tasa de Aprobación", icon: Award },
    { number: "20+", label: "Años de Experiencia", icon: Flame },
    { number: "4.9/5", label: "Valoración", icon: Star },
  ];

  const specializations = [
    { name: "Bombero Conductor", areas: ["Conducción", "Mecánica", "Mantenimiento"], color: "bg-red-600", icon: Truck },
    { name: "Rescate Urbano", areas: ["Altura", "Espacios Confinados", "Técnico"], color: "bg-orange-600", icon: AlertTriangle },
    { name: "Emergencias Médicas", areas: ["Primeros Auxilios", "SVA", "DESA"], color: "bg-blue-600", icon: Heart },
    { name: "Prevención", areas: ["Inspección", "Planes", "Normativa"], color: "bg-green-600", icon: Shield },
  ];

  const certifications = [
    { name: "Cambridge English", levels: ["A1", "A2", "B1", "B2", "C1", "C2"], color: "bg-blue-600" },
    { name: "JQCV Valenciano", levels: ["A2", "B1", "B2", "C1", "C2"], color: "bg-orange-600" },
    { name: "EOI Español", levels: ["A1", "A2", "B1", "B2", "C1", "C2"], color: "bg-green-600" },
    { name: "DELE Instituto Cervantes", levels: ["A1", "A2", "B1", "B2", "C1", "C2"], color: "bg-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section with Promotional Banner */}
      <section className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-construction-primary/5 via-construction-secondary/5 to-construction-accent/5"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%23f97316%22 fill-opacity=%220.03%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] animate-pulse"></div>
        
        <div className="relative container mx-auto px-4 py-16">
          {/* Hero Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="relative">
                <Flame className="h-12 w-12 text-red-500 animate-bounce" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-pulse"></div>
              </div>
              <h1 className="text-4xl md:text-6xl font-bold">
                <span className="text-gradient-construction">Academia</span>
                <span className="text-foreground ml-4">Bomberos</span>
              </h1>
            </div>

            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-muted-foreground mb-4">
                Formación de Élite para Bomberos
              </h2>
              <div className="flex items-center justify-center space-x-4">
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-lg md:text-xl px-4 py-2 rounded-xl font-bold">
                  🔥 Curso Intensivo
                </Badge>
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg md:text-xl px-4 py-2 rounded-xl font-bold">
                  📊 Sistema SRS
                </Badge>
              </div>
            </div>
          </div>

          {/* Course Highlights and Call to Action */}
          <div className="max-w-5xl mx-auto mb-12">
            <div className="bg-card/90 backdrop-blur-sm rounded-2xl p-8 border border-red-500/20 shadow-academy-large">
              {/* Key Highlights */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Brain className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Sistema SRS Inteligente</h3>
                  <p className="text-sm text-muted-foreground">Algoritmos avanzados que optimizan tu estudio</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Tests Adaptativos</h3>
                  <p className="text-sm text-muted-foreground">Exámenes que se ajustan a tu progreso real</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Trophy className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">Garantía de Éxito</h3>
                  <p className="text-sm text-muted-foreground">95% de aprobados en primera convocatoria</p>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Plazas disponibles</span>
                  <span className="text-lg font-bold text-red-600">73/100</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 rounded-full"
                    style={{ width: '73%' }}
                  ></div>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg"
                  className="bg-muted hover:bg-muted/80 text-foreground border-2 border-construction-primary/20 px-8 py-3 text-lg font-semibold rounded-xl"
                >
                  View All Courses
                </Button>
                <Button 
                  size="lg"
                  className="admin-button-primary px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Learning | Starting @ $49
                </Button>
              </div>
              
              <div className="text-center mt-4">
                <p className="text-muted-foreground text-sm">Purchase once, access for lifetime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose Our AI Language Academy?
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join thousands of successful language learners who achieved their certification goals
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card 
                  key={index} 
                  className={`admin-card academy-card-hover text-center h-full card-stagger-${index + 1} animate-slide-up-professional`}
                >
                  <CardHeader className="pb-4">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-construction-primary to-construction-secondary rounded-full flex items-center justify-center mb-4 shadow-academy-construction">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <Badge className="bg-construction-primary/10 text-construction-primary border-0 mb-2">
                      {feature.highlight}
                    </Badge>
                    <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div 
                  key={index} 
                  className={`text-center card-stagger-${index + 1} animate-fade-in-professional`}
                >
                  <div className="mx-auto w-12 h-12 bg-construction-primary/10 rounded-full flex items-center justify-center mb-3">
                    <IconComponent className="h-6 w-6 text-construction-primary" />
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.number}</div>
                  <div className="text-muted-foreground font-medium">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certifications Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Official Language Certifications
            </h2>
            <p className="text-muted-foreground text-lg">
              Prepare for internationally recognized language certifications
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <Card 
                key={index} 
                className={`admin-card academy-card-hover text-center card-stagger-${index + 1} animate-slide-up-professional`}
              >
                <CardHeader>
                  <div className={`w-4 h-4 ${cert.color} rounded-full mx-auto mb-3`}></div>
                  <h3 className="text-lg font-bold text-foreground">{cert.name}</h3>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap justify-center gap-2">
                    {cert.levels.map((level, levelIndex) => (
                      <Badge 
                        key={levelIndex}
                        className="bg-construction-secondary/20 text-construction-accent border-0"
                      >
                        {level}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-construction-primary/10 via-construction-secondary/10 to-construction-accent/10"></div>
        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Achieve Your <span className="text-gradient-construction">Language Goals</span>?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join our AI-powered language academy and get certified with confidence
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button 
                  size="lg"
                  className="admin-button-primary px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                size="lg"
                className="bg-transparent border-2 border-construction-primary text-construction-primary hover:bg-construction-primary hover:text-white px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300"
              >
                View Free Demo
                <Zap className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="mt-8 flex items-center justify-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4 text-construction-primary" />
                <span>No Setup Required</span>
              </div>
              <div className="flex items-center space-x-1">
                <Shield className="h-4 w-4 text-construction-primary" />
                <span>Money Back Guarantee</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4 text-construction-primary" />
                <span>Proven Results</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PromotionalHomepage;