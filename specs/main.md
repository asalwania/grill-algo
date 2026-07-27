# DSA Visualizer — Step-by-Step Build Prompts

**Scope:** Two Sum, end to end, deployed.
**Budget:** ~80 hours · under 5 hrs/week · hard ship date **30 November 2026**.
**Rule:** one prompt, one feature. Do not run two at once. Do not skip the spikes.

---

## 0. How to use this file

Prompts are grouped into five phases. Run them **in order**. Each has a **Goal**, a **Prompt** (copy the fenced block verbatim), and a **Done when** checklist. If a Done-when item fails, fix it before moving on — every prompt assumes the previous one landed.

### 0.1 The context block

Paste this at the top of **every new AI coding session**. It's the single highest-leverage thing in this file — without it you will re-explain the architecture forty times and get inconsistent code.

```
PROJECT CONTEXT — read before responding.

I'm building a DSA learning web app. Current scope is ONE problem (Two Sum),
built end to end and deployed. Not an MVP of twelve.

Architecture decisions already made — do not re-litigate these:

- Next.js App Router + TypeScript + Tailwind. Static export where possible.
- Code shown in the app is FIXED and READ-ONLY. Nothing executes in the browser.
  "Execution" is scripted playback over a pre-generated frame array.
- Frames are generated at BUILD TIME by a yield-based generator function that
  actually computes the answer. Never hand-write frame JSON.
- Each frame is a FULL STATE SNAPSHOT plus change hints. Not event deltas.
  This makes seek and reverse-step trivial.
- Code pane: Shiki, highlighted at build time to static HTML. Zero runtime
  syntax-highlighting JS. Not Monaco, not CodeMirror, not Prism.
- Player state: useReducer + TWO separate contexts (state and dispatch).
  Not Zustand, not XState.
- Motion: Framer Motion for DOM. Damped useFrame for 3D. GSAP is reserved for
  the homepage only and must never appear in the learning view.
- 3D: React Three Fiber + drei, used throughout the learning view.
- HARD RULE: the canvas renders SHAPE AND MOTION only. Every word and number —
  values, indices, variable names, narration — lives in the DOM layer.
  No text meshes, no drei <Text> in the scene.
- Continuous/interpolated values must NEVER cross React Context. Only the
  discrete step index and boolean flags. Interpolation happens imperatively
  inside the scene's own frame loop.

Respond with code for ONE feature only. Ask before adding any dependency.
```

### 0.2 Hours log

Fill this in as you go. **This log is the actual deliverable of the slice** — in November it answers "can I afford eleven more of these?", and nothing else can.

| Phase                   | Estimate | Actual |
| ----------------------- | -------- | ------ |
| Design (Stitch)         | 6        |        |
| Spikes                  | 6        |        |
| Setup                   | 4        |        |
| Trace + data model      | 5        |        |
| Code pane + highlight   | 6        |        |
| Player state + controls | 8        |        |
| DOM panels              | 5        |        |
| 3D scene                | 20       |        |
| Mobile layout           | 8        |        |
| A11y + perf tiers       | 5        |        |
| Content + SEO + deploy  | 7        |        |
| **Total**               | **80**   |        |

---

## Phase 1 — Design

> **Using Claude Design instead of Stitch?** The five prompts S1–S5 work as
> written — paste them one at a time, one screen per artifact. Skip the Stitch
> notes below and go straight to **S6**, which has a Claude Design–specific
> version. Everything after Phase 1 is unchanged.

Six prompts. Budget one evening. Go to `stitch.withgoogle.com`.

**Mode:** use **Standard mode** (Gemini 2.5 Flash) — it's the only mode with Figma export, and you want editable layers, not Stitch's generated code. You are extracting _tokens and layout_, not shipping its output.

**Two rules that matter more than the prompts:**

1. **One change per prompt.** Stitch degrades badly when you ask for five things. Generate, look, refine in chat, then move on.
2. **Do not ship Stitch's code.** Its HTML will not survive contact with R3F, Shiki, or your frame model. Take the palette, type scale, spacing rhythm, and component proportions. Rebuild in Tailwind.

