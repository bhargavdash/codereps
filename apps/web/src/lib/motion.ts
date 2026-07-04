import type { Transition, Variants } from "motion/react";

/**
 * Shared motion presets. State-only, ease-out, 150–250ms.
 * Reduced motion is handled at call sites via `useReducedMotion()`.
 */

export const easeOutQuart: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export const tFast: Transition = { duration: 0.18, ease: easeOutQuart };
export const tBase: Transition = { duration: 0.24, ease: easeOutQuart };

/** A rep result revealing after submit — verdict, then evidence. */
export const revealUp: Variants = {
  hidden: { opacity: 0, y: 7 },
  show: { opacity: 1, y: 0, transition: tBase },
};

/** Splits landing one by one, like lap times posting. */
export const splitList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065 } },
};
export const splitItem: Variants = {
  hidden: { opacity: 0, y: 7 },
  show: { opacity: 1, y: 0, transition: tBase },
};

/** The PR stamp — the one allowed celebration, a single scale-settle. */
export const prStamp: Variants = {
  hidden: { opacity: 0, scale: 1.12, rotate: -4 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: -4,
    transition: { duration: 0.34, ease: easeOutQuart },
  },
};
