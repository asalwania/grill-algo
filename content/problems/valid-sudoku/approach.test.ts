import { describe, expect, it } from 'vitest'

import type { ApproachBlock, ApproachMove } from '../../../lib/types'
import { buildApproach, CHECKS, EXAMPLE } from './approach'
import { resultOf } from './paper'

const MOVES: ApproachMove[] = buildApproach()
const blocks = (m: ApproachMove) => m.blocks
const allBlocks: ApproachBlock[] = MOVES.flatMap(blocks)

/** Independent of both `./trace`'s generators and `./paper`'s `runOnPaper`:
 *  three PERSISTENT sets checked together, rather than one shared map or
 *  three throwaway-per-group sets. */
function isValidBoardIndependent(values: number[]): boolean {
  const rows: Set<number>[] = Array.from({ length: 9 }, () => new Set())
  const cols: Set<number>[] = Array.from({ length: 9 }, () => new Set())
  const boxes: Set<number>[] = Array.from({ length: 9 }, () => new Set())
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const digit = values[r * 9 + c]
      if (digit === 0) continue
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3)
      if (rows[r].has(digit) || cols[c].has(digit) || boxes[b].has(digit)) return false
      rows[r].add(digit)
      cols[c].add(digit)
      boxes[b].add(digit)
    }
  }
  return true
}

/**
 * The load-bearing test of the whole feature.
 *
 * Every worked answer in the walkthrough is hand-authored — deliberately, the
 * same exception the paper sheet makes (lib/types.ts). This runs the real
 * algorithm — the SAME `resultOf` the paper sheet drains, never a second
 * copy — and refuses to let the two disagree.
 */
describe('authored answers', () => {
  it.each([EXAMPLE, ...CHECKS])('the algorithm confirms → $result', ({ nums, result }) => {
    expect(resultOf(nums)).toBe(result)
  })

  it('agrees with an independent row/column/box check', () => {
    for (const c of [EXAMPLE, ...CHECKS]) {
      expect(resultOf(c.nums)).toBe(String(isValidBoardIndependent(c.nums)))
    }
  })

  it('renders the SAME answer it pins — display and verification cannot drift', () => {
    const rendered = allBlocks
      .filter((b): b is Extract<ApproachBlock, { kind: 'checks' }> => b.kind === 'checks')
      .flatMap((b) => b.rows)
    for (const row of rendered) {
      expect(resultOf(row.nums)).toBe(row.result)
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
    expect(JSON.parse(JSON.stringify(MOVES))).toEqual(MOVES)
  })
})
