"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { GridProblemBriefProps } from "@/components/problem";

/**
 * The problem in plain words, sitting under the code pane, plus the picker
 * for the boards you can play it on. Same role as every other problem's
 * ProblemBrief — see contains-duplicate/ProblemBrief.tsx's own doc comment
 * for why this prose is deliberately not the LeetCode statement.
 */
const RULES = [
  "Only the FILLED cells matter — empty squares are skipped, never compared.",
  "A repeat only counts inside the same row, the same column, or the same 3x3 box.",
  "Answer true or false. You are checking the board, not solving it.",
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-mono-13 tracking-label-wide text-text-muted">
      {children}
    </div>
  );
}

export function ProblemBrief({
  cases,
  answers,
  found,
  chrome,
  className = "",
  style,
}: GridProblemBriefProps) {
  return (
    <section
      className={`flex flex-col gap-16 border-t border-border-hairline ${className}`}
      style={style}
    >
      <div className="flex flex-col gap-10">
        <SectionLabel>THE QUESTION</SectionLabel>
        <p className="font-sans text-narration text-text-primary">
          You get a 9x9 board, partly filled with digits 1-9. Does any digit
          repeat where it isn&apos;t allowed to?
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          A cell answers to three groups at once — its row, its column, and
          its 3x3 box — and a violation in any one of them is enough. The
          board doesn&apos;t have to be solvable, or even close to full; it
          only has to not break its own rules yet.
        </p>
        <ul className="flex list-none flex-col gap-8">
          {RULES.map((rule) => (
            <li
              key={rule}
              className="flex gap-8 font-sans text-narration-sm text-text-muted"
            >
              <span aria-hidden className="text-signal-cyan">
                ·
              </span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-10">
        <SectionLabel>TRY IT ON — pick a board, then press play</SectionLabel>
        <TestCasePicker
          cases={cases}
          answers={answers}
          found={found}
          formatInput={(nums) => chrome.formatCaseInput(nums, 9, 9)}
        />
      </div>
    </section>
  );
}
