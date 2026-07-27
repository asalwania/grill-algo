"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";
import type { Frame } from "@/lib/types";

type NarrationStripProps = {
  frame: Frame;
};

function ChevronIcon() {
  return (
    <svg aria-hidden width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path
        d="M3 2l4 3-4 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Narration line (cross-fades, fixed height so the disclosure below never
 * jumps) plus a collapsible "Why?" showing `frame.why`. Only the narration
 * gets aria-live — announcing the variables panel too on every step would be
 * unbearable for screen reader users.
 */
export function NarrationStrip({ frame }: NarrationStripProps) {
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const whyPanelId = useId();

  return (
    <div className="rounded-card border border-border-hairline bg-surface-raised px-16 py-14">
      <div
        aria-live="polite"
        className="relative h-24 overflow-hidden"
      >
        <AnimatePresence>
          <motion.p
            key={frame.step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="absolute inset-0 overflow-hidden text-ellipsis whitespace-nowrap font-sans text-narration font-medium text-text-primary"
          >
            {frame.narration}
          </motion.p>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => setIsWhyOpen((open) => !open)}
        aria-expanded={isWhyOpen}
        aria-controls={whyPanelId}
        className="mt-10 flex items-center gap-6 font-mono text-mono-13 text-text-muted transition-colors hover:text-text-primary"
      >
        <span
          className={`transition-transform ${isWhyOpen ? "rotate-90" : ""}`}
        >
          <ChevronIcon />
        </span>
        Why?
      </button>

      <AnimatePresence initial={false}>
        {isWhyOpen && (
          <motion.div
            id={whyPanelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <p className="mt-8 font-sans text-narration-sm text-text-muted">
              {frame.why}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
