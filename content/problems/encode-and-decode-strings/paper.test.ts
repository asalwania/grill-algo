import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  CASES,
  COLUMNS,
  WALKTHROUGH,
  WIDTHS,
  encodeOnPaper,
  penInput,
  penList,
  resultOf,
  runOnPaper,
  stringsOf,
  writeSheet,
} from './paper'
import cases from './cases.json'

const STROKES: PaperStroke[] = [...writeSheet()]
const kinds = (k: PaperStroke['kind']) => STROKES.filter((s) => s.kind === k)

/**
 * A SECOND, independent codec: a fixed four-digit length in front of every
 * string. Nothing about it resembles paper.ts's variable-length prefix — no
 * marker, no scan, no digit counting — so agreeing with it is real evidence
 * rather than the code agreeing with itself.
 */
function fixedEncode(strs: string[]): string {
  return strs.map((s) => String(s.length).padStart(4, '0') + s).join('')
}

function fixedDecode(encoded: string): string[] {
  const out: string[] = []
  let i = 0
  while (i < encoded.length) {
    const length = Number(encoded.slice(i, i + 4))
    out.push(encoded.slice(i + 4, i + 4 + length))
    i += 4 + length
  }
  return out
}

/**
 * The load-bearing test of the whole feature.
 *
 * `CASES[].expected` is hand-authored — deliberately, see lib/types.ts. Here it
 * carries the ENCODED string as well as the decoded list, which makes it the
 * one place in this codebase where a wrong encoding could be written down and
 * shipped. This is what stops it, and it is the same service an interviewer
 * performs when they say "are you sure?".
 */
describe('authored expectations', () => {
  it.each(CASES)('$tag', (c) => {
    expect(resultOf(c)).toBe(c.expected)
  })

  it('agrees with an independent fixed-width codec on every decoded list', () => {
    for (const c of CASES) {
      const strs = stringsOf(c)
      const independent = fixedDecode(fixedEncode(strs))
      expect(independent).toEqual(strs)
      expect(resultOf(c)).toBe(
        `"${encodeOnPaper(strs)}" → ${penList(independent)}`,
      )
    }
  })

  it('never encodes two different lists to the same string', () => {
    const encodings = CASES.map((c) => encodeOnPaper(stringsOf(c)))
    expect(new Set(encodings).size).toBe(CASES.length)
  })
})

/** `nums` alone identifies a case here: the list IS the whole input, so
 *  neither side carries a scalar — unlike Two Sum's target or Top K's k, both
 *  of which this key would have to include. `no scalar on either side` below
 *  is what keeps that assumption honest. */
const idOf = (c: { nums: number[] }) => c.nums.join(',')

