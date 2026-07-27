"use client";

import { usePlayerDispatch, usePlayerState } from "./PlayerProvider";
import type { Approach } from "@/lib/types";

const TABS: { value: Approach; label: string }[] = [
  { value: "optimized", label: "Optimized" },
  { value: "brute", label: "Brute Force" },
];

const TAB_BASE =
  "flex h-[36px] items-center justify-center rounded-pill px-16 font-mono text-mono-13 tracking-label-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";
const TAB_ACTIVE =
  "border border-signal-cyan-border-mid bg-signal-cyan-fill text-signal-cyan";
const TAB_INACTIVE =
  "border border-border-hairline bg-transparent text-text-muted hover:border-signal-cyan-border-mid hover:text-text-primary";

/**
 * F13 — the Brute Force / Optimized toggle. Dispatch-only: swapping the frame
 * array and code listing both fall out of `state.approach` downstream
 * (PlayerProvider's SET_APPROACH already clamps `step` to the new approach's
 * frame count), so this component's only job is rendering the tabs and
 * reading `approach` back for active styling.
 */
export function ApproachTabs() {
  const { approach } = usePlayerState();
  const dispatch = usePlayerDispatch();

  return (
    <div role="tablist" aria-label="Approach" className="flex items-center gap-8">
      {TABS.map((tab) => {
        const isActive = approach === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => dispatch({ type: "SET_APPROACH", approach: tab.value })}
            className={`${TAB_BASE} ${isActive ? TAB_ACTIVE : TAB_INACTIVE}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
