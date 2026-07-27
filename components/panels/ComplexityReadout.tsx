"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePlayerState } from "@/components/player";

const COMPLEXITY = {
  brute: { time: "O(n²)", space: "O(1)" },
  optimized: { time: "O(n)", space: "O(n)" },
} as const;

/**
 * F13 — cross-fades with the approach toggle (ApproachTabs). Fixed height so
 * nothing around it shifts mid-transition, same rationale as NarrationStrip's
 * own fixed-height narration line.
 */
export function ComplexityReadout() {
  const { approach } = usePlayerState();
  const { time, space } = COMPLEXITY[approach];

  return (
    <div className="relative h-20 overflow-hidden font-mono text-mono-13 tracking-label-wide text-text-muted">
      <AnimatePresence>
        <motion.div
          key={approach}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="absolute inset-0 flex items-center gap-10"
        >
          <span className="text-text-primary">{time}</span>
          <span>time</span>
          <span aria-hidden className="text-border-idle">
            /
          </span>
          <span className="text-text-primary">{space}</span>
          <span>space</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
