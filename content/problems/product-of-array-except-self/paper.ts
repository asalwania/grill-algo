/**
 * Product of Array Except Self — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What comes
 * out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * ## Two tables, because the method is two passes
 *
 * Like Top K, this sheet draws two tables, and for the same reason: each pass
 * teaches a different thing and neither is prose. The first stores the product
 * of everything to the LEFT of each position; the second sweeps back and folds
 * in the product of everything to the RIGHT. `runOnPaper` yields the second
 * table's `grid` stroke itself, mid-run — the shared ink rules a row with the
 * most recent grid above it, so nothing else needs telling.
 *
 * ## The trap the BEFORE/AFTER columns exist for
 *
 * The running product is folded in AFTER the write, never before. `prefix (→
 * answer[i])` is what gets stored; `prefix ×= nums[i]` is what happens next.
 * Merge them into one column and a careless writer folds nums[i] in first, so
 * answer[i] multiplies by itself, and every row inherits the error. `paper.test`
 * asserts the split directly.
 *
 * ## There is no scalar
 *
 * `PaperCase.target` is unused: the array is the whole input. The paper cases
 * carry `nums` and nothing else, exactly as `cases.json` does.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

// ---------------------------------------------------------------------------
// The pen
// ---------------------------------------------------------------------------

/** `[60, 40, 30, 24]`, and `[]` for the empty array. */
export function penList(values: number[]): string {
  return values.length === 0 ? '[]' : `[${values.join(', ')}]`
}

/** How a case is named in the list: the array is the whole input. */
export function penInput(c: PaperCase): string {
  return `nums = ${penList(c.nums)}`
}

// ---------------------------------------------------------------------------
// The case list
// ---------------------------------------------------------------------------

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same arrays as `cases.json`, on purpose — the paper
 * view and the animated one should be dry-running the same inputs. **The last
 * three are what the shipped four never reach**: the empty array, a single
 * element, and a pair. LeetCode pins n >= 2, so the first two are below the
 * constraint on purpose — they are where a loop-bounds or empty-product mistake
 * shows, and the canvas has nothing interesting to say about either.
 *
 * `expected` is authored and `reasoning` is authored: this is the one place a
 * wrong answer could be written down and shipped, and `paper.test.ts` runs the
 * real algorithm over all seven and refuses to let it drift.
 */
export const CASES: PaperCase[] = [
  {
    nums: [2, 3, 4, 5],
    expected: '[60, 40, 30, 24]',
    tag: 'typical — no zeros',
    reasoning: 'the tabled one',
  },
  {
    nums: [4, 0, 2, 3],
    expected: '[0, 24, 0, 0]',
    tag: 'a single zero',
    reasoning:
      'only the zero’s own position gets a product (4·2·3 = 24); every other position multiplies the zero in and dies',
  },
  {
    nums: [0, 5, 0, 3],
    expected: '[0, 0, 0, 0]',
    tag: 'two zeros',
    reasoning:
      'every position still includes at least one of the two zeros, so the whole answer is zero — and division could not recover it',
  },
  {
    nums: [-2, 3, -4, 5],
    expected: '[-60, 40, -30, 24]',
    tag: 'negatives',
    reasoning:
      'signs multiply through — an even number of negatives around a position is positive, an odd number negative',
  },
  {
    nums: [],
    expected: '[]',
    tag: 'the empty array',
    reasoning: 'no positions, so the answer is empty and neither loop runs',
  },
  {
    nums: [7],
    expected: '[1]',
    tag: 'one element',
    reasoning: 'there is no other element, and the product of nothing is 1 — not 0, not []',
  },
  {
    nums: [3, 5],
    expected: '[5, 3]',
    tag: 'two elements',
    reasoning: 'with two, each answer is simply the other element',
  },
]

/** The case the tables are drawn for: the only one long enough to earn them. */
export const WALKTHROUGH = CASES[0]

/** Phase one: left to right, storing the product of everything before i. */
export const PREFIX_COLUMNS = [
  'i',
  'nums[i]',
  'prefix (→ answer[i])',
  'prefix ×= nums[i]',
  'answer so far',
] as const

export const PREFIX_WIDTHS = [
  'minmax(0,0.45fr)',
  'minmax(0,0.9fr)',
  'minmax(0,1.5fr)',
  'minmax(0,1.4fr)',
  'minmax(0,2.4fr)',
]

