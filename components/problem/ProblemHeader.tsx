"use client";

import Link from "next/link";

import { ApproachTabs, LanguageSelector } from "@/components/player";
import { ComplexityReadout } from "@/components/panels";
import type { Approach, ProblemMeta } from "@/lib/types";
import type { ProblemChrome } from "./types";

type ProblemHeaderProps = {
  meta: ProblemMeta;
  /** The approaches this problem ships, in tab order — from approaches.json,
   *  never the full union (lib/types.ts). */
  approaches: Approach[];
  complexity: ProblemChrome["complexity"];
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
  className = "",
}: ProblemHeaderProps) {
  return (
    <div
      className={`flex flex-col gap-16 border-b border-border-hairline px-24 py-20 lg:px-32 lg:py-24 ${className}`}
    >
      {/* The learning view can't carry SiteHeader — it lays out with
          `lg:h-screen` and a global bar would push it past the fold. Without
          this link there is no way back to the catalog at all. */}
      <Link
        href="/problems"
        className="font-mono text-mono-13 tracking-label-wide text-text-muted transition-colors hover:text-text-primary"
      >
        <span aria-hidden="true">←</span> ALL PROBLEMS
      </Link>

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

      <LanguageSelector />
    </div>
  );
}
