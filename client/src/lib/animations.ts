// Animation variants and utilities for the flowing design system
import { Variants } from 'framer-motion'

// Easing curves inspired by the logo's flowing pattern
export const easing = {
  flow: [0.23, 1, 0.32, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  smooth: [0.4, 0, 0.2, 1] as const,
  sharp: [0.4, 0, 1, 1] as const,
}

// Duration scales
export const duration = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
  slowest: 1.0,
}

// Page-level animations
export const pageVariants: Variants = {
  initial: { 
    opacity: 0, 
    y: 20 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: duration.slow,
      ease: easing.flow,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: duration.normal,
      ease: easing.smooth,
    },
  },
}

// Stagger animations for lists
export const staggerVariants: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Individual item animations
export const itemVariants: Variants = {
  initial: { 
    opacity: 0, 
    x: -20,
    scale: 0.95,
  },
  animate: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: duration.slow,
      ease: easing.flow,
    },
  },
}

// Card hover animations
export const cardVariants: Variants = {
  initial: {
    scale: 1,
    y: 0,
    rotateX: 0,
    rotateY: 0,
  },
  hover: {
    scale: 1.02,
    y: -8,
    rotateX: 5,
    rotateY: 5,
    transition: {
      duration: duration.normal,
      ease: easing.flow,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: duration.fast,
      ease: easing.sharp,
    },
  },
}

// Floating animation for hero elements
export const floatVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      ease: easing.smooth,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
}

// Flow line animations (for connection lines)
export const flowLineVariants: Variants = {
  initial: { 
    pathLength: 0, 
    opacity: 0 
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { 
        duration: duration.slower, 
        ease: easing.flow 
      },
      opacity: { 
        duration: duration.fast 
      },
    },
  },
}

// Confidence meter animation
export const confidenceVariants: Variants = {
  initial: { 
    width: 0,
    opacity: 0,
  },
  animate: (confidence: number) => ({
    width: `${confidence}%`,
    opacity: 1,
    transition: {
      width: {
        duration: duration.slower,
        ease: easing.flow,
        delay: 0.3,
      },
      opacity: {
        duration: duration.normal,
      },
    },
  }),
}

// shimmer effect for loading states
export const shimmerVariants: Variants = {
  animate: {
    x: ['-100%', '100%'],
    transition: {
      duration: 2,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
}

// Ripple effect animation
export const rippleVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 1,
  },
  animate: {
    scale: 4,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: easing.flow,
    },
  },
}

// Connection pulse animation
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      ease: easing.smooth,
      repeat: Infinity,
    },
  },
}

// Sparkle animation for high-quality hooks
export const sparkleVariants: Variants = {
  animate: {
    rotate: [0, 360],
    scale: [1, 1.2, 1],
    transition: {
      duration: 2,
      ease: easing.flow,
      repeat: Infinity,
      repeatDelay: 3,
    },
  },
}

// Modal/Dialog animations
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.normal,
      ease: easing.bounce,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 20,
    transition: {
      duration: duration.fast,
      ease: easing.sharp,
    },
  },
}

// Overlay/backdrop animations
export const overlayVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: { duration: duration.normal }
  },
  exit: { 
    opacity: 0,
    transition: { duration: duration.fast }
  },
}

// Utility function to create custom spring configs
export const createSpring = (stiffness = 400, damping = 25) => ({
  type: "spring" as const,
  stiffness,
  damping,
})

// Utility function for reduced motion support
export const getReducedMotionVariants = (variants: Variants): Variants => {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return Object.fromEntries(
      Object.entries(variants).map(([key, value]) => [
        key,
        typeof value === 'object' && value !== null
          ? { ...value, transition: { duration: 0 } }
          : value
      ])
    )
  }
  return variants
}