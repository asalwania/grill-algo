/**
 * Two Sum — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * This file is the problem's paper identity, the way `chrome.ts` is its screen
 * identity. Per-problem here is everything: the authored case list, the columns
 * the table needs, and the loop itself. Shared is the ink — `components/paper/`
 * knows how a pen looks and nothing about pairs summing to a target.
 *
 * ## The trap this sheet exists to catch
 *
 * `need` has to be looked up in `seen` BEFORE `nums[i]` is stored, and the
 * table's column pair is what makes that order impossible to fudge. Get it
 * backwards and `[3, 2, 4]` with target 6 returns `[0, 0]` — one number used
 * twice — which is the single most common wrong answer to this problem and
 * which a hand-run with one merged `seen` column will happily wave through.
 * `paper.test.ts` pins that exact case.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same inputs as `cases.json`, on purpose — the paper
 * view and the animated one should be dry-running the same arrays. **The last
 * three are what the shipped four do not reach**: two equal numbers that ARE
 * the answer, an all-negative array, and the smallest input the problem's own
 * constraints allow. None of them is interesting to watch — they are two or
 * three tiles that light up and stop — and all three are what an interviewer
 * probes for. That asymmetry is the argument for this feature existing
 * alongside the canvas.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs the
 * real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  {
    nums: [2, 7, 11, 15, 3, 6],
    target: 21,
    expected: '[3, 5]',
    tag: 'typical — pair at the end',
    reasoning: 'the tabled one',
  },
  {
    nums: [2, 7, 11, 15],
    target: 9,
    expected: '[0, 1]',
    tag: 'earliest possible hit',
    reasoning: 'i = 1 needs 2, and 2 is already in the map from i = 0',
  },
  {
    nums: [3, 2, 4],
    target: 6,
    expected: '[1, 2]',
    tag: 'must not reuse one number',
    reasoning: 'at i = 0, 3 needs 3 — but nothing is stored yet, so it cannot pair with itself',
  },
  {
    nums: [2, 7, 11],
    target: 100,
    expected: '[]',
    tag: 'no pair at all',
    reasoning: 'every need misses, the loop runs out and falls through to return []',
  },
  {
    nums: [3, 3],
    target: 6,
    expected: '[0, 1]',
    tag: 'equal values, and they are the answer',
    reasoning: 'i = 1 needs 3 and finds the OTHER 3 at index 0 — two elements, not one used twice',
  },
  {
    nums: [-1, -2, -3, -4, -5],
    target: -8,
    expected: '[2, 4]',
    tag: 'negatives and a negative target',
    reasoning: 'subtraction does not care about sign: -8 − (-5) = -3, stored at index 2',
  },
  {
    nums: [1, 2],
    target: 3,
    expected: '[0, 1]',
    tag: 'smallest legal input',
    reasoning: 'two elements is the minimum the constraints allow, and they are the only pair',
  },
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/**
 * The columns, and the whole of what makes the table teachable.
 *
 * `need` gets its own column because it is the quantity the whole method turns
 * on, and because writing it down is what stops the hand from searching the
 * array for a partner. The BEFORE/AFTER split is the order-of-operations guard
 * described in the header — with one merged `seen` column the writer can no
 * longer tell whether they looked up `need` in a map that already contained
 * `nums[i]`, and a dry run that got that backwards "passes" against a real bug.
 */
export const COLUMNS = [
  'i',
  'nums[i]',
  'need',
  'seen BEFORE',
  'need there?',
  'seen AFTER / action',
] as const

/** Grid tracks, one per column. `fr` throughout so the table stays ruled at
 *  the same proportions on a phone as on the full sheet. */
export const WIDTHS = [
  'minmax(0,0.45fr)',
  'minmax(0,0.9fr)',
  'minmax(0,0.9fr)',
  'minmax(0,2.4fr)',
  'minmax(0,1.2fr)',
  'minmax(0,2.4fr)',
]

/** `{ }` when empty, `{ 2→0, 7→1 }` otherwise — value to index, written the
 *  way a hand writes it. */
function penMap(seen: Map<number, number>): string {
  const items = [...seen].map(([value, index]) => `${value}→${index}`)
  return items.length === 0 ? '{ }' : `{ ${items.join(', ')} }`
}

