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
| - | Plain-words brief + playable test cases | Done | 2026-07-28 | Ajay | `content/problems/two-sum/ProblemBrief.tsx`, `components/player/TestCasePicker.tsx`; traces now generated per case — see full entry below |

## Phase 6 — Homepage + catalog

Not in `main.md` — `main.md` deferred the homepage deliberately. Decisions are
recorded in `specs/homepage-catalog.md`; do not re-litigate them here.

| ID | Task | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| H1 | Catalog data + types | Done | 2026-07-28 | Ajay | `content/catalog.ts` (150 rows), `lib/catalog.ts`, `getCatalog()` in `lib/content.ts`, `lib/catalog.test.ts`, `scripts/verify-catalog.ts` — see full entry below |
| H2 | `/problems` catalog page | Done | 2026-07-28 | Ajay | `app/problems/page.tsx`, `components/catalog/` (`ProblemCard`, `CategoryGlyph`, `CategoryRail`) — see full entry below |
| H3 | `/` cinematic homepage | Done | 2026-07-28 | Ajay | `app/page.tsx`, `components/home/ScrollScrubbedTrace.tsx` — see full entry below |
| H4 | Shared chrome + metadata | Done | 2026-07-28 | Ajay | `components/chrome/` (`SiteHeader`, `SiteFooter`, `SkipLink`), title template in `app/layout.tsx`, `generateMetadata` on `/problems/[slug]` — see full entry below |

## Phase 7 — Second problem

Not in `main.md`, which scoped the build to Two Sum alone. Generalizing the
single-problem machinery into a reusable family is recorded here.

| ID | Task | Status | Date | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| G1 | Promote shared machinery | Done | 2026-07-28 | Ajay | `ArrayMemoryScene` type + component, `components/problem/`, per-problem `ProblemChrome`, per-problem approach sets — see full entry below |
| G2 | Contains Duplicate | Done | 2026-07-28 | Ajay | `content/problems/contains-duplicate/`, three approaches incl. the first sort-based trace — see full entry below |
| - | Add-a-problem recipe | Done | 2026-07-28 | Ajay | `specs/add-a-problem.md` — self-contained spec so a new problem needs no reading of G1/G2 code; docs only, no code changed |
| G3 | Valid Anagram | Done | 2026-07-28 | Ajay | `content/problems/valid-anagram/`, three approaches, first string problem (char codes in `nums`, `labels`/`keyLabel`, `target` as boundary index). Shipped in `8bed439` without a row; logged here retroactively |
| G4 | Group Anagrams | Done | 2026-07-28 | Ajay | `content/problems/group-anagrams/`, three approaches, first problem whose answer is a partition — see full entry below |

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

---

### — Plain-words brief + playable test cases

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

Ad-hoc, user-requested: a plain-language statement of the problem under the
code pane, and at least three inputs the player can actually run.

- **A case is a fourth axis of the same pre-generated trace set, not runtime
  input.** `lib/types.ts` gains `TestCase`; `ProblemTraces` gains `cases` and
  its `build` entries now take one. `scripts/build-traces.ts` runs the
  generators once per case and writes `frames.<case>.<approach>.json` plus a
  `cases.json` manifest — the manifest, not a `readdir`, is what the loader
  discovers cases from, because author order is meaningful (first = default)
  and a directory scan would lose it. `frames.optimized.json` /
  `frames.brute.json` are gone, superseded by the per-case files.
