"use client";

import { Variants, Transition } from "framer-motion";

/**
 * Centralized animation configuration for dashboard components
 * Features performance-optimized variants with accessibility support
 */

// Animation timing constants
export const ANIMATION_TIMING = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.3,
  slower: 0.5,
} as const;

// Easing curves
export const EASING = {
  ease: "easeOut",
  bounce: [0.25, 0.46, 0.45, 0.94],
  spring: { type: "spring", stiffness: 400, damping: 30 },
  smooth: { type: "tween", ease: [0.4, 0, 0.2, 1] },
} as const;

// Stagger timing for sequential animations
export const STAGGER = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.1,
} as const;

/**
 * Container variants for orchestrating child animations
 */
export const containerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: ANIMATION_TIMING.normal,
      staggerChildren: STAGGER.normal,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: ANIMATION_TIMING.fast,
      staggerChildren: STAGGER.fast,
      staggerDirection: -1,
    },
  },
};

/**
 * Item variants for individual components
 */
export const itemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.ease,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
};

/**
 * Slide in from left variants (for timeline items)
 */
export const slideFromLeftVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -30,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.ease,
    },
  },
  exit: {
    opacity: 0,
    x: 30,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
};

/**
 * Scale and fade variants (for cards and buttons)
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.ease,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
};

/**
 * Hover interaction variants
 */
export const hoverVariants = {
  scale: {
    scale: 1.02,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
  lift: {
    y: -2,
    scale: 1.01,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
  glow: {
    boxShadow: "0 8px 32px rgba(59, 130, 246, 0.15)",
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
};

/**
 * Tap/press interaction variants
 */
export const tapVariants = {
  scale: {
    scale: 0.95,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
  press: {
    scale: 0.98,
    y: 1,
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.ease,
    },
  },
};

/**
 * Loading animation variants
 */
export const loadingVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  shimmer: {
    backgroundPosition: ["200% 0", "-200% 0"],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

/**
 * Dashboard-specific animation presets
 */
export const dashboardAnimations = {
  // Stats cards with staggered entrance
  statsContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: ANIMATION_TIMING.normal,
        staggerChildren: STAGGER.normal,
        delayChildren: 0.1,
      },
    },
  },

  statsCard: {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: ANIMATION_TIMING.normal,
        ease: EASING.ease,
      },
    },
  },

  // Activity timeline with side entrance
  timelineContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: ANIMATION_TIMING.normal,
        staggerChildren: STAGGER.slow,
        delayChildren: 0.2,
      },
    },
  },

  timelineItem: {
    hidden: {
      opacity: 0,
      x: -40,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: ANIMATION_TIMING.normal,
        ease: EASING.ease,
      },
    },
  },

  // Quick actions with bounce
  actionContainer: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: ANIMATION_TIMING.normal,
        staggerChildren: STAGGER.normal,
        delayChildren: 0.3,
      },
    },
  },

  primaryAction: {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: ANIMATION_TIMING.normal,
        ease: EASING.ease,
      },
    },
  },

  secondaryAction: {
    hidden: {
      opacity: 0,
      x: -20
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: ANIMATION_TIMING.normal,
        ease: EASING.ease,
      },
    },
  },
};

/**
 * Responsive animation configuration
 */
export const getResponsiveAnimation = (isMobile: boolean, isReducedMotion: boolean) => {
  if (isReducedMotion) {
    return {
      duration: 0,
      transition: { duration: 0 },
    };
  }

  return {
    duration: isMobile ? ANIMATION_TIMING.fast : ANIMATION_TIMING.normal,
    transition: {
      duration: isMobile ? ANIMATION_TIMING.fast : ANIMATION_TIMING.normal,
      ease: EASING.ease,
    },
  };
};

/**
 * Utility for creating custom transition timing
 */
export const createTransition = (
  duration: number = ANIMATION_TIMING.normal,
  delay: number = 0,
  ease: string | number[] = EASING.ease
): Transition => ({
  duration,
  delay,
  ease,
});

/**
 * Utility for creating stagger configuration
 */
export const createStaggerTransition = (
  staggerDelay: number = STAGGER.normal,
  delayChildren: number = 0.1
): Transition => ({
  staggerChildren: staggerDelay,
  delayChildren,
});

/**
 * Performance-optimized will-change utility
 */
export const willChangeStyles = {
  transform: { willChange: "transform" },
  opacity: { willChange: "opacity" },
  auto: { willChange: "auto" },
};

/**
 * Accessibility helpers
 */
export const accessibilityProps = {
  respectReducedMotion: {
    initial: false,
    animate: false,
    transition: { duration: 0 },
  },
  ariaHidden: {
    "aria-hidden": "true",
  },
  focusable: {
    tabIndex: 0,
    "aria-describedby": "animation-description",
  },
};

/**
 * Layout animations for responsive changes
 */
export const layoutAnimations = {
  layout: {
    layout: true,
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.ease,
    },
  },
  layoutId: (id: string) => ({
    layoutId: id,
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.ease,
    },
  }),
};