Stitch is also noticeably stronger at mobile than web, so **S2 (mobile) will come out better than S1 (desktop)**. Generate mobile first if you want the design language to settle before you fight the desktop layout.

### S1 — Design system

**Goal:** lock the visual identity before any screen exists.

```
Create a design system reference sheet for a dark-mode developer education
product called an algorithm execution visualizer. It should feel like a
premium developer tool crossed with a scientific instrument — precise,
calm, high contrast, generous negative space. Not playful, not corporate SaaS.

Show on one screen:

Color swatches with hex codes:
- Base background: near-black, very slightly blue (#0A0B0F)
- Elevated surface: #14161D
- Hairline border: white at 8% opacity
- Primary text: #E8EAF0
- Muted text: #8B93A7
- Signal cyan #3DDCFF — the currently executing element
- Signal amber #FFB454 — a comparison in progress
- Signal violet #A78BFA — a value stored in memory
- Signal green #4ADE80 — a match or successful return

Typography scale using a serif display face for headings (Instrument Serif),
a geometric sans for UI (Inter), and JetBrains Mono for code. Show display
48/32/24, body 16/14, mono 14/13, with line heights.

An 8px spacing scale, 4 through 64.

Component samples: a glass panel with a 1px hairline border and no drop
shadow, a ghost icon button, a pill-shaped step counter reading "STEP 7 / 24",
and a horizontal scrubber track with a filled portion in cyan.

Depth comes from glow and hairlines only. No drop shadows anywhere.
```

**Done when:** you have hex codes, a type scale, and a spacing scale you actually like. Everything downstream inherits these.

### S2 — Mobile problem page

**Goal:** the layout you settled on — sticky scene, scrolling code, thumb controls.

```
Using the previous design system, design a mobile screen (390x844) for an
algorithm visualizer, vertically stacked in four zones top to bottom:

1. Top 40% of the viewport: a sticky dark visualization panel. Inside it,
   show a row of six rounded rectangular tiles in perspective, labelled
   2, 7, 11, 15, 3, 6. The third tile glows cyan. Behind and above the row,
   a vertical grid of small slots, two of them filled violet. A thin cyan
   beam connects the glowing tile to one filled slot.

2. Below it: a single line of narration text in muted grey, reading
   "11's complement is -2 — not in the map yet."

3. Below that: a scrolling code block in JetBrains Mono with line numbers,
   showing 12 lines of JavaScript. Line 5 has a subtle cyan-tinted highlight
   band across its full width with a 2px cyan bar on the left edge.

4. Fixed to the bottom, above the safe area: a control bar with a horizontal
   scrubber showing step 7 of 24, and below it five circular ghost buttons —
   restart, previous, play/pause (larger, cyan-filled), next, and a speed pill
   reading "1.5x".

Add a small collapsed handle above the control bar labelled "Variables"
suggesting a bottom sheet that pulls up.
```

**Done when:** all four zones are visible simultaneously without scrolling. If the code block is pushed off-screen, tighten the scene panel and regenerate.

### S3 — Desktop problem page

```
Now design the desktop version of the same screen at 1440x900.

Split layout, 45% left and 55% right, separated by a 1px hairline.

Left column: a problem header reading "1. Two Sum" with a difficulty pill
reading "EASY" and a pattern pill reading "HASH MAP". Below it, two tabs —
"Optimized" (active) and "Brute Force". Below that, a language selector as
four small pills: JavaScript (active), Python, Java, Go. Then the code block
with line numbers and the cyan active-line highlight on line 5. Below the
code, the control bar with scrubber and transport buttons.

Right column: the 3D visualization filling the full height. A row of tiles
on a ground plane in perspective, a vertical wall of slots behind them,
a cyan beam between. Bottom-left of this panel, a floating glass card
titled "VARIABLES" listing i = 2, num = 11, complement = -2 in mono type.
Bottom-right, a small "2D / 3D" toggle.

Above the visualization, a single-line narration strip.
```

**Done when:** the code line and the scene are legible side by side at 1440px. Check that the variables card doesn't obscure the tiles.

### S4 — Problem index page

