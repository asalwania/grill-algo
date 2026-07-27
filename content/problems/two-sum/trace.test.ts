import { describe, expect, it } from 'vitest'

import type { Approach, TwoSumFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_NUMS,
  EXAMPLE_TARGET,
  OPTIMIZED_LISTING,
  traceBrute,
  traceOptimized,
  traces,
} from './trace'

type Case = { label: string; nums: number[]; target: number }

/**
 * The shipped example first, then a handful chosen to exercise the branches:
 * an early exit, a match on the very first comparison, duplicate keys, and a
 * target with no answer at all.
 */
const CASES: Case[] = [
  { label: 'shipped example', nums: EXAMPLE_NUMS, target: EXAMPLE_TARGET },
  { label: 'early exit', nums: EXAMPLE_NUMS, target: 9 },
  { label: 'answer at the end', nums: [3, 2, 4], target: 6 },
  { label: 'duplicate values', nums: [3, 3], target: 6 },
  { label: 'no answer', nums: [2, 7, 11], target: 100 },
]

const APPROACHES: { name: Approach; run: typeof traceOptimized; listing: string }[] = [
  { name: 'optimized', run: traceOptimized, listing: OPTIMIZED_LISTING },
  { name: 'brute', run: traceBrute, listing: BRUTE_LISTING },
]

const answerOf = (frames: TwoSumFrame[]) => frames[frames.length - 1].scene.result

describe.each(CASES)('$label — nums=[$nums] target=$target', ({ nums, target }) => {
  const optimized = traceOptimized(nums, target)
  const brute = traceBrute(nums, target)

  it('both approaches return the same answer', () => {
    expect(answerOf(brute)).toEqual(answerOf(optimized))
  })

  it('the answer is a real pair of indices that sums to the target', () => {
    const answer = answerOf(optimized)
    if (answer === null) {
      // Nothing may pair up — assert that exhaustively rather than trusting it.
      const pairs = nums.flatMap((a, i) => nums.slice(i + 1).map((b) => a + b))
      expect(pairs).not.toContain(target)
      return
    }

    const [i, j] = answer
    expect(i).toBeLessThan(j)
    expect(nums[i] + nums[j]).toBe(target)
  })

  describe.each(APPROACHES)('$name', ({ run, listing }) => {
    const frames = run(nums, target)
    const lines = listing.split('\n')

    it('points every frame at a real, non-blank line of the canonical listing', () => {
      for (const frame of frames) {
        expect(frame.line).toBeGreaterThanOrEqual(1)
        expect(frame.line).toBeLessThanOrEqual(lines.length)
        expect(lines[frame.line - 1].trim()).not.toBe('')
      }
    })

    it('never repeats a scene — every step moves something', () => {
      const scenes = frames.map((frame) => JSON.stringify(frame.scene))

      for (let step = 1; step < scenes.length; step++) {
        expect(
          scenes[step],
          `frame ${step} (line ${frames[step].line}, "${frames[step].narration}") is ` +
            `scene-identical to frame ${step - 1} — a wasted step`,
        ).not.toBe(scenes[step - 1])
      }
    })

    it('carries one tile state per value in every frame', () => {
      for (const frame of frames) {
        expect(frame.scene.tiles).toHaveLength(frame.scene.nums.length)
      }
    })

    it('numbers frames consecutively from zero and flashes nothing on the first', () => {
      expect(frames.map((frame) => frame.step)).toEqual(frames.map((_, i) => i))
      expect(frames[0].changed).toEqual([])
    })

    it('reports a non-empty changed[] on every frame after the first', () => {
      for (const frame of frames.slice(1)) {
        expect(frame.changed.length, `frame ${frame.step} changed nothing`).toBeGreaterThan(0)
      }
    })
  })

  it('brute force never builds a memory structure', () => {
    for (const frame of brute) {
      expect(frame.scene.slots).toEqual([])
      expect(frame.scene.probe).toBeNull()
    }
  })

  it('optimized stores every element it walks past without matching', () => {
    const last = optimized[optimized.length - 1]
    const stored = last.scene.slots.map((slot) => slot.key)
    expect(stored).toEqual([...new Set(stored)])
    expect(last.scene.slots.every((slot) => nums[slot.value] === slot.key)).toBe(true)
  })
})

describe('the shipped traces', () => {
  it('describes the example it was generated from', () => {
    expect(traces.example).toBe('nums = [2, 7, 11, 15, 3, 6], target = 21')
  })

  it('fills the hash-map wall and touches every tile (SP3 Finding 1)', () => {
    const frames = traces.build.optimized()
    const last = frames[frames.length - 1]

    expect(frames).toHaveLength(25)
    expect(last.scene.slots.length).toBeGreaterThanOrEqual(5)
    expect(last.scene.tiles).not.toContain('idle')
  })

  it('crisscrosses every pair in the brute trace', () => {
    const frames = traces.build.brute()
    const compares = frames.filter((frame) => frame.line === 4)

    expect(compares).toHaveLength(14)
    expect(frames[frames.length - 1].vars.comparisons).toBe(14)
  })

  it('agrees on the answer across both shipped approaches', () => {
    expect(answerOf(traces.build.brute())).toEqual([3, 5])
    expect(answerOf(traces.build.optimized())).toEqual([3, 5])
  })
})
