"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { ProblemBriefProps } from "@/components/problem";

/**
 * The problem in plain words, sitting under the code pane, plus the picker
 * for the inputs you can play it on.
 *
 * The prose is deliberately NOT the LeetCode statement: `meta.blurb` already
 * carries the formal one-liner in the header, and this is the version for
 * someone who has not met the problem before.
 */
const RULES = [
  "Ignore anything that isn't a letter or a digit — spaces, punctuation, all of it.",
  "Upper and lower case count as the same letter.",
  "Answer true or false. Nothing else to report.",
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
          You get a string. Strip out everything except letters and digits,
          ignore case, and check whether what&apos;s left reads the same
          forwards and backwards.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          That strip-and-ignore step is the whole problem — a straight
          character-by-character comparison is easy. The interesting question
          is how little you need to remember to answer it: nothing, if you
          walk in from both ends at once instead of building a cleaned copy
          first.
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
