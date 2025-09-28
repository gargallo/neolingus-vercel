/**
 * Image Optimization Module
 * Handles image optimization for course content and media assets
 */

import { ImageLoaderProps } from 'next/image'

interface ImageConfig {
  quality?: number
  format?: 'webp' | 'avif' | 'auto'
  sizes?: string
  priority?: boolean
}

interface OptimizedImage {
  src: string
  srcSet?: string
  sizes?: string
  placeholder?: string
  blurDataURL?: string
}

/**
 * Image optimization service
 */
export class ImageOptimizer {
  private static readonly BREAKPOINTS = [640, 750, 828, 1080, 1200, 1920, 2048, 3840]
  private static readonly DEVICE_SIZES = [640, 750, 828, 1080, 1200]
  private static readonly IMAGE_SIZES = [16, 32, 48, 64, 96, 128, 256, 384]
  
  /**
   * Next.js image loader for optimized images
   */
  static imageLoader({ src, width, quality }: ImageLoaderProps): string {
    // Use Vercel's image optimization API
    const params = new URLSearchParams({
      url: src,
      w: width.toString(),
      q: (quality || 85).toString()
    })
    
    return `/_next/image?${params.toString()}`
  }

  /**
   * Generate responsive image sizes
   */
  static generateSizes(type: 'hero' | 'card' | 'thumbnail' | 'content'): string {
    switch (type) {
      case 'hero':
        return '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px'
      case 'card':
        return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 400px'
      case 'thumbnail':
        return '(max-width: 640px) 25vw, 150px'
      case 'content':
        return '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px'
      default:
        return '100vw'
    }
  }

  /**
   * Generate blur placeholder for images
   */
  static async generateBlurPlaceholder(src: string): Promise<string> {
    // In production, this would generate a base64 blur placeholder
    // For now, return a default blur data URL
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='
  }

  /**
   * Optimize course content images
   */
  static optimizeCourseImage(
    src: string,
    alt: string,
    config: ImageConfig = {}
  ): OptimizedImage {
    const { quality = 85, format = 'auto', sizes, priority = false } = config

    // Generate optimized srcSet
    const srcSet = this.BREAKPOINTS
      .map(width => {
        const url = this.imageLoader({ src, width, quality })
        return `${url} ${width}w`
      })
      .join(', ')

    return {
      src: this.imageLoader({ src, width: 1920, quality }),
      srcSet,
      sizes: sizes || this.generateSizes('content'),
      placeholder: 'blur',
      blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k='
    }
  }

  /**
   * Preload critical images
   */
  static preloadImages(images: string[]) {
    if (typeof window === 'undefined') return

    images.forEach(src => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = src
      
      // Add fetchpriority for critical images
      if (images.indexOf(src) < 3) {
        link.setAttribute('fetchpriority', 'high')
      }
      
      document.head.appendChild(link)
    })
  }

  /**
   * Lazy load images with Intersection Observer
   */
  static lazyLoadImages() {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return
    }

    const images = document.querySelectorAll('img[data-lazy]')
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          const src = img.dataset.src
          const srcset = img.dataset.srcset
          
          if (src) {
            img.src = src
            img.removeAttribute('data-src')
          }
          
          if (srcset) {
            img.srcset = srcset
            img.removeAttribute('data-srcset')
          }
          
          img.removeAttribute('data-lazy')
          imageObserver.unobserve(img)
        }
      })
    }, {
      rootMargin: '50px 0px',
      threshold: 0.01
    })

    images.forEach(img => imageObserver.observe(img))
  }

  /**
   * Convert images to modern formats
   */
  static async convertToModernFormat(
    src: string,
    format: 'webp' | 'avif' = 'webp'
  ): Promise<string> {
    // In production, this would use a service like Cloudinary or Vercel Image API
    const params = new URLSearchParams({
      url: src,
      fm: format,
      q: '85'
    })
    
    return `/_next/image?${params.toString()}`
  }

  /**
   * Get optimal image format based on browser support
   */
  static getOptimalFormat(): 'avif' | 'webp' | 'jpeg' {
    if (typeof window === 'undefined') return 'jpeg'

    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1

    // Check AVIF support
    if (canvas.toDataURL('image/avif').indexOf('image/avif') === 5) {
      return 'avif'
    }

    // Check WebP support
    if (canvas.toDataURL('image/webp').indexOf('image/webp') === 5) {
      return 'webp'
    }

    return 'jpeg'
  }
}

/**
 * Image component configuration for course content
 */
export const courseImageConfig = {
  // Hero images
  hero: {
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px',
    quality: 90,
    priority: true,
    loading: 'eager' as const
  },

  // Course cards
  card: {
    sizes: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 400px',
    quality: 85,
    priority: false,
    loading: 'lazy' as const
  },

  // Thumbnails
  thumbnail: {
    sizes: '(max-width: 640px) 25vw, 150px',
    quality: 80,
    priority: false,
    loading: 'lazy' as const
  },

  // Content images
  content: {
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 800px',
    quality: 85,
    priority: false,
    loading: 'lazy' as const
  },

  // Avatar images
  avatar: {
    sizes: '64px',
    quality: 85,
    priority: false,
    loading: 'lazy' as const
  }
}

/**
 * CDN configuration for static assets
 */
export const cdnConfig = {
  // Base CDN URL (would be configured in production)
  baseUrl: process.env.NEXT_PUBLIC_CDN_URL || '',
  
  // Asset paths
  paths: {
    courses: '/images/courses',
    avatars: '/images/avatars',
    icons: '/images/icons',
    backgrounds: '/images/backgrounds'
  },

  // Cache control headers
  cacheControl: {
    images: 'public, max-age=31536000, immutable',
    avatars: 'public, max-age=86400',
    icons: 'public, max-age=31536000, immutable'
  }
}

/**
 * Performance monitoring for images
 */
export class ImagePerformanceMonitor {
  private static metrics: Map<string, {
    loadTime: number
    size: number
    format: string
  }> = new Map()

  static trackImageLoad(src: string, startTime: number, size: number) {
    const loadTime = performance.now() - startTime
    const format = src.split('.').pop() || 'unknown'
    
    this.metrics.set(src, {
      loadTime,
      size,
      format
    })
  }

  static getMetrics() {
    const allMetrics = Array.from(this.metrics.values())
    
    return {
      totalImages: allMetrics.length,
      avgLoadTime: allMetrics.reduce((sum, m) => sum + m.loadTime, 0) / allMetrics.length,
      totalSize: allMetrics.reduce((sum, m) => sum + m.size, 0),
      formatDistribution: allMetrics.reduce((acc, m) => {
        acc[m.format] = (acc[m.format] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }
  }

  static clearMetrics() {
    this.metrics.clear()
  }
}

// Export utilities
export { ImageOptimizer as default }