"use client";

import { usePlayerDispatch, usePlayerState } from "./PlayerProvider";
import type { Approach } from "@/lib/types";

/**
 * Display name per approach. A lookup table rather than a list, because WHICH
 * approaches appear — and in what order — is a per-problem fact that arrives
 * as a prop (lib/types.ts); only their names are global.
 */
const APPROACH_LABELS: Record<Approach, string> = {
  optimized: "Optimized",
  sorted: "Sort + Scan",
  brute: "Brute Force",
};

const TAB_BASE =
  "flex h-[36px] items-center justify-center rounded-pill px-16 font-mono text-mono-13 tracking-label-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";
const TAB_ACTIVE =
  "border border-signal-cyan-border-mid bg-signal-cyan-fill text-signal-cyan";
const TAB_INACTIVE =
  "border border-border-hairline bg-transparent text-text-muted hover:border-signal-cyan-border-mid hover:text-text-primary";

type ApproachTabsProps = {
  /** The approaches this problem ships, in tab order. From approaches.json —
   *  never the full `Approach` union, which is what ANY problem could offer
   *  rather than what this one does. */
  approaches: Approach[];
};

/**
 * F13 — the approach toggle. Dispatch-only: swapping the frame array and code
 * listing both fall out of `state.approach` downstream (PlayerProvider's
 * SET_APPROACH already clamps `step` to the new approach's frame count), so
 * this component's only job is rendering the tabs and reading `approach` back
 * for active styling.
 *
 * Renders exactly what it is given, which is also what makes the problem
 * view's fallback unreachable: no tab can ever dispatch an approach the
 * problem did not build.
 */
export function ApproachTabs({ approaches }: ApproachTabsProps) {
  const { approach } = usePlayerState();
  const dispatch = usePlayerDispatch();

  return (
    <div role="tablist" aria-label="Approach" className="flex items-center gap-8">
      {approaches.map((value) => {
        const isActive = approach === value;
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => dispatch({ type: "SET_APPROACH", approach: value })}
            className={`${TAB_BASE} ${isActive ? TAB_ACTIVE : TAB_INACTIVE}`}
          >
            {APPROACH_LABELS[value]}
          </button>
        );
      })}
    </div>
  );
}
