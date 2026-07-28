// ---------------------------------------------------------------------------
// Player frames
// ---------------------------------------------------------------------------

/** Narration category — drives the coloured label above the canvas (DOM only). */
export type FrameKind = 'init' | 'compare' | 'store' | 'match' | 'return'

/**
 * A full state snapshot, not a delta. Seek and reverse-step are just an index
 * change. `changed` carries hints for what to flash/animate coming *into* this
 * frame; it is never needed to reconstruct the state.
 */
export type Frame<TScene = unknown> = {
  /** 0-based index into the frame array. */
  step: number
  /** 1-based line in the CANONICAL trace listing. Map per-language via Solution.lineMap. */
  line: number
  kind: FrameKind
  /** Prose for the DOM narration bar. Never rendered in the canvas. */
  narration: string
  /** The "why this step" disclosure text (F6). Never rendered in the canvas. */
  why: string
  /** Variables panel. Values are pre-stringified where formatting matters. */
  vars: Record<string, string | number | boolean | null>
  /** Shape + motion state for the R3F scene. */
  scene: TScene
  /** Keys/paths that differ from the previous frame, e.g. ['scene.cursor', 'vars.complement']. */
  changed: string[]
}

// ---------------------------------------------------------------------------
// Two Sum scene
// ---------------------------------------------------------------------------

export type TileState = 'idle' | 'active' | 'done' | 'match'
export type SlotState = 'empty' | 'filled' | 'probed' | 'hit'

/**
 * Geometry-bearing state only. The canvas reads states/indices to place and
 * light objects; every key, value and index is rendered as text by the DOM.
 */
export type TwoSumScene = {
  /** Constant across frames, but carried so each frame stands alone. */
  nums: number[]
  target: number
  /** One entry per element of `nums`. */
  tiles: TileState[]
  /** Index of the tile under the beam, or null. */
  cursor: number | null
  /** Insertion-ordered hash map slots. Empty for approaches with no memory structure. */
  slots: { key: number; value: number; state: SlotState }[]
  /**
   * The key currently being looked up, or null.
   *
   * NOT a slot index. A lookup that MISSES has no slot to point at, and the
   * miss is precisely what F11's beam has to render ("passes through the gap
   * and dissipates"). Resolve it with `slots.findIndex((s) => s.key === probe)`;
   * -1 means nothing was there.
   */
  probe: number | null
  /**
   * Beam endpoints, or null. Read the second index against `slots`:
   *   optimized -> [tileIndex, slotIndex] — a tile probing the wall.
   *   brute     -> [tileIndex, tileIndex] — `slots` is empty, so there is no
   *                wall to aim at and the beam runs tile to tile (F13's
   *                "crisscross beams").
   */
  link: [number, number] | null
  /** Tile indices of the answer once found. */
  result: [number, number] | null
}

export type TwoSumFrame = Frame<TwoSumScene>

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

/**
 * NeetCode 150's own grouping, in NeetCode's own order.
 *
 * This is a runtime value, not just a type, because the order IS the content:
 * it drives the section order on /problems and the category rail. Deriving
 * `Category` from it means the list and the union can never disagree — the
 * alternative (a hand-written union plus a separate ordered array) needs a
 * test to prove exhaustiveness, and still drifts between the two.
 */
export const CATEGORIES = [
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Advanced Graphs',
  '1-D Dynamic Programming',
  '2-D Dynamic Programming',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
] as const

export type Category = (typeof CATEGORIES)[number]

export type ProblemMeta = {
  slug: string
  number: number
  title: string
  difficulty: Difficulty
  pattern: string
  blurb: string
}

/**
 * One row of the NeetCode 150 catalog (content/catalog.ts).
 *
 * Deliberately NOT ProblemMeta: a catalog row exists for all 150 problems,
 * of which all but one have no content directory, no trace, no frames and
 * nothing to say about themselves. The catalog owns the facts that exist
 * before anything is built (number, title, difficulty, category); ProblemMeta
 * owns the facts that only exist once it is (pattern, blurb).
 */
export type CatalogEntry = {
  /**
   * LeetCode's own URL slug. Doubles as the /problems/<slug> route segment
   * once the problem is built, which is what lets `status` be derived.
   */
  slug: string
  /** LeetCode problem number. Displayed on the card; not an ordering key. */
  number: number
  title: string
  difficulty: Difficulty
  category: Category
  /**
   * Only for the rare problem whose LeetCode slug can't be our route segment.
   * Overrides the derived LeetCode URL; leave unset otherwise, because 150
   * stored URLs is 150 chances to typo one.
   */
  leetcodeSlug?: string
}

/** A catalog row resolved against what has actually been built. */
export type CatalogProblem = CatalogEntry & {
  /**
   * DERIVED from whether content/problems/<slug>/ exists — never authored.
   * An authored flag drifts; this one lights the card up the day the
   * directory lands, with no edit to the catalog.
   */
  status: 'ready' | 'soon'
  leetcodeUrl: string
  /** Non-null iff `status` is 'ready'. Carries the blurb and pattern pill. */
  meta: ProblemMeta | null
}

export type Language = 'javascript' | 'python' | 'java' | 'go'
export type Approach = 'brute' | 'optimized'
/** Whether the learning view renders the R3F scene or the DOM-only fallback. */
export type RenderMode = '3d' | '2d'

export type Solution = {
  language: Language
  code: string
  lineMap: Record<number, number> // canonical trace line -> line in THIS listing
}

/**
 * One playable input.
 *
 * A case is NOT "input the player edits" — nothing executes in the browser
 * (AGENTS.md). Every case is generated by the same build-time generator as the
 * headline example and ships as its own frame array, so switching case is a
 * frame-array swap, exactly like switching approach.
 */
export type TestCase = {
  /** Stable id. Used as the frames filename segment and the player's selection key. */
  id: string
  /** Short label for the picker, e.g. "Answer at the end". */
  label: string
  nums: number[]
  target: number
  /** One line on what this input is here to show. Rendered in the DOM. */
  note: string
}

/**
 * What every content/problems/<slug>/trace.ts must export as `traces`.
 * scripts/build-traces.ts discovers problems by directory and knows nothing
 * else about them.
 */
export type ProblemTraces<TScene = unknown> = {
  /** Human-readable input the shipped frames were generated from. Printed by the build. */
  example: string
  /** Canonical listing per approach. Every frame's `line` is a 1-based index into it. */
  listings: Record<Approach, string>
  /** Every playable input. The FIRST entry is the default selection. */
  cases: TestCase[]
  /** Runs the generator for one case. */
  build: Record<Approach, (input: TestCase) => Frame<TScene>[]>
}
