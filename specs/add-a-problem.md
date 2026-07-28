# Add a Problem — mechanical recipe

**How to use this file:** give an agent this file plus a problem name from
`content/catalog.ts`. Everything needed is here. Do not read Two Sum or
Contains Duplicate first — they are the same thing twice, and this file is
their common shape. Read `AGENTS.md` only if you think you need to break a
rule below.

**What you write:** 9 files in `content/problems/<slug>/`, plus 2 one-line
edits outside it. **What you do NOT write:** anything 3D, anything 2D, any
player, any layout, any highlighting. The learning view is SHARED and already
built. A problem is *data plus labels*, nothing else.

---

## 0. Resolve the problem (2 minutes, do not skip)

Find the row in [content/catalog.ts](../content/catalog.ts). Copy `slug`,
`number`, `title`, `difficulty` **verbatim** — the catalog is the source of
truth and a mismatch is a bug.

Do NOT edit `content/catalog.ts`. The card flips from `SOON` to `ready`
automatically the moment `content/problems/<slug>/` exists.

Then decide two things:

**A. Which approaches ship.** Only three names exist —
`'optimized' | 'sorted' | 'brute'`. Do not invent a fourth (that means editing
a union, three label maps and the build script). Order is **best first**:
`['optimized', 'sorted', 'brute']`.

Ship `sorted` **only if sorting does not destroy required output.** Contains
Duplicate returns a boolean, so it may sort. Two Sum must return original
indices, so it may not — it ships `['optimized', 'brute']`. When in doubt,
ship two.

**B. Whether the optimized approach uses a memory structure** (hash map / hash
set). If yes it fills `scene.slots` and the 3D memory wall rises on its own. If
no, `slots` stays `[]` and the wall stays sunk. Nothing to configure either way.

---

## 1. The one type you must understand

Every frame is a **full state snapshot** (`lib/types.ts`). The generator below
emits them; `createEmitter` fills in `step` and `changed` by diffing. **Never
hand-write a frame or a `changed[]`.**

```ts
type ArrayMemoryScene = {
  nums: number[]              // the array ON THIS FRAME (a sort reorders it mid-run)
  target?: number             // the problem's scalar input, if it has one. Omit otherwise.
  labels?: string[]           // display text per element, when nums holds codes not values
  tiles: TileState[]          // 'idle' | 'active' | 'done' | 'match', one per element
  cursor: number | null       // index under the beam
  slots: { key: number; value: number; state: SlotState; keyLabel?: string }[]
                              // SlotState = 'empty' | 'filled' | 'probed' | 'hit'
  probe: number | null        // the KEY being looked up. NOT a slot index.
  link: [number, number] | null
  result: [number, number] | null
}
```

Four rules that are enforced by tests and will fail your build if broken:

1. **Every frame must change `scene`.** A frame identical to its predecessor is
   a wasted step. Move a tile state, the cursor, or a slot — not just a var.
2. **`nums.length` is constant across a trace.** Reorder freely; never push/pop.
3. **No two slots may share a `key`.** Both renderers use it as a React key.
   (Automatic if the trace returns on the first hit.)
4. **`frame.line` must point at a real, non-blank line** of that approach's
   canonical listing.

`probe` is the probed KEY, not a slot index — a miss has no slot to point at,
and rendering the miss is the whole point. `link`'s second index is a slot index
**only when `slots` is non-empty**; when `slots` is empty it is a second tile
index (tile-to-tile comparison beam).

---

## 2. Files to create

```
content/problems/<slug>/
  meta.ts             catalog facts + a blurb
  trace.ts            THE FILE THAT MATTERS — listings, cases, generators
  trace.test.ts       copy the template, change 3 lines
  chrome.ts           labels + formatters
  ProblemBrief.tsx    plain-words statement + the case picker
  ProblemView.tsx     4-line wrapper (copy verbatim, change 2 names)
  content.mdx         create EMPTY. The loader reads it; a missing file throws.
  solutions/index.ts       4 languages x N approaches + lineMaps
  solutions/index.test.ts  5 lines, copy verbatim
```

Generated for you by `pnpm traces` — never author these:
`cases.json`, `approaches.json`, `frames.<case>.<approach>.json`.

**Import-path rule, and it is load-bearing:** in `trace.ts` ONLY, relative
imports carry the `.ts` extension (Node executes that file directly during the
build, with type-stripping). Everywhere else, no extension. `.tsx` files use the
`@/` alias; `.ts` files under `content/` use relative paths.

---

## 3. `meta.ts`

