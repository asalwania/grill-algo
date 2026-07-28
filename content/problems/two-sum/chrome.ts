import type { ProblemChrome } from "@/components/problem";

/**
 * Two Sum's identity, in one object.
 *
 * Everything else on the problem page — the 3D scene, the flat view, the code
 * pane, the player, the layout — is shared with every other problem in the
 * "one array, optionally one remembered structure behind it" family. This is
 * the whole of what makes that page Two Sum.
 *
 * Kept in its own module, separate from `ProblemView.tsx`, so the homepage can
 * render Two Sum's flat view without pulling in the entire learning view (and
 * with it the R3F canvas) to get at these few formatters.
 */
export const TWO_SUM_CHROME: ProblemChrome = {
  complexity: {
    optimized: { time: "O(n)", space: "O(n)" },
    brute: { time: "O(n²)", space: "O(1)" },
  },

  memoryLabel: "SEEN — value → index",

  // The map is keyed by value and stores the index, so a slot reads
  // "value → index" and the probe is always a VALUE we hope to have seen.
  formatProbe: (probe, hit) => (hit ? `${probe} found` : `${probe} not seen`),

  formatArrayCaption: (scene) =>
    scene.target === undefined
      ? null
      : { label: "target", value: String(scene.target) },

  // Two Sum's answer IS the pair of indices, so the pair the trace recorded is
  // reported verbatim.
  formatAnswer: (result) =>
    result === null ? "[]" : `[${result[0]}, ${result[1]}]`,

  formatCaseInput: (nums, target) =>
    `nums = [${nums.join(", ")}] · target = ${target}`,
};
