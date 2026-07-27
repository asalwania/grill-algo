"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Geometry of one rendered line, relative to the measuring frame. */
type LineBox = { top: number; height: number };

type CodePaneProps = {
  /** Shiki output, highlighted at build time. Never re-highlighted here. */
  html: string;
  lineCount: number;
};

function sameBoxes(a: LineBox[], b: LineBox[]): boolean {
  return (
    a.length === b.length &&
    a.every((box, i) => box.top === b[i].top && box.height === b[i].height)
  );
}

export function CodePane({ html, lineCount }: CodePaneProps) {
  const [activeLine, setActiveLine] = useState(1);
  const [boxes, setBoxes] = useState<LineBox[]>([]);
  const frameRef = useRef<HTMLDivElement>(null);

  /**
   * Read the real geometry out of the DOM rather than assuming a fixed row
   * height. Line height depends on the loaded font, the viewport and any
   * wrapped line, none of which are knowable at build time.
   */
  const measure = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const frameTop = frame.getBoundingClientRect().top;
    const next = Array.from(
      frame.querySelectorAll<HTMLElement>("[data-line]"),
    ).map((el) => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top - frameTop, height: rect.height };
    });

    // Bail out when nothing moved. ResizeObserver fires on any observed
    // mutation, and re-setting an equal array would spin.
    setBoxes((prev) => (sameBoxes(prev, next) ? prev : next));
  }, []);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    measure();

    // Observing the frame catches container resizes; observing <code> catches
    // reflows that change total height without changing the frame (font swap,
    // a line starting to wrap).
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    const code = frame.querySelector("code");
    if (code) observer.observe(code);

    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    // next/font uses display: swap, so metrics can change after first paint.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  const box = boxes[activeLine - 1];
  const atStart = activeLine <= 1;
  const atEnd = activeLine >= lineCount;

  return (
    <div className="flex flex-col gap-16">
      <div className="rounded-card border border-border-hairline bg-surface-raised p-20">
        {/* Positioning context for the highlight, and the origin every line
            rect is measured against. It must stay untransformed, or the two
            sets of rects would no longer be in the same coordinate space. */}
        <div ref={frameRef} className="relative">
          {box && (
            <motion.div
              aria-hidden
              layout
              /* Without this, Framer Motion measures on *every* render, so a
                 resize-driven re-measure would animate the highlight sliding to
                 its corrected position. Gating on the line number means resizes
                 snap (correct immediately) and only a line change animates. */
              layoutDependency={activeLine}
              className="pointer-events-none absolute left-0 right-0 border-l-2 border-signal-cyan bg-signal-cyan-fill"
              style={{
                top: box.top,
                height: box.height,
                // Inline so Framer Motion can counteract it while the box is
                // scaled mid-animation; a class-set radius would distort.
                borderRadius: "var(--radius-cell-sm)",
              }}
              transition={{
                type: "spring",
                stiffness: 420,
                damping: 40,
                mass: 0.8,
              }}
            />
          )}

          {/* Static markup from Shiki. Inert, read-only, no client
              highlighter. `relative` only so it paints above the highlight. */}
          <div className="relative" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>

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