```
Design a problem index page, desktop 1440x900, same design system.

A large serif headline, a one-line subtitle in muted grey, and generous
vertical space above a grid of problem cards, three per row.

Each card: a dark glass panel with hairline border, a small abstract line
diagram at the top hinting at the data structure, the problem number and
title in serif, a one-line description in muted grey, and two small pills
at the bottom for difficulty and pattern. On the first card, show a subtle
cyan glow on the border to indicate hover state.

Only the first card should be fully filled in; show the other five as the
same structure with placeholder content.
```

### S5 — States

```
Design three states as separate frames, same design system, mobile width:

1. Loading: the visualization panel with a subtle animated shimmer and a
   thin indeterminate progress line in cyan, code block already visible
   below it with content.

2. WebGL unavailable: the visualization panel replaced by a clean data table
   showing "Array" with six values and their states, and "Map" with two
   key-value rows. A small muted note reads "3D unavailable — showing data
   view." Code block and controls unchanged below.

3. Reduced motion: identical to the normal state, but with a small pill in
   the top corner of the scene panel reading "MOTION REDUCED".
```

**Why this one matters:** these are the states you will otherwise design at 11pm in week nine, badly.

### S6 — Export and reconcile

> **If you used Claude Design instead of Stitch, this is the version to follow.**
> Claude Design cannot export to Figma. It exports standalone HTML, and that's
> better for this purpose — you get real computed CSS values instead of layers
> you'd transcribe by hand.

**Step 1.** For each of the five designs: `Share → Export as standalone HTML`. Download all five into `design-reference/` in the repo. Commit them. They are your visual source of truth and you will diff against them in month three.

**Step 2.** Reconcile before you extract. Claude Design generates each artifact independently with no shared component library, so **five separately-generated screens will have drifted** — three near-identical greys, two border radii that were meant to be one, a spacing scale that's 8px on four screens and 6px on the fifth. This is the single failure mode of this workflow. Run:

```
Attached are five standalone HTML exports of the same product's screens,
generated separately, so they have drifted.

Do not write any application code. Produce ONE reconciled token set.

1. Extract every distinct value across all five files: colors, font families,
   font sizes, line heights, font weights, spacing values, border radii,
   border colors and opacities, blur amounts, transition durations.

2. Cluster near-duplicates and tell me explicitly where they disagree —
   e.g. "#14161D appears in 3 files, #15171E in 1, #141620 in 1; these are
   the same intended surface color."

3. For each cluster, pick one canonical value and say why.

4. Output the final set as a table, grouped by category, with a short
   semantic name for each token (surface-raised, signal-active,
   border-hairline) rather than a literal one (gray-800).

5. Flag anything that appears exactly once across all five files — it's
   either a real accent or an accident, and I need to decide which.

Then list which of the five screens will visibly change once the reconciled
values are applied.
```

**Step 3.** That table becomes `tailwind.config.ts` in P2. Once it's committed, future Claude Design sessions can read the tokens back out of your repo, so subsequent screens inherit the real system instead of re-inventing it. Do it in that order.

**Do not ship the exported HTML.** It looks more shippable than Stitch's output would have, which makes it more dangerous. It has no R3F, no Shiki, no frame model, and Claude Design's own guidance is that exported code needs an audit for accessibility, SEO and testing before production. Take the tokens and the proportions; rebuild the markup.

---

## Phase 2 — Spikes

Three afternoons. Each de-risks something that would otherwise cost you weeks in October. **Throw all this code away afterwards.** These are experiments, not foundations.

### SP1 — Does Context cross the R3F Canvas boundary?

```
Minimal Next.js App Router page. Create a React Context holding { count: number }.
Render a button that increments it, and a react-three-fiber <Canvas> as a sibling
inside the same provider. Inside the Canvas, render a mesh whose colour is driven
by useContext of that same context.

Tell me plainly whether the context value propagates into the Canvas subtree in
the R3F version you install. If it does not, show the fix using
useContextBridge from @react-three/drei.

Print the installed versions of three, @react-three/fiber and @react-three/drei
in your answer.
```

