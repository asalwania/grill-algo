import { describe, expect, it } from 'vitest'

import type { ApproachBlock, ApproachMove, PaperCase } from '../../../lib/types'
import { buildApproach, CHECKS, EXAMPLE } from './approach'
import { resultOf } from './paper'

const MOVES: ApproachMove[] = buildApproach()
const blocks = (m: ApproachMove) => m.blocks
const allBlocks: ApproachBlock[] = MOVES.flatMap(blocks)

/** `resultOf` takes a `PaperCase` — it only ever reads `.nums`, so a minimal
 *  stand-in is enough to re-run the real round trip from a check row. */
function asCase(nums: number[]): PaperCase {
  return { nums, expected: '', tag: '', reasoning: '' }
}

const packStrings = (strs: string[]): string => strs.map((s) => `${s.length}#${s}`).join('')

/**
 * The load-bearing test of the whole feature.
 *
 * Every worked answer in the walkthrough is hand-authored — deliberately, the
 * same exception the paper sheet makes (lib/types.ts). That makes this the one
 * place a wrong answer could be written into the derivation and shipped. This
 * runs the real round trip — the SAME `resultOf` the paper sheet drains, never
 * a second copy — and refuses to let the two disagree.
 */
describe('authored answers', () => {
  it.each([EXAMPLE, ...CHECKS])(
    'the algorithm confirms $strs → $result',
    ({ strs, result }) => {
      const nums = [...packStrings(strs)].map((ch) => ch.charCodeAt(0))
      expect(resultOf(asCase(nums))).toBe(result)
    },
  )

  it('agrees with an independent encode-then-decode of the same strings', () => {
    for (const c of [EXAMPLE, ...CHECKS]) {
      const encoded = packStrings(c.strs)
      const decoded: string[] = []
      let i = 0
      while (i < encoded.length) {
        let j = i
        while (encoded[j] !== '#') j++
        const length = Number(encoded.slice(i, j))
        i = j + 1
        decoded.push(encoded.slice(i, i + length))
        i += length
      }
      // The round trip must reproduce the original list exactly.
      expect(decoded).toEqual(c.strs)

      const nums = [...encoded].map((ch) => ch.charCodeAt(0))
      const expected = `"${encoded}" → [${decoded.map((s) => `"${s}"`).join(', ')}]`
      expect(resultOf(asCase(nums))).toBe(expected)
    }
  })

  it('renders the SAME answer it pins — display and verification cannot drift', () => {
    // Every check rendered in the reader must carry the authored `result`, so
    // the string the reader shows is the string the algorithm confirmed above.
    const rendered = allBlocks
      .filter((b): b is Extract<ApproachBlock, { kind: 'checks' }> => b.kind === 'checks')
      .flatMap((b) => b.rows)
    for (const row of rendered) {
      expect(resultOf(asCase(row.nums))).toBe(row.result)
    }
  })
})

describe('the walkthrough shape', () => {
  it('is the eight-move sequence, in order', () => {
    expect(MOVES.map((m) => m.id)).toEqual([
      'understand',
      'concrete',
      'brute',
      'waste',
      'pivot',
      'insight',
      'plan',
      'poke',
      'cost',
    ])
  })

  it('has exactly one climax, and it is the insight', () => {
    const climaxes = MOVES.filter((m) => m.climax)
    expect(climaxes).toHaveLength(1)
    expect(climaxes[0].id).toBe('insight')
    // The climax move carries an `insight` block — the two must not drift apart.
    expect(climaxes[0].blocks.some((b) => b.kind === 'insight')).toBe(true)
  })

  it('gives every move a non-empty spine label and a stable id', () => {
    for (const m of MOVES) expect(m.label.trim()).not.toBe('')
    const ids = MOVES.map((m) => m.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks only real lines of a code block', () => {
    for (const b of allBlocks) {
      if (b.kind !== 'code' || !b.mark) continue
      const lineCount = b.code.split('\n').length
      for (const line of b.mark) {
        expect(line).toBeGreaterThanOrEqual(1)
        expect(line).toBeLessThanOrEqual(lineCount)
      }
    }
  })

  it('leaves a check row no blank field', () => {
    const rows = allBlocks
      .filter((b): b is Extract<ApproachBlock, { kind: 'checks' }> => b.kind === 'checks')
      .flatMap((b) => b.rows)
    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.input.trim()).not.toBe('')
      expect(row.why.trim()).not.toBe('')
      expect(row.result.trim()).not.toBe('')
    }
  })

  it('names both approaches in the cost readout, exactly one of them the winner', () => {
    const cost = allBlocks.find(
      (b): b is Extract<ApproachBlock, { kind: 'cost' }> => b.kind === 'cost',
    )
    expect(cost).toBeDefined()
    expect(cost!.rows.filter((r) => r.win)).toHaveLength(1)
    expect(cost!.rows.length).toBeGreaterThanOrEqual(2)
  })

  it('is plain JSON, so the whole walkthrough can cross the RSC boundary', () => {
    // The generator must never reach the browser bundle. That only holds if
    // every block survives serialization — a function or a Map here would fail
    // the build with an unhelpful message far from this file.
    expect(JSON.parse(JSON.stringify(MOVES))).toEqual(MOVES)
  })
})
