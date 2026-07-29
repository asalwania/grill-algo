# SP4 — Running test cases on paper

**Status:** Resolved, and **shipped** onto every built problem.
**Nothing visual verified** (see "What has NOT been verified").
**Date:** 2026-07-29. Landed on Contains Duplicate first; rolled out to Two
Sum, Valid Anagram, Group Anagrams and Top K the same day, at which point the
recipe moved into [specs/add-a-problem.md](../../specs/add-a-problem.md) §10
and the sheet stopped being optional in practice.

**There is no spike route.** `app/(SP4)/paper-trace/` existed for one session
and was deleted the moment the feature landed, so there is exactly one
implementation. The code is at its real paths:

| file | role |
| --- | --- |
| [lib/types.ts](../../lib/types.ts) | `PaperStroke`, `PaperCase`, `Pen` |
| [content/problems/contains-duplicate/paper.ts](../../content/problems/contains-duplicate/paper.ts) | the problem's authored cases + its generator (one per problem) |
| [content/problems/contains-duplicate/paper.test.ts](../../content/problems/contains-duplicate/paper.test.ts) | what keeps the authored answers honest (one per problem) |
| [components/paper/PaperSheet.tsx](../../components/paper/PaperSheet.tsx) | shared ink — knows how a pen looks, nothing else |
| [components/paper/PaperTraceDialog.tsx](../../components/paper/PaperTraceDialog.tsx) | the trigger and the overlay |
| [lib/content.ts](../../lib/content.ts) | `readPaper` — a problem opts in by having the file |

## Question

Every problem in this app teaches you to watch an algorithm run. None of them
teach you to run one *yourself*, and that is the thing an interview actually
asks for: no console, no test runner, a whiteboard and a pen. People do not
struggle with the algorithm so much as with the mechanics — what do you write
down, in what columns, and how do you know your dry run is right?

Can the existing generator discipline produce a convincing **handwritten** dry
run, and is the frame model the right model for it?

## Verdict

**Yes, and no — a different model is better.** Three findings, in the order
they matter.

### 1. Paper is append-only, so strokes beat frames

`Frame` is a **full state snapshot plus change hints** because the 3D scene has
to seek and reverse-step, and reconstructing a scene by replaying deltas is
where that gets painful.

Paper has no such problem: **ink never disappears.** The model is an ordered
list of `PaperStroke`s, and "step k" means strokes `0..k` are inked. Seek is a
slice. Reverse is a shorter slice. There is no snapshot machinery, no `changed[]`
diff, and no F1-style "every frame must change the scene" rule to enforce —
a stroke that wrote nothing would be a stroke that wrote nothing.

Do not reach for `ArrayMemoryFrame` here. The two models answer different
questions and `PaperStroke` is a quarter of the size.

### 2. `expected` is AUTHORED. That is the point, and the test is what makes it safe

This is the one place in the codebase that deliberately breaks the "never
hand-write an answer" rule, and it must stay broken.

A test case whose expected value came from running the code proves nothing —
it asserts the code equals itself. On paper, the expected column is **your
reading of the question**, produced before and independently of the loop. If
the animation generated that column, it would be teaching the exact habit that
makes hand-testing worthless.

So the arrangement is:

| what | where from |
| --- | --- |
| `CASES[].expected` | hand-authored in `paper.ts`, from the problem statement |
| the table rows | `runOnPaper`, which really runs the algorithm |
| the verdict | the generator's return value, from that same loop |
| **agreement between the two** | [`paper.test.ts`](<../../app/(SP4)/paper-trace/paper.test.ts>) |

The test is doing the interviewer's job — "are you sure?" — and it is why a
wrong authored answer cannot ship. `resultOf` gets its answer by *draining
`runOnPaper`*, not by keeping a second copy of the algorithm, so a row and a
verdict can never drift apart.

The same applies to `reasoning()`: the one-line arguments in step 3 are
authored claims about *why*, which a generator cannot produce without
circularity. The `✓` beside each one is earned by `resultOf`.

### 3. The `seen BEFORE` / `seen AFTER` column split is the entire lesson