**Done when:** you know the answer for your exact versions. If it needs a bridge, write that down — it changes every scene file you'll write.

### SP2 — Shiki active-line bar

```
Next.js App Router page. Use Shiki at build time (in a server component) to
highlight a 12-line JavaScript snippet. Configure it so each rendered line
carries a data-line attribute with its 1-based number.

Client-side, render an absolutely-positioned Framer Motion div that sits behind
the code and animates its y and height to match the current active line,
using layout animation. Add prev/next buttons to change the active line.

Requirements:
- the highlight must glide smoothly, not jump
- it must stay correct if the container is resized
- no syntax highlighting library may ship to the client
```

**Done when:** the bar glides, survives a window resize, and your network tab shows no Shiki bundle.

### SP3 — Generator produces usable frames

```
Write a TypeScript generator function that solves Two Sum with the hash-map
approach and yields a frame at each meaningful point.

Frame shape:

type Frame = {
  step: number
  line: number
  narration: string
  why: string
  variables: Record<string, string | number>
  scene: {
    array: { values: number[]; states: ('idle'|'active'|'seen'|'matched')[] }
    map: { entries: [number, number][]; probeKey?: number }
    target: number
    result?: [number, number]
  }
  changed: string[]
}

Every frame carries the FULL scene state, never a delta.

Write a Node script that runs it on nums=[2,7,11,15,3,6], target=9 and writes
frames.json. Include a vitest test asserting the last frame's result is correct
and that scene.array.states has the same length as values in every frame.

Then print frames 0, 5 and the final frame so I can eyeball whether the
narration and state actually read well.
```

**Done when:** you read the printed frames and think "yes, I'd want to watch that." If the narration is dull, that's the product's core failing surfacing cheaply — fix it here.

---

## Phase 3 — Setup

### P1 — Scaffold

```
Scaffold a Next.js 15 App Router project, TypeScript strict, Tailwind, ESLint,
pnpm, no src directory, no default template content — strip the boilerplate page
and CSS to empty.

Create exactly this structure with empty placeholder files:

app/
  layout.tsx
  page.tsx
  problems/[slug]/page.tsx
components/
  player/
  panels/
  scene/
  ui/
content/problems/two-sum/
  meta.ts
  trace.ts
  scene.tsx
  content.mdx
  solutions/
lib/
  types.ts
  content.ts
scripts/
  build-traces.ts

Install only: three, @react-three/fiber, @react-three/drei, framer-motion,
shiki. Nothing else. Do not add a UI component library.

Show me package.json when done.
```

### P2 — Design tokens

```
Here are my design tokens from Figma:

[PASTE YOUR S6 NOTE HERE]

Write tailwind.config.ts and app/globals.css encoding these as the ONLY
available values. Remove Tailwind's default color palette entirely so I
cannot accidentally use bg-blue-500.

Set up the three fonts via next/font with variable CSS custom properties
and display: swap.

Then build one demo page rendering a swatch of every token so I can compare
it side by side against the Figma export.
```

**Done when:** the demo page matches Figma. Removing the default palette is the important bit — it makes design drift impossible rather than merely discouraged.

### P3 — Types and content loader

```
Write lib/types.ts containing the Frame and TwoSumScene types from SP3, plus:

type ProblemMeta = {
  slug: string
  number: number
  title: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  pattern: string
  blurb: string
}

type Language = 'javascript' | 'python' | 'java' | 'go'
type Approach = 'brute' | 'optimized'

type Solution = {
  language: Language
  code: string
  lineMap: Record<number, number>   // canonical trace line -> line in THIS listing
}

Then lib/content.ts: a plain fs.readdir-based loader over content/problems
that returns all ProblemMeta, and one that loads a single problem's meta,
frames, solutions and MDX by slug. Server-side only.

Do not use Contentlayer. Keep it under 60 lines.
```

---

## Phase 4 — Features

**One per session.** Each builds on the last. Resist reordering — the DOM layer comes before the 3D deliberately, so you have something working to look at while the scene is still a grey box.

### F1 — Trace pipeline

