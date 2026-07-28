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
| F14 | Languages | Done | 2026-07-27 | Ajay | `content/problems/two-sum/solutions/index.ts`, `components/player/LanguageSelector.tsx`; see full entry below |
| F15 | Mobile layout | Done | 2026-07-27 | Ajay | Folded in the desktop split-view page composition too — see full entry below |
| - | Desktop readability + highlighter fixes | Done | 2026-07-27 | Ajay | Fixed blank/scattered scene and invisible active-line bar on the desktop breakpoint — see full entry below |
| F16 | Performance and reduced motion | In progress | 2026-07-28 | Ajay | 2D/3D render-mode toggle + flat view shipped (`components/player/RenderModeToggle.tsx`, `content/problems/two-sum/FlatView.tsx`); reduced-motion tier, IntersectionObserver and localStorage override still open — see full entry below |
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

### F15 — Mobile layout

**Status:** Done
**Date:** 2026-07-27
**Owner:** Ajay

- **Deviation from the prompt:** F15's brief ("make the problem page responsive
  to the S2 mobile design... below the split view") presumes a desktop S3
  split-view page already exists. It didn't — `app/problems/[slug]/page.tsx`
  was still F11-F14's one-line stub, and F11-F14's own components had never
  been composed together anywhere. Asked the user, who confirmed: build the
  desktop composition first, then layer mobile responsiveness on top in the
  same pass. That is what shipped.
- **New composition, single DOM tree, single mount per resource:**
  `content/problems/two-sum/ProblemView.tsx` wraps everything in
  `PlayerProvider` and renders ONE tree that is `flex flex-col` (mobile,
  natural document flow) and switches to CSS Grid at `lg:` (1024px, matching
  Tailwind's default breakpoint against the prompt's "under 1024px" cutoff) —
  never two parallel mobile/desktop subtrees. That distinction mattered
  concretely: `Controls` attaches a `window` keydown listener on mount, so
  mounting it twice (visually toggled via `hidden`/`lg:hidden`) would double-
  dispatch every keyboard shortcut. Same reasoning kept the R3F Canvas
  (`content/problems/two-sum/ScenePanel.tsx`) to one mount — a second WebGL
  context per problem page was never on the table anyway.
- **Grid mechanics:** desktop uses `lg:grid-cols-[45%_55%] lg:grid-rows-[auto_1fr_auto]`
  with explicit `col-start`/`row-start` placement per child (not
  `grid-template-areas` strings, to stay in pure Tailwind utility classes,
  matching every other component in this codebase). The mobile
  fixed-footer wrapper (variables sheet + controls) uses `lg:contents` so it
  organizes its two children as a fixed stack on mobile but becomes invisible
  to the grid at `lg:`, letting `Controls` take its own grid cell there
  without a second component instance.
