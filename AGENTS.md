<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Progress Tracker

Always update the `@specks/progress-tracker.md` progress tracker after any task you have done.

# PROJECT CONTEXT — read before responding.

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

# Spikes — settled questions, do not re-litigate

Spike routes live under `app/(SPn)/`. The parentheses are a route group, so they
add no URL segment. Findings are written up in `docs/spikes/`.

- **SP1 — [Context across the R3F `<Canvas>` boundary](docs/spikes/SP1-context-across-canvas.md).**
  React Context DOES propagate into the Canvas subtree automatically in this
  stack (R3F 9.6.1 bridges it via `its-fine`). Do NOT add drei's
  `useContextBridge` — it is redundant here. Read the doc before touching
  provider placement around `<Canvas>`, or before debugging a colour that
  won't update: `three@0.185` silently ignores space-separated `hsl(a b% c%)`
  and only accepts the comma form.

- **SP2 — [Shiki active-line bar](docs/spikes/SP2-shiki-active-line-bar.md).**
  The bar is driven by measured line rects, never a computed row height. Two
  things are load-bearing and both fail silently if removed. (1) The bar's
  `layoutDependency={activeLine}` — Framer Motion snapshots layout on EVERY
  render by default, so without it a resize makes the bar slide to its
  corrected position instead of snapping. The prop is absent from
  `framer-motion`'s `.d.ts` but is public in `motion-dom`; don't delete it as
  dead code. (2) Shiki emits literal `\n` text nodes between lines, which
  render under `white-space: pre` — they must be stripped or every line offset
  drifts. Read the doc before touching `lib/highlight.ts` or the bar in
  `CodePane`. Runtime verification is still outstanding.

- **SP3 — [Generator produces usable frames](docs/spikes/SP3-generator-frames.md).**
  The yield-based generator model works. Resolved at F1, do not re-open:
  the canonical example is **`target = 21`** on `[2,7,11,15,3,6]` (25 optimized
  frames, every tile touched, five map entries — what S2's "STEP 7 / 24" mock
  was drawn against); `target = 9` is kept only as a test fixture. The `Frame`
  shape is `lib/types.ts`'s plus SP3's `why`. `changed[]` is DERIVED by diffing
  adjacent frames, never hand-written — arrays compare whole, `line`/`vars`/
  `scene` only, and frame 0's is `[]`. SP3 has no route — `app/(SP3)/`
  deliberately contains no `page.tsx`, and the spike files are the record of
  where the shape came from: read them, don't edit them. The live generators
  are `content/problems/two-sum/trace.ts`.

- **F1 — trace pipeline.** Every frame must change the scene. `pnpm test`
  enforces it, and it is why the staging is tile-lights (L5) → beam-forms (L6)
  → beam-fires (L8) rather than SP3's, whose complement frame moved only a
  variable. Two consequences: `TwoSumScene.probe` is the **probed key**, not a
  slot index (a miss has no slot to point at, and F11 has to render the miss),
  and `link`'s second index is a slot index only when `slots` is non-empty —
  in the brute trace it is a second tile index. Frame counts: optimized 25,
  brute 20. Note the counts invert the complexity story at n = 6 (n²/2 only
  overtakes 4n around n ≈ 9), so F13's O(n²)/O(n) readout has to carry that
  message, not the step counter.
