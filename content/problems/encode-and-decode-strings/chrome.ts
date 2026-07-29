import type { ProblemChrome } from "@/components/problem";

/**
 * Encode and Decode Strings' identity, in one object.
 *
 * The 3D scene, the flat view, the code pane, the player and the layout are
 * all shared with the rest of the array-plus-memory family — see `trace.ts`'s
 * header for how a round trip over a list of strings is packed onto a scene
 * built for one array of numbers. This chrome turns the packed numbers back
 * into strings on screen.
 */

/**
 * The inverse of `trace.ts`'s `packStrings`, deliberately duplicated here.
 *
 * This module is imported by a client component, and importing `../trace` for
 * five lines would pull two generators and two code listings into the browser
 * bundle for nothing — the same trade Group Anagrams' chrome makes with
 * `decodeWord`. That the packing IS this problem's own algorithm is not a
 * coincidence; see `packStrings`.
 */
function unpack(codes: number[]): string[] {
  const encoded = codes.map((code) => String.fromCharCode(code)).join("");
  const out: string[] = [];
  let i = 0;
  while (i < encoded.length) {
    let j = i;
    while (encoded[j] !== "#") j++;
    const length = Number(encoded.slice(i, j));
    i = j + 1;
    out.push(encoded.slice(i, i + length));
    i += length;
  }
  return out;
}

export const ENCODE_AND_DECODE_STRINGS_CHROME: ProblemChrome = {
  /**
   * m is the total number of characters across the strings, n the number of
   * strings. Both approaches are the SAME complexity, and saying so is the
   * point: what separates them is passes and bookkeeping, not growth. The
   * frame counter carries that message — `brute` is the longer trace on every
   * case — the way F13's readout carries it for Two Sum.
   */
  complexity: {
    optimized: { time: "O(m + n)", space: "O(m + n)" },
    brute: { time: "O(m + n)", space: "O(m + n)" },
  },

  memoryLabel: "PIECES — what the encoder wrote → length",

  /**
   * `probe` is the piece's OFFSET in the encoded string (trace.ts) — which is
   * exactly the decoder's `i`, so the pill reads as the read head's position
   * rather than as an opaque key. A miss cannot happen here: every piece the
   * decoder reads was written by the encoder, and that is the guarantee the
   * whole scheme rests on.
   */
  formatProbe: (probe, hit) =>
    hit ? `reading from i = ${probe}` : `i = ${probe} — nothing written there`,

  // The list is the whole input; `target` is the count of strings, which is
  // the one scalar worth naming beside the character row.
  formatArrayCaption: (scene) =>
    scene.target === undefined
      ? null
      : { label: "strings", value: String(scene.target) },

  /**
   * The answer is the decoded LIST and `result` is a tile pair, so it reports
   * the span of the character row the decoder handed back — all of it, for
   * every valid input, which is the claim the problem actually makes. The list
   * itself is spelled out in the variables panel's `decoded`, where AGENTS.md
   * wants every word. `null` is the degenerate input with no characters at all,
   * which lives on the paper sheet rather than the canvas.
   */
  formatAnswer: (result) =>
    result === null
      ? "nothing to decode"
      : `${result[1] - result[0] + 1} characters recovered`,

  formatCaseInput: (nums) =>
    `strs = [${unpack(nums)
      .map((s) => `"${s}"`)
      .join(", ")}]`,
};
