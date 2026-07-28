import type { ProblemChrome } from "@/components/problem";

/**
 * Valid Anagram's identity, in one object.
 *
 * The 3D scene, the flat view, the code pane, the player and the layout are
 * all shared with Two Sum and Contains Duplicate — see `trace.ts`'s header
 * for how a two-string problem is packed onto a scene built for one array of
 * numbers. This chrome is what turns the packed data back into "s" and "t"
 * on screen.
 */
export const VALID_ANAGRAM_CHROME: ProblemChrome = {
  complexity: {
    optimized: { time: "O(n)", space: "O(1)" },
    sorted: { time: "O(n log n)", space: "O(n)" },
    brute: { time: "O(n²)", space: "O(n)" },
  },

  memoryLabel: "COUNTS — letter → remaining",

  formatProbe: (probe, hit) =>
    hit
      ? `'${String.fromCharCode(probe)}' available`
      : `'${String.fromCharCode(probe)}' exhausted`,

  // The two strings are already the whole of the array row (s then t
  // concatenated) — there is no second scalar input to name.
  formatArrayCaption: () => null,

  formatAnswer: (result) => (result === null ? "false" : "true"),

  formatCaseInput: (nums, target) => {
    const boundary = target ?? nums.length;
    const letters = nums.map((code) => String.fromCharCode(code));
    const s = letters.slice(0, boundary).join("");
    const t = letters.slice(boundary).join("");
    return `s = "${s}", t = "${t}"`;
  },
};
