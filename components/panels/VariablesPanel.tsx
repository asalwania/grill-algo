"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Frame } from "@/lib/types";

type VariablesPanelProps = {
  frame: Frame;
};

function formatValue(value: string | number | boolean | null): string {
  if (value === null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

/**
 * Reads `frame.changed` (F1's diff, never recomputed here) to decide which
 * row flashes this render — frame 0's `changed` is always `[]`, so nothing
 * flashes on first mount.
 */
function hasChanged(changed: string[], name: string): boolean {
  return changed.includes(`vars.${name}`);
}

export function VariablesPanel({ frame }: VariablesPanelProps) {
  const entries = Object.entries(frame.vars);

  return (
    <div className="rounded-card border border-border-hairline bg-surface-raised px-16 py-14">
      <div className="mb-10 font-mono text-mono-13 tracking-label-wide text-text-muted">
        VARIABLES
      </div>

      <div className="flex flex-col gap-6">
        <AnimatePresence initial={false}>
          {entries.map(([name, value]) => {
            const changed = hasChanged(frame.changed, name);
            return (
              <motion.div
                key={name}
                layout
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="relative flex items-center justify-between overflow-hidden rounded-chip px-10 py-6 font-mono text-mono-13"
              >
                {changed && (
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-signal-violet-fill-strong"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                )}
                <span className="relative text-text-muted">{name}</span>
                <motion.span
                  // Keying on the step forces a fresh mount exactly on the
                  // frame this variable changed, which is what plays the
                  // enter transition; a stable (undefined) key on every other
                  // frame leaves the existing instance alone.
                  key={changed ? frame.step : undefined}
                  className="relative text-text-primary"
                  initial={changed ? { opacity: 0, y: -4 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  {formatValue(value)}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
