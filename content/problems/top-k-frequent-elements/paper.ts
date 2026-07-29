/**
 * Top K Frequent Elements — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * ## Two tables, and why this is the one problem that earns a second
 *
 * Every other sheet in this codebase draws exactly one table, because every
 * other problem is one loop. This one is two, and they teach different things:
 * the counting pass is bookkeeping anyone can follow, and the bucket read-off
 * is the whole reason the solution beats a sort. Folding the second into prose
 * would hide the idea; folding the first away would leave the second with no
 * counts to read.
 *
 * `runOnPaper` therefore yields the second table's `grid` stroke itself,
 * mid-run, rather than leaving it to `writeSheet`. Nothing in the shared ink
 * needs to know: a `row` belongs to the most recent `grid` above it, which is
 * exactly what `PaperSheet.templatesFor` resolves.
 *
 * ## The row nobody expects
 *
 * The take loop starts at `freq = nums.length` and counts DOWN, so the first
 * few rows read empty buckets. They are not noise — they are the visible cost
 * of the trick, and they are why it is O(n) rather than O(n log n): scanning a
 * frequency axis of length n is linear no matter how few buckets are occupied,
 * where sorting the counts would not be.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same arrays and k's as `cases.json`, on purpose — the
 * paper view and the animated one should be dry-running the same inputs. **The
 * last three are what the shipped four never reach**: a single element, an
 * array with negatives in it, and a genuine TIE for the last place. The tie is
 * the one that matters — the problem says the answer may be returned in any
 * order, so a tie has several correct answers and the sheet must not pretend
 * its own is the only one.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs the
 * real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  {
    nums: [3, 1, 2, 3, 2, 3],
    target: 2,
    expected: '[3, 2]',
    tag: 'typical — nothing tied',
    reasoning: 'the tabled one',
  },
  {
    nums: [7, 7, 4, 9, 4, 4],
    target: 2,
    expected: '[4, 7]',
    tag: 'the early leader loses',
    reasoning: '7 reaches two first, but 4 finishes on three — counts are read at the END, not as you go',
  },
  {
    nums: [8, 5, 8, 5, 6, 5],
    target: 1,
    expected: '[5]',
    tag: 'decided by the last element',
    reasoning: '8 and 5 are level at two until the final 5, and only k = 1 survives it',
  },
  {
    nums: [9, 4, 6],
    target: 3,
    expected: '[9, 4, 6]',
    tag: 'nothing repeats',
    reasoning: 'every count is 1, so one bucket holds everything and k = 3 empties it',
  },
  {
    nums: [1],
    target: 1,
    expected: '[1]',
    tag: 'single element',
    reasoning: 'one count of one, one bucket, one value taken — the shortest run there is',
  },
  {
    nums: [-2, -2, 3],
    target: 1,
    expected: '[-2]',
    tag: 'negatives',
    reasoning: 'values are map KEYS and buckets are indexed by frequency, so a negative value indexes nothing',
  },
  {
    nums: [1, 1, 2, 2],
    target: 2,
    expected: '[1, 2]',
    tag: 'a genuine tie',
    reasoning: 'both count two and both are taken, so the tie never has to be broken — and any order is accepted',
  },
]

/** The case the table is drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/** `PaperCase.target` is this problem's k. Read through here so a case that
 *  forgot it fails the build loudly instead of silently becoming k = 0. */
export function kOf(c: PaperCase): number {
  if (c.target === undefined) throw new Error(`case [${c.nums.join(', ')}] has no k`)
  return c.target
}

/** Phase one: one row per element, the count going up by one. */
export const COUNT_COLUMNS = [
  'i',
  'nums[i]',
  'count[v] BEFORE',
  'count[v] AFTER',
  'count map AFTER',
] as const

export const COUNT_WIDTHS = [
  'minmax(0,0.45fr)',
  'minmax(0,0.9fr)',
  'minmax(0,1.4fr)',
  'minmax(0,1.4fr)',
  'minmax(0,3fr)',
]

/** Phase two: one row per frequency, counting DOWN from n. */
export const TAKE_COLUMNS = ['freq', 'bucket[freq]', 'out AFTER'] as const

export const TAKE_WIDTHS = ['minmax(0,0.6fr)', 'minmax(0,2fr)', 'minmax(0,2fr)']

/** `[3, 2]`, and `[ ]` for the empty list so it still reads as a drawn box. */
export function penList(values: number[]): string {
  return values.length === 0 ? '[ ]' : `[${values.join(', ')}]`
}

/** `{ 3:2, 1:1 }` — value to count, in the order the values first appeared,
 *  which is the order a hand writes them down the margin. */
function penCounts(counts: Map<number, number>): string {
  const items = [...counts].map(([value, n]) => `${value}:${n}`)
  return items.length === 0 ? '{ }' : `{ ${items.join(', ')} }`
}

/** How a case is named in the list: the array and the k that goes with it. */
export function penInput(c: PaperCase): string {
  return `${penList(c.nums)}  k=${c.target}`
}

