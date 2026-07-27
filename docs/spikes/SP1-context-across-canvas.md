# SP1 — Does React Context cross the `<Canvas>` boundary?

**Status:** Resolved. **Date:** 2026-07-27.
**Spike route:** [app/(SP1)/context-canvas/page.tsx](<../../app/(SP1)/context-canvas/page.tsx>)

`(SP1)` is a route group — parentheses mean it contributes no URL segment, so the
spike lives at `/context-canvas`, not `/SP1/context-canvas`.

## Question

The learning view puts player state in React Context (`useReducer` + two
contexts) in the DOM layer, and renders the scene inside a react-three-fiber
`<Canvas>`. R3F runs its own reconciler, so the scene is **not** in the DOM React
tree. Does a Context provider mounted outside the Canvas reach components
inside it — or do we need a bridge?

## Verdict

**It propagates automatically. Do not add `useContextBridge`.**

Any provider mounted above `<Canvas>` in the DOM tree is visible to components
rendered inside the Canvas, with no wiring. Updates flow too, not just the
mount-time value.

`useContextBridge` is still exported from drei (`@react-three/drei/core/useContextBridge`)
and is not deprecated, but in this stack it is redundant. Adding it means
manually enumerating every context, which will silently drift as we add them.

## Why it works (verified against installed source, not docs)

1. `Canvas` wraps `CanvasImpl` in `FiberProvider` from `its-fine` —
   `node_modules/@react-three/fiber/dist/react-three-fiber.esm.js:158`
2. `useBridge()` delegates to `its-fine`'s `useContextBridge()` —
   `node_modules/@react-three/fiber/dist/events-b389eeca.esm.js:51-59`
3. `its-fine`'s `useContextMap` walks the fiber's `return` chain and collects
   **every** ancestor whose type is `$$typeof === Symbol.for('react.context')`,
   then `useContextBridge` composes them all around the R3F root.
   It is a generic sweep of the ancestor chain, not a whitelist.
4. `CanvasImpl` calls `root.render(<Bridge>{children}</Bridge>)` inside a layout
   effect with **no dependency array**
   (`react-three-fiber.esm.js:102`, deps confirmed absent at `:113-116`),
   so the R3F root re-renders on every `CanvasImpl` render and the bridged
   values are re-read each time.

Step 3 relies on React 19 setting `context.Provider === context`, which is what
makes the `$$typeof` check match a provider fiber. This is version-sensitive —
see "Re-verify when upgrading".

### The one way to break it

Wrapping `<Canvas>` in `React.memo`. If `CanvasImpl` does not re-render, the
layout effect in step 4 never re-runs, so both the `children` element **and**
the bridged context values freeze at their last value. This is a general
"memoizing Canvas freezes the whole subtree" problem, not specific to context.

### Perf consequence worth knowing

The flip side of step 4: by default the entire Canvas subtree re-renders on
**every** render of the component holding `<Canvas>`. This is exactly why
AGENTS.md forbids continuous/interpolated values crossing Context — a value
changing at 60fps would re-render the whole scene graph 60 times a second.
Discrete step index and boolean flags only; interpolate imperatively in
`useFrame`.

## Trap found along the way: silent colour failure

`three@0.185.1`'s `Color.setStyle` parses **only the comma form** of `hsl()` /
`rgb()` — `node_modules/three/src/math/Color.js:350`:

```js
/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/
```

Modern space-separated CSS (`hsl(120 80% 55%)`) does not match. The `case 'hsl'`
then just `break`s and `setStyle` returns unchanged. **There is no warning** —
the `Color: Unknown color model` message only fires in the `default:` branch,
and `hsl` is a recognised model. The material silently keeps its previous colour.

This initially looked like a context-propagation failure. It was not.

- ✅ `hsl(120, 80%, 55%)`, `#4ade80`, `'tomato'`, `0x4ade80`
- ❌ `hsl(120 80% 55%)`, `rgb(74 222 128)`

Any `color={...}` prop fed a string goes through `setStyle`. When a colour is
computed rather than literal, prefer constructing it explicitly so failure is
loud:

```ts
new Color().setHSL(hue / 360, 0.8, 0.55)
```

## Versions this was verified against

| package | version |
| --- | --- |
| `three` | 0.185.1 |
| `@react-three/fiber` | 9.6.1 |
| `@react-three/drei` | 10.7.7 |
| `its-fine` (transitive) | 2.0.0 |
| `react` / `react-dom` | 19.2.4 |
| `next` | 16.2.12 |

## Re-verify when upgrading

Re-run this spike on any major bump of `@react-three/fiber`, `react`, or
`its-fine`. The mechanism depends on React internals (`context.Provider === context`
in React 19) and on the effect in `CanvasImpl` having no dependency array —
both are unversioned implementation details that a major release can change.

The spike route is the test: click the button, confirm the cube's colour
changes. If it stops working, check whether the failure is the bridge or another
silent `setStyle` no-op before concluding anything.
