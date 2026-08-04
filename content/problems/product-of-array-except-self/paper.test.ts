import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  CASES,
  PREFIX_COLUMNS,
  PREFIX_WIDTHS,
  SUFFIX_COLUMNS,
  SUFFIX_WIDTHS,
  WALKTHROUGH,
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
 * Ground truth, by a method that shares nothing with the two-pass generator: a
 * plain nested loop. Obviously correct, quadratic, and here only to disagree.
 */
function nested(nums: number[]): number[] {
  return nums.map((_, i) =>
    nums.reduce((product, value, j) => (j === i ? product : product * value), 1),
  )
}

/**
 * The load-bearing test of the whole feature.
 *
 * `CASES[].expected` is hand-authored — deliberately, see lib/types.ts. That
 * makes it the one place in this codebase where a wrong answer could be written
 * down and shipped. This is what stops it, and it is the same service an
 * interviewer performs when they say "are you sure?".
 */
describe('authored expectations', () => {
  it.each(CASES)('$tag', (c) => {
    expect(resultOf(c)).toBe(c.expected)
  })

  it('agrees with an independent nested-loop solve on every case', () => {
    for (const c of CASES) {
      expect(resultOf(c)).toBe(penList(nested(c.nums)))
    }
  })
})

/** `nums` alone identifies a case: the array is the whole input, so neither
 *  side carries a scalar. `no scalar on either side` keeps that honest. */
const idOf = (c: { nums: number[] }) => c.nums.join(',')

describe('the case list', () => {
  it('carries no scalar on either side — the array is the whole input', () => {
    for (const c of CASES) expect(c.target).toBeUndefined()
    for (const shipped of cases) expect('target' in shipped).toBe(false)
  })

  it('reuses the shipped inputs, so paper and screen dry-run the same arrays', () => {
    const authored = new Set(CASES.map(idOf))
    for (const shipped of cases) {
      expect(authored).toContain(idOf(shipped))
    }
  })

  it('adds the three inputs the shipped four never reach — empty, single, pair', () => {
    // The argument for this feature existing next to the canvas: the empty
    // array and the single element are below the n >= 2 constraint and have no
    // interesting scene, and they are where an empty-product or loop-bounds
    // mistake shows. If they ever disappear, the paper view is just the 3D view
    // with worse graphics.
    const shipped = new Set(cases.map(idOf))
    const extra = CASES.filter((c) => !shipped.has(idOf(c))).map((c) => c.nums)
    expect(extra).toEqual(expect.arrayContaining([[], [7], [3, 5]]))
  })

  it('gives every case a category and an argument', () => {
    for (const c of CASES) {
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })
})

describe('runOnPaper', () => {
  const prefixRows = (nums: number[]) => {
    const strokes = [...runOnPaper(nums)]
    const grid = strokes.findIndex((s) => s.kind === 'grid')
    return strokes.slice(0, grid).filter((s) => s.kind === 'row')
  }
  const suffixRows = (nums: number[]) => {
    const strokes = [...runOnPaper(nums)]
    const grid = strokes.findIndex((s) => s.kind === 'grid')
    return strokes.slice(grid + 1).filter((s) => s.kind === 'row')
  }

  it('writes no rows for the empty array — both loops are skipped', () => {
    expect(prefixRows([])).toHaveLength(0)
    expect(suffixRows([])).toHaveLength(0)
  })

  it('writes one row per position in each pass', () => {
    for (const c of CASES) {
      expect(prefixRows(c.nums)).toHaveLength(c.nums.length)
      expect(suffixRows(c.nums)).toHaveLength(c.nums.length)
    }
  })

  /**
   * The trap the BEFORE/AFTER columns exist for, asserted directly: the value
   * STORED into answer[i] is the running product BEFORE nums[i] is folded in.
   * Fold first and answer[i] would multiply by itself.
   */
  it('stores the running product before folding nums[i] in, in both passes', () => {
    for (const c of CASES) {
      // Prefix pass: prefix AFTER = prefix BEFORE × nums[i]; the cell stored is
      // BEFORE, which is what the answer-so-far column's last entry must be.
      for (const row of prefixRows(c.nums)) {
        if (row.kind !== 'row') continue
        const i = Number(row.cells[0])
        const before = Number(row.cells[2])
        const after = Number(row.cells[3])
        expect(after).toBe(before * c.nums[i])
        const soFar = JSON.parse(row.cells[4]) as number[]
        expect(soFar[i]).toBe(before)
      }
      // Suffix pass: answer[i] AFTER = answer[i] BEFORE × suffix; suffix AFTER =
      // suffix × nums[i].
      for (const row of suffixRows(c.nums)) {
        if (row.kind !== 'row') continue
        const i = Number(row.cells[0])
        const answerBefore = Number(row.cells[1])
        const suffix = Number(row.cells[2])
        const combined = Number(row.cells[3])
        const suffixAfter = Number(row.cells[4])
        expect(combined).toBe(answerBefore * suffix)
        expect(suffixAfter).toBe(suffix * c.nums[i])
      }
    }
  })

  it('marks a row red exactly at a zero — the value that breaks division', () => {
    const rows = [...runOnPaper([4, 0, 2, 3])].filter((s) => s.kind === 'row')
    // Prefix rows i = 0..3 then suffix rows i = 3..0; the zero sits at index 1.
    const reds = rows.filter((r) => r.kind === 'row' && r.hit)
    expect(reds).toHaveLength(2) // once in each pass
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of [...runOnPaper(c.nums)]) {
        if (row.kind !== 'row') continue
        expect([PREFIX_COLUMNS.length, SUFFIX_COLUMNS.length]).toContain(
          row.cells.length,
        )
        for (const cell of row.cells) expect(cell.trim()).not.toBe('')
      }
    }
  })

  it('yields its own grid for the second table, so the ink can rule it', () => {
    const grids = [...runOnPaper(WALKTHROUGH.nums)].filter((s) => s.kind === 'grid')
    expect(grids).toHaveLength(1)
    if (grids[0].kind !== 'grid') throw new Error('expected a grid')
    expect(grids[0].columns).toEqual([...SUFFIX_COLUMNS])
  })
})