One `seen` column is how a hand-run goes wrong. The writer can no longer tell
whether they checked the current number against a set that already contained
it, every subsequent row inherits the error, and the dry run "passes" against a
bug. Two columns make the order of operations impossible to fudge.

`paper.test.ts` pins it: for every case, the current value appears in
`seen BEFORE` **if and only if** that row is the hit. That assertion is the
column split, written as code.

### 4. It is a MODE over the page, not a region within it

The learning view is `lg:h-screen lg:overflow-hidden` on purpose — the scene,
code pane and controls are laid out against the viewport and nothing below the
fold exists. A sheet of paper cannot be appended to that without breaking the
contract every other panel is built on.

So the sheet is a **native `<dialog>`**, opened with `showModal()`, triggered
from the header next to the language selector. `<dialog>` brings the four
things a hand-rolled overlay always gets wrong: the **top layer** (so it clears
the scene's WebGL canvas and the fixed mobile footer with no z-index fight), a
focus trap, Escape-to-close, and `::backdrop`. Escape and backdrop clicks close
the element without going through React, so the element is the source of truth
and React follows its `close` event — not the other way round.

The trigger sits in `ProblemHeader` rather than beside the test-case picker
because paper-vs-screen is a **mode**, like the approach tabs and the language
selector it lines up with — not an action on the selected case. (The picker was
the tempting spot: both show a case list. But the picker's cases are the ones
with frame files, and paper's deliberately are not the same set — see below.)

### 5. A problem opts in by having the file

`lib/content.ts`'s `readPaper` checks for `paper.ts` with `access` and returns
`null` when it is missing; the header renders no button. That is what let the
feature land on one problem and spread to the other four without touching the
route, the header or the loader — but it cuts both ways, and it is now the one
way to ship a problem with no sheet and have nothing complain. `add-a-problem`
§10 closes that by making `paper.ts` part of the recipe rather than an option.

The existence check is `access`, **not** a try/catch round the import. A bare
catch would also swallow a real error inside a `paper.ts` that *does* exist and
report it to the page as "this problem has no paper trace" — the most confusing
possible failure. Absent means absent; broken still throws.

`readPaper` runs the generator during the render, unlike frames, which are
pre-built to JSON by `scripts/build-traces.ts`. That is not an inconsistency:
the route is statically generated, so the render *is* build time, strokes are
cheap, and nothing else consumes them. Frames go to JSON because tests and the
build script both read them.

## Presentation notes

- **The wipe is the pen.** Ink-on is `clipPath: inset(0 100% -20% 0)` →
  `inset(0 -4% -20% 0)` at writing speed. Deliberately not an SVG path trace:
  that means authoring letterforms, and the text here is real selectable text.
- **There is no pen sprite.** A sprite has to be positioned from a measured
  rect and desynchronises the moment a line wraps. The wipe edge already reads
  as the tip. Tried mentally, rejected; do not re-add without solving wrap.
- **Only the freshest stroke animates** (`fresh={i === inked - 1}`). Everything
  above it is dry, so a re-render must not re-write the page.
- **The rules are real.** `--rule: 34px` is the line pitch; every block is
  `line-height: var(--rule)` and every gap a multiple of it, so writing sits
  *on* the rules rather than drifting across them. Change the pitch in one
  place or not at all.
- **The sheet is light on a dark app.** This is the only light surface in the
  project and it does not use the token set for its own colours — paper is
  paper. The chrome around it (controls, header) is all tokens.

## Dependencies

**None added.** Framer Motion, already the DOM motion library per the
architecture rules.

`Caveat` is a `next/font/google` family, not an npm package. It is declared in
the root layout with the other three, but **deliberately not exposed in
`globals.css`'s `@theme`** — there is no `font-hand` utility, so no component
can reach for a handwritten face by accident. `components/paper/` names the CSS
variable directly, which is the only place one belongs.

## What is shared and what is per problem

Exactly the G1 split, applied to a second medium:

| | |
| --- | --- |
| **shared** | `components/paper/` — how ink looks, how a page is ruled, the transport controls. Knows nothing about any problem. |
| **per problem** | `content/problems/<slug>/paper.ts` — the authored case list, the columns, and the loop. All of it problem-specific. |

Note the asymmetry with `ProblemChrome`: chrome holds **functions**, so it must
be attached inside a `"use client"` module. Strokes are **plain JSON**, so they
travel the ordinary route → props path like frames do, and the generator never
enters the browser bundle. `paper.test.ts` pins that with a round-trip through
`JSON.parse(JSON.stringify(...))` — a `Set` or a function slipped into a stroke
would otherwise fail the build with an unhelpful message far from its cause.

Four of the seven cases are the same arrays as `cases.json`, on purpose: paper
and screen should dry-run the same inputs. **The other three are the ones the
3D view structurally cannot show** — the empty array, the single element, the
negatives — because a scene needs tiles to light up and those have almost none.
On paper they cost nothing, and they are exactly what interviews probe. That
asymmetry is the argument for the feature existing next to the canvas at all,
and `paper.test.ts` asserts both halves of it: every shipped case appears, and
so do the three that cannot.

Every problem repeats the 4 + 3 shape with its own three. Two Sum adds equal
values, negatives and the two-element minimum; Valid Anagram adds two empty
strings, a one-letter pair and *same letter set, wrong counts*; Group Anagrams
adds the empty list, the empty string as a word and two identical words; Top K
adds a single element, negatives and a genuine tie.

### What the rollout changed in the shared ink

Contains Duplicate's five columns were hardcoded into `PaperSheet`'s `Row` and
its 5-track grid. Generalising cost about ten lines and no new concept:

- the `grid` stroke gained an optional **`widths`** — CSS grid tracks, one per
  column, authored per problem in `fr` so a table survives a phone. Absent, the
  columns share the width equally, which is a usable default at any count.
- `templatesFor` walks the sheet once and rules each `row` with the **nearest
  preceding `grid`**. That is what lets Top K draw **two** tables — count every
  value, then read the buckets back down the frequency axis — from a component
  that still knows nothing about either. Its `runOnPaper` simply yields the
  second `grid` mid-run.

One table remains the default. A second is earned only when a problem is
genuinely two passes that teach different things.

## Open: one approach, not three

Every `paper.ts` traces the **optimized** approach only. Four of the five
problems ship three approaches, and the header's approach tabs do not change
what the sheet shows — a real inconsistency, not an oversight to rediscover.
The rollout did not close it and deliberately did not try.

It is deferred rather than done because the sorted approach is the interesting
case and it does not fit the same table: its work happens in a sort that a
hand-run cannot honestly show step by step (the same trap F1 hit, where the
sorted trace is the *shortest* of the three). Doing this properly means a
per-approach `runOnPaper` and a per-approach column set, and probably a
different answer for `sorted` about what a row even is.

## What has NOT been verified

- **Anything visual.** `pnpm test` is green (1233 after the rollout, of which
  ~120 are this feature's across five problems), `tsc --noEmit` is clean and
  `next build` statically generates all five pages — but no sheet has been
  looked at in a browser. Specifically unchecked: whether the writing lands on
  the ruled lines at `--rule: 34px`, whether the wipe reads as a pen or as a
  wipe, and — now more pressing — whether **six** columns (Two Sum) fit before
  `truncate` starts eating cells, and whether Group Anagrams' long partition
  strings wrap sanely in the case list.
- **The dialog's behaviour.** `showModal()`, the focus trap, Escape, the
  backdrop click, and whether the overlay really does clear the R3F canvas and
  the fixed mobile footer — all reasoned about, none observed.
- **`prefers-reduced-motion`.** The branch exists (strokes appear without the
  wipe) and has not been exercised.
- **Mobile.** The case rows collapse to two columns below `sm`, dropping the
  `→ expected` pair. The table does not collapse at all, and now that widths
  are `fr` rather than pixels it will be tight rather than overflowing — which
  is the better failure but is still unobserved.
- **Bundle cost.** `PaperSheet` is imported eagerly by `ProblemHeader`. Every
  problem now has a sheet, so nobody pays for nothing any more — but the
  strokes themselves are inlined into each page's payload, and Group Anagrams'
  and Top K's are the largest. `next/dynamic` on the dialog body is still the
  obvious fix and is still not done.