describe('the case list', () => {
  it('carries no scalar on either side — the list is the whole input', () => {
    for (const c of CASES) expect(c.target).toBeUndefined()
    for (const shipped of cases) expect('target' in shipped).toBe(false)
  })

  it('reuses the shipped inputs, so paper and screen dry-run the same lists', () => {
    const authored = new Set(CASES.map(idOf))
    for (const shipped of cases) {
      expect(authored).toContain(idOf(shipped))
    }
  })

  it('adds the three lists a scene cannot show at all', () => {
    // None of these has a single character, so the tile row is empty and there
    // is nothing to light. They are also the three a broken encoder collapses
    // into each other. If they ever disappear, the paper view is just the 3D
    // view with worse graphics.
    const shipped = new Set(cases.map(idOf))
    const extra = CASES.filter((c) => !shipped.has(idOf(c))).map(stringsOf)

    expect(extra).toEqual(expect.arrayContaining([[], [''], ['', '']]))
    for (const strs of extra) expect(strs.join('')).toBe('')
  })

  it('gives every case a category and an argument', () => {
    for (const c of CASES) {
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })

  it('packs the list with the problem’s own encoding, so stringsOf is its exact inverse', () => {
    for (const c of CASES) {
      const strs = stringsOf(c)
      expect([...encodeOnPaper(strs)].map((ch) => ch.charCodeAt(0))).toEqual(c.nums)
    }
  })
})

describe('runOnPaper', () => {
  it('writes no rows for the empty list — nothing was written, so nothing is read', () => {
    expect([...runOnPaper([])]).toHaveLength(0)
  })

  it('writes one row per string, including the zero-length ones', () => {
    expect([...runOnPaper(['neet', 'code', 'love', 'you'])]).toHaveLength(4)
    expect([...runOnPaper([''])]).toHaveLength(1)
    expect([...runOnPaper(['', ''])]).toHaveLength(2)
    expect([...runOnPaper(['a', '', 'bc'])]).toHaveLength(3)
  })

  it('advances i past the digits AND the marker, never by the length alone', () => {
    // The trap this table's BEFORE/AFTER split exists for. On the walkthrough,
    // advancing by len alone puts row 2 at i = 4 — inside "neet" — and every
    // row after it decodes from the middle of a word.
    for (const c of CASES) {
      const strs = stringsOf(c)
      const encoded = encodeOnPaper(strs)
      let i = 0
      for (const row of runOnPaper(strs)) {
        if (row.kind !== 'row') continue

        let j = i
        while (encoded[j] !== '#') j++
        const digits = encoded.slice(i, j)
        const length = Number(digits)
        const next = j + 1 + length

        expect(row.cells[0]).toBe(`${i}`)
        expect(row.cells[1]).toBe(`"${digits}"`)
        expect(row.cells[2]).toBe(`${length}`)
        expect(row.cells[4].endsWith(`· i → ${next}`)).toBe(true)
        expect(next).toBeGreaterThan(i + length)

        i = next
      }
      expect(i).toBe(encoded.length)
    }
  })

  it('reads every digit before the marker, not just the first', () => {
    const rows = [...runOnPaper(['hi', 'abcdefghijklm', 'x'])]
    const second = rows[1]
    if (second.kind !== 'row') throw new Error('expected a row')
    expect(second.cells[1]).toBe('"13"')
    expect(second.cells[2]).toBe('13')
    expect(second.cells[3]).toBe('"abcdefghijklm"')
  })

  it('never looks at a # that is inside the data', () => {
    const rows = [...runOnPaper(['we', 'said', '#5', 'yes#'])]
    const taken = rows.map((row) => (row.kind === 'row' ? row.cells[3] : ''))
    expect(taken).toEqual(['"we"', '"said"', '"#5"', '"yes#"'])
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(stringsOf(c))) {
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

  it('renders the empty list, [""] and ["", ""] as three different lines', () => {
    const written = CASES.map(penInput)
    expect(written).toEqual(expect.arrayContaining(['[]', '[""]', '["", ""]']))
  })

  it('draws exactly one table, for the walkthrough case', () => {
    expect(kinds('grid')).toHaveLength(1)
    expect(kinds('row')).toHaveLength(stringsOf(WALKTHROUGH).length)
  })

  it('states the encoding in the caption, since it earns no rows', () => {
    const grid = kinds('grid')[0]
    if (grid.kind !== 'grid') throw new Error('expected a grid')
    expect(grid.caption).toContain('encode writes len#str per string')
    expect(grid.caption).toContain(encodeOnPaper(stringsOf(WALKTHROUGH)))
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

  it('says out loud that no separator is safe', () => {
    const red = kinds('aside')
      .filter((s) => s.kind === 'aside' && s.pen === 'red')
      .map((s) => (s as { text: string }).text)
    expect(red.some((t) => t.includes('NO safe separator'))).toBe(true)
  })

  it('is plain JSON, so the whole sheet can cross the RSC boundary', () => {
    expect(JSON.parse(JSON.stringify(STROKES))).toEqual(STROKES)
  })

  it('gives every stroke a unique id, so the reveal can key on it', () => {
    const ids = STROKES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
