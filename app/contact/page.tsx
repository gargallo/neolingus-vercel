import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, Send } from "lucide-react";

export const metadata: Metadata = {
  title: "Contacto - Neolingus",
  description: "Ponte en contacto con el equipo de Neolingus. Encuentra nuestra información de contacto y formulario para consultas.",
  keywords: ["contacto", "soporte", "Neolingus", "ayuda", "consultas"],
  openGraph: {
    title: "Contacto - Neolingus",
    description: "Ponte en contacto con nuestro equipo",
    type: "website",
  },
};

export default function ContactPage() {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
            <MessageSquare className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            <span className="text-blue-600">Contacta</span> con Nosotros
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            ¿Tienes alguna pregunta o necesitas ayuda? Estamos aquí para ayudarte. 
            Ponte en contacto con nuestro equipo y te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
            <div className="flex items-center mb-6">
              <Send className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-slate-900">Envíanos un Mensaje</h2>
            </div>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Apellidos
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Tus apellidos"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="tu@email.com"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-2">
                  Asunto
                </label>
                <select
                  id="subject"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="">Selecciona un asunto</option>
                  <option value="soporte">Soporte Técnico</option>
                  <option value="facturacion">Facturación</option>
                  <option value="academia">Consulta Académica</option>
                  <option value="partnership">Colaboraciones</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-2">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Describe tu consulta o mensaje..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Enviar Mensaje
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            {/* Contact Methods */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Información de Contacto</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Correo Electrónico</h3>
                    <p className="text-slate-600">support@neolingus.com</p>
                    <p className="text-sm text-slate-500">Respuesta en 24 horas</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Teléfono</h3>
                    <p className="text-slate-600">+34 900 123 456</p>
                    <p className="text-sm text-slate-500">Lunes a Viernes, 9:00 - 18:00</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Oficina Principal</h3>
                    <p className="text-slate-600">
                      Calle de la Innovación 123<br />
                      28001 Madrid, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">Horarios de Atención</h3>
                    <p className="text-slate-600">
                      Lunes - Viernes: 9:00 - 18:00<br />
                      Sábados: 10:00 - 14:00<br />
                      Domingos: Cerrado
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Enlaces Rápidos</h2>
              
              <div className="space-y-3">
                <Link href="/help" className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <span className="text-blue-600 text-sm">?</span>
                    </div>
                    <span className="text-slate-900 font-medium">Centro de Ayuda</span>
                  </div>
                </Link>

                <Link href="/dashboard" className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <span className="text-blue-600 text-sm">📚</span>
                    </div>
                    <span className="text-slate-900 font-medium">Academia</span>
                  </div>
                </Link>

                <Link href="/about" className="block p-3 rounded-lg hover:bg-slate-50 transition-colors group">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                      <span className="text-blue-600 text-sm">ℹ️</span>
                    </div>
                    <span className="text-slate-900 font-medium">Acerca de Nosotros</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Alternative Contact */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">¿Prefieres hablar directamente?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Programa una llamada con nuestro equipo
          </p>
          <button className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors">
            Programar Llamada
          </button>
        </div>
      </div>
    </div>
  );
}