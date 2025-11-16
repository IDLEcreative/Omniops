/**
 * Animation Transitions for Shopping Experience
 *
 * Centralized animation variants for consistent, smooth transitions
 * across the mobile shopping interface.
 */

import { Variants, Transition } from 'framer-motion';

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get transition config respecting user preferences
 */
export const getTransition = (transition: Transition): Transition => {
  return prefersReducedMotion() ? { duration: 0 } : transition;
};

/**
 * Chat to Shopping Feed Transition
 * Smooth morph from chat interface to shopping mode
 */
export const chatToShoppingVariants: Variants = {
  chatExit: {
    opacity: 0,
    scale: 0.95,
    y: -20,
    transition: getTransition({ duration: 0.3, ease: 'easeIn' }),
  },
  shoppingEnter: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: getTransition({
      type: 'spring',
      damping: 25,
      stiffness: 300,
      duration: 0.4
    }),
  },
  shoppingExit: {
    opacity: 0,
    y: '100%',
    transition: getTransition({ duration: 0.3, ease: 'easeIn' }),
  },
};

/**
 * Product Card Enter Animation
 * Staggered entrance for product cards
 */
export const productCardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: getTransition({
      delay: index * 0.1,
      duration: 0.4,
      ease: 'easeOut',
    }),
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: getTransition({ duration: 0.2 }),
  },
};

/**
 * Product Detail Modal Animation
 * Slide up from bottom like iOS modal
 */
export const productDetailVariants: Variants = {
  hidden: {
    y: '100%',
    opacity: 0,
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: getTransition({
      type: 'spring',
      damping: 30,
      stiffness: 300,
    }),
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: getTransition({
      duration: 0.25,
      ease: 'easeIn',
    }),
  },
};

/**
 * Backdrop Blur Animation
 * Smooth fade in for modal backdrops
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: getTransition({
      duration: 0.3,
    }),
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: getTransition({
      duration: 0.2,
    }),
  },
};

/**
 * Progress Bar Fill Animation
 * Smooth fill for story progress indicators
 */
export const progressBarVariants: Variants = {
  empty: {
    width: '0%',
  },
  filling: {
    width: '100%',
    transition: getTransition({
      duration: 3,
      ease: 'linear',
    }),
  },
  filled: {
    width: '100%',
  },
};

/**
 * Text Slide Up Animation
 * For product info overlays
 */
export const textSlideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: getTransition({
      delay,
      duration: 0.4,
      ease: 'easeOut',
    }),
  }),
};

/**
 * Image Fade In with Blur
 * Subtle blur-to-focus effect for images
 */
export const imageFadeVariants: Variants = {
  hidden: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: getTransition({
      duration: 0.5,
      ease: 'easeOut',
    }),
  },
};

/**
 * Sale Badge Bounce Animation
 * Eye-catching entrance for sale badges
 */
export const saleBadgeVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: getTransition({
      type: 'spring',
      damping: 15,
      stiffness: 400,
      delay: 0.3,
    }),
  },
};

/**
 * Price Pulse Animation
 * Subtle pulse for sale prices
 */
export const pricePulseVariants: Variants = {
  normal: {
    scale: 1,
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: getTransition({
      duration: 0.5,
      repeat: 2,
      ease: 'easeInOut',
    }),
  },
};

/**
 * Cart Indicator Animations
 */
export const cartIndicatorVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
  },
  visible: {
    scale: 1,
    opacity: 1,
    transition: getTransition({
      type: 'spring',
      damping: 20,
      stiffness: 400,
    }),
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: getTransition({
      duration: 0.2,
    }),
  },
  pulse: {
    scale: [1, 1.2, 1],
    transition: getTransition({
      duration: 0.3,
      ease: 'easeOut',
    }),
  },
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: getTransition({
      duration: 0.4,
      ease: 'easeOut',
    }),
  },
};

/**
 * Stagger Container
 * For staggering child animations
 */
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: getTransition({
      staggerChildren: 0.1,
      delayChildren: 0.2,
    }),
  },
};

/**
 * Stagger Item
 * Child items for stagger animation
 */
export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: getTransition({
      duration: 0.3,
    }),
  },
};

/**
 * Double Tap Scale Animation
 * Quick scale feedback for add to cart
 */
export const doubleTapScaleVariants: Variants = {
  normal: {
    scale: 1,
  },
  tap: {
    scale: 0.95,
    transition: getTransition({
      duration: 0.1,
    }),
  },
  doubleTap: {
    scale: [1, 0.9, 1.1, 1],
    transition: getTransition({
      duration: 0.4,
      ease: 'easeOut',
    }),
  },
};

/**
 * Variant Chip Selection Animation
 * Ripple effect for variant selection
 */
export const variantChipVariants: Variants = {
  unselected: {
    scale: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  selected: {
    scale: 1.05,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transition: getTransition({
      type: 'spring',
      damping: 20,
      stiffness: 400,
    }),
  },
  tap: {
    scale: 0.95,
    transition: getTransition({
      duration: 0.1,
    }),
  },
};

/**
 * Gallery Scroll Snap Animation
 * Smooth scroll with snap points
 */
export const galleryScrollVariants: Variants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.02,
    transition: getTransition({
      duration: 0.2,
    }),
  },
};
