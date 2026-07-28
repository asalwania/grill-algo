"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  PlayerProvider,
  usePlayerState,
  Controls,
  type FrameCounts,
} from "@/components/player";
import { NarrationStrip, CodePaneStack, MobileVariablesSheet } from "@/components/panels";
import type {
  Approach,
  Language,
  ProblemMeta,
  TestCase,
  TwoSumFrame,
} from "@/lib/types";
import { ProblemBrief } from "./ProblemBrief";
import { ProblemHeader } from "./ProblemHeader";
import { ScenePanel } from "./ScenePanel";

type ProblemViewProps = {
  meta: ProblemMeta;
  cases: TestCase[];
  /** Keyed by case id, then approach — every pre-generated trace. */
  framesByCase: Record<string, Record<Approach, TwoSumFrame[]>>;
  panes: Record<Approach, Record<Language, ReactNode>>;
  lineMaps: Record<Approach, Record<Language, Record<number, number>>>;
  /** `frame.line` per step, keyed by case id then approach. */
  lines: Record<string, Record<Approach, number[]>>;
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
  framesByCase,
  panes,
  lineMaps,
  lines,
  answers,
}: ProblemViewProps & { answers: Record<string, string> }) {
  const { approach, caseId, step } = usePlayerState();
  const frames = framesByCase[caseId][approach];
  const frame = frames[Math.min(step, frames.length - 1)];
  const frameCount = frames.length;

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

  return (
    <div className="flex flex-col lg:grid lg:h-screen lg:grid-cols-[45%_55%] lg:grid-rows-[auto_1fr_auto_auto] lg:overflow-hidden">
      <ProblemHeader
        meta={meta}
        className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
      />

      <ScenePanel
        // The scene sizes its per-tile ref arrays once at mount (scene.tsx's
        // ArrayTiles/HashMapWall), so a case with a different `nums.length`
        // must remount it rather than re-render it. Keyed here, not on
        // <ScenePanel> itself, so the WebGL context and camera rig survive.
        resetKey={caseId}
        frames={frames}
        frame={frame}
        className="sticky top-0 z-10 h-[40vh] flex-none lg:relative lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-5 lg:h-auto lg:border-l lg:border-border-hairline"
      />

      <NarrationStrip
        frame={frame}
        className="mx-16 my-16 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:mx-32 lg:my-24"
      />

      <CodePaneStack
        panes={panes}
        lineMaps={lineMaps}
        lines={lines}
        className="px-16 py-16 lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3 lg:min-h-0 lg:overflow-y-auto lg:px-32"
      />

      <ProblemBrief
        cases={cases}
        answers={answers}
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

/** `[3, 5]` / `[]`, read straight off the last frame of a shipped trace — the
 *  generator already computed it at build time, so nothing solves anything
 *  here (AGENTS.md). */
function formatAnswer(frames: TwoSumFrame[]): string {
  const result = frames[frames.length - 1]?.scene.result ?? null;
  return result === null ? "[]" : `[${result[0]}, ${result[1]}]`;
}

export function ProblemView(props: ProblemViewProps) {
  const { cases, framesByCase } = props;

  const frameCounts: FrameCounts = useMemo(
    () =>
      Object.fromEntries(
        cases.map((input) => [
          input.id,
          {
            optimized: framesByCase[input.id].optimized.length,
            brute: framesByCase[input.id].brute.length,
          },
        ]),
      ),
    [cases, framesByCase],
  );

  const answers = useMemo(
    () =>
      Object.fromEntries(
        cases.map((input) => [
          input.id,
          formatAnswer(framesByCase[input.id].optimized),
        ]),
      ),
    [cases, framesByCase],
  );

  return (
    <PlayerProvider frameCounts={frameCounts} initialCaseId={cases[0].id}>
      <ProblemViewLayout {...props} answers={answers} />
    </PlayerProvider>
  );
}
