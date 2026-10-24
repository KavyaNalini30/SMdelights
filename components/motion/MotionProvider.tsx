"use client";

import { LazyMotion, domAnimation } from "motion/react";
import type { ReactNode } from "react";

/**
 * Loads only the Motion features the site uses (fades, slides, hover/tap, exit).
 * Components use `m.div` instead of `motion.div`; `strict` flags any accidental full import.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
