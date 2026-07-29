import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  CASES,
  COLUMNS,
  WALKTHROUGH,
  WIDTHS,
  countsOf,
  penInput,
  resultOf,
  runOnPaper,
  split,
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
    expect(resultOf(c)).toBe(c.expected)
  })

  it('agrees with an independent sort-and-compare', () => {
    for (const c of CASES) {
      const { s, t } = split(c)
      const expected = String(
        [...s].sort().join('') === [...t].sort().join(''),
      )
      expect(resultOf(c)).toBe(expected)
    }
  })
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same strings', () => {
    const authored = new Set(CASES.map((c) => `${c.nums.join(',')}@${c.target}`))
    for (const shipped of cases) {
      expect(authored).toContain(`${shipped.nums.join(',')}@${shipped.target}`)
    }
  })

  it('adds what a scene cannot show, plus the one people get wrong', () => {
    // Two empty strings and a one-letter pair have no tiles worth lighting;
    // "same letter set, wrong counts" is the case that reads as an anagram
    // until you count. If these ever disappear, the paper view is just the 3D
    // view with worse graphics.
    const shipped = new Set(cases.map((c) => `${c.nums.join(',')}@${c.target}`))
    const extra = CASES.filter(
      (c) => !shipped.has(`${c.nums.join(',')}@${c.target}`),
    ).map((c) => {
      const { s, t } = split(c)
      return [s, t]
    })

    expect(extra).toEqual(
      expect.arrayContaining([
        ['', ''],
        ['a', 'a'],
        ['aacc', 'ccac'],
      ]),
    )
  })

  it('gives every case a category and an argument', () => {
    for (const c of CASES) {
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })

  it('packs s and t at the boundary target, so split is the exact inverse', () => {
    for (const c of CASES) {
      const { s, t } = split(c)
      expect(s.length).toBe(c.target)
      expect(s.length + t.length).toBe(c.nums.length)
    }
  })
})

describe('runOnPaper', () => {
  it('writes no rows when the lengths differ — settled before the loop', () => {
    expect([...runOnPaper('ab', 'a')]).toHaveLength(0)
    expect([...runOnPaper('ab', 'a')].length).toBe(0)
  })

  it('writes one row per letter of t when they match', () => {
    expect([...runOnPaper('anagram', 'nagaram')]).toHaveLength(7)
  })

  it('stops on the letter that fails, leaving the rest of t unread', () => {
    // 'c' is not in "rat" at all: settled on t[0].
    const rows = [...runOnPaper('rat', 'car')]
    expect(rows).toHaveLength(1)
    expect(rows.at(-1)).toMatchObject({ hit: true })

    // 'b' is in "aab" but already spent: settled on t[2], not t[0].
    const spent = [...runOnPaper('aab', 'abb')]
    expect(spent).toHaveLength(3)
    expect(spent.at(-1)).toMatchObject({ hit: true })
  })

  it('treats absent and exhausted as the same failure — count 0, either way', () => {
    for (const [s, t] of [
      ['rat', 'car'],
      ['aab', 'abb'],
    ]) {
      const last = [...runOnPaper(s, t)].at(-1)
      if (last?.kind !== 'row') throw new Error('expected a row')
      expect(last.cells[3]).toBe('0')
      expect(last.cells[4]).toBe('return false')
    }
  })

  it('reads the count BEFORE it decrements — a spent letter never lingers in `counts BEFORE`', () => {
    for (const c of CASES) {
      const { s, t } = split(c)
      const remaining = countsOf(s)
      let j = 0
      for (const row of runOnPaper(s, t)) {
        if (row.kind !== 'row') continue
        // The reason the column pair exists: `counts BEFORE` must be the tally
        // as it stood before this letter was spent, recomputed here from the
        // prefix of t rather than read back out of the generator.
        const expected = [...remaining]
          .filter(([, n]) => n > 0)
          .map(([ch, n]) => `${ch}${n}`)
        expect(row.cells[2]).toBe(
          expected.length === 0 ? '{ }' : `{ ${expected.join(', ')} }`,
        )
        const count = remaining.get(t[j]) ?? 0
        expect(row.cells[3]).toBe(`${count}`)
        if (count > 0) remaining.set(t[j], count - 1)
        j++
      }
    }
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      const { s, t } = split(c)
      for (const row of runOnPaper(s, t)) {
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

  it('names both strings in every case line', () => {
    for (const c of CASES) {
      expect(penInput(c)).toContain(' vs ')
    }
  })

  it('draws exactly one table, for the walkthrough case', () => {
    expect(kinds('grid')).toHaveLength(1)
    expect(kinds('row')).toHaveLength(split(WALKTHROUGH).t.length)
  })

  it('states the length guard and the tally in the caption, since neither is a row', () => {
    const grid = kinds('grid')[0]
    if (grid.kind !== 'grid') throw new Error('expected a grid')
    expect(grid.caption).toContain('lengths match')
    expect(grid.caption).toContain('after counting s:')
  })

  it('rules the table with one width per column', () => {
    for (const grid of kinds('grid')) {
      if (grid.kind !== 'grid') continue
      expect(grid.widths).toHaveLength(grid.columns.length)
    }
    expect(WIDTHS).toHaveLength(COLUMNS.length)
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
