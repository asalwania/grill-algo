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
// Array + memory scene
// ---------------------------------------------------------------------------

export type TileState = 'idle' | 'active' | 'done' | 'match'
export type SlotState = 'empty' | 'filled' | 'probed' | 'hit'

/**
 * Geometry-bearing state only. The canvas reads states/indices to place and
 * light objects; every key, value and index is rendered as text by the DOM.
 *
 * Shared by every problem in the "one array, optionally one remembered
 * structure behind it" family — Two Sum, Contains Duplicate and the rest of
 * Arrays & Hashing. It is deliberately NOT per-problem: the 3D scene reads
 * only states and indices (never a value, never a label), so nothing in it is
 * problem-specific. What differs between problems is the DOM chrome around it,
 * which is why `ProblemChrome` exists rather than a second scene component.
 */
export type ArrayMemoryScene = {
  /**
   * The array as it stands ON THIS FRAME.
   *
   * NOT constant across a trace: a sort-based approach reorders it mid-run,
   * and that reorder IS the step the frame is there to show. Anything that
   * caches this (label text, a flat-view row) must read it per frame rather
   * than once off `frames[0]`. Only its LENGTH is invariant, which is what
   * lets the scene size its per-tile ref arrays once at mount.
   */
  nums: number[]
  /**
   * The problem's scalar input, when it has one — Two Sum's target. Absent for
   * problems that take only an array (Contains Duplicate). Rendered by the DOM
   * chrome; the canvas never reads it.
   *
   * Valid Anagram repurposes this as the boundary index between its two
   * concatenated strings within `nums`/`labels` (`s` occupies `[0, target)`,
   * `t` occupies `[target, nums.length)`) — still "the problem's scalar input
   * besides the array," just not literally a number the algorithm searches for.
   */
  target?: number
  /**
   * Display text for `nums`, one per element, when the underlying value is not
   * itself the thing to show — Valid Anagram's tiles hold char codes so `nums`
   * stays numeric, but the tile/label text should read as the letter. Absent
   * for every purely-numeric problem (Two Sum, Contains Duplicate), which fall
   * back to `String(nums[index])`.
   */
  labels?: string[]
  /** One entry per element of `nums`. */
  tiles: TileState[]
  /** Index of the tile under the beam, or null. */
  cursor: number | null
  /**
   * Insertion-ordered memory slots — a hash map's entries, or a set's members
   * with `value` carrying the index they were seen at. Empty for approaches
   * with no memory structure (brute force, sort-and-scan), which is exactly
   * what the wall's rise/sink animates against.
   */
  slots: {
    key: number
    value: number
    state: SlotState
    /** Display text for `key`, when the key is not itself the thing to show —
     *  Valid Anagram's slot keys are char codes; this carries the letter.
     *  Absent for every purely-numeric problem, which falls back to `key`. */
    keyLabel?: string
  }[]
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
   *   slots non-empty -> [tileIndex, slotIndex] — a tile probing the wall.
   *   slots empty     -> [tileIndex, tileIndex] — there is no wall to aim at,
   *                      so the beam runs tile to tile (F13's "crisscross
   *                      beams"). Both brute force and sort-and-scan.
   */
  link: [number, number] | null
  /**
   * Tile indices of the answer once found, indexed against THIS FRAME's
   * `nums`. For a sort-based approach that means positions in the sorted
   * array, not in the caller's original one.
   *
   * A problem whose answer is a boolean (Contains Duplicate) still reports the
   * pair that decided it, and lets `result !== null` be the boolean —
   * `ProblemChrome.formatAnswer` is what turns it back into the answer the
   * problem actually asks for.
   */
  result: [number, number] | null
}

export type ArrayMemoryFrame = Frame<ArrayMemoryScene>

/** Two Sum's scene — the shared one, with `target` narrowed to required. */
export type TwoSumScene = ArrayMemoryScene & { target: number }

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
  /**
   * NeetCode's own URL slug, which is NOT derivable from anything else here:
   * NeetCode renames problems on its practice pages (Contains Duplicate is
   * `duplicate-integer`, Two Sum is `two-integer-sum`). So unlike
   * `leetcodeSlug`, this is not an override of a derived value — it is the
   * only source of the NeetCode URL, and a row without it simply has no
   * NeetCode link. That is why `CatalogProblem.neetcodeUrl` is nullable.
   */
  neetcodeSlug?: string
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
  /** Null when the row has no `neetcodeSlug` — the card then renders no NeetCode link. */
  neetcodeUrl: string | null
  /** Non-null iff `status` is 'ready'. Carries the blurb and pattern pill. */
  meta: ProblemMeta | null
}

