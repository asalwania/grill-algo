"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { ProblemBriefProps } from "@/components/problem";

/**
 * The problem in plain words, sitting under the code pane, plus the picker
 * for the inputs you can play it on. See Contains Duplicate's ProblemBrief
 * for why this prose lives here rather than in content.mdx.
 */
const RULES = [
  "Same letters, same number of times each — order never matters.",
  "Different lengths can never be anagrams; that's always checked first.",
  "Answer true or false. Nobody asks which letter paired with which.",
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
          You get two strings. Is one just the other with its letters shuffled?
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          Not &quot;do they share letters&quot; — every letter has to show up
          exactly as often in both. That is what turns this into a{" "}
          <span className="text-text-primary">counting</span> problem rather
          than a searching one, and why remembering a count per letter beats
          checking every pair by hand.
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
