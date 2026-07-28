import type { ProblemChrome } from "@/components/problem";

/**
 * Group Anagrams' identity, in one object.
 *
 * The 3D scene, the flat view, the code pane, the player and the layout are
 * all shared with the rest of the array-plus-memory family — see `trace.ts`'s
 * header for how a list of WORDS is packed onto a scene built for one array of
 * numbers. This chrome is what turns the packed numbers back into words on
 * screen.
 */

/**
 * The inverse of `trace.ts`'s `encodeWord`, deliberately duplicated here.
 *
 * This module is imported by a client component, and importing `../trace` for
 * a few lines would pull three generators and three code listings into the
 * browser bundle for nothing. Same trade Valid Anagram's chrome makes with
 * `String.fromCharCode`; the packing it inverts is pinned by `trace.test.ts`'s
 * round-trip over every shipped word.
 */
function decodeWord(code: number): string {
  let letters = "";
  let rest = code;
  while (rest > 0) {
    letters = String.fromCharCode(96 + (rest % 27)) + letters;
    rest = Math.floor(rest / 27);
  }
  return letters;
}

/**
 * `probe` is the numeric id of a COUNT key (trace.ts's `keyIdOf`), and it
 * unpacks to that key's sorted form — so 'aet' here means one a, one e, one t,
 * and runs of a repeated letter become its count. Rendered the same compact
 * way `slot.keyLabel` is, so the pill and the wall row read alike.
 */
function countLabel(code: number): string {
  const letters = decodeWord(code);
  const parts: string[] = [];
  for (let i = 0; i < letters.length; ) {
    let run = 1;
    while (letters[i + run] === letters[i]) run++;
    parts.push(`${letters[i]}${run}`);
    i += run;
  }
  return parts.join(" ");
}

export const GROUP_ANAGRAMS_CHROME: ProblemChrome = {
  // n words of up to k letters. All three build a per-word key; the optimized
  // one TALLIES its letters (O(k)) where sorted SORTS them (O(k log k)) and
  // then sorts the list on top. Every approach's output is O(n·k) by itself.
  complexity: {
    optimized: { time: "O(n·k)", space: "O(n·k)" },
    sorted: { time: "O(n·k log k + n log n)", space: "O(n·k)" },
    brute: { time: "O(n²·k)", space: "O(n·k)" },
  },

  memoryLabel: "GROUPS — letter counts → size",

  formatProbe: (probe, hit) =>
    hit ? `${countLabel(probe)} has a group` : `${countLabel(probe)} is new`,

  // The words are the whole input — there is no second scalar to name, so the
  // caption row collapses to just the ARRAY heading.
  formatArrayCaption: () => null,

  /**
   * The answer is a partition, and `result` is a tile pair — so it reports the
   * biggest group, which the trace's final frame lays out contiguously for
   * exactly this reason (see trace.ts). The partition itself is spelled out in
   * the variables panel's `groups`, which is where AGENTS.md wants every word.
   * `null` is the case where nothing grouped at all.
   */
  formatAnswer: (result) =>
    result === null
      ? "no two words matched"
      : `biggest group: ${result[1] - result[0] + 1} words`,

  formatCaseInput: (nums) =>
    `strs = [${nums.map((code) => `"${decodeWord(code)}"`).join(", ")}]`,
};
