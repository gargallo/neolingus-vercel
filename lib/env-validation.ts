// Environment Validation for Agent System
// Ensures all required configuration is properly set

export interface EnvironmentCheck {
  name: string;
  required: boolean;
  status: 'ok' | 'warning' | 'error';
  value?: string;
  message: string;
}

export interface SystemReadiness {
  ready: boolean;
  score: number; // 0-100
  checks: EnvironmentCheck[];
  recommendations: string[];
}

export function validateEnvironment(): SystemReadiness {
  const checks: EnvironmentCheck[] = [];
  let readyCount = 0;
  const recommendations: string[] = [];

  // Database Configuration
  checks.push({
    name: 'Supabase URL',
    required: true,
    status: process.env.SUPABASE_URL ? 'ok' : 'error',
    value: process.env.SUPABASE_URL ? '***configured***' : undefined,
    message: process.env.SUPABASE_URL 
      ? 'Database connection configured'
      : 'SUPABASE_URL environment variable not set'
  });

  checks.push({
    name: 'Supabase Anon Key',
    required: true,
    status: process.env.SUPABASE_ANON_KEY ? 'ok' : 'error',
    value: process.env.SUPABASE_ANON_KEY ? '***configured***' : undefined,
    message: process.env.SUPABASE_ANON_KEY
      ? 'Database public key configured'
      : 'SUPABASE_ANON_KEY environment variable not set'
  });

  checks.push({
    name: 'Supabase Service Role Key',
    required: true,
    status: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'ok' : 'error',
    value: process.env.SUPABASE_SERVICE_ROLE_KEY ? '***configured***' : undefined,
    message: process.env.SUPABASE_SERVICE_ROLE_KEY
      ? 'Database service role configured'
      : 'SUPABASE_SERVICE_ROLE_KEY environment variable not set'
  });

  // AI Provider Keys
  checks.push({
    name: 'OpenAI API Key',
    required: true,
    status: process.env.OPENAI_API_KEY ? 'ok' : 'error',
    value: process.env.OPENAI_API_KEY ? '***configured***' : undefined,
    message: process.env.OPENAI_API_KEY
      ? 'OpenAI API access configured'
      : 'OPENAI_API_KEY environment variable not set'
  });

  checks.push({
    name: 'Anthropic API Key',
    required: false,
    status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'warning',
    value: process.env.ANTHROPIC_API_KEY ? '***configured***' : undefined,
    message: process.env.ANTHROPIC_API_KEY
      ? 'Anthropic API access configured'
      : 'Optional: Anthropic API key not configured'
  });

  checks.push({
    name: 'Google AI API Key',
    required: false,
    status: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'ok' : 'warning',
    value: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? '***configured***' : undefined,
    message: process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ? 'Google AI API access configured'
      : 'Optional: Google Generative AI API key not configured'
  });

  // Application Configuration
  checks.push({
    name: 'Next.js Environment',
    required: true,
    status: process.env.NODE_ENV ? 'ok' : 'warning',
    value: process.env.NODE_ENV,
    message: process.env.NODE_ENV
      ? `Running in ${process.env.NODE_ENV} mode`
      : 'NODE_ENV not specified, defaulting to development'
  });

  checks.push({
    name: 'Vercel Environment',
    required: false,
    status: process.env.VERCEL_ENV ? 'ok' : 'warning',
    value: process.env.VERCEL_ENV,
    message: process.env.VERCEL_ENV
      ? `Vercel deployment environment: ${process.env.VERCEL_ENV}`
      : 'Not running on Vercel (local development)'
  });

  // Security Configuration
  checks.push({
    name: 'Next Auth Secret',
    required: false,
    status: process.env.NEXTAUTH_SECRET ? 'ok' : 'warning',
    value: process.env.NEXTAUTH_SECRET ? '***configured***' : undefined,
    message: process.env.NEXTAUTH_SECRET
      ? 'NextAuth secret configured'
      : 'NEXTAUTH_SECRET not set (may cause authentication issues)'
  });

  // Count ready checks
  checks.forEach(check => {
    if (check.status === 'ok') {
      readyCount++;
    } else if (check.required && check.status === 'error') {
      recommendations.push(`Configure ${check.name}: ${check.message}`);
    }
  });

  // Generate recommendations
  const requiredChecks = checks.filter(c => c.required);
  const requiredReady = requiredChecks.filter(c => c.status === 'ok').length;
  const ready = requiredReady === requiredChecks.length;

  if (!ready) {
    recommendations.unshift('⚠️ System not ready for production use');
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    recommendations.push('💡 Consider adding additional AI providers for redundancy');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
    recommendations.push('🔒 Add NEXTAUTH_SECRET for production security');
  }

  const score = Math.round((readyCount / checks.length) * 100);

  return {
    ready,
    score,
    checks,
    recommendations
  };
}

