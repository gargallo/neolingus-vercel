import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - Neolingus",
  description: "Blog de Neolingus con artículos, consejos y recursos para el aprendizaje de idiomas.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver al inicio
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <BookOpen className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-6">
          <span className="text-blue-600">Blog</span> Neolingus
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Próximamente: artículos, consejos y recursos para optimizar 
          tu aprendizaje de idiomas y preparación de exámenes.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Ir a Academia
          </Link>
          <Link href="/contact" className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            Suscríbete
          </Link>
        </div>
      </div>
    </div>
  );
}