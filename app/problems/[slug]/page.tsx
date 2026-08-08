import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { CodePane } from "@/components/panels/CodePane";
import type {
  AdjacentProblem,
  ArrayMemoryProblemViewProps,
  GridProblemViewProps,
} from "@/components/problem";
import { getCatalog, getProblem, getProblemMeta, getProblemSlugs, type Problem } from "@/lib/content";
import { readyProblems } from "@/lib/catalog";
import type { Approach, ArrayMemoryScene, GridScene, Language } from "@/lib/types";
import { ProblemView as TwoSumView } from "@/content/problems/two-sum/ProblemView";
import { ProblemView as ContainsDuplicateView } from "@/content/problems/contains-duplicate/ProblemView";
import { ProblemView as ValidAnagramView } from "@/content/problems/valid-anagram/ProblemView";
import { ProblemView as GroupAnagramsView } from "@/content/problems/group-anagrams/ProblemView";
import { ProblemView as TopKFrequentElementsView } from "@/content/problems/top-k-frequent-elements/ProblemView";
import { ProblemView as EncodeAndDecodeStringsView } from "@/content/problems/encode-and-decode-strings/ProblemView";
import { ProblemView as ProductOfArrayExceptSelfView } from "@/content/problems/product-of-array-except-self/ProblemView";
import { ProblemView as ValidSudokuView } from "@/content/problems/valid-sudoku/ProblemView";
import { ProblemView as LongestConsecutiveSequenceView } from "@/content/problems/longest-consecutive-sequence/ProblemView";
import { ProblemView as ValidPalindromeView } from "@/content/problems/valid-palindrome/ProblemView";

const LANGUAGES: Language[] = ["javascript", "python", "java", "go"];

/**
 * Slug -> the problem's own client view, split by scene family (see
 * `GRID_VIEWS` below) since each family's view expects a differently-typed
 * `chrome`/`framesByCase` and `getProblem` has to be called with the matching
 * `TScene`.
 *
 * Each entry is a thin wrapper supplying that problem's chrome and brief to
 * the shared view; everything else on the page is common. A registry rather
 * than a prop because chrome holds functions, which cannot cross the RSC
 * boundary — so the choice has to be made by importing a client module, not
 * by passing data to one.
 *
 * Note this bundles every registered problem's chrome into the one
 * `/problems/[slug]` route. That is inherent to a dynamic route (a client-side
 * registry would do the same), and at eight problems it is a few hundred
 * bytes; it becomes worth revisiting — via `next/dynamic` per slug — well
 * before 150.
 */
const ARRAY_VIEWS: Record<
  string,
  ComponentType<Omit<ArrayMemoryProblemViewProps, "chrome" | "brief">>
> = {
  "two-sum": TwoSumView,
  "contains-duplicate": ContainsDuplicateView,
  "valid-anagram": ValidAnagramView,
  "group-anagrams": GroupAnagramsView,
  "top-k-frequent-elements": TopKFrequentElementsView,
  "encode-and-decode-strings": EncodeAndDecodeStringsView,
  "product-of-array-except-self": ProductOfArrayExceptSelfView,
  "longest-consecutive-sequence": LongestConsecutiveSequenceView,
  "valid-palindrome": ValidPalindromeView,
};

/** The grid-problem family's own registry — see `ARRAY_VIEWS`. */
const GRID_VIEWS: Record<
  string,
  ComponentType<Omit<GridProblemViewProps, "chrome" | "brief">>
> = {
  "valid-sudoku": ValidSudokuView,
};

export async function generateStaticParams() {
  const slugs = await getProblemSlugs();
  return slugs.map((slug) => ({ slug }));
}

type ProblemPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * Title and description only. F18 still owns canonical, OG image, JSON-LD,
 * sitemap and robots — this is the minimum so the tab doesn't read
 * "Execution Visualizer" on every problem.
 */
export async function generateMetadata({
  params,
}: ProblemPageProps): Promise<Metadata> {
  const { slug } = await params;
  const meta = await getProblemMeta(slug);
  return {
    title: `${meta.number}. ${meta.title}`,
    description: `${meta.blurb} Stepped through one frame at a time, ${meta.difficulty.toLowerCase()}, ${meta.pattern.toLowerCase()}.`,
  };
}

/**
 * Panes/lineMaps/lines are generic over `TScene` — they only ever touch
 * `Approach`/`Language`/`frame.line`, never `frame.scene` — so this is shared
 * by both families rather than duplicated per registry.
 */
