"use client";

import { usePlayerDispatch, usePlayerState } from "./PlayerProvider";
import type { RenderMode } from "@/lib/types";

const MODES: { value: RenderMode; label: string }[] = [
  { value: "3d", label: "3D" },
  { value: "2d", label: "2D" },
];

const SEGMENT_BASE =
  "flex h-24 items-center justify-center rounded-pill px-12 font-mono text-mono-13 tracking-label-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";
const SEGMENT_ACTIVE = "bg-signal-cyan-fill text-signal-cyan";
const SEGMENT_INACTIVE = "text-text-muted hover:text-text-primary";

type RenderModeToggleProps = {
  /**
   * Set when WebGL is unavailable: the toggle still renders (so the reason the
   * scene looks flat is visible rather than mysterious) but 3D is unselectable,
   * because there is nothing to select — SceneShell would fall straight back to
   * the same flat view.
   */
  forced2d?: boolean;
  className?: string;
};

/**
 * The "3D / 2D" segmented toggle the S3 mock puts bottom-right of the scene
 * panel. Dispatch-only, exactly like ApproachTabs: `renderMode` already lives
 * in player state (PlayerProvider's SET_RENDER_MODE), and ScenePanel is what
 * reads it back to decide whether to mount the Canvas at all.
 *
 * Deliberately NOT inside the Canvas subtree — mounting it there would tie the
 * control that unmounts the renderer to the renderer's own lifecycle.
 */
export function RenderModeToggle({ forced2d = false, className = "" }: RenderModeToggleProps) {
  const { renderMode } = usePlayerState();
  const dispatch = usePlayerDispatch();
  const effectiveMode: RenderMode = forced2d ? "2d" : renderMode;

  return (
    <div
      role="radiogroup"
      aria-label="Visualization render mode"
      className={`flex items-center gap-4 rounded-pill border border-border-hairline bg-surface-glass p-4 backdrop-blur-panel ${className}`}
    >
      {MODES.map((mode) => {
        const isActive = effectiveMode === mode.value;
        const isDisabled = forced2d && mode.value === "3d";
        return (
          <button
            key={mode.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={isDisabled}
            title={isDisabled ? "3D unavailable — WebGL isn't supported here" : undefined}
            onClick={() => dispatch({ type: "SET_RENDER_MODE", renderMode: mode.value })}
            className={`${SEGMENT_BASE} ${isActive ? SEGMENT_ACTIVE : SEGMENT_INACTIVE} ${
              isDisabled ? "cursor-not-allowed opacity-40 hover:text-text-muted" : ""
            }`}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