```ts
import type { ProblemMeta } from '../../../lib/types'

export const meta: ProblemMeta = {
  slug: '<slug>',            // exactly as in content/catalog.ts
  number: 0,                 // ditto
  title: '<Title>',          // ditto
  difficulty: 'Easy',        // ditto
  pattern: 'Hash Map',       // short pattern name, shown as a pill
  blurb: 'One formal sentence stating the problem. Ends up in <meta description>.',
}
```

---

## 4. `trace.ts` — the only file requiring thought

Structure, in order: `EXAMPLE_NUMS` → `TEST_CASES` → one `*_LISTING` per
approach → one `*_LINE` map per approach → one generator per approach →
`traces` export.

### 4a. Test cases — ship exactly four, ids fixed

```ts
export const EXAMPLE_NUMS = [/* the headline input */]

export const TEST_CASES: TestCase[] = [
  { id: 'sample',      label: 'The walkthrough',   nums: EXAMPLE_NUMS, note: 'One line on what this shows.' },
  { id: 'first-pair',  label: 'Answer straight away', nums: [/* … */], note: '…' },
  { id: 'late-answer', label: 'Answer at the end',    nums: [/* … */], note: '…' },
  { id: 'no-answer',   label: 'No answer at all',     nums: [/* … */], note: '…' },
]
```

Add `target: n` to each case **only** if the problem has a scalar input.
The first case is the default selection.

Constraints on the inputs you pick:

- **`no-answer` is mandatory.** It is the only case that reaches each listing's
  final `return`, and without it those lines and their `lineMap` entries are
  dead — which the solution-coverage test will not catch, but a reviewer will.
- **If you ship `sorted`: no case may already be in sorted order.** The sort is
  one frame; sorting an already-sorted array reorders nothing and reads as a
  dead step. (It would still pass the scene-identity check, because the frame
  also moves the cursor. That is exactly why it needs its own assertion.)
- Pick `sample` so every approach has a story: memory fills up, brute force
  grinds several passes, the answer is not immediate.

### 4b. Listings

One canonical JavaScript listing per approach, as a `.join('\n')` array with a
line number in a trailing comment on every line. Every `frame.line` is a 1-based
index into it.

```ts
export const OPTIMIZED_LISTING = [
  'function solve(nums) {',        //  1
  '  const seen = new Map()',      //  2
  '',                              //  3
  '  for (let i = 0; i < nums.length; i++) {', // 4
  //  …
].join('\n')

const OPTIMIZED_LINE = { init: 2, read: 4, probe: 5, found: 6, store: 9, exhausted: 12 } as const
```

Name the line constants after *steps*, not numbers. Structural lines (`}`,
blanks, loop closers) are never active lines.

### 4c. Generator — copy this shape exactly

```ts
import { createEmitter } from '../../../lib/frames.ts'
import type {
  ArrayMemoryFrame, ArrayMemoryScene, ProblemTraces, SlotState, TestCase, TileState,
} from '../../../lib/types.ts'

export function* solveOptimized(nums: number[]): Generator<ArrayMemoryFrame, void, undefined> {
  const tiles: TileState[] = nums.map(() => 'idle')
  const slots: { key: number; value: number; state: SlotState }[] = []
  let cursor: number | null = null
  let probe: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let lookups = 0

  // MUST return a fresh deep copy every call. A frame sharing mutable state
  // with the generator is not a snapshot, and seek/reverse-step break.
  const emit = createEmitter<ArrayMemoryScene>(() => ({
    nums: [...nums],
    tiles: [...tiles],
    cursor,
    slots: slots.map((s) => ({ ...s })),
    probe,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ n: nums.length, lookups })

  yield emit(OPTIMIZED_LINE.init, 'init', 'Narration.', 'Why this step matters.', base())

  for (let i = 0; i < nums.length; i++) {
    cursor = i                      // beat 1: the tile lights up
    tiles[i] = 'active'
    yield emit(OPTIMIZED_LINE.read, 'compare', `…`, `…`, { ...base(), i })

    probe = nums[i]                 // beat 2: the question forms
    const hit = slots.findIndex((s) => s.key === probe)
    lookups++
    yield emit(OPTIMIZED_LINE.probe, 'compare', `…`, `…`, { ...base(), i, found: hit !== -1 })

    if (hit === -1) {
      slots.push({ key: nums[i], value: i, state: 'filled' })
      tiles[i] = 'done'
      yield emit(OPTIMIZED_LINE.store, 'store', `…`, `…`, { ...base(), i })
      continue
    }

    slots[hit].state = 'hit'        // beat 3: it fires
    tiles[slots[hit].value] = 'match'
    tiles[i] = 'match'
    link = [i, hit]
    result = [slots[hit].value, i]
    yield emit(OPTIMIZED_LINE.found, 'return', `…`, `…`, { ...base(), i, result: '…' })
    return
  }

  cursor = null; probe = null; link = null
  for (let k = 0; k < tiles.length; k++) tiles[k] = 'done'
  yield emit(OPTIMIZED_LINE.exhausted, 'return', '…', '…', { ...base(), result: '…' })
}
```

