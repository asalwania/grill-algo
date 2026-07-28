import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType, ReactNode } from "react";
import { CodePane } from "@/components/panels/CodePane";
import type { ArrayMemoryProblemViewProps } from "@/components/problem";
import { getProblem, getProblemMeta, getProblemSlugs } from "@/lib/content";
import type { Approach, ArrayMemoryScene, Language } from "@/lib/types";
import { ProblemView as TwoSumView } from "@/content/problems/two-sum/ProblemView";
import { ProblemView as ContainsDuplicateView } from "@/content/problems/contains-duplicate/ProblemView";
import { ProblemView as ValidAnagramView } from "@/content/problems/valid-anagram/ProblemView";
import { ProblemView as GroupAnagramsView } from "@/content/problems/group-anagrams/ProblemView";
import { ProblemView as TopKFrequentElementsView } from "@/content/problems/top-k-frequent-elements/ProblemView";

const LANGUAGES: Language[] = ["javascript", "python", "java", "go"];

/**
 * Slug -> the problem's own client view.
 *
 * Each entry is a thin wrapper supplying that problem's `ProblemChrome` and
 * brief to the shared `ArrayMemoryProblemView`; everything else on the page is
 * common. A registry rather than a prop because chrome holds functions, which
 * cannot cross the RSC boundary — so the choice has to be made by importing a
 * client module, not by passing data to one.
 *
 * Note this bundles every registered problem's chrome into the one
 * `/problems/[slug]` route. That is inherent to a dynamic route (a client-side
 * registry would do the same), and at two problems it is a few hundred bytes;
 * it becomes worth revisiting — via `next/dynamic` per slug — well before 150.
 */
const VIEWS: Record<
  string,
  ComponentType<Omit<ArrayMemoryProblemViewProps, "chrome" | "brief">>
> = {
  "two-sum": TwoSumView,
  "contains-duplicate": ContainsDuplicateView,
  "valid-anagram": ValidAnagramView,
  "group-anagrams": GroupAnagramsView,
  "top-k-frequent-elements": TopKFrequentElementsView,
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

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { slug } = await params;

  const View = VIEWS[slug];
  // A content directory with no registered view is a half-built problem, not
  // a 500 — generateStaticParams reads the directory, so this is reachable the
  // moment someone scaffolds content/problems/<slug>/ without wiring it up.
  if (!View) notFound();

  const problem = await getProblem<ArrayMemoryScene>(slug);

  const panes: Partial<Record<Approach, Record<Language, ReactNode>>> = {};
  const lineMaps: Partial<
    Record<Approach, Record<Language, Record<number, number>>>
  > = {};
  // Panes and lineMaps are per approach x language only — a code listing never
  // depends on which input is playing. `lines` does, since it is the trace's
  // own per-step line sequence.
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

  return (
    <View
      meta={problem.meta}
      cases={problem.cases}
      approaches={problem.approaches}
      framesByCase={problem.frames}
      panes={panes}
      lineMaps={lineMaps}
      lines={lines}
    />
  );
}
