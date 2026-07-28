import Link from "next/link";

import type { CatalogProblem, Difficulty } from "@/lib/types";
import { CategoryGlyph } from "./CategoryGlyph";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  Easy: "text-signal-green-on bg-signal-green-fill border-signal-green-border",
  Medium:
    "text-signal-amber-on bg-signal-amber-fill border-signal-amber-border-mid",
  Hard: "text-signal-violet-on bg-signal-violet-fill border-signal-violet-border-mid",
};

const PILL =
  "rounded-pill border px-12 py-4 font-mono text-mono-13 tracking-label-wide";

/**
 * One catalog card. Two states, one component, because they must stay the same
 * size and shape — 149 `soon` cards next to 1 `ready` one is the page's whole
 * composition, and any height difference between them wrecks the grid rows.
 *
 * `ready` is DERIVED (lib/catalog.ts), never authored, so nothing here needs to
 * change when the second problem ships.
 *
 * Linking, and why it looks like this:
 *   - A `ready` card is clickable ANYWHERE, but the card itself is NOT an <a>.
 *     Nesting the LeetCode anchor inside a card-wide anchor is invalid HTML and
 *     produces one unusable tab stop. Instead the TITLE is the real link and its
 *     ::after covers the card ("stretched link"), so the accessible name is the
 *     problem title and the LeetCode anchor stays a separate, reachable stop
 *     above it on the z-axis.
 *   - A `soon` card has no card-level link at all (settled: it must not become
 *     an outbound link to LeetCode). Its only interactive element is the small
 *     LeetCode anchor.
 *
 * Note we do NOT put aria-disabled on the soon card. It is a non-interactive
 * <article>; aria-disabled there is meaningless noise. The visible SOON pill is
 * real text and is what actually announces the state.
 */
export function ProblemCard({ problem }: { problem: CatalogProblem }) {
  const ready = problem.status === "ready";
  const pattern = problem.meta?.pattern ?? problem.category;

  return (
    <article
      className={`relative flex flex-col gap-20 rounded-card p-24 ${
        ready
          ? "group border border-signal-cyan-border bg-surface-glass shadow-card-glow backdrop-blur-panel transition-colors hover:border-signal-cyan-border-strong"
          : "border border-border-hairline bg-surface-glass-dim"
      }`}
    >
      <CategoryGlyph
        category={problem.category}
        muted={!ready}
        className={ready ? "" : "opacity-45"}
      />

      <div className="flex flex-1 flex-col gap-8">
        <h3 className="font-display text-display-24">
          {ready ? (
            <Link
              href={`/problems/${problem.slug}`}
              className="transition-colors after:absolute after:inset-0 after:content-[''] hover:text-signal-cyan"
            >
              {problem.number}. {problem.title}
            </Link>
          ) : (
            <span className="text-text-muted">
              {problem.number}. {problem.title}
            </span>
          )}
        </h3>

        {/* Only a built problem has a blurb. The asymmetry is deliberate: the
            one thing you can actually play should read as the richest card. */}
        {problem.meta ? (
          <p className="text-narration-sm text-text-muted">
            {problem.meta.blurb}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-8">
        <span className={`${PILL} ${DIFFICULTY_STYLES[problem.difficulty]}`}>
          {problem.difficulty.toUpperCase()}
        </span>
        <span
          className={`${PILL} ${
            ready
              ? "border-signal-violet-border-mid bg-signal-violet-fill text-signal-violet-on"
              : "border-border-hairline text-text-muted-dim"
          }`}
        >
          {pattern.toUpperCase()}
        </span>

        {!ready ? (
          <span
            className={`${PILL} border-border-hairline text-text-muted-dim`}
          >
            SOON
          </span>
        ) : null}

        {/* relative + z-10 lifts this above the stretched title link's ::after,
            which otherwise swallows the click. */}
        <a
          href={problem.leetcodeUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="relative z-10 ml-auto font-mono text-mono-13 tracking-label text-text-muted transition-colors hover:text-link-cyan-hover"
        >
          LeetCode{" "}
          <span aria-hidden="true" className="text-signal-cyan">
            ↗
          </span>
          <span className="sr-only"> (opens on leetcode.com)</span>
        </a>
      </div>
    </article>
  );
}
