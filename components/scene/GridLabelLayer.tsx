"use client";

import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from "react";
import type { CellScreenPosition } from "./GridScene";

export type GridLabelLayerHandle = {
  /** Same imperative-write contract as LabelLayer.update — called every
   *  rendered animation frame, writes go straight to the label nodes' style,
   *  never through React state. */
  update: (cells: CellScreenPosition[]) => void;
};

type GridLabelLayerProps = {
  /** Row-major digit per cell, AS OF THE CURRENT FRAME. 0 renders no label —
   *  an empty Sudoku cell has nothing to show, unlike an array tile which
   *  always holds a value. */
  values: number[];
};

// Sized down from LabelLayer's VALUE_FONT_SIZE (18): a cell here is smaller
// than an array tile and there are up to 81 of them on screen at once.
const VALUE_FONT_SIZE = 15;
const MIN_FONT_SIZE = 10;
const FADE_RANGE_PX = 4;

function scaledStyle(baseFontSize: number, scale: number): { fontSize: string; opacity: string } {
  const natural = baseFontSize * scale;
  const fontSize = Math.max(MIN_FONT_SIZE, natural);
  const opacity =
    natural >= MIN_FONT_SIZE ? 1 : Math.max(0, 1 - (MIN_FONT_SIZE - natural) / FADE_RANGE_PX);
  return { fontSize: `${fontSize}px`, opacity: String(opacity) };
}

const wrapperStyle: CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  pointerEvents: "none",
  willChange: "transform",
};

// Same dark-chip rationale as LabelLayer.tsx: an `active`/`conflict` cell
// renders as a near-white emissive block, so bare text needs its own
// backdrop rather than relying on whatever colour sits behind it.
const labelBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  whiteSpace: "nowrap",
  pointerEvents: "auto",
  userSelect: "text",
  lineHeight: 1,
  color: "white",
  padding: "0.2em 0.4em",
  borderRadius: "0.3em",
  backgroundColor: "rgba(10, 11, 15, 0.86)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  transform: "translate(-50%, -50%)",
};

/**
 * DOM overlay for GridScene, trimmed from LabelLayer.tsx: a single digit chip
 * per cell (no secondary index caption — a board position is already legible
 * from where the cell sits, unlike an array's linear index), and an empty
 * cell (`value === 0`) shows nothing at all rather than a "0" floating over a
 * blank square.
 */
export const GridLabelLayer = forwardRef<GridLabelLayerHandle, GridLabelLayerProps>(
  function GridLabelLayer({ values }, ref) {
    const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
    const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        update: (cells) => {
          for (const pos of cells) {
            const wrapper = wrapperRefs.current[pos.index];
            if (wrapper) {
              wrapper.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
            }

            const value = valueRefs.current[pos.index];
            if (!value) continue;
            const { fontSize, opacity } = scaledStyle(VALUE_FONT_SIZE, pos.scale);
            value.style.fontSize = fontSize;
            value.style.opacity = opacity;
          }
        },
      }),
      [],
    );

    return (
      <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
        {values.map((value, index) =>
          value === 0 ? null : (
            <div
              key={index}
              ref={(node) => {
                wrapperRefs.current[index] = node;
              }}
              style={wrapperStyle}
            >
              <span
                ref={(node) => {
                  valueRefs.current[index] = node;
                }}
                className="font-mono font-medium text-text-primary"
                style={labelBaseStyle}
              >
                {value}
              </span>
            </div>
          ),
        )}
      </div>
    );
  },
);
