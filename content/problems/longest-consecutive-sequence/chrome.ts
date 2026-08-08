import type { ProblemChrome } from "@/components/problem";

/**
 * Longest Consecutive Sequence's identity, in one object.
 *
 * The 3D scene, the flat view, the code pane, the player and the layout are
 * all shared with the rest of the array-plus-memory family — see `trace.ts`'s
 * header for how a plain-number answer (a run LENGTH) is packed onto a scene
 * built for a tile pair: every approach ends by rewriting the array so the
 * winning run sits at the front, and `result` is the span it covers.
 */
export const LONGEST_CONSECUTIVE_SEQUENCE_CHROME: ProblemChrome = {
  complexity: {
    optimized: { time: "O(n)", space: "O(n)" },
    sorted: { time: "O(n log n)", space: "O(n)" },
    brute: { time: "O(n³)", space: "O(1)" },
  },

  memoryLabel: "SEEN — set of values",

  formatProbe: (probe, hit) =>
    hit ? `${probe} remembered` : `${probe} not remembered`,

  // The array is the whole input; there is no scalar to caption.
  formatArrayCaption: () => null,

  /**
   * `result` is the tile span the winning run covers. Unlike a boolean
   * problem this never actually goes null on a shipped frame — every
   * non-empty array has SOME longest run, even if it is just one isolated
   * element — but `null` still reads correctly as "0", the true answer for
   * an empty array (which the canvas never shows; the paper sheet covers it).
   */
  formatAnswer: (result) =>
    result === null ? "0" : `${result[1] - result[0] + 1}`,

  formatCaseInput: (nums) => `nums = [${nums.join(", ")}]`,
};