```
Promote the SP3 generator into content/problems/two-sum/trace.ts.

Add a second generator for the brute-force nested-loop approach, emitting the
same Frame type. Its scene.map stays empty throughout — brute force uses no
memory structure, and that absence is the point.

Write scripts/build-traces.ts that runs every problem's generators and writes
frames.optimized.json and frames.brute.json into the problem folder. Wire it
as a prebuild step in package.json.

Add vitest tests: both approaches return the same answer, every frame's
line number exists in the canonical listing, and no frame's scene is
structurally identical to the previous one (that would mean a wasted step).
```

**Done when:** `pnpm build` regenerates traces automatically and tests pass.

### F2 — Code pane

```
Build components/panels/CodePane.tsx.

Server component. Takes code and language, highlights with Shiki at build time
using a theme matching my token palette, emits data-line on each line, renders
line numbers in a non-selectable gutter.

Requirements:
- zero client JS
- code present in view-source
- horizontal overflow scrolls within the pane, never the page
- tabular figures in the gutter so numbers don't jitter
```

### F3 — Active line highlight

```
Add the active-line bar to CodePane, using the SP2 approach.

A client component overlays the server-rendered code and animates a Framer
Motion div to the active line's offset. Cyan tint at 8% with a 2px solid left
edge and a soft outer glow.

Take activeLine as a prop for now — the player isn't wired yet. Add temporary
prev/next buttons to test.

The bar must not intercept pointer events, and text must remain selectable
through it.
```

### F4 — Player state

```
Build components/player/PlayerProvider.tsx.

useReducer with state { step, isPlaying, speed, language, approach, renderMode }.
Actions: NEXT, PREV, PLAY, PAUSE, RESTART, SEEK, SET_SPEED, SET_LANGUAGE,
SET_APPROACH, SET_RENDER_MODE.

Expose it through TWO separate contexts — PlayerStateContext and
PlayerDispatchContext — so components that only dispatch never re-render on
step change. Provide usePlayerState() and usePlayerDispatch() hooks that throw
outside the provider.

Playback loop: requestAnimationFrame accumulating elapsed time against a
per-step interval derived from speed. NOT setInterval. Pause automatically on
document.visibilitychange to hidden. Stop at the final step and set isPlaying
false.

Changing approach or language must clamp step to the new frame count rather
than crashing.

[If SP1 showed context does not cross the Canvas: also wrap the Canvas with
useContextBridge for both contexts.]
```

**Done when:** you can drive F3's highlight from real player state and hold NEXT without the animation falling behind.

### F5 — Controls

```
Build components/player/Controls.tsx from the S2/S3 design.

Scrubber (input range styled to the design, cyan fill to current position),
restart, prev, play/pause, next, speed cycling 0.5x / 1x / 1.5x / 2x.

Requirements:
- full keyboard support: space toggles play, arrows step, Home restarts
- aria-label on every control; the scrubber is a proper slider with
  aria-valuenow / valuemin / valuemax / valuetext
- 44px minimum touch targets
- dispatch-only, so it must not re-render on step change except the scrubber
  position and step counter — verify with React DevTools profiler
- scrubbing while playing pauses, then resumes on release
```

### F6 — Variables and narration

```
Build components/panels/VariablesPanel.tsx and NarrationStrip.tsx.

Variables: reads frame.variables, renders name/value rows in mono. When a value
changes between frames, flash its row with the violet signal colour and animate
the number with a brief Framer Motion transition. Values that vanish should
fade out, not disappear instantly — use AnimatePresence.

Narration: renders frame.narration as a single line, cross-fading on change with
a small upward slide. Fixed height so the layout never shifts. Below it, a
collapsible "Why?" disclosure showing frame.why.

Both must announce politely to screen readers — aria-live="polite" on the
narration only, not on variables, or it will be unbearable.
```

**Done when:** you have a working, useful, un-pretty product with no 3D at all. Screenshot it. This is your no-WebGL fallback tier, already done.

### F7 — Scene shell

