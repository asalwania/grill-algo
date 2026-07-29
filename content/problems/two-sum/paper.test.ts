import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  CASES,
  COLUMNS,
  WALKTHROUGH,
  WIDTHS,
  penInput,
  resultOf,
  runOnPaper,
  targetOf,
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
    expect(resultOf(c.nums, targetOf(c))).toBe(c.expected)
  })

  it('agrees with an independent brute-force pair search', () => {
    for (const c of CASES) {
      const target = targetOf(c)
      let expected = '[]'
      outer: for (let i = 0; i < c.nums.length; i++) {
        for (let j = i + 1; j < c.nums.length; j++) {
          if (c.nums[i] + c.nums[j] === target) {
            expected = `[${i}, ${j}]`
            break outer
          }
        }
      }
      expect(resultOf(c.nums, target)).toBe(expected)
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

  it('adds what the shipped four never reach — equal values, negatives, the minimum input', () => {
    // The argument for this feature existing next to the canvas. If these ever
    // disappear, the paper view is just the 3D view with worse graphics.
    const shipped = new Set(cases.map((c) => `${c.nums.join(',')}@${c.target}`))
    const extra = CASES.filter((c) => !shipped.has(`${c.nums.join(',')}@${c.target}`))

    expect(extra.map((c) => c.nums)).toEqual(
      expect.arrayContaining([[3, 3], [-1, -2, -3, -4, -5], [1, 2]]),
    )
  })

  it('gives every case a target, a category and an argument', () => {
    for (const c of CASES) {
      expect(() => targetOf(c)).not.toThrow()
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })
})

describe('runOnPaper', () => {
  /**
   * The reason the BEFORE and AFTER columns are separate, as an assertion.
   *
   * Store `nums[i]` before looking up `need` and this case returns `[0, 0]` —
   * 3 paired with itself. It is the most common wrong answer to this problem,
   * it is invisible in a table with one merged `seen` column, and it is what
   * the sheet's red aside warns about.
   */
  it('never lets one element pair with itself', () => {
    expect(resultOf([3, 2, 4], 6)).toBe('[1, 2]')
    expect(resultOf([5, 1, 2], 10)).toBe('[]')
  })

  it('stops at the first pair, leaving the rest of the array unread', () => {
    const rows = [...runOnPaper([2, 7, 11, 15], 9)]

    // Two of four elements examined: the answer was known at i = 1.
    expect(rows).toHaveLength(2)
    expect(rows.at(-1)).toMatchObject({ hit: true })
  })

  it('writes a row for every element when no pair exists', () => {
    expect([...runOnPaper([2, 7, 11], 100)]).toHaveLength(3)
  })

  it('writes no rows at all for the empty array', () => {
    expect([...runOnPaper([], 9)]).toHaveLength(0)
  })

  it('writes the need column as target − nums[i], every row', () => {
    for (const c of CASES) {
      const target = targetOf(c)
      for (const row of runOnPaper(c.nums, target)) {
        if (row.kind !== 'row') continue
        const [i, value, need] = row.cells
        expect(Number(need)).toBe(target - Number(value))
        expect(Number(need)).toBe(target - c.nums[Number(i)])
      }
    }
  })

  it('looks BEFORE it stores — nums[i] is absent from `seen BEFORE` unless it genuinely appeared earlier', () => {
    for (const c of CASES) {
      let i = 0
      for (const row of runOnPaper(c.nums, targetOf(c))) {
        if (row.kind !== 'row') continue
        // Parsed rather than substring-matched: `1` is a substring of `-1`.
        const keys = row.cells[3]
          .slice(1, -1)
          .split(',')
          .map((entry) => entry.trim())
          .filter((entry) => entry !== '')
          .map((entry) => Number(entry.split('→')[0]))
        // The entire reason the column pair exists. `seen` is keyed by VALUE,
        // so an earlier equal element legitimately puts this value in the map
        // — but the current one must never have put itself there.
        const earlier = c.nums.slice(0, i).includes(c.nums[i])
        expect(keys.includes(c.nums[i])).toBe(earlier)
        i++
      }
    }
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(c.nums, targetOf(c))) {
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

  it('names the target in every case line, since the array alone is not the input', () => {
    for (const c of CASES) {
      expect(penInput(c)).toContain(`t=${c.target}`)
    }
  })

  it('draws exactly one table, for the walkthrough case', () => {
    expect(kinds('grid')).toHaveLength(1)
    // Every element is read: the pair is the last one.
    expect(kinds('row')).toHaveLength(WALKTHROUGH.nums.length)
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
    // The generator must never reach the browser bundle. That only holds if
    // every stroke survives serialization — a function or a Map here would
    // fail the build with an unhelpful message far from this file.
    expect(JSON.parse(JSON.stringify(STROKES))).toEqual(STROKES)
  })

  it('gives every stroke a unique id, so the reveal can key on it', () => {
    const ids = STROKES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
