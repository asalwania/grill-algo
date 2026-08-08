/**
 * Valid Sudoku — build-time trace generators.
 *
 * Nothing here runs in the browser: scripts/build-traces.ts executes these
 * generators at build time, once per entry in TEST_CASES, and writes one
 * frames.<case>.<approach>.json per combination next to this file.
 *
 * This is the first problem in the GRID scene family (GridScene, GridFrame —
 * see lib/types.ts), not the array-plus-memory family Two Sum and Contains
 * Duplicate share. A 9x9 board packs into `TestCase.nums` as 81 row-major
 * values (0 for an empty cell), the same field every array problem's `nums`
 * uses — no new TestCase shape needed, same repurposing precedent Valid
 * Anagram set for `target`.
 *
 * TWO approaches, no `sorted` — a board has no order to sort by:
 *   optimized  one shared map, one pass, three encoded keys per cell   O(n²) / O(n²)
 *   brute      three independent passes (rows, cols, boxes),
 *              a fresh throwaway set per group, no shared memory       O(n³) / O(1)
 * (n = 9, the board dimension — not the literal 81 cells. See chrome.ts.)
 *
 * `result` is the pair of CELL indices that conflict, same boolean-via-pair
 * convention ArrayMemoryScene's `result` uses (lib/types.ts) — null both while
 * running and if the board is valid; chrome.ts's `formatAnswer` turns
 * `result !== null` into "false" (a conflict WAS found), which is the inverse
 * of Contains Duplicate's mapping. Each problem's chrome decides that sign;
 * see GridProblemView's `found` pill for why it can't be assumed generically.
 */

import { createEmitter } from '../../../lib/frames.ts'
import type {
  GridCellState,
  GridFrame,
  GridScene,
  ProblemTraces,
  TestCase,
} from '../../../lib/types.ts'

const SIZE = 9
const BOX = 3

function parseBoard(rows: readonly string[]): number[] {
  return rows.flatMap((row) => row.split('').map((ch) => (ch === '.' ? 0 : Number(ch))))
}

function rowOf(i: number): number {
  return Math.floor(i / SIZE)
}
function colOf(i: number): number {
  return i % SIZE
}
function boxOf(row: number, col: number): number {
  return Math.floor(row / BOX) * BOX + Math.floor(col / BOX)
}

// ---------------------------------------------------------------------------
// Playable inputs
// ---------------------------------------------------------------------------

/** LeetCode's own invalid example — the walkthrough. Column 0 holds 8 twice
 *  (row 1 and row 4, 1-based), which is not visible from any single row or
 *  box alone. */
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

/** The same board with LeetCode's example 1's opening digit — the classic
 *  VALID Sudoku, so every approach has to run all the way to the final
 *  `return true` (mandatory per add-a-problem.md §4a). */
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

/** Two filled cells, same row, same digit — the second cell processed is
 *  already the conflict. */
const FIRST_PAIR_ROWS = [
  '55.......',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
  '.........',
] as const

/**
 * Four harmless, scattered givens (distinct rows/cols/boxes) plus a 7 at
 * (row 7, col 8) and another 7 at (row 9, col 7), 1-based — different row,
 * different column, same 3x3 box. Neither a row pass nor a column pass can
 * see this: it only shows up once box-checking starts, which for the brute
 * approach is the very LAST of its 27 groups, after 26 that skip outright
 * (every other row/column/box here holds at most one filled cell).
 */
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

export const EXAMPLE_BOARD = parseBoard(SAMPLE_ROWS)

export const TEST_CASES: TestCase[] = [
  {
    id: 'sample',
    label: 'The walkthrough',
    nums: EXAMPLE_BOARD,
    note: 'Ten cells check out fine before the eleventh — a second 8 in column 1 — breaks it.',
  },
  {
    id: 'first-pair',
    label: 'Conflict straight away',
    nums: parseBoard(FIRST_PAIR_ROWS),
    note: 'The board is otherwise empty. Two 5s in row 1 and it is over.',
  },
  {
    id: 'late-answer',
    label: 'Conflict hidden in a box',
    nums: parseBoard(LATE_ANSWER_ROWS),
    note: 'No row or column ever repeats — only checking boxes catches it.',
  },
  {
    id: 'no-answer',
    label: 'A genuinely valid board',
    nums: parseBoard(NO_ANSWER_ROWS),
    note: "LeetCode's own valid example. Every cell checks out; every group runs to the end.",
  },
]

// ---------------------------------------------------------------------------
// Canonical listings
// ---------------------------------------------------------------------------

