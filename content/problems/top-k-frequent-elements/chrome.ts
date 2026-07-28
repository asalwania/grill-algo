import type { ProblemChrome } from "@/components/problem";

/**
 * Top K Frequent Elements' identity, in one object.
 *
 * The 3D scene, the flat view, the code pane, the player and the layout are all
 * shared with the rest of the array-plus-memory family. This problem needs less
 * translation than most of them: its input IS one array of numbers, so there is
 * no packing to undo here — see `trace.ts`'s header for the two mappings that
 * do exist (`scene.target` is k, and the memory wall is the count map).
 */
export const TOP_K_FREQUENT_ELEMENTS_CHROME: ProblemChrome = {
  // n elements, d distinct values, d <= n. The optimized pass never compares
  // two counts to each other — the counts are bounded by n, so they index an
  // array of buckets instead — which is the whole reason it beats the sort.
  complexity: {
    optimized: { time: "O(n)", space: "O(n)" },
    sorted: { time: "O(n log n)", space: "O(n)" },
    brute: { time: "O(k·n²)", space: "O(k)" },
  },

  memoryLabel: "COUNTS — value → times seen",

  formatProbe: (probe, hit) =>
    hit ? `${probe} already counted` : `${probe} not counted yet`,

  // k is the problem's only scalar besides the array itself.
  formatArrayCaption: (scene) =>
    scene.target === undefined
      ? null
      : { label: "k", value: String(scene.target) },

  /**
   * The answer is a SET of k values and `result` is a tile pair, so it reports
   * the span those values cover — which the trace's final frame lays out at the
   * front of the array for exactly this reason (see trace.ts). The k values
   * themselves are spelled out in the variables panel's `result`, which is
   * where AGENTS.md wants every number.
   *
   * `null` is the case where nothing repeats: there is still an answer, but no
   * value is more frequent than any other, and the picker's pill should read
   * that as a negative.
   */
  formatAnswer: (result) =>
    result === null
      ? "no value repeats"
      : `top k: ${result[1] - result[0] + 1} elements`,

  formatCaseInput: (nums, target) =>
    `nums = [${nums.join(", ")}]` + (target === undefined ? "" : ` · k = ${target}`),
};