- **Four cases ship** (`TEST_CASES` in `trace.ts`): the SP3 canonical example
  stays first and unchanged (25/20 frames, so AGENTS.md's counts still hold),
  plus a first-lookup hit, `[3, 2, 4]`/6 (where `3 + 3` is the trap), and a
  no-answer input. That last one is the only case that ever reaches either
  listing's final `return []` — canonical line 15 / 10. Those lines had
  per-language `lineMap` entries since F14 but no shipped frame had ever
  pointed at one; `solutions/index.test.ts` now unions frame lines across all
  cases rather than checking the headline case alone.
- **Constraint on any future case:** optimized pushes one slot per
  non-matching element, and both `FlatView` and `LabelLayer` key slots by map
  key, so no input may store the same key twice. A repeated value that *hits*
  is fine (the trace returns before the second push) — which is why the new
  test asserts on generated slots, not on `nums` having no duplicates.
- **`SET_CASE` resets the step rather than clamping it**, unlike
  `SET_APPROACH`. The two approaches narrate the same input so "where you
  were" carries over; a different input is a different story. It also pauses
  and bumps `restartNonce`, so F12's camera re-establishes on the new array
  instead of staying dollied in on a tile that may not exist any more.
- **The scene subtree is keyed on the case id** (`ScenePanel`'s new `resetKey`,
  applied to `TwoSumScene` and `LabelLayer`, deliberately not to `SceneShell`).
  `ArrayTiles`/`HashMapWall` size their per-tile ref arrays and spring state
  once at mount from `nums.length`; an input with a different length would
  index past them and write `NaN` into a transform. The Canvas itself owns the
  WebGL context and camera rig, neither of which depends on the trace, so it
  is not remounted.
- **Layout:** the desktop grid gains a fourth row (`auto_1fr_auto_auto`) for
  the brief, between the scrolling code pane and the controls; the scene spans
  rows 2–5. The mobile fixed-footer clearance moved from `CodePaneStack` to
  `ProblemBrief`, since the brief is now the last thing in the document flow.
- **Not done:** `content.mdx` is still empty — the brief is player chrome
  (what the animation is showing), not F17's long-form article.

Verified: `pnpm traces` (8 frame files + manifest; sample still 25/20, first-pair
9/4, late-answer 13/7, no-answer 14/7), `tsc --noEmit`, `vitest run` (119
passing, up from 94), `eslint` (clean except the pre-existing
`design-reference/support.js` findings), `next build` (clean, `/problems/two-sum`
still prerenders). **Not checked in a browser this session** — the new left-column
row split at `lg:` and the case cards at 390×844 both still want a visual pass.

---

### H1 — Catalog data + types

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

Data-only slice. No UI, no route, nothing rendered — provable by `pnpm test`
alone, which is why it goes first: H2–H4 all consume it.

- **`content/catalog.ts`** — all 150 NeetCode rows in NeetCode's teaching
  order. Authored, not scraped. It is deliberately NOT derived from
  `content/problems/*`: 149 of these have no content directory and won't until
  someone builds them, so `getAllProblemMeta()` (which reads that directory)
  can never be the catalog's source.
- **Two fields are derived, never authored.** `status` comes from whether
  `content/problems/<slug>/` exists, so the day a second problem lands its card
  lights up with zero edits to the catalog. `leetcodeUrl` comes from `slug`,
  with a `leetcodeSlug` override used by exactly one row (`pow-x-n` →
  `powx-n`) — storing 150 near-identical URLs is 150 chances to typo one.
- **`lib/catalog.ts` exists because `lib/content.ts` can't be imported from a
  test.** Its first line is `import 'server-only'`, which throws outside a
  server-component graph. So the logic that decides what a card renders
  (`resolveCatalog`, `groupByCategory`, `readyProblems`, `leetcodeUrl`) takes
  the built slugs as an *argument* instead of reading the filesystem, and is
  fully covered. `getCatalog()` in `lib/content.ts` is the thin async wrapper
  supplying the filesystem half, plus the `meta` load for `ready` rows only.
- **`CATEGORIES` is a runtime const in `lib/types.ts`**, with
  `Category = (typeof CATEGORIES)[number]`. The order IS content — it drives
  the 18 sections and the rail — and deriving the union from the array means
  the two can't disagree. A hand-written union plus a separate ordered array
  would need a test to prove exhaustiveness and still drift.
- **`ProblemMeta.difficulty` now uses the shared `Difficulty` type.**
- **The contiguity test is the non-obvious one.** Asserting each category
  appears as ONE run (and that the runs match `CATEGORIES` order) is what
  catches a row filed under the wrong heading — nothing else would.
- **Known open risk, stated in `specs/homepage-catalog.md` too:** a
  plausible-but-wrong number↔title pairing survives both the test and
  `pnpm verify:catalog`, because both halves genuinely exist on LeetCode. Only
  a human reading the file catches it. `verify:catalog` is manual by design —
  LeetCode rate-limits, so a red run means "go look", not "the build is
  broken", and it is wired to neither `build` nor CI.

### H2 — `/problems` catalog page

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

S4's design, extended from 6 mock cards to 150 real ones. Server Component with
no dynamic APIs, so it prerenders static; the only client island is the rail.

- **`CategoryGlyph` is 18 glyphs, not 150.** S4's brief says the diagram hints
  at the data structure, which is a category-level fact. Shape only, no text —
  the same discipline `AGENTS.md` imposes on the canvas, held to here because a
  glyph with a label stops being a glyph. Every colour is a token; `muted`
  collapses all three tones onto the skeleton pair, which is how a `soon` card
  renders.
- **`ProblemCard` is one component with two states, deliberately.** 149 `soon`
  cards beside 1 `ready` one IS the page's composition, and any height
  difference between the two shapes wrecks the grid rows.
- **Stretched-link, not a wrapping anchor.** The card is clickable anywhere,
  but the card is not an `<a>` — the TITLE is the link and its `::after` covers
  the card, with the LeetCode anchor lifted to `z-10` above it. Nesting the
  LeetCode anchor inside a card-wide anchor is invalid HTML and collapses to
  one unusable tab stop.
- **Deviation from the grill: no `aria-disabled` on `soon` cards.** I'd said
  I'd add it. It's wrong — the card is a non-interactive `<article>`, where
  `aria-disabled` is meaningless noise. The visible `SOON` pill is real text and
  is what actually announces the state.
- **Deviation from the design export: spacing rounded to the token ladder.**
  PI uses 26px/28px for card padding and grid gap; neither is in `@theme`'s
  ladder, and S6's reconciliation evidently dropped them on purpose (it did
  mine PI for `--radius-bar` and `--color-surface-skeleton`). Used 24 rather
  than re-opening that decision or scattering arbitrary values.
