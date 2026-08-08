"use client";

import type { ReactNode } from "react";
import type { GridBoxSize } from "@/components/scene";
import type { GridCellState, GridFrame } from "@/lib/types";
import type { GridChrome } from "./types";

type GridFlatViewProps = {
  /** Same frame the 3D scene reads — this view derives everything from it and
   *  owns no state of its own, so 2D and 3D can never disagree about step. */
  frame: GridFrame;
  chrome: GridChrome;
  /** Purely a ruling accent (heavier border every `boxSize` cells) — the same
   *  optional, opt-in convention GridScene's checkerboard tint uses. */
  boxSize?: GridBoxSize;
  isFallback?: boolean;
  children?: ReactNode;
  floatingControls?: boolean;
  className?: string;
};

const CELL_GAP = 3;

const GRID_CELL_STYLES: Record<GridCellState, string> = {
  idle: "border-border-idle bg-surface-raised text-text-primary",
  active:
    "border-signal-cyan-border-strong bg-signal-cyan-fill text-signal-cyan shadow-tile-active",
  peer: "border-signal-cyan-border bg-signal-cyan-fill-weak text-text-muted",
  done: "border-signal-violet-border bg-signal-violet-fill text-signal-violet-on shadow-tile-done",
  conflict:
    "border-signal-amber-border bg-signal-amber-fill text-signal-amber-on shadow-tile-done",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-mono-13 tracking-label-wide text-text-muted">
      {children}
    </div>
  );
}

/** Heavier rule at a box boundary, ordinary hairline gap everywhere else —
 *  the box structure read purely from ruling, no separate divider element. */
function edgeWidth(index: number, boxSpan: number | undefined, count: number): string {
  if (!boxSpan) return "1px";
  const atBoundary = (index + 1) % boxSpan === 0 && index !== count - 1;
  return atBoundary ? "3px" : "1px";
}

function Board({ frame, boxSize }: { frame: GridFrame; boxSize?: GridBoxSize }) {
  const { rows, cols, values, cells } = frame.scene;

  return (
    <div
      className="mx-auto aspect-square w-full max-w-[420px] border border-border-idle bg-surface-canvas p-4"
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap: `${CELL_GAP}px`,
      }}
    >
      {values.map((value, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const state = cells[index] ?? "idle";
        return (
          <div
            key={index}
            className={`flex items-center justify-center rounded-control border font-mono text-body-16 font-medium transition-colors ${GRID_CELL_STYLES[state]}`}
            style={{
              borderRightWidth: edgeWidth(col, boxSize?.cols, cols),
              borderBottomWidth: edgeWidth(row, boxSize?.rows, rows),
            }}
          >
            {value === 0 ? "" : value}
          </div>
        );
      })}
    </div>
  );
}

/** `r,c` for a human-readable conflict caption — 1-based, the way a person
 *  points at a board rather than the flat index the algorithm uses. */
function describeCell(index: number, cols: number): string {
  const row = Math.floor(index / cols) + 1;
  const col = (index % cols) + 1;
  return `row ${row}, col ${col}`;
}

/**
 * The 2D half of the grid family's render-mode toggle, and the no-WebGL
 * fallback — same role FlatView.tsx plays for the array family, but a real
 * 9x9 CSS grid rather than a single row, since the board's shape IS the
 * content here.
 */
export function GridFlatView({
  frame,
  chrome,
  boxSize,
  isFallback = false,
  children,
  floatingControls = true,
  className = "",
}: GridFlatViewProps) {
  const { cols, values, result } = frame.scene;
  const caption = chrome.formatCaseInput(values, frame.scene.rows, cols);

  return (
    <div
      className={`flex h-full w-full flex-col gap-20 overflow-auto p-20 lg:p-24 ${
        floatingControls ? "py-56 lg:pb-64" : ""
      } ${className}`}
    >
      <div
        className={`flex items-baseline justify-between gap-12 ${
          floatingControls ? "pr-32" : ""
        }`}
      >
        <SectionLabel>BOARD</SectionLabel>
        <span className="font-mono text-mono-13 text-text-muted">{caption}</span>
      </div>

      <Board frame={frame} boxSize={boxSize} />

      {result && (
        <div className="rounded-chip border border-signal-amber-border bg-signal-amber-fill px-12 py-10 font-mono text-mono-13 text-signal-amber-on">
          conflict at {describeCell(result[0], cols)} and {describeCell(result[1], cols)} — return{" "}
          {chrome.formatAnswer(result)}
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
