import type { Category } from "@/lib/types";

/**
 * The abstract line diagram at the top of every catalog card.
 *
 * ONE PER CATEGORY, NOT ONE PER PROBLEM. S4's brief says the diagram "hints at
 * the data structure" — that is a category-level fact, so 18 of these cover all
 * 150 cards. Authoring 150 would be noise, not signal.
 *
 * Shape only, no text: same discipline AGENTS.md imposes on the R3F canvas,
 * held to here because a glyph with a label stops being a glyph.
 *
 * Every colour is a token. `muted` collapses all three tones onto the skeleton
 * pair, which is how a `soon` card renders — the shape still reads, the signal
 * colours are reserved for problems you can actually play.
 */

type Tone = "idle" | "memo" | "accent";

const FILL: Record<Tone, string> = {
  idle: "fill-surface-skeleton stroke-border-idle",
  memo: "fill-signal-violet-fill-strong stroke-signal-violet-border-mid",
  accent: "fill-signal-cyan-fill-strong stroke-signal-cyan-border-strong",
};

const STROKE: Record<Tone, string> = {
  idle: "stroke-border-idle",
  memo: "stroke-signal-violet-border-mid",
  accent: "stroke-signal-cyan-border-strong",
};

const FILL_MUTED = "fill-surface-skeleton stroke-border-hairline";
const STROKE_MUTED = "stroke-border-hairline";

/** The glyph band is 202x52 in every category, so cards never shift height. */
const W = 202;
const H = 52;

type GlyphProps = {
  category: Category;
  muted?: boolean;
  className?: string;
};

export function CategoryGlyph({
  category,
  muted = false,
  className = "",
}: GlyphProps) {
  const f = (tone: Tone) => (muted ? FILL_MUTED : FILL[tone]);
  const s = (tone: Tone) => (muted ? STROKE_MUTED : STROKE[tone]);

  /** A design-language bar: 34 wide, bottom-aligned, radius-bar's 7px corner. */
  const bar = (x: number, h: number, tone: Tone, key: number) => (
    <rect
      key={key}
      x={x}
      y={H - h}
      width={34}
      height={h}
      rx={7}
      className={f(tone)}
    />
  );

  const dot = (cx: number, cy: number, r: number, tone: Tone, key: number) => (
    <circle key={key} cx={cx} cy={cy} r={r} className={f(tone)} />
  );

  const line = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone: Tone,
    key: number,
  ) => (
    <line
      key={key}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className={s(tone)}
      strokeLinecap="round"
    />
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      fill="none"
      strokeWidth={1}
      aria-hidden="true"
      focusable="false"
      className={className}
      preserveAspectRatio="xMinYMid meet"
    >
      {GLYPHS[category]({ bar, dot, line, f, s })}
    </svg>
  );
}

type Draw = {
  bar: (x: number, h: number, tone: Tone, key: number) => React.ReactNode;
  dot: (
    cx: number,
    cy: number,
    r: number,
    tone: Tone,
    key: number,
  ) => React.ReactNode;
  line: (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    tone: Tone,
    key: number,
  ) => React.ReactNode;
  f: (tone: Tone) => string;
  s: (tone: Tone) => string;
};

/** Five 34-wide bars with 8px gutters — the layout S4 drew, reused where it fits. */
const BAR_X = [0, 42, 84, 126, 168];