- **One new token: `--shadow-card-glow`.** PI draws the cyan glow on the first
  card to indicate hover; with exactly one problem built it reads better as that
  card's resting state.
- **`max-lg:` for the rail's mobile chrome, not `lg:` undo.** `--blur-*:
  initial` deletes Tailwind's blur scale, so there is no `backdrop-blur-none` to
  undo `backdrop-blur-panel` with.
- **Scroll-spy is IntersectionObserver over a tracked visible set**, picking the
  topmost visible section — a single "last intersecting" entry is ambiguous
  while several sections straddle the viewport. Only the discrete active id
  becomes state.
- **`content-visibility: auto` per section** instead of virtualization: the
  browser skips offscreen layout/paint, the HTML stays fully static, and it
  costs one style prop rather than a windowing library.

Verified: `tsc --noEmit`, `eslint`, `vitest run` (140 passing, up from 138 —
`categoryId` added), `next build` (clean; `/problems` listed as `○ Static`).
Checked the PRERENDERED HTML in `.next/server/app/problems.html`, not just that
the build passed: 151 `<article>` elements (150 + Two Sum featured a second
time), 149 `SOON` pills, 151 LeetCode links, 2 internal links to
`/problems/two-sum`, and all 18 section ids present and correctly slugged
(`heap-priority-queue`, `1-d-dynamic-programming`, `math-geometry`).

**Not verified: anything visual.** No browser this session — the 3-column grid
at 1440, the rail's sticky behaviour, the mobile chip scroller at 390×844, and
whether 18 glyphs actually read as distinct at 202×52 are all still open.

### H3 — `/` cinematic homepage

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

Five beats: hero, premise, scroll-scrubbed demonstration, pillars, close.
`app/page.tsx` was a one-line stub until now.

- **Beat 3 reuses F16's `TwoSumFlatView` UNCHANGED.** It already takes a single
  `frame` and owns no state, so scroll-driven playback needed no changes to it
  and no fork. Confirms the grill's assumption; the compact-variant prop was
  never needed.
- **Three constraints, all verified rather than asserted:**
  - *No three.js on the landing page.* Checked by walking the script tags in
    each prerendered HTML and grepping the referenced chunks: `/` is 766KB raw
    across 10 chunks with NO `THREE.`/`WebGLRenderer` marker; `/problems/two-sum`
    is 1694KB across 12 with the marker present in one.
  - *No GSAP, no new dependency.* `position: sticky` pins, `useScroll` scrubs.
  - *The continuous value never becomes React state.* `scrollYProgress` stays a
    MotionValue bound straight to the progress bar's `scaleX`; only the ROUNDED
    step index is `useState`, and only when it changes.
- **Reduced motion is handled in CSS AND in JS, because neither alone is
  enough.** `motion-reduce:` variants collapse the 320vh track and unpin the
  sticky child — but that leaves no scroll travel, so the scrubbed step would
  sit at frame 0 forever, which is the least interesting frame in the trace.
  So a post-mount `matchMedia` check swaps in the frame where the answer lands.
- **That check is deliberately NOT framer-motion's `useReducedMotion`, and
  deliberately not a lazy `useState` initializer.** `matchMedia` doesn't exist
  on the server, so any first-render answer but `false` desyncs the HTML. This
  repo already paid for that lesson once — F16's `FullscreenButton`, where
  `document.fullscreenEnabled` differed across the boundary and React discarded
  the whole `ScenePanel` subtree. Detected after mount instead.
- **`<MotionConfig reducedMotion="user">`** wraps the beat so `TwoSumFlatView`'s
  own `layout` animations respect the preference too — Framer's default is
  `"never"`, so without this the flat view would keep animating.
- **Imports one frame file directly** (`frames.sample.optimized.json`) rather
  than calling `getProblem()`, which would pull all four cases, both approaches,
  four languages of solutions and the mdx to show 25 frames.
- **No scroll-reveal animations on beats 1/2/4/5, on purpose.** `whileInView`
  with a zeroed `initial` means the copy is invisible in the SSR'd HTML, which
  is the one thing a landing page must not trade away. The algorithm stepping
  as you scroll is the effect; fading text in is not.

Verified: `tsc --noEmit`, `eslint`, `vitest run` (140 passing), `next build`
(clean, `/` listed as `○ Static`). Read the prerendered
`.next/server/app/index.html`: hero copy, both CTAs, `STEP 01`, the flat view's
`ARRAY` section and frame 0's narration ("An empty map, and one pass to fill
it.") are all in the static HTML — the beat degrades to a readable first frame
with no JS.

**Not verified: anything visual, and this beat is the one that most needs it.**
Whether 320vh of scroll feels right for 25 frames, whether the sticky panel
composes at 1440 and at 390×844, and whether `TwoSumFlatView`'s `py-56`
padding (tuned for `ScenePanel`'s floating toggle, which isn't here) reads as
too generous are all open.

### H4 — Shared chrome + metadata

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

- **The chrome is NOT in `app/layout.tsx`, and this is the entry's main point.**
  `ProblemView.tsx:71` lays the learning view out with `lg:h-screen
  lg:overflow-hidden` — it claims the whole viewport at desktop. A root-layout
  header would push it down by its own height and make the split view overflow.
  A route group can't carve `/problems/[slug]` out of a `/problems` layout
  either, since both live under the same segment. So `SiteHeader`/`SiteFooter`
  are mounted explicitly by `/` and `/problems`, and the learning view gets a
  compact `← ALL PROBLEMS` link inside `ProblemHeader`'s existing flex column
  instead — which it needed regardless, because until now there was NO way back
  to the catalog from a problem page at all.
- **`SiteHeader` takes `current` as a prop rather than calling
  `usePathname()`**, so it stays a Server Component and ships zero JS.
- **`Patterns` / `About` remain absent**, per the H-series decision.
- **Title template, not per-page duplication.** `app/layout.tsx` gains
  `default` + `%s` template. `/` deliberately sets NO title — the layout default
  already is its title, and setting it would run it through `%s` and say
  "Execution Visualizer" twice.
- **`generateMetadata` on `/problems/[slug]`** reads `getProblemMeta` for title
  and description. F18 still owns canonical URLs, the OG image route, JSON-LD,
  `sitemap.ts` and `robots.ts` — deliberately not started here.
- **A skip link ships with the nav**, since adding a nav without one only makes
  the tab order worse. F18 still owns the full keyboard pass.

Verified: `tsc --noEmit`, `eslint`, `vitest run` (140 passing), `next build`
(clean; `/` and `/problems` both `○ Static`). Read all three prerendered HTML
files: `/` renders `<title>Execution Visualizer — Watch algorithms think.</title>`
(no doubled suffix), `/problems` renders `Problems — Execution Visualizer` with
`aria-current="page"` on its nav link, and `/problems/two-sum` renders
`1. Two Sum — Execution Visualizer` with NO site header (correct — that page
must keep its full viewport) and the back-link present.

**Not verified: anything visual**, same as H2/H3. The whole H-series still wants
one browser pass at 1440 and 390×844.

### H5 — Homepage: dead space, scroll affordance, depth

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

Reported from a screenshot: "lot of empty space, I don't know if I should
scroll or not, and the page looks dull." Three separate causes, fixed
separately.

- **The void under beat 2 was a real layout bug, not taste.**
  `ScrollScrubbedTrace`'s sticky pane is `h-dvh` and its content was
  `justify-center`. Sticky only pins once the track's top reaches the viewport
  top — before that the pane sits at the track's top, so a *centred* child
  renders half a viewport BELOW the fold. The section was literally blank until
  you had already scrolled past the thing meant to make you scroll. The pane now
  FILLS its height: fixed header row (identity + `STEP nn / 25` + progress
  hairline), `flex-1 min-h-0` body, fixed footer row. Recorded as a layout rule
  in the component's docblock, because re-centring it would silently bring the
  void back.
- **`TwoSumFlatView` gains `floatingControls` (default `true`).** H3 left this
  open: the `py-56 lg:pb-64` and the header row's `pr-32` exist only to clear
  `ScenePanel`'s floating fullscreen / render-mode toggles, and on the homepage
  nothing floats, so it was ~36px of dead space at the top of every card. Both
  pages that render it bare pass `false`.
- **Scroll affordance is now explicit, in three places at once**: a `ScrollCue`
  at the hero's bottom edge ("SCROLL — THE ALGORITHM STEPS WITH YOU", pure CSS
  `--animate-scroll-hint`, `motion-reduce:animate-none` leaves the label), a
  footer line in the sticky pane that switches between "KEEP SCROLLING TO STEP"
  and "TRACE COMPLETE", and numbered eyebrows (01/02/03) so the page never
  presents a screen that looks finished. Hero is sized
  `min-h-[calc(100dvh-160px)]` so the cue sits just above the fold and the next
  beat's rule peeks under it.
- **The hero's empty right half now renders a real frame.** `frames[15]` through
  `TwoSumFlatView` — mid-run on purpose (frame 0 is an empty map, frame 24 gives
  away the scroll demo's ending). Costs nothing: same array, same renderer the
  demo already pulls into the bundle. Captioned "NOT A MOCK — THE REAL TRACE",
  which is also the product claim.
- **Depth, using only existing tokens**: a fixed decorative layer (radial
  `surface-spotlight` wash + a 72px hairline grid masked to fade out), a
  `animate-halo` glow behind the primary CTA, a facts row (25 frames / 4
  languages / 2 approaches / 0 guesswork), and the pillars promoted from bare
  text to bordered cards with hover. No new dependency, no new token colour.
  The decor layer is `fixed` so the document is wrapped in a `relative` div to
  paint above it — which is also what finally makes `SiteFooter`'s `mt-auto` do
  anything.
- **Fixed a global CSS bug on the way past.** `globals.css` had
  `button :hover { scale: 1.1 !important }` — a DESCENDANT selector, so it
  scaled whatever child sat under the pointer (an icon, a label span) rather
  than the button, with no way for a component to opt out. Now
  `button:not(:disabled) { cursor: pointer }`. This affects every page, not just
  `/`.
- **The chip row under the narration uses a FIXED key list**
  (`i`, `num`, `complement`, `lookups`), not `Object.entries(frame.vars)`. The
  generator introduces keys as the run progresses, so mapping the object would
  grow the row mid-scroll and shove the narration upward. `seen` is excluded —
  the map on the right IS that variable, rendered properly.

Verified: `tsc --noEmit`, `eslint` (only pre-existing errors, both in
`design-reference/support.js`), `vitest run` (140 passing), `next build` (clean,
`/` still `○ Static`). Confirmed in the built CSS that the new utilities
compiled (`animate-scroll-hint`, `animate-halo`, `blur-panel`, `-inset-8`,
`min-h-[calc(100dvh-160px)]`, the masked grid) and in the prerendered
`.next/server/app/index.html` that the cue, the eyebrows, the pane footer and
both flat views are in the static HTML.

**Not verified: anything visual.** Same gap H2/H3/H4 all flagged — no browser
in this environment. Track height is now `340vh` for 25 frames; whether that
scrub rate feels right, and whether the hero's two columns hold at 390×844
(where the grid collapses and the hero card stacks under the copy), still need
one real browser pass.

### G1 — Promote shared machinery

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

Prerequisite for a second problem. Chosen over forking
`content/problems/two-sum/` (which would have duplicated ~1,700 lines of scene
and view code) because the survey that preceded it found the duplication was
almost entirely unnecessary.

- **The 3D scene needed NO parameterization, and that is the finding.**
  `scene.tsx` never read `scene.target` — all 40+ `target` hits in it were
  `targetColor`/`targetY` damping vocabulary. AGENTS.md's hard rule ("the canvas
  renders SHAPE AND MOTION only") had already made it problem-agnostic; nobody
  had noticed because there was only ever one problem. It moved to
  `components/scene/ArrayMemoryScene.tsx` essentially verbatim.
- **The one real change to it: the wall is keyed on "do these frames use
  memory", not on the approach's NAME.** Was `approach === "optimized" ? 1 : 0`;
  is now `frames.some((f) => f.scene.slots.length > 0)`, mirrored into
  `wallUpRef` by `FrameCursor`. This is what let a THIRD approach (`sorted`)
  land with no new case anywhere in the file — it is memoryless, so it resolves
  to 0 and shares brute force's staging for free. `Approach` is no longer
  imported by the scene at all.
- **`lib/types.ts`: `TwoSumScene` -> `ArrayMemoryScene`**, with `target`
  optional and `TwoSumScene = ArrayMemoryScene & { target: number }` kept as the
  narrowed alias. `Frame<T>` uses `T` covariantly, so `TwoSumFrame[]` is still
  assignable to `ArrayMemoryFrame[]` and Two Sum's own trace needed no edit.
- **`nums` is no longer constant across a trace**, and this is the subtle one.
  The sorted approach reorders it mid-run. Two consumers cached it off
  `frames[0]` and both were fixed: `ScenePanel` now passes `frame.scene.nums` to
  `LabelLayer`, and `LabelLayer`'s prop doc says why. The scene itself was
  already safe — it only ever reads `nums.length`, which sorting preserves, and
  a test now pins that the length is invariant.
- **Approaches are PER PROBLEM, not a fixed triple.** `ProblemTraces` gained
  `approaches` and is generic over the approach set, so `traces.build.optimized`
  stays non-optional for a problem that declared it. `scripts/build-traces.ts`
  iterates that list and emits `approaches.json` (same reasoning as
  `cases.json`: order is meaningful, a `readdir` would lose it);
  `lib/content.ts` reads it. Everything downstream is `Partial` in the approach
  axis.
- **Two Sum deliberately does NOT get the sorted tab.** Sorting destroys the
  indices it has to return, so recovering them costs O(n) space — the "sorted is
  the cheap middle" story that earns the tab on Contains Duplicate is simply
  false here, and shipping it would teach the wrong lesson. Recorded in its
  `trace.ts` so it does not get "fixed" later.
- **`ProblemChrome` (`components/problem/types.ts`) is where a problem's
  identity now lives** — complexity table, memory heading, probe/answer/caption
  formatters. It holds FUNCTIONS, which is load-bearing: functions cannot cross
  the RSC boundary, so chrome is supplied by a problem's own CLIENT module
  (`content/problems/<slug>/ProblemView.tsx`) and the route passes only plain
  data. The build caught this the hard way — see the `TwoSumFlatView` note in G2.
- **`CodePaneStack` now takes the ALREADY-RESOLVED approach** (`panes`,
  `lineMaps`, `lines` for one approach) instead of the full tables. The approach
  axis is `Partial`, so resolving it in two places would let the code pane and
  the scene disagree about which approach is showing. One resolution site, in
  `ArrayMemoryProblemView`.
- **Two extractions, both because the rule matters more than the copy:**
  `lib/frames.ts` (`createEmitter`/`changedPaths` — AGENTS.md's "`changed[]` is
  DERIVED by diffing, never hand-written" is only worth having if it holds
  everywhere) and `lib/solution-coverage.ts` (F14's lineMap guard as a suite any
  problem mounts in one line).
- **Fixed an inverted dependency on the way past:**
  `components/scene/LabelLayer.tsx` imported its position types from
  `content/problems/two-sum/scene`. They now live beside it.
- **`ProblemHeader` is now a Client Component.** It uses no hooks, but it is
  rendered from inside the client `ArrayMemoryProblemView` and takes
  `complexity` off the chrome, so it no longer gets to be server-rendered
  independently.

Verified: `pnpm traces` regenerates Two Sum **byte-identically** (25/20, 9/4,
13/7, 14/7 — the counts AGENTS.md pins), `tsc --noEmit`, `eslint` (clean except
the pre-existing `design-reference/support.js` findings), `vitest run`,
`next build`. Read the prerendered HTML: `/problems/two-sum` still renders
exactly two approach tabs.

### G2 — Contains Duplicate

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

The second problem, and the first with three approaches.
`content/problems/contains-duplicate/` holds only what is genuinely this
problem: `meta.ts`, `trace.ts`, `chrome.ts`, `solutions/`, `ProblemBrief.tsx`, a
four-line `ProblemView.tsx` and tests.

- **Three approaches, best first:** `optimized` (hash set, O(n)/O(n)), `sorted`
  (O(n log n)/O(1)), `brute` (O(n²)/O(1)). The middle one is the entire reason
  this problem was worth building second — it is the smallest problem where
  sorting is genuinely reasonable, *because the answer is a boolean and so the
  original positions are disposable*. The brief says exactly that, and points at
  Two Sum as the contrast.
- **`result` is a PAIR OF INDICES on every approach even though the answer is a
  boolean.** The pair is what the scene lights up; `result !== null` is the
  answer, and `chrome.formatAnswer` turns it back into `true`/`false`. For
  `sorted` those indices are positions in the SORTED array, which is what the
  viewer is looking at by then — so the cross-approach test asserts on the
  BOOLEAN, not the pair, and the "pair really is equal" test indexes against the
  frame's own `nums` rather than the input.
- **The sort is ONE frame, not an animated sort.** The lesson is what sorting
  buys, not how a sort works — that is its own problem, with its own page. The
  frame reorders `nums`, lights tile 0 and sets the cursor.
- **Constraint discovered while writing the cases: no case may already be
  sorted.** `[3, 3, 5, 7]` was the original `first-pair` input and it is in
  order, so the sort frame reordered nothing and read as a dead step. It would
  still have PASSED the scene-identity check (the frame also moves the cursor),
  which is exactly why it now has its own test — `$id is not already sorted`.
  Changed to `[5, 5, 9, 2]`.
- **Frame counts (headline case `[4, 1, 9, 7, 3, 9]`): optimized 19, sorted 8,
  brute 17.** The case was chosen so all three have a story: the set fills to
  five entries before the repeat lands, brute force grinds three anchors, and
  the sorted walk is SHORT precisely because the sort did its work off-screen —
  a step counter cannot show O(n log n), so the narration carries it instead.
  Same lesson AGENTS.md's F1 note records for Two Sum's inverted counts.
- **`late-answer` is brute force at its LUCKIEST** (twins at both ends, so the
  first anchor finds it) and the set at its worst. Deliberate: the comparison is
  more honest for admitting a case where the bad approach wins.
- **`TwoSumFlatView` came back, as a client wrapper.** The build failed with
  "Functions cannot be passed directly to Client Components" — `app/page.tsx` is
  a Server Component and was passing `TWO_SUM_CHROME` across the boundary. The
  fix is a `"use client"` wrapper in `content/problems/two-sum/` that binds the
  chrome on the client side. Related correction: `ScrollScrubbedTrace` had
  briefly taken `chrome` as a prop "to stay generic", which was wrong — it
  hardcodes `WATCHED_VARS = ["i", "num", "complement", "lookups"]`, i.e. Two
  Sum's own variables. It imports the bound view directly again.
- **The catalog lit up with zero edits.** `content/catalog.ts` was not touched:
  H1 derives `status` from whether `content/problems/<slug>/` exists, so
  `/problems` went from 149 SOON pills to 148 and gained a second featured card
  on its own.

Verified: `pnpm traces` (12 new frame files + two manifests), `tsc --noEmit`,
`eslint`, `vitest run` (**378 passing, up from 140**), `next build` (clean;
`/problems/contains-duplicate` prerenders via `generateStaticParams`). Read the
prerendered HTML: title `217. Contains Duplicate — Execution Visualizer`, three
approach tabs (`Optimized` / `Sort + Scan` / `Brute Force`) against Two Sum's
two, and the catalog's 148/152 counts above.

**Not verified: anything visual** — no browser in this environment, the same gap
the whole H-series flagged. Two things specifically want a real pass: (1) the
sorted approach in 3D, where the tiles are fixed positional boxes and only the
DOM value labels swap on the reorder — correct, but it wants a look to confirm
it reads as the array reordering rather than as a glitch; (2) the three-tab
header row at 390×844, where `ApproachTabs` now has to fit one more pill beside
`ComplexityReadout`.

### G4 — Group Anagrams

**Status:** Done
**Date:** 2026-07-28
**Owner:** Ajay

Built to `specs/add-a-problem.md` with no changes outside
`content/problems/group-anagrams/` and the two lines in
`app/problems/[slug]/page.tsx`. Nothing in `components/`, `lib/` or
`content/catalog.ts` was touched. Three decisions a future session should not
re-open:

- **One tile per WORD, not per letter.** Every step this problem takes is at
  word granularity (take a word, sign it, file it), so a per-letter row would
  animate nothing the algorithm does. `nums[i]` is the word packed base-27
  (a=1…z=26, 0 unused so `'a'` and `'aa'` cannot collide), `labels[i]` is the
  word itself. The packing exists only because `TestCase.nums` is `number[]`;
  `chrome.ts` duplicates the five-line `decodeWord` rather than importing
  `../trace`, which would drag three generators and three listings into the
  client bundle. `target` is unused — the words ARE the input.
- **The final frame relays the row so groups sit contiguously.** This problem's
  answer is a PARTITION and `scene.result` is a tile pair, so there was no
  honest way to report it otherwise. The relayout is literally what
  `return [...groups.values()]` produces, it is legal because `scene.nums` is
  per frame (only its length is invariant, G1 rule 4), and it makes `result`
  the real tile span of the biggest group — or `null` when nothing grouped,
  which is what gives the `no-answer` case a negative pill and suppresses the
  flat view's return chip. The partition itself is prose in `vars.groups`, per
  AGENTS.md's hard rule, so `chrome.formatAnswer` reads
  `biggest group: N words` rather than a list it cannot reconstruct.
- **`optimized` keys on LETTER COUNTS, not a sorted signature.** Corrected
  mid-session after review: the first cut used `[...word].sort().join('')` as
  the map key, which is O(k log k) per word. Tallying into a 26-slot count and
  keying on that is O(k), reaches the same equivalence classes, and is the
  actual optimum — so `sorted` is now a genuinely different (worse) algorithm
  rather than the same one with extra steps, and the three tabs read
  O(n·k) → O(n·k log k + n log n) → O(n²·k). The active line for the key frame
  is the TALLY (line 7), not the `count.join(',')` that formats it. Consequence
  for the scene: `slot.key`/`scene.probe` are numeric and the real key is a
  26-field string, so the scene carries a numeric ID — `keyIdOf` packs the
  sorted form, which is in bijection with the counts, and `chrome.ts` unpacks
  it to render `a1 e1 t1`. Nothing in the trace sorts a word to get it;
  `trace.test.ts` pins the two notions of "same group" against each other.
- **The sorted approach's sort frame sets the CURSOR but lights no tile.**
  `add-a-problem.md` §4c says it should do both; doing both makes that frame
  scene-identical to the first word's own read frame whenever the list has one
  element or the sort is a no-op, which the every-frame-changes rule then
  fails. Cursor only. The "no shipped case is already sorted by signature"
  assertion is still there and still necessary — it is what stops the frame
  reordering nothing.

Approaches ship as `['optimized', 'sorted', 'brute']`. `sorted` is legitimate
here where Two Sum could not have it: grouping never reports a position in the
original list, so reordering the words destroys nothing.

Headline frame counts (`strs = ["eat","tea","tan","ate","nat","bat"]`):
**optimized 23, sorted 15, brute 21** — the same inversion Contains Duplicate
records. `sorted` is the shortest of the three because its comparisons happen
inside one off-screen sort frame, so the complexity readout carries that story,
not the step counter.

Verified: `pnpm traces` (12 new frame files + two manifests), `tsc --noEmit`
clean, `vitest run` **824 passing** (up from 605), `eslint` clean apart from the
pre-existing `design-reference/support.js` errors.

**Not verified: anything visual, and `next build` did not get a run in this
session** (the sandbox blocked it after `pnpm traces`, `tsc`, `vitest` and
`eslint` had all passed). Two things specifically want a real pass: (1) the
final relayout frame, where the tiles are fixed positional boxes and only the
DOM labels swap, so "the words settle into their groups" has to read as a
regroup rather than a glitch — the same risk Contains Duplicate's sort frame
flagged, but over six tiles at once; (2) whether `biggest group: 3 words`,
`O(n·k log k + n log n)` and the wider `a1 e1 t1 has a group` probe pill fit
their rows at 390×844.
