"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { ProblemBriefProps } from "@/components/problem";

/**
 * The problem in plain words, sitting under the code pane, plus the picker for
 * the inputs you can play it on.
 *
 * The prose is deliberately NOT the LeetCode statement: `meta.blurb` already
 * carries the formal one-liner in the header, and this is the version for
 * someone who has not met the problem before — no "array", no "distinct", no
 * "you may assume". It lives in this file rather than in `content.mdx` because
 * it is chrome for the player (it frames what the animation is showing), not
 * the long-form article F17 will render below the split view.
 */
const RULES = [
  "One repeat anywhere is enough — you don't have to find them all.",
  "It has to be the same value in two different spots, not one spot counted twice.",
  "Answer true or false. Nobody asks where the repeat was.",
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
          You get a list of numbers. Does the same number show up more than
          once?
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          That last line is the interesting part. Because the answer is just{" "}
          <span className="text-text-primary">yes or no</span> — not{" "}
          <em>where</em> — you are allowed to rearrange the list to make the
          question easier. That is a freedom Two Sum never has, and it is why
          this problem gets a third approach that Two Sum can&apos;t.
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
