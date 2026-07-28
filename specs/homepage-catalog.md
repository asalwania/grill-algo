# Homepage + Catalog — settled decisions

Companion to `specs/main.md`. That file deliberately parked the homepage
("Still open, deliberately — 40–60 hours and it serves nobody until there's
something to scroll toward"). This file is the record of the session that
un-parked it, and of the decisions taken so a later session doesn't re-open
them.

Scope: two new routes. `/problems/[slug]` is untouched.

- `/` — cinematic scroll homepage.
- `/problems` — the NeetCode 150 catalog (S4's design, extended to 150 rows).

---

## Decisions

| Decision | Resolution |
| --- | --- |
| Homepage vs. index | **Two routes.** A GSAP-style pinned timeline and a 150-row browsable grid want opposite things; S4's own nav already implied a separate Problems destination. |
| Catalog source | One typed `content/catalog.ts`. TS, not JSON, so a bad category is a compile error. |
| `status` | **Derived** from `getProblemSlugs()`. Never authored. |
| LeetCode URL | **Derived** from `slug`, with an optional `leetcodeSlug` override. |
| Field ownership | Catalog owns number/title/difficulty/category. `meta.ts` owns pattern/blurb — the facts that only exist once a problem is built. |
| Card content | `soon` cards carry no blurb. Only `ready` cards do. The built problem should visibly be the richest thing on the page. |
| Diagrams | 18 — one per category, not 150. The design brief said the diagram hints at the *data structure*, which is a category-level fact. |
| Pills | `difficulty` + `pattern ?? category`. |
| `soon` card click | **Inert.** `aria-disabled`, no hover glow. A small `Solve on LeetCode ↗` is the only interactive element. Rejected: whole-card LeetCode links, which turn 149 of 150 cards into outbound traffic. |
| Card linking | Stretched-link pattern — the title is the `<Link>`, a pseudo-element covers the card, the LeetCode anchor sits above on the z-axis. Nested `<a>` is invalid HTML and breaks keyboard nav. |
| `/problems` layout | 18 stacked category sections in NeetCode order + sticky category rail. Rejected: one flat filterable grid, which discards the curriculum ordering — the only structure the list has. |
| "Available now" | Pinned section above all 18. Two Sum appears twice: featured, and in its real Arrays & Hashing slot. With 149 cards greyed out, the one usable thing must not be 2000px down. |
| Virtualization | None. `content-visibility: auto` per section instead — one CSS line vs. a windowing library. |
| Homepage beat 3 renderer | **DOM `FlatView`**, not R3F. Keeps `three` off the landing page entirely. |
| Motion library | **Framer Motion. No GSAP, no new dependency.** `position: sticky` pins; `useScroll` scrubs. `AGENTS.md` reserves GSAP for the homepage — it permits, it doesn't require. |
| Scroll → step | Continuous progress stays in a `MotionValue`; `setStep` fires only when the *rounded* index changes. Same discipline `AGENTS.md` enforces on the player. |
| Nav | `Problems` only. `Patterns` and `About` dropped — `/patterns` would pre-decide the twelve-pattern positioning `main.md` lists as still open. |
| Catalog accuracy | Structural vitest (gates `pnpm test`) + best-effort `pnpm verify:catalog` (not in CI). |

## Homepage storyboard

1. **Hero** — S4's serif headline *"Watch algorithms think."*, muted subtitle, CTA into `/problems`.
2. **Premise** — memorising vs. seeing it run.
3. **Demonstration** — scroll drives the frame index over `frames.sample.optimized.json`. Tiles light, the map fills, the beam fires, the answer lands. Nothing hand-animated. This beat is the entire argument for a cinematic homepage, and it is nearly free: `AGENTS.md`'s frames are full state snapshots, so "scroll position → step index" is the same trivial seek the player already does.
4. **Pillars** — 3D execution, 4 languages, brute vs. optimized, scrub and reverse.
5. **Close** — "150 problems. One built properly so far." → `/problems`.

Reduced motion: beat 3 becomes a static block on one representative frame,
reveals become instant.

## Build order

1. **Catalog data + types** — provable by `pnpm test`, no UI.
2. **`/problems`** — independently shippable.
3. **`/` cinematic**.
4. **Shared chrome** — nav/footer layout, `generateMetadata`, progress tracker.

Slice 2 before 3 so that if the cinematic disappoints, a working catalog has
already shipped.

## Known open risk

A plausible-but-wrong number↔title pairing in the 150 survives both the test
and the verify script — both halves exist on LeetCode, they just don't belong
together. Only a human reading `content/catalog.ts` catches that.
