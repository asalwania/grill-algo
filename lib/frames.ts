/**
 * Build-time frame plumbing, shared by every problem's trace generator.
 *
 * Nothing here runs in the browser: `scripts/build-traces.ts` imports a
 * problem's `trace.ts`, which imports this, and the output is JSON on disk.
 *
 * It lives in `lib/` rather than in one problem's folder because `changed[]`
 * IS the architecture (AGENTS.md: "derived by diffing adjacent frames, never
 * hand-written"). A second copy-pasted diff is a second chance to hand-write
 * one, and the rule is only worth having if it holds everywhere.
 */

import type { Frame, FrameKind } from './types.ts'

/**
 * Flattens a value to leaf paths. Arrays are compared WHOLE rather than per
 * index: `scene.tiles` is one hint, not six, because the scene retargets every
 * tile on any change anyway. Same for `scene.slots`, `scene.link` and
 * `scene.result`.
 */
function collect(value: unknown, path: string, out: Map<string, string>): void {
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, child] of Object.entries(value)) {
      collect(child, path ? `${path}.${key}` : key, out)
    }
    return
  }
  out.set(path, JSON.stringify(value ?? null))
}

/**
 * Only `line`, `vars` and `scene` are diffed. `narration`, `why` and `kind`
 * change on nearly every frame, so flagging them carries no signal.
 *
 * Disappearances count: a var that existed on the previous frame and is gone
 * on this one is reported as changed, which is exactly what F6's
 * AnimatePresence fade-out needs. Frame 0's `changed` is always `[]` — there
 * is nothing to flash against.
 */
export function changedPaths<TScene>(
  prev: Frame<TScene> | null,
  next: Frame<TScene>,
): string[] {
  if (prev === null) return []

  const before = new Map<string, string>()
  const after = new Map<string, string>()
  for (const root of ['line', 'vars', 'scene'] as const) {
    collect(prev[root], root, before)
    collect(next[root], root, after)
  }

  return [...new Set([...before.keys(), ...after.keys()])]
    .filter((path) => before.get(path) !== after.get(path))
    .sort()
}

/**
 * Numbers the frames and fills in `changed` by diffing against the frame it
 * just handed out.
 *
 * `snapshot` MUST return a fresh deep copy every call — a frame that shares
 * mutable state with the generator is not a snapshot, and every downstream
 * guarantee (seek, reverse-step, the 2D and 3D renderers agreeing) rests on
 * each frame standing alone.
 */
export function createEmitter<TScene>(snapshot: () => TScene) {
  let step = 0
  let previous: Frame<TScene> | null = null

  return (
    line: number,
    kind: FrameKind,
    narration: string,
    why: string,
    vars: Frame<TScene>['vars'],
  ): Frame<TScene> => {
    const frame: Frame<TScene> = {
      step: step++,
      line,
      kind,
      narration,
      why,
      vars,
      scene: snapshot(),
      changed: [],
    }
    frame.changed = changedPaths(previous, frame)
    previous = frame
    return frame
  }
}
