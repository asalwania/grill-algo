"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  PlayerProvider,
  usePlayerState,
  Controls,
  type FrameCounts,
} from "@/components/player";
import { NarrationStrip, CodePaneStack, MobileVariablesSheet } from "@/components/panels";
import type { GridBoxSize } from "@/components/scene";
import type {
  Approach,
  ApproachMove,
  GridFrame,
  Language,
  PaperStroke,
  ProblemMeta,
  TestCase,
} from "@/lib/types";
import { ProblemHeader } from "./ProblemHeader";
import { GridScenePanel } from "./GridScenePanel";
import type { AdjacentProblem, GridChrome, GridProblemBriefProps } from "./types";

export type GridProblemViewProps = {
  meta: ProblemMeta;
  cases: TestCase[];
  approaches: Approach[];
  framesByCase: Record<string, Partial<Record<Approach, GridFrame[]>>>;
  panes: Partial<Record<Approach, Record<Language, ReactNode>>>;
  lineMaps: Partial<Record<Approach, Record<Language, Record<number, number>>>>;
  lines: Record<string, Partial<Record<Approach, number[]>>>;
  chrome: GridChrome;
  brief: ComponentType<GridProblemBriefProps>;
  /** Opt-in sub-block accent threaded down to GridScene/GridFlatView (Sudoku's
   *  3x3 boxes). Omitted by a grid problem with no sub-block structure. */
  boxSize?: GridBoxSize;
  paper?: PaperStroke[] | null;
  approach?: ApproachMove[] | null;
  /** The previous/next problem in catalog order, or null at either end. */
  prev?: AdjacentProblem | null;
  next?: AdjacentProblem | null;
};

/**
 * Same shared-layout-for-both-breakpoints structure as ArrayMemoryProblemView's
 * ProblemViewLayout — see that file's doc comment for the mobile/desktop split
 * rationale, unchanged here.
 */
function ProblemViewLayout({
  meta,
  cases,
  approaches,
  framesByCase,
  panes,
  lineMaps,
  lines,
  chrome,
  brief: Brief,
  boxSize,
  paper,
  approach: approachWalkthrough,
  prev,
  next,
  answers,
  found,
}: GridProblemViewProps & {
  answers: Record<string, string>;
  found: Record<string, boolean>;
}) {
  const { approach, caseId, step } = usePlayerState();

  const footerRef = useRef<HTMLDivElement>(null);
  const [footerHeight, setFooterHeight] = useState(0);

  useEffect(() => {
    const node = footerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setFooterHeight(entries[0]?.contentRect.height ?? 0);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeApproach = approaches.includes(approach) ? approach : approaches[0];

  const frames = framesByCase[caseId][activeApproach];
  const pane = panes[activeApproach];
  const lineMap = lineMaps[activeApproach];
  const stepLines = lines[caseId][activeApproach];

  if (!frames || !pane || !lineMap || !stepLines) {
    throw new Error(
      `Incomplete data for case "${caseId}" / approach "${activeApproach}" — ` +
        `approaches.json, the generated frame files and solutions/index.ts are out of sync.`,
    );
  }

  const frame = frames[Math.min(step, frames.length - 1)];
  const frameCount = frames.length;

  return (
    <div className="flex flex-col lg:grid lg:h-screen lg:grid-cols-[45%_55%] lg:grid-rows-[auto_1fr_auto_auto] lg:overflow-hidden">
      <ProblemHeader
        meta={meta}
        approaches={approaches}
        complexity={chrome.complexity}
        paper={paper}
        approach={approachWalkthrough}
        prev={prev}
        next={next}
        className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
      />

      <GridScenePanel
        resetKey={caseId}
        frames={frames}
        frame={frame}
        chrome={chrome}
        boxSize={boxSize}
        className="sticky top-0 z-10 h-[40vh] flex-none lg:relative lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-5 lg:h-auto lg:border-l lg:border-border-hairline"
      />

      <NarrationStrip
        frame={frame}
        className="mx-16 my-16 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:mx-32 lg:my-24"
      />

      <CodePaneStack
        panes={pane}
        lineMaps={lineMap}
        lines={stepLines}
        className="px-16 py-16 lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3 lg:min-h-0 lg:overflow-y-auto lg:px-32"
      />

      <Brief
        cases={cases}
        answers={answers}
        found={found}
        chrome={chrome}
        style={{ paddingBottom: footerHeight ? footerHeight + 16 : undefined }}
        className="px-16 pt-16 lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4 lg:max-h-[38vh] lg:overflow-y-auto lg:px-32 lg:py-20"
      />

      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-20 flex flex-col lg:contents"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <MobileVariablesSheet frame={frame} className="lg:hidden" />
        <Controls
          frameCount={frameCount}
          className="border-t border-border-hairline bg-surface-canvas px-20 py-16 lg:col-start-1 lg:col-end-2 lg:row-start-4 lg:row-end-5 lg:border-t lg:px-32 lg:py-24"
        />
      </div>
    </div>
  );
}

/**
 * The shared learning view for the grid-problem family — GridScenePanel's
 * sibling of ArrayMemoryProblemView. Everything problem-specific arrives as
 * `chrome`, `brief` and the optional `boxSize` accent; everything else is the
 * same page for every problem in the family.
 */
export function GridProblemView(props: GridProblemViewProps) {
  const { cases, approaches, framesByCase, chrome } = props;

  const frameCounts: FrameCounts = useMemo(
    () =>
      Object.fromEntries(
        cases.map((input) => [
          input.id,
          Object.fromEntries(
            approaches.map((approach) => [
              approach,
              framesByCase[input.id][approach]?.length ?? 0,
            ]),
          ),
        ]),
      ),
    [cases, approaches, framesByCase],
  );

  const { answers, found } = useMemo(() => {
    const answers: Record<string, string> = {};
    const found: Record<string, boolean> = {};
    for (const input of cases) {
      const frames = framesByCase[input.id][approaches[0]] ?? [];
      const result = frames[frames.length - 1]?.scene.result ?? null;
      const answer = chrome.formatAnswer(result);
      answers[input.id] = answer;
      // Unlike ArrayMemoryProblemView's `result !== null`: for the array
      // family "result populated" always happens to be the positive/green
      // story (a pair found, a duplicate found). For a grid problem `result`
      // is the CONFLICT — populated is the *invalid* story — so the pill has
      // to key off the rendered answer itself, not off whether a pair exists.
      found[input.id] = answer === "true";
    }
    return { answers, found };
  }, [cases, approaches, framesByCase, chrome]);

  return (
    <PlayerProvider
      frameCounts={frameCounts}
      initialCaseId={cases[0].id}
      initialApproach={approaches[0]}
    >
      <ProblemViewLayout {...props} answers={answers} found={found} />
    </PlayerProvider>
  );
}
