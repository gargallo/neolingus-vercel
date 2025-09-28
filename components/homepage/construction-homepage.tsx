'use client';

import React from 'react';
import { ConstructionHomepageProps } from '@/lib/types/homepage';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Award, 
  Zap, 
  Star,
  Play,
  User,
  HardHat,
  Wrench,
  Hammer,
  Truck,
  Brain,
  BookOpen,
  Trophy,
  Target,
  Sparkles,
  Rocket,
  Globe,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Shield,
  TrendingUp,
  BookText,
} from 'lucide-react';
import Link from 'next/link';
import { useEnhancedTheme } from '@/components/providers/enhanced-theme-provider';
import { cn, constructionCard, constructionButton, constructionGradient, withThemeTransition } from '@/lib/utils/theme-utils';

const iconMap = {
  building: Building2,
  users: Users,
  award: Award,
  zap: Zap,
  star: Star,
  play: Play,
  user: User,
  hardhat: HardHat,
  wrench: Wrench,
  hammer: Hammer,
  truck: Truck,
  brain: Brain,
  book: BookOpen,
  trophy: Trophy,
  target: Target,
  sparkles: Sparkles,
  rocket: Rocket,
  globe: Globe,
  check: CheckCircle2,
  arrow: ArrowRight,
  graduation: GraduationCap,
  shield: Shield,
  trending: TrendingUp,
  booktext: BookText,
  certificate: Award
};

