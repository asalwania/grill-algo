<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

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
