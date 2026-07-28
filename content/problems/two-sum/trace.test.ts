import { describe, expect, it } from 'vitest'

import type { Approach, TwoSumFrame } from '../../../lib/types'
import {
  BRUTE_LISTING,
  EXAMPLE_NUMS,
  EXAMPLE_TARGET,
  OPTIMIZED_LISTING,
  TEST_CASES,
  traceBrute,
  traceOptimized,
  traces,
} from './trace'

type Case = { label: string; nums: number[]; target: number }

/**
 * Every SHIPPED case (so the inputs the player can actually select are the
 * ones under test), plus a few extra that exercise branches no shipped case
 * reaches: a mid-array early exit and duplicate map keys.
 */
const CASES: Case[] = [
  ...TEST_CASES.map(({ label, nums, target }) => ({ label, nums, target })),
  { label: 'early exit', nums: EXAMPLE_NUMS, target: 9 },
  { label: 'duplicate values', nums: [3, 3], target: 6 },
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
  const headline = traces.cases[0]

  it('describes the example it was generated from', () => {
    expect(traces.example).toBe('nums = [2, 7, 11, 15, 3, 6], target = 21')
  })

  it('defaults to SP3 Finding 1s canonical example', () => {
    expect(headline.nums).toEqual(EXAMPLE_NUMS)
    expect(headline.target).toBe(EXAMPLE_TARGET)
  })

  it('fills the hash-map wall and touches every tile (SP3 Finding 1)', () => {
    const frames = traces.build.optimized(headline)
    const last = frames[frames.length - 1]

    expect(frames).toHaveLength(25)
    expect(last.scene.slots.length).toBeGreaterThanOrEqual(5)
    expect(last.scene.tiles).not.toContain('idle')
  })

  it('crisscrosses every pair in the brute trace', () => {
    const frames = traces.build.brute(headline)
    const compares = frames.filter((frame) => frame.line === 4)

    expect(compares).toHaveLength(14)
    expect(frames[frames.length - 1].vars.comparisons).toBe(14)
  })

  it('agrees on the answer across both shipped approaches', () => {
    expect(answerOf(traces.build.brute(headline))).toEqual([3, 5])
    expect(answerOf(traces.build.optimized(headline))).toEqual([3, 5])
  })
})

describe('the playable cases', () => {
  it('offers at least three inputs, each with a unique id', () => {
    expect(traces.cases.length).toBeGreaterThanOrEqual(3)
    expect(new Set(traces.cases.map((input) => input.id)).size).toBe(
      traces.cases.length,
    )
  })

  /**
   * The optimized generator pushes one slot per non-matching element, and both
   * FlatView and LabelLayer key slots by their map key — two slots sharing a
   * key would collide as React keys. A repeated value that HITS is fine (the
   * trace returns before the second push), which is why this asserts on the
   * generated slots rather than on `nums` having no duplicates.
   */
  it.each(TEST_CASES)('$id never stores the same map key twice', (input) => {
    const frames = traces.build.optimized(input)
    for (const frame of frames) {
      const keys = frame.scene.slots.map((slot) => slot.key)
      expect(new Set(keys).size).toBe(keys.length)
    }
  })

  it.each(TEST_CASES)('$id agrees on the answer across approaches', (input) => {
    expect(answerOf(traces.build.brute(input))).toEqual(
      answerOf(traces.build.optimized(input)),
    )
  })

  /**
   * Neither listing's final `return []` was ever an active line before a case
   * with no answer shipped — the headline example always returns early. This
   * pins that: at least one shipped case has to reach the exhausted branch, or
   * those lines (and their per-language lineMap entries) are dead.
   */
  it('reaches the exhausted return in both listings', () => {
    const optimizedLines = TEST_CASES.flatMap((input) =>
      traces.build.optimized(input).map((frame) => frame.line),
    )
    const bruteLines = TEST_CASES.flatMap((input) =>
      traces.build.brute(input).map((frame) => frame.line),
    )

    expect(optimizedLines).toContain(15)
    expect(bruteLines).toContain(10)
  })
})
