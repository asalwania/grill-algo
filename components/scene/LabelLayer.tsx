"use client";

import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from "react";
import type { SlotScreenPosition, TileScreenPosition } from "./ArrayMemoryScene";

export type LabelLayerHandle = {
  /**
   * Called with every tile's (and, when the wall exists, every slot's)
   * projected position on each rendered animation frame. Writes go straight
   * to the label nodes' style/text — mirrors F8/F10's onTilePositions and
   * onSlotPositions contracts, so a 60fps camera/tile animation never
   * touches React state.
   */
  update: (tiles: TileScreenPosition[], slots?: SlotScreenPosition[]) => void;
};

type LabelLayerProps = {
  /**
   * Array values to label, in tile order, AS OF THE CURRENT FRAME.
   *
   * Deliberately not read once off `frames[0]`: a sort-based approach
   * reorders the array mid-trace (lib/types.ts's note on `nums`), and the
   * reorder is the whole point of the frame that performs it. Only the LENGTH
   * is invariant, which is what keeps the ref arrays below stable — the text
   * itself is re-rendered by React, on the same step change that already
   * re-renders this layer's parent.
   */
  values: number[];
  /** Display text per value, when the value itself is not what should be
   *  shown — Valid Anagram's tiles hold char codes, this carries the letter.
   *  Absent for purely-numeric problems, which fall back to `String(value)`. */
  labels?: string[];
  /** Memory-wall capacity (F10) — 0 for approaches with no wall, matching
   *  MemoryWall's own capacity check. Defaults to 0. */
  slotCapacity?: number;
};

// Font size at scale === 1 (F8's REFERENCE_DISTANCE). Value and index get
// different bases so the index — already the smaller, secondary label —
// hits the shared floor and starts fading sooner as tiles recede.
const VALUE_FONT_SIZE = 18;
const INDEX_FONT_SIZE = 13;
const SLOT_FONT_SIZE = 14;

// Neither label ever renders smaller than this. Below it we don't keep
// shrinking (illegible) and we don't just freeze at the floor (a tile that
// looks tiny with pinned-size text reads as a rendering bug) — instead the
// label fades to nothing over the next FADE_RANGE_PX of "natural" size.
const MIN_FONT_SIZE = 11;
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

// A tile at `active`/`match` renders as a near-white emissive block (scene.tsx
// pushes emissiveIntensity to 1.4), and a filled wall slot glows violet — so
// bare text painted over either is unreadable exactly when it matters most.
// Every label therefore carries its own dark chip rather than relying on the
// canvas behind it: this layer can't know what colour that is, and the tile
// states it would have to track are precisely the bright ones.
//
// Padding and radius are in `em` so they track the font-size scaledStyle()
// writes each frame — the chip shrinks with the label as a tile recedes
// instead of ballooning around 11px text at the MIN_FONT_SIZE floor.
const labelBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  whiteSpace: "nowrap",
  pointerEvents: "auto",
  userSelect: "text",
  lineHeight: 1,
  color: "white",
  padding: "0.22em 0.45em",
  borderRadius: "0.35em",
  backgroundColor: "rgba(10, 11, 15, 0.86)", // --color-surface-canvas @ 86%
  border: "1px solid rgba(255, 255, 255, 0.1)", // --color-border-idle
};

/**
 * Absolutely-positioned DOM layer over the R3F canvas: the "canvas renders
 * shape and motion only" rule (AGENTS.md) means every value and index has to
 * be real text painted here, not a mesh. Positions arrive imperatively via
 * `update` rather than props, so tracking the tiles never re-renders React —
 * see LabelLayerHandle.
 *
 * The overlay div is pointer-events: none so it never steals drags meant for
 * OrbitControls; pointer-events is re-enabled only on the label spans
 * themselves, which is what makes them selectable text instead of an inert
 * picture of text.
 */
export const LabelLayer = forwardRef<LabelLayerHandle, LabelLayerProps>(function LabelLayer(
  { values, labels, slotCapacity = 0 },
  ref,
) {
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const valueRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const indexRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const slotWrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const slotLabelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useImperativeHandle(
    ref,
    () => ({
      update: (tiles, slots) => {
        for (const pos of tiles) {
          const wrapper = wrapperRefs.current[pos.index];
          if (wrapper) {
            wrapper.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
          }

          const value = valueRefs.current[pos.index];
          if (value) {
            const { fontSize, opacity } = scaledStyle(VALUE_FONT_SIZE, pos.scale);
            value.style.fontSize = fontSize;
            value.style.opacity = opacity;
          }

          const indexLabel = indexRefs.current[pos.index];
          if (indexLabel) {
            const { fontSize, opacity } = scaledStyle(INDEX_FONT_SIZE, pos.scale);
            indexLabel.style.fontSize = fontSize;
            indexLabel.style.opacity = opacity;
          }
        }

        if (!slots) return;
        for (const pos of slots) {
          const wrapper = slotWrapperRefs.current[pos.index];
          if (wrapper) {
            wrapper.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
          }

          const label = slotLabelRefs.current[pos.index];
          if (!label) continue;
          // An empty slot has no entry to show — hide it outright rather
          // than fading stale text left over from before it was cleared.
          if (pos.text === null) {
            label.style.opacity = "0";
            continue;
          }
          if (label.textContent !== pos.text) label.textContent = pos.text;
          const { fontSize, opacity } = scaledStyle(SLOT_FONT_SIZE, pos.scale);
          label.style.fontSize = fontSize;
          label.style.opacity = opacity;
        }
      },
    }),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: "none" }}>
      {values.map((value, index) => (
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
            style={{ ...labelBaseStyle, transform: "translate(-50%, calc(-100% - 6px))" }}
          >
            {labels?.[index] ?? value}
          </span>
          <span
            ref={(node) => {
              indexRefs.current[index] = node;
            }}
            // text-muted, not text-muted-dim: the dim tier's 0.6 alpha was
            // readable against the canvas backdrop but falls below usable
            // contrast once it sits on this label's own chip.
            className="font-mono tracking-label text-white"
            style={{ ...labelBaseStyle, transform: "translate(-50%, 6px)" }}
          >
            {index}
          </span>
        </div>
      ))}

      {Array.from({ length: slotCapacity }, (_, index) => (
        <div
          key={`slot-${index}`}
          ref={(node) => {
            slotWrapperRefs.current[index] = node;
          }}
          style={wrapperStyle}
        >
          <span
            ref={(node) => {
              slotLabelRefs.current[index] = node;
            }}
            className="font-mono text-signal-violet-on"
            style={{ ...labelBaseStyle, transform: "translate(-50%, -50%)", opacity: 0 }}
          />
        </div>
      ))}
    </div>
  );
});
