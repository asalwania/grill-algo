import type { ProblemChrome } from "@/components/problem";

/** Duplicates `trace.ts`'s five-line decoder rather than importing it —
 *  `chrome.ts` already sets this precedent (see Valid Anagram's `splitCase`
 *  and Contains Duplicate's docs), which keeps this module cheap. */
function stringFromCodes(nums: number[]): string {
  return nums.map((code) => String.fromCharCode(code)).join("");
}

/**
 * Valid Palindrome's identity, in one object.
 *
 * Everything else on the problem page is shared with every other problem in
 * the "one array, optionally one remembered structure behind it" family.
 * This problem is the degenerate case of that family: NEITHER approach uses
 * a memory structure at all, so the wall never rises for either tab — the
 * first problem where that's true on both sides of the toggle.
 */
export const VALID_PALINDROME_CHROME: ProblemChrome = {
  complexity: {
    // Same linear TIME either way — the two-pointer walk and the
    // clean-then-compare pass both touch every character once. What
    // differs is SPACE: the cleaned copy is a whole second array; the two
    // pointers need nothing beyond the two indices.
    optimized: { time: "O(n)", space: "O(1)" },
    brute: { time: "O(n)", space: "O(n)" },
  },

  // Never rendered: `probe` stays null on every frame of every approach
  // (trace.ts — this problem has no memory structure on either tab), so
  // FlatView's probe pill never mounts. Still required by ProblemChrome's
  // shape.
  memoryLabel: "MEMORY — none needed",
  formatProbe: (probe, hit) => `${probe}${hit ? " found" : " not seen"}`,

  // Array-only problem: there is no scalar input to name.
  formatArrayCaption: () => null,

  // The answer is a boolean. `result` is populated only on the SUCCESS path
  // (trace.ts's doc comment explains why) — same direction Contains
  // Duplicate's `result` points, so `result !== null` is still "the good
  // news" here, just for a different reason.
  formatAnswer: (result) => (result === null ? "false" : "true"),

  formatCaseInput: (nums) => `s = "${stringFromCodes(nums)}"`,
};
