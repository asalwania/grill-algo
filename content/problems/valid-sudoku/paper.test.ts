import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import { CASES, COLUMNS, WALKTHROUGH, resultOf, runOnPaper, writeSheet } from './paper'
import cases from './cases.json'

const STROKES: PaperStroke[] = [...writeSheet()]
const kinds = (k: PaperStroke['kind']) => STROKES.filter((s) => s.kind === k)

/**
 * The load-bearing test of the whole feature.
 *
 * `CASES[].expected` is hand-authored — deliberately, see lib/types.ts. This
 * is what stops a wrong answer being written down and shipped.
 */
describe('authored expectations', () => {
  it.each(CASES)('$tag', (c) => {
    expect(resultOf(c.nums)).toBe(c.expected)
  })
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same boards', () => {
    const authored = new Set(CASES.map((c) => c.nums.join(',')))
    for (const shipped of cases) {
      expect(authored).toContain(shipped.nums.join(','))
    }
  })

  it('adds the cases a scene cannot show — empty, single given, a minimal box-only conflict', () => {
    const shipped = new Set(cases.map((c) => c.nums.join(',')))
    const extra = CASES.filter((c) => !shipped.has(c.nums.join(',')))

    expect(extra).toHaveLength(3)
    expect(extra.map((c) => c.tag)).toEqual([
      'empty — nothing to check',
      'single given — nothing to collide with',
      'box-only conflict, minimal',
    ])
    // The argument for this feature existing next to the canvas: a board
    // this sparse has nothing for a 3D scene to usefully animate.
    for (const c of extra) {
      expect(c.nums.filter((v) => v !== 0).length).toBeLessThanOrEqual(2)
    }
  })

  it('gives every case a category and an argument', () => {
    for (const c of CASES) {
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })
})

describe('runOnPaper', () => {
  it('writes one row per FILLED cell examined, and stops at the first conflict', () => {
    // First-pair board: row 1 holds two 5s at (1,1) and (1,2) — both get a
    // row (the first stores, the second conflicts), everything else is empty
    // and never enters the loop body.
    const firstPair = CASES.find((c) => c.tag === 'earliest possible conflict')!
    const rows = [...runOnPaper(firstPair.nums)]
    expect(rows).toHaveLength(2)
    expect(rows.at(-1)).toMatchObject({ hit: true })
  })

  it('writes a row for every filled cell when nothing conflicts', () => {
    const single = CASES.find((c) => c.tag === 'single given — nothing to collide with')!
    expect([...runOnPaper(single.nums)]).toHaveLength(1)
  })

  it('writes no rows at all for the empty board', () => {
    const empty = CASES.find((c) => c.tag === 'empty — nothing to check')!
    expect([...runOnPaper(empty.nums)]).toHaveLength(0)
  })

  it('checks all three keys BEFORE it inserts — a ✓ appears in "before" iff the row is the hit', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(c.nums)) {
        if (row.kind !== 'row') continue
        const before = row.cells[2]
        // The entire reason the column pair exists: a hand-run that checked
        // AFTER inserting would show every cell as already covered by its
        // own entry, and every "before" flag would misleadingly read ✓.
        expect(before.includes('✓')).toBe(row.hit)
      }
    }
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(c.nums)) {
        if (row.kind !== 'row') continue
        expect(row.cells).toHaveLength(COLUMNS.length)
        for (const cell of row.cells) expect(cell.trim()).not.toBe('')
      }
    }
  })
})

describe('the sheet', () => {
  it('writes every case in the list', () => {
    expect(kinds('case')).toHaveLength(CASES.length)
  })

  it('draws exactly one table, with one row per filled cell the walkthrough actually reaches', () => {
    expect(kinds('grid')).toHaveLength(1)
    expect(kinds('row')).toHaveLength([...runOnPaper(WALKTHROUGH.nums)].length)
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