/**
 * Active lines: 2, 11, 14, 17, 20. The insight this problem is built around —
 * row 3 needing a 7, column 5 needing a 7 and box 8 needing a 7 are three
 * DIFFERENT facts — collapses into three strings compared against one map,
 * so there is no separate "check the row" / "check the column" / "check the
 * box" step to give its own line.
 */
export const OPTIMIZED_LISTING = [
  'function isValidSudoku(board) {', //                                    1
  '  const seen = new Map()', //                                          2
  '', //                                                                  3
  '  for (let i = 0; i < 81; i++) {', //                                  4
  '    const digit = board[i]', //                                       5
  '    if (digit === 0) continue', //                                    6
  '', //                                                                 7
  '    const row = Math.floor(i / 9)', //                                8
  '    const col = i % 9', //                                            9
  '    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3)', //   10
  '    const keys = [`r${row}d${digit}`, `c${col}d${digit}`, `b${box}d${digit}`]', // 11
  '', //                                                                12
  '    if (keys.some((key) => seen.has(key))) {', //                    13
  '      return false', //                                              14
  '    }', //                                                           15
  '', //                                                                16
  '    for (const key of keys) seen.set(key, i)', //                    17
  '  }', //                                                             18
  '', //                                                                19
  '  return true', //                                                   20
  '}', //                                                                21
].join('\n')

/**
 * Active lines: 2, 3, 7, 13, 17, 23, 29, 34. Three structurally identical
 * passes — the repetition IS the point: nothing found checking rows is
 * remembered when columns start, and nothing found checking columns is
 * remembered when boxes start.
 */
export const BRUTE_LISTING = [
  'function isValidSudoku(board) {', //                                        1
  '  for (let r = 0; r < 9; r++) {', //                                        2
  '    const seen = new Set()', //                                            3
  '    for (let c = 0; c < 9; c++) {', //                                     4
  '      const digit = board[r * 9 + c]', //                                  5
  '      if (digit === 0) continue', //                                       6
  '      if (seen.has(digit)) return false', //                              7
  '      seen.add(digit)', //                                                8
  '    }', //                                                                9
  '  }', //                                                                 10
  '', //                                                                    11
  '  for (let c = 0; c < 9; c++) {', //                                     12
  '    const seen = new Set()', //                                          13
  '    for (let r = 0; r < 9; r++) {', //                                   14
  '      const digit = board[r * 9 + c]', //                                15
  '      if (digit === 0) continue', //                                     16
  '      if (seen.has(digit)) return false', //                            17
  '      seen.add(digit)', //                                               18
  '    }', //                                                              19
  '  }', //                                                                20
  '', //                                                                   21
  '  for (let box = 0; box < 9; box++) {', //                              22
  '    const seen = new Set()', //                                         23
  '    const boxRow = Math.floor(box / 3) * 3', //                         24
  '    const boxCol = (box % 3) * 3', //                                   25
  '    for (let k = 0; k < 9; k++) {', //                                  26
  '      const digit = board[(boxRow + Math.floor(k / 3)) * 9 + (boxCol + (k % 3))]', // 27
  '      if (digit === 0) continue', //                                    28
  '      if (seen.has(digit)) return false', //                           29
  '      seen.add(digit)', //                                              30
  '    }', //                                                             31
  '  }', //                                                               32
  '', //                                                                  33
  '  return true', //                                                     34
  '}', //                                                                  35
].join('\n')

const OPTIMIZED_LINE = {
  init: 2,
  active: 11,
  found: 14,
  store: 17,
  exhausted: 20,
} as const

const BRUTE_LINE = {
  init: 2,
  rowStart: 3,
  rowCheck: 7,
  colStart: 13,
  colCheck: 17,
  boxStart: 23,
  boxCheck: 29,
  exhausted: 34,
} as const

// ---------------------------------------------------------------------------
// Optimized — one pass, one shared map
// ---------------------------------------------------------------------------

/**
 * Solves Valid Sudoku with one Map keyed by encoded row/column/box+digit
 * strings, yielding a full state snapshot at each meaningful point. This
 * actually computes the answer — the frames are a by-product of a real run.
 *
 * Two beats per filled cell rather than the array family's usual three: beat
 * one lights the cell AND its already-processed row/column/box peers
 * (`peer` — exactly the set the three map lookups are checking against, made
 * visible), beat two resolves. Folding "the question forms" and "it fires"
 * together is a deliberate adaptation for a fixed 81-cell board, not a
 * shortcut taken by accident — see specs/progress-tracker.md's grid-family
 * entry.
 */
