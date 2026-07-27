"use client";

import { memo, useCallback, useEffect, useRef, type Dispatch } from "react";
import { usePlayerDispatch, usePlayerState } from "./PlayerProvider";
import type { PlayerAction } from "./PlayerProvider";

type ControlsProps = {
  /** Frame count for the player's current approach — the reducer owns the
   *  clamp, but the scrubber and step counter still need the total to render. */
  frameCount: number;
};

const SPEEDS = [0.5, 1, 1.5, 2] as const;

function formatSpeed(speed: number): string {
  return `${speed}×`;
}

function nextSpeed(current: number): number {
  const index = SPEEDS.indexOf(current as (typeof SPEEDS)[number]);
  return SPEEDS[index === -1 ? 0 : (index + 1) % SPEEDS.length];
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLInputElement) {
    return !["range", "checkbox", "radio", "button", "submit", "reset"].includes(
      target.type,
    );
  }
  return false;
}

// ---------------------------------------------------------------------------
// Icons — paths lifted directly from the S2/S3 design exports so the shapes
// match exactly (restart = skip-to-start from S3; play/pause faces from S3/S2).
// ---------------------------------------------------------------------------

function RestartIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11 3.5L5 8l6 4.5z" fill="currentColor" />
      <rect x="3.5" y="3.5" width="1.5" height="9" fill="currentColor" />
    </svg>
  );
}

function StepBackIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M5 3.5l7 4.5-7 4.5z" fill="currentColor" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="4" y="3.5" width="2.6" height="9" rx="1" fill="currentColor" />
      <rect x="9.4" y="3.5" width="2.6" height="9" rx="1" fill="currentColor" />
    </svg>
  );
}

