"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  SceneShell,
  LabelLayer,
  ArrayMemoryScene,
  detectWebGLSupport,
  type LabelLayerHandle,
  type SceneShellHandle,
  type SlotScreenPosition,
  type TileScreenPosition,
} from "@/components/scene";
import { VariablesPanel } from "@/components/panels";
import { RenderModeToggle, usePlayerState } from "@/components/player";
import type { ArrayMemoryFrame } from "@/lib/types";
import { ArrayMemoryFlatView } from "./FlatView";
import type { ProblemChrome } from "./types";

type ScenePanelProps = {
  /**
   * Remounts the scene subtree (and its label overlay) when it changes. Both
   * size ref arrays and spring state to `nums.length` on mount, so a switch to
   * an input with a different array length has to remount rather than
   * re-render. The Canvas itself is deliberately NOT keyed: it owns the WebGL
   * context and the camera rig, neither of which depends on the trace.
   */
  resetKey: string;
  /** Frames for the CURRENTLY SELECTED approach only — the caller has already
   *  resolved `framesByCase[state.caseId][state.approach]`, matching
   *  ArrayMemoryScene's own contract. */
  frames: ArrayMemoryFrame[];
  /** Current frame (same resolution as `frames[step]`) — read here for the
   *  desktop floating VariablesPanel overlay, the flat view, and the label
   *  layer's per-frame values. */
  frame: ArrayMemoryFrame;
  /** Problem-specific labels and formatters, forwarded to the flat view. */
  chrome: ProblemChrome;
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

/**
 * F15 — the Fullscreen API is entirely client/browser-only. Unlike
 * SceneShell's `detectWebGLSupport` (which can assume `true` on the server and
 * still match the client), `document.fullscreenEnabled` is `false` on the
 * server but `true` on the client — so a lazy `useState` initializer renders
 * `null` on the server and a `<button>` on the client's first render, which is
 * a hydration mismatch that makes React throw away and regenerate the whole
 * scene subtree (canvas + label overlay).
 *
 * `useSyncExternalStore` is the fix: React uses the server snapshot (`false`)
 * for both the SSR render and the client's hydrating render — so they agree,
 * no mismatch — then immediately re-renders with the client snapshot. Support
 * never actually changes at runtime, hence the empty (no-op) subscribe.
 */
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
 * F15 — the whole visualization stage, self-contained: canvas + DOM label
 * overlay + the fullscreen toggle + (desktop only) the floating VariablesPanel
 * card. Mounted exactly once by the problem view and repositioned per
 * breakpoint via `className` (sticky 40vh strip on mobile, right column on
 * desktop) — never duplicated, since a second mount would mean a second WebGL
 * context and a second F12 camera rig fighting the same player state.
 */
export function ScenePanel({
  resetKey,
  frames,
  frame,
  chrome,
  className = "",
}: ScenePanelProps) {
  const { isPlaying, renderMode } = usePlayerState();
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRig = useRef<SceneShellHandle>(null);
  const labelLayerRef = useRef<LabelLayerHandle>(null);
  // Same lazy-initializer rationale as SceneShell's own copy: assumes support
  // on the server (so SSR and the hydrating render agree) and runs the real
  // probe on the client's first render, with no extra post-hydration pass.
  const [webglSupported] = useState(detectWebGLSupport);
  // F16 — the Canvas is not merely hidden in 2D, it is never mounted: a
  // parked WebGL context still holds GPU memory and counts against the
  // browser's per-page context limit.
  const showCanvas = webglSupported && renderMode === "3d";

  const handleTilePositions = useCallback((positions: TileScreenPosition[]) => {
    labelLayerRef.current?.update(positions);
  }, []);

  const handleSlotPositions = useCallback((positions: SlotScreenPosition[]) => {
    // ArrayMemoryScene calls onTilePositions every frame too — LabelLayer.update
    // takes both together, so slot positions ride along on the same call
    // rather than needing their own imperative path.
    labelLayerRef.current?.update([], positions);
  }, []);

  // Per FRAME, not per trace: a sort-based approach reorders the array
  // mid-run (lib/types.ts), so reading this once off `frames[0]` would leave
  // every label pinned to the pre-sort value. Only the length is invariant,
  // which is what keeps LabelLayer's ref arrays stable across the change.
  const values = frame.scene.nums;
  const labels = frame.scene.labels;
  const slotCapacity = frames.some((f) => f.scene.slots.length > 0) ? values.length : 0;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-surface-canvas ${className}`}
    >
      {showCanvas ? (
        <>
          <SceneShell
            ref={cameraRig}
            isPlaying={isPlaying}
            // Unreachable in practice — `showCanvas` already gated on the same
            // probe — but SceneShell's own gate stays authoritative rather than
            // being duplicated away, so it can never render nothing.
            fallback={<ArrayMemoryFlatView frame={frame} chrome={chrome} isFallback />}
            initialCameraPosition={[2.5, 3.5, 8]}
          >
            <ArrayMemoryScene
              key={resetKey}
              frames={frames}
              onTilePositions={handleTilePositions}
              onSlotPositions={handleSlotPositions}
              cameraRig={cameraRig}
            />
          </SceneShell>
          <LabelLayer
            key={resetKey}
            ref={labelLayerRef}
            values={values}
            labels={labels}
            slotCapacity={slotCapacity}
          />
          <div className="pointer-events-none absolute bottom-16 left-16 hidden lg:block">
            <div className="pointer-events-auto">
              <VariablesPanel frame={frame} />
            </div>
          </div>
        </>
      ) : (
        <ArrayMemoryFlatView
          frame={frame}
          chrome={chrome}
          isFallback={!webglSupported}
        >
          {/* Below lg the MobileVariablesSheet already covers this. */}
          <div className="hidden lg:block">
            <VariablesPanel frame={frame} />
          </div>
        </ArrayMemoryFlatView>
      )}

      <FullscreenButton targetRef={containerRef} />
      <RenderModeToggle
        forced2d={!webglSupported}
        className="absolute bottom-12 right-12 z-10 lg:bottom-16 lg:right-16"
      />
    </div>
  );
}
