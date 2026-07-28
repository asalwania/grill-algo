"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PlayerProvider, usePlayerState, Controls } from "@/components/player";
import { NarrationStrip, CodePaneStack, MobileVariablesSheet } from "@/components/panels";
import type { Approach, Language, ProblemMeta, TwoSumFrame } from "@/lib/types";
import { ProblemHeader } from "./ProblemHeader";
import { ScenePanel } from "./ScenePanel";

type ProblemViewProps = {
  meta: ProblemMeta;
  framesByApproach: Record<Approach, TwoSumFrame[]>;
  panes: Record<Approach, Record<Language, ReactNode>>;
  lineMaps: Record<Approach, Record<Language, Record<number, number>>>;
  lines: Record<Approach, number[]>;
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
  framesByApproach,
  panes,
  lineMaps,
  lines,
}: ProblemViewProps) {
  const { approach, step } = usePlayerState();
  const frames = framesByApproach[approach];
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
    <div className="flex flex-col lg:grid lg:h-screen lg:grid-cols-[45%_55%] lg:grid-rows-[auto_1fr_auto] lg:overflow-hidden">
      <ProblemHeader
        meta={meta}
        className="lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-2"
      />

      <ScenePanel
        frames={frames}
        frame={frame}
        className="sticky top-0 z-10 h-[40vh] flex-none lg:relative lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-4 lg:h-auto lg:border-l lg:border-border-hairline"
      />

      <NarrationStrip
        frame={frame}
        className="mx-16 my-16 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2 lg:mx-32 lg:my-24"
      />

      <CodePaneStack
        panes={panes}
        lineMaps={lineMaps}
        lines={lines}
        className="px-16 py-16 lg:col-start-1 lg:col-end-2 lg:row-start-2 lg:row-end-3 lg:overflow-y-auto lg:px-32"
        style={{ paddingBottom: footerHeight }}
      />

      <div
        ref={footerRef}
        className="fixed inset-x-0 bottom-0 z-20 flex flex-col lg:contents"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <MobileVariablesSheet frame={frame} className="lg:hidden" />
        <Controls
          frameCount={frameCount}
          className="border-t border-border-hairline bg-surface-canvas px-20 py-16 lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4 lg:border-t lg:px-32 lg:py-24"
        />
      </div>
    </div>
  );
}

export function ProblemView(props: ProblemViewProps) {
  const frameCounts: Record<Approach, number> = {
    optimized: props.framesByApproach.optimized.length,
    brute: props.framesByApproach.brute.length,
  };

  return (
    <PlayerProvider frameCounts={frameCounts}>
      <ProblemViewLayout {...props} />
    </PlayerProvider>
  );
}
