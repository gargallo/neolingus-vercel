import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Términos y Condiciones - Neolingus",
  description: "Términos y condiciones de uso de la plataforma Neolingus. Lee nuestras políticas y reglas de uso.",
  keywords: ["términos", "condiciones", "uso", "políticas", "Neolingus"],
};

export default function TermsPage() {
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
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Términos y <span className="text-blue-600">Condiciones</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Última actualización: {new Date().toLocaleDateString('es-ES')}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Aceptación de los Términos</h2>
            <p className="text-slate-600 mb-4">
              Al acceder y usar Neolingus, aceptas estar sujeto a estos términos y condiciones 
              de uso y nuestra política de privacidad. Si no estás de acuerdo con alguna parte 
              de estos términos, no debes usar nuestro servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Descripción del Servicio</h2>
            <p className="text-slate-600 mb-4">
              Neolingus es una plataforma educativa que ofrece:
            </p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Cursos de preparación para exámenes oficiales de idiomas</li>
              <li>Simuladores de exámenes interactivos</li>
              <li>Seguimiento de progreso personalizado</li>
              <li>Herramientas de evaluación con IA</li>
              <li>Recursos educativos especializados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Cuentas de Usuario</h2>
            <p className="text-slate-600 mb-4">
              Para usar nuestros servicios, debes:
            </p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Ser mayor de 14 años o tener consentimiento parental</li>
              <li>Proporcionar información precisa y actualizada</li>
              <li>Mantener la confidencialidad de tu cuenta</li>
              <li>Notificar inmediatamente cualquier uso no autorizado</li>
              <li>Ser responsable de todas las actividades en tu cuenta</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Uso Aceptable</h2>
            <p className="text-slate-600 mb-4">Te comprometes a NO:</p>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Usar el servicio para propósitos ilegales</li>
              <li>Compartir contenido ofensivo o inapropiado</li>
              <li>Intentar acceder sin autorización a otros sistemas</li>
              <li>Reproducir o distribuir nuestro contenido sin permiso</li>
              <li>Interferir con el funcionamiento del servicio</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Suscripciones y Pagos</h2>
            <ul className="text-slate-600 list-disc list-inside mb-4">
              <li>Las suscripciones se renuevan automáticamente</li>
              <li>Puedes cancelar en cualquier momento</li>
              <li>Los reembolsos están sujetos a nuestra política de reembolso</li>
              <li>Los precios pueden cambiar con aviso de 30 días</li>
              <li>El acceso continúa hasta el final del período pagado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Propiedad Intelectual</h2>
            <p className="text-slate-600 mb-4">
              Todo el contenido de Neolingus, incluyendo textos, gráficos, logos, 
              software y otros materiales, está protegido por derechos de autor 
              y otras leyes de propiedad intelectual.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Limitación de Responsabilidad</h2>
            <p className="text-slate-600 mb-4">
              Neolingus no será responsable por daños indirectos, incidentales, 
              especiales o consecuentes que resulten del uso o la incapacidad 
              de usar nuestro servicio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Terminación</h2>
            <p className="text-slate-600 mb-4">
              Podemos terminar o suspender tu cuenta inmediatamente, sin aviso previo, 
              por cualquier motivo, incluyendo la violación de estos términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">9. Ley Aplicable</h2>
            <p className="text-slate-600 mb-4">
              Estos términos se regirán e interpretarán de acuerdo con las leyes de España. 
              Cualquier disputa será sometida a la jurisdicción exclusiva de los tribunales españoles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">10. Contacto</h2>
            <p className="text-slate-600 mb-4">
              Si tienes preguntas sobre estos términos, contáctanos en:
            </p>
            <p className="text-slate-600">
              <strong>Email:</strong> legal@neolingus.com<br />
              <strong>Dirección:</strong> Calle de la Innovación 123, 28001 Madrid, España
            </p>
          </section>
        </div>

        {/* Contact CTA */}
        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-6">
            ¿Tienes preguntas sobre nuestros términos y condiciones?
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