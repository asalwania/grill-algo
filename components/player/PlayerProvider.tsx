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
  /** Which pre-generated input is playing — a `TestCase.id` from cases.json. */
  caseId: string;
  renderMode: RenderMode;
  /**
   * Incremented only by RESTART. Scrubbing or stepping back to step 0 via
   * PREV/SEEK leaves it untouched — F12's camera choreography watches this
   * (not `step === 0`) to tell "the user pressed restart" apart from "the
   * user scrubbed back to the start," since only the former should lift its
   * manual-orbit suspension.
   */
  restartNonce: number;
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
  | { type: "SET_CASE"; caseId: string }
  | { type: "SET_RENDER_MODE"; renderMode: RenderMode };

/** Milliseconds per step at speed = 1. The RAF loop divides this by `speed`. */
const BASE_STEP_MS = 600;

/** Frame count per case id, then per approach — the shape of the whole
 *  pre-generated trace set the player can move between. Partial in the
 *  approach axis: approaches are per-problem (lib/types.ts), and `countOf`
 *  below already reads a missing one as 0. */
export type FrameCounts = Record<string, Partial<Record<Approach, number>>>;

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
function createPlayerReducer(frameCounts: FrameCounts) {
  const countOf = (caseId: string, approach: Approach): number =>
    frameCounts[caseId]?.[approach] ?? 0;

  return function playerReducer(
    state: PlayerState,
    action: PlayerAction,
  ): PlayerState {
    switch (action.type) {
      case "NEXT": {
        const frameCount = countOf(state.caseId, state.approach);
        const step = clampStep(state.step + 1, frameCount);
        const atEnd = step >= frameCount - 1;
        return { ...state, step, isPlaying: atEnd ? false : state.isPlaying };
      }
      case "PREV":
        return {
          ...state,
          step: clampStep(state.step - 1, countOf(state.caseId, state.approach)),
        };
      case "PLAY":
        return { ...state, isPlaying: true };
      case "PAUSE":
        return { ...state, isPlaying: false };
      case "RESTART":
        return { ...state, step: 0, restartNonce: state.restartNonce + 1 };
      case "SEEK":
        return {
          ...state,
          step: clampStep(action.step, countOf(state.caseId, state.approach)),
        };
      case "SET_SPEED":
        return { ...state, speed: Math.max(0.1, action.speed) };
      case "SET_LANGUAGE":
        return {
          ...state,
          language: action.language,
          step: clampStep(state.step, countOf(state.caseId, state.approach)),
        };
      case "SET_APPROACH":
        return {
          ...state,
          approach: action.approach,
          step: clampStep(state.step, countOf(state.caseId, action.approach)),
        };
      case "SET_CASE": {
        if (action.caseId === state.caseId) return state;
        // Unlike SET_APPROACH, the step is RESET rather than clamped: the two
        // approaches narrate the same input, so "where you were" carries over,
        // but a different input is a different story and step 7 of it means
        // nothing. Playback stops for the same reason, and `restartNonce` is
        // bumped so F12's camera re-establishes on the new array instead of
        // staying dollied in on a tile that may no longer exist.
        return {
          ...state,
          caseId: action.caseId,
          step: 0,
          isPlaying: false,
          restartNonce: state.restartNonce + 1,
        };
      }
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
  /** Frame count per case id, then per approach — every pre-generated trace
   *  the player can move between. */
  frameCounts: FrameCounts;
  /** Case the player starts on; normally `problem.cases[0].id`. */
  initialCaseId: string;
  /**
   * Approach the player starts on; normally `problem.approaches[0]`.
   *
   * Has no default, on purpose: approaches are per-problem, so there is no
   * value that is safe for every problem — defaulting to "optimized" would
   * silently start a problem that doesn't ship one on an empty frame array.
   */
  initialApproach: Approach;
  initialLanguage?: Language;
  initialRenderMode?: RenderMode;
  initialSpeed?: number;
  children: ReactNode;
};

export function PlayerProvider({
  frameCounts,
  initialCaseId,
  initialApproach,
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
    caseId: initialCaseId,
    renderMode: initialRenderMode,
    restartNonce: 0,
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
