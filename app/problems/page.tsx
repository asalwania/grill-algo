import type { Metadata } from "next";

import { CategoryRail, ProblemCard, type RailItem } from "@/components/catalog";
import { SiteFooter, SiteHeader, SkipLink } from "@/components/chrome";
import { categoryId, groupByCategory, readyProblems } from "@/lib/catalog";
import { getCatalog } from "@/lib/content";

export const metadata: Metadata = {
  title: "Problems",
  description:
    "The NeetCode 150, stepped through one frame at a time. One built properly so far.",
};

/**
 * The catalog. A Server Component with no dynamic APIs, so it prerenders
 * statically — 150 cards of static HTML and one small client island (the rail).
 *
 * Sections are NeetCode's 18 categories in NeetCode's order. That order is the
 * curriculum, and it is the only structure the list has, so it is never sorted
 * and never flattened into a filter (see specs/homepage-catalog.md).
 */
export default async function ProblemsPage() {
  const catalog = await getCatalog();
  const sections = groupByCategory(catalog);
  const ready = readyProblems(catalog);

  const railItems: RailItem[] = sections.map((section) => ({
    id: categoryId(section.category),
    label: section.category,
    count: section.problems.length,
  }));

  return (
    <>
      <SkipLink />
      <SiteHeader current="problems" />
      <main
        id="main"
        className="mx-auto flex max-w-[1440px] flex-col px-24 pb-64 lg:px-72"
      >
        <header className="flex flex-col gap-14 pt-48 pb-32 lg:pt-72">
          <h1 className="font-display text-display-32 tracking-display lg:text-display-48">
            The NeetCode 150.
          </h1>
          <p className="max-w-[640px] text-body-16 text-text-muted">
            Step through real execution, one frame at a time — no guessing, no
            hand-waving.{" "}
            <span className="text-text-primary">
              {ready.length} of {catalog.length} built so far.
            </span>{" "}
            The rest link straight to LeetCode until they are.
          </p>
        </header>

        <div className="flex flex-col gap-32 lg:grid lg:grid-cols-[220px_1fr] lg:gap-48">
          <CategoryRail items={railItems} />

          <div className="flex flex-col gap-48">
            {/* Pinned above the 18 sections on purpose: with 149 cards greyed
              out, the one thing a visitor can actually use must not be two
              thousand pixels down inside Arrays & Hashing. These problems
              appear twice — here, and in their real category slot below. */}
            {ready.length > 0 ? (
              <section aria-labelledby="available-now">
                <SectionHeading id="available-now" label="Available now" />
                <CardGrid>
                  {ready.map((problem) => (
                    <ProblemCard key={problem.slug} problem={problem} />
                  ))}
                </CardGrid>
              </section>
            ) : null}

            {sections.map((section) => {
              const id = categoryId(section.category);
              return (
                <section
                  key={id}
                  id={id}
                  aria-labelledby={`${id}-heading`}
                  // Cheap version of virtualization: the browser skips layout and
                  // paint for offscreen sections. One CSS line instead of a
                  // windowing library, and it keeps the HTML fully static.
                  style={{
                    contentVisibility: "auto",
                    containIntrinsicSize: "auto 640px",
                  }}
                  // className="scroll-mt-64"
                >
                  <SectionHeading
                    id={`${id}-heading`}
                    label={section.category}
                    count={section.problems.length}
                  />
                  <CardGrid>
                    {section.problems.map((problem) => (
                      <ProblemCard key={problem.slug} problem={problem} />
                    ))}
                  </CardGrid>
                </section>
              );
            })}
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function SectionHeading({
  id,
  label,
  count,
}: {
  id: string;
  label: string;
  count?: number;
}) {
  return (
    <h2
      id={id}
      className="mb-24 flex items-baseline gap-12 border-b border-border-hairline pb-12 font-mono text-mono-13 tracking-label-widest text-text-muted uppercase"
    >
      {label}
      {count === undefined ? null : (
        <span className="text-text-muted-dim">{count}</span>
      )}
    </h2>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-24 sm:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}
