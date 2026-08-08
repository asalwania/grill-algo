"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { ProblemBriefProps } from "@/components/problem";

/**
 * The problem in plain words, sitting under the code pane, plus the picker
 * for the inputs you can play it on.
 *
 * The prose is deliberately NOT the LeetCode statement: `meta.blurb` already
 * carries the formal one-liner in the header. This lives in this file rather
 * than in `content.mdx` because it is chrome for the player (it frames what
 * the animation is showing), not the long-form article F17 will render below
 * the split view.
 */
const RULES = [
  "The numbers don't need to be sorted, or even next to each other in the array.",
  "Consecutive means the VALUES are back to back — 4, 5, 6 — not the positions.",
  "Return the length of the longest such run. Not the run itself, just how long it is.",
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
}: ProblemBriefProps) {
  return (
    <section
      className={`flex flex-col gap-16 border-t border-border-hairline ${className}`}
      style={style}
    >
      <div className="flex flex-col gap-10">
        <SectionLabel>THE QUESTION</SectionLabel>
        <p className="font-sans text-narration text-text-primary">
          You get a scrambled list of numbers. What is the longest run of
          back-to-back values hiding in it?
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          The obvious way to find a run is to sort first. The interesting
          question is whether you can find it without sorting at all — and the
          answer is yes, by remembering every value and only ever starting a
          count from a value that has no predecessor.
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
        <SectionLabel>TRY IT ON — pick an input, then press play</SectionLabel>
        <TestCasePicker
          cases={cases}
          answers={answers}
          found={found}
          formatInput={chrome.formatCaseInput}
        />
      </div>
    </section>
  );
}
