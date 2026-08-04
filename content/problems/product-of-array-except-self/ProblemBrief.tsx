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
  "Each answer[i] is the product of every other number — never nums[i] itself.",
  "No division. The array can hold zeros and negatives, and one zero would sink a divide.",
  "The answer is a new array the same length as the input.",
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
          Return a new array where each slot holds the product of every number
          except the one it replaces — and do it without dividing.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          The tempting move is to multiply everything once and divide out
          nums[i]. Division is banned — and a single zero would sink it anyway.
          So don&apos;t divide;{" "}
          <span className="text-text-primary">build the answer instead</span>:
          one sweep left storing the product of everything before each position,
          one sweep right multiplying in the product of everything after it. Two
          passes, no division, and nothing kept but a running product. The brute
          tab redoes the whole product for every position, so you can watch the
          n² it costs.
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
