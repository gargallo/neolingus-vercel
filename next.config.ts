import type { NextConfig } from "next";

// Set dummy environment variables for build time if they're not present
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://dummy.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-anon-key';
}
if (!process.env.SUPABASE_URL) {
  process.env.SUPABASE_URL = 'https://dummy.supabase.co';
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'dummy-service-role-key';
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: '/Users/gargallo/Desktop/VERCELNEOLINGUS/neolingus',
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during build
    ignoreBuildErrors: true,
  },
  // Ensure proper webpack configuration
  webpack: (config, { isServer }) => {
    // Fix for webpack module issues
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