export function ConstructionHomepage({
  hero,
  features,
  testimonials,
  stats,
  authButtons,
  showDemoMode = false
}: ConstructionHomepageProps) {
  const { resolvedTheme } = useEnhancedTheme();
  
  const getIcon = (iconName: string, className = "h-6 w-6") => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap] || Building2;
    return <IconComponent className={className} />;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-foreground transition-colors duration-300">
      {/* Demo Mode Banner */}
      {showDemoMode && (
        <div className="bg-navy-800 text-white px-4 py-2 text-center text-sm font-medium shadow-md">
          <div className="flex items-center justify-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Demo Mode Active - Full AI Academy features available without authentication
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 transition-all duration-300">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="bg-navy-800 dark:bg-navy-700 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-navy-900 dark:text-navy-100">
                  NeoLingus
                </h1>
                <p className="text-sm text-navy-600 dark:text-navy-300 font-medium">
                  AI Language Academy
                </p>
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild className="border-2 border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-300 dark:border-navy-600 dark:text-navy-300 dark:hover:bg-navy-800">
                <Link href={authButtons.loginHref}>
                  <User className="h-4 w-4 mr-2" />
                  {authButtons.loginText}
                </Link>
              </Button>
              <Button asChild className="bg-navy-800 hover:bg-navy-900 text-white px-6 shadow-sm hover:shadow-md transition-all duration-200">
                <Link href={authButtons.signupHref}>
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {authButtons.signupText}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main role="main">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-24 bg-slate-50 dark:bg-slate-800/50">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-20 right-20 w-64 h-64 rounded-full border border-navy-200" />
            <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full border border-navy-200" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-5xl mx-auto">
              {/* Credential Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 bg-white border border-slate-200 shadow-sm">
                <Award className="h-5 w-5 text-amber-600" />
                <span className="text-sm font-semibold text-navy-800">
                  Accredited AI Language Certification Academy
                </span>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                  EST. 2024
                </Badge>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                <span className="text-navy-900 dark:text-navy-100">
                  Professional Language
                </span>
                <br />
                <span className="text-navy-700 dark:text-navy-300">
                  Certification Academy
                </span>
                <br />
                <span className="text-amber-600">
                  Powered by AI
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed text-slate-600 dark:text-slate-300">
                Advance your career with internationally recognized language certifications. 
                Our AI-powered learning platform delivers personalized instruction, 
                professional assessment, and globally accepted credentials that open doors to new opportunities.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                {hero.ctaButtons.map((button, index) => (
                  <Button
                    key={index}
                    size="lg"
                    asChild
                    className={cn(
                      "px-10 py-6 text-lg font-semibold min-w-56 h-16 rounded-lg shadow-sm hover:shadow-md transition-all duration-200",
                      button.variant === 'primary' 
                        ? "bg-navy-800 hover:bg-navy-900 text-white"
                        : "border-2 border-navy-200 bg-white hover:bg-slate-50 text-navy-700 hover:border-navy-300"
                    )}
                  >
                    <Link href={button.href} className="flex items-center justify-center gap-3">
                      {button.icon && getIcon(button.icon, "h-6 w-6")}
                      <span>{button.text}</span>
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                ))}
              </div>

              {/* Professional Trust Indicators */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="flex flex-col items-center p-6 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Shield className="h-10 w-10 text-navy-600 mb-3" />
                  <span className="text-sm font-semibold text-navy-800">Accredited Institution</span>
                  <span className="text-xs text-slate-500 mt-1">Globally Recognized</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Award className="h-10 w-10 text-amber-600 mb-3" />
                  <span className="text-sm font-semibold text-navy-800">Official Awards</span>
                  <span className="text-xs text-slate-500 mt-1">Industry Standard</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <TrendingUp className="h-10 w-10 text-emerald-600 mb-3" />
                  <span className="text-sm font-semibold text-navy-800">Career Advancement</span>
                  <span className="text-xs text-slate-500 mt-1">95% Success Rate</span>
                </div>
                <div className="flex flex-col items-center p-6 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <Brain className="h-10 w-10 text-blue-600 mb-3" />
                  <span className="text-sm font-semibold text-navy-800">AI-Enhanced Learning</span>
                  <span className="text-xs text-slate-500 mt-1">Personalized Path</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors duration-200">
                      {getIcon(stat.icon, "h-8 w-8 text-navy-700 dark:text-navy-300")}
                    </div>
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 text-navy-900 dark:text-navy-100">
                    {stat.value}
                  </div>
                  <div className="text-lg font-semibold mb-2 text-navy-700 dark:text-navy-300">
                    {stat.label}
                  </div>
                  {stat.description && (
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {stat.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-slate-50 dark:bg-slate-800/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <Badge className="mb-6 px-6 py-3 text-base bg-navy-800 text-white">
                <BookText className="h-5 w-5 mr-2" />
                Academic Excellence
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-navy-900 dark:text-navy-100">
                Why Choose Our <br />
                <span className="text-navy-700 dark:text-navy-300">
                  Academy
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
                Experience professional language education with our comprehensive AI-powered learning platform. 
                Every course is designed to deliver measurable results and internationally recognized certifications 
                that advance your career and open global opportunities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card 
                  key={feature.id} 
                  className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-slate-200 bg-white rounded-lg"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="p-4 rounded-lg bg-navy-800 group-hover:bg-navy-900 transition-colors duration-200">
                        {getIcon(feature.icon, "h-7 w-7 text-white")}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-navy-800 dark:text-navy-200">
                          {feature.title}
                        </h3>
                        {feature.badge && (
                          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            {feature.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    <Button 
                      asChild 
                      variant="outline"
                      className="w-full border-2 border-navy-200 text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition-all duration-200"
                    >
                      <Link href={feature.link} className="flex items-center justify-center gap-2">
                        <span>Learn More</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-white dark:bg-slate-900">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <Badge className="mb-6 px-6 py-3 text-base bg-emerald-700 text-white">
                <Users className="h-5 w-5 mr-2" />
                Graduate Success Stories
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold mb-8 text-navy-900 dark:text-navy-100">
                Proven Career <br />
                <span className="text-navy-700 dark:text-navy-300">
                  Advancement
                </span>
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-4xl mx-auto leading-relaxed">
                Join thousands of certified professionals who advanced their careers through our rigorous 
                AI-powered language certification program. Our graduates secure positions at leading 
                international companies and unlock global opportunities.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card 
                  key={testimonial.id} 
                  className="group overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-slate-200 bg-white rounded-lg"
                >
                  <CardContent className="p-8">
                    {/* Rating Stars */}
                    <div className="flex items-center mb-6">
                      <div className="flex">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-current text-amber-400" />
                        ))}
                      </div>
                      <Badge className="ml-3 bg-amber-100 text-amber-800 border-amber-200">
                        {testimonial.rating}/5
                      </Badge>
                    </div>
                    
                    {/* Quote */}
                    <blockquote className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                      "{testimonial.content}"
                    </blockquote>
                    
                    {/* Author */}
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-lg bg-navy-100 flex items-center justify-center mr-4">
                        <span className="text-navy-800 font-semibold text-lg">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold text-navy-800 dark:text-navy-200 mb-1">
                          {testimonial.name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {testimonial.role} at {testimonial.company}
                        </div>
                        <div className="flex items-center mt-1">
                          <Award className="h-4 w-4 mr-2 text-emerald-600" />
                          <span className="text-sm text-emerald-600 font-medium">
                            Certified Graduate
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Trust indicators */}
            <div className="mt-16">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-6 rounded-lg bg-slate-50 border border-slate-200">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900 mb-1">95%</div>
                  <span className="text-sm text-slate-600">Career Advancement</span>
                </div>
                <div className="text-center p-6 rounded-lg bg-slate-50 border border-slate-200">
                  <Trophy className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900 mb-1">50+</div>
                  <span className="text-sm text-slate-600">Partner Companies</span>
                </div>
                <div className="text-center p-6 rounded-lg bg-slate-50 border border-slate-200">
                  <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900 mb-1">24/7</div>
                  <span className="text-sm text-slate-600">AI Support</span>
                </div>
                <div className="text-center p-6 rounded-lg bg-slate-50 border border-slate-200">
                  <Globe className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-navy-900 mb-1">30+</div>
                  <span className="text-sm text-slate-600">Countries Served</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 bg-navy-900 text-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 bg-navy-800 border border-navy-700">
                <Award className="h-5 w-5 text-amber-400" />
                <span className="text-sm font-semibold">Start Your Professional Journey</span>
              </div>
              
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                Advance Your Career with
                <br />
                <span className="text-amber-400">
                  Professional Certification
                </span>
              </h2>
              
              <p className="text-xl md:text-2xl mb-12 text-slate-300 leading-relaxed">
                Join over 10,000 professionals who have earned internationally recognized 
                language certifications. Our AI-powered platform ensures you achieve 
                your career goals with confidence and competence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
                <Button 
                  size="lg" 
                  asChild 
                  className="bg-amber-600 hover:bg-amber-700 text-navy-900 px-10 py-6 text-lg font-semibold h-16 min-w-64 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <Link href={authButtons.signupHref} className="flex items-center justify-center gap-3">
                    <GraduationCap className="h-6 w-6" />
                    <span>Begin Certification</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline" 
                  asChild 
                  className="border-2 border-slate-400 text-white hover:bg-slate-800 hover:border-slate-300 px-10 py-6 text-lg font-semibold h-16 min-w-64 rounded-lg transition-all duration-200"
                >
                  <Link href={authButtons.loginHref} className="flex items-center justify-center gap-3">
                    <User className="h-6 w-6" />
                    <span>Access Account</span>
                  </Link>
                </Button>
              </div>
              
              {/* Professional highlights */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center p-6 rounded-lg border border-navy-700 bg-navy-800/50">
                  <Brain className="h-10 w-10 mx-auto mb-3 text-blue-400" />
                  <div className="text-sm font-semibold text-slate-300">AI-Enhanced Learning</div>
                </div>
                <div className="text-center p-6 rounded-lg border border-navy-700 bg-navy-800/50">
                  <Award className="h-10 w-10 mx-auto mb-3 text-amber-400" />
                  <div className="text-sm font-semibold text-slate-300">Global Recognition</div>
                </div>
                <div className="text-center p-6 rounded-lg border border-navy-700 bg-navy-800/50">
                  <Trophy className="h-10 w-10 mx-auto mb-3 text-emerald-400" />
                  <div className="text-sm font-semibold text-slate-300">Career Advancement</div>
                </div>
                <div className="text-center p-6 rounded-lg border border-navy-700 bg-navy-800/50">
                  <Target className="h-10 w-10 mx-auto mb-3 text-slate-400" />
                  <div className="text-sm font-semibold text-slate-300">Personalized Path</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer role="contentinfo" className="bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 py-20">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-navy-800 p-3 rounded-lg">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-navy-900 dark:text-navy-100">
                    NeoLingus
                  </h3>
                  <p className="text-sm text-navy-600 dark:text-navy-300 font-medium">
                    AI Language Academy
                  </p>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
                Advancing careers through professional AI-powered language certification 
                and globally recognized credentials that open international opportunities.
              </p>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-md">
                  <Shield className="h-4 w-4 text-navy-600" />
                  <span className="text-xs text-navy-700 dark:text-navy-300 font-medium">Accredited Institution</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-700 rounded-md">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Globally Recognized</span>
                </div>
              </div>
            </div>
            
            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-navy-900 dark:text-navy-100 mb-4 text-base">Academy Platform</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <GraduationCap className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Academia Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/courses" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <BookOpen className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Professional Courses
                  </Link>
                </li>
                <li>
                  <Link href="/exams" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Award className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Certification Exams
                  </Link>
                </li>
                <li>
                  <Link href="/progress" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <TrendingUp className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Progress Analytics
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-navy-900 dark:text-navy-100 mb-4 text-base">Support & Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/help" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <BookText className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <User className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Contact Support
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Shield className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Building2 className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Company Links */}
            <div>
              <h4 className="font-semibold text-navy-900 dark:text-navy-100 mb-4 text-base">Institution</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/about" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Building2 className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    About Academy
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Users className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Join Faculty
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Trophy className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Success Stories
                  </Link>
                </li>
                <li>
                  <Link href="/partners" className="text-slate-600 dark:text-slate-400 hover:text-navy-700 dark:hover:text-navy-300 transition-colors duration-200 flex items-center gap-2 group">
                    <Globe className="h-4 w-4 group-hover:text-navy-700 dark:group-hover:text-navy-300" />
                    Corporate Partners
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="border-t border-slate-200 dark:border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              © 2024 NeoLingus AI Language Academy. Advancing professional language education.
            </p>
            <div className="flex items-center gap-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                <span className="text-slate-600 dark:text-slate-400">Accredited Institution</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-3 w-3 text-amber-600" />
                <span className="text-slate-600 dark:text-slate-400">Global Recognition</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}