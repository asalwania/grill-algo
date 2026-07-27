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
  /** Insertion-ordered hash map slots. */
  slots: { key: number; value: number; state: SlotState }[]
  /** Index into `slots` currently being probed, or null. */
  probe: number | null
  /** Beam endpoints as [tileIndex, slotIndex] when a lookup connects them. */
  link: [number, number] | null
  /** Tile indices of the answer once found. */
  result: [number, number] | null
}

export type TwoSumFrame = Frame<TwoSumScene>

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type ProblemMeta = {
  slug: string
  number: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  pattern: string
  blurb: string
}

export type Language = 'javascript' | 'python' | 'java' | 'go'
export type Approach = 'brute' | 'optimized'

export type Solution = {
  language: Language
  code: string
  lineMap: Record<number, number> // canonical trace line -> line in THIS listing
}
