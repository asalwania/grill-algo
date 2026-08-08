/**
 * Longest Consecutive Sequence — the dry run, as you would do it at a
 * whiteboard.
 *
 * Sibling of `trace.ts`, and the same discipline: a generator that ACTUALLY
 * runs the algorithm, executed at build time, never in the browser. What
 * comes out is a `PaperStroke[]` rather than a `Frame[]`, because paper is
 * append-only and needs no snapshots — see the `PaperStroke` doc in
 * `lib/types.ts` for why the two models stay separate.
 *
 * ## Two tables, the same reason Top K earns a second
 *
 * This algorithm is genuinely two passes that teach different things: the
 * first just remembers every value (bookkeeping anyone can follow), and the
 * second — checking each distinct value once for a missing predecessor,
 * then walking forward — is the whole idea. Folding the second into prose
 * would hide it; folding the first away would leave the second with no set
 * to check against. `runOnPaper` yields the second table's `grid` stroke
 * itself, mid-run, exactly as Top K's own two-table sheet does.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

/**
 * The case list a competent candidate writes before touching the code.
 *
 * The first four are the same arrays as `cases.json`, on purpose — the paper
 * view and the animated one should be dry-running the same inputs. **The
 * last three are what the shipped four never reach**: the empty array (the
 * scene has no tiles to show at all), a single element, and a run built
 * entirely from NEGATIVE numbers — the one place a sign mistake in
 * `value - 1` would go unnoticed on a scene where every case happens to be
 * positive.
 *
 * `expected` is authored and `reasoning` is authored; `paper.test.ts` runs
 * the real algorithm over all seven and refuses to let either drift.
 */
export const CASES: PaperCase[] = [
  {
    nums: [2, 20, 4, 10, 3, 4, 5],
    expected: '4',
    tag: 'typical — a duplicate and three loners around one real run',
    reasoning: 'the tabled one',
  },
  {
    nums: [50, 51, 52, 10, 11],
    expected: '3',
    tag: 'decided by the very first value checked',
    reasoning: '50 has no predecessor and walks straight to 52; nothing later beats it',
  },
  {
    nums: [30, 40, 20, 1, 2, 3],
    expected: '3',
    tag: 'three short-lived leads before the real run',
    reasoning: '30, 40 and 20 each briefly hold the record at length one before 1·2·3 turns up',
  },
  {
    nums: [50, 10, 70, 30],
    expected: '1',
    tag: 'nothing is anyone’s neighbour',
    reasoning: 'every gap is 20 or more, so every value is its own run of one',
  },
  {
    nums: [],
    expected: '0',
    tag: 'empty — no elements at all',
    reasoning: 'the set stays empty and the scan loop never runs, so the answer is 0',
  },
  {
    nums: [42],
    expected: '1',
    tag: 'single — trivially a run of one',
    reasoning: 'one value, no predecessor, nothing to walk to — length 1',
  },
  {
    nums: [-1, -2, -3, 0, 1],
    expected: '5',
    tag: 'negatives — value − 1 has to work with a sign',
    reasoning: '-3 is the only value with no predecessor (-4 is absent); it walks -2, -1, 0, 1 — the whole array',
  },
]

/** The case the tables are drawn for: the only one long enough to earn one. */
export const WALKTHROUGH = CASES[0]

/** `{ }` when empty, `{ 4, 1 }` otherwise — written the way a hand writes it,
 *  in the order values were first seen. */
function penSet(values: Iterable<number>): string {
  const items = [...values]
  return items.length === 0 ? '{ }' : `{ ${items.join(', ')} }`
}

/** `[2, 20, 4]`, and `[ ]` for the empty case so it still reads as a drawn box. */
export function penArray(nums: number[]): string {
  return nums.length === 0 ? '[ ]' : `[${nums.join(', ')}]`
}

/** Phase one: one row per element, the set filling up. */
export const BUILD_COLUMNS = ['i', 'nums[i]', 'seen BEFORE', 'seen AFTER'] as const

