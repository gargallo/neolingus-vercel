import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Globe, Target, Users, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "Acerca de Nosotros - Neolingus",
  description: "Conoce la misión, visión y el equipo detrás de Neolingus, la plataforma líder en preparación de exámenes de idiomas.",
  keywords: ["Neolingus", "acerca de", "misión", "visión", "equipo", "idiomas", "educación"],
  openGraph: {
    title: "Acerca de Nosotros - Neolingus",
    description: "Conoce la misión, visión y el equipo detrás de Neolingus",
    type: "website",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <Globe className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Acerca de <span className="text-blue-600">Neolingus</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Transformamos la preparación de exámenes de idiomas a través de tecnología 
            avanzada y metodologías pedagógicas innovadoras.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900">Nuestra Misión</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Democratizar el acceso a una preparación de calidad para exámenes oficiales 
              de idiomas, proporcionando herramientas inteligentes que se adaptan a las 
              necesidades específicas de cada estudiante.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center mb-4">
              <Award className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900">Nuestra Visión</h2>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Ser la plataforma de referencia global para la preparación de exámenes 
              de idiomas, combinando inteligencia artificial con experiencia pedagógica 
              para maximizar el éxito de nuestros estudiantes.
            </p>
          </div>
        </div>

        {/* What Makes Us Different */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            ¿Qué nos hace diferentes?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Personalización IA</h3>
              <p className="text-slate-600">
                Algoritmos avanzados que adaptan el contenido y la dificultad 
                según tu progreso y áreas de mejora.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Cobertura Completa</h3>
              <p className="text-slate-600">
                Preparación para múltiples idiomas y organismos certificadores 
                oficiales en una sola plataforma.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Resultados Medibles</h3>
              <p className="text-slate-600">
                Analytics detallados y métricas de progreso que te ayudan 
                a optimizar tu preparación.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Nuestro Impacto</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Estudiantes activos</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-blue-100">Idiomas disponibles</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Tasa de éxito</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            ¿Listo para comenzar?
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Únete a miles de estudiantes que ya están transformando su preparación de idiomas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
            >
              Explorar Academia
            </Link>
            <Link
              href="/contact"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors border-2 border-blue-600"
            >
              Contactanos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}