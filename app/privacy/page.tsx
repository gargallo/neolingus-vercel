import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad - Neolingus",
  description: "Política de privacidad y protección de datos de Neolingus. Información sobre cómo recopilamos, usamos y protegemos tu información personal.",
  keywords: ["privacidad", "protección de datos", "GDPR", "política", "Neolingus"],
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Política de <span className="text-blue-600">Privacidad</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Información que Recopilamos</h2>
            <p className="text-slate-600 mb-4">
              En Neolingus recopilamos información que nos proporcionas directamente, como cuando:
            </p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Te registras para una cuenta</li>
              <li>Completas tu perfil de usuario</li>
              <li>Realizas exámenes de práctica</li>
              <li>Te comunicas con nuestro soporte</li>
              <li>Te suscribes a nuestros servicios</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Cómo Usamos tu Información</h2>
            <p className="text-slate-600 mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Proporcionar y mejorar nuestros servicios</li>
              <li>Personalizar tu experiencia de aprendizaje</li>
              <li>Procesar pagos y gestionar suscripciones</li>
              <li>Enviar comunicaciones relacionadas con el servicio</li>
              <li>Analizar el uso de la plataforma para mejoras</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Compartir Información</h2>
            <p className="text-slate-600 mb-4">
              No vendemos, alquilamos ni compartimos tu información personal con terceros, excepto:
            </p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Con tu consentimiento explícito</li>
              <li>Con proveedores de servicios que nos ayudan a operar</li>
              <li>Cuando sea requerido por ley</li>
              <li>Para proteger nuestros derechos o seguridad</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Tus Derechos</h2>
            <p className="text-slate-600 mb-4">
              Bajo el GDPR y otras leyes de privacidad, tienes derecho a:
            </p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Acceder a tus datos personales</li>
              <li>Rectificar información incorrecta</li>
              <li>Solicitar la eliminación de tus datos</li>
              <li>Limitar el procesamiento de tus datos</li>
              <li>Portabilidad de datos</li>
              <li>Objetar el procesamiento</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Seguridad</h2>
            <p className="text-slate-600 mb-4">
              Implementamos medidas técnicas y organizativas apropiadas para proteger 
              tus datos personales contra acceso no autorizado, alteración, divulgación o destrucción.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Retención de Datos</h2>
            <p className="text-slate-600 mb-4">
              Conservamos tus datos personales solo durante el tiempo necesario para cumplir 
              con los propósitos descritos en esta política, salvo que la ley requiera un período más largo.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Contacto</h2>
            <p className="text-slate-600 mb-4">
              Si tienes preguntas sobre esta política de privacidad o quieres ejercer tus derechos, 
              contáctanos en:
            </p>
            <p className="text-slate-600">
              <strong>Email:</strong> privacy@neolingus.com<br />
              <strong>Dirección:</strong> Calle de la Innovación 123, 28001 Madrid, España
            </p>
          </section>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-6">
            ¿Tienes preguntas sobre nuestra política de privacidad?
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Contactanos
          </Link>
        </div>
      </div>
    </div>
  );
}