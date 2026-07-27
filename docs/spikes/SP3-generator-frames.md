# SP3 — Does a yield-based generator produce frames worth watching?

**Status:** Resolved, with one product decision handed upward. **Date:** 2026-07-27.
**Spike code:** [app/(SP3)/two-sum-frames/](<../../app/(SP3)/two-sum-frames/>)

SP3 is the first spike with **no route**. `(SP3)` is still a route group for
consistency with SP1/SP2, but the folder contains no `page.tsx` — the spike is a
generator, a Node runner and a test. A route group with no routes generates no
URLs and is harmless. Do not add a page to "fix" it.

```
app/(SP3)/two-sum-frames/
  trace.ts          the generator, the Frame type, the canonical listing
  build-frames.mts  Node runner; writes frames.json and prints frames 0/5/last
  trace.test.ts     vitest (see "vitest is not installed")
  frames.json       generated output, committed so it can be diffed
```

## Question

The architecture says frames are generated at build time by a generator that
actually computes the answer, and that each frame is a full state snapshot plus
change hints. Both are cheap to assert and expensive to discover wrong. Does the
model hold up, and — the part that actually matters — **does the resulting
narration read like something a person would want to watch?**

## Verdict

**The mechanism is fine. The chosen example is not.**

A `function*` that solves Two Sum and yields a snapshot at each meaningful point
works exactly as hoped: the frames fall out of a real run, the answer is computed
rather than asserted, and every frame stands alone so seek and reverse-step are
an index change. Nine frames for the canonical input, no awkwardness anywhere in
the pipeline.

The failure is upstream of the code. See finding 1.

## The canonical listing

Every frame's `line` is a 1-based index into this listing, and nothing else.
Per-language listings map onto it via `Solution.lineMap` (F14). This listing is
exported as `TRACE_LISTING` so tests can bound-check `line` against it.

```js
 1  function twoSum(nums, target) {
 2    const seen = new Map()
 3
 4    for (let i = 0; i < nums.length; i++) {
 5      const num = nums[i]
 6      const complement = target - num
 7
 8      if (seen.has(complement)) {
 9        return [seen.get(complement), i]
10      }
11
12      seen.set(num, i)
13    }
14
15    return []
16  }
```

Frames are emitted at lines 2 (init), 5 (read), 6 (complement), 8 (probe),
9 (return), 12 (store) and 15 (exhausted). Lines 1, 3, 4, 7, 10, 11, 13, 14 and
16 are never an active line — that is deliberate, not an omission. Structural
lines have no state change to narrate.

---

## Finding 1 — the canonical example is too weak, and it hides the product

`nums = [2, 7, 11, 15, 3, 6]`, `target = 9` is solved at `i = 1`. The map never
holds more than one entry. Four of the six tiles stay `idle` for the entire
trace. There is exactly one lookup miss.

Measured on the same array:

| target | frames | map entries at end | tiles touched | result |
| ------ | ------ | ------------------ | ------------- | ------ |
| 9      | 9      | 1                  | 2 / 6         | `[0,1]` |
| 18     | 13     | 2                  | 3 / 6         | `[1,2]` |
| **21** | **25** | **5**              | **6 / 6**     | `[3,5]` |
| 100    | 26     | 6                  | 6 / 6         | none   |

The features queued behind this have nothing to render at target 9. The hash-map
wall (F10) is one slot tall. The lookup beam (F11) misses once and lands once, so
"the beam passes through the gap and dissipates" is a one-off rather than the
rhythm of the piece. The camera choreography (F12) has no distance to travel.

Note also that the design mocks already assume a richer trace: S2 specifies a
step counter reading `STEP 7 / 24` and narration `11's complement is -2`. **That
trace does not exist for target 9.** `target = 21` produces 25 frames and fills
every slot — it is almost exactly what was designed against.

**Recommendation:** change the canonical example to `target = 21` before F8–F11
are built. This is a content decision, not a spike decision, so it is left open —
but building the 3D scene against a trace where the wall is one slot tall is the
expensive version of this mistake.

Keep `target = 9` as a test fixture. It is a good edge case precisely because it
terminates early.

## Finding 2 — `changed[]` is derived, never authored

`changed` is computed by diffing the previous frame against the next inside the
generator's `emit()` closure. Hand-listing it would drift the moment a frame gains
a variable.

Three rules, all of which have consequences if changed:

1. **Only `line`, `variables` and `scene` are diffed.** `narration` and `why`
   change on every single frame, so flagging them carries no signal at all.
2. **Arrays are compared whole, not per index.** `scene.array.states` is one hint,
   not six. The scene retargets every tile's damped colour on any change anyway,
   so per-index paths would be noise. Same for `scene.map.entries` and
   `scene.result`.
