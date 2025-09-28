import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, HelpCircle, Book, MessageCircle, Mail, Phone, FileText, Video, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Centro de Ayuda - Neolingus",
  description: "Encuentra respuestas a tus preguntas sobre Neolingus, guías de uso y formas de contactar con nuestro equipo de soporte.",
  keywords: ["ayuda", "soporte", "FAQ", "guías", "contacto", "Neolingus"],
  openGraph: {
    title: "Centro de Ayuda - Neolingus",
    description: "Encuentra respuestas y soporte para tu experiencia con Neolingus",
    type: "website",
  },
};

const faqs = [
  {
    question: "¿Cómo empiezo mi preparación en Neolingus?",
    answer: "Regístrate en la plataforma, completa tu perfil de aprendizaje y selecciona el curso del idioma y nivel que quieres preparar. Nuestro sistema te guiará paso a paso."
  },
  {
    question: "¿Qué exámenes puedo preparar?",
    answer: "Ofrecemos preparación para exámenes oficiales como Cambridge (B2 First, C1 Advanced), DELE, DELF, EOI, y muchos más. La lista completa está disponible en nuestra academia."
  },
  {
    question: "¿Cómo funciona la corrección automática?",
    answer: "Utilizamos IA avanzada para corregir tus respuestas de manera instantánea, proporcionando retroalimentación detallada y sugerencias de mejora personalizadas."
  },
  {
    question: "¿Puedo practicar en modo examen real?",
    answer: "Sí, nuestros simuladores replican las condiciones exactas del examen oficial, incluyendo tiempo límite, formato y estructura de preguntas."
  },
  {
    question: "¿Cómo cancelo mi suscripción?",
    answer: "Puedes cancelar tu suscripción en cualquier momento desde tu perfil en la sección de facturación. El acceso continuará hasta el final del período pagado."
  },
  {
    question: "¿Hay versión móvil disponible?",
    answer: "Nuestra plataforma web es completamente responsive y funciona perfectamente en dispositivos móviles. También estamos desarrollando apps nativas."
  }
];

const supportOptions = [
  {
    icon: MessageCircle,
    title: "Chat en Vivo",
    description: "Habla con nuestro equipo de soporte",
    availability: "Lun-Vie 9:00-18:00",
    action: "Iniciar Chat",
    href: "#"
  },
  {
    icon: Mail,
    title: "Correo Electrónico",
    description: "Envíanos un mensaje detallado",
    availability: "Respuesta en 24h",
    action: "support@neolingus.com",
    href: "mailto:support@neolingus.com"
  },
  {
    icon: Phone,
    title: "Teléfono",
    description: "Llámanos directamente",
    availability: "Lun-Vie 9:00-18:00",
    action: "+34 900 123 456",
    href: "tel:+34900123456"
  }
];

const resources = [
  {
    icon: Book,
    title: "Guías de Usuario",
    description: "Tutoriales paso a paso para usar la plataforma",
    href: "#"
  },
  {
    icon: Video,
    title: "Video Tutoriales",
    description: "Videos explicativos de las funcionalidades principales",
    href: "#"
  },
  {
    icon: FileText,
    title: "Documentación",
    description: "Información técnica y especificaciones detalladas",
    href: "#"
  },
  {
    icon: Users,
    title: "Comunidad",
    description: "Únete a nuestra comunidad de estudiantes",
    href: "#"
  }
];

export default function HelpPage() {
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
            <HelpCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Centro de <span className="text-blue-600">Ayuda</span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Encuentra respuestas rápidas a tus preguntas y obtén el soporte que necesitas 
            para aprovechar al máximo tu experiencia con Neolingus.
          </p>
        </div>

        {/* Support Options */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            ¿Necesitas ayuda inmediata?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {supportOptions.map((option, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <option.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{option.title}</h3>
                <p className="text-slate-600 mb-3">{option.description}</p>
                <p className="text-sm text-slate-500 mb-4">{option.availability}</p>
                <Link
                  href={option.href}
                  className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {option.action}
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Preguntas Frecuentes
          </h2>
          
          <div className="max-w-4xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <details className="group">
                  <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-slate-50 transition-colors">
                    <h3 className="text-lg font-semibold text-slate-900 pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center group-open:rotate-45 transition-transform">
                        <span className="text-blue-600 text-lg font-bold">+</span>
                      </div>
                    </div>
                  </summary>
                  <div className="px-6 pb-6">
                    <p className="text-slate-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">
            Recursos Adicionales
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {resources.map((resource, index) => (
              <Link
                key={index}
                href={resource.href}
                className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <resource.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{resource.title}</h3>
                <p className="text-slate-600 text-sm">{resource.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">¿No encontraste lo que buscabas?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Nuestro equipo de soporte está aquí para ayudarte
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            Contactanos
          </Link>
        </div>
      </div>
    </div>
  );
}