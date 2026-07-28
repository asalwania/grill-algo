"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import type { SlotState, TileState, TwoSumFrame } from "@/lib/types";

type TwoSumFlatViewProps = {
  /** The full frame snapshot for the current step. Same object the 3D scene
   *  reads — this view derives everything from it and owns no state of its own,
   *  so 2D and 3D can never disagree about what step they are showing. */
  frame: TwoSumFrame;
  /** Rendered because WebGL is missing rather than because the user asked for
   *  2D — adds the S5 mock's "3D unavailable" note. */
  isFallback?: boolean;
  /**
   * Appended to the end of the stack. ScenePanel puts the VariablesPanel here
   * rather than floating it over this view the way it does over the canvas:
   * the 3D scene has dead space in its lower-left corner to float a card into,
   * and a flat document laid out top-down does not.
   */
  children?: ReactNode;
  /**
   * Whether ScenePanel's buttons are floating over this view. The generous
   * vertical padding and the header row's right inset exist ONLY to keep rows
   * clear of the fullscreen toggle (top-right) and the render-mode toggle
   * (bottom-right). The homepage renders this view bare, where that padding is
   * just dead space at the top of the card.
   */
  floatingControls?: boolean;
  className?: string;
};

// ---------------------------------------------------------------------------
// Column geometry
// ---------------------------------------------------------------------------

// Gap between array cells, in px. Duplicated as a number (not just a `gap-8`
// class) because the connector maths below has to subtract the gutters out of
// the 100% track width to find a cell's centre.
const CELL_GAP = 8;

/** Width of one array cell, as a CSS length. */
function cellWidth(count: number): string {
  return `((100% - ${(count - 1) * CELL_GAP}px) / ${count})`;
}

/**
 * Distance between the left edges of adjacent cells — cell width plus one
 * gutter. `columnCenter` builds on this, which is what lets the connector line
 * be positioned in pure CSS: every cell in the grid is exactly `1fr`, so the
 * geometry is known without measuring a single DOM node (no ResizeObserver, no
 * layout read, nothing to re-sync on a container resize).
 */
function columnPitch(count: number): string {
  return `(${cellWidth(count)} + ${CELL_GAP}px)`;
}

/** Horizontal centre of cell `index`, relative to the track's left edge. */
function columnCenter(index: number, count: number): string {
  return `calc(${index} * ${columnPitch(count)} + ${cellWidth(count)} / 2)`;
}

/** Horizontal span between the centres of two cells. */
function columnSpan(from: number, to: number, count: number): string {
  return `calc(${Math.abs(to - from)} * ${columnPitch(count)})`;
}

// ---------------------------------------------------------------------------
// State -> styling
// ---------------------------------------------------------------------------

// The 3D scene expresses these states as material colour + emissive intensity
// (scene.tsx's COLOR_*/EMISSIVE_* constants, which are the design tokens'
// hexes). Here the same four states map onto the token set's fill/border/glow
// tiers, so a tile means the same thing in either mode.
const TILE_STYLES: Record<TileState, string> = {
  idle: "border-border-idle bg-surface-raised text-text-primary",
  active:
    "border-signal-cyan-border-strong bg-signal-cyan-fill text-signal-cyan shadow-tile-active",
  done: "border-signal-violet-border bg-signal-violet-fill text-signal-violet-on shadow-tile-done",
  match:
    "border-signal-green-border bg-signal-green-fill-strong text-signal-green-on",
};

const INDEX_STYLES: Record<TileState, string> = {
  idle: "text-text-muted-dim",
  active: "text-signal-cyan",
  done: "text-signal-violet-on",
  match: "text-signal-green-on",
};

