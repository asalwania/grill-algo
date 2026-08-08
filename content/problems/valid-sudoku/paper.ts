/**
 * Valid Sudoku — the dry run, as you would do it at a whiteboard.
 *
 * Sibling of `trace.ts`, same discipline: a generator that ACTUALLY runs the
 * algorithm, executed at build time, never in the browser. `PaperStroke[]`
 * rather than `Frame[]` — see the `PaperStroke` doc in lib/types.ts for why.
 *
 * Boards are duplicated here as row-strings rather than imported from
 * `./trace` (add-a-problem.md §10c) — this file is cheap precisely because it
 * keeps no dependency on the animated trace.
 */

import type { PaperCase, PaperStroke } from '../../../lib/types.ts'

function parseBoard(rows: readonly string[]): number[] {
  return rows.flatMap((row) => row.split('').map((ch) => (ch === '.' ? 0 : Number(ch))))
}

// The four SHIPPED cases — same boards as trace.ts's TEST_CASES, packed
// identically, so paper and screen dry-run the same inputs. paper.test.ts
// checks this by value.
const SAMPLE_ROWS = [
  '83..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
] as const
const NO_ANSWER_ROWS = [
  '53..7....',
  '6..195...',
  '.98....6.',
  '8...6...3',
  '4..8.3..1',
  '7...2...6',
  '.6....28.',
  '...419..5',
  '....8..79',
] as const
const FIRST_PAIR_ROWS = [
  '55.......',
  ...Array.from({ length: 8 }, () => '.........'),
] as const
const LATE_ANSWER_ROWS = [
  '1........',
  '...2.....',
  '.....3...',
  '.........',
  '.4.......',
  '.........',
  '.......7.',
  '.........',
  '......7..',
] as const

// The three cases the 3D board cannot sell: a board so sparse there is
// nothing to watch light up. An empty board and a single given are trivially
// valid — one active cell, nothing to compare it against. The box-only
// conflict is a real teaching point (row- and column-checking alone would
// both pass it) but is a two-cell board, over before an animation starts.
const EMPTY_ROWS = Array.from({ length: 9 }, () => '.........')
const SINGLE_CELL_ROWS = ['5........', ...Array.from({ length: 8 }, () => '.........')]
const BOX_ONLY_ROWS = [
  '9........',
  '.........',
  '..9......',
  ...Array.from({ length: 6 }, () => '.........'),
]

export const CASES: PaperCase[] = [
  {
    nums: parseBoard(SAMPLE_ROWS),
    expected: 'false',
    tag: "typical — LeetCode's own invalid example",
    reasoning: 'the tabled one',
  },
  {
    nums: parseBoard(FIRST_PAIR_ROWS),
    expected: 'false',
    tag: 'earliest possible conflict',
    reasoning: 'row 1 holds two 5s — caught on the very second filled cell',
  },
  {
    nums: parseBoard(LATE_ANSWER_ROWS),
    expected: 'false',
    tag: 'box-only, discovered last',
    reasoning: 'no row or column ever repeats — only box 9 catches the two 7s',
  },
  {
    nums: parseBoard(NO_ANSWER_ROWS),
    expected: 'true',
    tag: "typical — LeetCode's own valid example",
    reasoning: 'every cell checks out; every group runs to completion',
  },
  {
    nums: parseBoard(EMPTY_ROWS),
    expected: 'true',
    tag: 'empty — nothing to check',
    reasoning: 'no filled cell ever runs the body, so nothing can conflict',
  },
  {
    nums: parseBoard(SINGLE_CELL_ROWS),
    expected: 'true',
    tag: 'single given — nothing to collide with',
    reasoning: 'one cell, three new keys, no earlier entry could possibly match',
  },
  {
    nums: parseBoard(BOX_ONLY_ROWS),
    expected: 'false',
    tag: 'box-only conflict, minimal',
    reasoning: '(1,1)=9 and (3,3)=9 share box 1 but no row or column — b1d9 is the key that catches it',
  },
]

/** The case the table is drawn for: the walkthrough, same as trace.ts's `sample`. */
export const WALKTHROUGH = CASES[0]

/**
 * Columns for one filled cell's check. The split between "seen BEFORE" and
 * "action" is the same trap Contains Duplicate's sheet guards against: check
 * against the map as it stood BEFORE this cell, then write to it — merge the
 * two and a hand-run can no longer tell whether a cell was compared against
 * its own entry.
 */
export const COLUMNS = ['cell', 'digit', 'row / col / box already has it?', 'seen AFTER / action'] as const

export const WIDTHS = [
  'minmax(0,0.8fr)',
  'minmax(0,0.6fr)',
  'minmax(0,2.4fr)',
  'minmax(0,2.6fr)',
]

/** `r5✗ c2✗ b1✗` before a cell is stored, `r5✓` (etc.) the moment one of the
 *  three constraints already held the digit — written the way a hand would
 *  mark three quick checks rather than transcribe the whole map. */
