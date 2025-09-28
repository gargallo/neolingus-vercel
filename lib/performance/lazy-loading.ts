/**
 * Component Lazy Loading Module
 * Implements code splitting and lazy loading for optimal performance
 */

import dynamic from 'next/dynamic'
import { ComponentType, ReactNode, Suspense } from 'react'

// Loading component configurations
interface LoadingConfig {
  text?: string
  showSpinner?: boolean
  minHeight?: string
  className?: string
}

// Default loading component
const DefaultLoader = ({ text = 'Loading...', minHeight = '200px' }: LoadingConfig) => (
  <div 
    className="flex items-center justify-center animate-pulse"
    style={{ minHeight }}
  >
    <div className="text-center">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
    </div>
  </div>
)

/**
 * Lazy load dashboard components
 */
export const LazyDashboard = {
  // Main dashboard component
  CourseDashboard: dynamic(
    () => import('@/components/academia/course-dashboard').then(mod => ({ default: mod.CourseDashboard })),
    {
      loading: () => <DefaultLoader text="Loading dashboard..." minHeight="600px" />,
      ssr: false
    }
  ),

  // Progress analytics
  ProgressAnalytics: dynamic(
    () => import('@/components/academia/progress-analytics').then(mod => ({ default: mod.ProgressAnalytics })),
    {
      loading: () => <DefaultLoader text="Loading analytics..." minHeight="400px" />,
      ssr: false
    }
  ),

  // AI Tutor
  AITutor: dynamic(
    () => import('@/components/academia/ai-tutor').then(mod => ({ default: mod.AITutor })),
    {
      loading: () => <DefaultLoader text="Initializing AI tutor..." minHeight="300px" />,
      ssr: false
    }
  ),

  // Exam simulator
  ExamSimulator: dynamic(
    () => import('@/components/academia/exam-simulator').then(mod => ({ default: mod.ExamSimulator })),
    {
      loading: () => <DefaultLoader text="Preparing exam..." minHeight="500px" />,
      ssr: false
    }
  ),

  // Course selection
  CourseSelection: dynamic(
    () => import('@/components/academia/course-selection').then(mod => ({ default: mod.CourseSelection })),
    {
      loading: () => <DefaultLoader text="Loading courses..." minHeight="400px" />,
      ssr: false
    }
  )
}

/**
 * Lazy load admin components
 */
export const LazyAdmin = {
  // Analytics dashboard
  AnalyticsDashboard: dynamic(
    () => import('@/app/admin/analytics/page'),
    {
      loading: () => <DefaultLoader text="Loading analytics dashboard..." minHeight="600px" />,
      ssr: false
    }
  ),

  // User management
  UserManagement: dynamic(
    () => import('@/app/admin/users/page'),
    {
      loading: () => <DefaultLoader text="Loading user management..." minHeight="500px" />,
      ssr: false
    }
  ),

  // Agent creator
  AgentCreator: dynamic(
    () => import('@/app/admin/agents/create/page'),
    {
      loading: () => <DefaultLoader text="Loading agent creator..." minHeight="500px" />,
      ssr: false
    }
  )
}

/**
 * Lazy load UI components
 */
export const LazyUI = {
  // Charts
  Charts: dynamic(
    () => import('@/components/ui/charts'),
    {
      loading: () => <DefaultLoader text="Loading charts..." minHeight="300px" />,
      ssr: false
    }
  ),

  // Rich text editor
  RichTextEditor: dynamic(
    () => import('@/components/ui/rich-text-editor'),
    {
      loading: () => <DefaultLoader text="Loading editor..." minHeight="400px" />,
      ssr: false
    }
  ),

  // Data tables
  DataTable: dynamic(
    () => import('@/components/ui/data-table'),
    {
      loading: () => <DefaultLoader text="Loading table..." minHeight="300px" />,
      ssr: false
    }
  )
}

/**
 * Progressive enhancement wrapper
 */
