# SP2 — Shiki active-line bar

**Status:** Approach resolved; runtime check outstanding (see
"What has NOT been verified"). **Date:** 2026-07-27.
**Spike route:** [app/(SP2)/code-highlight/page.tsx](<../../app/(SP2)/code-highlight/page.tsx>)

`(SP2)` is a route group, so the spike lives at `/code-highlight`.

## Question

The code pane highlights at build time with Shiki and ships no highlighting JS.
A bar has to sit behind the code and track the active line as the player steps.
Can that bar be driven by Framer Motion layout animation such that it (a) glides
rather than jumps, (b) stays correct when the container resizes, and (c) leaves
Shiki entirely out of the client bundle?

## Verdict

**Yes, with three specific decisions.** In order of how much time each saves:

1. Gate the layout animation on `layoutDependency={activeLine}`. This is the
   entire answer to the resize requirement — see below.
2. **Measure** line geometry from the DOM. Do not compute it from a row height.
3. Strip the `\n` text nodes Shiki puts between lines, and make each line a
   block box. Without this every measured offset is wrong.

Spike code lives in three files. Only the route is throwaway; the other two were
written at their real paths because the approach is what Phase 3 reuses:

| file | role |
| --- | --- |
| [lib/highlight.ts](../../lib/highlight.ts) | `server-only` Shiki wrapper + the `data-line` transformer |
| [components/panels/CodePane.tsx](../../components/panels/CodePane.tsx) | measurement + the animated bar |
| [app/(SP2)/code-highlight/page.tsx](<../../app/(SP2)/code-highlight/page.tsx>) | throwaway harness |

## 1. `layoutDependency` is the resize answer

A `ResizeObserver` re-measures and re-renders. But Framer Motion takes a layout
snapshot on **every** render by default, so the re-render makes the bar *animate*
from its old box to its corrected one. The bar visibly slides during a resize.
That reads as a bug, and it is the obvious trap here.

`layoutDependency` fixes it. From
`node_modules/framer-motion/dist/es/motion/features/layout/MeasureLayout.mjs:67-72`:

```js
if (drag ||
    prevProps.layoutDependency !== layoutDependency ||
    layoutDependency === undefined ||
    prevProps.isPresent !== isPresent) {
    projection.willUpdate();
}
```

`willUpdate()` is the snapshot. Note the third clause: **`undefined` means measure
every render** — that is the default, and it is why the naive version slides.
Passing `layoutDependency={activeLine}` narrows it to "snapshot only when the
line changed", so:

- line change → snapshot taken → bar glides. ✅
- resize → no snapshot → new `top`/`height` apply immediately, bar snaps to
  correct. ✅

**The prop is missing from `framer-motion`'s own `index.d.ts`** but is public and
typed in `motion-dom`
(`node_modules/.pnpm/motion-dom@12.42.2/.../index.d.ts:935`, `layoutDependency?: any`,
marked `@public` on the `LayoutProps` interface). It typechecks. Do not "clean it
up" because you grepped `framer-motion` and found nothing.

Related: `borderRadius` is set inline in `style`, not via a Tailwind class.
Layout animation scales the box, and Framer Motion can only counteract radius
distortion for a radius it can read off the style object.

## 2. Measure, never compute

Row height is not knowable at build time. Three things move it:

- `next/font` uses `display: swap`, so metrics change *after first paint*. A
  `document.fonts.ready` re-measure is required on top of the `ResizeObserver`.
- a line that wraps is two rows tall.
- the pane has a mobile type ramp (`--text-code-13`, line-height 1.6) distinct
  from desktop (`--text-code-14`, 1.65).

`CodePane` reads `getBoundingClientRect()` per `[data-line]` element and stores
offsets relative to the measuring frame. It observes both the frame (container
resize) and `<code>` (reflow that changes total height without changing the
frame). The `setBoxes` updater bails on an unchanged array — `ResizeObserver`
fires on any observed mutation and re-setting an equal array would spin.

## 3. The newline trap — this is the one that silently corrupts alignment

Shiki 4's `line` hook hands you the 1-based line number directly
(`@shikijs/types/dist/index.d.mts:546`), so `data-line` is trivial. Alignment is
not.

Shiki interleaves a literal `\n` **text node** between consecutive line elements.
`<pre>` has `white-space: pre`, which you must keep — it is what preserves
indentation inside each line. So the newlines render. Make lines `display: block`
and you get a blank row between every line, and every measured offset drifts
further out the further down you go.

Fix: drop the newline text nodes in the `code` hook. The block boxes then supply
the line breaks themselves.

```ts
code(node) {
  node.children = node.children.filter((child) => child.type === 'element')
}
```

**Known cost:** selecting and copying the code yields no line breaks. Accepted
here because AGENTS.md makes the code pane fixed and read-only. If copy fidelity
is ever wanted, the alternative is `display: grid` on `<code>` with the newlines
left in — rejected for now because whitespace-only anonymous grid items are
normally not rendered, but under `white-space: pre` that whitespace is not
ignorable, and relying on which behaviour wins is not worth the risk in the one
place where being off by a row is invisible in review and obvious in production.

**Also:** an empty source line produces an empty block box of zero height, which
collapses the row and shifts everything below it. The transformer pushes a
zero-width space into empty lines.

## 4. "No Shiki on the client" is enforced, not just intended

`lib/highlight.ts` starts with `import 'server-only'`. That is the actual
guarantee — a build error the moment anyone imports it from a client component.
The client receives a `string`.

`createHighlighter` is cached in a module-level promise. Grammar + engine load is
the expensive part; without the cache every page pays it again during the build.

## Versions this was verified against

| package | version |
| --- | --- |
| `shiki` | 4.3.1 |
| `framer-motion` | 12.42.2 |
| `motion-dom` (transitive) | 12.42.2 |
| `react` / `react-dom` | 19.2.4 |
| `next` | 16.2.12 |
| `tailwindcss` | 4.x |

## What has NOT been verified

The classifier that gates command execution was down for the whole session, so
**`tsc`, `next build` and the dev server were never run.** Everything above was
verified by reading the installed packages' source and type declarations, which
covers the API shape and the `layoutDependency` semantics but not the rendered
result.

Outstanding, in the spec's own terms — "the bar glides, survives a window
resize, and your network tab shows no Shiki bundle":

- [ ] `pnpm build` passes
- [ ] bar glides between lines
- [ ] bar stays aligned across a window resize (the `layoutDependency` claim)
- [ ] network tab shows no Shiki chunk
- [ ] line boxes still align after the font swaps in

One thing to look at specifically: the design tokens in `globals.css` delete
Tailwind's default namespaces, so any class in these files that is not backed by
a declared token will fail to compile rather than silently no-op.

## Known limitation

Lines longer than the pane overflow horizontally rather than wrap, and the bar
spans the frame (`left-0 right-0`), not the full scroll width. Fine for a 12-line
snippet; revisit if the real code pane scrolls sideways.

## Re-verify when upgrading

Re-run on any major bump of `framer-motion` or `shiki`. Both load-bearing
findings are implementation details rather than documented contracts: the
`willUpdate()` gating in `MeasureLayout`, and the fact that Shiki emits `\n` text
nodes between line elements. Either can change in a major release without a
release-note line, and both fail *quietly* — the bar drifts or slides, it does
not throw.