function penFlags(
  row: number,
  col: number,
  box: number,
  hitRow: boolean,
  hitCol: boolean,
  hitBox: boolean,
): string {
  const mark = (hit: boolean) => (hit ? '✓' : '✗');
  return `r${row + 1}${mark(hitRow)} c${col + 1}${mark(hitCol)} b${box + 1}${mark(hitBox)}`
}

/**
 * The optimized solution, running for real, narrating each filled cell as a
 * table row. The generator's RETURN value is the answer, computed by the
 * same loop that produced the rows.
 */
export function* runOnPaper(values: number[]): Generator<PaperStroke, boolean, void> {
  const seen = new Map<string, number>()

  for (let i = 0; i < values.length; i++) {
    const digit = values[i]
    if (digit === 0) continue

    const row = Math.floor(i / 9)
    const col = i % 9
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3)
    // Internal map keys — 0-based, never shown on the sheet.
    const rowKey = `r${row}d${digit}`
    const colKey = `c${col}d${digit}`
    const boxKey = `b${box}d${digit}`
    // Display keys — 1-based, matching the (row,col) cell label and the
    // "before" flags column. A hand wouldn't count from 0.
    const rowKeyDisplay = `r${row + 1}d${digit}`
    const colKeyDisplay = `c${col + 1}d${digit}`
    const boxKeyDisplay = `b${box + 1}d${digit}`

    const hitRow = seen.has(rowKey)
    const hitCol = seen.has(colKey)
    const hitBox = seen.has(boxKey)
    const before = penFlags(row, col, box, hitRow, hitCol, hitBox)

    if (hitRow || hitCol || hitBox) {
      yield {
        id: `row-${i}`,
        kind: 'row',
        cells: [`(${row + 1},${col + 1})`, `${digit}`, before, 'return false'],
        hit: true,
      }
      return false
    }

    seen.set(rowKey, i)
    seen.set(colKey, i)
    seen.set(boxKey, i)
    yield {
      id: `row-${i}`,
      kind: 'row',
      cells: [
        `(${row + 1},${col + 1})`,
        `${digit}`,
        before,
        `+${rowKeyDisplay} +${colKeyDisplay} +${boxKeyDisplay}`,
      ],
      hit: false,
    }
  }

  return true
}

/** Drains `runOnPaper` for its answer, discarding the rows. */
export function resultOf(values: number[]): string {
  const run = runOnPaper(values)
  let step = run.next()
  while (!step.done) step = run.next()
  return String(step.value)
}

/** `[5,3,0,0,7,...]` written the way a hand draws a 9x9 board — 9 rows of 9,
 *  `.` for an empty cell. Only used by the case list, never the table. */
function penBoard(values: number[]): string {
  const rows: string[] = []
  for (let r = 0; r < 9; r++) {
    rows.push(
      values
        .slice(r * 9, r * 9 + 9)
        .map((v) => (v === 0 ? '.' : String(v)))
        .join(''),
    )
  }
  return rows.join(' / ')
}

/**
 * The whole sheet, in writing order. Same three-section habit as every other
 * problem's sheet: list the cases, run exactly one properly, argue the rest
 * in one line each.
 */
export function* writeSheet(): Generator<PaperStroke, void, void> {
  yield {
    id: 'title',
    kind: 'title',
    text: 'Valid Sudoku',
    sub: 'board: 9x9  →  bool     ·     true if no row, column or box repeats a digit',
  }

  // --- 1. the list -----------------------------------------------------------
  yield {
    id: 's1',
    kind: 'section',
    step: 1,
    text: 'List the cases first',
    hint: 'One line each: board → the answer you expect.',
  }
  yield {
    id: 's1-warn',
    kind: 'aside',
    pen: 'red',
    text: 'Expected comes from the QUESTION, not from your code. A board you graded by running your own loop proves nothing.',
  }

  for (const [i, c] of CASES.entries()) {
    yield {
      id: `case-${i}`,
      kind: 'case',
      input: penBoard(c.nums),
      expected: c.expected,
      tag: c.tag,
    }
  }

  // --- 2. the table ------------------------------------------------------------
  yield {
    id: 's2',
    kind: 'section',
    step: 2,
    text: 'Run ONE case in a table',
    hint: 'One row per FILLED cell — empty cells never enter the loop body.',
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
    caption: `board = ${WALKTHROUGH.tag}     expected: ${WALKTHROUGH.expected}`,
    columns: [...COLUMNS],
    widths: WIDTHS,
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
    text: 'BEFORE and action are separate columns on purpose — check all three keys, THEN write. Merge them and you will convince yourself a cell already covered its own entry.',
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
      id: `check-${c.tag}`,
      kind: 'aside',
      pen: 'ink',
      text: `${c.tag} → ${c.reasoning} → ${resultOf(c.nums)} ✓`,
    }
  }
}