const GLYPHS: Record<Category, (d: Draw) => React.ReactNode> = {
  // The card S4 actually drew: two stored, one executing, two untouched.
  "Arrays & Hashing": ({ bar }) =>
    [
      bar(BAR_X[0], 34, "memo", 0),
      bar(BAR_X[1], 34, "memo", 1),
      bar(BAR_X[2], 52, "accent", 2),
      bar(BAR_X[3], 34, "idle", 3),
      bar(BAR_X[4], 34, "idle", 4),
    ],

  // Both ends lit, everything between still untouched.
  "Two Pointers": ({ bar }) =>
    [
      bar(BAR_X[0], 52, "accent", 0),
      bar(BAR_X[1], 30, "idle", 1),
      bar(BAR_X[2], 30, "idle", 2),
      bar(BAR_X[3], 30, "idle", 3),
      bar(BAR_X[4], 52, "accent", 4),
    ],

  // A frame sliding over the row — the window is the outline, not a bar.
  "Sliding Window": ({ bar, f }) => (
    <>
      {BAR_X.map((x, i) => bar(x, 30, "idle", i))}
      <rect
        x={37}
        y={4}
        width={132}
        height={48}
        rx={7}
        className={f("accent")}
        fillOpacity={0.25}
      />
    </>
  ),

  // Slabs, top of the pile lit.
  Stack: ({ f }) => (
    <>
      <rect x={56} y={39} width={90} height={13} rx={5} className={f("idle")} />
      <rect x={56} y={22} width={90} height={13} rx={5} className={f("memo")} />
      <rect
        x={56}
        y={5}
        width={90}
        height={13}
        rx={5}
        className={f("accent")}
      />
    </>
  ),

  // Seven candidates, the midpoint under inspection.
  "Binary Search": ({ f }) =>
    Array.from({ length: 7 }, (_, i) => {
      const mid = i === 3;
      return (
        <rect
          key={i}
          x={i * 30}
          y={mid ? 0 : 11}
          width={18}
          height={mid ? 52 : 30}
          rx={5}
          className={f(mid ? "accent" : "idle")}
        />
      );
    }),

  // Nodes and next-pointers.
  "Linked List": ({ dot, line }) => (
    <>
      {[0, 1, 2].map((i) => line(31 + i * 60, 26, 65 + i * 60, 26, "idle", i))}
      {[18, 78, 138, 190].map((cx, i) =>
        dot(cx, 26, 13, i === 0 ? "accent" : "idle", 10 + i),
      )}
    </>
  ),

  Trees: ({ dot, line }) => (
    <>
      {line(101, 20, 61, 38, "idle", 0)}
      {line(101, 20, 141, 38, "idle", 1)}
      {dot(101, 12, 10, "accent", 2)}
      {dot(61, 42, 10, "idle", 3)}
      {dot(141, 42, 10, "idle", 4)}
    </>
  ),

  // Three levels, one prefix path lit all the way down.
  Tries: ({ dot, line }) => (
    <>
      {line(101, 9, 71, 26, "accent", 0)}
      {line(101, 9, 131, 26, "idle", 1)}
      {line(71, 26, 51, 44, "accent", 2)}
      {line(71, 26, 91, 44, "idle", 3)}
      {line(131, 26, 151, 44, "idle", 4)}
      {dot(101, 9, 7, "accent", 5)}
      {dot(71, 26, 7, "accent", 6)}
      {dot(131, 26, 7, "idle", 7)}
      {dot(51, 44, 7, "accent", 8)}
      {dot(91, 44, 7, "idle", 9)}
      {dot(151, 44, 7, "idle", 10)}
    </>
  ),

  // The heap property: the winner is always on top.
  "Heap / Priority Queue": ({ dot, line }) => (
    <>
      {line(101, 8, 71, 26, "idle", 0)}
      {line(101, 8, 131, 26, "idle", 1)}
      {line(71, 26, 56, 44, "idle", 2)}
      {line(71, 26, 86, 44, "idle", 3)}
      {line(131, 26, 116, 44, "idle", 4)}
      {line(131, 26, 146, 44, "idle", 5)}
      {dot(101, 8, 8, "accent", 6)}
      {dot(71, 26, 7, "memo", 7)}
      {dot(131, 26, 7, "memo", 8)}
      {[56, 86, 116, 146].map((cx, i) => dot(cx, 44, 6, "idle", 20 + i))}
    </>
  ),

  // One branch explored, the other abandoned.
  Backtracking: ({ dot, line }) => (
    <>
      {line(24, 26, 84, 26, "accent", 0)}
      {line(84, 26, 144, 10, "accent", 1)}
      {line(84, 26, 144, 42, "idle", 2)}
      {dot(16, 26, 8, "accent", 3)}
      {dot(84, 26, 8, "accent", 4)}
      {dot(152, 10, 8, "accent", 5)}
      {dot(152, 42, 8, "idle", 6)}
    </>
  ),

  Graphs: ({ dot, line }) => (
    <>
      {line(30, 14, 90, 30, "idle", 0)}
      {line(30, 14, 78, 46, "idle", 1)}
      {line(90, 30, 78, 46, "idle", 2)}
      {line(90, 30, 152, 12, "accent", 3)}
      {line(152, 12, 172, 42, "idle", 4)}
      {dot(30, 14, 9, "accent", 5)}
      {dot(90, 30, 9, "accent", 6)}
      {dot(78, 46, 8, "idle", 7)}
      {dot(152, 12, 9, "idle", 8)}
      {dot(172, 42, 8, "idle", 9)}
    </>
  ),

  // Same graph, one weighted path picked out of it.
  "Advanced Graphs": ({ dot, line }) => (
    <>
      {line(26, 40, 76, 12, "accent", 0)}
      {line(76, 12, 130, 34, "accent", 1)}
      {line(130, 34, 180, 14, "accent", 2)}
      {line(26, 40, 130, 34, "idle", 3)}
      {line(76, 12, 180, 14, "idle", 4)}
      {dot(26, 40, 8, "accent", 5)}
      {dot(76, 12, 8, "accent", 6)}
      {dot(130, 34, 8, "accent", 7)}
      {dot(180, 14, 8, "accent", 8)}
    </>
  ),

  // A table filling left to right, one cell being computed.
  "1-D Dynamic Programming": ({ f }) =>
    Array.from({ length: 8 }, (_, i) => (
      <rect
        key={i}
        x={i * 26}
        y={13}
        width={20}
        height={26}
        rx={5}
        className={f(i < 4 ? "memo" : i === 4 ? "accent" : "idle")}
      />
    )),

  // The same table, two-dimensional, filling toward a corner.
  "2-D Dynamic Programming": ({ f }) =>
    Array.from({ length: 15 }, (_, i) => {
      const col = i % 5;
      const row = Math.floor(i / 5);
      const filled = row < 1 || (row === 1 && col < 3);
      const active = row === 1 && col === 3;
      return (
        <rect
          key={i}
          x={33 + col * 28}
          y={1 + row * 18}
          width={24}
          height={14}
          rx={4}
          className={f(active ? "accent" : filled ? "memo" : "idle")}
        />
      );
    }),

  // Always take the next-best step.
  Greedy: ({ bar }) =>
    [
      bar(BAR_X[0], 16, "idle", 0),
      bar(BAR_X[1], 25, "idle", 1),
      bar(BAR_X[2], 34, "idle", 2),
      bar(BAR_X[3], 43, "memo", 3),
      bar(BAR_X[4], 52, "accent", 4),
    ],

  // Spans on a timeline, two of them overlapping.
  Intervals: ({ f }) => (
    <>
      <rect x={6} y={4} width={96} height={9} rx={4} className={f("memo")} />
      <rect x={70} y={19} width={104} height={9} rx={4} className={f("accent")} />
      <rect x={20} y={34} width={62} height={9} rx={4} className={f("idle")} />
      <rect x={118} y={43} width={78} height={9} rx={4} className={f("idle")} />
    </>
  ),

  "Math & Geometry": ({ f, s }) => (
    <>
      <circle cx={78} cy={26} r={23} className={s("idle")} />
      <rect
        x={92}
        y={5}
        width={42}
        height={42}
        rx={7}
        className={f("accent")}
        fillOpacity={0.2}
      />
      <circle cx={78} cy={26} r={3} className={f("accent")} />
    </>
  ),

  // Eight bits, some set.
  "Bit Manipulation": ({ f }) =>
    [1, 0, 1, 1, 0, 0, 1, 0].map((bit, i) => (
      <rect
        key={i}
        x={i * 26}
        y={17}
        width={18}
        height={18}
        rx={4}
        className={f(bit ? (i === 3 ? "accent" : "memo") : "idle")}
      />
    )),
};
