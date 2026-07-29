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
  "Encode turns the list into one string; decode must give back exactly that list.",
  "Any character is allowed inside a string — including #, commas and digits.",
  "An empty list, a list holding one empty string, and a list holding two are three different answers.",
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
          Squash a list of strings into a single string, then get the original
          list back out of it.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          The trap is looking for a separator. There isn&apos;t one — every
          character you could pick is a character a string is allowed to
          contain. So don&apos;t search for where a string ends;{" "}
          <span className="text-text-primary">write down how long it is</span>{" "}
          and count. Both tabs do exactly that, at the same O(m + n); what
          separates them is how far a length has to travel from the string it
          measures.
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
