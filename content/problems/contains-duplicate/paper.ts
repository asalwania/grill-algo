/**
 * Contains Duplicate — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * This file is a problem's paper identity, the way `chrome.ts` is its screen
 * identity. What is per-problem here is everything: the authored case list,
 * the columns the table needs, and the loop itself. What is shared is the ink
 * — `components/paper/` knows how a pen looks and nothing about duplicates.
 *
 * A problem opts in by adding this file. `lib/content.ts` looks for it and
 * hands back `null` when it is absent, so the four problems without one simply
 * do not offer the button.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same arrays as `cases.json`, on purpose — the paper
 * view and the animated one should be dry-running the same inputs. **The last
 * three are the cases the 3D view structurally cannot show**: a scene needs
 * tiles to light up, and the empty array has none, the single element has one,
 * and the negatives light up identically to any other pair. On paper they cost
 * nothing, and they are exactly what an interviewer probes for. That asymmetry
 * is the whole argument for this feature existing alongside the canvas.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs the
 * real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  {
    nums: [4, 1, 9, 7, 3, 9],
    expected: 'true',
    tag: 'typical — dup at the end',
    reasoning: 'the tabled one',
  },
  {
    nums: [5, 2, 8, 1],
    expected: 'false',
    tag: 'typical — no dup at all',
    reasoning: '4 distinct values, set grows to 4, never hits',
  },
  {
    nums: [5, 5, 9, 2],
    expected: 'true',
    tag: 'earliest possible hit',
    reasoning: 'i = 1 finds 5 already in { 5 }, exits immediately',
  },
  {
    nums: [22, 14, 18, 2, 22],
    expected: 'true',
    tag: 'latest possible hit',
    reasoning: 'hits only on the final i — the set’s worst case',
  },
  {
    nums: [],
    expected: 'false',
    tag: 'empty — loop never runs',
    reasoning: 'loop body never executes, falls through to return false',
  },
  {
    nums: [7],
    expected: 'false',
    tag: 'single — nothing to pair with',
    reasoning: 'one pass, set = { 7 }, nothing to collide with',
  },
  {
    nums: [-3, 0, -3],
    expected: 'true',
    tag: 'negatives and zero',
    reasoning: 'a set keys on equality, and -3 == -3',
  },
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/**
 * The columns, and the whole of what makes the table teachable.
 *
 * The split between "seen BEFORE" and "seen AFTER" is not padding. It is the
 * single most common way a hand-run goes wrong: with one `seen` column the
 * writer can no longer tell whether they checked the current number against a
 * set that already contained it, every later row inherits the error, and the
 * dry run "passes" against a real bug. Two columns make the order of
 * operations impossible to fudge.
 */
export const COLUMNS = [
  'i',
  'nums[i]',
  'seen BEFORE',
  'seen it?',
  'seen AFTER / action',
] as const

/** `{ }` when empty, `{ 4, 1 }` otherwise — written the way a hand writes it. */
function penSet(values: Iterable<number>): string {
  const items = [...values]
  return items.length === 0 ? '{ }' : `{ ${items.join(', ')} }`
}

/** `[4, 1, 9]`, and `[ ]` for the empty case so it still reads as a drawn box. */
export function penArray(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

/**
 * The hash-set solution, running for real, narrating each pass as a table row.
 *
 * The generator's RETURN value is the answer, computed by the same loop that
 * produced the rows — so a row and the verdict can never disagree. This is the
 * only implementation of Contains Duplicate in this file; `resultOf` gets its
 * answer by draining this rather than keeping a second copy that could drift.
 */
export function* runOnPaper(
  nums: number[],
): Generator<PaperStroke, boolean, void> {
  const seen = new Set<number>()

  for (let i = 0; i < nums.length; i++) {
    const value = nums[i]
    const before = penSet(seen)

    if (seen.has(value)) {
      yield {
        id: `row-${i}`,
        kind: 'row',
        cells: [`${i}`, `${value}`, before, 'YES', 'return true'],
        hit: true,
      }
      return true
    }

    seen.add(value)
    yield {
      id: `row-${i}`,
      kind: 'row',
      cells: [`${i}`, `${value}`, before, 'no', penSet(seen)],
      hit: false,
    }
  }

  return false
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(nums: number[]): string {
  const run = runOnPaper(nums)
  let step = run.next()
  while (!step.done) step = run.next()
  return String(step.value)
}

/**
 * The whole sheet, in writing order.
 *
 * Three sections, because the lesson is a three-step HABIT and not a table:
 * list the cases, run exactly one of them properly, then dispose of the rest
 * in a line each. Step 3 is the part people skip and the part that saves the
 * interview — seven tables is twenty minutes nobody has.
 */
export function* writeSheet(): Generator<PaperStroke, void, void> {
  yield {
    id: 'title',
    kind: 'title',
    text: 'Contains Duplicate',
    sub: 'nums: int[]  →  bool     ·     true if any value appears twice',
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
      input: penArray(c.nums),
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
    text: 'A column for every value that changes, plus one for the decision. Nothing else.',
  }

  yield {
    id: 'grid',
    kind: 'grid',
    caption: `nums = ${penArray(WALKTHROUGH.nums)}     seen = { }     expected: ${WALKTHROUGH.expected}`,
    columns: [...COLUMNS],
  }

  const run = runOnPaper(WALKTHROUGH.nums)
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = String(step.value)

  yield {
    id: 's2-order',
    kind: 'aside',
    pen: 'red',
    text: 'BEFORE and AFTER are separate columns on purpose — you check, then you insert. Merge them and you will convince yourself a number was already there.',
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
      id: `check-${c.nums.join('_') || 'empty'}`,
      kind: 'aside',
      pen: 'ink',
      text: `${penArray(c.nums)} → ${c.reasoning} → ${resultOf(c.nums)} ✓`,
    }
  }
}