/** `[2, 7, 11]`, and `[ ]` for the empty case so it still reads as a drawn box. */
export function penArray(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

/** How a case is named in the list: the array and the scalar that goes with it. */
export function penInput(c: PaperCase): string {
  return `${penArray(c.nums)}  t=${c.target}`
}

/** `PaperCase.target` is this problem's target. Read through here so a case
 *  that forgot it fails the build loudly instead of silently becoming 0. */
export function targetOf(c: PaperCase): number {
  if (c.target === undefined) throw new Error(`case ${penArray(c.nums)} has no target`)
  return c.target
}

/**
 * The one-pass hash-map solution, running for real, narrating each pass as a
 * table row.
 *
 * The generator's RETURN value is the answer, computed by the same loop that
 * produced the rows — so a row and the verdict can never disagree. This is the
 * only implementation of Two Sum in this file; `resultOf` gets its answer by
 * draining this rather than keeping a second copy that could drift.
 */
export function* runOnPaper(
  nums: number[],
  target: number,
): Generator<PaperStroke, string, void> {
  const seen = new Map<number, number>()

  for (let i = 0; i < nums.length; i++) {
    const value = nums[i]
    const need = target - value
    const before = penMap(seen)
    const at = seen.get(need)

    if (at !== undefined) {
      yield {
        id: `row-${i}`,
        kind: 'row',
        cells: [
          `${i}`,
          `${value}`,
          `${need}`,
          before,
          `YES at ${at}`,
          `return [${at}, ${i}]`,
        ],
        hit: true,
      }
      return `[${at}, ${i}]`
    }

    seen.set(value, i)
    yield {
      id: `row-${i}`,
      kind: 'row',
      cells: [`${i}`, `${value}`, `${need}`, before, 'no', penMap(seen)],
      hit: false,
    }
  }

  return '[]'
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(nums: number[], target: number): string {
  const run = runOnPaper(nums, target)
  let step = run.next()
  while (!step.done) step = run.next()
  return step.value
}

/**
 * The whole sheet, in writing order.
 *
 * Three sections, because the lesson is a three-step HABIT and not a table:
 * list the cases, run exactly one of them properly, then dispose of the rest in
 * a line each. Step 3 is the part people skip and the part that saves the
 * interview — seven tables is twenty minutes nobody has.
 */
export function* writeSheet(): Generator<PaperStroke, void, void> {
  yield {
    id: 'title',
    kind: 'title',
    text: 'Two Sum',
    sub: 'nums: int[], target: int  →  int[2]     ·     the indices of the two numbers that add to target',
  }

  // --- 1. the list ---------------------------------------------------------
  yield {
    id: 's1',
    kind: 'section',
    step: 1,
    text: 'List the cases first',
    hint: 'One line each: input → the answer you expect.',
  }
  yield {
    id: 's1-warn',
    kind: 'aside',
    pen: 'red',
    text: 'Expected comes from the QUESTION, not from your code. Read it off your own loop and you have tested nothing.',
  }

  for (const [i, c] of CASES.entries()) {
    yield {
      id: `case-${i}`,
      kind: 'case',
      input: penInput(c),
      expected: c.expected,
      tag: c.tag,
    }
  }

  // --- 2. the table --------------------------------------------------------
  yield {
    id: 's2',
    kind: 'section',
    step: 2,
    text: 'Run ONE case in a table',
    hint: 'Pick the case that actually exercises the loop.',
  }
  yield {
    id: 's2-cols',
    kind: 'aside',
    pen: 'ink',
    text: 'A column for every value that changes, plus one for the decision. `need` is not a value that changes — it is the question, and it earns a column anyway.',
  }

  const target = targetOf(WALKTHROUGH)
  yield {
    id: 'grid',
    kind: 'grid',
    caption: `nums = ${penArray(WALKTHROUGH.nums)}     target = ${target}     seen = { }     expected: ${WALKTHROUGH.expected}`,
    columns: [...COLUMNS],
    widths: WIDTHS,
  }

  const run = runOnPaper(WALKTHROUGH.nums, target)
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = step.value

  yield {
    id: 's2-order',
    kind: 'aside',
    pen: 'red',
    text: 'You look up `need` BEFORE you store nums[i]. Merge the two columns and you will let a number pair with itself — that is how [3, 2, 4] with target 6 comes out as [0, 0].',
  }

  yield {
    id: 'verdict',
    kind: 'verdict',
    ok: actual === WALKTHROUGH.expected,
    text: `got ${actual} · expected ${WALKTHROUGH.expected}`,
  }

  // --- 3. the cheap checks -------------------------------------------------
  yield {
    id: 's3',
    kind: 'section',
    step: 3,
    text: 'Argue the rest in one line',
    hint: 'Say it out loud. A table each is twenty minutes you do not have.',
  }

  for (const c of CASES.slice(1)) {
    yield {
      id: `check-${c.nums.join('_') || 'empty'}-${c.target}`,
      kind: 'aside',
      pen: 'ink',
      text: `${penInput(c)} → ${c.reasoning} → ${resultOf(c.nums, targetOf(c))} ✓`,
    }
  }
}
