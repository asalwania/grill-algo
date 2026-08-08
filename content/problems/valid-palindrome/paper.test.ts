import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import { CASES, COLUMNS, WALKTHROUGH, resultOf, runOnPaper, writeSheet } from './paper'
import cases from './cases.json'

const STROKES: PaperStroke[] = [...writeSheet()]
const kinds = (k: PaperStroke['kind']) => STROKES.filter((s) => s.kind === k)

const stringOf = (nums: number[]): string =>
  nums.map((code) => String.fromCharCode(code)).join('')

/**
 * The load-bearing test of the whole feature.
 *
 * `CASES[].expected` is hand-authored — deliberately, see lib/types.ts. That
 * makes it the one place in this codebase where a wrong answer could be
 * written down and shipped. This is what stops it.
 */
describe('authored expectations', () => {
  it.each(CASES)('$tag', (c) => {
    expect(resultOf(stringOf(c.nums))).toBe(c.expected)
  })
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same strings', () => {
    const authored = new Set(CASES.map((c) => stringOf(c.nums)))
    for (const shipped of cases) {
      expect(authored).toContain(stringOf(shipped.nums))
    }
  })

  it('adds the cases a scene cannot show — no alnum at all, single char, digit vs letter', () => {
    const shipped = new Set(cases.map((c) => stringOf(c.nums)))
    const extra = CASES.filter((c) => !shipped.has(stringOf(c.nums)))

    expect(extra.map((c) => stringOf(c.nums))).toEqual(
      expect.arrayContaining(['.,!?', 'a', '0P']),
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
  it('writes one row per real comparison, and stops at the first mismatch', () => {
    const rows = [...runOnPaper('abc')]

    // 'a' vs 'c' disagree on the very first (and only) comparison.
    expect(rows).toHaveLength(1)
    expect(rows.at(-1)).toMatchObject({ hit: true })
  })

  it('writes a row for every real pair when nothing disagrees', () => {
    // Cleaned, the sample is "amanaplanacanalpanama" — 21 letters, so 10
    // pairs get compared and the unpaired middle letter needs no row at all.
    const rows = [...runOnPaper('A man, a plan, a canal: Panama')]
    expect(rows).toHaveLength(10)
    expect(rows.every((r) => r.kind === 'row' && r.hit === false)).toBe(true)
  })

  it('writes no rows at all when the loop never runs', () => {
    expect([...runOnPaper('a')]).toHaveLength(0)
    expect([...runOnPaper('.,!?')]).toHaveLength(0)
  })

  /**
   * The trap named in paper.ts's COLUMNS doc: a row must only ever compare
   * characters that already survived the skip loops. A hand-run that
   * compared BEFORE skipping would show punctuation in these cells.
   */
  it('never shows a non-alphanumeric character in a row', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(stringOf(c.nums))) {
        if (row.kind !== 'row') continue
        const [, , leftCh, rightCh] = row.cells
        expect(/^'[a-z0-9]'$/i.test(leftCh)).toBe(true)
        expect(/^'[a-z0-9]'$/i.test(rightCh)).toBe(true)
      }
    }
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(stringOf(c.nums))) {
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
    expect(kinds('row')).toHaveLength([...runOnPaper(stringOf(WALKTHROUGH.nums))].length)
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
