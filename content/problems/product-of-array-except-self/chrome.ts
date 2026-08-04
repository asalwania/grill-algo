import type { ProblemChrome } from "@/components/problem";

/**
 * Product of Array Except Self' identity, in one object.
 *
 * The 3D scene, the flat view, the code pane, the player and the layout are all
 * shared with the rest of the array-plus-memory family — see `trace.ts`'s
 * header for how an OUTPUT array is packed onto a scene built for one array plus
 * a wall. This chrome names the wall as the answer and reports the span it
 * covers.
 */
export const PRODUCT_OF_ARRAY_EXCEPT_SELF_CHROME: ProblemChrome = {
  /**
   * Both approaches use O(1) space BEYOND the output array (which the problem
   * says does not count) — a couple of running products, nothing that grows.
   * So the space column is the same for both, and the whole contrast is TIME:
   * two passes against n passes. The frame counter carries that message the way
   * F13's readout carries Two Sum's.
   */
  complexity: {
    optimized: { time: "O(n)", space: "O(1)" },
    brute: { time: "O(n²)", space: "O(1)" },
  },

  memoryLabel: "ANSWER — index → product",

  /**
   * Never actually rendered: `scene.probe` is null on every frame because
   * nothing is looked up by key — the wall is written by position, in order.
   * The contract still requires the function, so it is here and harmless.
   */
  formatProbe: (probe) => `answer[${probe}]`,

  // The array is the whole input; there is no scalar to caption.
  formatArrayCaption: () => null,

  /**
   * `result` is the tile span the answer covers — the whole array, for every
   * input. The products themselves are prose in the variables panel's `answer`,
   * where AGENTS.md keeps every number. `null` is the empty array, which lives
   * on the paper sheet, not the canvas.
   */
  formatAnswer: (result) =>
    result === null ? "[]" : `${result[1] - result[0] + 1} products`,

  formatCaseInput: (nums) => `nums = [${nums.join(", ")}]`,
};