```
Build components/scene/SceneShell.tsx — the reusable frame every problem's
bespoke scene mounts inside.

- next/dynamic with ssr: false around the Canvas
- frameloop="demand" by default; switch to "always" only while isPlaying
- a lighting rig: one key directional light, one dim fill, subtle ambient,
  matching the cinematic-but-legible look
- a camera rig component exposing an imperative moveTo(x, y, z) that damps
- OrbitControls, but constrained: no pan, limited polar angle, zoom clamped
- a WebGL capability check that renders children only if supported, and a
  fallback prop otherwise
- resize handling with a capped device pixel ratio: dpr={[1, 2]}

No text, no meshes for content. This is scaffolding only.
```

### F8 — Array floor

```
Build the array tiles inside content/problems/two-sum/scene.tsx.

Extruded rounded boxes in a row along X on a subtly reflective ground plane.
Colour driven by scene.array.states: idle is the elevated surface colour,
active glows cyan, seen is dimmed violet, matched glows green.

Transitions use damping in useFrame toward target colour, emissive intensity
and Y position — active tiles lift slightly. NEVER tween with a fixed duration;
the user can scrub and the motion must retarget mid-flight.

Read the current frame via a transient subscription or a ref updated by an
effect — the scene must NOT re-render React on step change.

Values and indices are NOT rendered in 3D. Emit each tile's projected screen
position through a callback so the DOM layer can absolutely-position labels
over the canvas.
```

**Done when:** stepping changes tile colours smoothly and scrubbing rapidly produces no snapping.

### F9 — Labels layer

```
Build components/scene/LabelLayer.tsx — an absolutely positioned DOM layer over
the canvas rendering every value and index label at the projected positions
emitted by F8.

Requirements:
- labels update on the animation frame via direct style transform writes,
  not React state
- they must not intercept pointer events
- they scale down but never below 11px, and fade out below a minimum size
- they are real text: selectable, translatable, and present in the
  accessibility tree
```

**Why this is its own feature:** it's the load-bearing half of your "canvas does shape, DOM does words" rule. Get it wrong and everything after it is blurry.

### F10 — Hash map wall

```
Add the hash-map wall behind the array, in the same scene file.

A vertical grid of slot frames. Filled slots glow violet and show their entry
via the LabelLayer. Slots fill with a short spring overshoot when written —
this is the one place a spring beats damping, because insertion should feel
punchy rather than smooth.

The wall renders only when scene.map exists and has capacity, so the brute-force
trace naturally shows no wall at all.
```

### F11 — Lookup beam

```
Add the lookup beam.

At each frame where scene.map.probeKey is set, a thin emissive beam travels from
the active tile up to the corresponding wall slot. If the slot is filled, it
lands and both ends flash green. If empty, it passes through the gap and
dissipates.

Implement as a single reusable mesh whose endpoints are damped, not a new mesh
per step. Beam intensity and colour damp toward target; the hit flash is a
short spring.

Add a subtle bloom on hits only. Post-processing must be disabled entirely in
the reduced-quality tier — check before adding @react-three/postprocessing
whether the bundle cost is worth it, and tell me the number before installing.
```

### F12 — Camera choreography

```
Wire the camera rig to the player.

As step advances, the camera dollies along X to keep the active tile centred,
with a slight lead so the user sees where the scan is heading. Damped, never
tweened.

On the final matched frame, pull back slightly and tilt to bring both matched
tiles and the wall into frame together.

If the user has manually orbited, suspend automatic camera movement until they
press restart — nothing is more irritating than a camera that fights you.
```

### F13 — Approach toggle

```
Wire the Brute Force / Optimized tabs to swap frame arrays and code listings.

The transition is the showpiece: switching to Optimized raises the hash-map wall
out of the ground plane and collapses the brute-force crisscross beams into a
single vertical beam. Switching back reverses it.

Roughly 700ms, damped, fully interruptible. Step index clamps to the new
frame count.

Below the tabs, add a small complexity readout — O(n²) time / O(1) space versus
O(n) / O(n) — that cross-fades with the toggle.
```

**Done when:** you show someone the toggle and they say "oh, I get it." If they don't, the metaphor needs work — and this is the last cheap moment to find out.

### F14 — Languages