export function* validSudokuOptimized(values: number[]): Generator<GridFrame, void, undefined> {
  const cells: GridCellState[] = values.map(() => 'idle')
  const seen = new Map<string, number>()
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let checked = 0

  const emit = createEmitter<GridScene>(() => ({
    rows: SIZE,
    cols: SIZE,
    values: [...values],
    cells: [...cells],
    cursor,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ checked, remembered: seen.size })

  yield emit(
    OPTIMIZED_LINE.init,
    'init',
    'One shared map, one pass over the board.',
    'Row 3 needing a 7, column 5 needing a 7 and box 8 needing a 7 are three separate facts. Encode each as its own key and one map can hold — and check — all three at once.',
    base(),
  )

  for (let i = 0; i < values.length; i++) {
    const digit = values[i]
    if (digit === 0) continue

    const row = rowOf(i)
    const col = colOf(i)
    const box = boxOf(row, col)
    const rowKey = `r${row}d${digit}`
    const colKey = `c${col}d${digit}`
    const boxKey = `b${box}d${digit}`

    cursor = i
    cells[i] = 'active'
    for (let j = 0; j < values.length; j++) {
      if (j === i || cells[j] !== 'done') continue
      const jRow = rowOf(j)
      const jCol = colOf(j)
      if (jRow === row || jCol === col || boxOf(jRow, jCol) === box) {
        cells[j] = 'peer'
      }
    }
    link = null
    checked++
    yield emit(
      OPTIMIZED_LINE.active,
      'compare',
      `Cell (${row + 1}, ${col + 1}) holds ${digit}.`,
      'Every peer lit here is a cell already placed that shares this one’s row, column or box — exactly what the three keys below are about to check.',
      { ...base(), row, col, digit },
    )

    const hitAt = seen.get(rowKey) ?? seen.get(colKey) ?? seen.get(boxKey)

    for (let j = 0; j < values.length; j++) {
      if (cells[j] === 'peer') cells[j] = 'done'
    }

    if (hitAt !== undefined) {
      cells[i] = 'conflict'
      cells[hitAt] = 'conflict'
      result = [hitAt, i]
      yield emit(
        OPTIMIZED_LINE.found,
        'return',
        `${digit} already sits at (${rowOf(hitAt) + 1}, ${colOf(hitAt) + 1}). Return false.`,
        `Caught after ${checked} cells, not all 81 — one of the three keys already existed, so no further checking is needed to know the board is invalid.`,
        { ...base(), row, col, digit, result: 'false' },
      )
      return
    }

    seen.set(rowKey, i)
    seen.set(colKey, i)
    seen.set(boxKey, i)
    cells[i] = 'done'
    yield emit(
      OPTIMIZED_LINE.store,
      'store',
      `New — remember ${digit} for its row, column and box.`,
      'Three entries from one cell. The map does not know or care that a row-key and a box-key came from the same digit in the same place.',
      { ...base(), row, col, digit },
    )
  }

  cursor = null
  // Every still-idle cell is an empty one that was never anyone's peer —
  // sweeping it to 'done' here is what keeps this frame from being
  // scene-identical to init on a sparse-to-empty board, where the loop above
  // may have produced no frames at all (F1).
  for (let k = 0; k < cells.length; k++) if (cells[k] === 'idle') cells[k] = 'done'
  yield emit(
    OPTIMIZED_LINE.exhausted,
    'return',
    'Every filled cell checked out. Return true.',
    `${checked} cells checked, ${seen.size} map entries, no collision anywhere.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Brute force — three passes, no shared memory
// ---------------------------------------------------------------------------

function rowGroup(r: number): number[] {
  const indices: number[] = []
  for (let c = 0; c < SIZE; c++) indices.push(r * SIZE + c)
  return indices
}

function colGroup(c: number): number[] {
  const indices: number[] = []
  for (let r = 0; r < SIZE; r++) indices.push(r * SIZE + c)
  return indices
}

function boxGroup(box: number): number[] {
  const boxRow = Math.floor(box / BOX) * BOX
  const boxCol = (box % BOX) * BOX
  const indices: number[] = []
  for (let k = 0; k < SIZE; k++) {
    indices.push((boxRow + Math.floor(k / BOX)) * SIZE + (boxCol + (k % BOX)))
  }
  return indices
}

/**
 * The same problem with nothing shared between groups: `seen` is declared
 * fresh inside each of the three loops in BRUTE_LISTING, and this generator
 * mirrors that exactly — a new Map per group, thrown away the moment the
 * group resolves. One beat per group would hide the "27 independent checks"
 * story; a group with fewer than 2 filled cells cannot possibly hold a
 * repeat, so it is skipped with no frame at all rather than a no-op one.
 */
export function* validSudokuBrute(values: number[]): Generator<GridFrame, void, undefined> {
  const cells: GridCellState[] = values.map(() => 'idle')
  let cursor: number | null = null
  let link: [number, number] | null = null
  let result: [number, number] | null = null
  let groupsChecked = 0

  const emit = createEmitter<GridScene>(() => ({
    rows: SIZE,
    cols: SIZE,
    values: [...values],
    cells: [...cells],
    cursor,
    link: link === null ? null : [link[0], link[1]],
    result: result === null ? null : [result[0], result[1]],
  }))

  const base = () => ({ groupsChecked })

  yield emit(
    BRUTE_LINE.init,
    'init',
    'Three independent passes: every row, then every column, then every box.',
    'No memory carries between them — each pass starts its own empty set and throws it away before the next one begins.',
    base(),
  )

  function* checkGroup(
    indices: number[],
    startLine: number,
    checkLine: number,
    label: string,
  ): Generator<GridFrame, boolean, undefined> {
    const filled = indices.filter((idx) => values[idx] !== 0)
    if (filled.length < 2) return false

    for (const idx of filled) cells[idx] = 'active'
    cursor = filled[filled.length - 1]
    link = null
    groupsChecked++
    yield emit(
      startLine,
      'compare',
      `Checking ${label}.`,
      'A fresh, empty set for this group only — nothing it learns will be remembered once the group is done.',
      { ...base(), label },
    )

    const seenAt = new Map<number, number>()
    for (const idx of filled) {
      const digit = values[idx]
      const dupAt = seenAt.get(digit)
      if (dupAt !== undefined) {
        for (const other of filled) if (cells[other] === 'active') cells[other] = 'idle'
        cells[idx] = 'conflict'
        cells[dupAt] = 'conflict'
        result = [dupAt, idx]
        yield emit(
          checkLine,
          'return',
          `${label}: ${digit} repeats. Return false.`,
          `${groupsChecked} groups checked before this one caught it — every group before it had to run to completion first, since nothing here rules anything out early.`,
          { ...base(), label, digit, result: 'false' },
        )
        return true
      }
      seenAt.set(digit, idx)
    }

    for (const idx of filled) cells[idx] = 'done'
    yield emit(
      checkLine,
      'store',
      `${label}: no repeat.`,
      'The set is discarded now. The next row, column or box starts from nothing, even if it shares cells with this one.',
      { ...base(), label },
    )
    return false
  }

  for (let r = 0; r < SIZE; r++) {
    const found = yield* checkGroup(rowGroup(r), BRUTE_LINE.rowStart, BRUTE_LINE.rowCheck, `row ${r + 1}`)
    if (found) return
  }
  for (let c = 0; c < SIZE; c++) {
    const found = yield* checkGroup(colGroup(c), BRUTE_LINE.colStart, BRUTE_LINE.colCheck, `column ${c + 1}`)
    if (found) return
  }
  for (let box = 0; box < SIZE; box++) {
    const found = yield* checkGroup(boxGroup(box), BRUTE_LINE.boxStart, BRUTE_LINE.boxCheck, `box ${box + 1}`)
    if (found) return
  }

  cursor = null
  // Same rationale as the optimized generator's own sweep: without it, a
  // board sparse enough that every group is skipped (fewer than two filled
  // cells each) would make this frame scene-identical to init (F1).
  for (let k = 0; k < cells.length; k++) if (cells[k] === 'idle') cells[k] = 'done'
  yield emit(
    BRUTE_LINE.exhausted,
    'return',
    'Every row, column and box checked out. Return true.',
    `${groupsChecked} groups checked across three full passes, none of them able to reuse another's work.`,
    { ...base(), result: 'true' },
  )
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const traceOptimized = (values: number[]): GridFrame[] => [...validSudokuOptimized(values)]

export const traceBrute = (values: number[]): GridFrame[] => [...validSudokuBrute(values)]

/** No `sorted` — a board has no order to sort by (add-a-problem.md §0A). */
const VALID_SUDOKU_APPROACHES = ['optimized', 'brute'] as const

export const traces: ProblemTraces<GridScene, (typeof VALID_SUDOKU_APPROACHES)[number]> = {
  example: "board = LeetCode's classic invalid example (9x9, partially filled)",
  approaches: VALID_SUDOKU_APPROACHES,
  listings: {
    optimized: OPTIMIZED_LISTING,
    brute: BRUTE_LISTING,
  },
  cases: TEST_CASES,
  build: {
    optimized: (input) => traceOptimized(input.nums),
    brute: (input) => traceBrute(input.nums),
  },
}
