import Link from "next/link";

/**
 * S4's top bar. Rendered EXPLICITLY by `/` and `/problems`, not from
 * `app/layout.tsx`.
 *
 * That is not a style preference. The learning view
 * (`content/problems/two-sum/ProblemView.tsx`) lays itself out with
 * `lg:h-screen` and `lg:overflow-hidden` — it claims the entire viewport at
 * desktop. A root-layout header would push it down by its own height and make
 * the split view overflow. A route group can't carve `/problems/[slug]` out of
 * a `/problems` layout either, since both live under the same segment.
 *
 * `Patterns` and `About` from the mock are deliberately absent: there is
 * nothing behind them, and `/patterns` in particular would pre-decide the
 * twelve-pattern positioning `specs/main.md` lists as still open.
 *
 * `current` is a prop rather than `usePathname()` so this stays a Server
 * Component and ships no JavaScript at all.
 */
export function SiteHeader({ current }: { current?: "problems" }) {
  return (
    <header className="border-b border-border-hairline">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-24 px-24 py-22 lg:px-72">
        <Link
          href="/"
          className="font-mono text-mono-13 tracking-label-widest text-text-muted transition-colors hover:text-text-primary"
        >
          EXECUTION VISUALIZER
        </Link>

        <nav aria-label="Main">
          <Link
            href="/problems"
            aria-current={current === "problems" ? "page" : undefined}
            className={`text-narration-sm transition-colors ${
              current === "problems"
                ? "text-text-primary"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Problems
          </Link>
        </nav>
      </div>
    </header>
  );
}
