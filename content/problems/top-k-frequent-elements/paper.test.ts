import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  CASES,
  COUNT_COLUMNS,
  COUNT_WIDTHS,
  TAKE_COLUMNS,
  TAKE_WIDTHS,
  WALKTHROUGH,
  kOf,
  penInput,
  penList,
  resultOf,
  runOnPaper,
  writeSheet,
} from './paper'
import cases from './cases.json'

const STROKES: PaperStroke[] = [...writeSheet()]
const kinds = (k: PaperStroke['kind']) => STROKES.filter((s) => s.kind === k)

/**
 * The load-bearing test of the whole feature.
 *
 * `CASES[].expected` is hand-authored — deliberately, see lib/types.ts. That
 * makes it the one place in this codebase where a wrong answer could be
 * written down and shipped. This is what stops it, and it is the same service
 * an interviewer performs when they say "are you sure?".
 */
describe('authored expectations', () => {
  it.each(CASES)('$tag', (c) => {
    expect(resultOf(c.nums, kOf(c))).toBe(c.expected)
  })

  /**
   * The order-independent check, and the one that actually proves the answer.
   *
   * The problem accepts any order, so an exact-string match against `expected`
   * would also pass if the algorithm returned the k LEAST frequent values in a
   * conveniently matching order. This counts independently and asserts the set
   * that came back really is a valid top-k: k values, and nothing left out is
   * more frequent than anything taken.
   */
  it('returns a set that is genuinely a top k, however it is ordered', () => {
    for (const c of CASES) {
      const k = kOf(c)
      const counts = new Map<number, number>()
      for (const value of c.nums) counts.set(value, (counts.get(value) ?? 0) + 1)

      const got = resultOf(c.nums, k)
        .replace(/[[\]]/g, '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part !== '')
        .map(Number)

      expect(got).toHaveLength(k)
      expect(new Set(got).size).toBe(k)

      const taken = new Set(got)
      const lowestTaken = Math.min(...got.map((v) => counts.get(v)!))
      for (const [value, freq] of counts) {
        if (taken.has(value)) continue
        expect(freq).toBeLessThanOrEqual(lowestTaken)
      }
    }
  })
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same arrays', () => {
    const authored = new Set(CASES.map((c) => `${c.nums.join(',')}@${c.target}`))
    for (const shipped of cases) {
      expect(authored).toContain(`${shipped.nums.join(',')}@${shipped.target}`)
    }
  })

  it('adds what the shipped four never reach — a single element, negatives, a tie', () => {
    // The argument for this feature existing next to the canvas. If these ever
    // disappear, the paper view is just the 3D view with worse graphics.
    const shipped = new Set(cases.map((c) => `${c.nums.join(',')}@${c.target}`))
    const extra = CASES.filter((c) => !shipped.has(`${c.nums.join(',')}@${c.target}`))

    expect(extra.map((c) => c.nums)).toEqual(
      expect.arrayContaining([[1], [-2, -2, 3], [1, 1, 2, 2]]),
    )
  })

  it('gives every case a k, a category and an argument', () => {
    for (const c of CASES) {
      expect(() => kOf(c)).not.toThrow()
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })

  it('obeys the problem constraint 1 <= k <= distinct values', () => {
    for (const c of CASES) {
      const k = kOf(c)
      expect(k).toBeGreaterThanOrEqual(1)
      expect(k).toBeLessThanOrEqual(new Set(c.nums).size)
    }
  })
})

