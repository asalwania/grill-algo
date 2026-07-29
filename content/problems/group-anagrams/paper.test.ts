import { describe, expect, it } from 'vitest'

import type { PaperStroke } from '../../../lib/types'
import {
  CASES,
  COLUMNS,
  WALKTHROUGH,
  WIDTHS,
  keyOf,
  penWords,
  resultOf,
  runOnPaper,
  wordsOf,
  writeSheet,
} from './paper'
import cases from './cases.json'

const STROKES: PaperStroke[] = [...writeSheet()]
const kinds = (k: PaperStroke['kind']) => STROKES.filter((s) => s.kind === k)

/** Two words are anagrams exactly when their sorted letters agree — the
 *  independent notion of "same group" the trace tests use too. */
const signature = (word: string) => [...word].sort().join('')

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
    expect(resultOf(wordsOf(c))).toBe(c.expected)
  })

  it('partitions by signature, checked against an independent grouping', () => {
    for (const c of CASES) {
      const words = wordsOf(c)
      const bySignature = new Map<string, string[]>()
      for (const word of words) {
        const key = signature(word)
        bySignature.set(key, [...(bySignature.get(key) ?? []), word])
      }
      const expected =
        bySignature.size === 0
          ? '[]'
          : `[${[...bySignature.values()].map(penWords).join(', ')}]`
      expect(resultOf(words)).toBe(expected)
    }
  })
})

describe('the key', () => {
  it('agrees with sorted letters — same key iff same signature', () => {
    const words = ['eat', 'tea', 'ate', 'tan', 'nat', 'bat', 'cab', 'a', 'aa', '']
    for (const a of words) {
      for (const b of words) {
        expect(keyOf(a) === keyOf(b)).toBe(signature(a) === signature(b))
      }
    }
  })

  it('gives the empty word a visible key rather than a blank cell', () => {
    expect(keyOf('').trim()).not.toBe('')
    expect(keyOf('')).not.toBe(keyOf('a'))
  })
})

describe('the case list', () => {
  it('reuses the shipped inputs, so paper and screen dry-run the same words', () => {
    const authored = new Set(CASES.map((c) => c.nums.join(',')))
    for (const shipped of cases) {
      expect(authored).toContain(shipped.nums.join(','))
    }
  })

  it('adds what the shipped four never reach — no words, the empty word, identical words', () => {
    // The argument for this feature existing next to the canvas: an empty list
    // has nothing to light up at all. If these ever disappear, the paper view
    // is just the 3D view with worse graphics.
    const shipped = new Set(cases.map((c) => c.nums.join(',')))
    const extra = CASES.filter((c) => !shipped.has(c.nums.join(','))).map(wordsOf)

    expect(extra).toEqual(expect.arrayContaining([[], [''], ['a', 'a']]))
  })

  it('gives every case a category and an argument', () => {
    for (const c of CASES) {
      expect(c.tag.trim()).not.toBe('')
      expect(c.reasoning.trim()).not.toBe('')
    }
  })

  it('packs and unpacks every word losslessly', () => {
    for (const c of CASES) {
      expect(wordsOf(c)).toHaveLength(c.nums.length)
      for (const word of wordsOf(c)) expect(word).toMatch(/^[a-z]*$/)
    }
  })
})

describe('runOnPaper', () => {
  it('writes one row per word, always — a group can still grow on the last one', () => {
    for (const c of CASES) {
      const words = wordsOf(c)
      const rows = [...runOnPaper(words)].filter((s) => s.kind === 'row')
      expect(rows).toHaveLength(words.length)
    }
  })

  it('marks a row as a hit exactly when the word joined an existing group', () => {
    const words = wordsOf(WALKTHROUGH)
    const rows = [...runOnPaper(words)]
    // eat, tea, tan, ate, nat, bat — tea, ate and nat join; the rest open.
    expect(rows.map((r) => (r.kind === 'row' ? r.hit : null))).toEqual([
      false,
      true,
      false,
      true,
      true,
      false,
    ])
  })

  it('writes no rows at all for the empty list', () => {
    expect([...runOnPaper([])]).toHaveLength(0)
  })

  it("shows only the word's OWN group, growing by one on each of its rows", () => {
    for (const c of CASES) {
      const words = wordsOf(c)
      const sizes = new Map<string, number>()
      let i = 0
      for (const row of runOnPaper(words)) {
        if (row.kind !== 'row') continue
        const key = keyOf(words[i])
        const size = (sizes.get(key) ?? 0) + 1
        sizes.set(key, size)
        // The column is this word's group, not the whole partition — a table
        // that repeats the partition on every row is unreadable by word four.
        expect(row.cells[4].split('", "')).toHaveLength(size)
        expect(row.cells[4]).toContain(`"${words[i]}"`)
        i++
      }
    }
  })

  it('fills every cell — a blank on paper is a step someone will skip', () => {
    for (const c of CASES) {
      for (const row of runOnPaper(wordsOf(c))) {
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
    expect(kinds('row')).toHaveLength(wordsOf(WALKTHROUGH).length)
  })

  it('states the expected partition in the caption, since the verdict only has room for what it got', () => {
    const grid = kinds('grid')[0]
    if (grid.kind !== 'grid') throw new Error('expected a grid')
    expect(grid.caption).toContain(WALKTHROUGH.expected)
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
