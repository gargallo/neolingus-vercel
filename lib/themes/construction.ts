// Construction theme configuration for the homepage
export const constructionTheme = {
  colors: {
    primary: {
      orange: '#FF7A00', // Construction orange
      yellow: '#FFD700', // Warning/caution yellow
      dark: '#1A1A1A',   // Dark charcoal
      light: '#F5F5F5',  // Light background
    },
    status: {
      progress: '#22C55E',   // Green for completed
      warning: '#F59E0B',    // Amber for in progress
      error: '#EF4444',      // Red for issues
      info: '#3B82F6',       // Blue for info
    },
    gradients: {
      hero: 'from-orange-500 via-amber-500 to-yellow-500',
      background: 'from-slate-50 to-orange-50',
      card: 'from-white to-orange-50',
    }
  },
  
  typography: {
    hero: 'text-4xl lg:text-6xl font-bold',
    heading: 'text-2xl lg:text-3xl font-semibold',
    subheading: 'text-lg lg:text-xl font-medium',
    body: 'text-base text-gray-600',
    small: 'text-sm text-gray-500',
  },
  
  spacing: {
    section: 'py-16 lg:py-24',
    container: 'px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto',
    card: 'p-6 lg:p-8',
  },
  
  animations: {
    fadeIn: 'animate-in fade-in duration-1000',
    slideUp: 'animate-in slide-in-from-bottom-4 duration-700',
    bounce: 'animate-bounce',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
  },
  
  shadows: {
    card: 'shadow-lg hover:shadow-xl transition-shadow duration-300',
    button: 'shadow-md hover:shadow-lg transition-shadow duration-200',
    hero: 'drop-shadow-2xl',
  }
} as const;

export type ConstructionTheme = typeof constructionTheme;