3. **Frame 0's `changed` is `[]`.** There is no previous frame to flash against.
   Consumers must not assume `changed` is non-empty.

Disappearances are changes too. Frame 5 reports `variables.complement` as changed
because it existed on frame 4 and is *gone* — that is exactly the case F6's
`AnimatePresence` fade-out needs, and the diff catches it without special-casing.

`changed` is a **hint for what to animate**, never load-bearing for
reconstructing state. Every frame is complete on its own.

## Finding 3 — `variables` cannot hold a boolean

The SP3 type is `Record<string, string | number>`, so the lookup outcome had to be
encoded as `found: 'yes' | 'no'`. That is a string pretending to be a boolean, and
the variables panel (F6) would have to string-match to style it.

[lib/types.ts](../../lib/types.ts) already widened this to
`string | number | boolean | null` on `vars`. **That version is correct — adopt
it.** Do not carry SP3's narrower type forward.

## Finding 4 — the SP3 Frame and `lib/types.ts` have genuinely diverged

SP3 was written to the shape in `specs/main.md`. `lib/types.ts` was written later
(P3) and evolved. They are not compatible, and neither is strictly better.

| | SP3 `Frame` | `lib/types.ts` `Frame<TScene>` |
| --- | --- | --- |
| variables key | `variables` | `vars` |
| variable values | `string \| number` | `string \| number \| boolean \| null` |
| `why` (the disclosure text) | present | **absent** |
| narration category | — | `kind: 'init' \| 'compare' \| 'store' \| 'match' \| 'return'` |
| scene | inline `{ array, map, target, result? }` | generic `TScene`, with `TwoSumScene` |
| array element state | `array.states: ArrayState[]` | `tiles: TileState[]` + `cursor: number \| null` |
| map | `map.entries` + optional `probeKey` | `slots: {key,value,state}[]` + `probe: number \| null` |
| slot state | — | `SlotState: 'empty'\|'filled'\|'probed'\|'hit'` |
| beam | — | `link: [tileIndex, slotIndex] \| null` |

`lib/types.ts` is closer to what the 3D work actually needs. `cursor` and `link`
are things F11's beam wants to read directly, and `SlotState` distinguishes
`probed` from `hit`, which SP3's flat `probeKey` cannot express. Conversely SP3
carries `why`, which F6 requires and `lib/types.ts` dropped.

**Resolve this at F1**, when the generator is promoted into
`content/problems/two-sum/trace.ts`. The likely answer is `lib/types.ts`'s
structure plus SP3's `why`. Do not reconcile it by editing the spike — the spike
is the record of where the shape came from.

---

## Toolchain notes

- **Node runs the TypeScript directly.** Node 24.15.0 strips types natively; no
  `tsx`, no `ts-node`, no build step. The runner is `.mts` so it is unambiguously
  ESM (package.json has no `"type": "module"`).
- **`allowImportingTsExtensions: true` was added to tsconfig.json.** Native type
  stripping requires relative ESM imports to carry the real on-disk extension
  (`./trace.ts`), which TypeScript rejects without this flag. It is legal
  alongside `noEmit: true` and invisible to Next, which uses its own bundler.
  Do not remove it — `scripts/build-traces.ts` (F1) will need the same thing.
- **Expect a `MODULE_TYPELESS_PACKAGE_JSON` warning** on every run. Cosmetic.
  Adding `"type": "module"` to package.json silences it, but that is a
  project-wide change with opinions attached; left alone deliberately.
- **Windows shells and the route-group parens.** `node "app/(SP3)/..."` can trip
  shell parsing. `node app/*/two-sum-frames/build-frames.mts` works everywhere.

## vitest is not installed

`trace.test.ts` is written and correct, but **vitest is not a dependency yet** —
AGENTS.md requires asking before adding one. `npx tsc --noEmit` is clean apart
from `Cannot find module 'vitest'`, which is that and nothing else.

To run it: `pnpm add -D vitest`.

All four test assertions were verified in the meantime by running them through
`node:assert/strict`, so they are known to pass, not merely known to compile:

- the last frame's `result` is `[0, 1]`, `i < j`, and `nums[i] + nums[j] === target`
- `scene.array.states.length === scene.array.values.length` in **every** frame
- a target with no pair ends with `result` undefined
- every frame's `line` is within the bounds of `TRACE_LISTING`

## How to re-run

```sh
node app/*/two-sum-frames/build-frames.mts
```

Writes `frames.json` and prints the full narration list plus frames 0, 5 and the
final frame. The narration list is the point — if it stops reading like something
worth watching, that is the product failing, and this is the cheap place to catch
it.
