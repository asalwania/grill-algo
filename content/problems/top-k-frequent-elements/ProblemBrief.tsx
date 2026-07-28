"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { ProblemBriefProps } from "@/components/problem";

/**
 * The problem in plain words, sitting under the code pane, plus the picker for
 * the inputs you can play it on. See Contains Duplicate's ProblemBrief for why
 * this prose lives here rather than in content.mdx.
 */
const RULES = [
  "You are told how many values to hand back — that is k.",
  "The answer is the values themselves, never the positions they sat in.",
  "The k values can come back in any order.",
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
          Some values turn up more often than others. Hand back the k that turn
          up most.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          Counting is the easy half — one pass with a map and you know every
          count. The interesting half is the ranking, because it looks like it
          has to be a sort. It doesn&apos;t: a count can never be bigger than
          the array, so a count is small enough to be an{" "}
          <span className="text-text-primary">index</span>. Drop each value into
          the bucket numbered by its count, read the buckets from the top, and
          the ranking falls out with nothing compared to anything — which is the
          whole gap between the first two tabs.
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
