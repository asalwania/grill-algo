import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CodePane } from "@/components/panels/CodePane";
import { getProblem, getProblemMeta, getProblemSlugs } from "@/lib/content";
import type { Approach, Language, TwoSumScene as TwoSumSceneType } from "@/lib/types";
import { ProblemView } from "@/content/problems/two-sum/ProblemView";

const APPROACHES: Approach[] = ["optimized", "brute"];
const LANGUAGES: Language[] = ["javascript", "python", "java", "go"];

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

  // Single-problem scope (AGENTS.md) — the loader is generic over TScene, but
  // this page only ever composes Two Sum's own scene component, so nothing
  // here needs to branch on which problem it's showing.
  if (slug !== "two-sum") notFound();

  const problem = await getProblem<TwoSumSceneType>(slug);

  const panes: Record<Approach, Record<Language, ReactNode>> = {} as Record<
    Approach,
    Record<Language, ReactNode>
  >;
  const lineMaps: Record<Approach, Record<Language, Record<number, number>>> = {} as Record<
    Approach,
    Record<Language, Record<number, number>>
  >;
  // Panes and lineMaps are per approach x language only — a code listing never
  // depends on which input is playing. `lines` does, since it is the trace's
  // own per-step line sequence.
  const lines: Record<string, Record<Approach, number[]>> = {};

  for (const approach of APPROACHES) {
    const paneByLanguage = {} as Record<Language, ReactNode>;
    const lineMapByLanguage = {} as Record<Language, Record<number, number>>;

    for (const language of LANGUAGES) {
      const solution = problem.solutions[approach].find((s) => s.language === language);
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
    lines[testCase.id] = {
      optimized: problem.frames[testCase.id].optimized.map((frame) => frame.line),
      brute: problem.frames[testCase.id].brute.map((frame) => frame.line),
    };
  }

  return (
    <ProblemView
      meta={problem.meta}
      cases={problem.cases}
      framesByCase={problem.frames}
      panes={panes}
      lineMaps={lineMaps}
      lines={lines}
    />
  );
}