/**
 * The count-then-bucket solution, running for real: one table row per element
 * counted, then one per frequency read back off.
 *
 * The generator's RETURN value is the answer, computed by the same loops that
 * produced the rows — so a row and the verdict can never disagree. This is the
 * only implementation of Top K in this file; `resultOf` gets its answer by
 * draining this rather than keeping a second copy that could drift.
 *
 * Nothing here is sorted, anywhere. That is the claim the second table exists
 * to make visible.
 */
export function* runOnPaper(
  nums: number[],
  k: number,
): Generator<PaperStroke, string, void> {
  // --- count ---------------------------------------------------------------
  const counts = new Map<number, number>()

  for (let i = 0; i < nums.length; i++) {
    const value = nums[i]
    const before = counts.get(value) ?? 0
    counts.set(value, before + 1)

    yield {
      id: `count-${i}`,
      kind: 'row',
      cells: [
        `${i}`,
        `${value}`,
        `${before}`,
        `${before + 1}`,
        penCounts(counts),
      ],
      // A repeat is the only thing that makes this pass interesting, so it is
      // what the red pen marks.
      hit: before > 0,
    }
  }

  // --- bucket --------------------------------------------------------------
  // Index BY frequency. A count can never exceed nums.length, which is what
  // makes an array legal here where a comparison sort would be needed
  // otherwise — the entire trick, in one line.
  const buckets: number[][] = Array.from({ length: nums.length + 1 }, () => [])
  for (const [value, freq] of counts) buckets[freq].push(value)

  const occupied = buckets
    .map((bucket, freq) => ({ bucket, freq }))
    .filter(({ bucket }) => bucket.length > 0)
    .map(({ bucket, freq }) => `${freq} → ${penList(bucket)}`)

  yield {
    id: 'buckets',
    kind: 'aside',
    pen: 'ink',
    text: `Tip each value into buckets[its count]: ${occupied.length === 0 ? 'nothing to tip' : occupied.join('   ')}. No comparison, no sort — a count is at most ${nums.length}, so it can be an INDEX.`,
  }

  // --- take ----------------------------------------------------------------
  yield {
    id: 'take-grid',
    kind: 'grid',
    caption: `walk freq from ${nums.length} down to 1, taking until out has k = ${k}`,
    columns: [...TAKE_COLUMNS],
    widths: TAKE_WIDTHS,
  }

  const out: number[] = []
  for (let freq = nums.length; freq > 0 && out.length < k; freq--) {
    for (const value of buckets[freq]) {
      out.push(value)
      if (out.length === k) break
    }

    yield {
      id: `take-${freq}`,
      kind: 'row',
      cells: [`${freq}`, penList(buckets[freq]), penList(out)],
      hit: buckets[freq].length > 0,
    }
  }

  return penList(out)
}

/** Drains `runOnPaper` for its answer, discarding the strokes. */
export function resultOf(nums: number[], k: number): string {
  const run = runOnPaper(nums, k)
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
    text: 'Top K Frequent Elements',
    sub: 'nums: int[], k: int  →  int[k]     ·     the k values that appear most often, in any order',
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
  yield {
    id: 's1-order',
    kind: 'aside',
    pen: 'red',
    text: 'This problem accepts ANY order, so a case can have several right answers. Write down the one you expect and say out loud that the order is free — do not quietly turn a valid answer into a failing test.',
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

  // --- 2. the tables -------------------------------------------------------
  yield {
    id: 's2',
    kind: 'section',
    step: 2,
    text: 'Run ONE case in a table',
    hint: 'Two passes, so two tables — count everything, then read the counts back.',
  }
  yield {
    id: 's2-cols',
    kind: 'aside',
    pen: 'ink',
    text: 'The first table is bookkeeping. The second is the idea, and it is the one to draw if you only have room for one.',
  }

  const k = kOf(WALKTHROUGH)
  yield {
    id: 'count-grid',
    kind: 'grid',
    caption: `nums = ${penList(WALKTHROUGH.nums)}     k = ${k}     count = { }     expected: ${WALKTHROUGH.expected}`,
    columns: [...COUNT_COLUMNS],
    widths: COUNT_WIDTHS,
  }

  const run = runOnPaper(WALKTHROUGH.nums, k)
  let step = run.next()
  while (!step.done) {
    yield step.value
    step = run.next()
  }
  const actual = step.value

  yield {
    id: 's2-empty',
    kind: 'aside',
    pen: 'red',
    text: 'The empty rows at the top are the point, not a mistake. Scanning a frequency axis of length n is O(n) however few buckets are filled — sorting the counts to avoid those rows is what would cost you the n log n.',
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

  for (const [i, c] of CASES.entries()) {
    if (i === 0) continue
    yield {
      id: `check-${i}`,
      kind: 'aside',
      pen: 'ink',
      text: `${penInput(c)} → ${c.reasoning} → ${resultOf(c.nums, kOf(c))} ✓`,
    }
  }
}
