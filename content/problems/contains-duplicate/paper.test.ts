import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import { CASES, COLUMNS, WALKTHROUGH, resultOf, runOnPaper, writeSheet } from './paper'
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
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same arrays', () => {
    const authored = new Set(CASES.map((c) => c.nums.join(',')))
    for (const shipped of cases) {
      expect(authored).toContain(shipped.nums.join(','))
    }
  })

  it('adds the cases a scene cannot show — empty, single, negative', () => {
    // The argument for this feature existing next to the canvas. If these ever
    // disappear, the paper view is just the 3D view with worse graphics.
    const shipped = new Set(cases.map((c) => c.nums.join(',')))
    const extra = CASES.filter((c) => !shipped.has(c.nums.join(',')))

    expect(extra.map((c) => c.nums)).toEqual(
      expect.arrayContaining([[], [7], [-3, 0, -3]]),
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
  it('writes one row per element examined, and stops at the first repeat', () => {
    const rows = [...runOnPaper([5, 5, 9, 2])]

    // Two of four elements examined: the answer was known at i = 1.
    expect(rows).toHaveLength(2)
    expect(rows.at(-1)).toMatchObject({ hit: true })
  })

  it('writes a row for every element when nothing repeats', () => {
    expect([...runOnPaper([5, 2, 8, 1])]).toHaveLength(4)
  })

  it('writes no rows at all for the empty array', () => {
    expect([...runOnPaper([])]).toHaveLength(0)
  })

  it('checks BEFORE it inserts — the current value is in `seen BEFORE` iff the row is the hit', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(c.nums)) {
        if (row.kind !== 'row') continue
        const [, value, before] = row.cells
        // The entire reason the column pair exists. A hand-run that got this
        // backwards would show the number it is currently looking at as
        // already remembered, and every later row would be nonsense.
        const present = before.includes(` ${value},`) || before.includes(` ${value} `)
        expect(present).toBe(row.hit)
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

  it('draws exactly one table, for the walkthrough case', () => {
    expect(kinds('grid')).toHaveLength(1)
    expect(kinds('row')).toHaveLength(WALKTHROUGH.nums.length)
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
    // The generator must never reach the browser bundle. That only holds if
    // every stroke survives serialization — a function or a Set here would
    // fail the build with an unhelpful message far from this file.
    expect(JSON.parse(JSON.stringify(STROKES))).toEqual(STROKES)
  })

  it('gives every stroke a unique id, so the reveal can key on it', () => {
    const ids = STROKES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