```
Add the language selector.

Write Python, Java and Go listings for both approaches, plus a lineMap for each
mapping canonical trace lines to that listing's lines.

Switching language changes only the code pane and the highlight position.
The frames, the scene, the variables and the narration are untouched — this is
the whole point of the line-map design.

Add a vitest test asserting every lineMap covers every distinct line number
appearing in the frames, so a missing mapping fails the build instead of
silently highlighting line 0.
```

### F15 — Mobile layout

```
Make the problem page responsive to the S2 mobile design.

Under 1024px: sticky scene at 40vh, narration strip, scrolling code below,
controls fixed above the safe-area inset. Variables move into a bottom sheet
with a drag handle, snapping between collapsed and half.

Code auto-scrolls to keep the active line vertically centred — smooth, and
skipped when the user has scrolled manually in the last few seconds.

Canvas touch handling: one finger scrolls the page, two fingers orbit the
camera. Configure OrbitControls accordingly and verify on a real device that
page scroll is never captured.

Add a fullscreen button on the scene panel.

Test at 390x844 and 360x640.
```

**Do not skip the real-device test.** The two-finger gesture is the thing that breaks, and it breaks only on hardware.

### F16 — Performance and reduced motion

```
Add three quality tiers.

FULL: current behaviour.
REDUCED: prefers-reduced-motion, or a manual toggle. Same scene, but state
changes SNAP instead of damping. Camera locks to a fixed angle. No bloom,
no idle motion. Frame information is fully preserved — we remove motion,
not meaning.
MINIMAL: no WebGL, or a detected low-end device. Canvas is not mounted at all.
Render the S5 data-table view instead.

Detection: matchMedia for reduced motion, a WebGL context probe, and
navigator.hardwareConcurrency <= 4 as a weak low-end signal. Always allow
manual override, persisted in localStorage.

Also: IntersectionObserver to set frameloop="never" when the canvas leaves the
viewport, and confirm the three/R3F bundle is not in the initial page chunk.

Report the Lighthouse mobile score and the initial JS transfer size before
and after.
```

### F17 — Content

```
Wire content.mdx into the problem page: explanation, worked examples,
constraints, common mistakes, and pattern-recognition guidance.

On desktop these sit below the split view; on mobile, below the controls.
Style with a typography scale from my tokens — no @tailwindcss/typography
defaults, they'll fight the design system.

Write the actual Two Sum content. Beginner-readable, no jargon without
definition, and the pattern section must explain how to RECOGNISE that a
problem wants a hash map, not just that this one did.
```

### F18 — SEO and shipping

```
Finalise for production.

- generateStaticParams over content/problems; the page must be fully static
- generateMetadata: title, description, canonical, OG image
- an OG image route rendering the problem title and pattern on the dark theme
- JSON-LD as a LearningResource
- sitemap.ts and robots.ts
- semantic landmarks, a skip link, and a full keyboard pass with no mouse

Then deploy to Vercel and give me the Lighthouse scores for performance,
accessibility, best practices and SEO on mobile.

Flag anything below 90 and tell me what it would cost to fix.
```

---

## Phase 5 — The decision

**30 November.** Ship whatever exists. Then:

1. **Fill in the hours log.** Total it. Divide the 3D scene hours by one — that's your real per-problem cost, and it's the only number that matters.
2. **Watch five people use it.** Say nothing. Note whether they scrub backwards, whether they read the narration, whether they touch the 2D/3D toggle, and whether they switch language. Anything nobody touches is a feature you shouldn't rebuild eleven times.
3. **Answer the question honestly.** At your measured cost, how many more can you afford in a year? If the answer is under four, revisit the showcase path — three problems, spectacular, finished — rather than grinding toward twelve.

### Still open, deliberately

- **The twelve-pattern positioning.** Framing the product as "twelve patterns, deeply visualized" rather than a problem library is what makes a small library coherent instead of thin. Decide after the slice; it shapes what problems 2–12 are.
- **Distribution.** Still the largest untouched risk. A great product nobody finds is a failed product. Worth thinking about before November, not after.
- **The homepage.** Cinematic scroll, GSAP, the whole story. Deliberately absent from this file. It's 40–60 hours and it serves nobody until there's something to scroll toward.
