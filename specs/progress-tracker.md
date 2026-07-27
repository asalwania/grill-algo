# Progress Tracker

Companion log to `specs/main.md`. That file is the fixed prompt script — this
file is the mutable record of what actually happened when a prompt was run.

**Rule:** update this file after every task, in the same session the work
lands in. An entry describes what shipped, not what was asked for — link back
to `main.md`'s section ID for the ask.

---

## How to log a task

Append one row to the table for the relevant phase, and — only if there's
something a future session needs to know that isn't obvious from the diff —
one entry below it. Most tasks need only the row.

**Status values:** `Done` · `In progress` · `Blocked` · `Deferred`

| Field | Meaning |
| --- | --- |
| ID | The `main.md` section ID (`SP1`, `P2`, `F7`, ...). `-` if the task has none (e.g. an ad-hoc fix). |
| Task | Short name, matching `main.md`'s heading where one exists. |
| Status | One of the values above. |
| Date | Date the status last changed, `YYYY-MM-DD`. |
| Owner | Who/what ran it — a name, or an agent/session identifier if it matters (e.g. concurrent-agent work). |
| Notes | One line. Link to a full entry below only if there's a decision, deviation, or open question worth recording. |

### When to add a full entry (below the table, not instead of the row)

Only when at least one of these is true:
- The implementation deviated from the prompt in `main.md` (and why).
- A "Done when" checklist item is still unmet, partially met, or was
  reinterpreted.
- A decision was made that a future session shouldn't re-litigate — if it's
  durable and architectural, promote it to `AGENTS.md`'s spike list instead
  and just link to it here.
- Something is left open, flaky, or is blocking a later task.

Skip the entry if the task landed exactly as scripted. The table row is
sufficient signal that the box is checked.

```markdown
### <ID> — <Task name>

**Status:** Done | In progress | Blocked | Deferred
**Date:** YYYY-MM-DD
**Owner:** <name / agent>

<1-3 sentences: what shipped, what deviated, what's still open. Link files
with `path:line` where it helps a reader jump straight to the code.>
```

---

## Phase 1 — Design

| ID | Task | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| S1 | Design system reference | Done | 2026-07-27 | Ajay | Exported to `design-reference/Design System Reference.dc.html` |
| S2 | Mobile problem page | Done | 2026-07-27 | Ajay | Exported to `design-reference/Learning View Mobile.dc.html` |
| S3 | Desktop problem page | Done | 2026-07-27 | Ajay | Exported to `design-reference/Learning View Desktop.dc.html` |
| S4 | Problem index page | Done | 2026-07-27 | Ajay | Exported to `design-reference/Problem Index.dc.html` |
| S5 | States (loading / no-WebGL / reduced motion) | Done | 2026-07-27 | Ajay | Exported to `design-reference/Mobile States.dc.html` |
| S6 | Export and reconcile tokens | Done | 2026-07-27 | Ajay | Reconciled token set now lives in `app/globals.css`'s `@theme` block |

## Phase 2 — Spikes

| ID | Task | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| SP1 | Context across the R3F Canvas boundary | Done | 2026-07-27 | Ajay | Settled — see `docs/spikes/SP1-context-across-canvas.md`; no `useContextBridge` needed |
| SP2 | Shiki active-line bar | Done | 2026-07-27 | Ajay | Settled — see `docs/spikes/SP2-shiki-active-line-bar.md`; runtime verification still outstanding per `AGENTS.md` |
| SP3 | Generator produces usable frames | Done | 2026-07-27 | Ajay | Settled — see `docs/spikes/SP3-generator-frames.md`; no route by design |

## Phase 3 — Setup

| ID | Task | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| P1 | Scaffold | Done | 2026-07-27 | Ajay | Next.js 15 App Router, TS strict, Tailwind, pnpm structure in place |
| P2 | Design tokens | Done | 2026-07-27 | Ajay | `@theme` in `app/globals.css` (Tailwind v4 CSS-first, no `tailwind.config.ts`); demo at `app/tokens/page.tsx` |
| P3 | Types and content loader | Done | 2026-07-27 | Ajay | `lib/types.ts`, `lib/content.ts` |

## Phase 4 — Features