export function getEnvironmentSummary(): string {
  const validation = validateEnvironment();
  
  const summary = [
    `System Readiness: ${validation.ready ? '✅ Ready' : '❌ Not Ready'}`,
    `Configuration Score: ${validation.score}/100`,
    `Required Components: ${validation.checks.filter(c => c.required && c.status === 'ok').length}/${validation.checks.filter(c => c.required).length}`,
    `Optional Components: ${validation.checks.filter(c => !c.required && c.status === 'ok').length}/${validation.checks.filter(c => !c.required).length}`
  ];

  if (validation.recommendations.length > 0) {
    summary.push('');
    summary.push('Recommendations:');
    validation.recommendations.forEach(rec => summary.push(`- ${rec}`));
  }

  return summary.join('\n');
}

export function validateForProduction(): { 
  ready: boolean; 
  blockers: string[]; 
  warnings: string[];
} {
  const validation = validateEnvironment();
  const blockers: string[] = [];
  const warnings: string[] = [];

  validation.checks.forEach(check => {
    if (check.required && check.status === 'error') {
      blockers.push(check.message);
    } else if (check.status === 'warning') {
      warnings.push(check.message);
    }
  });

  // Additional production checks
  if (process.env.NODE_ENV !== 'production') {
    warnings.push('NODE_ENV is not set to production');
  }

  if (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production') {
    warnings.push('Production deployment not detected');
  }

  return {
    ready: blockers.length === 0,
    blockers,
    warnings
  };
}

// Runtime environment check
export function checkRuntimeCapabilities(): {
  features: string[];
  limitations: string[];
  recommendations: string[];
} {
  const features: string[] = [];
  const limitations: string[] = [];
  const recommendations: string[] = [];

  // Check JavaScript environment
  if (typeof window !== 'undefined') {
    features.push('Client-side execution available');
  } else {
    features.push('Server-side execution available');
  }

  // Check Node.js version
  if (typeof process !== 'undefined' && process.version) {
    const nodeVersion = process.version;
    features.push(`Node.js ${nodeVersion}`);
    
    const majorVersion = parseInt(nodeVersion.slice(1));
    if (majorVersion < 18) {
      limitations.push('Node.js version is below recommended minimum (18.0.0)');
      recommendations.push('Upgrade to Node.js 18+ for optimal performance');
    }
  }

  // Check memory availability
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage();
    features.push(`Memory available: ${Math.round(memory.heapTotal / 1024 / 1024)}MB`);
    
    if (memory.heapTotal < 512 * 1024 * 1024) { // Less than 512MB
      limitations.push('Limited memory available (< 512MB)');
      recommendations.push('Consider optimizing memory usage or upgrading resources');
    }
  }

  // Check crypto availability
  try {
    if (typeof crypto !== 'undefined') {
      features.push('Crypto API available');
    }
  } catch (_e) {
    limitations.push('Crypto API not available');
  }

  return {
    features,
    limitations,
    recommendations
  };
}

// Export singleton instance for global access
export const environmentStatus = validateEnvironment();