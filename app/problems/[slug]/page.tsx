import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { CodePane } from "@/components/panels/CodePane";
import { getProblem, getProblemSlugs } from "@/lib/content";
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
  const lines: Record<Approach, number[]> = {} as Record<Approach, number[]>;

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
    lines[approach] = problem.frames[approach].map((frame) => frame.line);
  }

  return (
    <ProblemView
      meta={problem.meta}
      framesByApproach={problem.frames}
      panes={panes}
      lineMaps={lineMaps}
      lines={lines}
    />
  );
}