describe('the sheet', () => {
  it('writes every case in the list', () => {
    expect(kinds('case')).toHaveLength(CASES.length)
  })

  it('renders the empty array, [7] and [3, 5] as three different lines', () => {
    const written = CASES.map(penInput)
    expect(written).toEqual(
      expect.arrayContaining(['nums = []', 'nums = [7]', 'nums = [3, 5]']),
    )
  })

  /**
   * The two tables — the prefix pass and the suffix pass. Both are real work
   * and neither is prose — see paper.ts's header.
   */
  it('draws two tables, one per pass', () => {
    const grids = kinds('grid')
    expect(grids).toHaveLength(2)
    if (grids[0].kind !== 'grid' || grids[1].kind !== 'grid') {
      throw new Error('expected two grids')
    }
    expect(grids[0].columns).toEqual([...PREFIX_COLUMNS])
    expect(grids[1].columns).toEqual([...SUFFIX_COLUMNS])
  })

  it('rules both tables with one width per column', () => {
    for (const grid of kinds('grid')) {
      if (grid.kind !== 'grid') continue
      expect(grid.widths).toHaveLength(grid.columns.length)
    }
    expect(PREFIX_WIDTHS).toHaveLength(PREFIX_COLUMNS.length)
    expect(SUFFIX_WIDTHS).toHaveLength(SUFFIX_COLUMNS.length)
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

  it('says out loud that division is forbidden and why', () => {
    const red = kinds('aside')
      .filter((s) => s.kind === 'aside' && s.pen === 'red')
      .map((s) => (s as { text: string }).text)
    expect(red.some((t) => t.includes('÷'))).toBe(true)
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
