import type { CSSProperties } from "react";
import type { Approach, ArrayMemoryScene, TestCase } from "@/lib/types";

/**
 * The neighbouring problem in the catalog's authored order (CATALOG in
 * content/catalog.ts), filtered to what's actually built — the same order
 * /problems' "Available now" section renders. Deliberately NOT `meta.number`
 * (lib/types.ts: "Displayed on the card; not an ordering key") — that's the
 * LeetCode id, unrelated to teaching order.
 */
export type AdjacentProblem = {
  slug: string;
  title: string;
};

/**
 * Everything the shared learning view needs that differs between problems.
 *
 * The 3D scene needed no parameterization at all — AGENTS.md confines every
 * word and number to the DOM, so the canvas only ever reads tile states and
 * indices. Which means ALL of a problem's identity lives in the DOM chrome,
 * and this is that chrome, in one object.
 *
 * ## Why this is not passed from a Server Component
 *
 * Every field below is a function or a table of them, and functions are not
 * serializable across the RSC boundary. So a problem's chrome is defined in
 * its own CLIENT module (`content/problems/<slug>/ProblemView.tsx`), which
 * imports the shared view and hands it this object directly. The route only
 * ever passes plain data — frames, cases, pre-rendered code panes.
 */
export type ProblemChrome = {
  /**
   * Time/space per approach. Problem-specific even where two problems happen
   * to agree: Contains Duplicate's sort-and-scan is O(n log n)/O(1), which no
   * shared default could have guessed.
   */
  complexity: Partial<Record<Approach, { time: string; space: string }>>;

  /**
   * Heading over the memory structure in the flat view — "SEEN — value →
   * index" for a map, "SEEN — values" for a set.
   */
  memoryLabel: string;

  /**
   * Rendered opposite the ARRAY heading, e.g. `target = 21`. Split into label
   * and value rather than one string so the two keep their separate weights
   * (muted label, primary value). Return null for a problem whose only input
   * is the array itself, and the row collapses to just the heading.
   */
  formatArrayCaption: (
    scene: ArrayMemoryScene,
  ) => { label: string; value: string } | null;

  /**
   * The lookup pill next to the memory heading, e.g. `21 not seen` /
   * `21 found`. Takes the probed KEY, never a slot index (lib/types.ts).
   */
  formatProbe: (probe: number, hit: boolean) => string;

  /**
   * The answer as the PROBLEM states it, from the pair that decided it.
   * Two Sum returns the indices themselves (`[3, 5]`); Contains Duplicate
   * returns a boolean (`true`) and merely uses the pair to point at why.
   * `null` is the not-found case: `[]` and `false` respectively.
   */
  formatAnswer: (result: [number, number] | null) => string;

  /**
   * One line naming what a case's input is, for the picker card — e.g.
   * `nums = [2, 7, 11] · target = 21`. A problem with no scalar input simply
   * omits the second half rather than rendering `target = undefined`.
   */
  formatCaseInput: (nums: number[], target: number | undefined) => string;
};

/**
 * What every problem's own `ProblemBrief` receives.
 *
 * The prose is problem-specific and the picker is not, so a brief is a
 * component rather than a string: it writes its own explanation and then
 * renders the shared `TestCasePicker` with what it is handed here.
 */
export type ProblemBriefProps = {
  cases: TestCase[];
  /** Pre-formatted answer per case id, e.g. `"[3, 5]"` or `"true"`. Derived
   *  by the problem view from the shipped frames, never recomputed — nothing
   *  in the browser solves anything (AGENTS.md). */
  answers: Record<string, string>;
  /** Whether each case's answer is a positive result, for the pill's colour.
   *  Separate from `answers` because "not found" is `[]` for one problem and
   *  `false` for another — the string alone can't be compared against. */
  found: Record<string, boolean>;
  chrome: ProblemChrome;
  className?: string;
  style?: CSSProperties;
};

/**
 * `ProblemChrome`'s sibling for the grid-problem family. Considerably
 * smaller: there is no memory wall or probe pill for this family (GridScene
 * has no `slots`), so `memoryLabel`/`formatProbe`/`formatArrayCaption` have
 * no grid equivalent — the `peer` cell state carries that story instead, and
 * it needs no DOM chrome to explain itself.
 */
export type GridChrome = {
  complexity: Partial<Record<Approach, { time: string; space: string }>>;
  /**
   * The answer as the PROBLEM states it, from the pair that decided it —
   * same boolean-via-pair convention as `ProblemChrome.formatAnswer`. `null`
   * is the valid-board case.
   */
  formatAnswer: (result: [number, number] | null) => string;
  /**
   * One line naming what a case's board is, for the picker card. A full
   * board isn't readable as one inline string the way an array is, so this
   * is a summary (e.g. filled-cell count), not a literal dump of `values`.
   */
  formatCaseInput: (values: number[], rows: number, cols: number) => string;
};

/** `ProblemBriefProps`'s sibling for the grid-problem family. */
export type GridProblemBriefProps = {
  cases: TestCase[];
  answers: Record<string, string>;
  found: Record<string, boolean>;
  chrome: GridChrome;
  className?: string;
  style?: CSSProperties;
};
