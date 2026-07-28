import type { ProblemChrome } from "@/components/problem";

/**
 * Contains Duplicate's identity, in one object.
 *
 * Everything else on the problem page — the 3D scene, the flat view, the code
 * pane, the player, the layout — is shared with Two Sum and with every other
 * problem in the "one array, optionally one remembered structure behind it"
 * family. This is the whole of what makes that page this problem.
 */
export const CONTAINS_DUPLICATE_CHROME: ProblemChrome = {
  complexity: {
    optimized: { time: "O(n)", space: "O(n)" },
    // The reason this problem earns a third tab at all: a real middle point,
    // trading Two Sum's impossible O(1) space back for a log factor.
    sorted: { time: "O(n log n)", space: "O(1)" },
    brute: { time: "O(n²)", space: "O(1)" },
  },

  // A set has no values of its own; the index each number was FIRST seen at is
  // carried anyway, because it is what lets the answer frame point back at the
  // original sighting instead of just announcing a repeat.
  memoryLabel: "SEEN — value → first index",

  formatProbe: (probe, hit) =>
    hit ? `${probe} seen before` : `${probe} is new`,

  // Array-only problem: there is no scalar input to name, so the row collapses
  // to just the ARRAY heading.
  formatArrayCaption: () => null,

  // The answer is a boolean. The pair of indices the trace recorded is what
  // the scene lights up, but it is never what the problem asks for — so
  // `result !== null` is the whole of the answer here.
  formatAnswer: (result) => (result === null ? "false" : "true"),

  formatCaseInput: (nums) => `nums = [${nums.join(", ")}]`,
};
