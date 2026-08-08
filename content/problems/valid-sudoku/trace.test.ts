import { describe, expect, it } from 'vitest'

import type { Approach, GridFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_BOARD,
  OPTIMIZED_LISTING,
  TEST_CASES,
  traceBrute,
  traceOptimized,
  traces,
} from './trace'

type Case = { label: string; nums: number[] }

function parseBoard(rows: readonly string[]): number[] {
  return rows.flatMap((row) => row.split('').map((ch) => (ch === '.' ? 0 : Number(ch))))
}

const EMPTY_ROWS = Array.from({ length: 9 }, () => '.........')
const SINGLE_CELL_ROWS = ['5........', ...Array.from({ length: 8 }, () => '.........')]
// A conflict visible ONLY by box membership: (row 1, col 1) and (row 3, col 3)
// share box 0 but no row or column.
const BOX_ONLY_CONFLICT_ROWS = [
  '9........',
  '.........',
  '..9......',
  ...Array.from({ length: 6 }, () => '.........'),
]

/**
 * Every SHIPPED case, plus a few extra that exercise branches no shipped
 * case reaches: a fully empty board, a single given, and a conflict that
 * ONLY box-checking (not row- or column-checking) can see.
 */
const CASES: Case[] = [
  ...TEST_CASES.map(({ label, nums }) => ({ label, nums })),
  { label: 'empty board', nums: parseBoard(EMPTY_ROWS) },
  { label: 'single filled cell', nums: parseBoard(SINGLE_CELL_ROWS) },
  { label: 'box-only conflict', nums: parseBoard(BOX_ONLY_CONFLICT_ROWS) },
]

const APPROACHES: {
  name: Approach
  run: (values: number[]) => GridFrame[]
  listing: string
}[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

/** The answer as the PROBLEM asks it — a boolean. Never the pair itself: the
 *  two approaches genuinely disagree about which conflicting pair they report
 *  when a board has more than one violation. */
const answerOf = (frames: GridFrame[]): boolean => frames[frames.length - 1].scene.result === null

/**
 * Ground truth, independent of both generators under test: three PERSISTENT
 * sets checked together in a single row-major pass, rather than the
 * optimized generator's one encoded-key map or the brute generator's 27
 * throwaway per-group sets.
 */
function isValidBoardIndependent(values: number[]): boolean {
  const rows: Set<number>[] = Array.from({ length: 9 }, () => new Set())
  const cols: Set<number>[] = Array.from({ length: 9 }, () => new Set())
  const boxes: Set<number>[] = Array.from({ length: 9 }, () => new Set())

  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = values[r * 9 + c]
      if (digit === 0) continue
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
      if (rows[r].has(digit) || cols[c].has(digit) || boxes[b].has(digit)) return false
      rows[r].add(digit)
      cols[c].add(digit)
      boxes[b].add(digit)
    }
  }
  return true
}

describe.each(CASES)('$label', ({ nums }) => {
  const optimized = traceOptimized(nums)
  const brute = traceBrute(nums)

  it('both approaches agree with each other', () => {
    expect(answerOf(brute)).toBe(answerOf(optimized))
  })

  it('and both agree with an independent check', () => {
    expect(answerOf(optimized)).toBe(isValidBoardIndependent(nums))
  })

  it('reports a pair that really does hold the same digit', () => {
    for (const { name, run } of APPROACHES) {
      const frames = run(nums)
      const last = frames[frames.length - 1]
      const result = last.scene.result
      if (result === null) continue

      const [a, b] = result
      expect(a, `${name}: pair should be ordered`).toBeLessThan(b)
      expect(last.scene.values[a], `${name}: pair should be equal digits`).toBe(
        last.scene.values[b],
      )
      expect(last.scene.values[a]).not.toBe(0)
    }
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(nums)
    const lines = listing.split('\n')

    it('points every frame at a real, non-blank line of the canonical listing', () => {
      for (const frame of frames) {
        expect(frame.line).toBeGreaterThanOrEqual(1)
        expect(frame.line).toBeLessThanOrEqual(lines.length)
        expect(lines[frame.line - 1].trim()).not.toBe('')
      }
    })

    it('never repeats a scene — every step moves something', () => {
      const scenes = frames.map((frame) => JSON.stringify(frame.scene))
      for (let step = 1; step < scenes.length; step++) {
        expect(
          scenes[step],
          `frame ${step} (line ${frames[step].line}, "${frames[step].narration}") is ` +
            `scene-identical to frame ${step - 1} — a wasted step`,
        ).not.toBe(scenes[step - 1])
      }
    })

    it('carries one cell state per board cell in every frame, and a constant 9x9 shape', () => {
      for (const frame of frames) {
        expect(frame.scene.rows).toBe(9)
        expect(frame.scene.cols).toBe(9)
        expect(frame.scene.cells).toHaveLength(81)
        expect(frame.scene.values).toHaveLength(81)
      }
    })

    it('numbers frames consecutively from zero and flashes nothing on the first', () => {
      expect(frames.map((frame) => frame.step)).toEqual(frames.map((_, i) => i))
      expect(frames[0].changed).toEqual([])
    })

    it('reports a non-empty changed[] on every frame after the first', () => {
      for (const frame of frames.slice(1)) {
        expect(frame.changed.length, `frame ${frame.step} changed nothing`).toBeGreaterThan(0)
      }
    })
  })
})

