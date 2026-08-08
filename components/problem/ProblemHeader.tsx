"use client";

import Link from "next/link";

import { ApproachTabs, LanguageSelector } from "@/components/player";
import { ComplexityReadout } from "@/components/panels";
import { PaperTraceDialog } from "@/components/paper";
import { ApproachDialog } from "@/components/approach";
import type {
  Approach,
  ApproachMove,
  PaperStroke,
  ProblemMeta,
} from "@/lib/types";
import type { AdjacentProblem, ProblemChrome } from "./types";

type ProblemHeaderProps = {
  meta: ProblemMeta;
  /** The approaches this problem ships, in tab order — from approaches.json,
   *  never the full union (lib/types.ts). */
  approaches: Approach[];
  complexity: ProblemChrome["complexity"];
  /** The handwritten dry run, when the problem ships one. The trigger sits
   *  here rather than beside the test-case picker because paper-vs-screen is a
   *  MODE, like the approach tabs and the language selector it lines up with —
   *  not an action on the selected case. */
  paper?: PaperStroke[] | null;
  /** The approach walkthrough, when the problem ships one. Its trigger lines up
   *  beside the paper button — the two are companion modes over the page, one
   *  for deriving the solution and one for dry-running it. */
  approach?: ApproachMove[] | null;
  /** Neighbouring problems in catalog order (lib/catalog.ts's `readyProblems`),
   *  `null` at either end of the built list. */
  prev?: AdjacentProblem | null;
  next?: AdjacentProblem | null;
  className?: string;
};

const DIFFICULTY_STYLES: Record<ProblemMeta["difficulty"], string> = {
  Easy: "text-signal-green-on bg-signal-green-fill border-signal-green-border",
  Medium: "text-signal-amber-on bg-signal-amber-fill border-signal-amber-border-mid",
  Hard: "text-signal-violet-on bg-signal-violet-fill border-signal-violet-border-mid",
};

/**
 * Composes the (client) tabs/pills beneath the static title and badges.
 *
 * Now a Client Component rather than the Server Component it was: it is
 * rendered from inside `ArrayMemoryProblemView`, which is itself a client
 * component, and `complexity` arrives as part of the chrome object that
 * cannot cross the RSC boundary anyway (see ProblemChrome). Nothing here uses
 * a hook — it just no longer gets to be server-rendered independently.
 */
export function ProblemHeader({
  meta,
  approaches,
  complexity,
  paper,
  approach,
  prev,
  next,
  className = "",
}: ProblemHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-16 border-b border-border-hairline px-24 py-20 lg:px-32 lg:py-24 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-14">
        {/* The learning view can't carry SiteHeader — it lays out with
            `lg:h-screen` and a global bar would push it past the fold. Without
            this link there is no way back to the catalog at all. */}
        <Link
          href="/problems"
          className="font-mono text-mono-13 tracking-label-wide text-text-muted transition-colors hover:text-text-primary"
        >
          <span aria-hidden="true">←</span> ALL PROBLEMS
        </Link>

        {/* Steps to the previous/next built problem in catalog order — see
            AdjacentProblem. `null` at either end of the built list renders as
            inert text rather than a link, so the row never shifts width. */}
        <nav
          aria-label="Adjacent problems"
          className="flex items-center gap-16 font-mono text-mono-13 tracking-label-wide"
        >
          {prev ? (
            <Link
              href={`/problems/${prev.slug}`}
              title={prev.title}
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              <span aria-hidden="true">←</span> PREV
            </Link>
          ) : (
            <span className="text-text-muted/40" aria-disabled="true">
              <span aria-hidden="true">←</span> PREV
            </span>
          )}
          {next ? (
            <Link
              href={`/problems/${next.slug}`}
              title={next.title}
              className="text-text-muted transition-colors hover:text-text-primary"
            >
              NEXT <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span className="text-text-muted/40" aria-disabled="true">
              NEXT <span aria-hidden="true">→</span>
            </span>
          )}
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-14">
        <h1 className="font-display text-display-24 lg:text-display-32">
          {meta.number}. {meta.title}
        </h1>
        <div className="flex gap-8">
          <span
            className={`rounded-pill border px-12 py-4 font-mono text-mono-13 tracking-label-wide ${DIFFICULTY_STYLES[meta.difficulty]}`}
          >
            {meta.difficulty.toUpperCase()}
          </span>
          <span className="rounded-pill border border-signal-violet-border-mid bg-signal-violet-fill px-12 py-4 font-mono text-mono-13 tracking-label-wide text-signal-violet-on">
            {meta.pattern.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-14">
        <ApproachTabs approaches={approaches} />
        <ComplexityReadout complexity={complexity} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-14">
        <LanguageSelector />
        <div className="flex flex-wrap items-center gap-8">
          {approach && approach.length > 0 && (
            <ApproachDialog moves={approach} title={meta.title} />
          )}
          {paper && paper.length > 0 && (
            <PaperTraceDialog strokes={paper} title={meta.title} />
          )}
        </div>
      </div>
    </div>
  );
}
