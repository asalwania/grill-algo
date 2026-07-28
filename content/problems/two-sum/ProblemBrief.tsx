import type { CSSProperties, ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { TestCase } from "@/lib/types";

type ProblemBriefProps = {
  cases: TestCase[];
  /** Pre-formatted answer per case id — see TestCasePicker. */
  answers: Record<string, string>;
  className?: string;
  style?: CSSProperties;
};

/**
 * The problem in plain words, sitting under the code pane, plus the picker for
 * the inputs you can play it on.
 *
 * The prose is deliberately NOT the LeetCode statement: `meta.blurb` already
 * carries the formal one-liner in the header, and this is the version for
 * someone who has not met the problem before — no "indices", no "array", no
 * "you may assume". It lives in this file rather than in `content.mdx` because
 * it is chrome for the player (it frames what the animation is showing), not
 * the long-form article F17 will render below the split view.
 */
const RULES = [
  "Exactly one pair adds up to the target.",
  "You can't use the same number twice — two different spots in the list.",
  "Give back the two positions, in any order.",
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
          You get a list of numbers and one target number. Two of the numbers in
          the list add up to that target — find them.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          The catch: you don&apos;t hand back the two numbers. You hand back{" "}
          <span className="text-text-primary">where they sit</span> in the list —
          counting from 0, so the first number is at position 0, the second at
          position 1, and so on.
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
        <TestCasePicker cases={cases} answers={answers} />
      </div>
    </section>
  );
}