function StepForwardIcon() {
  return (
    <svg aria-hidden width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M6 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Transport buttons — memoized on {isPlaying, dispatch} only. `dispatch` is
// stable across renders and `isPlaying` only flips on user action, so this
// subtree skips re-rendering on every step change even though its parent
// re-renders on every NEXT dispatched during playback.
// ---------------------------------------------------------------------------

const ICON_BUTTON =
  "flex h-[44px] w-[44px] items-center justify-center rounded-control border border-border-hairline bg-transparent text-text-muted transition-colors hover:border-signal-cyan-border-mid hover:bg-signal-cyan-fill-weak hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";

const PLAY_BUTTON =
  "flex h-[44px] w-[52px] items-center justify-center rounded-control border border-signal-cyan-border-mid bg-signal-cyan-fill text-signal-cyan transition-colors hover:bg-signal-cyan-fill-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan";

type TransportButtonsProps = {
  isPlaying: boolean;
  dispatch: Dispatch<PlayerAction>;
};

const TransportButtons = memo(function TransportButtons({
  isPlaying,
  dispatch,
}: TransportButtonsProps) {
  return (
    <div className="flex items-center gap-10">
      <button
        type="button"
        aria-label="Restart"
        onClick={() => dispatch({ type: "RESTART" })}
        className={ICON_BUTTON}
      >
        <RestartIcon />
      </button>
      <button
        type="button"
        aria-label="Previous step"
        onClick={() => dispatch({ type: "PREV" })}
        className={ICON_BUTTON}
      >
        <StepBackIcon />
      </button>
      <button
        type="button"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={() => dispatch({ type: isPlaying ? "PAUSE" : "PLAY" })}
        className={PLAY_BUTTON}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        type="button"
        aria-label="Next step"
        onClick={() => dispatch({ type: "NEXT" })}
        className={ICON_BUTTON}
      >
        <StepForwardIcon />
      </button>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Speed control — cycles 0.5x / 1x / 1.5x / 2x. Memoized on {speed, dispatch}
// for the same reason as TransportButtons.
// ---------------------------------------------------------------------------

type SpeedControlProps = {
  speed: number;
  dispatch: Dispatch<PlayerAction>;
};

const SpeedControl = memo(function SpeedControl({
  speed,
  dispatch,
}: SpeedControlProps) {
  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "SET_SPEED", speed: nextSpeed(speed) })}
      aria-label={`Playback speed ${formatSpeed(speed)}. Press to change.`}
      className="flex h-[44px] items-center justify-center rounded-pill border border-border-hairline bg-transparent px-16 font-mono text-mono-13 text-text-muted transition-colors hover:border-signal-cyan-border-mid hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal-cyan"
    >
      {formatSpeed(speed)}
    </button>
  );
});

// ---------------------------------------------------------------------------
// Step counter — decorative pill; the scrubber below already exposes
// step/total via aria-valuetext, so this is aria-hidden to avoid a screen
// reader announcing the same position twice.
// ---------------------------------------------------------------------------

type StepCounterProps = {
  step: number;
  frameCount: number;
  isPlaying: boolean;
};

function StepCounter({ step, frameCount, isPlaying }: StepCounterProps) {
  return (
    <div
      aria-hidden
      className="flex h-[44px] items-center gap-10 rounded-pill border border-border-hairline bg-surface-raised px-18 font-mono text-mono-13 tracking-label-wide"
    >
      <span
        className={`h-[6px] w-[6px] rounded-pill bg-signal-cyan shadow-node ${
          isPlaying ? "animate-beam-pulse" : ""
        }`}
      />
      <span className="text-text-primary">STEP {step + 1}</span>
      <span className="text-text-muted">/ {frameCount}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scrubber — a real range input, hidden native chrome, custom rail/fill/thumb
// drawn underneath it. Re-renders every step by design: this is the one part
// of Controls that must track playback position.
// ---------------------------------------------------------------------------

type ScrubberProps = {
  step: number;
  frameCount: number;
  isPlaying: boolean;
  dispatch: Dispatch<PlayerAction>;
};

function Scrubber({ step, frameCount, isPlaying, dispatch }: ScrubberProps) {
  const wasPlayingRef = useRef(false);
  const max = Math.max(frameCount - 1, 0);
  const percent = max > 0 ? (step / max) * 100 : 0;

  const pauseForScrub = useCallback(() => {
    wasPlayingRef.current = isPlaying;
    if (isPlaying) dispatch({ type: "PAUSE" });
  }, [isPlaying, dispatch]);

  const resumeAfterScrub = useCallback(() => {
    if (wasPlayingRef.current) {
      wasPlayingRef.current = false;
      dispatch({ type: "PLAY" });
    }
  }, [dispatch]);

  return (
    <div className="relative flex h-[44px] w-full items-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 h-[6px] rounded-pill bg-border-hairline"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-0 h-[6px] rounded-pill bg-signal-cyan shadow-[0_0_18px_rgba(61,220,255,0.55)]"
        style={{ width: `${percent}%` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute h-14 w-14 -translate-x-1/2 rounded-pill border-2 border-signal-cyan bg-surface-canvas shadow-node"
        style={{ left: `${percent}%` }}
      />
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={step}
        onChange={(event) =>
          dispatch({ type: "SEEK", step: Number(event.target.value) })
        }
        onPointerDown={pauseForScrub}
        onPointerUp={resumeAfterScrub}
        onPointerCancel={resumeAfterScrub}
        aria-label="Playback position"
        aria-valuenow={step}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={`Step ${step + 1} of ${frameCount}`}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-[44px] [&::-webkit-slider-thumb]:w-14 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-[44px] [&::-moz-range-thumb]:w-14 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-signal-cyan"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * Full transport bar: scrubber, restart/prev/play-pause/next, speed cycle,
 * step counter. See docs on TransportButtons/SpeedControl above for why
 * those subtrees don't re-render on step change — verify with the React
 * DevTools profiler by holding NEXT and watching only Scrubber/StepCounter
 * flash.
 */
export function Controls({ frameCount }: ControlsProps) {
  const { step, isPlaying, speed } = usePlayerState();
  const dispatch = usePlayerDispatch();

  // Read via ref inside the keydown handler instead of depending on
  // `isPlaying` so the listener is attached once, not re-attached on every
  // PLAY/PAUSE toggle.
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (isTextEntry(event.target)) return;

      switch (event.key) {
        case " ":
        case "Spacebar":
          event.preventDefault();
          dispatch({ type: isPlayingRef.current ? "PAUSE" : "PLAY" });
          return;
        case "ArrowRight":
          event.preventDefault();
          dispatch({ type: "NEXT" });
          return;
        case "ArrowLeft":
          event.preventDefault();
          dispatch({ type: "PREV" });
          return;
        case "Home":
          event.preventDefault();
          dispatch({ type: "RESTART" });
          return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  return (
    <div className="flex flex-col gap-16">
      <Scrubber
        step={step}
        frameCount={frameCount}
        isPlaying={isPlaying}
        dispatch={dispatch}
      />
      <div className="flex items-center justify-between gap-16">
        <TransportButtons isPlaying={isPlaying} dispatch={dispatch} />
        <div className="flex items-center gap-14">
          <SpeedControl speed={speed} dispatch={dispatch} />
          <StepCounter step={step} frameCount={frameCount} isPlaying={isPlaying} />
        </div>
      </div>
    </div>
  );
}
