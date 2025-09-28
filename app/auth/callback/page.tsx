'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // The middleware will handle the OAuth code exchange and redirect
    // This page is just a fallback in case the middleware redirect doesn't happen immediately
    const timer = setTimeout(() => {
      console.log('⏰ Callback page: Timeout alcanzado, redirigiendo manualmente');
      router.push('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          {/* Spinner */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 border-4 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Procesando autenticación...
            </h2>

            <p className="text-gray-300 text-sm">
              Validando credenciales y estableciendo sesión
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}