`emit(line, kind, narration, why, vars)`. `kind` is
`'init' | 'compare' | 'store' | 'match' | 'return'` and colours the narration
label. `vars` values are `string | number | boolean | null` — pre-stringify
anything where formatting matters (`'{ 4, 1, 9 }'`, `'[1, 3, 4]'`).

**The three-beat rule.** Never collapse "tile lights up" / "the question forms"
/ "it fires" into one frame, and never split a beat into two frames that render
identically. That staging is what guarantees rule 1 of §1.

**Brute force / sort-and-scan generators** are the same shape with
`slots: []` and `probe: null` on every frame, and `link = [i, j]` tile-to-tile.
A `sorted` generator copies the input (`const nums = [...input]` — never mutate
the caller's array), then spends **one frame** on the sort itself: reorder
`nums`, light tile 0, set the cursor. Do not animate the sort; that is its own
problem, with its own page.

### 4d. Export

```ts
export const traceOptimized = (nums: number[]): ArrayMemoryFrame[] => [...solveOptimized(nums)]
// … one per approach

const APPROACHES = ['optimized', 'sorted', 'brute'] as const   // best first; drop any you don't ship

export const traces: ProblemTraces<ArrayMemoryScene, (typeof APPROACHES)[number]> = {
  example: `nums = [${EXAMPLE_NUMS.join(', ')}]`,   // + ` , target = N` if there is one
  approaches: APPROACHES,
  listings: { optimized: OPTIMIZED_LISTING, sorted: SORTED_LISTING, brute: BRUTE_LISTING },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(input.nums),   // + input.target if used
    sorted: (input) => traceSorted(input.nums),
    brute: (input) => traceBrute(input.nums),
  },
}
```

---

## 5. `chrome.ts` — the problem's identity

```ts
import type { ProblemChrome } from "@/components/problem";

export const <SLUG>_CHROME: ProblemChrome = {
  complexity: {
    optimized: { time: "O(n)", space: "O(n)" },
    sorted: { time: "O(n log n)", space: "O(1)" },
    brute: { time: "O(n²)", space: "O(1)" },
  },

  // Heading over the memory structure in the flat view.
  memoryLabel: "SEEN — value → index",

  // The lookup pill. Takes the probed KEY, never a slot index.
  formatProbe: (probe, hit) => (hit ? `${probe} found` : `${probe} not seen`),

  // Opposite the ARRAY heading. Return null for an array-only problem.
  formatArrayCaption: (scene) =>
    scene.target === undefined ? null : { label: "target", value: String(scene.target) },

  // The answer AS THE PROBLEM STATES IT, from the pair that decided it.
  // null is the not-found case.
  formatAnswer: (result) => (result === null ? "[]" : `[${result[0]}, ${result[1]}]`),

  // One line naming a case's input, for the picker card.
  formatCaseInput: (nums, target) =>
    `nums = [${nums.join(", ")}]` + (target === undefined ? "" : ` · target = ${target}`),
};
```

`formatAnswer` is where a boolean problem converts back: `result === null ? "false" : "true"`.

---

## 6. `ProblemView.tsx` — copy verbatim, change two names

```tsx
"use client";

import { ArrayMemoryProblemView, type ArrayMemoryProblemViewProps } from "@/components/problem";
import { ProblemBrief } from "./ProblemBrief";
import { <SLUG>_CHROME } from "./chrome";

export function ProblemView(props: Omit<ArrayMemoryProblemViewProps, "chrome" | "brief">) {
  return <ArrayMemoryProblemView {...props} chrome={<SLUG>_CHROME} brief={ProblemBrief} />;
}
```

**`"use client"` is mandatory.** `ProblemChrome` holds functions, which cannot
cross the RSC boundary. Passing it from a Server Component fails the **build**,
not lint.

---

## 7. `ProblemBrief.tsx`

```tsx
"use client";

import type { ReactNode } from "react";
import { TestCasePicker } from "@/components/player";
import type { ProblemBriefProps } from "@/components/problem";

const RULES = [
  "Three short constraints, in plain words.",
  "No jargon. No 'you may assume'.",
  "Say what the answer looks like.",
];

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="font-mono text-mono-13 tracking-label-wide text-text-muted">
      {children}
    </div>
  );
}

export function ProblemBrief({ cases, answers, found, chrome, className = "", style }: ProblemBriefProps) {
  return (
    <section className={`flex flex-col gap-16 border-t border-border-hairline ${className}`} style={style}>
      <div className="flex flex-col gap-10">
        <SectionLabel>THE QUESTION</SectionLabel>
        <p className="font-sans text-narration text-text-primary">
          The problem in one sentence a beginner understands.
        </p>
        <p className="font-sans text-narration-sm text-text-muted">
          One paragraph on why the optimized approach is the interesting one.
        </p>
        <ul className="flex list-none flex-col gap-8">
          {RULES.map((rule) => (
            <li key={rule} className="flex gap-8 font-sans text-narration-sm text-text-muted">
              <span aria-hidden className="text-signal-cyan">·</span>
              {rule}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-10">
        <SectionLabel>TRY IT ON — pick an input, then press play</SectionLabel>
        <TestCasePicker cases={cases} answers={answers} found={found} formatInput={chrome.formatCaseInput} />
      </div>
    </section>
  );
}
```

The prose is deliberately **not** the LeetCode statement — `meta.blurb` already
carries the formal one-liner in the header. Do not put long-form content here;
that is `content.mdx`'s job (not yet rendered).

---

## 8. `solutions/index.ts`

Four languages × every approach you ship. JavaScript is the canonical listing
itself, imported from `../trace`, with an identity `lineMap`.

```ts
import type { Approach, Language, Solution } from '../../../../lib/types'
import { BRUTE_LISTING, OPTIMIZED_LISTING, SORTED_LISTING } from '../trace'

// javascript — identity map: every canonical active line maps to itself.
const JAVASCRIPT_OPTIMIZED_LINE_MAP: Record<number, number> = { 2: 2, 4: 4, 5: 5, 6: 6, 9: 9, 12: 12 }

const PYTHON_OPTIMIZED_LISTING = [
  'def solve(nums):',      //  1
  '    seen = {}',         //  2
  // …
].join('\n')
const PYTHON_OPTIMIZED_LINE_MAP: Record<number, number> = { 2: 2, /* … */ }

// … java, go, and the same trio for each other approach

const OPTIMIZED: Record<Language, Solution> = {
  javascript: { language: 'javascript', code: OPTIMIZED_LISTING, lineMap: JAVASCRIPT_OPTIMIZED_LINE_MAP },
  python:     { language: 'python',     code: PYTHON_OPTIMIZED_LISTING, lineMap: PYTHON_OPTIMIZED_LINE_MAP },
  java:       { language: 'java',       code: JAVA_OPTIMIZED_LISTING,   lineMap: JAVA_OPTIMIZED_LINE_MAP },
  go:         { language: 'go',         code: GO_OPTIMIZED_LISTING,     lineMap: GO_OPTIMIZED_LINE_MAP },
}

const LANGUAGES: Language[] = ['javascript', 'python', 'java', 'go']

export const solutions: Partial<Record<Approach, Solution[]>> = {
  optimized: LANGUAGES.map((l) => OPTIMIZED[l]),
  sorted: LANGUAGES.map((l) => SORTED[l]),
  brute: LANGUAGES.map((l) => BRUTE[l]),
}
```

**`lineMap` rules.** Key = canonical trace line, value = line in *that language's*
listing performing the same step. It is not required to be 1:1 — where one
language needs two lines for what canonical does in one (Go's `sort.Ints` sorts
in place, so it needs a separate copy line), point the canonical key at whichever
line performs *the step the frame is about*. Every distinct `frame.line` across
**all four cases** needs an entry, for **every** language, and it must land on a
real non-blank line. The coverage test proves all of this — a missing entry does
not throw at runtime, it silently highlights line 1.

`solutions/index.test.ts`, verbatim:

```ts
import { describeSolutionCoverage } from '../../../../lib/solution-coverage'
import { traces } from '../trace'
import { solutions } from './index'

describeSolutionCoverage(traces, solutions)
```

---

## 9. `trace.test.ts`

Copy [contains-duplicate/trace.test.ts](../content/problems/contains-duplicate/trace.test.ts)
and adapt. It must contain, at minimum:

- **A ground-truth check.** Solve the problem a second time, independently and
  trivially (`new Set(nums).size !== nums.length`), and assert the trace agrees.
- **All approaches agree with each other** — on the ANSWER, not on the index
  pair. Approaches legitimately disagree about the pair: `sorted` reports
  positions in the sorted array.
- Per approach, over every shipped case plus a few edge inputs (empty-ish,
  two elements, single element): every `frame.line` real and non-blank; no two
  consecutive frames scene-identical; `tiles.length === nums.length`;
  `nums.length` invariant; `step` consecutive from 0; `frames[0].changed` is
  `[]` and every later frame's is non-empty.
- **Pinned frame counts** for the headline case, one per approach. These are the
  regression tripwire — write down whatever `pnpm traces` prints.
- If you ship `sorted`: `it.each(TEST_CASES)('$id is not already sorted')`, and
  that the generator never mutates its argument.
- If `slots` are used: no duplicate keys, and every slot's `value` is a real
  index of its key.
- That every listing's terminal `return` line appears among the lines across all
  cases.

---

## 10. Register the route

`app/problems/[slug]/page.tsx` — two lines:

```tsx
import { ProblemView as <Name>View } from "@/content/problems/<slug>/ProblemView";
// …
const VIEWS = {
  "two-sum": TwoSumView,
  "contains-duplicate": ContainsDuplicateView,
  "<slug>": <Name>View,          // ← add
};
```

Nothing else outside `content/problems/<slug>/` changes. Not the catalog, not
the scene, not the player, not the layout.

---

## 11. Build and verify, in this order

```
pnpm traces        # writes cases.json, approaches.json, 4 x N frame files
npx tsc --noEmit
pnpm test
pnpm lint          # design-reference/support.js errors are pre-existing — ignore
pnpm build
```

`pnpm traces` prints a frame count per case per approach. **Read those numbers**
— they go into `trace.test.ts`'s pinned counts, and a surprising one (a
2-frame trace, a 400-frame trace) means the staging is wrong.

