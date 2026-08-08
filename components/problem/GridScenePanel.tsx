"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  SceneShell,
  GridLabelLayer,
  GridScene,
  detectWebGLSupport,
  type CellScreenPosition,
  type GridBoxSize,
  type GridLabelLayerHandle,
} from "@/components/scene";
import { VariablesPanel } from "@/components/panels";
import { RenderModeToggle, usePlayerState } from "@/components/player";
import type { GridFrame } from "@/lib/types";
import { GridFlatView } from "./GridFlatView";
import type { GridChrome } from "./types";

type GridScenePanelProps = {
  /** Same remount-on-case-change contract as ScenePanel's resetKey — a case
   *  with a different board size would need to remount the cell ref arrays,
   *  though Sudoku itself is always 9x9. */
  resetKey: string;
  frames: GridFrame[];
  frame: GridFrame;
  chrome: GridChrome;
  /** Opt-in sub-block accent (Sudoku's 3x3 boxes) — see GridScene's GridBoxSize. */
  boxSize?: GridBoxSize;
  className?: string;
};

function ExpandIcon({ isFullscreen }: { isFullscreen: boolean }) {
  return isFullscreen ? (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ) : (
    <svg aria-hidden width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path
        d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Same hydration-mismatch rationale as ScenePanel's own copy: the server
// snapshot must be `false` so SSR and the hydrating render agree.
function detectFullscreenSupport(): boolean {
  return typeof document !== "undefined" && !!document.fullscreenEnabled;
}

const EMPTY_SUBSCRIBE = () => () => {};

function FullscreenButton({ targetRef }: { targetRef: React.RefObject<HTMLDivElement | null> }) {
  const supported = useSyncExternalStore(EMPTY_SUBSCRIBE, detectFullscreenSupport, () => false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(document.fullscreenElement === targetRef.current);
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, [targetRef]);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      targetRef.current?.requestFullscreen();
    }
  }, [targetRef]);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      className="absolute right-12 top-12 z-10 flex h-32 w-32 items-center justify-center rounded-control border border-border-hairline bg-surface-glass text-text-muted backdrop-blur-md transition-colors hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan lg:right-16 lg:top-16"
    >
      <ExpandIcon isFullscreen={isFullscreen} />
    </button>
  );
}

/**
 * The grid family's visualization stage — canvas + DOM label overlay +
 * fullscreen toggle + (desktop) floating VariablesPanel, same shell ScenePanel
 * builds for the array family. No `cameraRig`/`onSlotPositions` wiring here:
 * GridScene has neither a camera choreography nor a memory wall (see its own
 * doc comment).
 */
export function GridScenePanel({
  resetKey,
  frames,
  frame,
  chrome,
  boxSize,
  className = "",
}: GridScenePanelProps) {
  const { isPlaying, renderMode } = usePlayerState();
  const containerRef = useRef<HTMLDivElement>(null);
  const labelLayerRef = useRef<GridLabelLayerHandle>(null);
  const [webglSupported] = useState(detectWebGLSupport);
  const showCanvas = webglSupported && renderMode === "3d";

  const handleCellPositions = useCallback((positions: CellScreenPosition[]) => {
    labelLayerRef.current?.update(positions);
  }, []);

  // Per FRAME: GridScene.values never actually changes mid-trace for Valid
  // Sudoku (the board is read-only input), but the type is per-frame so a
  // future problem that DOES mutate cells (Sudoku solving, island-sinking)
  // stays correct without this panel changing.
  const values = frame.scene.values;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-surface-canvas ${className}`}
    >
      {showCanvas ? (
        <>
          <SceneShell
            isPlaying={isPlaying}
            fallback={<GridFlatView frame={frame} chrome={chrome} boxSize={boxSize} isFallback />}
            initialCameraPosition={[0, 7.5, 6.5]}
          >
            <GridScene
              key={resetKey}
              frames={frames}
              boxSize={boxSize}
              onCellPositions={handleCellPositions}
            />
          </SceneShell>
          <GridLabelLayer key={resetKey} ref={labelLayerRef} values={values} />
          <div className="pointer-events-none absolute bottom-16 left-16 hidden lg:block">
            <div className="pointer-events-auto">
              <VariablesPanel frame={frame} />
            </div>
          </div>
        </>
      ) : (
        <GridFlatView frame={frame} chrome={chrome} boxSize={boxSize} isFallback={!webglSupported}>
          <div className="hidden lg:block">
            <VariablesPanel frame={frame} />
          </div>
        </GridFlatView>
      )}

      <FullscreenButton targetRef={containerRef} />
      <RenderModeToggle
        forced2d={!webglSupported}
        className="absolute bottom-12 right-12 z-10 lg:bottom-16 lg:right-16"
      />
    </div>
  );
}