- **`CodePaneStack`** (`components/panels/CodePaneStack.tsx`) is new,
  generic (not two-sum-specific): server-rendered `CodePane` output for all
  8 approach×language combinations ships in the page (F14's languages), and
  this client component picks the one to show and wraps it in `ActiveLineBar`.
  Auto-scroll-to-active-line is a manual `scrollBy` (not `scrollIntoView`,
  which can't be told to centre within a sub-region), paused for 4s after a
  detected manual scroll — the pause window is distinguished from the
  library's own smooth-scroll by a timestamp guard, not a one-shot flag,
  since a single flag would get cleared by the FIRST scroll event a smooth
  scroll fires and mistake the rest of that same animation for a manual one.
- **`MobileVariablesSheet`** (`components/panels/MobileVariablesSheet.tsx`)
  drags `height` directly (not a `y` transform) between a collapsed
  (56px) and half (320px) state, because the handle has to stay pinned to
  the sheet's own top edge at every height — a transform-based drag would
  slide the handle out of view instead.
- **`SceneShell.tsx`** touch handling: three-stdlib's `OrbitControls.connect()`
  unconditionally sets the canvas's `touch-action` to `"none"`, which blocks
  native one-finger scroll regardless of the `touches` config — a new
  `TouchActionFix` sibling component overwrites it to `"pan-y"` after connect.
  `touches={{ TWO: THREE.TOUCH.ROTATE }}` (ONE omitted, not `null` — the prop
  type is `Partial<{ONE: TOUCH; TWO: TOUCH}>` and R3F replaces the whole
  `touches` object per render, so an omitted key resolves to `undefined` at
  runtime, which the internal switch's `default` case already treats as "do
  nothing"). Both fixes read `gl`/mutate off a `useFrame` callback argument,
  not `useThree()`'s hook return, matching `CameraRig`'s own established
  reasoning in this file (`react-hooks/immutability` flags mutating anything
  sourced from a hook's return value).
- **Filled in two empty placeholder files** blocking `getProblem()` from
  working at all: `content/problems/two-sum/meta.ts` (was 0 bytes; P3 had
  wired the loader against it but no problem had ever populated it) and left
  `content.mdx` empty on purpose (F17's job, not this one — the page doesn't
  render it yet).
- **Barrel-file / server-only conflict:** `components/panels/index.ts` used
  to re-export `CodePane` (server-only, imports `lib/highlight.ts`'s
  `'server-only'`) alongside client panels. The moment any client component
  imports anything else from that same barrel, Next traces the whole module
  — including the unused `CodePane` re-export — into the client graph and
  fails the build. Removed `CodePane` from the barrel; callers import it
  directly from `./CodePane` (already the convention `app/(SP2)/code-highlight/page.tsx`
  had established).
- **Not built:** the 2D/3D render-mode toggle visible in the S3 mock (no 2D
  fallback scene exists — that's F16's data-table view) and F17's below-the-
  split content section (mdx is still empty). Both intentionally deferred to
  their own features.
- **Outstanding:** the Chrome browser extension wasn't connected this
  session, so the 390×844 / 360×640 visual check and the real-device
  two-finger-orbit-vs-one-finger-scroll test the prompt explicitly calls out
  ("Do not skip the real-device test") are both still open. Verified
  structurally instead — `tsc --noEmit`, `eslint`, `vitest run` (94 passing),
  `next build` (clean, `/problems/two-sum` prerenders via
  `generateStaticParams`), and a direct HTTP fetch of the rendered page
  confirming title/badges/all 16 code lines/grid class/three "VARIABLES"
  labels are present in the SSR output.

### F14 — Languages

**Status:** Done
**Date:** 2026-07-27
**Owner:** Ajay

- `content/problems/two-sum/solutions/index.ts` now exports `solutions:
  Record<Approach, Solution[]>` (previously only `.gitkeep` existed — this
  is the file `lib/content.ts`'s `getProblem` has imported from since P3).
  One `Solution` per language per approach, 8 total. JavaScript's is the
  canonical listing itself (`OPTIMIZED_LISTING`/`BRUTE_LISTING` from
  `../trace.ts`) with an identity `lineMap`; Python/Java/Go are hand-written
  idiomatic listings with their own line numbers.
- `lineMap` is deliberately not required to be 1:1: Python's
  `for i, num in enumerate(nums):` and Go's `for i, num := range nums {`
  both bind the loop variable on the header line, so canonical's separate
  "read" step (trace line 5) maps onto the same target line as the loop
  header — two canonical keys, one listing line.
- `components/player/LanguageSelector.tsx`: four pills (S3's "JavaScript
  (active), Python, Java, Go"), dispatch-only like `ApproachTabs` —
  swapping the listing and re-deriving the active line from the new
  language's `lineMap` both fall out of `state.language` downstream. Not
  yet mounted anywhere; `app/problems/[slug]/page.tsx` is still the F17/F18
  stub, same as F11–F13 landed ahead of page wiring.
- `content/problems/two-sum/solutions/index.test.ts`: for both approaches,
  asserts every language's `lineMap` has an entry for every distinct
  `frame.line` the shipped trace produces, and that every mapped target
  line exists and is non-blank in that language's own listing.
- Verified with `tsc --noEmit`, `eslint` (clean except pre-existing
  `design-reference/support.js` warnings, unrelated), `vitest run` (94
  passing), and `next build` (clean production build, traces regenerate
  unchanged: optimized 25 / brute 20 frames).

### — Desktop readability + highlighter fixes

**Status:** Done
**Date:** 2026-07-27
**Owner:** Ajay

Ad-hoc pass after the first live Chrome check on the desktop breakpoint (the
one F15 left "Outstanding" because the extension was offline that session).
Structural verification had passed, but three things were visibly broken at
`lg:` and only showed up on screen:

- **Hydration mismatch regenerating the scene subtree**
  (`content/problems/two-sum/ScenePanel.tsx`). `FullscreenButton` used a lazy
  `useState(detectFullscreenSupport)` initializer, but `document.fullscreenEnabled`
  is `false` on the server and `true` on the client — so the server rendered
  `null` and the client's first render a `<button>`, a mismatch that made React
  throw away and regenerate the whole `ScenePanel` tree (canvas + label
  overlay), desyncing the imperative label positions. Now detects support in a
  post-mount `useEffect` so server and first-client render agree. (`SceneShell`'s
  `detectWebGLSupport` is fine as a lazy initializer — it can assume `true` on
  the server and still match; fullscreen can't.)
- **Scene lost its positioning context on desktop**
  (`content/problems/two-sum/ProblemView.tsx`). The `ScenePanel` container has a
  base `relative`, but the passed className included `lg:static`, which won at
  `lg:` — so `position: static`, and every absolutely-positioned child (the
  `LabelLayer` overlay, the projected value/index labels, the floating
  `VariablesPanel`) escaped to the viewport. The value labels literally rendered
  on top of the code pane in the left column. Changed `lg:static` → `lg:relative`
  (a relative grid item lays out identically but restores the containing block).
  This was the single biggest cause of "can't read the canvas".
- **Active-line bar was invisible, not missing**
  (`components/panels/ActiveLineBar.tsx`). The bar measured and positioned
  correctly, but `CodePane`'s card paints an opaque `bg-surface-raised`, and the
  bar sat *behind* it in document order (the old comment deliberately kept it
  behind the text "so selection is never interrupted"). It was fully occluded —
  which is why SP2 could never runtime-verify it. Lifted the bar above the card
  with `z-10` and kept it translucent + `pointer-events-none`, so the code reads
  through the tint and selection still works. Also strengthened the styling
  (12% cyan fill, 3px bright-cyan left edge, hairline top/bottom border) so it
  reads as a clear "you are here".

Plus a camera-framing tune in `content/problems/two-sum/scene.tsx` so the whole
array fits and reads less obliquely: `CRUISE_OFFSET`/`MATCH_OFFSET` pulled back
and de-skewed (`[4,3,5]`→`[2.5,3.5,8]`), `REFERENCE_DISTANCE` 7→9 to keep labels
legible at the greater distance, `initialCameraPosition` passed from `ScenePanel`
to match (no first-frame jump), and a new `FOCUS_Y = -0.6` vertical pan so the
array composes in the upper canvas and the bottom-left `VariablesPanel` floats
over empty space instead of overlapping the tiles (worst at the match frame,
where the panel is tallest). Verified live in Chrome at 1440-wide across both
approaches (optimized + brute) end to end; `vitest run` still 94 passing.

---

### F16 (part 1) — 2D / 3D render-mode toggle

**Status:** In progress
**Date:** 2026-07-28
**Owner:** Ajay

Only the MINIMAL tier of `main.md`'s F16 — the S3 mock's bottom-right "2D / 3D"
toggle and the S5 mock's flat data view it switches to. The REDUCED (reduced-
motion) tier, the IntersectionObserver `frameloop="never"` gate, the
localStorage override and the Lighthouse/bundle numbers are all still open.

- **No new player state was needed.** `renderMode: RenderMode` and
  `SET_RENDER_MODE` had been sitting unused in `PlayerProvider.tsx` since F4;
  this wires them up. `components/player/RenderModeToggle.tsx` is dispatch-only,
  exactly like `ApproachTabs`.
- **`content/problems/two-sum/FlatView.tsx` is a second renderer, not a second
  state machine.** It takes `frame`, not `frames` — it has no playback loop and
  nothing to interpolate, so "each frame is a full state snapshot" (AGENTS.md)
  is what makes it this cheap. 2D and 3D physically cannot disagree about what
  step they show.
- **The connector line is pure CSS, with no measurement.** Every array cell is
  `1fr` in a grid with a known px gap, so a cell's centre is expressible as a
  `calc()` on `100%` (`columnCenter`). No ResizeObserver, no layout read,
  nothing to re-sync on resize. Two heights (`h-20` above the row, `h-12`
  below) are reserved unconditionally so the row never shifts vertically
  between frames that draw a connector/caret and frames that don't.
- **It draws `link` tile-to-tile only when `slots` is empty** — F1's note in
  AGENTS.md: in the optimized trace `link`'s second index is a WALL SLOT index,
  so drawing it across this row would join two unrelated cells. Optimized shows
  its `probe` against the map section instead, resolved by key
  (`slots.indexOf`), never as an index — the same rule `LookupBeam` follows.
  Unlike the beam there is nothing to freeze: this view re-derives per render,
  because it renders one snapshot rather than animating between two.
- **In 2D the Canvas is not hidden, it is unmounted.** A parked WebGL context
  still holds GPU memory and counts against the browser's per-page context
  limit. Consequence: toggling back remounts `SceneShell`, so the camera resets
  to `initialCameraPosition` — accepted, not a bug.
- **`detectWebGLSupport` is now exported from `SceneShell.tsx`.** `ScenePanel`
  owns the Canvas-vs-flat decision so the toggle can render 3D as disabled
  (`forced2d`) when there is no WebGL, instead of showing 3D selected while a
  flat view is on screen. `SceneShell` keeps its own gate — duplicated
  deliberately, so it can never render nothing. This also replaces the old
  `NoWebGLFallback` text blurb: the no-WebGL path now gets the real flat view
  plus S5's "3D unavailable — showing data view." note.
- **`VariablesPanel` moves from floating to inline in 2D.** The 3D scene has
  dead space in its lower-left corner to float a card into; a flat top-down
  document does not, so `TwoSumFlatView` takes it as `children` and appends it
  to the stack (desktop only — `MobileVariablesSheet` already covers mobile).

Also fixed the readability complaint that prompted this: `LabelLayer`'s value
and index labels sit on top of the tile faces, and an `active`/`match` tile is a
near-white emissive block (`EMISSIVE_ACTIVE = 1.4`), so the text was unreadable
exactly when it mattered. Every label now carries its own dark chip
(`labelBaseStyle`) with `em`-based padding/radius, so the chip scales with the
font size `scaledStyle` writes each frame rather than ballooning around 11px
text at the `MIN_FONT_SIZE` floor.

Verified: `tsc --noEmit`, `eslint`, `vitest run` (94 passing). **Not verified in
a browser this session** — the 2D layout, the connector geometry at narrow
widths and the toggle's placement against the fullscreen button all still want a
real visual check at 1440px and at 390×844.