/** Phase two: right to left, folding in the product of everything after i. */
export const SUFFIX_COLUMNS = [
  'i',
  'answer[i] BEFORE',
  'suffix',
  'answer[i] ×= suffix',
  'suffix ×= nums[i]',
] as const

export const SUFFIX_WIDTHS = [
  'minmax(0,0.45fr)',
  'minmax(0,1.4fr)',
  'minmax(0,1fr)',
  'minmax(0,1.6fr)',
  'minmax(0,1.6fr)',
]

/**
 * The two-pass solution, running for real: one row per position going left,
 * then one per position coming back right.
 *
 * The generator's RETURN value is the answer, computed by the same loops that
 * produced the rows — so a row and the verdict can never disagree. This is the
 * only implementation of the algorithm in this file; `resultOf` drains it
 * rather than keeping a second copy that could drift.
 *
 * The empty array yields NO prefix rows and NO suffix rows — both loops are
 * skipped — and that is honest: there are no positions to fill.
 *
 * A row is inked red (`hit`) at a zero, the value that makes division fail and
 * the one worth a second look on paper.
 */
export function* runOnPaper(nums: number[]): Generator<PaperStroke, string, void> {
  const n = nums.length
  const answer: number[] = new Array(n).fill(1)

  // --- pass 1: prefix products (rows for the grid writeSheet emits) ----------
  let prefix = 1
  for (let i = 0; i < n; i++) {
    const before = prefix
    answer[i] = before
    prefix = before * nums[i]
    yield {
      id: `pre-${i}`,
      kind: 'row',
      cells: [
        `${i}`,
        `${nums[i]}`,
        `${before}`,
        `${prefix}`,
        penList(answer.slice(0, i + 1)),
      ],
      hit: nums[i] === 0,
    }
  }

  // --- the second table, mid-run --------------------------------------------
  yield {
    id: 'suffix-grid',
    kind: 'grid',
    caption: `now sweep right → left, suffix starts at 1 — multiply each cell by the product to its RIGHT`,
    columns: [...SUFFIX_COLUMNS],
    widths: SUFFIX_WIDTHS,
  }

  // --- pass 2: suffix products ----------------------------------------------
  let suffix = 1
  for (let i = n - 1; i >= 0; i--) {
    const before = answer[i]
    const combined = before * suffix
    answer[i] = combined
    const suffixBefore = suffix
    suffix = suffixBefore * nums[i]
    yield {
      id: `suf-${i}`,
      kind: 'row',
      cells: [`${i}`, `${before}`, `${suffixBefore}`, `${combined}`, `${suffix}`],
      hit: nums[i] === 0,
    }
  }

  return penList(answer)
}

/** Drains `runOnPaper` for its answer, discarding the strokes. */
export function resultOf(c: PaperCase): string {
  const run = runOnPaper(c.nums)
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
    text: 'Product of Array Except Self',
    sub: 'nums: int[]  →  int[] where answer[i] = product of every element but nums[i]     ·     no division',
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
    id: 's1-div',
    kind: 'aside',
    pen: 'red',
    text: 'The obvious move is total ÷ nums[i]. The problem forbids it — and a single zero breaks it anyway: you cannot divide by 0, and even for the other positions you have lost the one factor that mattered.',
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
    text: 'Run ONE case in two tables',
    hint: 'Two passes, so two tables — store the left products, then fold in the right.',
  }
  yield {
    id: 's2-cols',
    kind: 'aside',
    pen: 'ink',
    text: 'answer[i] starts as the product of everything to its LEFT. The second pass multiplies in everything to its right. No second array — one running product each way.',
  }

  yield {
    id: 'prefix-grid',
    kind: 'grid',
    caption: `nums = ${penList(WALKTHROUGH.nums)}     prefix starts at 1     expected: ${WALKTHROUGH.expected}`,
    columns: [...PREFIX_COLUMNS],
    widths: PREFIX_WIDTHS,
  }

  const run = runOnPaper(WALKTHROUGH.nums)
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
    text: 'Fold nums[i] into the running product AFTER writing the cell, never before. Fold first and answer[i] multiplies by itself — wrong at every position, in both passes.',
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
      text: `${penInput(c)} → ${c.reasoning} → ${resultOf(c)} ✓`,
    }
  }

  yield {
    id: 's3-trio',
    kind: 'aside',
    pen: 'red',
    text: 'The last three are the whole interview. [] is [], [7] is [1] (the product of nothing is 1, not 0 or []), and [3, 5] is [5, 3]. Get the empty-product and the loop bounds right and the general case takes care of itself.',
  }
}