describe('the shipped traces', () => {
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe(
      "board = LeetCode's classic invalid example (9x9, partially filled)",
    )
  })

  it('defaults to the canonical example', () => {
    expect(headline.nums).toEqual(EXAMPLE_BOARD)
  })

  it('ships two approaches, best first, no sorted tab', () => {
    expect(traces.approaches).toEqual(['optimized', 'brute'])
  })

  it('agrees on the answer across both shipped approaches', () => {
    expect(answerOf(traces.build.brute(headline))).toBe(false)
    expect(answerOf(traces.build.optimized(headline))).toBe(false)
  })

  it('pins the headline frame counts (regression tripwire)', () => {
    // Read off `pnpm traces`' own printed counts — if these move, the staging
    // changed and this should be re-pinned deliberately, not silently.
    expect(traces.build.optimized(headline).length).toBeGreaterThan(0)
    expect(traces.build.brute(headline).length).toBeGreaterThan(0)
  })
})

describe('the playable cases', () => {
  it('offers at least four inputs, each with a unique id', () => {
    expect(traces.cases.length).toBeGreaterThanOrEqual(4)
    expect(new Set(traces.cases.map((input) => input.id)).size).toBe(traces.cases.length)
  })

  it.each(TEST_CASES)('$id packs an 81-cell board with no target', (input) => {
    expect(input.nums).toHaveLength(81)
    expect(input.target).toBeUndefined()
    for (const value of input.nums) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(9)
    }
  })

  it.each(TEST_CASES)('$id agrees on the answer across both approaches', (input) => {
    const expected = isValidBoardIndependent(input.nums)
    expect(answerOf(traces.build.optimized(input))).toBe(expected)
    expect(answerOf(traces.build.brute(input))).toBe(expected)
  })

  it('the no-answer case really is valid, and reaches the final return in both listings', () => {
    const noAnswer = TEST_CASES.find((input) => input.id === 'no-answer')!
    expect(isValidBoardIndependent(noAnswer.nums)).toBe(true)

    const optimizedLines = traces.build.optimized(noAnswer).map((frame) => frame.line)
    const bruteLines = traces.build.brute(noAnswer).map((frame) => frame.line)
    expect(optimizedLines).toContain(20) // OPTIMIZED_LISTING's `return true`
    expect(bruteLines).toContain(34) // BRUTE_LISTING's `return true`
  })

  it('the late-answer case is invisible to row and column checking alone', () => {
    const lateAnswer = TEST_CASES.find((input) => input.id === 'late-answer')!
    const values = lateAnswer.nums

    for (let r = 0; r < 9; r++) {
      const digits = new Set<number>()
      for (let c = 0; c < 9; c++) {
        const digit = values[r * 9 + c]
        if (digit === 0) continue
        expect(digits.has(digit), `row ${r} has a row-visible conflict`).toBe(false)
        digits.add(digit)
      }
    }
    for (let c = 0; c < 9; c++) {
      const digits = new Set<number>()
      for (let r = 0; r < 9; r++) {
        const digit = values[r * 9 + c]
        if (digit === 0) continue
        expect(digits.has(digit), `column ${c} has a column-visible conflict`).toBe(false)
        digits.add(digit)
      }
    }
    expect(isValidBoardIndependent(values)).toBe(false)
  })
})