export function withProgressiveEnhancement<P extends object>(
  Component: ComponentType<P>,
  fallback?: ReactNode
): ComponentType<P> {
  return function EnhancedComponent(props: P) {
    return (
      <Suspense fallback={fallback || <DefaultLoader />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

/**
 * Intersection Observer for viewport-based loading
 */
export class ViewportLoader {
  private observer: IntersectionObserver | null = null
  private callbacks = new Map<Element, () => void>()

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const callback = this.callbacks.get(entry.target)
            if (callback) {
              callback()
              this.unobserve(entry.target)
            }
          }
        })
      }, {
        rootMargin: '50px',
        threshold: 0.01,
        ...options
      })
    }
  }

  observe(element: Element, callback: () => void) {
    if (this.observer) {
      this.callbacks.set(element, callback)
      this.observer.observe(element)
    } else {
      // Fallback for browsers without IntersectionObserver
      callback()
    }
  }

  unobserve(element: Element) {
    if (this.observer) {
      this.observer.unobserve(element)
      this.callbacks.delete(element)
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect()
      this.callbacks.clear()
    }
  }
}

/**
 * Resource hints for preloading critical resources
 */
export function preloadResources(resources: string[]) {
  if (typeof window === 'undefined') return

  resources.forEach(resource => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = resource
    
    // Determine resource type
    if (resource.endsWith('.js')) {
      link.as = 'script'
    } else if (resource.endsWith('.css')) {
      link.as = 'style'
    } else if (resource.match(/\.(jpg|jpeg|png|webp|avif)$/)) {
      link.as = 'image'
    } else if (resource.match(/\.(woff|woff2|ttf|otf)$/)) {
      link.as = 'font'
      link.crossOrigin = 'anonymous'
    }
    
    document.head.appendChild(link)
  })
}

/**
 * Prefetch components based on user interaction patterns
 */
export class ComponentPrefetcher {
  private static prefetchQueue: Set<() => Promise<any>> = new Set()
  private static isPrefetching = false

  static addToPrefetchQueue(loader: () => Promise<any>) {
    this.prefetchQueue.add(loader)
    this.processPrefetchQueue()
  }

  private static async processPrefetchQueue() {
    if (this.isPrefetching || this.prefetchQueue.size === 0) return

    this.isPrefetching = true

    // Use requestIdleCallback if available
    const prefetch = async () => {
      const loader = this.prefetchQueue.values().next().value
      if (loader) {
        this.prefetchQueue.delete(loader)
        try {
          await loader()
        } catch (error) {
          console.error('Prefetch failed:', error)
        }
      }

      this.isPrefetching = false
      if (this.prefetchQueue.size > 0) {
        this.processPrefetchQueue()
      }
    }

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetch, { timeout: 2000 })
    } else {
      setTimeout(prefetch, 100)
    }
  }

  static prefetchDashboard() {
    // Prefetch common dashboard components
    this.addToPrefetchQueue(() => import('@/components/academia/course-dashboard'))
    this.addToPrefetchQueue(() => import('@/components/academia/progress-analytics'))
  }

  static prefetchExam() {
    // Prefetch exam components
    this.addToPrefetchQueue(() => import('@/components/academia/exam-simulator'))
    this.addToPrefetchQueue(() => import('@/lib/exam-engine/core/engine'))
  }

  static prefetchAdmin() {
    // Prefetch admin components
    this.addToPrefetchQueue(() => import('@/app/admin/analytics/page'))
    this.addToPrefetchQueue(() => import('@/app/admin/users/page'))
  }
}

/**
 * Route-based code splitting configuration
 */
export const routeConfig = {
  // Critical routes that should not be lazy loaded
  critical: [
    '/',
    '/login',
    '/signup',
    '/dashboard'
  ],

  // Routes that should be prefetched
  prefetch: {
    '/dashboard/dashboard': ['course-dashboard', 'progress-analytics'],
    '/dashboard/exams': ['exam-simulator', 'exam-engine'],
    '/admin': ['analytics', 'user-management']
  },

  // Routes that should use aggressive code splitting
  split: {
    '/admin/*': true,
    '/dashboard/*/examens/*': true,
    '/ai/*': true
  }
}

// Export performance monitoring utilities
export { performanceMonitor } from './performance-monitor'