export const BUILD_WIDTHS = [
  'minmax(0,0.5fr)',
  'minmax(0,1fr)',
  'minmax(0,2.2fr)',
  'minmax(0,2.2fr)',
]

/** Phase two: one row per DISTINCT value, in the order it was first seen. */
export const SCAN_COLUMNS = [
  'value',
  'value − 1 in seen?',
  'start?',
  'walk',
  'run length',
] as const

export const SCAN_WIDTHS = [
  'minmax(0,0.7fr)',
  'minmax(0,1.4fr)',
  'minmax(0,1.4fr)',
  'minmax(0,2.4fr)',
  'minmax(0,1fr)',
]

/**
 * The hash-set solution, running for real, narrating each pass as table rows.
 *
 * The generator's RETURN value is the answer, computed by the same loops that
 * produced the rows — so a row and the verdict can never disagree. This is
 * the only implementation of Longest Consecutive Sequence in this file;
 * `resultOf` gets its answer by draining this rather than keeping a second
 * copy that could drift.
 */
export function* runOnPaper(
  nums: number[],
): Generator<PaperStroke, string, void> {
  // --- phase 1: remember every value ----------------------------------------
  const seen = new Set<number>()

  for (let i = 0; i < nums.length; i++) {
    const value = nums[i]
    const before = penSet(seen)
    const repeat = seen.has(value)
    seen.add(value)

    yield {
      id: `build-${i}`,
      kind: 'row',
      cells: [`${i}`, `${value}`, before, penSet(seen)],
      hit: repeat,
    }
  }

  yield {
    id: 'seen-grid',
    kind: 'grid',
    caption: `seen = ${penSet(seen)}     ·     check each DISTINCT value once`,
    columns: [...SCAN_COLUMNS],
    widths: SCAN_WIDTHS,
  }

  // --- phase 2: check each distinct value for a missing predecessor ---------
  let longest = 0

  for (const value of seen) {
    const hasPredecessor = seen.has(value - 1)

    if (hasPredecessor) {
      yield {
        id: `scan-${value}`,
        kind: 'row',
        cells: [`${value}`, 'yes', 'no — skip', '—', '—'],
        hit: false,
      }
      continue
    }

    let length = 1
    const walked = [value]
    while (seen.has(value + length)) {
      walked.push(value + length)
      length++
    }

    const isRecord = length > longest
    if (isRecord) longest = length

    yield {
      id: `scan-${value}`,
      kind: 'row',
      cells: [`${value}`, 'no', 'yes — start', penArray(walked), `${length}`],
      hit: isRecord,
    }
  }

  return String(longest)
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(nums: number[]): string {
  const run = runOnPaper(nums)
  let step = run.next()
  while (!step.done) step = run.next()
  return step.value
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
    text: 'Longest Consecutive Sequence',
    sub: 'nums: int[]  →  int     ·     the length of the longest run of back-to-back values',
  }

  // --- 1. the list -----------------------------------------------------------
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

  // --- 2. the tables -----------------------------------------------------------
  yield {
    id: 's2',
    kind: 'section',
    step: 2,
    text: 'Run ONE case in two tables',
    hint: 'Two passes, so two tables — remember everything, then check each value once.',
  }
  yield {
    id: 's2-cols',
    kind: 'aside',
    pen: 'ink',
    text: 'The first table is bookkeeping. The second is the idea, and it is the one to draw if you only have room for one.',
  }

  yield {
    id: 'build-grid',
    kind: 'grid',
    caption: `nums = ${penArray(WALKTHROUGH.nums)}     seen = { }     expected: ${WALKTHROUGH.expected}`,
    columns: [...BUILD_COLUMNS],
    widths: BUILD_WIDTHS,
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
    text: 'Check "value − 1 in seen?" BEFORE deciding a value starts a run — skip that check and every value looks like a start, and the walk re-counts the same run once per member.',
  }

  yield {
    id: 'verdict',
    kind: 'verdict',
    ok: actual === WALKTHROUGH.expected,
    text: `got ${actual} · expected ${WALKTHROUGH.expected}`,
  }

  // --- 3. the cheap checks -----------------------------------------------------
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