describe('runOnPaper', () => {
  const rowsOf = (nums: number[], k: number) =>
    [...runOnPaper(nums, k)].filter((s) => s.kind === 'row')

  it('counts every element, always — a count is only final once the array is done', () => {
    for (const c of CASES) {
      const counting = [...runOnPaper(c.nums, kOf(c))]
      const before = counting.slice(0, counting.findIndex((s) => s.kind === 'grid'))
      expect(before.filter((s) => s.kind === 'row')).toHaveLength(c.nums.length)
    }
  })

  it('marks a counting row as a hit exactly when the value had been seen before', () => {
    const rows = [...runOnPaper([3, 1, 2, 3, 2, 3], 2)]
      .filter((s) => s.kind === 'row')
      .slice(0, 6)
    expect(rows.map((r) => (r.kind === 'row' ? r.hit : null))).toEqual([
      false,
      false,
      false,
      true,
      true,
      true,
    ])
  })

  it('increments by exactly one per element, never skipping a step', () => {
    for (const c of CASES) {
      const counting = [...runOnPaper(c.nums, kOf(c))]
      const grid = counting.findIndex((s) => s.kind === 'grid')
      for (const row of counting.slice(0, grid)) {
        if (row.kind !== 'row') continue
        expect(Number(row.cells[3])).toBe(Number(row.cells[2]) + 1)
      }
    }
  })

  /**
   * The second table's reason for existing, as an assertion.
   *
   * The take loop counts DOWN from `nums.length`, so it writes a row for every
   * frequency it visits — including the empty ones at the top. Collapsing them
   * would hide why the scan is linear.
   */
  it('walks the frequency axis downwards from n, empty buckets included', () => {
    const strokes = [...runOnPaper([3, 1, 2, 3, 2, 3], 2)]
    const grid = strokes.findIndex((s) => s.kind === 'grid')
    const take = strokes.slice(grid + 1).filter((s) => s.kind === 'row')

    expect(take.map((r) => (r.kind === 'row' ? r.cells[0] : null))).toEqual([
      '6',
      '5',
      '4',
      '3',
      '2',
    ])
    expect(take.at(-1)).toMatchObject({ cells: ['2', '[2]', '[3, 2]'] })
  })

  it('stops the moment out reaches k, leaving lower frequencies unvisited', () => {
    const strokes = [...runOnPaper([8, 5, 8, 5, 6, 5], 1)]
    const grid = strokes.findIndex((s) => s.kind === 'grid')
    const take = strokes.slice(grid + 1).filter((s) => s.kind === 'row')

    // freq 6, 5, 4 are empty; freq 3 holds 5 and fills out. 2 and 1 are never
    // looked at, even though 8 sits in bucket 2.
    expect(take).toHaveLength(4)
    expect(take.at(-1)).toMatchObject({ cells: ['3', '[5]', '[5]'] })
  })

  it('yields its own grid for the second table, so the ink can rule it', () => {
    const strokes = [...runOnPaper(WALKTHROUGH.nums, kOf(WALKTHROUGH))]
    const grids = strokes.filter((s) => s.kind === 'grid')
    expect(grids).toHaveLength(1)
    if (grids[0].kind !== 'grid') throw new Error('expected a grid')
    expect(grids[0].columns).toEqual([...TAKE_COLUMNS])
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of rowsOf(c.nums, kOf(c))) {
        if (row.kind !== 'row') continue
        expect([COUNT_COLUMNS.length, TAKE_COLUMNS.length]).toContain(row.cells.length)
        for (const cell of row.cells) expect(cell.trim()).not.toBe('')
      }
    }
  })

  it('draws the empty list as a box rather than nothing at all', () => {
    expect(penList([])).toBe('[ ]')
  })
})

describe('the sheet', () => {
  it('writes every case in the list', () => {
    expect(kinds('case')).toHaveLength(CASES.length)
  })

  it('names k in every case line, since the array alone is not the input', () => {
    for (const c of CASES) {
      expect(penInput(c)).toContain(`k=${c.target}`)
    }
  })

  /**
   * The one sheet in this codebase with two tables. Both phases are real work
   * and neither is prose — see paper.ts's header for why.
   */
  it('draws two tables — the counting pass and the bucket read-off', () => {
    const grids = kinds('grid')
    expect(grids).toHaveLength(2)
    if (grids[0].kind !== 'grid' || grids[1].kind !== 'grid') {
      throw new Error('expected two grids')
    }
    expect(grids[0].columns).toEqual([...COUNT_COLUMNS])
    expect(grids[1].columns).toEqual([...TAKE_COLUMNS])
  })

  it('rules both tables with one width per column', () => {
    for (const grid of kinds('grid')) {
      if (grid.kind !== 'grid') continue
      expect(grid.widths).toHaveLength(grid.columns.length)
    }
    expect(COUNT_WIDTHS).toHaveLength(COUNT_COLUMNS.length)
    expect(TAKE_WIDTHS).toHaveLength(TAKE_COLUMNS.length)
  })

  it('gives every row the column count of the grid above it', () => {
    let expected = 0
    for (const stroke of STROKES) {
      if (stroke.kind === 'grid') expected = stroke.columns.length
      // The shared ink rules a row with the most recent grid's tracks, so a
      // row with the wrong cell count would silently spill out of the table.
      if (stroke.kind === 'row') expect(stroke.cells).toHaveLength(expected)
    }
  })

  it('never writes a row before the grid it belongs to', () => {
    const grid = STROKES.findIndex((s) => s.kind === 'grid')
    const firstRow = STROKES.findIndex((s) => s.kind === 'row')
    expect(grid).toBeGreaterThan(-1)
    expect(firstRow).toBeGreaterThan(grid)
  })

  it('reaches a verdict, and it passes', () => {
    const verdicts = kinds('verdict')
    expect(verdicts).toHaveLength(1)
    expect(verdicts[0]).toMatchObject({ ok: true })
  })

  it('says out loud that the order is free, since a tie has several right answers', () => {
    const asides = kinds('aside').map((s) => (s as { text: string }).text)
    expect(asides.some((t) => t.includes('ANY order'))).toBe(true)
  })

  it('gives every untabled case its one-line argument', () => {
    const asides = kinds('aside').map((s) => (s as { text: string }).text)
    for (const c of CASES.slice(1)) {
      expect(asides.some((t) => t.includes(c.reasoning))).toBe(true)
    }
  })

  it('is plain JSON, so the whole sheet can cross the RSC boundary', () => {
    expect(JSON.parse(JSON.stringify(STROKES))).toEqual(STROKES)
  })

  it('gives every stroke a unique id, so the reveal can key on it', () => {
    const ids = STROKES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
