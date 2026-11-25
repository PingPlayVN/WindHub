// src/design-system/motion.js
import { useReducedMotion } from 'framer-motion';
import { useThemeStore } from '@/store/useThemeStore';

export const EASE_OS_OUT = [0.22, 1, 0.36, 1];
export const EASE_OS_IN = [0.55, 0, 1, 0.45];
export const EASE_OS_IN_OUT = [0.65, 0, 0.35, 1];
export const EASE_OS_SHEET = [0.32, 0.72, 0, 1];

export const SPRING_OS_SNAPPY = {
  type: 'spring',
  stiffness: 420,
  damping: 34,
  mass: 0.8,
};

export const SPRING_OS_GENTLE = {
  type: 'spring',
  stiffness: 310,
  damping: 29,
  mass: 0.9,
};

export const DUR = {
  micro: 0.12,
  ui: 0.22,
  uiExit: 0.15,
  large: 0.34,
  largeExit: 0.22,
};

export const pageTransitionVariants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DUR.ui, ease: EASE_OS_OUT },
  },
  exit: {
    opacity: 0,
    y: -6,
    transition: { duration: DUR.uiExit, ease: EASE_OS_IN },
  },
};

export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerItemVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DUR.ui, ease: EASE_OS_OUT },
  },
};

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.ui, ease: EASE_OS_OUT } },
  exit: { opacity: 0, transition: { duration: DUR.uiExit, ease: EASE_OS_IN } },
};

export const modalPanelVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DUR.large, ease: EASE_OS_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: DUR.uiExit, ease: EASE_OS_IN },
  },
};

export const bottomSheetVariants = {
  hidden: { y: '100%', opacity: 0.6 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: DUR.large, ease: EASE_OS_SHEET },
  },
  exit: {
    y: '100%',
    opacity: 0.6,
    transition: { duration: DUR.largeExit, ease: EASE_OS_IN },
  },
};

export function useMotionPreferences() {
  const osReduced = useReducedMotion();
  const motionLevel = useThemeStore((state) => state.motionLevel);
  const isReduced = Boolean(osReduced || motionLevel === 'reduced');
  const isSubtle = !isReduced && motionLevel === 'subtle';

  return {
    isReduced,
    isSubtle,
    motionLevel: isReduced ? 'reduced' : motionLevel,
    durationScale: isReduced ? 0 : isSubtle ? 0.65 : 1,
  };
}
