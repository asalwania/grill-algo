"use client";

import { useState, type ReactNode } from "react";
import { ActiveLineBar } from "@/components/panels/ActiveLineBar";

type HarnessProps = {
  lineCount: number;
  children: ReactNode;
};

/**
 * Temporary — the real player (useReducer + context) isn't wired up yet.
 * Stands in for step navigation so the active-line bar can be exercised.
 */
export function Harness({ lineCount, children }: HarnessProps) {
  const [activeLine, setActiveLine] = useState(1);
  const atStart = activeLine <= 1;
  const atEnd = activeLine >= lineCount;

  return (
    <div className="flex flex-col gap-16">
      <ActiveLineBar activeLine={activeLine}>{children}</ActiveLineBar>

      <div className="flex items-center gap-10">
        <button
          type="button"
          onClick={() => setActiveLine((line) => Math.max(1, line - 1))}
          disabled={atStart}
          className="rounded-control border border-border-hairline bg-surface-raised px-14 py-8 font-mono text-mono-13 text-text-primary disabled:text-text-muted-dim"
        >
          prev
        </button>
        <button
          type="button"
          onClick={() => setActiveLine((line) => Math.min(lineCount, line + 1))}
          disabled={atEnd}
          className="rounded-control border border-border-hairline bg-surface-raised px-14 py-8 font-mono text-mono-13 text-text-primary disabled:text-text-muted-dim"
        >
          next
        </button>
        <p
          aria-live="polite"
          className="font-mono text-mono-13 text-text-muted tracking-label"
        >
          line {activeLine} / {lineCount}
        </p>
      </div>
    </div>
  );
}
