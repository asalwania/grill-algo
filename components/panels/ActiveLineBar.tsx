"use client";

import { motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

/** Geometry of one rendered line, relative to the measuring frame. */
type LineBox = { top: number; height: number };

type ActiveLineBarProps = {
  /** 1-based line to highlight. Controlled — the player reducer will drive
   *  this once it's wired up; this component holds no step state of its own. */
  activeLine: number;
  /** Server-rendered markup carrying `[data-line]` elements (CodePane's
   *  output). Static and read-only; this component only measures it. */
  children: ReactNode;
};

function sameBoxes(a: LineBox[], b: LineBox[]): boolean {
  return (
    a.length === b.length &&
    a.every((box, i) => box.top === b[i].top && box.height === b[i].height)
  );
}

/**
 * Overlays an animated highlight bar on top of statically-rendered code.
 * Approach is settled in docs/spikes/SP2-shiki-active-line-bar.md: measure
 * line geometry from the DOM (never compute it), gate the Framer Motion
 * layout snapshot on `layoutDependency={activeLine}` so a resize snaps
 * instead of sliding, and rely on CodePane/lib/highlight.ts having already
 * stripped Shiki's `\n` text nodes so line boxes are adjacent.
 */
export function ActiveLineBar({ activeLine, children }: ActiveLineBarProps) {
  const [boxes, setBoxes] = useState<LineBox[]>([]);
  const frameRef = useRef<HTMLDivElement>(null);

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
    // reflows that change total height without changing the frame.
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

  return (
    <div ref={frameRef} className="relative">
      {box && (
        <motion.div
          aria-hidden
          layout
          layoutDependency={activeLine}
          className="pointer-events-none absolute left-0 right-0 z-10 border-y border-signal-cyan-border border-l-[3px] border-l-signal-cyan bg-signal-cyan/12 shadow-[0_0_24px_var(--color-signal-cyan-fill-strong)]"
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

      {/* CodePane's card paints an opaque `bg-surface-raised`, so a bar in
          normal document flow behind it is fully occluded (the reason the
          highlight never showed). The bar is lifted above the card with
          `z-10` instead and kept translucent + pointer-events-none, so the
          highlighted text still reads through the tint and text selection is
          never blocked. */}
      <div className="relative">{children}</div>
    </div>
  );
}