function buildPaneProps<TScene>(problem: Problem<TScene>, slug: string) {
  const panes: Partial<Record<Approach, Record<Language, ReactNode>>> = {};
  const lineMaps: Partial<
    Record<Approach, Record<Language, Record<number, number>>>
  > = {};
  // `lines` depends on which input is playing (it's the trace's own per-step
  // line sequence); panes/lineMaps are per approach x language only.
  const lines: Record<string, Partial<Record<Approach, number[]>>> = {};

  // Driven by the problem's OWN approaches (approaches.json), not the
  // `Approach` union: Two Sum ships two, Contains Duplicate three.
  for (const approach of problem.approaches) {
    const solutions = problem.solutions[approach];
    if (!solutions) {
      throw new Error(`Missing ${approach} solutions for problem "${slug}"`);
    }

    const paneByLanguage = {} as Record<Language, ReactNode>;
    const lineMapByLanguage = {} as Record<Language, Record<number, number>>;

    for (const language of LANGUAGES) {
      const solution = solutions.find((s) => s.language === language);
      if (!solution) {
        throw new Error(`Missing ${approach}/${language} solution for problem "${slug}"`);
      }
      paneByLanguage[language] = <CodePane code={solution.code} language={solution.language} />;
      lineMapByLanguage[language] = solution.lineMap;
    }

    panes[approach] = paneByLanguage;
    lineMaps[approach] = lineMapByLanguage;
  }

  for (const testCase of problem.cases) {
    const perApproach: Partial<Record<Approach, number[]>> = {};
    for (const approach of problem.approaches) {
      perApproach[approach] = problem.frames[testCase.id][approach]?.map(
        (frame) => frame.line,
      );
    }
    lines[testCase.id] = perApproach;
  }

  return { panes, lineMaps, lines };
}

/**
 * The problem immediately before/after `slug` in the catalog's authored
 * order, restricted to what's built — the same list and order as
 * `/problems`' "Available now" section. `null` at either end (Two Sum has no
 * prev, the newest problem has no next).
 */
async function getAdjacentProblems(
  slug: string,
): Promise<{ prev: AdjacentProblem | null; next: AdjacentProblem | null }> {
  const ready = readyProblems(await getCatalog());
  const index = ready.findIndex((problem) => problem.slug === slug);
  const toAdjacent = (problem: (typeof ready)[number]): AdjacentProblem => ({
    slug: problem.slug,
    title: problem.title,
  });
  return {
    prev: index > 0 ? toAdjacent(ready[index - 1]) : null,
    next: index >= 0 && index < ready.length - 1 ? toAdjacent(ready[index + 1]) : null,
  };
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;

  // A content directory with no registered view is a half-built problem, not
  // a 500 — generateStaticParams reads the directory, so this is reachable the
  // moment someone scaffolds content/problems/<slug>/ without wiring it up.
  const ArrayView = ARRAY_VIEWS[slug];
  if (ArrayView) {
    const problem = await getProblem<ArrayMemoryScene>(slug);
    const { panes, lineMaps, lines } = buildPaneProps(problem, slug);
    const { prev, next } = await getAdjacentProblems(slug);
    return (
      <ArrayView
        meta={problem.meta}
        cases={problem.cases}
        approaches={problem.approaches}
        framesByCase={problem.frames}
        panes={panes}
        lineMaps={lineMaps}
        lines={lines}
        // Plain data, unlike `chrome` — the generator ran here, at build time,
        // and what crosses is JSON. `null` for a problem with no paper.ts, and
        // the view simply does not offer the button.
        paper={problem.paper}
        // Same deal as `paper`: the approach walkthrough ran at build time and
        // crosses as JSON. `null` for a problem with no approach.ts.
        approach={problem.approach}
        prev={prev}
        next={next}
      />
    );
  }

  const GridView = GRID_VIEWS[slug];
  if (GridView) {
    const problem = await getProblem<GridScene>(slug);
    const { panes, lineMaps, lines } = buildPaneProps(problem, slug);
    const { prev, next } = await getAdjacentProblems(slug);
    return (
      <GridView
        meta={problem.meta}
        cases={problem.cases}
        approaches={problem.approaches}
        framesByCase={problem.frames}
        panes={panes}
        lineMaps={lineMaps}
        lines={lines}
        paper={problem.paper}
        approach={problem.approach}
        prev={prev}
        next={next}
      />
    );
  }

  notFound();
}
