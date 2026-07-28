"use client";

import { useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { usePlayerState } from "@/components/player";
import type { Approach, Language } from "@/lib/types";
import { ActiveLineBar } from "./ActiveLineBar";

type CodePaneStackProps = {
  /** Pre-highlighted CodePane output (server-rendered, build-time Shiki) for
   *  every approach x language combination — F14's languages all ship in the
   *  payload; only one is ever visible, picked by `state.approach`/`state.language`. */
  panes: Record<Approach, Record<Language, ReactNode>>;
  /** Canonical trace line -> this listing's line, per F14's Solution.lineMap. */
  lineMaps: Record<Approach, Record<Language, Record<number, number>>>;
  /** `frame.line` for every step, per approach — the only piece of the frame
   *  array this component actually needs, kept as plain numbers rather than
   *  full Frame objects so it stays decoupled from the scene's TScene shape. */
  lines: Record<Approach, number[]>;
  className?: string;
  style?: CSSProperties;
};

// How long a manual scroll suppresses auto-centering (F15: "skipped when the
// user has scrolled manually in the last few seconds").
const MANUAL_SCROLL_PAUSE_MS = 4000;
// Generous upper bound on how long our own smooth scrollBy's scroll events
// keep firing — used to tell "we caused this scroll event" apart from a real
// user scroll without needing to diff scrollTop on every event.
const PROGRAMMATIC_SCROLL_WINDOW_MS = 700;

/**
 * F15 — wraps the active language/approach's code pane in ActiveLineBar and
 * keeps the active line vertically centred as steps advance, without fighting
 * a user who is reading elsewhere in the listing.
 */
export function CodePaneStack({
  panes,
  lineMaps,
  lines,
  className = "",
  style,
}: CodePaneStackProps) {
  const { approach, language, step } = usePlayerState();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastManualScrollAt = useRef(0);
  const programmaticScrollUntil = useRef(0);

  const approachLines = lines[approach];
  const canonicalLine = approachLines[Math.min(step, approachLines.length - 1)];
  const activeLine = lineMaps[approach][language][canonicalLine] ?? 1;
  const pane = panes[approach][language];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (Date.now() - lastManualScrollAt.current < MANUAL_SCROLL_PAUSE_MS) return;

    const target = container.querySelector<HTMLElement>(`[data-line="${activeLine}"]`);
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const delta =
      targetRect.top + targetRect.height / 2 - (containerRect.top + containerRect.height / 2);
    if (Math.abs(delta) < 1) return;

    programmaticScrollUntil.current = Date.now() + PROGRAMMATIC_SCROLL_WINDOW_MS;
    container.scrollBy({ top: delta, behavior: "smooth" });
  }, [activeLine]);

  const handleScroll = useCallback(() => {
    if (Date.now() < programmaticScrollUntil.current) return;
    lastManualScrollAt.current = Date.now();
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`min-h-0 ${className}`}
      style={style}
    >
      <ActiveLineBar activeLine={activeLine}>{pane}</ActiveLineBar>
    </div>
  );
}
