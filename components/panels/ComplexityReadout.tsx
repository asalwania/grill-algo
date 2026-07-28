"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePlayerState } from "@/components/player";
import type { Approach } from "@/lib/types";

type ComplexityReadoutProps = {
  /**
   * Time/space per approach, from the problem's own chrome.
   *
   * Problem-specific rather than a shared table, even where two problems
   * happen to agree: Contains Duplicate's sort-and-scan is O(n log n)/O(1),
   * a figure nothing global could have supplied.
   */
  complexity: Partial<Record<Approach, { time: string; space: string }>>;
};

/**
 * F13 — cross-fades with the approach toggle (ApproachTabs). Fixed height so
 * nothing around it shifts mid-transition, same rationale as NarrationStrip's
 * own fixed-height narration line.
 */
export function ComplexityReadout({ complexity }: ComplexityReadoutProps) {
  const { approach } = usePlayerState();
  const entry = complexity[approach];

  // An approach with no declared complexity renders the empty (fixed-height)
  // box rather than collapsing, so the header row's height never depends on
  // how complete a problem's chrome is.
  if (!entry) {
    return (
      <div className="relative h-20 overflow-hidden font-mono text-mono-13 tracking-label-wide text-text-muted" />
    );
  }

  const { time, space } = entry;

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
