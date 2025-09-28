import { signInAction } from "@/app/actions";
import AuthSubmitButton from "@/components/auth-submit-button";
import AuthOAuthButton from "@/components/auth-oauth-button";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Brain,
  ArrowLeft,
  Sparkles,
  Users,
  Award,
  TrendingUp,
} from "lucide-react";

export default async function SignIn(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden w-full">
      {/* Background Effects - Similar to Homepage */}
      <div className="fixed inset-0 w-full h-full">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-gradient-to-r from-blue-400/20 to-cyan-300/20 rounded-full animate-pulse"
            style={{
              left: `${((i * 13 + 42) % 100)}%`,
              top: `${((i * 17 + 23) % 100)}%`,
              animationDelay: `${(i % 4)}s`,
              animationDuration: `${2 + (i % 3)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="max-w-md text-center">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl shadow-blue-500/10">
                  <Brain className="h-8 w-8 text-blue-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full opacity-80 animate-pulse" />
              </div>
              <div className="ml-4 text-3xl font-extralight tracking-wide text-white/95">
                Neo
                <span className="font-medium bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                  Lingus
                </span>
              </div>
            </div>

            <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
              ¡Bienvenido de vuelta!
            </h1>
            <p className="text-xl text-gray-300/90 mb-8 leading-relaxed">
              Continúa tu viaje hacia la certificación con IA adaptativa
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-3 mx-auto">
                  <Users className="w-6 h-6 text-blue-300" />
                </div>
                <div className="text-2xl font-bold text-white">50K+</div>
                <div className="text-sm text-gray-400">Estudiantes</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-3 mx-auto">
                  <Award className="w-6 h-6 text-blue-300" />
                </div>
                <div className="text-2xl font-bold text-white">97%</div>
                <div className="text-sm text-gray-400">Tasa de éxito</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-3 mx-auto">
                  <TrendingUp className="w-6 h-6 text-blue-300" />
                </div>
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="text-sm text-gray-400">IA Tutora</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="w-full lg:w-1/2 flex flex-col p-6 lg:p-12">
          {/* Back Button - Fixed position */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-300/90 hover:text-white transition-all duration-300 mb-8 group self-start"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Volver al inicio
          </Link>

          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center mb-8">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl shadow-blue-500/10">
                    <Brain className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full opacity-80 animate-pulse" />
                </div>
                <div className="ml-3 text-2xl font-extralight tracking-wide text-white/95">
                  Neo
                  <span className="font-medium bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
                    Lingus
                  </span>
                </div>
              </div>

              {/* Form Card */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20">
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl mb-4">
                    <Sparkles className="w-6 h-6 text-blue-300" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Iniciar Sesión
                  </h2>
                  <p className="text-gray-300/80">
                    Accede a tu academia personalizada
                  </p>
                </div>

                {/* OAuth Buttons */}
                <div className="space-y-3 mb-6">
                  <AuthOAuthButton provider="google" />
                  <AuthOAuthButton provider="github" />
                </div>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-slate-800/50 px-4 text-gray-400">
                      O continúa con email
                    </span>
                  </div>
                </div>

                {/* Email/Password Form */}
                <form action={signInAction} className="space-y-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-300 font-medium"
                    >
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400 focus:border-blue-400/50 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-gray-300 font-medium"
                    >
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Tu contraseña"
                      required
                      className="bg-slate-700/50 border-white/10 text-white placeholder:text-gray-400 focus:border-blue-400/50 focus:ring-blue-400/20"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <Link
                      href="/forgot-password"
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>

                  <AuthSubmitButton />
                  <FormMessage message={searchParams} />
                </form>

                {/* Sign Up Link */}
                <div className="text-center mt-6 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm">
                    ¿No tienes cuenta?{" "}
                    <Link
                      href="/sign-up"
                      className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                      Regístrate gratis
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
