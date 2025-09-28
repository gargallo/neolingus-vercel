/**
 * Bundle Size Analysis Utility
 *
 * Analyzes and optimizes bundle sizes for dashboard components
 * and provides recommendations for reducing bundle overhead.
 */

interface BundleAnalysis {
  componentName: string;
  estimatedSize: number; // in KB
  dependencies: string[];
  heavyDependencies: string[];
  recommendations: string[];
  optimizations: string[];
}

interface ImportAnalysis {
  module: string;
  namedImports: string[];
  defaultImport?: string;
  estimatedSize: number;
  isHeavy: boolean;
  alternatives?: string[];
}

// Known heavy dependencies and their estimated sizes (in KB)
const HEAVY_DEPENDENCIES = {
  'framer-motion': 120,
  'lodash': 70,
  'moment': 65,
  'rxjs': 50,
  'chart.js': 180,
  'd3': 250,
  'antd': 300,
  '@mui/material': 200,
  'react-spring': 80,
  'react-transition-group': 40,
  'date-fns': 15, // Lighter alternative to moment
  'lucide-react': 25, // Much lighter than react-icons
  'react-icons': 150,
} as const;

// Lightweight alternatives
const LIGHTWEIGHT_ALTERNATIVES = {
  'moment': 'date-fns',
  'lodash': 'native JavaScript methods',
  'react-icons': 'lucide-react',
  'chart.js': 'recharts (lighter) or custom SVG charts',
  'd3': 'focused d3 modules (d3-scale, d3-shape)',
  'antd': 'headlessui + tailwind',
  '@mui/material': 'headlessui + tailwind',
  'react-spring': 'framer-motion (more optimized)',
} as const;

class BundleAnalyzer {
  private analysisCache = new Map<string, BundleAnalysis>();