| ID | Task | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| F1 | Trace pipeline | Done | 2026-07-27 | Ajay | `content/problems/two-sum/trace.ts`, `scripts/build-traces.ts`; see `AGENTS.md` F1 note |
| F2 | Code pane | Done | 2026-07-27 | Ajay | `components/panels/CodePane.tsx` |
| F3 | Active line highlight | Done | 2026-07-27 | Ajay | `components/panels/ActiveLineBar.tsx` |
| F4 | Player state | Done | 2026-07-27 | Ajay | `components/player/PlayerProvider.tsx` |
| F5 | Controls | Done | 2026-07-27 | Ajay | `components/player/Controls.tsx` |
| F6 | Variables and narration | Done | 2026-07-27 | Ajay | `components/panels/VariablesPanel.tsx`, `NarrationStrip.tsx` |
| F7 | Scene shell | Done | 2026-07-27 | Ajay | `components/scene/SceneShell.tsx` |
| F8 | Array floor | Done | 2026-07-27 | Ajay | `ArrayTiles` in `content/problems/two-sum/scene.tsx` |
| F9 | Labels layer | Done | 2026-07-27 | Ajay | `components/scene/LabelLayer.tsx` |
| F10 | Hash map wall | Done | 2026-07-27 | Ajay | `HashMapWall` in `content/problems/two-sum/scene.tsx` |
| F11 | Lookup beam | Done | 2026-07-27 | other agent | `LookupBeam` in `content/problems/two-sum/scene.tsx`; landed in the working tree ahead of F12/F13, see full entry below |
| F12 | Camera choreography | Done | 2026-07-27 | other agent | `CameraChoreography` in `content/problems/two-sum/scene.tsx`; wired to `SceneShellHandle` via the new `cameraRig` prop, `restartNonce` (`PlayerProvider.tsx`) releases manual-orbit suspension |
| F13 | Approach toggle | Done | 2026-07-27 | Ajay | `ApproachTabs` (`components/player`), `ComplexityReadout` (`components/panels`), `ApproachTransition`/`HashMapWall`/`LookupBeam`/`CompareBeam`/`CrissCrossBeams` in `content/problems/two-sum/scene.tsx`; see full entry below |
| F14 | Languages | - | | | |
| F15 | Mobile layout | - | | | |
| F16 | Performance and reduced motion | - | | | |
| F17 | Content | - | | | |
| F18 | SEO and shipping | - | | | |

---

## Full entries

### F11 — Lookup beam

**Status:** Done
**Date:** 2026-07-27
**Owner:** other agent

`LookupBeam` in `content/problems/two-sum/scene.tsx`: single persistent mesh,
damped endpoints, spring-driven hit flash, no post-processing bloom (see the
in-file comment on the ~183KB gzip bundle-cost tradeoff for real Bloom).
Landed in the working tree alongside `components/scene/LabelLayer.tsx` and
`SceneShell.tsx`, still uncommitted as of this entry (staged HEAD only has
F10). F13's changes build directly on top of this component — see below.

### F12 — Camera choreography

**Status:** Done
**Date:** 2026-07-27
**Owner:** other agent

`CameraChoreography` in `content/problems/two-sum/scene.tsx`, wired through a
new `cameraRig?: RefObject<SceneShellHandle | null>` prop on `TwoSumScene`.
Dollies toward the active tile with a lead fraction toward the next one,
establishes on the whole array before anything is touched, and pulls back +
tilts on the matched frame to frame both tiles and the wall together.
Manual-orbit suspension is `SceneShell`'s own (`moveTo` no-ops while
`userOrbitingRef` is set); `PlayerProvider.tsx` gained `restartNonce`
(incremented only by RESTART, not by scrubbing to step 0) specifically so
this component can tell "user pressed restart" apart from "user scrubbed
back" and call `resumeAutoCamera()` only on the former. Also uncommitted,
same as F11.

### F13 — Approach toggle

**Status:** Done
**Date:** 2026-07-27
**Owner:** Ajay

Built on top of F11/F12 rather than waiting for them to land, since both were
already functionally complete in the working tree.

- **DOM:** `ApproachTabs` (`components/player/ApproachTabs.tsx`) dispatches
  `SET_APPROACH`; frame-array and code-listing swapping fall out of
  `state.approach` for free (PlayerProvider already clamped `step` to the new
  approach's frame count). `ComplexityReadout`
  (`components/panels/ComplexityReadout.tsx`) cross-fades `O(n²)/O(1)` vs
  `O(n)/O(n)` on the same flag, styled like `NarrationStrip`.
- **Scene:** a single shared `progressRef` (0 = brute, 1 = optimized), owned
  by the new `ApproachTransition` component and damped toward the discrete
  `approach` flag (mirrored into `approachRef` by `FrameCursor`) over ~700ms.
  Every other F13 visual reads this SAME ref so they move in lockstep:
  - `HashMapWall` now mounts for both approaches (previously brute unmounted
    it entirely) and sinks `WALL_SUNK_Y` below the ground plane at
    progress 0, rising to its resting position at progress 1.
  - `LookupBeam`'s opacity is scaled by `progressRef` so it fades in with the
    wall instead of popping the instant the flag flips.
  - New `CompareBeam`: brute's per-frame tile-to-tile beam, reading
    `scene.link` when `scene.slots.length === 0` (the case lib/types.ts's
    `link` doc already documents as "second index is a tile index"). Fades
    out as `1 - progress`.
  - New `CrissCrossBeams`: the toggle's decorative flourish. Opacity is
    `4·p·(1-p)` — zero at both resting states, peaking only mid-transition —
    so it needed no separate one-shot state; the shape falls straight out of
    the shared progress value.
- **Deviation from the prompt's literal wording:** the prompt describes
  brute-force beams as a resting-state visual ("crisscross beams") that the
  toggle collapses. What's shipped instead is a real per-frame single
  comparison beam (`CompareBeam`, data-driven from `link`) during ordinary
  brute playback, plus a decorative multi-beam flourish (`CrissCrossBeams`)
  that only appears during the transition itself. Chosen because brute's
  trace only ever carries one `link` pair per frame — showing many
  simultaneous "crisscross" beams during ordinary playback would need
  accumulated history state with no trace support, whereas confining the
  flourish to the transition window needed no new state at all.
- Verified with `tsc --noEmit`, `eslint`, `vitest run` (78 passing,
  unchanged), and `next build` (clean production build).
