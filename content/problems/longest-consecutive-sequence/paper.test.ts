import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  BUILD_COLUMNS,
  BUILD_WIDTHS,
  CASES,
  SCAN_COLUMNS,
  SCAN_WIDTHS,
  WALKTHROUGH,
  penArray,
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
    expect(resultOf(c.nums)).toBe(c.expected)
  })

  it('agrees with an independent sort-and-scan solve', () => {
    for (const c of CASES) {
      const unique = [...new Set(c.nums)].sort((a, b) => a - b)
      let longest = unique.length === 0 ? 0 : 1
      let current = 1
      for (let i = 1; i < unique.length; i++) {
        current = unique[i] === unique[i - 1] + 1 ? current + 1 : 1
        longest = Math.max(longest, current)
      }
      expect(resultOf(c.nums)).toBe(String(longest))
    }
  })
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same arrays', () => {
    const authored = new Set(CASES.map((c) => c.nums.join(',')))
    for (const shipped of cases) {
      expect(authored).toContain(shipped.nums.join(','))
    }
  })

  it('adds what the shipped four never reach — empty, single, negatives', () => {
    // The argument for this feature existing next to the canvas. If these
    // ever disappear, the paper view is just the 3D view with worse graphics.
    const shipped = new Set(cases.map((c) => c.nums.join(',')))
    const extra = CASES.filter((c) => !shipped.has(c.nums.join(',')))

    expect(extra.map((c) => c.nums)).toEqual(
      expect.arrayContaining([[], [42], [-1, -2, -3, 0, 1]]),
    )
  })

  it('gives every case a category and an argument', () => {
    for (const c of CASES) {
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })
})

describe('runOnPaper', () => {
  const rowsOf = (nums: number[]) => [...runOnPaper(nums)].filter((s) => s.kind === 'row')

  it('writes one build row per element, always — a set is only final once the array is done', () => {
    for (const c of CASES) {
      const strokes = [...runOnPaper(c.nums)]
      const before = strokes.slice(0, strokes.findIndex((s) => s.kind === 'grid'))
      expect(before.filter((s) => s.kind === 'row')).toHaveLength(c.nums.length)
    }
  })

  it('marks a build row as a hit exactly when the value had already been seen', () => {
    const rows = [...runOnPaper([2, 20, 4, 10, 3, 4, 5])]
      .filter((s) => s.kind === 'row')
      .slice(0, 7)
    expect(rows.map((r) => (r.kind === 'row' ? r.hit : null))).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
      false,
    ])
  })

  it('checks value − 1 BEFORE deciding a value starts a run — the order the trap is about', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(c.nums)) {
        if (row.kind !== 'row' || row.cells.length !== SCAN_COLUMNS.length) continue
        const [, hasPredecessor, verdict] = row.cells
        // "start? = yes" must line up with "value − 1 in seen? = no", and
        // vice versa — a hand-run that got this backwards would try to walk
        // forward from a value already in the middle of a run, double-
        // counting the same run once per member it contains.
        expect(verdict.startsWith('yes')).toBe(hasPredecessor === 'no')
      }
    }
  })

  it('yields its own grid for the second table, so the ink can rule it', () => {
    const strokes = [...runOnPaper(WALKTHROUGH.nums)]
    const grids = strokes.filter((s) => s.kind === 'grid')
    expect(grids).toHaveLength(1)
    if (grids[0].kind !== 'grid') throw new Error('expected a grid')
    expect(grids[0].columns).toEqual([...SCAN_COLUMNS])
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of rowsOf(c.nums)) {
        if (row.kind !== 'row') continue
        expect([BUILD_COLUMNS.length, SCAN_COLUMNS.length]).toContain(row.cells.length)
        for (const cell of row.cells) expect(cell.trim()).not.toBe('')
      }
    }
  })

  it('writes no rows at all for the empty array', () => {
    expect(rowsOf([])).toHaveLength(0)
  })

  it('draws the empty array as a box rather than nothing at all', () => {
    expect(penArray([])).toBe('[ ]')
  })
})

describe('the sheet', () => {
  it('writes every case in the list', () => {
    expect(kinds('case')).toHaveLength(CASES.length)
  })

  /**
   * The one sheet in this codebase's array family besides Top K with two
   * tables. Both phases are real work and neither is prose — see paper.ts's
   * header for why.
   */
  it('draws two tables — the build pass and the scan pass', () => {
    const grids = kinds('grid')
    expect(grids).toHaveLength(2)
    if (grids[0].kind !== 'grid' || grids[1].kind !== 'grid') {
      throw new Error('expected two grids')
    }
    expect(grids[0].columns).toEqual([...BUILD_COLUMNS])
    expect(grids[1].columns).toEqual([...SCAN_COLUMNS])
  })

  it('rules both tables with one width per column', () => {
    for (const grid of kinds('grid')) {
      if (grid.kind !== 'grid') continue
      expect(grid.widths).toHaveLength(grid.columns.length)
    }
    expect(BUILD_WIDTHS).toHaveLength(BUILD_COLUMNS.length)
    expect(SCAN_WIDTHS).toHaveLength(SCAN_COLUMNS.length)
  })

  it('gives every row the column count of the grid above it', () => {
    let expected = 0
    for (const stroke of STROKES) {
      if (stroke.kind === 'grid') expected = stroke.columns.length
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