  analyzeComponent(
    componentName: string,
    sourceCode: string,
    dependencies: string[] = []
  ): BundleAnalysis {
    // Check cache first
    const cacheKey = `${componentName}-${this.hashCode(sourceCode)}`;
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey)!;
    }

    const analysis = this.performAnalysis(componentName, sourceCode, dependencies);
    this.analysisCache.set(cacheKey, analysis);

    return analysis;
  }

  private performAnalysis(
    componentName: string,
    sourceCode: string,
    dependencies: string[]
  ): BundleAnalysis {
    const imports = this.extractImports(sourceCode);
    const heavyDependencies = this.identifyHeavyDependencies(imports);
    const estimatedSize = this.calculateEstimatedSize(imports, sourceCode);
    const recommendations = this.generateRecommendations(imports, sourceCode);
    const optimizations = this.generateOptimizations(imports, heavyDependencies);

    return {
      componentName,
      estimatedSize,
      dependencies: imports.map(imp => imp.module),
      heavyDependencies: heavyDependencies.map(dep => dep.module),
      recommendations,
      optimizations
    };
  }

  private extractImports(sourceCode: string): ImportAnalysis[] {
    const imports: ImportAnalysis[] = [];
    const importRegex = /import\s+(?:(?:\{([^}]+)\})|([^,\s]+))(?:\s*,\s*(?:\{([^}]+)\}|([^,\s]+)))?\s+from\s+['"`]([^'"`]+)['"`]/g;

    let match;
    while ((match = importRegex.exec(sourceCode)) !== null) {
      const [, namedImports1, defaultImport1, namedImports2, defaultImport2, moduleName] = match;

      const namedImports = [
        ...(namedImports1?.split(',').map(s => s.trim()) || []),
        ...(namedImports2?.split(',').map(s => s.trim()) || [])
      ].filter(Boolean);

      const defaultImport = defaultImport1 || defaultImport2;

      const estimatedSize = this.getModuleSize(moduleName);
      const isHeavy = estimatedSize > 50;

      imports.push({
        module: moduleName,
        namedImports,
        defaultImport,
        estimatedSize,
        isHeavy,
        alternatives: isHeavy ? this.getAlternatives(moduleName) : undefined
      });
    }

    return imports;
  }

  private identifyHeavyDependencies(imports: ImportAnalysis[]): ImportAnalysis[] {
    return imports.filter(imp => imp.isHeavy);
  }

  private calculateEstimatedSize(imports: ImportAnalysis[], sourceCode: string): number {
    // Base component size estimation
    let totalSize = Math.ceil(sourceCode.length / 1000); // 1KB per ~1000 characters

    // Add import sizes
    imports.forEach(imp => {
      if (imp.namedImports.length > 0) {
        // Tree-shakeable imports - estimate based on usage
        totalSize += Math.ceil(imp.estimatedSize * (imp.namedImports.length / 10));
      } else {
        // Default imports - full module size
        totalSize += imp.estimatedSize;
      }
    });

    return Math.round(totalSize);
  }

  private getModuleSize(moduleName: string): number {
    // Check known heavy dependencies
    if (moduleName in HEAVY_DEPENDENCIES) {
      return HEAVY_DEPENDENCIES[moduleName as keyof typeof HEAVY_DEPENDENCIES];
    }

    // Estimate based on module patterns
    if (moduleName.startsWith('@')) {
      return 30; // Scoped packages tend to be larger
    }

    if (moduleName.includes('react-')) {
      return 25; // React ecosystem packages
    }

    if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
      return 5; // Local imports are usually smaller
    }

    return 15; // Default estimate for unknown packages
  }

  private getAlternatives(moduleName: string): string[] {
    const alternative = LIGHTWEIGHT_ALTERNATIVES[moduleName as keyof typeof LIGHTWEIGHT_ALTERNATIVES];
    return alternative ? [alternative] : [];
  }

  private generateRecommendations(imports: ImportAnalysis[], sourceCode: string): string[] {
    const recommendations: string[] = [];

    // Check for heavy dependencies
    const heavyImports = imports.filter(imp => imp.isHeavy);
    if (heavyImports.length > 0) {
      recommendations.push(
        `Consider alternatives for heavy dependencies: ${heavyImports.map(imp => imp.module).join(', ')}`
      );
    }

    // Check for unused imports (basic heuristic)
    imports.forEach(imp => {
      if (imp.defaultImport && !sourceCode.includes(imp.defaultImport)) {
        recommendations.push(`Remove unused default import: ${imp.defaultImport} from ${imp.module}`);
      }

      imp.namedImports.forEach(namedImport => {
        if (!sourceCode.includes(namedImport)) {
          recommendations.push(`Remove unused named import: ${namedImport} from ${imp.module}`);
        }
      });
    });

    // Check for dynamic imports opportunities
    if (sourceCode.includes('useState') && !sourceCode.includes('useEffect')) {
      recommendations.push('Consider lazy loading this component if it\'s not critical for initial render');
    }

    // Check for code splitting opportunities
    if (sourceCode.length > 5000) {
      recommendations.push('Consider splitting this large component into smaller, focused components');
    }

    return recommendations;
  }

  private generateOptimizations(imports: ImportAnalysis[], heavyDependencies: ImportAnalysis[]): string[] {
    const optimizations: string[] = [];

    // Suggest tree-shaking improvements
    imports.forEach(imp => {
      if (imp.module === 'lodash' && !imp.namedImports.length) {
        optimizations.push('Use specific lodash imports: import debounce from "lodash/debounce"');
      }

      if (imp.module === 'react-icons' && imp.namedImports.length > 0) {
        optimizations.push('Consider using lucide-react for smaller bundle size');
      }

      if (imp.module === 'framer-motion' && imp.namedImports.length > 5) {
        optimizations.push('Consider using CSS transitions for simple animations');
      }
    });

    // Suggest dynamic imports for heavy components
    heavyDependencies.forEach(dep => {
      if (dep.estimatedSize > 100) {
        optimizations.push(`Consider dynamic import for ${dep.module}: const ${dep.module} = lazy(() => import('${dep.module}'))`);
      }
    });

    return optimizations;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  generateReport(analyses: BundleAnalysis[]): {
    totalSize: number;
    largestComponents: BundleAnalysis[];
    heaviestDependencies: string[];
    overallRecommendations: string[];
  } {
    const totalSize = analyses.reduce((sum, analysis) => sum + analysis.estimatedSize, 0);

    const largestComponents = analyses
      .sort((a, b) => b.estimatedSize - a.estimatedSize)
      .slice(0, 5);

    const dependencyFrequency = new Map<string, number>();
    analyses.forEach(analysis => {
      analysis.heavyDependencies.forEach(dep => {
        dependencyFrequency.set(dep, (dependencyFrequency.get(dep) || 0) + 1);
      });
    });

    const heaviestDependencies = Array.from(dependencyFrequency.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([dep]) => dep);

    const overallRecommendations = this.generateOverallRecommendations(analyses, totalSize);

    return {
      totalSize,
      largestComponents,
      heaviestDependencies,
      overallRecommendations
    };
  }

  private generateOverallRecommendations(analyses: BundleAnalysis[], totalSize: number): string[] {
    const recommendations: string[] = [];

    if (totalSize > 500) {
      recommendations.push('Consider implementing code splitting to reduce initial bundle size');
    }

    if (totalSize > 1000) {
      recommendations.push('Bundle size is quite large - consider lazy loading non-critical components');
    }

    const heavyComponentsCount = analyses.filter(a => a.estimatedSize > 50).length;
    if (heavyComponentsCount > 3) {
      recommendations.push('Multiple heavy components detected - implement progressive loading');
    }

    return recommendations;
  }

  clearCache(): void {
    this.analysisCache.clear();
  }
}

export const bundleAnalyzer = new BundleAnalyzer();

// Utility functions for component analysis
export function analyzeDashboardBundle(componentFiles: { name: string; code: string }[]): {
  totalSize: number;
  componentAnalyses: BundleAnalysis[];
  report: ReturnType<BundleAnalyzer['generateReport']>;
} {
  const componentAnalyses = componentFiles.map(file =>
    bundleAnalyzer.analyzeComponent(file.name, file.code)
  );

  const report = bundleAnalyzer.generateReport(componentAnalyses);

  return {
    totalSize: report.totalSize,
    componentAnalyses,
    report
  };
}

export function getOptimizationPriority(analysis: BundleAnalysis): 'high' | 'medium' | 'low' {
  if (analysis.estimatedSize > 100 || analysis.heavyDependencies.length > 2) {
    return 'high';
  }

  if (analysis.estimatedSize > 50 || analysis.heavyDependencies.length > 0) {
    return 'medium';
  }

  return 'low';
}

export function generateBundleOptimizationPlan(analyses: BundleAnalysis[]): {
  priority: 'high' | 'medium' | 'low';
  component: string;
  actions: string[];
}[] {
  return analyses
    .map(analysis => ({
      priority: getOptimizationPriority(analysis),
      component: analysis.componentName,
      actions: [...analysis.recommendations, ...analysis.optimizations]
    }))
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}