const SLOT_STYLES: Record<SlotState, string> = {
  empty: "border-border-idle-slot bg-surface-raised text-text-muted",
  filled:
    "border-signal-violet-border bg-signal-violet-fill text-signal-violet-on",
  probed: "border-signal-cyan-border-mid bg-signal-cyan-fill text-signal-cyan",
  hit: "border-signal-green-border bg-signal-green-fill-strong text-signal-green-on",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-mono-13 tracking-label-wide text-text-muted">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Array row
// ---------------------------------------------------------------------------

/**
 * `link` is only drawn tile-to-tile, and only when `slots` is empty — in the
 * optimized trace `link`'s second index is a WALL SLOT index, not a tile index
 * (lib/types.ts), so drawing it across this row would connect two unrelated
 * cells. Optimized's probe is shown against the map section instead, which is
 * where it actually points.
 */
function CompareConnector({
  link,
  count,
}: {
  link: [number, number];
  count: number;
}) {
  const [from, to] = link;
  const left = from <= to ? from : to;
  return (
    <>
      <span
        aria-hidden
        className="absolute bottom-0 h-12 w-px bg-signal-cyan-border-strong"
        style={{ left: columnCenter(from, count) }}
      />
      <span
        aria-hidden
        className="absolute bottom-0 h-12 w-px bg-signal-cyan-border-strong"
        style={{ left: columnCenter(to, count) }}
      />
      <span
        aria-hidden
        className="absolute bottom-12 h-px bg-signal-cyan-border-strong"
        style={{
          left: columnCenter(left, count),
          width: columnSpan(from, to, count),
        }}
      />
    </>
  );
}

function ArrayRow({ frame }: { frame: TwoSumFrame }) {
  const { nums, tiles, cursor, link, slots } = frame.scene;
  const count = nums.length;
  const trackStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
    columnGap: `${CELL_GAP}px`,
  };
  const showConnector = link !== null && slots.length === 0;

  return (
    <div>
      {/* Reserved whether or not a connector is drawn, so the row never shifts
          vertically between the frames that have one and the frames that don't. */}
      <div className="relative h-20">
        {showConnector && link && (
          <CompareConnector link={link} count={count} />
        )}
      </div>

      <ul style={trackStyle} className="list-none">
        {nums.map((value, index) => {
          const state = tiles[index] ?? "idle";
          return (
            <li key={index} className="flex flex-col items-center gap-4">
              <div
                className={`flex h-48 w-full items-center justify-center rounded-control border font-mono text-body-16 font-medium transition-colors ${TILE_STYLES[state]}`}
              >
                {value}
              </div>
              <span
                className={`font-mono text-mono-13 tracking-label transition-colors ${INDEX_STYLES[state]}`}
              >
                {index}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Same reserved-height trick as the connector, for the cursor caret. */}
      <div className="relative h-12">
        {cursor !== null && (
          <motion.span
            aria-hidden
            layout
            className="absolute top-0 h-8 w-8 -translate-x-1/2 rotate-45 border-l border-t border-signal-cyan bg-signal-cyan"
            style={{ left: columnCenter(cursor, count) }}
            transition={{ duration: 0.18 }}
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hash map
// ---------------------------------------------------------------------------

/**
 * Resolved the way lib/types.ts prescribes and LookupBeam already does:
 * `probe` is the KEY being looked up, never a slot index, so a miss simply has
 * no row to point at. Unlike the beam this view has no reason to freeze the
 * answer — it re-derives per render against the frame it is handed, and every
 * frame is a full snapshot.
 */
function probedSlotIndex(probe: number | null, keys: number[]): number {
  if (probe === null) return -1;
  return keys.indexOf(probe);
}

function HashMapSection({ frame }: { frame: TwoSumFrame }) {
  const { slots, probe } = frame.scene;
  const hitIndex = probedSlotIndex(
    probe,
    slots.map((slot) => slot.key),
  );

  return (
    <section className="flex flex-col gap-10">
      <div className="flex items-baseline justify-between gap-12">
        <SectionLabel>SEEN — value → index</SectionLabel>
        {probe !== null && (
          <span
            className={`rounded-pill border px-10 py-4 font-mono text-mono-13 ${
              hitIndex === -1
                ? "border-border-hairline bg-surface-raised text-text-muted"
                : "border-signal-green-border bg-signal-green-fill text-signal-green-on"
            }`}
          >
            {hitIndex === -1 ? `${probe} not seen` : `${probe} found`}
          </span>
        )}
      </div>

      <ul className="flex list-none flex-col gap-4">
        <AnimatePresence initial={false}>
          {slots.map((slot, index) => {
            // The frame's own `state` wins when the trace bothers to set
            // anything beyond "filled"; the probe overlay is derived here so a
            // hit lights up without the generator having to re-stamp every
            // slot's state on every lookup frame.
            const state: SlotState = index === hitIndex ? "hit" : slot.state;
            return (
              <motion.li
                key={slot.key}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className={`flex items-center justify-between rounded-chip border px-12 py-10 font-mono text-mono-13 transition-colors ${SLOT_STYLES[state]}`}
              >
                <span>{slot.key}</span>
                <span aria-hidden className="text-text-muted">
                  →
                </span>
                <span>{slot.value}</span>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {slots.length === 0 && (
          <li className="rounded-chip border border-border-idle-slot bg-surface-raised px-12 py-10 font-mono text-mono-13 text-text-muted-dim">
            empty
          </li>
        )}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------

/**
 * F16's flat view — the 2D half of the render-mode toggle, and the no-WebGL
 * fallback. No Canvas, no camera, no projected label layer: every value is
 * ordinary DOM text at its natural size, which is the whole point (in 3D the
 * numbers sit over lit, emissive tiles and shrink with distance).
 *
 * Reads the frame directly rather than the frames array. It has no playback
 * loop, no interpolation and nothing to damp, so there is no reason for it to
 * know the trace exists — "each frame is a full state snapshot" (AGENTS.md) is
 * exactly what makes a second renderer this cheap.
 */
export function TwoSumFlatView({
  frame,
  isFallback = false,
  children,
  floatingControls = true,
  className = "",
}: TwoSumFlatViewProps) {
  const { target, slots, result } = frame.scene;
  // Presence of a map is an APPROACH-level fact, and `slots` is empty on the
  // optimized trace's own first frames too — so this section would flicker in
  // if keyed on the current frame. Keyed on `probe`/`slots` history isn't
  // available here either (one frame, by design), so the trace's own signal is
  // used: optimized frames always carry a probe or slots by the time the map
  // matters, and brute frames carry neither, ever.
  const hasMap = slots.length > 0 || frame.scene.probe !== null;

  return (
    // py-56 / lg:pb-64 keeps the first and last rows clear of the fullscreen
    // and render-mode toggles ScenePanel floats in this panel's corners.
    <div
      className={`flex h-full w-full flex-col gap-20 overflow-auto p-20 lg:p-24 ${
        floatingControls ? "py-56 lg:pb-64" : ""
      } ${className}`}
    >
      {/* pr-* clears the fullscreen toggle ScenePanel floats in this panel's
          top-right corner (32px button inset 12px / lg:16px from the edge,
          minus this container's own 20px / lg:24px padding). */}
      <div
        className={`flex items-baseline justify-between gap-12 ${
          floatingControls ? "pr-32" : ""
        }`}
      >
        <SectionLabel>ARRAY</SectionLabel>
        <span className="font-mono text-mono-13 text-text-muted">
          target = <span className="text-text-primary">{target}</span>
        </span>
      </div>

      <ArrayRow frame={frame} />

      {hasMap && <HashMapSection frame={frame} />}

      {result && (
        <div className="rounded-chip border border-signal-green-border bg-signal-green-fill px-12 py-10 font-mono text-mono-13 text-signal-green-on">
          return [{result[0]}, {result[1]}]
        </div>
      )}

      {children}

      {isFallback && (
        <p className="mt-auto font-sans text-narration-sm text-text-muted">
          3D unavailable — showing data view.
        </p>
      )}
    </div>
  );
}
