"use client";

import { usePlayerDispatch, usePlayerState } from "./PlayerProvider";
import type { TestCase } from "@/lib/types";

type TestCasePickerProps = {
  /** Every playable input, in author order. Straight from cases.json. */
  cases: TestCase[];
  /** Pre-formatted answer per case id, e.g. `"[3, 5]"` or `"true"`. Derived by
   *  the caller from the shipped frames, never recomputed here — nothing in
   *  the browser solves anything (AGENTS.md). */
  answers: Record<string, string>;
  /** Whether each answer is a positive result, for the pill's colour. Passed
   *  rather than inferred from `answers`: "not found" reads as `[]` for one
   *  problem and `false` for another, so no string comparison covers both. */
  found: Record<string, boolean>;
  /** One line naming the case's input — problem-specific, since only some
   *  problems have a scalar input to name alongside the array. */
  formatInput: (nums: number[], target: number | undefined) => string;
  className?: string;
};

const CARD_BASE =
  "flex flex-col gap-8 rounded-card border px-14 py-12 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";
const CARD_ACTIVE =
  "border-signal-cyan-border-mid bg-signal-cyan-fill text-text-primary";
const CARD_INACTIVE =
  "border-border-hairline bg-surface-raised text-text-primary hover:border-signal-cyan-border-mid";

/**
 * Dispatch-only, like `ApproachTabs` and `LanguageSelector`: selecting a case
 * swaps which pre-generated frame array every downstream consumer reads, and
 * the reducer already resets the step and stops playback in the same
 * transition (SET_CASE). Nothing is computed here — each card is a label for a
 * trace that was generated at build time.
 */
export function TestCasePicker({
  cases,
  answers,
  found,
  formatInput,
  className = "",
}: TestCasePickerProps) {
  const { caseId } = usePlayerState();
  const dispatch = usePlayerDispatch();

  return (
    <div
      role="radiogroup"
      aria-label="Test case"
      className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 ${className}`}
    >
      {cases.map((input) => {
        const isActive = caseId === input.id;
        return (
          <button
            key={input.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => dispatch({ type: "SET_CASE", caseId: input.id })}
            className={`${CARD_BASE} ${isActive ? CARD_ACTIVE : CARD_INACTIVE}`}
          >
            <span className="flex items-center justify-between gap-10">
              <span
                className={`font-mono text-mono-13 tracking-label-wide ${
                  isActive ? "text-signal-cyan" : "text-text-muted"
                }`}
              >
                {input.label.toUpperCase()}
              </span>
              <span
                className={`rounded-pill border px-10 py-4 font-mono text-mono-13 ${
                  found[input.id]
                    ? "border-signal-green-border bg-signal-green-fill text-signal-green-on"
                    : "border-border-hairline bg-surface-raised text-text-muted"
                }`}
              >
                {answers[input.id] ?? "—"}
              </span>
            </span>

            <span className="font-mono text-mono-13 text-text-primary">
              {formatInput(input.nums, input.target)}
            </span>

            <span className="font-sans text-narration-sm text-text-muted">
              {input.note}
            </span>
          </button>
        );
      })}
    </div>
  );
}