export type Language = 'javascript' | 'python' | 'java' | 'go'

/**
 * Every approach ANY problem can offer — not the set any single problem does.
 *
 * A problem declares its own subset, in its own order, via
 * `ProblemTraces.approaches`; the tab strip, the build script and the loader
 * all read that rather than this union. Forcing all three on every problem
 * would mean inventing one: sorting Two Sum destroys the indices it has to
 * return, so recovering them costs O(n) space and kills the very "sorted is
 * the cheap middle" story that justifies the tab.
 */
export type Approach = 'brute' | 'sorted' | 'optimized'

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
  /** The problem's scalar input, when it has one. Omitted for array-only problems. */
  target?: number
  /** One line on what this input is here to show. Rendered in the DOM. */
  note: string
}

/**
 * What every content/problems/<slug>/trace.ts must export as `traces`.
 * scripts/build-traces.ts discovers problems by directory and knows nothing
 * else about them.
 *
 * Generic over the approach set so a problem gets exact types for the
 * approaches it actually ships — `traces.build.optimized` is non-optional for
 * a problem that declared `optimized`, and a compile error for one that did
 * not, rather than every access needing a `Partial` null check.
 */
export type ProblemTraces<
  TScene = unknown,
  TApproach extends Approach = Approach,
> = {
  /** Human-readable input the shipped frames were generated from. Printed by the build. */
  example: string
  /**
   * The approaches this problem ships, in tab order. The FIRST is the default
   * selection — same convention as `cases`. Written to approaches.json by the
   * build so the runtime loader knows which frame files to expect.
   */
  approaches: readonly TApproach[]
  /** Canonical listing per approach. Every frame's `line` is a 1-based index into it. */
  listings: Record<TApproach, string>
  /** Every playable input. The FIRST entry is the default selection. */
  cases: TestCase[]
  /** Runs the generator for one case. */
  build: Record<TApproach, (input: TestCase) => Frame<TScene>[]>
}

/* ---------------------------------------------------------------------------
 * Paper trace (SP4)
 * ------------------------------------------------------------------------ */

/**
 * An authored test case, as you would write it down before touching the code.
 *
 * `expected` is HAND-AUTHORED, and that is the one deliberate exception to the
 * never-hand-write-an-answer rule. A test case whose expected value came from
 * running the code proves nothing — it asserts the code equals itself. On
 * paper, this column is your reading of the QUESTION, produced before and
 * independently of the loop. The problem's own `paper.test.ts` is what keeps
 * it honest: it runs the real algorithm over every case and refuses to let the
 * two disagree.
 */
export type PaperCase = {
  nums: number[]
  /** Hand-derived from the problem statement. Never from running the code. */
  expected: string
  /** The category it covers — the part beginners cannot generate unprompted. */
  tag: string
  /**
   * The one-line argument for a case you are NOT going to table. Authored for
   * the same reason `expected` is: it is a claim about WHY, and generating it
   * would be circular. The tick beside it in the sheet is earned by the run.
   */
  reasoning: string
}

/** Which pen a stroke is written with. Red is for the coaching, not the work. */
export type Pen = 'ink' | 'red'

/**
 * One thing the hand writes, in the order the hand writes it.
 *
 * ## Why this is not a `Frame`
 *
 * A `Frame` is a full state snapshot plus change hints, because the 3D scene
 * has to seek and reverse-step and replaying deltas into a scene is where that
 * gets painful. Paper has no such problem: **ink is append-only**. So the model
 * is an ordered list of strokes, and "step k" means strokes 0..k are inked.
 * Seek is a slice, reverse is a shorter slice, and there is no `changed[]` to
 * derive and no F1 "every frame must change the scene" rule to enforce.
 *
 * Do not unify the two. They answer different questions.
 *
 * Every stroke carries pre-rendered strings rather than raw numbers: this is
 * paper, so the formatting IS the content. `{ 4, 1 }` is what gets written
 * down, not `Set(2)`. That also makes a stroke plain JSON, so the whole sheet
 * crosses the RSC boundary as data — the generator never enters the browser
 * bundle, exactly like the shipped frames.
 */
export type PaperStroke =
  | { id: string; kind: 'title'; text: string; sub: string }
  | { id: string; kind: 'section'; step: number; text: string; hint: string }
  | { id: string; kind: 'case'; input: string; expected: string; tag: string }
  | { id: string; kind: 'grid'; caption: string; columns: string[] }
  | { id: string; kind: 'row'; cells: string[]; hit: boolean }
  | { id: string; kind: 'verdict'; text: string; ok: boolean }
  | { id: string; kind: 'aside'; text: string; pen: Pen }
