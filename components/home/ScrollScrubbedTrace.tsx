"use client";

import { MotionConfig, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Two Sum specifically, not a generic problem: WATCHED_VARS below names THIS
// problem's variables, so parameterizing the renderer would only have hidden
// what the beat already is. Importing the bound view also keeps the chrome
// (which holds functions) on the client side of the RSC boundary, where the
// server-rendered homepage cannot pass it.
import { TwoSumFlatView } from "@/content/problems/two-sum/TwoSumFlatView";
import type { TwoSumFrame } from "@/lib/types";

/**
 * Beat 3 of the homepage: the algorithm actually steps as you scroll.
 *
 * This is the whole argument for a cinematic homepage, and it is nearly free —
 * AGENTS.md's frames are FULL STATE SNAPSHOTS, so "scroll position -> step
 * index" is the same trivial seek the player already does. Nothing here is
 * hand-animated or faked; it is the shipped optimized trace for the canonical
 * input.
 *
 * Three architectural constraints are load-bearing:
 *
 * 1. NO THREE.JS. The renderer is F16's DOM `TwoSumFlatView`, reused unchanged
 *    — reaching for the R3F scene would put `three` + fiber + drei in the
 *    bundle of the one page whose job is to load instantly for a stranger.
 *
 * 2. NO GSAP. `position: sticky` does the pinning and Framer Motion's
 *    `useScroll` does the scrubbing. AGENTS.md RESERVES GSAP for the homepage;
 *    it does not require it, and nothing here needs it.
 *
 * 3. THE CONTINUOUS VALUE NEVER BECOMES REACT STATE. `scrollYProgress` stays a
 *    MotionValue and is bound straight to the progress bar's `scaleX`; only the
 *    ROUNDED step index is `useState`, and only when it actually changes. Same
 *    rule AGENTS.md imposes on the player, for the same reason.
 *
 * LAYOUT RULE, and the reason this component's shell looks over-built: the
 * sticky pane's content must FILL `h-dvh`, never be centred inside it. A small
 * centred blob is invisible on approach — before the track's top reaches the
 * viewport top the pane sits at the track's top, so a centred child renders
 * half a viewport BELOW the fold and the section reads as a blank void until
 * you have already scrolled past the thing that was supposed to make you
 * scroll. Hence: a fixed header row, a `flex-1 min-h-0` body, a fixed footer
 * row. Nothing here is decorative padding.
 */
/** See the note at the chip row: fixed, so the row's width can't change shape
 *  as the generator introduces variables mid-run. */
const WATCHED_VARS = ["i", "num", "complement", "lookups"] as const;

export function ScrollScrubbedTrace({ frames }: { frames: TwoSumFrame[] }) {
  const track = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const reduced = usePrefersReducedMotion();

  const { scrollYProgress } = useScroll({
    target: track,
    // Pin starts when the tall track's top reaches the viewport top and ends
    // when its bottom reaches the viewport bottom — exactly the span the inner
    // sticky element is stuck for.
    offset: ["start start", "end end"],
  });

  const lastIndex = frames.length - 1;

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    const next = Math.min(lastIndex, Math.max(0, Math.round(progress * lastIndex)));
    setStep((current) => (current === next ? current : next));
  });

  // Under reduced motion the track collapses (motion-reduce:h-auto below), so
  // there is no scroll travel and the scrubbed step would sit at 0 forever —
  // frame 0 is the least interesting frame in the trace. Show the payoff frame
  // instead.
  const shown = reduced ? representativeStep(frames) : step;
  const frame = frames[shown];
  const done = shown === lastIndex;

  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={track}
        className="relative h-[340vh] motion-reduce:h-auto"
        aria-label="Two Sum, stepped through by scrolling"
      >
        <div className="sticky top-0 flex h-dvh flex-col gap-20 py-32 motion-reduce:static motion-reduce:h-auto motion-reduce:py-48">
          {/* --- header: identity + position in the trace ------------------ */}
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between gap-16 font-mono text-mono-13 tracking-label-wide">
              <span className="flex items-center gap-10 text-text-muted">
                <span
                  aria-hidden="true"
                  className="h-8 w-8 rounded-pill bg-signal-cyan shadow-node"
                />
                TWO SUM — OPTIMIZED
              </span>
              <span className="tabular-nums text-text-primary">
                STEP {String(shown + 1).padStart(2, "0")} /{" "}
                {String(frames.length).padStart(2, "0")}
              </span>
            </div>

            {/* The continuous value, bound directly to a style — it never
                round-trips through React. */}
            <div
              aria-hidden="true"
              className="h-px w-full overflow-hidden bg-border-hairline"
            >
              <motion.div
                className="h-px w-full origin-left bg-signal-cyan"
                style={{ scaleX: reduced ? 1 : scrollYProgress }}
              />
            </div>
          </div>

          {/* --- body: fills whatever height is left ----------------------- */}
          <div className="grid min-h-0 flex-1 gap-24 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-48">
            <div className="flex min-h-0 flex-col justify-center gap-16">
              {/* Every word and number lives in the DOM, never in a canvas —
                  AGENTS.md's hard rule, which this beat honours for free by
                  using the flat renderer. */}
              <p
                aria-live="polite"
                className="font-display text-display-24 lg:text-display-32"
              >
                {frame.narration}
              </p>
              <p className="max-w-[520px] text-body-16 text-text-muted">
                {frame.why}
              </p>
              {/* A FIXED key list, not `Object.entries(frame.vars)`. The
                  generator adds keys as the run progresses (`i` and `num` only
                  exist from frame 1, `complement` from frame 2), so mapping the
                  object would grow the row mid-scroll and shove the narration
                  above it. `seen` is deliberately excluded — the map on the
                  right IS that variable, rendered properly. */}
              <div className="flex flex-wrap items-center gap-8 font-mono text-mono-13 text-text-muted-dim">
                <span className="rounded-chip border border-border-hairline px-10 py-4">
                  line <span className="text-text-primary">{frame.line}</span>
                </span>
                {WATCHED_VARS.map((name) => (
                  <span
                    key={name}
                    className="rounded-chip border border-border-hairline px-10 py-4"
                  >
                    {name} ={" "}
                    <span className="text-text-primary">
                      {frame.vars[name] === undefined
                        ? "—"
                        : String(frame.vars[name])}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <div className="min-h-0 overflow-hidden rounded-card border border-border-hairline bg-surface-glass backdrop-blur-panel">
              <TwoSumFlatView frame={frame} floatingControls={false} />
            </div>
          </div>

          {/* --- footer: says what the scroll wheel is doing ---------------- */}
          <div className="flex items-center justify-between gap-16 font-mono text-mono-13 tracking-label-wide text-text-muted-dim">
            <span>{done ? "TRACE COMPLETE" : "KEEP SCROLLING TO STEP"}</span>
            <span className="hidden sm:inline">
              SCROLL UP TO STEP BACKWARDS
            </span>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

/**
 * The frame worth showing when there is no scrolling to do: the one where the
 * answer lands, falling back to the last frame.
 */
function representativeStep(frames: TwoSumFrame[]): number {
  const matched = frames.findIndex((frame) => frame.scene.result !== null);
  return matched === -1 ? frames.length - 1 : matched;
}

/**
 * Deliberately NOT framer-motion's `useReducedMotion`, and deliberately not a
 * lazy `useState` initializer either.
 *
 * `matchMedia` doesn't exist on the server, so any first-render answer other
 * than `false` desyncs server and client HTML. The tracker already records this
 * exact bug once (F16's `FullscreenButton`, where `document.fullscreenEnabled`
 * differed across the boundary and React threw away the whole subtree).
 * Detecting after mount means both renders agree and the preference is applied
 * one tick later.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
}
