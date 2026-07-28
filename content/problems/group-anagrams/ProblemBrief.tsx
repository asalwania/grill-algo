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
  "Two words belong together when one is the other's letters shuffled.",
  "Every word ends up in exactly one group — a word with no partner is a group of one.",
  "The groups can come back in any order, and so can the words inside them.",
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
          You get a list of words. Put the ones made of the same letters into
          the same pile.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          The trick is to stop comparing words to each other. Count a
          word&apos;s letters and you get a{" "}
          <span className="text-text-primary">key</span> that every one of its
          anagrams shares and nothing else does — so membership becomes a name
          to look up, not a pile to search. Sorting the letters gives the same
          key and is the version most people reach for; counting gets there
          without the sort, which is the whole gap between the first two tabs.
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
