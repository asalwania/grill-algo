"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { Approach, Language, RenderMode } from "@/lib/types";

export type PlayerState = {
  step: number;
  isPlaying: boolean;
  /** Multiplier on the base per-step interval. 1 = normal speed. */
  speed: number;
  language: Language;
  approach: Approach;
  renderMode: RenderMode;
};

export type PlayerAction =
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "RESTART" }
  | { type: "SEEK"; step: number }
  | { type: "SET_SPEED"; speed: number }
  | { type: "SET_LANGUAGE"; language: Language }
  | { type: "SET_APPROACH"; approach: Approach }
  | { type: "SET_RENDER_MODE"; renderMode: RenderMode };

/** Milliseconds per step at speed = 1. The RAF loop divides this by `speed`. */
const BASE_STEP_MS = 600;

function clampStep(step: number, frameCount: number): number {
  if (frameCount <= 0) return 0;
  return Math.min(Math.max(step, 0), frameCount - 1);
}

/**
 * Reducer is built per `frameCounts` so SET_APPROACH (and, defensively,
 * SET_LANGUAGE) can clamp `step` against the *new* approach's frame count in
 * the same transition — never a separate effect that would let an
 * out-of-range step render for a frame.
 */
function createPlayerReducer(frameCounts: Record<Approach, number>) {
  return function playerReducer(
    state: PlayerState,
    action: PlayerAction,
  ): PlayerState {
    switch (action.type) {
      case "NEXT": {
        const frameCount = frameCounts[state.approach];
        const step = clampStep(state.step + 1, frameCount);
        const atEnd = step >= frameCount - 1;
        return { ...state, step, isPlaying: atEnd ? false : state.isPlaying };
      }
      case "PREV":
        return {
          ...state,
          step: clampStep(state.step - 1, frameCounts[state.approach]),
        };
      case "PLAY":
        return { ...state, isPlaying: true };
      case "PAUSE":
        return { ...state, isPlaying: false };
      case "RESTART":
        return { ...state, step: 0 };
      case "SEEK":
        return {
          ...state,
          step: clampStep(action.step, frameCounts[state.approach]),
        };
      case "SET_SPEED":
        return { ...state, speed: Math.max(0.1, action.speed) };
      case "SET_LANGUAGE":
        return {
          ...state,
          language: action.language,
          step: clampStep(state.step, frameCounts[state.approach]),
        };
      case "SET_APPROACH":
        return {
          ...state,
          approach: action.approach,
          step: clampStep(state.step, frameCounts[action.approach]),
        };
      case "SET_RENDER_MODE":
        return { ...state, renderMode: action.renderMode };
      default: {
        const exhaustive: never = action;
        return exhaustive;
      }
    }
  };
}

const PlayerStateContext = createContext<PlayerState | undefined>(undefined);
const PlayerDispatchContext = createContext<
  Dispatch<PlayerAction> | undefined
>(undefined);

export function usePlayerState(): PlayerState {
  const context = useContext(PlayerStateContext);
  if (!context) {
    throw new Error("usePlayerState must be used within a PlayerProvider");
  }
  return context;
}

export function usePlayerDispatch(): Dispatch<PlayerAction> {
  const context = useContext(PlayerDispatchContext);
  if (!context) {
    throw new Error("usePlayerDispatch must be used within a PlayerProvider");
  }
  return context;
}

type PlayerProviderProps = {
  /** Frame count per approach, e.g. `{ optimized: problem.frames.optimized.length, brute: problem.frames.brute.length }`. */
  frameCounts: Record<Approach, number>;
  initialApproach?: Approach;
  initialLanguage?: Language;
  initialRenderMode?: RenderMode;
  initialSpeed?: number;
  children: ReactNode;
};

export function PlayerProvider({
  frameCounts,
  initialApproach = "optimized",
  initialLanguage = "javascript",
  initialRenderMode = "3d",
  initialSpeed = 1,
  children,
}: PlayerProviderProps) {
  const reducer = useMemo(
    () => createPlayerReducer(frameCounts),
    [frameCounts],
  );

  const [state, dispatch] = useReducer(reducer, {
    step: 0,
    isPlaying: false,
    speed: initialSpeed,
    language: initialLanguage,
    approach: initialApproach,
    renderMode: initialRenderMode,
  });

  // requestAnimationFrame, not setInterval: accumulating elapsed time against
  // rAF's own timestamps avoids the drift setInterval accrues under throttled
  // tabs, and lets the interval react to `speed` without tearing down a timer.
  useEffect(() => {
    if (!state.isPlaying) return;

    const interval = BASE_STEP_MS / state.speed;
    let rafId: number;
    let lastTime: number | null = null;
    let elapsed = 0;

    const tick = (time: number) => {
      if (lastTime === null) lastTime = time;
      elapsed += time - lastTime;
      lastTime = time;
      if (elapsed >= interval) {
        elapsed -= interval;
        dispatch({ type: "NEXT" });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [state.isPlaying, state.speed]);

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        dispatch({ type: "PAUSE" });
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // SP1: context propagates into the R3F <Canvas> subtree automatically in
  // this stack — no useContextBridge. See docs/spikes/SP1-context-across-canvas.md.
  return (
    <PlayerStateContext.Provider value={state}>
      <PlayerDispatchContext.Provider value={dispatch}>
        {children}
      </PlayerDispatchContext.Provider>
    </PlayerStateContext.Provider>
  );
}
