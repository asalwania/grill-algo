import Link from "next/link";

import { CATALOG } from "@/content/catalog";

/** Companion to SiteHeader, and mounted the same way — see that file's note. */
export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border-hairline">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-12 px-24 py-32 sm:flex-row sm:items-center sm:justify-between lg:px-72">
        <span className="font-mono text-mono-13 tracking-label-widest text-text-muted-dim">
          EXECUTION VISUALIZER
        </span>
        <span className="text-narration-sm text-text-muted">
          {CATALOG.length} problems on the list.{" "}
          <Link
            href="/problems"
            className="text-signal-cyan transition-colors hover:text-link-cyan-hover"
          >
            Browse them
          </Link>
          .
        </span>
      </div>
    </footer>
  );
}
