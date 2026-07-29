import Image from "next/image";
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
 * The two site marks, as the real logos from `public/`.
 *
 * These are RASTER and full-colour, which costs one thing the previous inline
 * SVGs had: they can't take `currentColor`, so the anchor's hover no longer
 * recolours the glyph. That is why `SiteIconLink` carries a border and fill
 * that change on hover — the hover affordance lives on the box, not the mark.
 *
 * `object-contain` inside a fixed square box, so neither logo's own aspect
 * ratio can stretch it or bump the pill row's height. `width`/`height` are the
 * intrinsic-ratio hint next/image requires, not the render size.
 */
const MARK = "h-[17px] w-[17px] object-contain";

function LeetCodeMark() {
  return (
    <Image
      src="/leetcode-logo.png"
      alt=""
      aria-hidden="true"
      width={34}
      height={34}
      className={MARK}
    />
  );
}

function NeetCodeMark() {
  return (
    <Image
      src="/neetcode-logo.png"
      alt=""
      aria-hidden="true"
      width={34}
      height={34}
      className={MARK}
    />
  );
}

/**
 * Outbound icon link with a CSS-only hover/focus tooltip.
 *
 * The tooltip is a sibling `<span>` revealed by `group-hover:` /
 * `group-focus-visible:`, never state — `/problems` renders 150 of these cards
 * and ProblemCard is a Server Component that must keep shipping zero JS.
 *
 * `relative z-10` is load-bearing for the same reason the old text link needed
 * it: on a `ready` card the title's stretched `::after` covers the whole card
 * and swallows the click otherwise.
 *
 * The accessible name carries the PROBLEM TITLE, not just the site name. 150
 * cards means 300 of these anchors, and "LeetCode, link" repeated 150 times is
 * useless in a screen reader's link list.
 */
function SiteIconLink({
  href,
  site,
  title,
  host,
  children,
}: {
  href: string;
  site: string;
  title: string;
  host: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${title} on ${site} (opens on ${host})`}
      className="group/icon relative z-10 flex h-[30px] w-[30px] items-center justify-center rounded-control border border-border-hairline text-text-muted transition-colors hover:border-signal-cyan-border-mid hover:bg-signal-cyan-fill-weak hover:text-link-cyan-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan"
    >
      {children}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 mb-8 -translate-x-1/2 whitespace-nowrap rounded-chip border border-border-hairline bg-surface-raised px-8 py-4 font-mono text-mono-13 tracking-label text-text-primary opacity-0 transition-opacity group-hover/icon:opacity-100 group-focus-visible/icon:opacity-100"
      >
        {site}
      </span>
    </a>
  );
}

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
 *     Nesting the outbound anchors inside a card-wide anchor is invalid HTML and
 *     produces one unusable tab stop. Instead the TITLE is the real link and its
 *     ::after covers the card ("stretched link"), so the accessible name is the
 *     problem title and the outbound anchors stay separate, reachable stops
 *     above it on the z-axis.
 *   - A `soon` card has no card-level link at all (settled: it must not become
 *     an outbound link to LeetCode). Its only interactive elements are the small
 *     LeetCode and NeetCode anchors.
 *   - Those two are ICON links with hover/focus tooltips, not the text link this
 *     used to carry. Two text links would have crowded the pill row at the
 *     narrow end of the grid, where DIFFICULTY + PATTERN + SOON already wrap.
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

        <div className="ml-auto flex items-center gap-8">
          <SiteIconLink
            href={problem.leetcodeUrl}
            site="LeetCode"
            host="leetcode.com"
            title={problem.title}
          >
            <LeetCodeMark />
          </SiteIconLink>

          {/* Absent, not disabled, when the row has no `neetcodeSlug`. See the
              field's note in lib/types.ts: NeetCode renames its problems, so an
              un-authored row has no URL to point at rather than a guessable one. */}
          {problem.neetcodeUrl ? (
            <SiteIconLink
              href={problem.neetcodeUrl}
              site="NeetCode"
              host="neetcode.io"
              title={problem.title}
            >
              <NeetCodeMark />
            </SiteIconLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
