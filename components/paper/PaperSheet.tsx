"use client";

import { useEffect, useReducer, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";

import type { PaperStroke } from "@/lib/types";

/**
 * A sheet of ruled paper, inked one stroke at a time.
 *
 * Shared across every problem that ships a `paper.ts`, and it knows NOTHING
 * about any of them — it knows how a pen looks, and that is all. The strokes
 * arrive as plain data from the server, so the problem's generator never
 * enters the browser bundle; same discipline as the shipped frames.
 *
 * The rules are real rules. `--rule` is the line pitch, every block is
 * `line-height: var(--rule)` and every gap a multiple of it, so the writing
 * sits ON the lines rather than drifting across them. Change it in one place
 * or not at all.
 */

/** How long the pen spends on each kind of stroke, in ms at 1x. */
function penMs(stroke: PaperStroke): number {
  switch (stroke.kind) {
    case "title":
      return 1000;
    case "section":
      return 750;
    case "case":
      return 620;
    case "grid":
      return 900;
    case "row":
      return stroke.hit ? 1150 : 780;
    case "verdict":
      return 1300;
    case "aside":
      // Prose is read, not glanced at — paced by length so the long red
      // warnings do not flash past.
      return Math.min(2800, Math.max(900, stroke.text.length * 26));
  }
}

type State = { inked: number; playing: boolean; speed: number };

type Action =
  | { type: "tick" }
  | { type: "toggle" }
  | { type: "step"; by: number }
  | { type: "restart" }
  | { type: "speed"; to: number };

function reducer(state: State, action: Action, total: number): State {
  switch (action.type) {
    case "tick":
      return state.inked >= total
        ? { ...state, playing: false }
        : { ...state, inked: state.inked + 1 };
    case "toggle":
      // Hitting play on a finished sheet starts it over rather than doing
      // nothing — the most likely thing you want from that button.
      return state.inked >= total
        ? { ...state, inked: 0, playing: true }
        : { ...state, playing: !state.playing };
    case "step":
      return {
        ...state,
        playing: false,
        inked: Math.min(total, Math.max(0, state.inked + action.by)),
      };
    case "restart":
      return { ...state, inked: 0, playing: false };
    case "speed":
      return { ...state, speed: action.to };
  }
}

export function PaperSheet({
  strokes,
  autoPlay = true,
  className = "",
}: {
  strokes: PaperStroke[];
  autoPlay?: boolean;
  className?: string;
}) {
  const total = strokes.length;
  const [state, dispatch] = useReducer(
    (s: State, a: Action) => reducer(s, a, total),
    { inked: 0, playing: autoPlay, speed: 1 },
  );
  const reduced = useReducedMotion();
  const tipRef = useRef<HTMLDivElement>(null);

  const next = strokes[state.inked];

  useEffect(() => {
    if (!state.playing || !next) return;
    const id = setTimeout(
      () => dispatch({ type: "tick" }),
      penMs(next) / state.speed,
    );
    return () => clearTimeout(id);
  }, [state.playing, state.speed, state.inked, next]);

  // Keep the pen in view as the sheet grows past the fold. `nearest` so it
  // only scrolls when the tip has actually left the box.
  useEffect(() => {
    tipRef.current?.scrollIntoView({
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [state.inked, reduced]);

  const done = state.inked >= total;

  return (
    <div className={`flex flex-col items-center gap-20 ${className}`}>
      <PaperControls
        state={state}
        total={total}
        done={done}
        dispatch={dispatch}
        label={next ? next.kind : "done"}
      />

      <div
        className="relative w-full max-w-[900px] rotate-[-0.25deg] rounded-[3px] px-24 pb-48 pt-40 shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:px-56"
        style={{
          // The pitch everything else is a multiple of.
          ["--rule" as string]: "34px",
          fontFamily: "var(--font-hand), ui-rounded, cursive",
          color: "#26324d",
          backgroundColor: "#f6f2e7",
          backgroundImage: [
            // ruled lines
            "repeating-linear-gradient(to bottom, transparent 0, transparent calc(var(--rule) - 1px), rgba(64,104,158,0.17) calc(var(--rule) - 1px), rgba(64,104,158,0.17) var(--rule))",
            // the double margin rule, in red like a real pad
            "linear-gradient(to right, transparent 0 62px, rgba(196,72,62,0.34) 62px 63px, transparent 63px 66px, rgba(196,72,62,0.34) 66px 67px, transparent 67px)",
            // paper tone — a little warmth off the top corner
            "radial-gradient(120% 80% at 12% 0%, rgba(255,255,255,0.6), transparent 60%)",
          ].join(","),
          backgroundPosition: "0 6px, 0 0, 0 0",
        }}
      >
        <div className="pl-16 sm:pl-24">
          {strokes.slice(0, state.inked).map((stroke, i) => (
            <Ink
              key={stroke.id}
              // Only the stroke currently being laid down animates. Everything
              // above it is already dry, so a re-render must not re-write the
              // whole page.
              fresh={i === state.inked - 1}
              reduced={!!reduced}
              ms={penMs(stroke) / state.speed}
            >
              <Stroke stroke={stroke} />
            </Ink>
          ))}
          <div ref={tipRef} className="h-[var(--rule)]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* the ink                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The pen stroke itself: a left-to-right clip wipe.
 *
 * Deliberately NOT an SVG path trace — that means authoring letterforms, and
 * the text here is real, selectable, screen-readable text. A wipe at writing
 * speed reads as a hand crossing the page and costs one animated property.
 *
 * There is no pen sprite riding the wipe. A sprite has to be positioned from a
 * measured rect and desynchronises the moment a line wraps; the wipe edge is
 * already the tip.
 */
function Ink({
  children,
  fresh,
  reduced,
  ms,
}: {
  children: React.ReactNode;
  fresh: boolean;
  reduced: boolean;
  ms: number;
}) {
  if (!fresh || reduced) return <div>{children}</div>;

  return (
    <motion.div
      initial={{ clipPath: "inset(0 100% -20% 0)", opacity: 0.4 }}
      animate={{ clipPath: "inset(0 -4% -20% 0)", opacity: 1 }}
      transition={{
        clipPath: { duration: (ms * 0.82) / 1000, ease: [0.25, 0.5, 0.5, 1] },
        opacity: { duration: 0.12 },
      }}
    >
      {children}
    </motion.div>
  );
}

const RULE = "leading-[var(--rule)]";

function Stroke({ stroke }: { stroke: PaperStroke }) {
  switch (stroke.kind) {
    case "title":
      return (
        <div className="mb-[var(--rule)]">
          <div
            className={`${RULE} text-[30px]`}
            style={{ textDecoration: "underline", textUnderlineOffset: "6px" }}
          >
            {stroke.text}
          </div>
          <div className={`${RULE} text-[19px] opacity-70`}>{stroke.sub}</div>
        </div>
      );

    case "section":
      return (
        <div className="mt-[var(--rule)]">
          <div className={`${RULE} text-[24px]`}>
            <span style={{ color: "#c4483e" }}>{stroke.step})</span>{" "}
            {stroke.text}
          </div>
          <div className={`${RULE} text-[19px] opacity-65`}>{stroke.hint}</div>
        </div>
      );

    case "case":
      return (
        <div
          className={`${RULE} grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-12 text-[21px] sm:grid-cols-[200px_22px_58px_minmax(0,1fr)]`}
        >
          <span className="tabular-nums">{stroke.input}</span>
          <span className="hidden opacity-55 sm:inline" aria-hidden="true">
            →
          </span>
          <span
            className="hidden sm:inline"
            style={{ color: stroke.expected === "true" ? "#1f7a4d" : "#26324d" }}
          >
            {stroke.expected}
          </span>
          <span
            className="text-right text-[17px]"
            style={{ color: "#c4483e", opacity: 0.85 }}
          >
            {stroke.tag}
          </span>
        </div>
      );

    case "grid":
      return (
        <div className="mt-[var(--rule)]">
          <div className={`${RULE} text-[18px] opacity-70`}>
            {stroke.caption}
          </div>
          <Row cells={stroke.columns} head />
        </div>
      );

    case "row":
      return <Row cells={stroke.cells} hit={stroke.hit} />;

    case "verdict":
      return (
        <div
          className={`${RULE} mt-[var(--rule)] text-[24px]`}
          style={{ color: stroke.ok ? "#1f7a4d" : "#c4483e" }}
        >
          <span
            className="inline-block px-12"
            style={{
              // The circle you draw round the answer, at a hand's angle.
              border: "2px solid currentColor",
              borderRadius: "48% 52% 47% 53% / 60% 58% 42% 40%",
              transform: "rotate(-0.8deg)",
            }}
          >
            {stroke.text}
          </span>
          <span className="ml-12">{stroke.ok ? "✓ matches" : "✗ MISMATCH"}</span>
        </div>
      );

    case "aside":
      return (
        <div
          className={`${RULE} py-[calc(var(--rule)/4)] text-[18px]`}
          style={{
            color: stroke.pen === "red" ? "#c4483e" : "#26324d",
            opacity: stroke.pen === "red" ? 0.95 : 0.78,
          }}
        >
          {stroke.pen === "red" ? "⟵ " : ""}
          {stroke.text}
        </div>
      );
  }
}

/** One line of the table. `head` draws the column names and the double rule. */
function Row({
  cells,
  head = false,
  hit = false,
}: {
  cells: string[];
  head?: boolean;
  hit?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-[30px_66px_minmax(0,1.5fr)_66px_minmax(0,1.6fr)] items-center sm:grid-cols-[34px_74px_minmax(0,1.5fr)_74px_minmax(0,1.6fr)]"
      style={{
        borderBottom: head ? "2px solid #26324d" : "1px solid rgba(38,50,77,.2)",
        color: hit ? "#c4483e" : undefined,
      }}
    >
      {cells.map((cell, i) => (
        <span
          key={i}
          className={`${RULE} truncate px-6 text-[17px] sm:px-8 sm:text-[19px]`}
          style={{
            borderLeft: i === 0 ? undefined : "1px solid rgba(38,50,77,.2)",
            opacity: head ? 0.6 : 1,
            fontSize: head ? "15px" : undefined,
          }}
        >
          {cell}
        </span>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* controls — site chrome, not paper                                          */
/* -------------------------------------------------------------------------- */

const BTN =
  "rounded-control border border-border-hairline bg-surface-raised px-12 py-8 font-mono text-mono-13 text-text-muted transition-colors hover:border-signal-cyan-border hover:text-text-primary disabled:opacity-35 disabled:hover:border-border-hairline disabled:hover:text-text-muted";

function PaperControls({
  state,
  total,
  done,
  dispatch,
  label,
}: {
  state: State;
  total: number;
  done: boolean;
  dispatch: React.Dispatch<Action>;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      <button
        className={BTN}
        onClick={() => dispatch({ type: "step", by: -1 })}
        disabled={state.inked === 0}
      >
        <span aria-hidden="true">◀</span> back
      </button>
      <button className={BTN} onClick={() => dispatch({ type: "toggle" })}>
        {state.playing ? "❚❚ pause" : done ? "↺ again" : "▶ write"}
      </button>
      <button
        className={BTN}
        onClick={() => dispatch({ type: "step", by: 1 })}
        disabled={done}
      >
        forward <span aria-hidden="true">▶</span>
      </button>
      <button
        className={BTN}
        onClick={() => dispatch({ type: "restart" })}
        disabled={state.inked === 0}
      >
        ↺ blank sheet
      </button>

      <div className="flex items-center gap-4">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            aria-pressed={state.speed === s}
            className={`${BTN} ${state.speed === s ? "!border-signal-cyan-border !text-signal-cyan" : ""}`}
            onClick={() => dispatch({ type: "speed", to: s })}
          >
            {s}×
          </button>
        ))}
      </div>

      <span
        aria-live="polite"
        className="font-mono text-mono-13 text-text-muted-dim tabular-nums"
      >
        {state.inked} / {total} · {done ? "done" : label}
      </span>
    </div>
  );
}
