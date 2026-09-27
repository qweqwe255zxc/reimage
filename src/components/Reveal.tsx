"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.76, 0, 0.24, 1] as const;

// the mask watches the viewport, not the inner text: clipped text never counts as "in view"
export function Line({ children, delay = 0, show }: { children: ReactNode; delay?: number; show?: boolean }) {
  const trigger =
    show === undefined
      ? { initial: "hidden", whileInView: "shown", viewport: { once: true, margin: "-8% 0px" } }
      : { initial: "hidden", animate: show ? "shown" : "hidden" };
  return (
    <motion.span className="line" {...trigger}>
      <motion.span
        className="line-inner"
        variants={{ hidden: { y: "110%" }, shown: { y: "0%" } }}
        transition={{ duration: 1.1, ease, delay }}
      >
        {children}
      </motion.span>
    </motion.span>
  );
}

export function Fade({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  );
}
