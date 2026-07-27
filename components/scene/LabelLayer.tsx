"use client";

import { forwardRef, useImperativeHandle, useRef, type CSSProperties } from "react";
import type { SlotScreenPosition, TileScreenPosition } from "@/content/problems/two-sum/scene";

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
  /** Array values to label, in tile order. Constant for a given trace — only
   *  positions move frame to frame. */
  values: number[];
  /** Hash-map wall capacity (F10) — 0 for approaches with no wall, matching
   *  HashMapWall's own capacity check. Defaults to 0. */
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

const labelBaseStyle: CSSProperties = {
  position: "absolute",
  left: 0,
  top: 0,
  whiteSpace: "nowrap",
  pointerEvents: "auto",
  userSelect: "text",
  lineHeight: 1,
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
  { values, slotCapacity = 0 },
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
            {value}
          </span>
          <span
            ref={(node) => {
              indexRefs.current[index] = node;
            }}
            className="font-mono tracking-label text-text-muted-dim"
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
