import type { GridChrome } from "@/components/problem";

/**
 * Valid Sudoku's identity, in one object — the grid family's counterpart to
 * ProblemChrome. Everything else on the problem page (the 3D scene, the flat
 * view, the code pane, the player, the layout) is shared with every future
 * problem in the grid family.
 */
export const VALID_SUDOKU_CHROME: GridChrome = {
  complexity: {
    // In terms of the board dimension n (= 9), not the literal 81 cells —
    // the story that actually differs between the two approaches. Optimized
    // is one pass with O(1) map operations per cell: O(n²) time, and the map
    // holds up to 3n² entries. Brute is three FULL passes, each doing a
    // pairwise-equivalent scan across n groups of n cells: O(n³) time, but
    // never remembers anything beyond the group it is currently checking.
    optimized: { time: "O(n²)", space: "O(n²)" },
    brute: { time: "O(n³)", space: "O(1)" },
  },

  // The pair IS the conflict here (the inverse of Contains Duplicate's
  // mapping, where a populated pair means the answer is "true") — a
  // populated `result` means a rule was broken, so the board is invalid.
  formatAnswer: (result) => (result === null ? "true" : "false"),

  // A full 81-cell board is not readable as one inline string the way an
  // array is, so the picker card gets a summary instead of a literal dump.
  formatCaseInput: (values, rows, cols) => {
    const filled = values.filter((value) => value !== 0).length;
    return `${filled} of ${rows * cols} cells filled`;
  },
};
