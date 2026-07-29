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
import type {
  Approach,
  ArrayMemoryFrame,
  Language,
  PaperStroke,
  ProblemMeta,
  TestCase,
} from "@/lib/types";
import { ProblemHeader } from "./ProblemHeader";
import { ScenePanel } from "./ScenePanel";
import type { ProblemBriefProps, ProblemChrome } from "./types";

export type ArrayMemoryProblemViewProps = {
  meta: ProblemMeta;
  cases: TestCase[];
  /** Approaches this problem ships, in tab order; the first is the default
   *  selection. From approaches.json — never the full union. */
  approaches: Approach[];
  /** Keyed by case id, then approach. Partial in the approach axis: only the
   *  keys in `approaches` are present (lib/content.ts). */
  framesByCase: Record<string, Partial<Record<Approach, ArrayMemoryFrame[]>>>;
  /** Per approach, then per language. Partial in the approach axis for the
   *  same reason `framesByCase` is — only declared approaches are built. */
  panes: Partial<Record<Approach, Record<Language, ReactNode>>>;
  lineMaps: Partial<Record<Approach, Record<Language, Record<number, number>>>>;
  /** `frame.line` per step, keyed by case id then approach. */
  lines: Record<string, Partial<Record<Approach, number[]>>>;
  /** Problem-specific labels and formatters (see ProblemChrome). Supplied by
   *  the problem's own client wrapper, because it holds functions and so
   *  cannot cross the RSC boundary. */
  chrome: ProblemChrome;
  /** The problem in plain words, plus the input picker. Problem-specific
   *  prose, so it is a component rather than a string. */
  brief: ComponentType<ProblemBriefProps>;
  /** The handwritten dry run, or null for a problem with no `paper.ts`. Plain
   *  data, so unlike `chrome` it arrives straight from the route. */
  paper?: PaperStroke[] | null;
};

/**
 * F15 — one shared DOM tree for both breakpoints. Mobile is a normal
 * `flex-col` document flow (the scene panel goes `sticky` within it, per the
 * spec's literal wording — everything below scrolls under it); at `lg:` the
 * same container switches to a CSS Grid split view and every child gets
 * grid-area placement instead. Nothing that owns real resources (the R3F
 * canvas, Controls' window keydown listener) is ever mounted twice — only
 * `className` differs per breakpoint, matching AGENTS.md's Controls/scene
 * singletons.
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
  paper,
  answers,
  found,
}: ArrayMemoryProblemViewProps & {
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

  // The approach axis is Partial everywhere below (only declared approaches
  // are built), so it is resolved ONCE here and every consumer is handed the
  // already-resolved slice. Falling back to the default is unreachable in
  // practice — the provider is seeded with `approaches[0]` and ApproachTabs
  // only ever dispatches a value it was given — but a render must not be able
  // to produce `undefined`, and resolving it in each consumer separately would
  // let the code pane and the scene disagree about which approach is showing.
  const activeApproach = approaches.includes(approach) ? approach : approaches[0];

  const frames = framesByCase[caseId][activeApproach];
  const pane = panes[activeApproach];
  const lineMap = lineMaps[activeApproach];
  const stepLines = lines[caseId][activeApproach];

  if (!frames || !pane || !lineMap || !stepLines) {
    // approaches.json, the frame files and the per-approach solutions are all
    // produced in the same pass, so this only fires if they drifted apart.
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
        className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
      />

      <ScenePanel
        // The scene sizes its per-tile ref arrays once at mount
        // (ArrayMemoryScene's ArrayTiles/MemoryWall), so a case with a
        // different `nums.length` must remount it rather than re-render it.
        // Keyed here, not on <ScenePanel> itself, so the WebGL context and
        // camera rig survive.
        resetKey={caseId}
        frames={frames}
        frame={frame}
        chrome={chrome}
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
        // On mobile this is the last thing in the document, so it — not the
        // code pane — is what has to clear the fixed footer. On desktop the
        // footer wrapper is `lg:contents` and has no box, so the measured
        // height is 0; `undefined` (not 0) so the class-based `lg:py-20` is
        // not overridden by an inline zero.
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
 * The shared learning view for the "one array, optionally one remembered
 * structure behind it" family. Everything problem-specific arrives as
 * `chrome` and `brief`; everything else here is the same page for every
 * problem in the family.
 */
export function ArrayMemoryProblemView(props: ArrayMemoryProblemViewProps) {
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

  /**
   * The answer per case, read straight off the last frame of a shipped trace —
   * the generator already computed it at build time, so nothing solves
   * anything here (AGENTS.md).
   *
   * Taken from the DEFAULT approach's frames on purpose. Every approach agrees
   * on the answer, but not necessarily on the indices that express it: a
   * sort-based approach reports positions in the SORTED array. Reading one
   * fixed approach keeps the picker's label stable while you switch tabs.
   */
  const { answers, found } = useMemo(() => {
    const answers: Record<string, string> = {};
    const found: Record<string, boolean> = {};
    for (const input of cases) {
      const frames = framesByCase[input.id][approaches[0]] ?? [];
      const result = frames[frames.length - 1]?.scene.result ?? null;
      answers[input.id] = chrome.formatAnswer(result);
      found[input.id] = result !== null;
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
