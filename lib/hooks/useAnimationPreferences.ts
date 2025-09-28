"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getResponsiveAnimation } from "@/lib/animations/dashboard-animations";

/**
 * Hook for managing animation preferences and accessibility
 * Handles reduced motion detection and responsive animation scaling
 */
export function useAnimationPreferences() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isLowEndDevice, setIsLowEndDevice] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    // Check screen size and device capabilities
    const checkDeviceCapabilities = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);

      // Detect low-end devices for performance optimization
      const isLowEnd = (
        navigator.hardwareConcurrency <= 2 ||
        (navigator as any).deviceMemory <= 2 ||
        (navigator as any).connection?.effectiveType === 'slow-2g' ||
        (navigator as any).connection?.effectiveType === '2g'
      );
      setIsLowEndDevice(isLowEnd);
    };

    checkDeviceCapabilities();

    // Throttled resize handler for better performance
    let timeoutId: NodeJS.Timeout;
    const throttledResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkDeviceCapabilities, 150);
    };

    window.addEventListener("resize", throttledResize, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", throttledResize);
    };
  }, []);

  // Get animation configuration based on preferences
  const getAnimationConfig = () => {
    return getResponsiveAnimation(isMobile, prefersReducedMotion);
  };

  // Check if animations should be disabled (considering device performance)
  const shouldAnimate = useMemo(() =>
    !prefersReducedMotion && !isLowEndDevice,
    [prefersReducedMotion, isLowEndDevice]
  );

  // Get reduced variants for accessibility and performance
  const getReducedVariants = useCallback((variants: any) => {
    if (prefersReducedMotion || isLowEndDevice) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0 } },
        exit: { opacity: 0, transition: { duration: 0 } },
      };
    }
    return variants;
  }, [prefersReducedMotion, isLowEndDevice]);

  // Get responsive stagger delay with performance consideration
  const getStaggerDelay = useCallback((baseDelay: number | string = 0.05) => {
    if (prefersReducedMotion || isLowEndDevice) return 0;

    const delay = typeof baseDelay === 'string' ?
      (baseDelay === 'fast' ? 0.03 : baseDelay === 'slow' ? 0.1 : 0.05) :
      baseDelay;

    if (isMobile) return delay * 0.5;
    if (isTablet) return delay * 0.75;
    return delay;
  }, [prefersReducedMotion, isLowEndDevice, isMobile, isTablet]);

  // Get responsive duration with performance optimization
  const getDuration = useCallback((baseDuration: number | string = 0.2) => {
    if (prefersReducedMotion || isLowEndDevice) return 0;

    const duration = typeof baseDuration === 'string' ?
      (baseDuration === 'fast' ? 0.15 : baseDuration === 'slow' ? 0.5 : baseDuration === 'medium' ? 0.3 : 0.2) :
      baseDuration;

    if (isMobile) return duration * 0.7;
    if (isTablet) return duration * 0.85;
    return duration;
  }, [prefersReducedMotion, isLowEndDevice, isMobile, isTablet]);

  return {
    prefersReducedMotion,
    isMobile,
    isTablet,
    isLowEndDevice,
    shouldAnimate,
    getAnimationConfig,
    getReducedVariants,
    getStaggerDelay,
    getDuration,
  };
}

/**
 * Hook for creating accessible motion wrapper
 */
export function useAccessibleMotion() {
  const { prefersReducedMotion, shouldAnimate } = useAnimationPreferences();

  const getMotionProps = (motionProps: any) => {
    if (prefersReducedMotion) {
      return {
        initial: false,
        animate: false,
        exit: false,
        transition: { duration: 0 },
      };
    }
    return motionProps;
  };

  return {
    prefersReducedMotion,
    shouldAnimate,
    getMotionProps,
  };
}