`pnpm build` runs `pnpm traces` first via `prebuild`, so a stale frame file
cannot ship.

---

## 12. Log it

Append one row to Phase 7 in [specs/progress-tracker.md](progress-tracker.md):

```
| G<n> | <Title> | Done | YYYY-MM-DD | <owner> | `content/problems/<slug>/`, <n> approaches |
```

Add a full entry below the table **only** if something deviated from this
recipe, or a decision was made a future session shouldn't re-litigate.

---

## Appendix A — string problems (Valid Anagram, palindromes)

The scene is numeric, so store char codes in `nums` and carry the letters in the
optional display fields. Both renderers already fall back correctly when these
are absent.

- `scene.labels?: string[]` — display text per tile. `labels?.[i] ?? nums[i]`.
- `slot.keyLabel?: string` — display text for a slot key.
- `scene.target` for a two-string problem carries the **boundary index**: `s`
  occupies `[0, target)` of `nums`, `t` occupies `[target, nums.length)`.

Everything else is unchanged.

## Appendix B — mistakes that pass review and break at build time

| Symptom | Cause |
| --- | --- |
| `Functions cannot be passed directly to Client Components` | `ProblemView.tsx` missing `"use client"`, or chrome passed from the route |
| `ERR_UNKNOWN_FILE_EXTENSION` / module not found in `pnpm traces` | a relative import in `trace.ts` missing its `.ts` extension |
| Test: *"frame N is scene-identical to frame N-1 — a wasted step"* | two emits with no scene change between them; move a tile or the cursor |
| Active-line bar sits on line 1 forever | a missing `lineMap` entry — it resolves to `undefined`, not an error |
| Build: *"frame N points at line L, which is blank"* | a `*_LINE` constant pointing at a structural or blank line |
| Scene renders `NaN` transforms after switching case | a generator changed `nums.length` mid-trace |
| Duplicate React key warning in the flat view | two slots pushed with the same `key` |
| `Incomplete data for case … / approach …` at render | `approaches.json`, frame files and `solutions/index.ts` disagree — rerun `pnpm traces` |

## Appendix C — things you must not do

- Do not touch `components/scene/`. The canvas reads only tile states and
  indices — it is already problem-agnostic and needs no parameterization ever.
- Do not fork `components/problem/` or `ArrayMemoryProblemView`. The learning
  view is shared.
- Do not render any text, value, index or variable name inside the canvas.
  Every word and number lives in the DOM.
- Do not hand-write frame JSON or a `changed[]` array.
- Do not add a dependency. Ask first.
- Do not edit `content/catalog.ts`.
- Do not put continuous or interpolated values into React state or Context —
  only the discrete step index and boolean flags.
